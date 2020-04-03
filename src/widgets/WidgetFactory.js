'use strict'

const LambdaWidgets = require('./LambdaWidgets')
const ArrayUtil = require('../ArrayUtil')
const ObjectUtil = require('../ObjectUtil')

class WidgetFactory {
    constructor (logger, region, dynamoDBConfig, lambdaConfig, s3Config, apiGatewayConfig, cfResources, functions) {
        this.logger = logger;
        this.region = region;
        this.dynamoDBConfig = dynamoDBConfig;
        this.lambdaConfig = lambdaConfig;
        this.s3Config = s3Config;
        this.apiGatewayConfig = apiGatewayConfig;
        this.cfResources = cfResources;
        this.functions = functions;
    }

    createWidgets () {
        // lamda
        const lambdaConfig = this.getLambdaConfig()
        const functionNames = this.getFunctionNames()
        // there must at least one entry of widgets with a not empty metrics array
        if (ArrayUtil.notEmpty(functionNames)) {
            this.logger(`Dev Log Functionnames ${functionNames[0]} ${functionNames[19]} `)
            return this.doCreateLambdaWidgets(functionNames, lambdaConfig)
        }
        else {
            return []
        }
    }

    doCreateLambdaWidgets(functionNames, config) {
        const widgetFactory = new LambdaWidgets(this.logger, this.region, config, functionNames)
        return widgetFactory.create()
    }

    /**
     * @returns {Object} returns either a default configuration (if lambda dashboard is enabled, but no custom configuration provided) OR a configuration with disabled flag OR the provided custom configuration
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

    getFunctionNames () {
        const allEnabled = this.getLambdaConfig().enabled;
        const isEnabled = functionEnabled => (allEnabled && functionEnabled !== false) || functionEnabled;
        return Object.values(this.functions)
            .filter(f => isEnabled(f.dashboard))
            .map(f => f.name )
    }


}
module.exports = WidgetFactory

