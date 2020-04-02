'use strict'

const sinon = require('sinon')
const test = require('ava')
const DashboardPlugin = require('../src/DashboardPlugin')

const dummyDashboard = {
    Properties: {
        DashboardName: 'dummyProject-dev'
    }
}
// ---------------------------------- tests for addDashboard() ---------------------------------- //
test('do nothing if no dashboards available', t => {
    const serverless = {
        service: {
            provider: {
                region: 'eu-central-1',
                compiledCloudFormationTemplate: {}
            }
        }
    }

    const dashboardPlugin = new DashboardPlugin(serverless, {})
    sinon.stub(dashboardPlugin, 'createDashboard').returns({})
    dashboardPlugin.addDashboard()

    t.deepEqual(serverless.service.provider.compiledCloudFormationTemplate, {})
})

test('creates new resource for dashboard, when missing', t => {
    const serverless = {
        service: {
            provider: {
                region: 'eu-central-1',
                compiledCloudFormationTemplate: {}
            }
        }
    }

    const dashboardPlugin = new DashboardPlugin(serverless, {})
    sinon.stub(dashboardPlugin, 'createDashboard').returns(dummyDashboard)
    dashboardPlugin.addDashboard()

    t.deepEqual(serverless.service.provider.compiledCloudFormationTemplate, {
        Resources: {
            'ProjectOverviewDashboard': dummyDashboard
        }
    })
})
test('add dashboard to existing resources when not missing', t => {
    const serverless = {
        service: {
            provider: {
                region: 'eu-central-1',
                compiledCloudFormationTemplate: {
                    Resources: {
                        otherResource: 'dont touch me'
                    }
                }
            }
        }
    }

    const dashboardPlugin = new DashboardPlugin(serverless, {})
    sinon.stub(dashboardPlugin, 'createDashboard').returns(dummyDashboard)
    dashboardPlugin.addDashboard()

    t.deepEqual(serverless.service.provider.compiledCloudFormationTemplate, {
        Resources: {
            otherResource: 'dont touch me',
            'ProjectOverviewDashboard': dummyDashboard
        }
    })
})
// ---------------------------------- tests for createDashboard() ---------------------------------- //
test('create dashboard', t => {
    const serverless = {
        cli: {
            log: msg => {}
        },
        service: {
            service: 'project-name',
            custom: {
                dashboard: {
                    lambda: {
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
                        enabled: true
                    }
                }
            },
            functions: {
                's-dev-f1': {},
                's-dev-f2': {}
            },
            provider: {
                stage: 'dev',
                region: 'eu-central-1',
                compiledCloudFormationTemplate: {
                    Resources: {
                        otherResource: 'dont touch me'
                    }
                }
            }
        }
    }

    const dashboardPlugin = new DashboardPlugin(serverless, {})
    const dashboard = dashboardPlugin.createDashboard()

    t.is(dashboard.Type, 'AWS::CloudWatch::Dashboard')
    t.deepEqual(JSON.parse(dashboard.Properties.DashboardBody).widgets.length, 2)
    t.deepEqual(dashboard.Properties.DashboardName, 'project-name-dev')
    t.deepEqual(JSON.parse(dashboard.Properties.DashboardBody).widgets[0].properties.metrics, [['AWS/Lambda', 'Errors', 'FunctionName', 's-dev-f1', { 'stat': 'Sum' }],['AWS/Lambda', 'Errors', 'FunctionName', 's-dev-f2', { 'stat': 'Sum' }]])
   //t.deepEqual(dashboard, '')
})

// ---------------------------------- tests for getDashboardConfig() ---------------------------------- //
test('if no dashboard config is provided', t => {
    const serverless = {
        cli: {
            log: msg => {}
        },
        service: {
            custom: {
            },
            provider: {
                region: 'eu-central-1'
            }
        }
    }
    const dashboardPlugin = new DashboardPlugin(serverless, {})
    const dashboardConfig = dashboardPlugin.getDashboardConfig()

    t.deepEqual(dashboardConfig, {})
})
test('if custom dashboard config is provided', t => {
    const serverless = {
        cli: {
            log: msg => {}
        },
        service: {
            custom: {
                dashboard: {
                    lambda: {
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
                            enabled: true
                    }
                }
            },
            provider: {
                region: 'eu-central-1'
            }
        }
    }
    const expectedDashboardConfig = {
        lambda: {
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
            enabled: true
    }};

    const dashboardPlugin = new DashboardPlugin(serverless, {})
    const dashboardConfig = dashboardPlugin.getDashboardConfig()

    t.deepEqual(dashboardConfig, expectedDashboardConfig)
})
