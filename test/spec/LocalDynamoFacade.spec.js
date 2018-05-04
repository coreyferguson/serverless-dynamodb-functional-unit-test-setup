
const LocalDynamoFacade = require('../../src/LocalDynamoFacade');
const path = require('path');
const { expect } = require('chai');

describe('dynamodb local integration tests', () => {

  const facade = new LocalDynamoFacade(
    path.join(__dirname, 'example-serverless-config.yml')
  );
  let dynamodb;

  before(() => {
    dynamodb = facade.start();
  });

  after(() => {
    facade.stop();
  });

  it('local dynamodb started, AWS can connect, table created', function(done) {
    // first time starting process can take a few seconds...
    this.timeout(5000);

    // interact with the dynamodb process directly
    dynamodb.createTable({
      TableName: 'temp',
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    }, done);
  });

  it('create table from serverless config', () => {
    // or use facade to create a table from serverless config
    return facade.createTable(
      'exampleTable', // resource name in serverless config
      'ExampleTable'  // actual dynamodb table name
    );
  });

  it('write data to example table', done => {
    dynamodb.putItem(
      {
        TableName: 'ExampleTable',
        Item: {
          id: { S: '1234' },
          text: { S: 'test' }
        },
        ReturnConsumedCapacity: 'TOTAL'
      },
      done
    );
  });

  it('read data from example table', done => {
    dynamodb.getItem(
      {
        TableName: 'ExampleTable',
        Key: {
          id: { S: '1234' }
        }
      },
      (err, data) => {
        if (err) done(err)
        else {
          expect(data).to.deep.eql({
            Item: {
              id: { S: '1234' },
              text: { S: 'test' }
            }
          });
          done();
        }
      }
    );
  });

});
