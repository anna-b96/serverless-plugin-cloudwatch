'use strict'

const WidgetFactory = require('./widgets/WidgetFactory')


/**
 * @module serverless-plugin-cloudwatch-dashboard
 *
 * @see {@link https://serverless.com/framework/docs/providers/aws/guide/plugins/}
 * */
class DashboardPlugin {
  /**
   * @description Serverless CloudWatch Dashboards for Lambdas
   * @constructor
   *
   * @param {!Object} serverless - Serverless object
   * @param {!Object} options - Serverless options
   * */
  constructor (serverless, options) {
    this.logger = msg => serverless.cli.log('[serverless-plugin-cloudwatch-dashboard]: ' + msg)
    // Serverless service: whole serverless.yml
    this.service = serverless.service
    // for ex, eu-central-1
    this.region = this.service.provider.region

    this.stage = this.service.provider.stage

    this.hooks = {
      /*
      everything in the Serverless Framework is implemented as commands (for ex. serverless deploy),
      that trigger hooks and lifecycle events. A lifecycle event represents a part of what a command is built to do.
      Serverless can be extended either by adding new commands or by hooking external actions into lifecycle events of existing ones.
      better 'before:deploy:finalize' ??
      */
      'before:package:finalize': () => {
        console.log('Adding Dashboard')
        this.addDashboard()
      }
    }
  }

  addDashboard () {
    const dashboard = this.createDashboard()

    dashboard.Properties.DashboardName = this.service.service + '-' + this.stage

    const template = this.service.provider.compiledCloudFormationTemplate
    // copies the values from one or more source objects to a target object. If there are already resources, than add the new ones
    template.Resources = Object.assign(dashboard, template.Resources)
    this.service.provider.compiledCloudFormationTemplate = template
    }
  }

  /*
  gets the config for each aws service, the resources for s3 and dynamoDB and all lambda functions
   */
  createDashboard () {
    // get dashboard config from serverless.yml
    const dashboardConfig = this.getDashboardConfig()
    const dynamoDBConfig = dashboardConfig.dynamoDB || {}
    const lambdaConfig = dashboardConfig.lambda || {}
    const s3Config = dashboardConfig.s3 || {}
    const apiGatewayConfig = dashboardConfig.apiGateway || {}

    // get Resources (S3 AND DynamoDB
    const cfResources = serverlessResources.Resources || {}

    // get Lamda functions
    const functions = this.service.functions || {}

    // create new dashboard (only one for the current stage)
    const widgetFactory = new WidgetFactory(this.logger, this.region, dynamoDBConfig, lambdaConfig, s3Config, apiGatewayConfig, cfResources, functions)
    return widgetFactory.createWidgets()
  }

  getDashboardConfig () {
    // serverless.yml dashboard config
    const customConfig = this.service.custom || {}
    return customConfig.dashboard || {}
  }
}

module.exports = DashboardPlugin
