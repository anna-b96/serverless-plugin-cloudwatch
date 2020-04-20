'use strict'

const DynamoDBWidgets = require('./DynamoDBWidgets')
const LambdaWidgets = require('./LambdaWidgets')
const ApiGatewayWidgets = require('./ApiGatewayWidgets')
const ArrayUtil = require('../utils/ArrayUtil')
const ObjectUtil = require('../utils/ObjectUtil')

class WidgetFactory {
    constructor(logger, region, dynamoDBConfig, lambdaConfig, s3Config, apiGatewayConfig, cfResources, functions, apiGatewayName) {
        this.logger = logger;
        this.region = region;
        this.dynamoDBConfig = dynamoDBConfig;
        this.lambdaConfig = lambdaConfig;
        this.s3Config = s3Config;
        this.apiGatewayConfig = apiGatewayConfig;
        this.resources = cfResources;
        this.functions = functions;
        this.apiGatewayName = apiGatewayName;
    }

    /**
     * concatenates all created widgets to one array
     * @returns {Array} of all widgets, which should be added to the dashboard
     */
    createWidgets() {
        return [].concat(this.createLambdaWidgets()).concat(this.createDynamoDBWidgets()).concat(this.createS3Widgets()).concat(this.createApiGatewayWidgets());
    }

    /**
     *
     * @returns {Array|[]}
     */
    createLambdaWidgets() {
        const lambdaConfig = this.getLambdaConfig();
        const functionNames = this.getFunctionNames();

        if (ArrayUtil.notEmpty(functionNames)) {
            return this.doCreateLambdaWidgets(functionNames, lambdaConfig)
        } else {
            return []
        }
    }

    /**
     *
     * @returns {Array|[]}
     */
    createS3Widgets() {
        const s3Config = this.getS3Config();
        const bucketNames = this.getBucketNames();

        if (s3Config.enabled === true && ArrayUtil.notEmpty(bucketNames)) {
            return this.doCreateS3Widgets(bucketNames, s3Config)
        } else {
            return []
        }
    }

    /**
     *
     * @returns {*[]|*}
     */
    createDynamoDBWidgets() {
        const dynamoDBConfig = this.getDynamoDBConfig();
        const tableNames = this.getTableNames();
        const globalSecondaryIndexNames = this.getGlobalSecondaryIndexNames();

        if (dynamoDBConfig.enabled === true && ArrayUtil.notEmpty(tableNames)) {
            return this.doCreateDynamoDBWidgets(dynamoDBConfig, tableNames, globalSecondaryIndexNames)
        } else {
            return []
        }
    }

    /**
     *
     * @returns {*[]|*}
     */
    createApiGatewayWidgets() {
        const apiGatewayConfig = this.getApiGatewayConfig();

        if (apiGatewayConfig.enabled === true && !ObjectUtil.isEmpty(this.apiGatewayName)) {
            return this.doCreateApiGatewayWidgets(apiGatewayConfig)
        } else {
            return []
        }
    }

    /**
     *
     * @param bucketNames
     * @param s3Config
     * @returns {*}
     */
    doCreateS3Widgets(bucketNames, s3Config) {
        const widgetFactory = new S3Widgets(this.logger, this.region, s3Config, bucketNames)
        const widgets = widgetFactory.create();
        this.logger(`Dev Log Widgets S3 ${JSON.stringify(widgets)}`)
        return widgets;
    }

    doCreateDynamoDBWidgets(dynamoDBConfig, tableNames, globalSecondaryIndexNames) {
        const widgetFactory = new DynamoDBWidgets(this.logger, this.region, dynamoDBConfig, tableNames, globalSecondaryIndexNames)
        const widgets = widgetFactory.create()
        return widgets;
    }

    doCreateLambdaWidgets(functionNames, lambdaConfig) {
        const widgetFactory = new LambdaWidgets(this.logger, this.region, lambdaConfig, functionNames)
        const widgets = widgetFactory.create();
        this.logger(`Dev Log Widgets Lambda ${JSON.stringify(widgets)}`)
        return widgets;
    }

    doCreateApiGatewayWidgets(apiGatewayConfig) {
        const widgetFactory = new ApiGatewayWidgets(this.logger, this.region, apiGatewayConfig, this.apiGatewayName)
        const widgets = widgetFactory.create();
        this.logger(`Dev Log Widgets Api ${JSON.stringify(widgets)}`)
        return widgets;
    }

