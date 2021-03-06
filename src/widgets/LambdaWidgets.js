'use strict'
const Widget = require('../model/Widget')


class LambdaWidgets {

    constructor(logger, region, config, functionNames) {
        this.logger = logger;
        this.region = region;
        this.config = config; //all widgets includig name, metrics and stats
        this.functionNames = functionNames;
    }

    /**
     * creates an array of all lambda widgets.
     * @returns {Array}
     */
    create() {
        const lambdaWidgets = this.config.widgets.reduce((acc, widget) => {
            const widgets = this.perFunction(widget.name, widget.metrics);
            acc.unshift(widgets);
            this.logger(`Dev Log Reduce function ${JSON.stringify(widget)}  widgets ${widgets}`)
            return acc
        }, []);
        this.logger(`Dev Log LambdaWidgets ${JSON.stringify(lambdaWidgets)}`)
        return lambdaWidgets;
    }

    /**
     * For every widget the metrics will be applied to every lambda function
     * @param name
     * @param metrics
     * @returns {{width: number, type: string, properties: {stat: string, view: string, period: number, stacked: boolean, metrics: *, region: *, title: *}, height: number}}: one widget
     */
    perFunction (name, metrics) {
        const widgetName = 'Lambda: ' + name;

        var widgetMetrics = this.functionNames
            .map(functionName => this.getMetrics(functionName, metrics ))
        var initial = [];
        var concat = (widgetMetrics) => {widgetMetrics.forEach(function (item) { initial = initial.concat(item)}); return initial}
        const widget = new Widget(this.logger, this.region, widgetName, concat(widgetMetrics))
        this.logger(`Dev Log Metric per Function ${JSON.stringify(concat(widgetMetrics))}`)
        return widget.create();
    }

    /**
     *
     * @param name
     * @param metrics
     * @returns {Array}
     */
    getMetrics(name, metrics) {
        const functionMetrics = metrics.map(metric =>  ['AWS/Lambda', `${metric.name}`, 'FunctionName', `${name}`, {'stat': `${metric.stat}` }])
        return functionMetrics

    }
}

module.exports = LambdaWidgets
