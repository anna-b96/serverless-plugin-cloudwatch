'use strict'
const Widget = require('../model/Widget')
const ArrayUtil = require('../utils/ArrayUtil')


class S3Widgets {
    constructor(logger, region, config, bucketNames) {
        this.logger = logger;
        this.region = region;
        this.config = config; //all widgets includig name, metrics, stats and dimension
        this.bucketNames = bucketNames;
    }

    create() {
        return this.config.widgets.reduce((acc, widget) => {
            const widgetMetrics = this.getMetrics(widget.metrics);
            const widgetName = 'S3: ' + widget.name;
            const widgetFactory = new Widget(this.logger, this.region, widgetName, widgetMetrics);
            acc.push(widgetFactory.create());
            return acc;
        }, [])
    }

    getMetrics(configMetrics) {
        return configMetrics.reduce((acc, oneMetric) => {
            if (oneMetric.dimension === 'BucketName') {
                this.getMetricPerBucketName(oneMetric).map(metric => acc.unshift(metric))
            }
            if (oneMetric.dimension === 'StorageType') {
                acc.unshift(this.getMetricPerStorageType(oneMetric))
            }
            if (oneMetric.dimension === null || oneMetric.dimension === undefined) {
                acc.unshift(this.getMetricAcrossAll(oneMetric))
            } else {
                this.logger('You have entered a non valid dimension')
            }
            return acc
        }, [])
    }
    getMetricPerBucketName(oneMetric) {
        return this.bucketNames.map((bucket) => ['AWS/S3', oneMetric.name, 'BucketName', bucket, { 'stat': oneMetric.stat }])
    }
    getMetricPerStorageType(oneMetric) {
        return ['AWS/S3', oneMetric.name, 'StorageType', { 'stat': oneMetric.stat }]
    }
    getMetricAcrossAll(oneMetric) {
        return ['AWS/S3', oneMetric.name, { 'stat': oneMetric.stat }]
    }
}
module.exports = S3Widgets
