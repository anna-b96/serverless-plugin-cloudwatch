'use strict'

class Dashboard {
  constructor (name, widgets) {
    this.name = name
    this.widgets = widgets
  }

  create () {
    return {
      // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cloudwatch-dashboard.html
      // AWS::CloudWatch::Dashboard resource specifies an Amazon CloudWatch dashboard. All dashboards are global
      Type: 'AWS::CloudWatch::Dashboard',
      Properties: {
        // If you do not specify a name, one will be generated automatically.
        DashboardName: this.name,
        /* The detailed information about the dashboard in JSON format,
        including an array of 0- 100 widgets and their location on the dashboard. This parameter is required.
        https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/CloudWatch-Dashboard-Body-Structure.html
        DashboardBody Structure:
          widgets?: array of 0-100 widgets
          start?: start of the time range to use for each widget on the dashboard
                 absolut: ISO 8601 format. For ex, 2018-12-17T06:00:00.000Z. relative: -(PT|P)[1-12](M|H|D|W)
          end?   only absolute. If end, than also start must be there
          periodOverride? auto | inherit
        */
        DashboardBody: JSON.stringify({ widgets: this.widgets })
      }
    }
  }
}

module.exports = Dashboard
