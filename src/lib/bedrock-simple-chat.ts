/**
 * Simplified Bedrock Chat Service
 * Uses Claude directly via Bedrock Runtime API without Knowledge Base
 * Passes assessment context in the prompt
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { prisma } from './database';

// Parse Bedrock API Key (base64 encoded format: BedrockAPIKey-<region>-at-<account>:<secret>)
function parseBedrockApiKey(apiKey: string): { accessKeyId: string; secretAccessKey: string } | null {
  try {
    const decoded = Buffer.from(apiKey, 'base64').toString('utf-8');
    const [accessKeyId, secretAccessKey] = decoded.split(':');
    return { accessKeyId, secretAccessKey };
  } catch (error) {
    console.error('Failed to parse Bedrock API key:', error);
    return null;
  }
}

// AWS Configuration
let bedrockClient: BedrockRuntimeClient;

if (process.env.BEDROCK_API_KEY) {
  // Use Bedrock API Key (base64 encoded)
  const parsedKey = parseBedrockApiKey(process.env.BEDROCK_API_KEY);
  if (parsedKey) {
    bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: parsedKey.accessKeyId,
        secretAccessKey: parsedKey.secretAccessKey,
      },
    });
  } else {
    throw new Error('Invalid BEDROCK_API_KEY format');
  }
} else {
  // Fall back to standard AWS credentials
  bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      sessionToken: process.env.AWS_SESSION_TOKEN,
    },
  });
}

const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

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

${context.currentScore ? `**Current Score**: Level ${context.currentScore}` : ''}
${context.evidence ? `**Evidence Provided**: ${context.evidence}` : ''}
${context.projectInfo ? `**Project Context**: ${context.projectInfo}` : ''}

## Maturity Levels (1-5):

**Level 1 - Initial**: Ad-hoc processes, reactive, minimal documentation
**Level 2 - Developing**: Basic processes defined, some documentation, inconsistent application
**Level 3 - Defined**: Documented processes, consistently applied, measured
**Level 4 - Managed**: Quantitatively managed, metrics-driven, continuous improvement
**Level 5 - Optimizing**: Continuous optimization, innovation, industry leadership

## Your Role:

1. **Explain** what this metric measures and why it matters
2. **Guide** users on what evidence demonstrates each maturity level
3. **Recommend** appropriate scores based on their project description
4. **Suggest** improvements to reach higher maturity levels
5. **Answer** questions about AWS Cloud Excellence best practices

Be concise, practical, and reference specific AWS Well-Architected Framework principles when relevant.`;
}

/**
 * Chat with Claude about the assessment
 */
export async function chatWithClaude(
  userMessage: string,
  context: AssessmentContext,
  conversationHistory: ChatMessage[] = []
): Promise<{
  response: string;
  error?: string;
}> {
  try {
    // Build the conversation with system prompt
    const messages = [
      ...conversationHistory,
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    // Prepare the request
    const requestBody = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2048,
      temperature: 0.7,
      system: buildSystemPrompt(context),
      messages: messages,
    };

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    // Invoke Claude
    const response = await bedrockClient.send(command);
    
    // Parse response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const assistantMessage = responseBody.content[0].text;

    return {
      response: assistantMessage,
    };
  } catch (error: any) {
    console.error('Bedrock chat error:', error);
    return {
      response: '',
      error: error.message || 'Failed to get response from AI assistant',
    };
  }
}

/**
 * Get assessment context for a metric
 */
export async function getAssessmentContext(
  metricId: string,
  sessionId?: string
): Promise<AssessmentContext | null> {
  try {
    // Get metric with topic and pillar
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

    // Get current assessment response if session provided
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
  userId: string = 'system' // Default user - update when you have auth
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
    // Don't throw - chat still works even if storage fails
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
    // Find conversation for this session
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

    return conversation.messages.map((msg) => ({
      role: msg.role === 'USER' ? 'user' : 'assistant',
      content: msg.content,
    }));
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
  }
}
