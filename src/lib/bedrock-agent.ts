/**
 * AWS Bedrock Agent Service
 * 
 * Core service for interacting with AWS Bedrock Agent to provide AI-powered
 * assessment assistance, recommendations, and evidence analysis.
 * 
 * Features:
 * - Conversation management with context preservation
 * - Real-time AI recommendations during assessments
 * - Evidence analysis and maturity level suggestions
 * - Calculation explanations using assessment data
 * - Knowledge Base integration for metric guidance
 */

import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  RetrieveCommand,
  RetrieveAndGenerateCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { PrismaClient } from '@prisma/client';
import { bedrockConfig } from '@/config/aws-config';

const prisma = new PrismaClient();

// Initialize Bedrock client
const bedrockClient = new BedrockAgentRuntimeClient({
  region: bedrockConfig.region,
  credentials: bedrockConfig.credentials,
});

export interface ConversationContext {
  sessionId: string;
  userId: string;
  currentMetric?: {
    id: string;
    name: string;
    description: string;
    level: number;
    topicId: string;
    topicName: string;
    pillarId: string;
    pillarName: string;
  };
  assessmentData?: {
    answeredMetrics: number;
    totalMetrics: number;
    currentScore?: number;
    completionPercentage: number;
  };
}

export interface BedrockMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  messageType?:
    | 'question'
    | 'answer'
    | 'recommendation'
    | 'clarification'
    | 'evidence_analysis'
    | 'calculation_explanation'
    | 'best_practice'
    | 'context_update';
  metadata?: Record<string, any>;
}

export interface BedrockRecommendation {
  type:
    | 'metric_suggestion'
    | 'evidence_suggestion'
    | 'score_guidance'
    | 'best_practice'
    | 'improvement_path'
    | 'risk_mitigation'
    | 'quick_win';
  title: string;
  description: string;
  confidenceScore: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  impactEstimate?: string;
  supportingCitations?: Array<{
    source: string;
    content: string;
    relevance: number;
  }>;
  relatedMetricIds?: string[];
}

export interface EvidenceAnalysis {
  summary: string;
  maturityLevelSuggestion: number;
  confidenceScore: number;
  strengths: string[];
  gaps: string[];
  alignmentScore: number;
  criteriaMatched: Array<{
    level: number;
    criteria: string;
    matched: boolean;
  }>;
  bestPracticesReferenced: string[];
}

export class BedrockAgentService {
  /**
   * Initialize a new conversation with the Bedrock Agent
   */
  async initConversation(
    sessionId: string,
    userId: string,
    context: ConversationContext
  ): Promise<string> {
    try {
      // Create conversation record in database
      const conversation = await prisma.bedrockConversation.create({
        data: {
          sessionId,
          userId,
          contextSnapshot: context as any,
          status: 'ACTIVE',
        },
      });

      // Send initial context to agent
      const systemMessage = this.buildSystemPrompt(context);
      await this.storeMessage(conversation.id, {
        role: 'system',
        content: systemMessage,
        messageType: 'context_update',
      });

      console.log(`✓ Conversation initialized: ${conversation.id}`);
      return conversation.id;
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      throw new Error('Failed to start AI conversation');
    }
  }

