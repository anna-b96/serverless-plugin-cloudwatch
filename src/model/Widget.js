'use strict'

class Widget {
  /*
  24-column dashboard grid
  fields of a widget:
   type:  metric | text | log
   x?:    0 -23
   y?:    >= 0
   width?: 1-24, default 6
   height?: 1-1000, default 6
   properties: differ depending on the widget type

   1. log widget object: represents the results of a CloudWatch Logs Insights query
   properties fields:
   region:  of the logs query
   title?:  title displayed by the widget
   query:   CloudWatch Logs Insights query function. For example, query of two log groups
            "query": "SOURCE 'service_log1' | SOURCE 'service_log2' |filter Fault > 0\n| fields Fault.Message\n| stats count(*) by Canary.Name, Fault.Message"
   view?:    Specifies how the query results are displayed. table | timeSeries | bar

   2. metric widget object
   properties fields:
   metrics:   array to include one or more metrics (without alarms), math expressions, or search expressions.
              each metric has the format [Namespace, MetricName, [{DimensionName,DimensionValue}...] [Rendering Properties Object] ]
              each expression has the format [ {"expression" : "Expression", ["label" : "label] , ["id" : Id] }]
              https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/CloudWatch-Dashboard-Body-Structure.html#CloudWatch-Dashboard-Properties-Metrics-Array-Format
   accountId?:useful for cross-account dashboards that include widgets from multiple accounts
              https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Cross-Account-Cross-Region.html
   annotations?:only required if metrics is not specified. https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/CloudWatch-Dashboard-Body-Structure.html#CloudWatch-Dashboard-Properties-Annotation-Format
   title?:    title displayed by the widget
   period?;   length of time represented by one data point on the graph. default 300 (valid: +=60 s)
   region:    region of the metric
   stat?:     This default can be overridden within the definition of each individual metric in the metrics array. Valid Values: SampleCount | Average | Sum | Minimum | Maximum | p??
   view?:     "timeSeries" for graph, "singleValue" for number
   stacked?:  true | false  (graph as stacked line | seperate lines)
   yAxis?:    mins and maxs of the y-axis. https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/CloudWatch-Dashboard-Body-Structure.html#CloudWatch-Dashboard-Properties-YAxis-Properties-Format

   3. text widget object
   properties field:
   markdown:  string, text to be displayed. https://docs.aws.amazon.com/awsconsolehelpdocs/latest/gsg/aws-markdown.html
   */
  constructor (logger, region, name, metrics, view = 'timeSeries') {
    this.logger = logger;
    this.region = region
    this.name = name
    this.metrics = metrics
    this.view = view;
  }

  create () {
    try {
      this.logger(`Dev Log: create Widget with metrics: ${JSON.stringify(this.metrics)}`)
    }
    catch(err) {
      this.logger(`Dev Log: Error Widgets`)
    }

    var height = 6;
    var width = 6;

    if (this.view == 'timeSeries') {
      width = 24;
    }
    return {
      type: 'metric',
      width: width,
      height: height,
      properties: {
        region: this.region,
        title: this.name,
        metrics: this.metrics,
        stat: 'Sum',
        view: this.view,
        stacked: false,
        period: 300 // with period 60 you pay for the metric
      }
    }
  }
}

module.exports = Widget
