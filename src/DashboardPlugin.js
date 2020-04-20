'use strict'

const WidgetFactory = require('./widgets/WidgetFactory')
const Dashboard = require('./model/Dashboard')
const ObjectUtil = require('./utils/ObjectUtil')
const ArrayUtil = require('./utils/ArrayUtil')

/**
 * @module serverless-plugin-cloudwatch
 *
 * @see {@link https://serverless.com/framework/docs/providers/aws/guide/plugins/}
 * */
class DashboardPlugin {
    /**
     * @description Serverless CloudWatch Dashboard for a better overview of your project's current state.
     * @constructor
     *
     * @param {!Object} serverless - Serverless object
     * @param {!Object} options - Serverless options
     * */
    constructor(serverless, options) {
        this.logger = msg => serverless.cli.log('[serverless-plugin-cloudwatch]: ' + msg);
        // Serverless service: whole serverless.yml
        this.service = serverless.service;
        this.options = options;
        // for ex, eu-central-1
        this.provider = this.service.provider;
        this.region = this.provider.region;

        this.hooks = {
            /*
            everything in the Serverless Framework is implemented as commands (for ex. serverless deploy),
            that trigger hooks and lifecycle events. A lifecycle event represents a part of what a command is built to do.
            Serverless can be extended either by adding new commands or by hooking external actions into lifecycle events of existing ones.
            better 'before:deploy:finalize' ??
            */
            'before:package:finalize': () => this.addDashboard()
        }
    }

    /**
     *  adds a dashboard resource to the cloudformation template, stored in the serverless object
     */
    addDashboard() {
        const dashboard = this.createDashboard();
        if (!ObjectUtil.isEmpty(dashboard)) {
            const resourceName = 'ProjectOverviewDashboard';
            let dashboardResource = {};
            dashboardResource[resourceName] = dashboard;
            const template = this.provider.compiledCloudFormationTemplate;
            template.Resources = Object.assign(dashboardResource, template.Resources);
            this.logger(`Dev Log: template ${JSON.stringify(template.Resources)}`)
            this.provider.compiledCloudFormationTemplate = template;
        } else {
            this.logger('No dashboard has been added.')
        }
    }

    /**
     *  gets the config for each aws service, the resources for s3 and dynamoDB and all lambda functions
     *  @returns {Object} dashboard
     */
    createDashboard() {
        // get dashboard config from serverless.yml
        const dashboardConfig = this.getDashboardConfig();
        const dynamoDBConfig = dashboardConfig.dynamoDB || {};
        const lambdaConfig = dashboardConfig.lambda || {};
        const s3Config = dashboardConfig.s3 || {};
        const apiGatewayConfig = dashboardConfig.apiGateway || {};

        // get Resources (S3 AND DynamoDB)
        const serverlessResources = this.service.resources || {};
        const cfResources = serverlessResources.Resources || {};

        // get Lamda functions
        const functions = this.service.functions || {};

        // get apiGateway name
        this.apiGatewayName = this.getApiGatewayName();

        // get deployment stage
        this.stage = this.getDeploymentStage();

        // create new dashboard (only one for the current stage)
        this.logger(`Creating dashboard for deployment stage ${this.stage} and `)
        const widgetFactory = new WidgetFactory(this.logger, this.region, dynamoDBConfig, lambdaConfig, s3Config, apiGatewayConfig, cfResources, functions, this.apiGatewayName);
        const dashboardWidgets = widgetFactory.createWidgets();
        this.logger(`Adding ${dashboardWidgets.length} widgets to the dashboard...`)
        if (ArrayUtil.notEmpty(dashboardWidgets)) {
            const dashboardName = this.stage + '-' + this.service.service;
            const dashboardFactory = new Dashboard(this.logger, dashboardName, dashboardWidgets);
            const dashboard = dashboardFactory.create();
            this.logger(`Dev Log: Dashboard ${JSON.stringify(dashboard)}`)
            return dashboard;
        }
        return {}
    }

    /**
     * gets the custom dashboard config from the serverless object
     * @returns {Object} dashboard config
     */
    getDashboardConfig() {
        const customConfig = this.service.custom || {};
        return customConfig.dashboard || {};
    }
    /**
     * Get the stage properly resolved. Only when deployment command is done with option --stage
     * See https://github.com/serverless/serverless/issues/2631
     *
     * @return {string} - Stage option
     * */
    getDeploymentStage() {
        let apiGatewayDeploymentResource = undefined;
        if (!this.isNullOrUndefined(this.provider.compiledCloudFormationTemplate.Resources) && !this.isNullOrUndefined(this.provider.compiledCloudFormationTemplate.Resources[`ApiGatewayDeploment(\\d+)`])) {
            apiGatewayDeploymentResource = this.provider.compiledCloudFormationTemplate.Resources[`ApiGatewayDeploment(\\d+)`].Properties.Name
        }
        return this.options.stage || apiGatewayDeploymentResource ||'deployment'
    }

    /**
     * Gets api gateway name either from provider config or from compiledCloudFormationTemplate
     * @returns {string | undefined} - Api Gateway name
     */
    getApiGatewayName() {
        if ((!this.isNullOrUndefined(this.provider.apiGateway)) &&
            !(this.provider.apiGateway.restApiId === null ||  this.provider.apiGateway.restApiId === undefined)){
            return this.provider.apiGateway.restApiId
        }
        else if ((!this.isNullOrUndefined(this.provider.compiledCloudFormationTemplate.Resources)) &&
            !(this.provider.compiledCloudFormationTemplate.Resources['ApiGatewayRestApi'] === null ||
            this.provider.compiledCloudFormationTemplate.Resources['ApiGatewayRestApi'] === undefined)){
            return this.provider.compiledCloudFormationTemplate.Resources['ApiGatewayRestApi'].Properties.Name;
        }
        else {
            this.logger('Can not get API Gateway Name.')
            return;
        }
    }
    isNullOrUndefined(value) {
        return value === null || value === undefined
    }

}

module.exports = DashboardPlugin
