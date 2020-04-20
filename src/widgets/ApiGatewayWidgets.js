'use strict'
const Widget = require('../model/Widget')

class ApiGatewayWidgets {
    constructor(logger, region, config, apiGatewayName) {
        this.logger = logger;
        this.region = region;
        this.config = config;
        this.apiGatewayName = apiGatewayName;
    }

    create() {
        const apiGatewayWidgets = this.config.widgets.reduce((acc, widget) => {
            const widgetMetrics = this.getMetrics(widget.metrics);
            const widgetName = 'ApiGateway: ' + widget.name;
            const widgetFactory = new Widget(this.logger, this.region, widgetName, widgetMetrics);
            acc.push(widgetFactory.create());
            return acc
        }, [])
        return apiGatewayWidgets;
    }

    getMetrics(metricsConfig) {
        return metricsConfig.map((metric) => {
            return  [ 'AWS/ApiGateway', metric.name, 'ApiName', this.apiGatewayName , { 'stat': metric.stat } ]
        })
    }

}
module.exports = ApiGatewayWidgets
