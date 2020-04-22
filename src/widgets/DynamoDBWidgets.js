'use strict'
const Widget = require('../model/Widget')
const ArrayUtil = require('../utils/ArrayUtil')


class DynamoDBWidgets {
    constructor(logger, region, config, tableNames, globalSecondaryIndexNames) {
        this.logger = logger;
        this.region = region;
        this.config = config; //all widgets includig name, metrics, stats and dimension
        this.tableNames = tableNames;
        this.globalSecondaryIndexNames = globalSecondaryIndexNames;
    }

    create() {
        return this.config.widgets.reduce((acc, widget) => {
            const widgetMetrics = this.getMetrics(widget.metrics);
            const widgetName = 'DynamoDB: ' + widget.name;
            const widgetFactory = new Widget(this.logger, this.region, widgetName, widgetMetrics);
            acc.push(widgetFactory.create());
            return acc;
        }, [])
    }

    getMetrics(configMetrics) {
        return configMetrics.reduce((acc, oneMetric) => {
            if (oneMetric.dimension === 'TableName') { this.getMetricPerTableName(oneMetric).map(metric => acc.unshift(metric))}
            if (oneMetric.dimension === 'GlobalSecondaryIndexName') { this.getMetricPerSecondaryIndexName(oneMetric).map(metric => acc.unshift(metric))}
            if (oneMetric.dimension === 'Operation') { this.getMetricPerOperation(oneMetric).map(metric => acc.unshift(metric))}
            if (oneMetric.dimension === 'ReceivingRegion') { acc.unshift(this.getMetricReceivingRegion(oneMetric))}
            if (oneMetric.dimension === 'StreamLabel') { acc.unshift(this.getMetricStreamLabel(oneMetric))}
            if (oneMetric.dimension === null || oneMetric.dimension === undefined) { acc.unshift(this.getMetricAcrossAll(oneMetric))}
            else {this.logger(`DynamoDB: You have entered a non valid dimension ${oneMetric.dimension}`)}
            return acc
        }, [])
    }

    getMetricPerTableName(metric) {
        return this.tableNames.map(name => ['AWS/DynamoDB', metric.name, 'TableName', name, { 'stat': metric.stat }])
    }
    getMetricPerSecondaryIndexName(metric) {
        return ArrayUtil.flatMap(Object.keys(this.globalSecondaryIndexNames), tableName =>
            this.globalSecondaryIndexNames[tableName].map(indexName =>
                [ 'AWS/DynamoDB', metric.name, 'TableName', tableName, 'GlobalSecondaryIndexName', indexName, { 'stat': metric.stat } ]
            )
        )
    }
    getMetricPerOperation(metric) {
        const operations = [ 'Query', 'Scan', 'GetItem', 'PutItem', 'UpdateItem', 'BatchWriteItem', 'DeleteItem', 'BatchGetItem'];
        return ArrayUtil.flatMap(this.tableNames, tableName =>
            operations.map(operation =>
                [ 'AWS/DynamoDB', metric.name, 'TableName', tableName, 'Operation', operation, { 'stat': metric.stat } ]
            )
        )
    }
    getMetricReceivingRegion(metric) {
        return ['AWS/DynamoDB', metric.name, 'ReceivingRegion', { 'stat': metric.stat }]
    }
    getMetricStreamLabel(metric) {
        return ['AWS/DynamoDB', metric.name, 'StreamLabel', { 'stat': metric.stat }]
    }
    getMetricAcrossAll(metric) {
        return ['AWS/DynamoDB', metric.name, { 'stat': metric.stat }]
    }
}
module.exports = DynamoDBWidgets
