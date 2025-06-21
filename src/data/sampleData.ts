import { SystemData } from '../types/ComponentTypes';

export const sampleSystemData: SystemData = {
  "components": [
    {
      "name": "Raw Streaming Jobs",
      "id": "raw",
      "components": [
        {
          "name": "Ads DCI",
          "id": "dci",
          "components": [
            ""
          ],
          "app_ui_link": "http://app-ui-link.to-open-in-new-tab",
          "metrics_ui_link": "http://metrics-ui-link.to-open-in-new-tab",
          "labels": [
            {
              "label": "type",
              "value": "spark-streaming"
            },
            {
              "label": "lag",
              "value": "$eval(http://get-metric-value)"
            }
          ],
          "connections": [
            "bdm"
          ]
        },
        {
          "name": "Ads DCC",
          "id": "dcc",
          "components": [
            ""
          ],
          "app_ui_link": "http://app-ui-link.to-open-in-new-tab",
          "metrics_ui_link": "http://metrics-ui-link.to-open-in-new-tab",
          "labels": [
            {
              "label": "type",
              "value": "spark-streaming"
            },
            {
              "label": "lag",
              "value": "$eval(http://get-metric-value)"
            }
          ],
          "connections": [
            "bdm"
          ]
        }
      ],
      "app_ui_link": "http://app-ui-link.to-open-in-new-tab",
      "metrics_ui_link": "http://metrics-ui-link.to-open-in-new-tab",
      "labels": [
        {
          "label": "Type",
          "value": "Spark Streaming"
        },
        {
          "label": "Lag",
          "value": "$eval(http://get-metric-value)"
        }
      ],
      "connections": []
    },
    {
      "name": "Batch Jobs",
      "id": "batch",
      "components": [
        {
          "name": "Corrected Job",
          "id": "corrected",
          "components": [
            ""
          ],
          "app_ui_link": "http://app-ui-link.to-open-in-new-tab",
          "metrics_ui_link": "http://metrics-ui-link.to-open-in-new-tab",
          "labels": [
            {
              "label": "type",
              "value": "azkaban"
            },
            {
              "label": "lag",
              "value": "$eval(http://get-metric-value)"
            }
          ],
          "connections": [
            "bdm"
          ]
        }
      ],
      "app_ui_link": "http://app-ui-link.to-open-in-new-tab",
      "metrics_ui_link": "http://metrics-ui-link.to-open-in-new-tab",
      "labels": [
        {
          "label": "type",
          "value": "azkaban"
        },
        {
          "label": "last-run",
          "value": "$eval(http://get-metric-value)"
        }
      ],
      "connections": []
    },
    {
      "name": "Indexer",
      "id": "indexer",
      "components": [
        ""
      ],
      "app_ui_link": "http://app-ui-link.to-open-in-new-tab",
      "metrics_ui_link": "http://metrics-ui-link.to-open-in-new-tab",
      "labels": [
        {
          "label": "type",
          "value": "drop-wizard"
        },
        {
          "label": "lag",
          "value": "$eval(http://get-metric-value)"
        }
      ],
      "connections": [
        "bdm"
      ]
    },
    {
      "name": "BDM",
      "id": "bdm",
      "components": [
        ""
      ],
      "app_ui_link": "http://app-ui-link.to-open-in-new-tab",
      "metrics_ui_link": "http://metrics-ui-link.to-open-in-new-tab",
      "labels": [
        {
          "label": "Type",
          "value": "Spark Streaming"
        },
        {
          "label": "Lag",
          "value": "$eval(http://get-metric-value)"
        }
      ],
      "connections": []
    }
  ]
};
