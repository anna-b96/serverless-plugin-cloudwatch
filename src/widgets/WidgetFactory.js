'use strict'

const DynamoDBWidgets = require('./DynamoDBWidgets')
const LambdaWidgets = require('./LambdaWidgets')
const ArrayUtil = require('../utils/ArrayUtil')
const ObjectUtil = require('../utils/ObjectUtil')

class WidgetFactory {
    constructor (logger, region, dynamoDBConfig, lambdaConfig, s3Config, apiGatewayConfig, cfResources, functions) {
        this.logger = logger;
        this.region = region;
        this.dynamoDBConfig = dynamoDBConfig;
        this.lambdaConfig = lambdaConfig;
        this.s3Config = s3Config;
        this.apiGatewayConfig = apiGatewayConfig;
        this.resources = cfResources;
        this.functions = functions;
    }

    createWidgets () {
        return [].concat(this.createLambdaWidgets()).concat(this.createDynamoDBWidgets());
    }
    createLambdaWidgets() {
        const lambdaConfig = this.getLambdaConfig();
        const functionNames = this.getFunctionNames();
        if (ArrayUtil.notEmpty(functionNames)) {
            return this.doCreateLambdaWidgets(functionNames, lambdaConfig)
        }
        else {
            return []
        }
    }

    createDynamoDBWidgets() {
        const dynamoDBConfig = this.getDynamoDBConfig()
        const tableNames = this.getTableNames()
        const globalSecondaryIndexNames = this.getGlobalSecondaryIndexNames()

        if (dynamoDBConfig.enabled === true && ArrayUtil.notEmpty(tableNames)) {
            return this.doCreateDynamoDBWidgets(dynamoDBConfig, tableNames, globalSecondaryIndexNames)
        }
        else {
            return []
        }
    }

    doCreateDynamoDBWidgets(dynamoDBConfig, tableNames, globalSecondaryIndexNames) {
        const widgetFactory = new DynamoDBWidgets(this.logger, this.region, dynamoDBConfig, tableNames, globalSecondaryIndexNames)
        const widgets = widgetFactory.create()
        return widgets;
    }
    doCreateLambdaWidgets(functionNames, config) {
        this.logger(`Dev Log LambdaConfig ${JSON.stringify(config)}`)
        const widgetFactory = new LambdaWidgets(this.logger, this.region, config, functionNames)
        const widgets = widgetFactory.create();
        this.logger(`Dev Log Widgets ${JSON.stringify(widgets)}`)
        return widgets;
    }

    /**
     * @returns {Object} returns either a default configuration (if lambda dashboard is enabled, but no custom configuration provided)
     *                   OR a configuration with disabled flag OR the provided custom configuration
     */
    getLambdaConfig () {
        const defaultConfig = {
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
            // set here default, if no config is provided in serverless
        };
        // return the first value if it’s truthy and the second value if the first value is falsy.
        // test later if this works if no config is provided!!
        if(ObjectUtil.isEmpty(this.lambdaConfig)) {
            return {enabled: false}
        }
        if(ArrayUtil.notEmpty(this.lambdaConfig.widgets)){
            return this.lambdaConfig;
        }
        return defaultConfig;

    }
    getDynamoDBConfig() {
        const defaultConfig = {
            widgets: [
                { name: 'System- and UserErrors',
                    metrics: [
                        { name: 'SystemErrors', stat: 'Sum', dimension: 'TableName' },
                        { name: 'UserErrors', stat: 'Sum', dimension: 'TableName' }
                    ]},
                { name: 'Successful requests',
                    metrics: [
                        { name: 'SuccessfulRequestLatency', stat: 'Average', dimension: 'TableName'}
                    ]
                }],
            enabled: true
        }
        if(ObjectUtil.isEmpty(this.dynamoDBConfig)) {
            return {enabled: false}
        }
        if(ArrayUtil.notEmpty(this.dynamoDBConfig.widgets)){
            return this.dynamoDBConfig;
        }
        return defaultConfig;
    }

    getTableNames () {
        if (ObjectUtil.isEmpty(this.resources)){ return []}
        return Object
            .keys(this.resources)
            .filter(key => this.resources[key].Type === "AWS::DynamoDB::Table")
            .map(key => this.resources[key].Properties.TableName)
    }

    getGlobalSecondaryIndexNames () {
        return Object
            .keys(this.resources)
            .filter(key => this.resources[key].Type === "AWS::DynamoDB::Table")
            .reduce( (acc, key) => {
                const tableName = this.resources[key].Properties.TableName
                const indexes = this.resources[key].Properties.GlobalSecondaryIndexes || []
                const indexNames = indexes.map( index => index.IndexName)
                acc[tableName] = indexNames
                return acc
            }, {})
    }

    getFunctionNames () {
        const allEnabled = this.getLambdaConfig().enabled;
        const isEnabled = functionEnabled => (allEnabled && functionEnabled !== false) || functionEnabled;
        return Object.values(this.functions)
            .filter(f => isEnabled(f.dashboard))
            .map(f => f.name )
    }


}
module.exports = WidgetFactory

