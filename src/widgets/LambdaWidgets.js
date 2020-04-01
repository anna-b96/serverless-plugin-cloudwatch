'use strict'
const Widget = require('../model/Widget')


class LambdaWidgets {

    constructor(region, config, functionNames) {
        this.region = region;
        this.config = config; //all widgets includig name, metrics and stats
        this.functionNames = functionNames;
    }


    create() {
        return this.config.widgets.reduce((acc, widget) => {
            const widgets = this.perFunction(widget.name, widget.metrics)
            acc.unshift(widgets)
            return acc
        }, [])
    }


    perFunction (name, metrics) {
        const widgetName = name;

        var widgetMetrics = this.functionNames
            .map(functionName => this.getMetrics(functionName, metrics ))
        var initial = [];
        var concat = (widgetMetrics) => {widgetMetrics.forEach(function (item) { initial = initial.concat(item)}); return initial}
        const widget = new Widget(this.region, widgetName, concat(widgetMetrics))
        return widget.create();
    }


    getMetrics(name, metrics) {
        const functionMetrics = metrics.map(metric =>  ['AWS/Lambda', metric.name, 'FunctionName', name, {'stat': metric.stat }])
        return functionMetrics

    }
}

module.exports = LambdaWidgets
