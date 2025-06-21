
import { SystemData } from '../types/ComponentTypes';

export const sampleSystemData: SystemData = {
  "components": [
    {
      "id": "raw",
      "name": "RawJobs",
      "sub_components": [
        {
          "id": "dci",
          "name": "AdsDCI",
          "labels": [
            {
              "label": "Type",
              "evaluator": "Spark Streaming"
            },
            {
              "label": "lag",
              "evaluator": "$curl()"
            }
          ],
          "app_ui_link": "DataProc link to open in new tab",
          "cosmos_link": "Cosmos link to open in new tab"
        },
        {
          "id": "dcc",
          "name": "AdsDCC",
          "labels": [
            {
              "label": "Type",
              "evaluator": "Spark Streaming"
            },
            {
              "label": "lag",
              "evaluator": "$curl()"
            }
          ],
          "app_ui_link": "DataProc link to open in new tab",
          "cosmos_link": "Cosmos link to open in new tab"
        }
      ],
      "labels": [],
      "app_ui_link": "DataProc link to open in new tab",
      "cosmos_link": "Cosmos link to open in new tab"
    },
    {
      "id": "batch",
      "name": "Batch Jobs",
      "sub_components": [
        {
          "id": "corrected",
          "name": "CorrectedJob",
          "labels": [
            {
              "label": "type",
              "evaluator": "Azkaban"
            },
            {
              "label": "lastProcessedBucket",
              "evaluator": "get the value from redis"
            }
          ],
          "app_ui_link": "Azkaban UI Link to the job",
          "cosmos_link": "cosmos link to open in new tab"
        }
      ],
      "labels": [],
      "app_ui_link": "Azkaban UI Link to the project",
      "cosmos_link": "cosmos link to open in new tab"
    },
    {
      "id": "bdm",
      "name": "BDM",
      "sub_components": [],
      "labels": [
        {
          "label": "type",
          "evaluator": "Spark Streaming"
        },
        {
          "label": "lag",
          "evaluator": "get cosmos metrics instantaneous value"
        },
        {
          "label": "lastProcessedBatchTime",
          "evaluator": "expression to get last processed batch time"
        }
      ],
      "app_ui_link": "DataProc UI Link to open in new tab",
      "cosmos_link": "Cosmos link to open in new tab"
    }
  ],
  "connections": [
    {
      "start": "dci",
      "end": "bdm",
      "label": "Kafka Stream",
      "type": "kafka"
    },
    {
      "start": "dcc",
      "end": "bdm",
      "label": "Data Pipeline",
      "type": "stream"
    },
    {
      "start": "corrected",
      "end": "bdm",
      "label": "Batch API",
      "type": "api"
    }
  ]
};
