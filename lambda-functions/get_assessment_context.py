"""
AWS Lambda Function: Get Assessment Context
Action Group: AssessmentContextActions

This Lambda function retrieves comprehensive context about an assessment session
to help the Bedrock Agent provide relevant, context-aware recommendations.

Inputs:
  - sessionId: UUID of the assessment session

Outputs:
  - Session details (status, progress, current pillar/topic)
  - Assessment target information
  - Progress statistics
  - Recent activity
  
IAM Permissions Required:
  - RDS Data API: Read access
  - Secrets Manager: Read database credentials
  - CloudWatch Logs: Write access
"""

import json
import boto3
import os
from typing import Dict, Any
from datetime import datetime

# Initialize AWS clients
rds_data = boto3.client('rds-data')

# Configuration
DB_CLUSTER_ARN = os.environ['DB_CLUSTER_ARN']
DB_SECRET_ARN = os.environ['DB_SECRET_ARN']
DB_NAME = os.environ.get('DB_NAME', 'maturity_assessment')


def get_session_details(session_id: str) -> Dict[str, Any]:
    """Get comprehensive assessment session context"""
    
    # Query session with target, current pillar
    session_query = """
        SELECT 
            s.id,
            s.status,
            s.started_at,
            s.completed_at,
            s.last_modified,
            s.current_pillar_id,
            s.progress_data,
            t.id as target_id,
            t.name as target_name,
            t.type as target_type,
            t.description as target_description,
            p.id as pillar_id,
            p.name as pillar_name,
            o.id as org_id,
            o.name as org_name
        FROM assessment_sessions s
        JOIN assessment_targets t ON s.target_id = t.id
        LEFT JOIN maturity_pillars p ON s.current_pillar_id = p.id
        LEFT JOIN organizations o ON t.organization_id = o.id
        WHERE s.id = :session_id
    """
    
    try:
        response = rds_data.execute_statement(
            resourceArn=DB_CLUSTER_ARN,
            secretArn=DB_SECRET_ARN,
            database=DB_NAME,
            sql=session_query,
            parameters=[
                {'name': 'session_id', 'value': {'stringValue': session_id}}
            ]
        )
        
        if not response['records']:
            return {
                'error': f'Assessment session not found: {session_id}',
                'session_id': session_id
            }
        
        record = response['records'][0]
        
        # Parse session data
        session_data = {
            'session': {
                'id': session_id,
                'status': record[1]['stringValue'],
                'started_at': record[2]['stringValue'],
                'completed_at': record[3].get('stringValue') if record[3].get('isNull') is False else None,
                'last_modified': record[4]['stringValue'],
                'current_pillar_id': record[5].get('stringValue') if record[5].get('isNull') is False else None
            },
            'target': {
                'id': record[7]['stringValue'],
                'name': record[8]['stringValue'],
                'type': record[9]['stringValue'],
                'description': record[10].get('stringValue', '')
            },
            'current_pillar': {
                'id': record[11].get('stringValue') if record[11].get('isNull') is False else None,
                'name': record[12].get('stringValue') if record[12].get('isNull') is False else None
            } if record[11].get('isNull') is False else None,
            'organization': {
                'id': record[13].get('stringValue') if record[13].get('isNull') is False else None,
                'name': record[14].get('stringValue') if record[14].get('isNull') is False else None
            } if record[13].get('isNull') is False else None
        }
        
        # Get progress statistics
        progress_query = """
            SELECT 
                COUNT(*) as answered_count,
                MIN(ar.assessed_at) as first_answer,
                MAX(ar.assessed_at) as last_answer
            FROM assessment_results ar
            WHERE ar.session_id = :session_id
        """
        
        progress_response = rds_data.execute_statement(
            resourceArn=DB_CLUSTER_ARN,
            secretArn=DB_SECRET_ARN,
            database=DB_NAME,
            sql=progress_query,
            parameters=[
                {'name': 'session_id', 'value': {'stringValue': session_id}}
            ]
        )
        
        progress_record = progress_response['records'][0]
        
        # Get total metrics count
        total_metrics_query = """
            SELECT COUNT(*) FROM metrics WHERE active = true
        """
        
        total_response = rds_data.execute_statement(
            resourceArn=DB_CLUSTER_ARN,
            secretArn=DB_SECRET_ARN,
            database=DB_NAME,
            sql=total_metrics_query
        )
        
        total_metrics = total_response['records'][0][0]['longValue']
        answered_count = progress_record[0]['longValue']
        
        session_data['progress'] = {
            'total_metrics': total_metrics,
            'answered_metrics': answered_count,
            'remaining_metrics': total_metrics - answered_count,
            'completion_percentage': round((answered_count / total_metrics * 100), 1) if total_metrics > 0 else 0,
            'first_answer_at': progress_record[1].get('stringValue') if progress_record[1].get('isNull') is False else None,
            'last_answer_at': progress_record[2].get('stringValue') if progress_record[2].get('isNull') is False else None
        }
        
        # Get recent answers (last 5)
        recent_answers_query = """
            SELECT 
                ar.id,
                ar.value,
                ar.assessed_at,
                m.name as metric_name,
                t.name as topic_name,
                p.name as pillar_name
            FROM assessment_results ar
            JOIN metrics m ON ar.metric_id = m.id
            JOIN assessment_topics t ON m.topic_id = t.id
            JOIN maturity_pillars p ON t.pillar_id = p.id
            WHERE ar.session_id = :session_id
            ORDER BY ar.assessed_at DESC
            LIMIT 5
        """
        
        recent_response = rds_data.execute_statement(
            resourceArn=DB_CLUSTER_ARN,
            secretArn=DB_SECRET_ARN,
            database=DB_NAME,
            sql=recent_answers_query,
            parameters=[
                {'name': 'session_id', 'value': {'stringValue': session_id}}
            ]
        )
        
        recent_answers = []
        for rec in recent_response.get('records', []):
            recent_answers.append({
                'id': rec[0]['stringValue'],
                'value': float(rec[1]['stringValue']),
                'assessed_at': rec[2]['stringValue'],
                'metric_name': rec[3]['stringValue'],
                'topic_name': rec[4]['stringValue'],
                'pillar_name': rec[5]['stringValue']
            })
        
        session_data['recent_activity'] = recent_answers
        
        # Get pillar progress breakdown
        pillar_progress_query = """
            SELECT 
                p.id,
                p.name,
                COUNT(DISTINCT ar.id) as answered,
                COUNT(DISTINCT m.id) as total
            FROM maturity_pillars p
            LEFT JOIN assessment_topics t ON p.id = t.pillar_id
            LEFT JOIN metrics m ON t.id = m.topic_id AND m.active = true
            LEFT JOIN assessment_results ar ON m.id = ar.metric_id AND ar.session_id = :session_id
            WHERE p.is_active = true
            GROUP BY p.id, p.name
            ORDER BY p.name
        """
        
        pillar_progress_response = rds_data.execute_statement(
            resourceArn=DB_CLUSTER_ARN,
            secretArn=DB_SECRET_ARN,
            database=DB_NAME,
            sql=pillar_progress_query,
            parameters=[
                {'name': 'session_id', 'value': {'stringValue': session_id}}
            ]
        )
        
        pillar_progress = []
        for rec in pillar_progress_response.get('records', []):
            total = rec[3]['longValue']
            answered = rec[2]['longValue']
            pillar_progress.append({
                'pillar_id': rec[0]['stringValue'],
                'pillar_name': rec[1]['stringValue'],
                'answered': answered,
                'total': total,
                'completion_percentage': round((answered / total * 100), 1) if total > 0 else 0
            })
        
        session_data['pillar_progress'] = pillar_progress
        
        return session_data
        
    except Exception as e:
        print(f'Error getting session details: {str(e)}')
        import traceback
        traceback.print_exc()
        return {
            'error': str(e),
            'session_id': session_id
        }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for Bedrock Agent action group
    
    Returns comprehensive assessment session context for AI recommendations
    """
    
    print(f'Received event: {json.dumps(event)}')
    
    try:
        # Extract session ID from parameters
        session_id = None
        for param in event.get('parameters', []):
            if param['name'] == 'sessionId':
                session_id = param['value']
                break
        
        if not session_id:
            raise ValueError('sessionId parameter is required')
        
        # Get session context
        session_context = get_session_details(session_id)
        
        # Format response for Bedrock Agent
        response = {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event['actionGroup'],
                'apiPath': event['apiPath'],
                'httpMethod': event['httpMethod'],
                'httpStatusCode': 200 if 'error' not in session_context else 404,
                'responseBody': {
                    'application/json': {
                        'body': json.dumps(session_context)
                    }
                }
            },
            'sessionAttributes': event.get('sessionAttributes', {}),
            'promptSessionAttributes': event.get('promptSessionAttributes', {})
        }
        
        print(f'Returning context for session: {session_id}')
        if 'progress' in session_context:
            print(f'Progress: {session_context["progress"]["completion_percentage"]}% complete')
        
        return response
        
    except Exception as e:
        print(f'Error in lambda_handler: {str(e)}')
        
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
                            'message': 'Failed to get assessment context'
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
        'apiPath': '/session/context',
        'httpMethod': 'GET',
        'parameters': [
            {
                'name': 'sessionId',
                'type': 'string',
                'value': 'test-session-id-123'
            }
        ],
        'sessionId': 'test-session',
        'sessionAttributes': {},
        'promptSessionAttributes': {}
    }
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))
