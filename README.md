
# local-dynamo-facade

## Summary

Use this module to run dynamodb locally for functional unit testing.

This module is piggy-backing off [local-dynamo][] to start the dynamodb process.

[local-dynamo]: https://github.com/Medium/local-dynamo

## Usage

```javascript
const LocalDynamoFacade = require('local-dynamo-facade');

describe('dynamodb local integration tests', () => {

  const facade = new LocalDynamoFacade(
    path.join('/absolute/path/to/serverless.yml')
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
    dynamodb.createTable({...}, done);

    // or use facade to create a table from serverless config
    return facade.createTable(
      'exampleTable', // resource name in serverless config
      'ExampleTable'  // actual dynamodb table name
    );
  });

});
```

See tests for working example.

## Environment Dependencies

- `java` in system `PATH`
