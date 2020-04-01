'use strict'

const sinon = require('sinon');
const test = require('ava');
const WidgetFactory = require('../../src/widgets/WidgetFactory');


const logger = msg => {};
const region = 'eu-central-1';
const dynamoDBConfig = {};
const s3Config = {};
const apiGatewayConfig = {};
const cfResources = [];
const functions = {
    'function1': {dashboard: true},
    'function2': {dashboard: true}
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
    // set here default, if no config is provided in serverless
}
test('getFunctionNames() ', t => {
    const widgetFactory = new WidgetFactory(logger, region, dynamoDBConfig, lambdaConfig, s3Config, apiGatewayConfig, cfResources, functions);
    const result = widgetFactory.getFunctionNames();
    t.deepEqual(result, ['function1','function2'])
})
test('doCreateLambdaWidgets() ', t => {
    const widgetFactory = new WidgetFactory(logger, region, dynamoDBConfig, lambdaConfig, s3Config, apiGatewayConfig, cfResources, functions);
    const result = widgetFactory.createWidgets();
    t.deepEqual(result, [])
});

test('getLamdaConfig', t => {
    const lambdaConfigEmpty = {};
    const widgetFactory = new WidgetFactory(logger, region, dynamoDBConfig, lambdaConfigEmpty, s3Config, apiGatewayConfig, cfResources, functions);
    const result = widgetFactory.getLambdaConfig();
    t.deepEqual(result, lambdaConfig)
})
