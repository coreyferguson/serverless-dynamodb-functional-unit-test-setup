
const AWS = require('aws-sdk');
const fs = require('fs');
const localDynamo = require('local-dynamo');
const yaml = require('js-yaml');

class LocalDynamoFacade {

  constructor(serverlessConfig) {
    this._serverlessConfig = serverlessConfig;
    if (!serverlessConfig) throw new Error(
      'MUST pass serverlessConfig as first argument to constructor.');
  }

  start() {
    this._oldRegion = AWS.config.region;
    this._oldEndpoint = AWS.config.endpoint;
    this._oldCredentials = AWS.config.credentials;
    AWS.config.update({
      region: 'us-west-2',
      endpoint: 'http://localhost:8000',
      credentials: {
        accessKeyId: 'asdf',
        secretAccessKey: 'asdf'
      }
    });
    // start an in-memory dynamodb database
    this._localDynamoProcess = localDynamo.launch({
      port: 8000,
      dir: null
    });
    this._dynamodb = new AWS.DynamoDB();
    return this._dynamodb;
  }

  stop() {
    this._localDynamoProcess.kill();
    AWS.config.region = this._oldRegion;
    AWS.config.endpoint = this._oldEndpoint;
    AWS.config.credentials = this._oldCredentials;
  }

  createTable(resourceName, tableName) {
    return this._loadResource(resourceName).then(resource => {
      return this._createTable(resource, tableName);
    });
  }

  _createTable(resource, tableName) {
    return new Promise((resolve, reject) => {
      let GlobalSecondaryIndexes;
      if (resource.Properties.GlobalSecondaryIndexes) {
        GlobalSecondaryIndexes = resource.Properties.GlobalSecondaryIndexes.map(GlobalSecondaryIndex => {
          return {
            ...GlobalSecondaryIndex,
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          }
        })
      }
      this._dynamodb.createTable({
        TableName: tableName,
        KeySchema: resource.Properties.KeySchema,
        AttributeDefinitions: resource.Properties.AttributeDefinitions,
        ProvisionedThroughput: resource.Properties.ProvisionedThroughput || {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        },
        GlobalSecondaryIndexes,
      }, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  _loadResource(resource) {
    return new Promise((resolve, reject) => {
      fs.readFile(this._serverlessConfig, 'utf8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    }).then(data => {
      return yaml.safeLoad(data);
    }).then(data => {
      return data.resources.Resources[resource];
    });
  }

}

module.exports = LocalDynamoFacade;
