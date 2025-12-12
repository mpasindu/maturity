"""
AWS Lambda Function: Get Metric Details
Action Group: AssessmentContextActions

This Lambda function retrieves detailed information about assessment metrics
for the Bedrock Agent to provide context-aware recommendations.

Inputs:
  - metricId: UUID of the metric

Outputs:
  - Full metric details including criteria, examples, best practices
  
IAM Permissions Required:
  - RDS Data API: Read access
  - Secrets Manager: Read database credentials
  - CloudWatch Logs: Write access
"""

import json
import boto3
import os
from typing import Dict, Any, List

# Initialize AWS clients
rds_data = boto3.client('rds-data')
secrets_client = boto3.client('secretsmanager')

# Configuration from environment variables
DB_CLUSTER_ARN = os.environ['DB_CLUSTER_ARN']
DB_SECRET_ARN = os.environ['DB_SECRET_ARN']
DB_NAME = os.environ.get('DB_NAME', 'maturity_assessment')


def get_metric_details(metric_id: str) -> Dict[str, Any]:
    """
    Query database for metric details including:
    - Basic info (name, description, level)
    - Associated topic and pillar
    - Criteria for each maturity level
    - Best practices
    - Examples
    """
    
    # Query metric with topic and pillar
    metric_query = """
        SELECT 
            m.id,
            m.name as metric_name,
            m.description as metric_description,
            m.level,
            m.metric_type,
            m.min_value,
            m.max_value,
            m.weight,
            m.tags,
            t.id as topic_id,
            t.name as topic_name,
            t.description as topic_description,
            p.id as pillar_id,
            p.name as pillar_name,
            p.description as pillar_description,
            p.category
        FROM metrics m
        JOIN assessment_topics t ON m.topic_id = t.id
        JOIN maturity_pillars p ON t.pillar_id = p.id
        WHERE m.id = :metric_id AND m.active = true
    """
    
    try:
        response = rds_data.execute_statement(
            resourceArn=DB_CLUSTER_ARN,
            secretArn=DB_SECRET_ARN,
            database=DB_NAME,
            sql=metric_query,
            parameters=[
                {'name': 'metric_id', 'value': {'stringValue': metric_id}}
            ]
        )
        
        if not response['records']:
            return {
                'error': f'Metric not found: {metric_id}',
                'metric_id': metric_id
            }
        
        record = response['records'][0]
        
        # Parse the result
        metric_data = {
            'metric': {
                'id': metric_id,
                'name': record[1]['stringValue'],
                'description': record[2].get('stringValue', ''),
                'level': record[3]['longValue'],
                'type': record[4]['stringValue'],
                'minValue': float(record[5]['stringValue']),
                'maxValue': float(record[6]['stringValue']),
                'weight': float(record[7]['stringValue']),
                'tags': json.loads(record[8].get('stringValue', '[]'))
            },
            'topic': {
                'id': record[9]['stringValue'],
                'name': record[10]['stringValue'],
                'description': record[11].get('stringValue', '')
            },
            'pillar': {
                'id': record[12]['stringValue'],
                'name': record[13]['stringValue'],
                'description': record[14].get('stringValue', ''),
                'category': record[15]['stringValue']
            }
        }
        
        # TODO: In production, also load YAML metadata for:
        # - Detailed criteria for each level (1-5)
        # - Best practices
        # - Examples
        # - Implementation guidance
        
        # For now, provide guidance structure
        metric_data['guidance'] = {
            'criteria_available': f'Check Knowledge Base for {metric_data["metric"]["name"]} criteria',
            'best_practices_source': 'YAML configuration in Knowledge Base',
            'recommendation': f'Focus on Level {metric_data["metric"]["level"]} requirements'
        }
        
        return metric_data
        
    except Exception as e:
        print(f'Error querying metric: {str(e)}')
        return {
            'error': str(e),
            'metric_id': metric_id
        }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for Bedrock Agent action group
    
    Event structure from Bedrock Agent:
    {
        "messageVersion": "1.0",
        "agent": {...},
        "actionGroup": "AssessmentContextActions",
        "apiPath": "/metric/details",
        "httpMethod": "GET",
        "parameters": [
            {
                "name": "metricId",
                "type": "string",
                "value": "uuid-string-here"
            }
        ],
        "sessionId": "session-id",
        "sessionAttributes": {...},
        "promptSessionAttributes": {...}
    }
    """
    
    print(f'Received event: {json.dumps(event)}')
    
    try:
        # Extract metric ID from parameters
        metric_id = None
        for param in event.get('parameters', []):
            if param['name'] == 'metricId':
                metric_id = param['value']
                break
        
        if not metric_id:
            raise ValueError('metricId parameter is required')
        
        # Get metric details
        metric_data = get_metric_details(metric_id)
        
        # Format response for Bedrock Agent
        response = {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event['actionGroup'],
                'apiPath': event['apiPath'],
                'httpMethod': event['httpMethod'],
                'httpStatusCode': 200 if 'error' not in metric_data else 404,
                'responseBody': {
                    'application/json': {
                        'body': json.dumps(metric_data)
                    }
                }
            },
            'sessionAttributes': event.get('sessionAttributes', {}),
            'promptSessionAttributes': event.get('promptSessionAttributes', {})
        }
        
        print(f'Returning response: {json.dumps(response)}')
        return response
        
    except Exception as e:
        print(f'Error in lambda_handler: {str(e)}')
        
        # Return error response
        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event.get('actionGroup', ''),
                'apiPath': event.get('apiPath', ''),
                'httpMethod': event.get('httpMethod', ''),
                'httpStatusCode': 500,
                'responseBody': {
                    'application/json': {
                        'body': json.dumps({
                            'error': str(e),
                            'message': 'Failed to get metric details'
                        })
                    }
                }
            }
        }


# For local testing
if __name__ == '__main__':
    test_event = {
        'messageVersion': '1.0',
        'actionGroup': 'AssessmentContextActions',
        'apiPath': '/metric/details',
        'httpMethod': 'GET',
        'parameters': [
            {
                'name': 'metricId',
                'type': 'string',
                'value': 'test-metric-id-123'
            }
        ],
        'sessionId': 'test-session',
        'sessionAttributes': {},
        'promptSessionAttributes': {}
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))
