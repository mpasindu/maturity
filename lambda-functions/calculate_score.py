"""
AWS Lambda Function: Calculate Maturity Score
Action Group: CalculationActions

This Lambda function performs real-time maturity score calculations
during assessments to help the Bedrock Agent provide accurate guidance.

Inputs:
  - sessionId: UUID of the assessment session
  - answers: Optional array of {metricId, value} for what-if scenarios

Outputs:
  - Current maturity scores (overall, per pillar, per topic)
  - Maturity level classification
  - Progress statistics
  
IAM Permissions Required:
  - RDS Data API: Read access
  - Secrets Manager: Read database credentials
  - CloudWatch Logs: Write access
"""

import json
import boto3
import os
from typing import Dict, Any, List, Optional
from decimal import Decimal

# Initialize AWS clients
rds_data = boto3.client('rds-data')

# Configuration
DB_CLUSTER_ARN = os.environ['DB_CLUSTER_ARN']
DB_SECRET_ARN = os.environ['DB_SECRET_ARN']
DB_NAME = os.environ.get('DB_NAME', 'maturity_assessment')


class MaturityCalculator:
    """
    Simplified version of the maturity calculation engine
    Mirrors the logic from /src/lib/maturity-calculator.ts
    """
    
    MATURITY_LEVELS = {
        (0.0, 1.5): 'INITIAL',
        (1.5, 2.5): 'MANAGED',
        (2.5, 3.5): 'DEFINED',
        (3.5, 5.0): 'OPTIMIZING'
    }
    
    @staticmethod
    def get_maturity_level(score: float) -> str:
        """Map numeric score to maturity level"""
        for (min_score, max_score), level in MaturityCalculator.MATURITY_LEVELS.items():
            if min_score <= score < max_score:
                return level
        return 'OPTIMIZING'  # Default for 5.0
    
    @staticmethod
    def calculate_metric_score(metric_value: float, metric_level: int) -> float:
        """
        Calculate normalized metric score
        metric_level represents the answer level (1-5)
        """
        return float(metric_level)
    
    @staticmethod
    def calculate_topic_score(metric_scores: List[Dict[str, Any]]) -> float:
        """Calculate topic score as average of metric scores"""
        if not metric_scores:
            return 0.0
        
        total = sum(m['score'] for m in metric_scores)
        return total / len(metric_scores)
    
    @staticmethod
    def calculate_pillar_score(topic_scores: List[Dict[str, Any]]) -> float:
        """Calculate pillar score as weighted average of topic scores"""
        if not topic_scores:
            return 0.0
        
        weighted_sum = sum(t['score'] * t['weight'] for t in topic_scores)
        total_weight = sum(t['weight'] for t in topic_scores)
        
        return weighted_sum / total_weight if total_weight > 0 else 0.0
    
    @staticmethod
    def calculate_overall_score(pillar_scores: List[Dict[str, Any]]) -> float:
        """Calculate overall score as weighted average of pillar scores"""
        if not pillar_scores:
            return 0.0
        
        weighted_sum = sum(p['score'] * p['weight'] for p in pillar_scores)
        total_weight = sum(p['weight'] for p in pillar_scores)
        
        return weighted_sum / total_weight if total_weight > 0 else 0.0


def get_assessment_results(session_id: str) -> List[Dict[str, Any]]:
    """Get all assessment results for a session"""
    
    query = """
        SELECT 
            ar.id,
            ar.metric_id,
            ar.value,
            m.name as metric_name,
            m.level as metric_level,
            m.weight as metric_weight,
            t.id as topic_id,
            t.name as topic_name,
            t.weight as topic_weight,
            p.id as pillar_id,
            p.name as pillar_name,
            p.weight as pillar_weight
        FROM assessment_results ar
        JOIN metrics m ON ar.metric_id = m.id
        JOIN assessment_topics t ON m.topic_id = t.id
        JOIN maturity_pillars p ON t.pillar_id = p.id
        WHERE ar.session_id = :session_id
        ORDER BY p.name, t.name, m.name
    """
    
    try:
        response = rds_data.execute_statement(
            resourceArn=DB_CLUSTER_ARN,
            secretArn=DB_SECRET_ARN,
            database=DB_NAME,
            sql=query,
            parameters=[
                {'name': 'session_id', 'value': {'stringValue': session_id}}
            ]
        )
        
        results = []
        for record in response.get('records', []):
            results.append({
                'id': record[0]['stringValue'],
                'metric_id': record[1]['stringValue'],
                'value': float(record[2]['stringValue']),
                'metric_name': record[3]['stringValue'],
                'metric_level': record[4]['longValue'],
                'metric_weight': float(record[5]['stringValue']),
                'topic_id': record[6]['stringValue'],
                'topic_name': record[7]['stringValue'],
                'topic_weight': float(record[8]['stringValue']),
                'pillar_id': record[9]['stringValue'],
                'pillar_name': record[10]['stringValue'],
                'pillar_weight': float(record[11]['stringValue'])
            })
        
        return results
        
    except Exception as e:
        print(f'Error getting assessment results: {str(e)}')
        return []