  /**
   * Send a message to the Bedrock Agent and get response
   */
  async sendMessage(
    conversationId: string,
    userMessage: string,
    context?: Partial<ConversationContext>
  ): Promise<BedrockMessage> {
    try {
      // Get conversation
      const conversation = await prisma.bedrockConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20, // Last 20 messages for context
          },
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Store user message
      await this.storeMessage(conversationId, {
        role: 'user',
        content: userMessage,
        messageType: 'question',
      });

      // Build conversation history
      const conversationHistory = conversation.messages.map((msg) => ({
        role: msg.role.toLowerCase(),
        content: msg.content,
      }));

      // Add current user message
      conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // Update context if provided
      let currentContext = (conversation.contextSnapshot || {}) as unknown as ConversationContext;
      if (context) {
        currentContext = { ...currentContext, ...context };
        await prisma.bedrockConversation.update({
          where: { id: conversationId },
          data: { contextSnapshot: currentContext as any },
        });
      }

      // Invoke Bedrock Agent
      const response = await this.invokeAgent(
        conversationHistory,
        currentContext,
        conversation.bedrockSessionId ?? undefined
      );

      // Store assistant response
      const assistantMessage = await this.storeMessage(conversationId, {
        role: 'assistant',
        content: response.content,
        messageType: response.messageType,
        metadata: response.metadata,
      });

      // Update conversation timestamp
      await prisma.bedrockConversation.update({
        where: { id: conversationId },
        data: {
          lastInteractionAt: new Date(),
          bedrockSessionId: response.bedrockSessionId,
        },
      });

      return {
        role: 'assistant',
        content: response.content,
        messageType: response.messageType,
        metadata: response.metadata,
      };
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error('Failed to communicate with AI assistant');
    }
  }

  /**
   * Get AI recommendations for current assessment context
   */
  async getRecommendations(
    sessionId: string,
    context: ConversationContext
  ): Promise<BedrockRecommendation[]> {
    try {
      // Query Knowledge Base for relevant guidance
      const retrieveCommand = new RetrieveCommand({
        knowledgeBaseId: bedrockConfig.knowledgeBaseId,
        retrievalQuery: {
          text: this.buildRecommendationQuery(context),
        },
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: 5,
          },
        },
      });

      const retrieveResponse = await bedrockClient.send(retrieveCommand);

      // Generate recommendations using retrieved context
      const prompt = this.buildRecommendationPrompt(
        context,
        retrieveResponse.retrievalResults || []
      );

      const generateCommand = new RetrieveAndGenerateCommand({
        input: {
          text: prompt,
        },
        retrieveAndGenerateConfiguration: {
          type: 'KNOWLEDGE_BASE',
          knowledgeBaseConfiguration: {
            knowledgeBaseId: bedrockConfig.knowledgeBaseId,
            modelArn: `arn:aws:bedrock:${bedrockConfig.region}::foundation-model/${bedrockConfig.modelId}`,
          },
        },
      });

      const response = await bedrockClient.send(generateCommand);
      const recommendationsText = response.output?.text || '';

      // Parse recommendations from response
      const recommendations = this.parseRecommendations(
        recommendationsText,
        retrieveResponse.retrievalResults || []
      );

      // Store recommendations in database
      for (const rec of recommendations) {
        await prisma.bedrockRecommendation.create({
          data: {
            sessionId,
            recommendationType: rec.type.toUpperCase() as any,
            title: rec.title,
            description: rec.description,
            confidenceScore: rec.confidenceScore,
            priority: rec.priority.toUpperCase() as any,
            impactEstimate: rec.impactEstimate,
            supportingCitations: rec.supportingCitations as any,
            relatedMetrics: rec.relatedMetricIds || [],
            metricId: context.currentMetric?.id,
            topicId: context.currentMetric?.topicId,
            pillarId: context.currentMetric?.pillarId,
          },
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  /**
   * Analyze evidence provided by user for a metric
   */
  async analyzeEvidence(
    conversationId: string,
    sessionId: string,
    metricId: string,
    evidenceText: string,
    evidenceUrls?: string[],
    evidenceType?: string
  ): Promise<EvidenceAnalysis> {
    try {
      // Get metric details
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

      if (!metric) {
        throw new Error('Metric not found');
      }

      // Query Knowledge Base for metric criteria
      const retrieveCommand = new RetrieveCommand({
        knowledgeBaseId: bedrockConfig.knowledgeBaseId,
        retrievalQuery: {
          text: `${metric.name} maturity criteria levels requirements examples`,
        },
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: 3,
          },
        },
      });

      const kbResults = await bedrockClient.send(retrieveCommand);

      // Build analysis prompt
      const analysisPrompt = this.buildEvidenceAnalysisPrompt(
        metric,
        evidenceText,
        kbResults.retrievalResults || []
      );

      // Generate analysis
      const generateCommand = new RetrieveAndGenerateCommand({
        input: {
          text: analysisPrompt,
        },
        retrieveAndGenerateConfiguration: {
          type: 'KNOWLEDGE_BASE',
          knowledgeBaseConfiguration: {
            knowledgeBaseId: bedrockConfig.knowledgeBaseId,
            modelArn: `arn:aws:bedrock:${bedrockConfig.region}::foundation-model/${bedrockConfig.modelId}`,
          },
        },
      });

      const response = await bedrockClient.send(generateCommand);
      const analysisText = response.output?.text || '';

      // Parse analysis
      const analysis = this.parseEvidenceAnalysis(
        analysisText,
        kbResults.retrievalResults || []
      );

      // Store in database
      await prisma.bedrockEvidenceAnalysis.create({
        data: {
          conversationId,
          sessionId,
          metricId,
          evidenceText,
          evidenceUrls: evidenceUrls || [],
          evidenceType: evidenceType?.toUpperCase() as any,
          analysisSummary: analysis.summary,
          maturityLevelSuggestion: analysis.maturityLevelSuggestion,
          confidenceScore: analysis.confidenceScore,
          strengths: analysis.strengths as any,
          gaps: analysis.gaps as any,
          alignmentScore: analysis.alignmentScore,
          criteriaMatched: analysis.criteriaMatched as any,
          bestPracticesReferenced: analysis.bestPracticesReferenced as any,
        },
      });

      return analysis;
    } catch (error) {
      console.error('Failed to analyze evidence:', error);
      throw new Error('Failed to analyze evidence');
    }
  }

  /**
   * Get explanation for maturity calculation
   */
  async explainCalculation(
    conversationId: string,
    calculationId: string
  ): Promise<string> {
    try {
      // Get calculation details
      const calculation = await prisma.maturityCalculation.findUnique({
        where: { id: calculationId },
        include: {
          session: {
            include: {
              target: true,
            },
          },
        },
      });

      if (!calculation) {
        throw new Error('Calculation not found');
      }

      // Build explanation prompt
      const prompt = this.buildCalculationExplanationPrompt(calculation);

      // Get explanation from agent
      const response = await this.sendMessage(conversationId, prompt);

      return response.content;
    } catch (error) {
      console.error('Failed to explain calculation:', error);
      throw new Error('Failed to generate explanation');
    }
  }

  /**
   * End a conversation
   */
  async endConversation(conversationId: string): Promise<void> {
    await prisma.bedrockConversation.update({
      where: { id: conversationId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    });
  }

  // ===================================================================
  // PRIVATE HELPER METHODS
  // ===================================================================

  /**
   * Invoke Bedrock Agent with conversation history
   */
  private async invokeAgent(
    conversationHistory: Array<{ role: string; content: string }>,
    context: ConversationContext,
    sessionId?: string
  ): Promise<{
    content: string;
    messageType: BedrockMessage['messageType'];
    metadata?: Record<string, any>;
    bedrockSessionId?: string;
  }> {
    const latestMessage = conversationHistory[conversationHistory.length - 1];

    const command = new InvokeAgentCommand({
      agentId: bedrockConfig.agentId,
      agentAliasId: bedrockConfig.agentAliasId,
      sessionId: sessionId || undefined,
      inputText: latestMessage.content,
      sessionState: {
        sessionAttributes: {
          assessmentSessionId: context.sessionId,
          userId: context.userId,
          currentMetricId: context.currentMetric?.id || '',
          currentMetricName: context.currentMetric?.name || '',
          currentTopicName: context.currentMetric?.topicName || '',
          currentPillarName: context.currentMetric?.pillarName || '',
          assessmentProgress: context.assessmentData?.completionPercentage?.toString() || '0',
        },
      },
    });

    const response = await bedrockClient.send(command);

    // Aggregate response chunks
    let fullResponse = '';
    const citations: any[] = [];

    if (response.completion) {
      for await (const event of response.completion) {
        if (event.chunk?.bytes) {
          const text = new TextDecoder().decode(event.chunk.bytes);
          fullResponse += text;
        }

        if ('attribution' in event && event.attribution) {
          const attribution = event.attribution as any;
          if (attribution.citations) {
            citations.push(...attribution.citations);
          }
        }
      }
    }

    return {
      content: fullResponse.trim(),
      messageType: 'answer',
      metadata: {
        citations,
        sessionId: response.sessionId,
      },
      bedrockSessionId: response.sessionId,
    };
  }

  /**
   * Store message in database
   */
  private async storeMessage(
    conversationId: string,
    message: BedrockMessage
  ): Promise<any> {
    return prisma.bedrockMessage.create({
      data: {
        conversationId,
        role: message.role.toUpperCase() as any,
        content: message.content,
        messageType: message.messageType?.toUpperCase() as any,
        metadata: message.metadata as any,
      },
    });
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(context: ConversationContext): string {
    return `You are an expert Enterprise Architecture Maturity Assessment assistant. 

Current Context:
- Assessment Session: ${context.sessionId}
- User: ${context.userId}
${context.currentMetric ? `- Current Metric: ${context.currentMetric.name} (Level ${context.currentMetric.level})
- Topic: ${context.currentMetric.topicName}
- Pillar: ${context.currentMetric.pillarName}` : ''}
${context.assessmentData ? `- Progress: ${context.assessmentData.completionPercentage}% complete (${context.assessmentData.answeredMetrics}/${context.assessmentData.totalMetrics} metrics)` : ''}

Your role is to:
1. Guide users through assessments with clear, actionable advice
2. Explain maturity levels and criteria based on the knowledge base
3. Analyze evidence and suggest appropriate maturity scores
4. Provide best practices and recommendations
5. Clarify questions about metrics and scoring

Always be concise, professional, and data-driven. Reference specific criteria from the knowledge base when applicable.`;
  }

  /**
   * Build recommendation query for Knowledge Base
   */
  private buildRecommendationQuery(context: ConversationContext): string {
    if (context.currentMetric) {
      return `${context.currentMetric.pillarName} ${context.currentMetric.topicName} ${context.currentMetric.name} best practices recommendations level ${context.currentMetric.level}`;
    }
    return 'enterprise architecture maturity assessment best practices recommendations';
  }

  /**
   * Build recommendation prompt
   */
  private buildRecommendationPrompt(
    context: ConversationContext,
    kbResults: any[]
  ): string {
    const metricContext = context.currentMetric
      ? `Current metric: ${context.currentMetric.name} (${context.currentMetric.topicName} - ${context.currentMetric.pillarName})`
      : 'General assessment guidance';

    return `Based on the following knowledge base content and assessment context, provide 3-5 actionable recommendations:

${metricContext}

Progress: ${context.assessmentData?.completionPercentage || 0}% complete

Knowledge Base Context:
${kbResults.map((r, i) => `${i + 1}. ${r.content?.text || ''}`).join('\n\n')}

Provide recommendations in this format:
- Type (metric_suggestion, evidence_suggestion, score_guidance, best_practice, improvement_path, risk_mitigation, or quick_win)
- Title (concise, actionable)
- Description (2-3 sentences)
- Priority (low, medium, high, critical)
- Impact estimate
- Confidence score (0.0-1.0)`;
  }

  /**
   * Build evidence analysis prompt
   */
  private buildEvidenceAnalysisPrompt(
    metric: any,
    evidenceText: string,
    kbResults: any[]
  ): string {
    return `Analyze the following evidence for the metric "${metric.name}":

Evidence:
${evidenceText}

Metric Criteria from Knowledge Base:
${kbResults.map((r, i) => `${i + 1}. ${r.content?.text || ''}`).join('\n\n')}

Provide analysis including:
1. Summary (2-3 sentences)
2. Suggested maturity level (1-5) with justification
3. Confidence score (0.0-1.0)
4. Strengths identified in evidence
5. Gaps or missing elements
6. Alignment score with metric criteria (0.0-1.0)
7. Which specific criteria are matched
8. Relevant best practices

Be objective and thorough. Base your assessment on concrete evidence alignment with documented criteria.`;
  }

  /**
   * Build calculation explanation prompt
   */
  private buildCalculationExplanationPrompt(calculation: any): string {
    return `Explain this maturity calculation in simple, clear terms:

Overall Score: ${calculation.overallScore}/5.0
Maturity Level: ${calculation.maturityLevel}
Confidence: ${calculation.confidence}

Pillar Breakdown:
${JSON.stringify(calculation.pillarBreakdown, null, 2)}

Please explain:
1. What this score means
2. How it was calculated
3. Key strengths and areas for improvement
4. Recommendations for advancing to the next maturity level`;
  }

  /**
   * Parse recommendations from AI response
   */
  private parseRecommendations(
    text: string,
    kbResults: any[]
  ): BedrockRecommendation[] {
    // This is a simplified parser - in production, use structured output from Bedrock
    const recommendations: BedrockRecommendation[] = [];

    // Extract recommendations using pattern matching
    // In production, configure Bedrock to return structured JSON

    // For now, return a single recommendation as example
    recommendations.push({
      type: 'best_practice',
      title: 'AI-Generated Recommendation',
      description: text.substring(0, 500),
      confidenceScore: 0.85,
      priority: 'medium',
      supportingCitations: kbResults.map((r) => ({
        source: r.location?.s3Location?.uri || 'Knowledge Base',
        content: r.content?.text || '',
        relevance: r.score || 0,
      })),
    });

    return recommendations;
  }

  /**
   * Parse evidence analysis from AI response
   */
  private parseEvidenceAnalysis(
    text: string,
    kbResults: any[]
  ): EvidenceAnalysis {
    // This is a simplified parser - in production, use structured output
    return {
      summary: text.substring(0, 300),
      maturityLevelSuggestion: 3, // Extract from response
      confidenceScore: 0.75,
      strengths: ['Automated analysis pending'],
      gaps: ['Manual review recommended'],
      alignmentScore: 0.7,
      criteriaMatched: [],
      bestPracticesReferenced: kbResults.map((r) => r.content?.text || '').slice(0, 3),
    };
  }
}

// Export singleton instance
export const bedrockService = new BedrockAgentService();
