'use strict'

const sinon = require('sinon')
const test = require('ava')

const Dashboard = require('../../src/model/Dashboard')

const widgets = [{
    type: 'metric',
    width: 24,
    height: 6,
    properties: {
        region: 'eu-central-1',
        title: 'Errors widget',
        metrics: [['AWS/Lambda', 'Errors', 'FunctionName', 'function1', {'stat': 'Sum'}],
            ['AWS/Lambda', 'Errors', 'FunctionName', 'function2', {'stat': 'Sum'}]],
        stat: 'Sum',
        view: 'timeSeries',
        stacked: false,
        period: 60
    }
},
    {
        type: 'metric',
        width: 24,
        height: 6,
        properties: {
            region: 'eu-central-1',
            title: 'Invocations widget',
            metrics: [['AWS/Lambda', 'Invocations', 'FunctionName', 'function1', {'stat': 'Sum'}],
                ['AWS/Lambda', 'Invocations', 'FunctionName', 'function2', {'stat': 'Sum'}]],
            stat: 'Sum',
            view: 'timeSeries',
            stacked: false,
            period: 60
        }
    }
]

test('create dashboard', t => {
    const dashboardFactory = new Dashboard('test-dashboard', widgets)
    const dashboard = dashboardFactory.create()

    t.is(dashboard.Type, 'AWS::CloudWatch::Dashboard')
    t.is(dashboard.Properties.DashboardName, 'test-dashboard')
    t.deepEqual(dashboard.Properties.DashboardBody, JSON.stringify({widgets: widgets}))
})
