'use strict'

const sinon = require('sinon');
const test = require('ava');
const WidgetFactory = require('../../src/widgets/WidgetFactory');

const logger = msg => {};
const region = 'eu-central-1';
let dynamoDBConfig = {};
const s3Config = {};
const apiGatewayConfig = {};
let cfResources = [];
const functions = {
        f1: {
            name: 'function1',
            dashboard: 'true'
        },
        f2: {
            name: 'function2',
            dashboard: 'true'
        }
};
const lambdaConfig = {
    widgets: [
        { name: 'Sum of Invocations',
            metrics: [
                { name: 'Invocations', stat: 'Sum' },
            ]},
        { name: 'Sum of Errors',
            metrics: [
                { name: 'Errors', stat: 'Sum'}
            ]
        }],

    enabled: false
}

const lambdaWidgets = [{
    type: 'metric',
    width: 24,
    height: 6,
    properties: {
        region: 'eu-central-1',
        title: 'Lambda: Sum of Errors',
        metrics: [['AWS/Lambda', 'Errors', 'FunctionName', 'function1', { 'stat': 'Sum' }],
            ['AWS/Lambda', 'Errors', 'FunctionName', 'function2', { 'stat': 'Sum' }]],
        stat: 'Sum',
        view: 'timeSeries',
        stacked: false,
        period: 300
    }
},
    {
        type: 'metric',
        width: 24,
        height: 6,
        properties: {
            region: 'eu-central-1',
            title: 'Lambda: Sum of Invocations',
            metrics: [['AWS/Lambda', 'Invocations', 'FunctionName', 'function1', { 'stat': 'Sum' }],
                ['AWS/Lambda', 'Invocations', 'FunctionName', 'function2', { 'stat': 'Sum' }]],
            stat: 'Sum',
            view: 'timeSeries',
            stacked: false,
            period: 300
        }
    }
]
// ---------------------------------- tests for getFunctionNames() ---------------------------------- //
test('getFunctionNames() ', t => {
    const widgetFactory = new WidgetFactory(logger, region, dynamoDBConfig, lambdaConfig, s3Config, apiGatewayConfig, cfResources, functions);
    const result = widgetFactory.getFunctionNames();
    t.deepEqual(result, ['function1','function2'])
})
// ---------------------------------- tests for createWidgets() ---------------------------------- //
test('with globally disabled dashboard and two functions where dashboard is enabled', t => {
    const widgetFactory = new WidgetFactory(logger, region, dynamoDBConfig, lambdaConfig, s3Config, apiGatewayConfig, cfResources, functions)
    sinon.stub(widgetFactory, 'getLambdaConfig').returns(lambdaConfig)
    sinon.stub(widgetFactory, 'getFunctionNames').returns(['function1', 'function2'])
    const result = widgetFactory.createWidgets()
    t.deepEqual(result, lambdaWidgets)
})
test('with globally disabled dashboard and two functions where dashboard is enabled and minimum dynamoDB config', t => {
    dynamoDBConfig = {
        enabled: true
    };
    cfResources = {
        TableResource1: {
            Type: "AWS::DynamoDB::Table",
            Properties: {
                TableName: 'TestTable-1'
            }
        },
        NonTableResource: {
            Type: "AWS::Lambda::Permission"
        },
        TableResource2: {
            Type: "AWS::DynamoDB::Table",
            Properties: {
                TableName: 'TestTable-2',
                GlobalSecondaryIndexes: [
                    {
                        IndexName: 'Index-1'
                    },
                    {
                        IndexName: 'Index-2'
                    }
                ]
            }
        }
    }

    const widgetFactory = new WidgetFactory(logger, region, dynamoDBConfig, lambdaConfig, s3Config, apiGatewayConfig, cfResources, functions)
    sinon.stub(widgetFactory, 'getLambdaConfig').returns(lambdaConfig)
    sinon.stub(widgetFactory, 'getFunctionNames').returns(['function1', 'function2'])
    const result = widgetFactory.createWidgets()
    //t.deepEqual(result.length, 4)
    t.deepEqual(result[0].properties.title, 'Lambda: Sum of Errors' )
    t.is(result[0].properties.metrics.length, 2 )
    t.deepEqual(result[1].properties.title, 'Lambda: Sum of Invocations' )
    t.is(result[1].properties.metrics.length, 2 )
    t.deepEqual(result[2].properties.title, 'DynamoDB: sum of system- and user errors' )
    t.is(result[2].properties.metrics.length, 4 )
    t.deepEqual(result[3].properties.title, 'DynamoDB: average time of successful requests' )
    t.is(result[3].properties.metrics.length, 2 )
})

// ---------------------------------- tests for doCreateLambdaWidgets() ---------------------------------- //
test('if custom configuration with disabled lambda globally and two functions with enabeld dashboard ', t => {

    const widgetFactory = new WidgetFactory(logger, region, dynamoDBConfig, lambdaConfig, s3Config, apiGatewayConfig, cfResources, functions);
    const result = widgetFactory.doCreateLambdaWidgets(['function1','function2'], lambdaConfig);
    t.deepEqual(result, lambdaWidgets)
});
// ---------------------------------- tests for getLambdaConfig() ---------------------------------- //

test('with empty lambda configuration', t => {
    const lambdaConfigEmpty = {};
    const widgetFactory = new WidgetFactory(logger, region, dynamoDBConfig, lambdaConfigEmpty, s3Config, apiGatewayConfig, cfResources, functions);
    const result = widgetFactory.getLambdaConfig();
    t.deepEqual(result, {enabled: false})
})
test('with minimum lambda configuration', t => {
    const lambdaConfigMin = {
        enabled: true
    };
    const expectedLambdaConfig = {
        widgets: [
            { name: 'sum of function invocations',
                metrics: [
                    { name: 'Invocations', stat: 'Sum' },
                ]},
            { name: 'number of invocations that result in a function error',
                metrics: [
                    { name: 'Errors', stat: 'Sum'}
                ]

            }],
        enabled: true
    }

    const widgetFactory = new WidgetFactory(logger, region, dynamoDBConfig, lambdaConfigMin, s3Config, apiGatewayConfig, cfResources, functions);
    const result = widgetFactory.getLambdaConfig();
    t.deepEqual(result, expectedLambdaConfig)
})
test('with custom lambda configuration', t => {
    const lambdaConfig = {
        widgets: [
            { name: 'Sum of Invocations',
                metrics: [
                    { name: 'Invocations', stat: 'Sum' },
                ]},
            { name: 'Sum of Errors',
                metrics: [
                    { name: 'Errors', stat: 'Sum'}
                ]
            },
            { name: 'Duration',
                metrics: [
                    { name: 'Duration', stat: 'Average'},
                    { name: 'Duration', stat: 'Maximum'}
                ]
            }],
        enabled: true
    }
    const widgetFactory = new WidgetFactory(logger, region, dynamoDBConfig, lambdaConfig, s3Config, apiGatewayConfig, cfResources, functions);
    const result = widgetFactory.getLambdaConfig();
    t.deepEqual(result, lambdaConfig)
})
