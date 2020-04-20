'use strict'

const sinon = require('sinon')
const test = require('ava')
const LambdaWidgets = require('../../src/widgets/LambdaWidgets')

const logger = msg => {};
const region = 'eu-central-1';
const lambdaConfig = {
    widgets: [
        { name: 'Invocations widget',
            metrics: [
                { name: 'Invocations', stat: 'Sum' },
            ]},
        { name: 'Errors widget',
            metrics: [
                { name: 'Errors', stat: 'Sum'}
            ]

        }],

    enabled: false
    // set here default, if no config is provided in serverless
}
// ---------------------------------- tests for create() ---------------------------------- //
test('creating two lambda widgets', t => {

    const expected = [{
        type: 'metric',
        width: 24,
        height: 6,
        properties: {
            region: 'eu-central-1',
            title: 'Lambda: Errors widget',
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
                title: 'Lambda: Invocations widget',
                metrics: [['AWS/Lambda', 'Invocations', 'FunctionName', 'function1', { 'stat': 'Sum' }],
                    ['AWS/Lambda', 'Invocations', 'FunctionName', 'function2', { 'stat': 'Sum' }]],
                stat: 'Sum',
                view: 'timeSeries',
                stacked: false,
                period: 300
            }
        }
    ]
    const widgetFactory = new LambdaWidgets(logger, region, lambdaConfig, ['function1', 'function2']);
    const result = widgetFactory.create();
    t.deepEqual(result, expected )

})
// ---------------------------------- tests for perFunction() ---------------------------------- //
test('with one function and one metric ', t => {
    const lambdaWidgets = new LambdaWidgets(logger, region, lambdaConfig, ['function1']);
    const result = lambdaWidgets.perFunction(lambdaConfig.widgets[0].name, lambdaConfig.widgets[0].metrics )

    const expected = {
        type: 'metric',
        width: 24,
        height: 6,
        properties: {
        region: 'eu-central-1',
            title: 'Lambda: Invocations widget',
            metrics: [['AWS/Lambda', 'Invocations', 'FunctionName', 'function1', { 'stat': 'Sum' }]
                     ],
            stat: 'Sum',
            view: 'timeSeries',
            stacked: false,
            period: 300
        }
    };

    t.deepEqual(result, expected)
})
test('with two functions and two metrics', t => {
    const lambdaWidgets = new LambdaWidgets(logger, region, lambdaConfig, ['function1', 'function2']);
    const result = lambdaWidgets.perFunction(lambdaConfig.widgets[0].name, lambdaConfig.widgets[0].metrics )

    const expected = {
        type: 'metric',
        width: 24,
        height: 6,
        properties: {
            region: 'eu-central-1',
            title: 'Lambda: Invocations widget',
            metrics: [['AWS/Lambda', 'Invocations', 'FunctionName', 'function1', { 'stat': 'Sum' }],
                ['AWS/Lambda', 'Invocations', 'FunctionName', 'function2', { 'stat': 'Sum' }]],
            stat: 'Sum',
            view: 'timeSeries',
            stacked: false,
            period: 300
        }
    };

    t.deepEqual(result, expected)
})
