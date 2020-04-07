'use strict'

const sinon = require('sinon')
const test = require('ava')
const DynamoDBWidgets = require('../../src/widgets/DynamoDBWidgets')


const logger = msg => {};
const region = 'eu-central-1';
const tableNames = ['TestTable1', 'TestTable2'];
// ---------------------------------- tests for create() ---------------------------------- //
test('with default config and only dimension TableName', t => {
    const dynamoDBConfig = {
        widgets: [
            {
                name: 'System errors',
                metrics: [
                    {name: 'SystemErrors', stat: 'Sum', dimension: 'TableName'}
                ]
            },
            {
                name: 'Successful requests',
                metrics: [
                    {name: 'SuccessfulRequestLatency', stat: 'Sum', dimension: 'Operation'}
                ]
            },
            {
                name: 'Returned Item Count',
                metrics: [
                    {name: 'ReturnedItemCount', stat: 'Sum', dimension: 'GlobalSecondaryIndexName'},
                    {name: 'ReturnedItemCount', stat: 'Average' },
                ]
            },],
        enabled: true
    };
    const globalSecondaryIndexNames = {
        'TestTable1': [],
        'TestTable2': ['Index-1', 'Index-2']
    };

    const expectedMetricsWidgetThree = [
        ['AWS/DynamoDB', 'ReturnedItemCount', { 'stat': 'Average' }],
        [ 'AWS/DynamoDB', 'ReturnedItemCount', 'TableName', 'TestTable2', 'GlobalSecondaryIndexName', 'Index-2', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'ReturnedItemCount', 'TableName', 'TestTable2', 'GlobalSecondaryIndexName', 'Index-1', { 'stat': 'Sum' } ]
    ]
    const expectedMetricsWidgetOne = [
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable2', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable1', { 'stat': 'Sum' } ]
    ]

    const widgetFactory = new DynamoDBWidgets(logger, region, dynamoDBConfig, tableNames, globalSecondaryIndexNames);
    //sinon.stub(widgetFactory, 'getMetrics').returns(expectedMetrics)
    const result  = widgetFactory.create();
    t.deepEqual(result.length, 3)
    t.deepEqual(result[0].properties.metrics, expectedMetricsWidgetOne )
    t.deepEqual(result[1].properties.metrics.length, 16 )
    t.deepEqual(result[2].properties.metrics, expectedMetricsWidgetThree)

})
// ---------------------------------- tests for getMetrics() ---------------------------------- //
test('get all metrics for one widget with different dimensions', t => {
    const dynamoDBConfig = {}
    const metrics = [
        {name: 'SystemErrors', stat: 'Sum', dimension: 'TableName'},
        {name: 'UserErrors', stat: 'Sum', dimension: 'GlobalSecondaryIndexName'}
    ]
    const globalSecondaryIndexNames = {
        'TestTable1': [],
        'TestTable2': ['Index-1', 'Index-2']
    };
    const widgetFactory = new DynamoDBWidgets(logger, region, dynamoDBConfig, tableNames, globalSecondaryIndexNames);
    const result = widgetFactory.getMetrics(metrics)

    t.deepEqual(result, [[ 'AWS/DynamoDB', 'UserErrors', 'TableName', 'TestTable2', 'GlobalSecondaryIndexName', 'Index-2', { 'stat': 'Sum' } ],
                        [ 'AWS/DynamoDB', 'UserErrors', 'TableName', 'TestTable2', 'GlobalSecondaryIndexName', 'Index-1', { 'stat': 'Sum' } ],
                        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable2', { 'stat': 'Sum' } ],
                        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable1', { 'stat': 'Sum' } ]])
})
// ---------------------------------- tests for getMetricPerTableName() ---------------------------------- //
test('get metric array with dimension TableName', t=> {
    const dynamoDBConfig = {}
    const globalSecondaryIndexNames = {};
    const metric = {
    name: 'SystemErrors', stat: 'Sum', dimension: 'TableName'
    }
    const widgetFactory = new DynamoDBWidgets(logger, region, dynamoDBConfig, tableNames, globalSecondaryIndexNames);
    const result = widgetFactory.getMetricPerTableName(metric)

    t.deepEqual(result, [[ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable1', { 'stat': 'Sum' } ],[ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable2', { 'stat': 'Sum' } ]])
})
// ---------------------------------- tests for getMetricPerSecondaryIndexName() ---------------------------------- //
test('get metric array with dimension GlobalSecondaryIndex', t=> {
    const dynamoDBConfig = {};
    const globalSecondaryIndexNames = {
        'TestTable1': [],
        'TestTable2': ['Index-1', 'Index-2']
    };

    const metric = {
        name: 'SystemErrors', stat: 'Sum', dimension: 'GlobalSecondaryIndexName'
    }
    const widgetFactory = new DynamoDBWidgets(logger, region, dynamoDBConfig, tableNames, globalSecondaryIndexNames);
    const result = widgetFactory.getMetricPerSecondaryIndexName(metric)

    t.deepEqual(result, [[ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable2', 'GlobalSecondaryIndexName', 'Index-1', { 'stat': 'Sum' } ],
                        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable2', 'GlobalSecondaryIndexName', 'Index-2', { 'stat': 'Sum' } ]])
})
// ---------------------------------- tests for getMetricPerOperation() ---------------------------------- //
test('get metric array with dimension Operation', t=> {
    const dynamoDBConfig = {};
    const globalSecondaryIndexNames = {
        'TestTable1': [],
        'TestTable2': ['Index-1', 'Index-2']
    };

    const metric = {
        name: 'SystemErrors', stat: 'Sum', dimension: 'Operation'
    }
    const widgetFactory = new DynamoDBWidgets(logger, region, dynamoDBConfig, tableNames, globalSecondaryIndexNames);
    const result = widgetFactory.getMetricPerOperation(metric)

    t.deepEqual(result, [
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable1', 'Operation', 'Query', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable1', 'Operation', 'Scan', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable1', 'Operation', 'GetItem', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable1', 'Operation', 'PutItem', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable1', 'Operation', 'UpdateItem', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable1', 'Operation', 'BatchWriteItem', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable1', 'Operation', 'DeleteItem', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable1', 'Operation', 'BatchGetItem', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable2', 'Operation', 'Query', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable2', 'Operation', 'Scan', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable2', 'Operation', 'GetItem', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable2', 'Operation', 'PutItem', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable2', 'Operation', 'UpdateItem', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable2', 'Operation', 'BatchWriteItem', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable2', 'Operation', 'DeleteItem', { 'stat': 'Sum' } ],
        [ 'AWS/DynamoDB', 'SystemErrors', 'TableName', 'TestTable2', 'Operation', 'BatchGetItem', { 'stat': 'Sum' } ],
        ])
})
// ---------------------------------- tests for getMetricReceivingRegion() ---------------------------------- //

test('get metric array with dimension ReceivingRegion', t => {
    const dynamoDBConfig = {};
    const globalSecondaryIndexNames = {
        'TestTable1': [],
        'TestTable2': ['Index-1', 'Index-2']
    };

    const metric = {
        name: 'SystemErrors', stat: 'Sum', dimension: 'ReceivingRegion'
    }
    const widgetFactory = new DynamoDBWidgets(logger, region, dynamoDBConfig, tableNames, globalSecondaryIndexNames);
    const result = widgetFactory.getMetricReceivingRegion(metric)

    t.deepEqual(result, ['AWS/DynamoDB', 'SystemErrors', 'ReceivingRegion', { 'stat': 'Sum' }])
})

// ---------------------------------- tests for getMetricStreamLabel() ---------------------------------- //
test('get metric array with dimension StreamLabel', t => {
    const dynamoDBConfig = {};
    const globalSecondaryIndexNames = {
        'TestTable1': [],
        'TestTable2': ['Index-1', 'Index-2']
    };

    const metric = {
        name: 'SystemErrors', stat: 'Sum', dimension: 'StreamLabel'
    }
    const widgetFactory = new DynamoDBWidgets(logger, region, dynamoDBConfig, tableNames, globalSecondaryIndexNames);
    const result = widgetFactory.getMetricStreamLabel(metric);

    t.deepEqual(result, ['AWS/DynamoDB', 'SystemErrors', 'StreamLabel', { 'stat': 'Sum' }])
})
