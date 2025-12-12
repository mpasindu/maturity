/**
 * Simplified Bedrock Chat Service using Direct HTTP Requests
 * Works with Bedrock Marketplace API Keys
 * Supports Knowledge Base when AWS credentials are available
 */

import https from 'https';
import { prisma } from './database';
import { 
  BedrockAgentRuntimeClient, 
  RetrieveAndGenerateCommand,
  RetrieveAndGenerateCommandInput,
} from '@aws-sdk/client-bedrock-agent-runtime';

const API_KEY = process.env.BEDROCK_API_KEY;
const REGION = process.env.AWS_REGION || 'us-east-1';
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
const KB_ID = process.env.BEDROCK_KB_ID; // Knowledge Base ID

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AssessmentContext {
  pillarName: string;
  pillarDescription: string;
  topicName: string;
  topicDescription: string;
  metricName: string;
  metricDescription: string;
  currentScore?: number;
  evidence?: string;
  projectInfo?: string;
}

/**
 * Invoke Claude via Bedrock using direct HTTP request
 */
async function invokeBedrockModel(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = []
): Promise<{ response?: string; error?: string }> {
  if (!API_KEY) {
    return { error: 'BEDROCK_API_KEY not configured' };
  }

  try {
    const messages = [
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: userMessage,
      },
    ];

    const payload = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    const response = await new Promise<string>((resolve, reject) => {
      const options = {
        hostname: `bedrock-runtime.${REGION}.amazonaws.com`,
        port: 443,
        path: `/model/${MODEL_ID}/invoke`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Accept': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`Bedrock API returned ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(payload);
      req.end();
    });

    const responseData = JSON.parse(response);
    return { response: responseData.content[0].text };
  } catch (error: any) {
    console.error('Bedrock invocation error:', error);
    return { error: error.message || 'Failed to invoke Bedrock model' };
  }
}

/**
 * Invoke Claude with Knowledge Base using AWS SDK (requires AWS credentials)
 */
async function invokeBedrockWithKB(
  userMessage: string,
  context: AssessmentContext,
  sessionId?: string
): Promise<{ response?: string; error?: string; citations?: any[] }> {
  if (!KB_ID) {
    console.warn('BEDROCK_KB_ID not configured, falling back to direct model invocation');
    const systemPrompt = buildSystemPrompt(context);
    return invokeBedrockModel(systemPrompt, userMessage);
  }

  try {
    // Use AWS SDK which handles SigV4 signing automatically
    const client = new BedrockAgentRuntimeClient({ region: REGION });
    
    // For KB, we need the base model ID, not the inference profile
    // Convert us.anthropic.claude-3-5-sonnet-20241022-v2:0 -> anthropic.claude-3-5-sonnet-20241022-v2:0
    const kbModelId = MODEL_ID.replace(/^us\./, '');
    
    const input: RetrieveAndGenerateCommandInput = {
      input: {
        text: userMessage,
      },
      retrieveAndGenerateConfiguration: {
        type: 'KNOWLEDGE_BASE',
        knowledgeBaseConfiguration: {
          knowledgeBaseId: KB_ID,
          modelArn: `arn:aws:bedrock:${REGION}::foundation-model/${kbModelId}`,
          retrievalConfiguration: {
            vectorSearchConfiguration: {
              numberOfResults: 5,
            },
          },
        },
      },
    };

    if (sessionId) {
      input.sessionId = sessionId;
    }

    const command = new RetrieveAndGenerateCommand(input);
    const response = await client.send(command);
    
    console.log('KB Response:', {
      hasOutput: !!response.output,
      text: response.output?.text?.substring(0, 100),
      citationsCount: response.citations?.length || 0,
    });
    
    return {
      response: response.output?.text || '',
      citations: response.citations || [],
    };
  } catch (error: any) {
    console.error('Bedrock KB invocation error:', error.message);
    
    // If credentials not configured or expired, fall back to direct model
    if (
      error.message?.includes('credentials') || 
      error.message?.includes('signature') ||
      error.message?.includes('expired') ||
      error.message?.includes('ExpiredToken')
    ) {
      console.log('AWS credentials not available or expired, falling back to direct model invocation...');
      const systemPrompt = buildSystemPrompt(context);
      return invokeBedrockModel(systemPrompt, userMessage);
    }
    
    // For other errors, also fall back but log the error
    console.log('KB error, falling back to direct model:', error.message);
    const systemPrompt = buildSystemPrompt(context);
    return invokeBedrockModel(systemPrompt, userMessage);
  }
}

/**
 * Build system prompt with assessment context
 */
