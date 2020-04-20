'use strict'

const sinon = require('sinon')
const test = require('ava')
const S3Widgets = require('../../src/widgets/S3Widgets')

const logger = msg => {};
const region = 'eu-central-1';

// ---------------------------------- tests for create() ---------------------------------- //
test('with two widgets and metrics with all different types of dimensions', t => {
    const config = {
        widgets: [
            {
                name: 'daily storage metrics for buckets',
                metrics: [
                    {name: 'BucketSizeBytes', stat: 'Average', dimension: 'BucketName'},
                    {name: 'NumberOfObjects', stat: 'Average', dimension: 'StorageType'}
                ]
            },
            {
                name: 'total request latency',
                metrics: [
                    {name: 'TotalRequestLatency', stat: 'SampleCount'}
                ]
            }],
        enabled: true
    }
    const bucketNames = ['bucket-1', 'bucket-2']

    const s3Widgets = new S3Widgets(logger, region, config, bucketNames);
    const result = s3Widgets.create();

    const expectedWidgets = [{
        type: 'metric',
        width: 24,
        height: 6,
        properties: {
            region: 'eu-central-1',
            title: 'S3: daily storage metrics for buckets',
            metrics: [  ['AWS/S3', 'NumberOfObjects', 'StorageType', { 'stat': 'Average' }],
                ['AWS/S3', 'BucketSizeBytes', 'BucketName', 'bucket-2', { 'stat': 'Average' }],
                ['AWS/S3', 'BucketSizeBytes', 'BucketName', 'bucket-1', { 'stat': 'Average' }],
            ],
            stat: 'Sum',
            view: 'timeSeries',
            stacked: false,
            period: 300
        }
    },
        {
            type: 'metric',
            width: 24,
            height: 6,
            properties: {
                region: 'eu-central-1',
                title: 'S3: total request latency',
                metrics: [['AWS/S3', 'TotalRequestLatency', {'stat': 'SampleCount'}]],
                stat: 'Sum',
                view: 'timeSeries',
                stacked: false,
                period: 300
            }
        }]
    t.deepEqual(result, expectedWidgets);
})


// ---------------------------------- tests for getMetrics() ---------------------------------- //
test('with one metric of dimension BucketName', t => {
    const config = {}
    const bucketNames = ['bucket-1', 'bucket-2']
    const metricsConfig = [  {name: 'BucketSizeBytes', stat: 'Average', dimension: 'BucketName'},];

    const expectedMetrics = [
        ['AWS/S3', 'BucketSizeBytes', 'BucketName', 'bucket-2', { 'stat': 'Average' }],
        ['AWS/S3', 'BucketSizeBytes', 'BucketName', 'bucket-1', { 'stat': 'Average' }]
    ]

    const s3Widgets = new S3Widgets(logger, region, config, bucketNames);
    const result = s3Widgets.getMetrics(metricsConfig);
    t.deepEqual(result, expectedMetrics);
})

test('with one metric of dimension StorageType', t => {
    const config = {}
    const bucketNames = ['bucket-1']
    const metricsConfig = [  {name: 'BucketSizeBytes', stat: 'Average', dimension: 'StorageType'},];

    const expectedMetrics = [
        ['AWS/S3', 'BucketSizeBytes', 'StorageType', { 'stat': 'Average' }]
    ]

    const s3Widgets = new S3Widgets(logger, region, config, bucketNames);
    const result = s3Widgets.getMetrics(metricsConfig);
    t.deepEqual(result, expectedMetrics);
})