def calculate_scores(session_id: str) -> Dict[str, Any]:
    """Calculate maturity scores for an assessment session"""
    
    # Get all assessment results
    results = get_assessment_results(session_id)
    
    if not results:
        return {
            'session_id': session_id,
            'overall_score': 0.0,
            'maturity_level': 'INITIAL',
            'pillar_scores': [],
            'topic_scores': [],
            'metric_scores': [],
            'statistics': {
                'total_metrics': 0,
                'answered_metrics': 0,
                'completion_percentage': 0.0
            }
        }
    
    calculator = MaturityCalculator()
    
    # Group by pillar -> topic -> metric
    pillar_data = {}
    
    for result in results:
        pillar_id = result['pillar_id']
        topic_id = result['topic_id']
        
        # Initialize pillar
        if pillar_id not in pillar_data:
            pillar_data[pillar_id] = {
                'id': pillar_id,
                'name': result['pillar_name'],
                'weight': result['pillar_weight'],
                'topics': {}
            }
        
        # Initialize topic
        if topic_id not in pillar_data[pillar_id]['topics']:
            pillar_data[pillar_id]['topics'][topic_id] = {
                'id': topic_id,
                'name': result['topic_name'],
                'weight': result['topic_weight'],
                'metrics': []
            }
        
        # Add metric score
        metric_score = calculator.calculate_metric_score(
            result['value'],
            result['metric_level']
        )
        
        pillar_data[pillar_id]['topics'][topic_id]['metrics'].append({
            'id': result['metric_id'],
            'name': result['metric_name'],
            'score': metric_score,
            'weight': result['metric_weight']
        })
    
    # Calculate topic scores
    topic_scores = []
    for pillar in pillar_data.values():
        for topic in pillar['topics'].values():
            topic_score = calculator.calculate_topic_score(topic['metrics'])
            topic_scores.append({
                'id': topic['id'],
                'name': topic['name'],
                'score': round(topic_score, 2),
                'weight': topic['weight'],
                'metric_count': len(topic['metrics'])
            })
            topic['score'] = topic_score
    
    # Calculate pillar scores
    pillar_scores = []
    for pillar in pillar_data.values():
        topics_list = [
            {'score': t['score'], 'weight': t['weight']} 
            for t in pillar['topics'].values()
        ]
        pillar_score = calculator.calculate_pillar_score(topics_list)
        pillar_scores.append({
            'id': pillar['id'],
            'name': pillar['name'],
            'score': round(pillar_score, 2),
            'weight': pillar['weight'],
            'topic_count': len(pillar['topics'])
        })
    
    # Calculate overall score
    overall_score = calculator.calculate_overall_score(pillar_scores)
    maturity_level = calculator.get_maturity_level(overall_score)
    
    # Calculate statistics
    total_metrics_query = """
        SELECT COUNT(*) FROM metrics WHERE active = true
    """
    
    total_metrics_response = rds_data.execute_statement(
        resourceArn=DB_CLUSTER_ARN,
        secretArn=DB_SECRET_ARN,
        database=DB_NAME,
        sql=total_metrics_query
    )
    
    total_metrics = total_metrics_response['records'][0][0]['longValue']
    answered_metrics = len(results)
    completion_percentage = (answered_metrics / total_metrics * 100) if total_metrics > 0 else 0
    
    return {
        'session_id': session_id,
        'overall_score': round(overall_score, 2),
        'maturity_level': maturity_level,
        'pillar_scores': pillar_scores,
        'topic_scores': topic_scores,
        'statistics': {
            'total_metrics': total_metrics,
            'answered_metrics': answered_metrics,
            'completion_percentage': round(completion_percentage, 1)
        },
        'calculation_timestamp': 'real-time',
        'algorithm_version': 'lambda-v1.0'
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for Bedrock Agent action group
    
    Calculates real-time maturity scores for an assessment session
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
        
        # Calculate scores
        calculation_result = calculate_scores(session_id)
        
        # Format response for Bedrock Agent
        response = {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event['actionGroup'],
                'apiPath': event['apiPath'],
                'httpMethod': event['httpMethod'],
                'httpStatusCode': 200,
                'responseBody': {
                    'application/json': {
                        'body': json.dumps(calculation_result)
                    }
                }
            },
            'sessionAttributes': event.get('sessionAttributes', {}),
            'promptSessionAttributes': event.get('promptSessionAttributes', {})
        }
        
        print(f'Calculated scores - Overall: {calculation_result["overall_score"]}, Level: {calculation_result["maturity_level"]}')
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
                            'message': 'Failed to calculate scores'
                        })
                    }
                }
            }
        }


# For local testing
if __name__ == '__main__':
    test_event = {
        'messageVersion': '1.0',
        'actionGroup': 'CalculationActions',
        'apiPath': '/calculate/score',
        'httpMethod': 'POST',
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