function buildSystemPrompt(context: AssessmentContext): string {
  return `You are an expert Enterprise Architecture Maturity Assessment assistant helping evaluate AWS Cloud Excellence maturity.

## Current Assessment Context:

**Pillar**: ${context.pillarName}
${context.pillarDescription}

**Topic**: ${context.topicName}
${context.topicDescription}

**Metric**: ${context.metricName}
${context.metricDescription}

${context.currentScore !== undefined ? `**Current Score**: ${context.currentScore}/5` : ''}
${context.evidence ? `**Evidence Provided**: ${context.evidence}` : ''}
${context.projectInfo ? `**Project Context**: ${context.projectInfo}` : ''}

## Your Role:

1. Help users understand what this metric measures
2. Suggest appropriate maturity scores based on their situation
3. Recommend evidence they should provide
4. Explain how to improve to higher maturity levels
5. Share AWS best practices relevant to this metric

## Maturity Framework:

- **Level 1 (Initial)**: Ad-hoc, reactive, undocumented
- **Level 2 (Developing)**: Some processes, basic documentation
- **Level 3 (Defined)**: Documented, consistently applied
- **Level 4 (Managed)**: Quantitatively managed, metrics-driven
- **Level 5 (Optimizing)**: Continuous improvement, innovation

Be specific, actionable, and concise. Reference AWS services and best practices when relevant.`;
}

/**
 * Chat with Claude using assessment context and Knowledge Base
 */
export async function chatWithClaude(
  userMessage: string,
  context: AssessmentContext,
  history: ChatMessage[] = []
): Promise<{ response?: string; error?: string; citations?: any[] }> {
  // If KB is configured, use KB-enhanced chat
  if (KB_ID) {
    // Add context to the user message for better KB retrieval
    const enhancedMessage = `
Context: Evaluating ${context.metricName} in ${context.pillarName} pillar.
Metric Description: ${context.metricDescription}
${context.currentScore !== undefined ? `Current Score: ${context.currentScore}/5` : ''}
${context.projectInfo ? `Project: ${context.projectInfo}` : ''}

User Question: ${userMessage}`;

    return await invokeBedrockWithKB(enhancedMessage, context);
  }

  // Fallback to direct model invocation without KB
  const systemPrompt = buildSystemPrompt(context);
  return await invokeBedrockModel(systemPrompt, userMessage, history);
}

/**
 * Get assessment context from database
 */
export async function getAssessmentContext(
  metricId: string,
  sessionId?: string,
  projectInfo?: string
): Promise<AssessmentContext | null> {
  try {
    const metric = await prisma.metric.findUnique({
      where: { id: metricId },
      include: {
        topic: {
          include: {
            pillar: true,
          },
        },
      },
    });

    if (!metric || !metric.topic) {
      return null;
    }

    // Get current assessment result if session provided
    let currentScore: number | undefined;
    let evidence: string | undefined;

    if (sessionId) {
      const result = await prisma.assessmentResult.findFirst({
        where: {
          sessionId,
          metricId,
        },
      });

      if (result) {
        currentScore = Number(result.value);
        evidence = result.notes || undefined;
      }
    }

    return {
      pillarName: metric.topic.pillar.name,
      pillarDescription: metric.topic.pillar.description || '',
      topicName: metric.topic.name,
      topicDescription: metric.topic.description || '',
      metricName: metric.name,
      metricDescription: metric.description || '',
      currentScore,
      evidence,
      projectInfo,
    };
  } catch (error) {
    console.error('Error getting assessment context:', error);
    return null;
  }
}

/**
 * Get quick suggestions for common questions
 */
export function getQuickPrompts(context: AssessmentContext): string[] {
  return [
    'What does this metric measure?',
    'What would Level 3 look like for our project?',
    `We ${context.projectInfo || 'are implementing this'}. What score should we choose?`,
    'What evidence should we provide?',
    'How can we improve to the next level?',
    'What are AWS best practices for this?',
  ];
}

/**
 * Store chat message in database
 */
export async function saveChatMessage(
  sessionId: string,
  metricId: string,
  userMessage: string,
  assistantResponse: string,
  userId: string = 'system'
) {
  try {
    // Find or create conversation for this session/metric
    let conversation = await prisma.bedrockConversation.findFirst({
      where: {
        sessionId,
      },
    });

    if (!conversation) {
      conversation = await prisma.bedrockConversation.create({
        data: {
          sessionId,
          userId,
          status: 'ACTIVE',
          contextSnapshot: {
            metricId,
          },
        },
      });
    }

    // Save both messages
    await prisma.bedrockMessage.createMany({
      data: [
        {
          conversationId: conversation.id,
          role: 'USER',
          content: userMessage,
          metricId,
          messageType: 'QUESTION',
        },
        {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: assistantResponse,
          metricId,
          messageType: 'ANSWER',
          modelId: MODEL_ID,
        },
      ],
    });

    // Update conversation last interaction time
    await prisma.bedrockConversation.update({
      where: { id: conversation.id },
      data: { lastInteractionAt: new Date() },
    });
  } catch (error) {
    console.error('Error saving chat message:', error);
  }
}

/**
 * Get chat history for a session/metric
 */
export async function getChatHistory(
  sessionId: string,
  metricId: string
): Promise<ChatMessage[]> {
  try {
    const conversation = await prisma.bedrockConversation.findFirst({
      where: { sessionId },
      include: {
        messages: {
          where: { metricId },
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
      },
    });

    if (!conversation) {
      return [];
    }

    return conversation.messages.map((msg: any) => ({
      role: msg.role === 'USER' ? 'user' : 'assistant',
      content: msg.content,
    }));
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
  }
}
