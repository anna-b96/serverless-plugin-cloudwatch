'use strict'

const WidgetFactory = require('./widgets/WidgetFactory')
const Dashboard = require('./model/Dashboard')
const ObjectUtil = require('./ObjectUtil')
const ArrayUtil = require('./ArrayUtil')

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
        this.region = this.service.provider.region;

        this.stage = this.getDeploymentStage();

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
            this.logger(`Dev Log: dashboard ${JSON.stringify(dashboard)}`)
            const resourceName = 'ProjectOverviewDashboard';
            let dashboardResource = {};
            dashboardResource[resourceName] = dashboard;
            const template = this.service.provider.compiledCloudFormationTemplate;
            template.Resources = Object.assign(dashboardResource, template.Resources);
            this.logger(`Dev Log: template ${JSON.stringify(template.Resources)}`)
            this.service.provider.compiledCloudFormationTemplate = template;
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

        // create new dashboard (only one for the current stage)
        const widgetFactory = new WidgetFactory(this.logger, this.region, dynamoDBConfig, lambdaConfig, s3Config, apiGatewayConfig, cfResources, functions);
        const dashboardWidgets = widgetFactory.createWidgets();
        if (ArrayUtil.notEmpty(dashboardWidgets)) {
            const dashboardName = this.service.service + '-' + this.stage;
            const dashboard = new Dashboard(dashboardName, dashboardWidgets);
            return dashboard.create();
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
     * Get the stage properly resolved
     * See https://github.com/serverless/serverless/issues/2631
     *
     * @return {string} - Stage option
     * */
    getDeploymentStage() {
        return this.options.stage || 'dev'
    }
}

module.exports = DashboardPlugin
