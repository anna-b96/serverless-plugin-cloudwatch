'use strict'

const sinon = require('sinon')
const test = require('ava')
const ApiGatewayWidgets = require('../../src/widgets/ApiGatewayWidgets')

const logger = msg => {
};
const region = 'eu-central-1';
const apiGatewayName = 'test-api-gateway'

// ---------------------------------- tests for create() ---------------------------------- //
test('with two widgets', t => {
    const config = {
        widgets: [
            {
                name: 'system- and user errors',
                metrics: [
                    {name: '5xxErrors', stat: 'Sum'},
                    {name: '4xxErrors', stat: 'Sum'}
                ]
            },
            {
                name: 'total number of API requests',
                metrics: [
                    {name: 'Count', stat: 'SampleCount'},
                ]
            }
        ]
    };
    const apiGatewayWidgets = new ApiGatewayWidgets(logger, region, config, apiGatewayName);
    // sinon.stub(apiGatewayWidgets, 'getMetrics').returns();
    const result = apiGatewayWidgets.create();
    const expectedWidgets = [{
        type: 'metric',
        width: 24,
        height: 6,
        properties: {
            region: 'eu-central-1',
            title: 'ApiGateway: system- and user errors',
            metrics: [['AWS/ApiGateway', '5xxErrors', 'ApiName', apiGatewayName, {'stat': 'Sum'}],
                ['AWS/ApiGateway', '4xxErrors', 'ApiName', apiGatewayName, {'stat': 'Sum'}]],
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
                title: 'ApiGateway: total number of API requests',
                metrics: [['AWS/ApiGateway', 'Count', 'ApiName', apiGatewayName, {'stat': 'SampleCount'}]],
                stat: 'Sum',
                view: 'timeSeries',
                stacked: false,
                period: 300
            }
        }]
    t.deepEqual(result, expectedWidgets)
})

// ---------------------------------- tests for getMetrics() ---------------------------------- //
test('with one metric', t => {
    const config = {}
    const metricsConfig = [{name: '5xxErrors', stat: 'Sum'}];

    const expectedMetrics = [
        ['AWS/ApiGateway', '5xxErrors', 'ApiName', apiGatewayName, {'stat': 'Sum'}]
    ]

    const apiGatewayWidgets = new ApiGatewayWidgets(logger, region, config, apiGatewayName);
    const result = apiGatewayWidgets.getMetrics(metricsConfig);
    t.deepEqual(result, expectedMetrics);
})
test('with two metrics', t => {
    const config = {}
    const metricsConfig = [
        {name: '5xxErrors', stat: 'Sum'},
        {name: '4xxErrors', stat: 'Sum'}
    ];

    const expectedMetrics = [
        ['AWS/ApiGateway', '5xxErrors', 'ApiName', apiGatewayName, {'stat': 'Sum'}],
        ['AWS/ApiGateway', '4xxErrors', 'ApiName', apiGatewayName, {'stat': 'Sum'}]
    ]

    const apiGatewayWidgets = new ApiGatewayWidgets(logger, region, config, apiGatewayName);
    const result = apiGatewayWidgets.getMetrics(metricsConfig);
    t.deepEqual(result, expectedMetrics);
})
