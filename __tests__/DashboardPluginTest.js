'use strict'

const sinon = require('sinon')
const test = require('ava')
const DashboardPlugin = require('../src/DashboardPlugin')

const dummyDashboard = {
    Properties: {
        DashboardName: 'dummyProject-dev'
    }
};
// ---------------------------------- tests for addDashboard() ---------------------------------- //
test('do nothing if no dashboards available', t => {
    const serverless = {
        cli: {
            log: msg => {}
        },
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
        cli: {
            log: msg => {}
        },
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
        cli: {
            log: msg => {}
        },
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
test('adding dashboard integration test', t => {
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
                f1: {
                    name: 'function1'
                },
                f2: {
                    name: 'function2'
                }
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
    //sinon.stub(dashboardPlugin, 'createDashboard').returns(dummyDashboard)
    dashboardPlugin.addDashboard()

    t.deepEqual(serverless.service.provider.compiledCloudFormationTemplate, {
        Resources: {
            otherResource: 'dont touch me',
            'ProjectOverviewDashboard': {
                Type: 'AWS::CloudWatch::Dashboard',
                Properties: {
                    DashboardName: 'project-name-dev',
                    DashboardBody: '{"widgets":' +
                        '[{"type":"metric","width":24,"height":6,"properties":{"region":"eu-central-1","title":"Sum of Errors","metrics":' +
                            '[["AWS/Lambda","Errors","FunctionName","function1",{"stat":"Sum"}],' +
                            '["AWS/Lambda","Errors","FunctionName","function2",{"stat":"Sum"}]],' +
                        '"stat":"Sum","view":"timeSeries","stacked":false,"period":60}},' +

                        '{"type":"metric","width":24,"height":6,"properties":{"region":"eu-central-1","title":"Sum of Invocations","metrics":' +
                            '[["AWS/Lambda","Invocations","FunctionName","function1",{"stat":"Sum"}],' +
                            '["AWS/Lambda","Invocations","FunctionName","function2",{"stat":"Sum"}]],' +
                        '"stat":"Sum","view":"timeSeries","stacked":false,"period":60}}]}'
                }
            }
        }
    })
})
// ---------------------------------- tests for createDashboard() ---------------------------------- //
test('create dashboard with only lambda widgets', t => {
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
            // in the serverless it looks different (only the function name), but a function is also interpreted as an object with the property name
            functions: {
                f1: {
                    name: 'function1'
                },
                f2: {
                    name: 'function2'
                }
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
    t.deepEqual(JSON.parse(dashboard.Properties.DashboardBody).widgets[0].properties.metrics[0][3], 'function1')
   //t.deepEqual(dashboard, '')
})
test('create dashboard with dynamodb widgets and lambda widgets', t => {
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
                    },
                    dynamoDB: {
                        widgets: [
                            { name: 'Returned items',
                            metrics: [
                                { name: 'ReturnedItemCount', stat: 'Average', dimension: 'TableName'}
                            ]}
                        ],
                        enabled: true
                    }
                }
            },
            // in the serverless it looks different (only the function name), but a function is also interpreted as an object with the property name
            functions: {
                f1: {
                    name: 'function1'
                },
                f2: {
                    name: 'function2'
                }
            },
            provider: {
                stage: 'dev',
                region: 'eu-central-1',
                compiledCloudFormationTemplate: {
                    Resources: {
                        otherResource: 'dont touch me'
                    }
                }
            },
            resources: {
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
        }
    }

    const dashboardPlugin = new DashboardPlugin(serverless, {})
    const dashboard = dashboardPlugin.createDashboard()
    t.is(dashboard.Type, 'AWS::CloudWatch::Dashboard')
    //t.deepEqual(JSON.parse(dashboard.Properties.DashboardBody).widgets.length, 4)
    t.deepEqual(dashboard.Properties.DashboardName, 'project-name-dev')
    t.deepEqual(JSON.parse(dashboard.Properties.DashboardBody).widgets, '')
    //t.deepEqual(dashboard, '')
})
test('create dashboard with dynamodb widgets', t => {
    const serverless = {
        cli: {
            log: msg => {
            }
        },
        service: {
            service: 'project-name',
            custom: {
                dashboard: {
                    dynamoDB: {
                        widgets: [
                            {
                                name: 'Returned items',
                                metrics: [
                                    {name: 'ReturnedItemCount', stat: 'Average', dimension: 'TableName'}
                                ]
                            }
                        ],
                        enabled: true
                    }
                }
            },
            provider: {
                stage: 'dev',
                region: 'eu-central-1',
                compiledCloudFormationTemplate: {
                    Resources: {
                        otherResource: 'dont touch me'
                    }
                }
            },
            resources: {
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
        }
    }

    const dashboardPlugin = new DashboardPlugin(serverless, {})
    const dashboard = dashboardPlugin.createDashboard()
    t.is(dashboard.Type, 'AWS::CloudWatch::Dashboard')
    t.deepEqual(JSON.parse(dashboard.Properties.DashboardBody).widgets.length, 2)
    t.deepEqual(dashboard.Properties.DashboardName, 'project-name-dev')
    t.deepEqual(JSON.parse(dashboard.Properties.DashboardBody).widgets, '')
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