    /**
     * @returns {Object} returns either a default configuration (if lambda dashboard is enabled, but no custom configuration provided)
     *                   OR a configuration with disabled flag OR the provided custom configuration
     */
    getLambdaConfig() {
        const defaultConfig = {
            widgets: [
                {
                    name: 'sum of function invocations',
                    metrics: [
                        {name: 'Invocations', stat: 'Sum'},
                    ]
                },
                {
                    name: 'number of invocations that result in a function error',
                    metrics: [
                        {name: 'Errors', stat: 'Sum'}
                    ]

                }],
            enabled: true
            // set here default, if no config is provided in serverless
        };
        // return the first value if it’s truthy and the second value if the first value is falsy.
        // test later if this works if no config is provided!!
        if (ObjectUtil.isEmpty(this.lambdaConfig)) {
            return {enabled: false}
        }
        if (ArrayUtil.notEmpty(this.lambdaConfig.widgets)) {
            return this.lambdaConfig;
        }
        return defaultConfig;

    }

    getS3Config() {
        const defaultConfig = {
            widgets: [
                {
                    name: 'daily storage metrics for buckets',
                    metrics: [
                        {name: 'BucketSizeBytes', stat: 'Average', dimension: 'BucketName'},
                        {name: 'NumberOfObjects', stat: 'Average', dimension: 'BucketName'}
                    ]
                },
                {
                    name: 'total request latency',
                    metrics: [
                        {name: 'TotalRequestLatency', stat: 'Average', dimension: 'BucketName'}
                    ]
                }],
            enabled: true
        }
        if (ObjectUtil.isEmpty(this.s3Config)) {
            return {enabled: false}
        }
        if (ArrayUtil.notEmpty(this.s3Config.widgets)) {
            return this.s3Config;
        }
        return defaultConfig;
    }

    getDynamoDBConfig() {
        const defaultConfig = {
            widgets: [
                {
                    name: 'sum of system- and user errors',
                    metrics: [
                        {name: 'SystemErrors', stat: 'Sum', dimension: 'TableName'},
                        {name: 'UserErrors', stat: 'Sum', dimension: 'TableName'}
                    ]
                },
                {
                    name: 'average time of successful requests',
                    metrics: [
                        {name: 'SuccessfulRequestLatency', stat: 'Average', dimension: 'TableName'}
                    ]
                }],
            enabled: true
        };
        if (ObjectUtil.isEmpty(this.dynamoDBConfig)) {
            return {enabled: false}
        }
        if (ArrayUtil.notEmpty(this.dynamoDBConfig.widgets)) {
            return this.dynamoDBConfig;
        }
        return defaultConfig;
    }

    getApiGatewayConfig() {
        const defaultConfig = {
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
        if (ObjectUtil.isEmpty(this.apiGatewayConfig)) {
            return {enabled: false}
        }
        if (ArrayUtil.notEmpty(this.apiGatewayConfig.widgets)) {
            return this.apiGatewayConfig;
        }
        return defaultConfig;
    }

    getTableNames() {
        if (ObjectUtil.isEmpty(this.resources)) {
            return []
        }
        return Object
            .keys(this.resources)
            .filter(key => this.resources[key].Type === "AWS::DynamoDB::Table")
            .map(key => this.resources[key].Properties.TableName)
    }

    getBucketNames() {
        if (ObjectUtil.isEmpty(this.resources)) {
            return []
        }
        return Object
            .keys(this.resources)
            .filter(key => this.resources[key].Type === "AWS::S3::Bucket")
            .map(key => this.resources[key].Properties.BucketName)
    }

    getGlobalSecondaryIndexNames() {
        return Object
            .keys(this.resources)
            .filter(key => this.resources[key].Type === "AWS::DynamoDB::Table")
            .reduce((acc, key) => {
                const tableName = this.resources[key].Properties.TableName
                const indexes = this.resources[key].Properties.GlobalSecondaryIndexes || []
                const indexNames = indexes.map(index => index.IndexName)
                acc[tableName] = indexNames
                return acc
            }, {})
    }

    getFunctionNames() {
        const allEnabled = this.getLambdaConfig().enabled;
        const isEnabled = functionEnabled => (allEnabled && functionEnabled !== false) || functionEnabled;
        return Object.values(this.functions)
            .filter(f => isEnabled(f.dashboard))
            .map(f => f.name)
    }

}

module.exports = WidgetFactory

