/**
 * AWS Bedrock Configuration
 * Centralized configuration for AWS Bedrock Agent integration
 */

export const bedrockConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  agentId: process.env.BEDROCK_AGENT_ID || '',
  agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID || '',
  knowledgeBaseId: process.env.BEDROCK_KNOWLEDGE_BASE_ID || '',
  modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  },

  // Knowledge Base Configuration
  knowledgeBase: {
    s3Bucket: process.env.BEDROCK_KB_BUCKET || '',
    s3Prefix: 'knowledge-base/',
    chunkingStrategy: 'FIXED_SIZE' as const,
    maxTokens: 500,
    overlapPercentage: 20
  },

  // Agent Configuration
  agent: {
    maxTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
    stopSequences: [],
    guardrailId: process.env.BEDROCK_GUARDRAIL_ID || '',
    guardrailVersion: process.env.BEDROCK_GUARDRAIL_VERSION || 'DRAFT'
  },

  // Action Groups Configuration
  actionGroups: {
    assessmentContext: {
      name: 'AssessmentContextActions',
      description: 'Retrieve assessment context and metric details',
      apiSchema: {
        getMetricDetails: {
          description: 'Get detailed information about a specific metric',
          parameters: {
            metric_id: { type: 'string', required: true }
          }
        },
        getCurrentProgress: {
          description: 'Get current assessment progress and completion status',
          parameters: {
            session_id: { type: 'string', required: true }
          }
        }
      }
    },
    calculations: {
      name: 'CalculationActions',
      description: 'Calculate preliminary scores and maturity levels',
      apiSchema: {
        calculatePreliminaryScore: {
          description: 'Calculate preliminary maturity score based on current answers',
          parameters: {
            session_id: { type: 'string', required: true }
          }
        }
      }
    }
  }
};

// Validate configuration
export function validateBedrockConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!bedrockConfig.agentId) {
    errors.push('BEDROCK_AGENT_ID is not configured');
  }

  if (!bedrockConfig.agentAliasId) {
    errors.push('BEDROCK_AGENT_ALIAS_ID is not configured');
  }

  if (!bedrockConfig.credentials.accessKeyId) {
    errors.push('AWS_ACCESS_KEY_ID is not configured');
  }

  if (!bedrockConfig.credentials.secretAccessKey) {
    errors.push('AWS_SECRET_ACCESS_KEY is not configured');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export default bedrockConfig;
