/**
 * LLM-Based Agent Coordinator
 * Uses Claude to intelligently route requests and reason about agent interactions
 */

import { AssessmentCoachAgent } from './assessment-coach';
import { ScoringAnalystAgent } from './scoring-analyst';
import https from 'https';

const API_KEY = process.env.BEDROCK_API_KEY;
const REGION = process.env.AWS_REGION || 'us-east-1';
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

export interface LLMAgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentContext {
  sessionId: string;
  assessmentId?: number;
  metricId?: number;
  pillarId?: number;
  topicId?: number;
  conversationHistory: LLMAgentMessage[];
}

/**
 * Tool definitions for Claude function calling
 */
const AGENT_TOOLS = [
  {
    name: 'get_assessment_context',
    description: 'Retrieve detailed information about a specific metric, topic, or pillar in the assessment. Use this when the user asks about what a metric means or wants to understand the assessment structure.',
    input_schema: {
      type: 'object',
      properties: {
        metricId: {
          type: 'number',
          description: 'The ID of the metric to get context for (optional)',
        },
      },
    },
  },
  {
    name: 'get_current_answers',
    description: 'Get the user\'s current progress and answers in the assessment. Use this when the user asks about their progress, current status, or "how am I doing".',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'explain_metric',
    description: 'Provide a detailed explanation of a specific metric, including its purpose, importance, and how it\'s measured. Use when user asks "what is" or "explain" about a metric.',
    input_schema: {
      type: 'object',
      properties: {
        metricId: {
          type: 'number',
          description: 'The ID of the metric to explain',
        },
      },
      required: ['metricId'],
    },
  },
  {
    name: 'provide_examples',
    description: 'Provide practical examples for a specific metric at a given maturity level. Use when user asks for examples or "show me how".',
    input_schema: {
      type: 'object',
      properties: {
        metricId: {
          type: 'number',
          description: 'The ID of the metric',
        },
        level: {
          type: 'number',
          description: 'Maturity level (1-3)',
          enum: [1, 2, 3],
        },
      },
      required: ['metricId', 'level'],
    },
  },
  {
    name: 'calculate_maturity_score',
    description: 'Calculate the full maturity score for the current assessment, including all pillars, topics, and metrics. Use when user wants to see their overall score or asks to "analyze" their assessment.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'identify_weak_areas',
    description: 'Identify areas where the user scored below average or needs improvement. Use when user asks about weaknesses, gaps, or areas to improve.',
    input_schema: {
      type: 'object',
      properties: {
        threshold: {
          type: 'number',
          description: 'Score threshold below which areas are considered weak (default: 2.0)',
        },
      },
    },
  },
  {
    name: 'generate_improvement_plan',
    description: 'Generate a detailed improvement plan with specific, actionable recommendations. Use when user asks for recommendations, action items, or "what should I do".',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'generate_insights',
    description: 'Generate comprehensive insights combining scores, weak areas, and recommendations. Use when user wants a complete analysis or overview.',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
];

export class LLMAgentCoordinator {
  private coachAgent: AssessmentCoachAgent;
  private analystAgent: ScoringAnalystAgent;
  private context: AgentContext;

  constructor(context: AgentContext) {
    this.context = context;
    this.coachAgent = new AssessmentCoachAgent(context.sessionId);
    this.analystAgent = new ScoringAnalystAgent();
  }

  /**
   * Handle user message using LLM reasoning
   */
  async handleUserMessage(message: string): Promise<string> {
    if (!API_KEY) {
      return '❌ Bedrock API key not configured. Please set BEDROCK_API_KEY in your environment.';
    }

    // Add user message to history
    this.context.conversationHistory.push({
      role: 'user',
      content: message,
    });

    try {
      // Call Claude with tools
      const response = await this.invokeClaudeWithTools(message);
      
      // Add assistant response to history
      this.context.conversationHistory.push({
        role: 'assistant',
        content: response,
      });

      return response;
    } catch (error: any) {
      console.error('LLM Agent error:', error);
      return `❌ Error processing your request: ${error.message}`;
    }
  }

  /**
   * Invoke Claude with tool calling support
   */
  private async invokeClaudeWithTools(userMessage: string): Promise<string> {
    const systemPrompt = this.buildSystemPrompt();
    
    // Build messages array with conversation history
    const messages = [
      ...this.context.conversationHistory,
    ];

    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      tools: AGENT_TOOLS,
      temperature: 0.7,
    };

    let finalResponse = '';
    let toolCalls = 0;
    const maxToolCalls = 5; // Prevent infinite loops

    // Tool use loop - Claude may call multiple tools
    while (toolCalls < maxToolCalls) {
      const response = await this.makeBedrockRequest(payload);
      
      // Check if Claude wants to use tools
      const toolUseContent = response.content.find((c: any) => c.type === 'tool_use');
      
      if (!toolUseContent) {
        // No more tools to call, extract text response
        const textContent = response.content.find((c: any) => c.type === 'text');
        finalResponse = textContent?.text || 'No response generated.';
        break;
      }

      // Execute the tool
      const toolResult = await this.executeTool(
        toolUseContent.name,
        toolUseContent.input
      );

      // Add assistant's tool use to messages
      payload.messages.push({
        role: 'assistant',
        content: response.content,
      });

      // Add tool result to messages
      payload.messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseContent.id,
            content: JSON.stringify(toolResult),
          },
        ],
      });

      toolCalls++;
    }

    return finalResponse;
  }

  /**
   * Execute a tool call from Claude
   */
  private async executeTool(toolName: string, input: any): Promise<any> {
    try {
      switch (toolName) {
        case 'get_assessment_context':
          return await this.coachAgent.getAssessmentContext(
            input.metricId || this.context.metricId
          );

        case 'get_current_answers':
          return await this.coachAgent.getCurrentAnswers();

        case 'explain_metric':
          return await this.coachAgent.explainMetric(input.metricId);

        case 'provide_examples':
          return await this.coachAgent.provideExamples(
            input.metricId,
            input.level
          );

        case 'calculate_maturity_score':
          return await this.analystAgent.calculateFullMaturity(
            this.context.sessionId
          );

        case 'identify_weak_areas':
          return await this.analystAgent.identifyWeakAreas(
            this.context.sessionId,
            input.threshold
          );

        case 'generate_improvement_plan':
          return await this.analystAgent.generateImprovementPlan(
            this.context.sessionId
          );

        case 'generate_insights':
          return await this.analystAgent.generateInsights(
            this.context.sessionId
          );

        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    } catch (error: any) {
      return { error: error.message };
    }
  }

  /**
   * Build system prompt for Claude
   */
  private buildSystemPrompt(): string {
    return `You are an intelligent AI assistant helping users with enterprise architecture maturity assessments. You coordinate between two specialized agents:

1. **Assessment Coach Agent**: Helps users understand metrics, provides examples, explains concepts, and tracks progress
2. **Scoring Analyst Agent**: Calculates maturity scores, identifies weaknesses, and generates improvement recommendations

Your role is to:
- Understand user intent and call the appropriate tools
- Provide clear, actionable guidance in a friendly, professional tone
- Use emojis strategically to make responses visually appealing
- Format responses with proper markdown (headers, lists, bold text)
- Be concise but thorough
- Focus on helping users improve their maturity scores

Current Context:
- Session ID: ${this.context.sessionId}
- Assessment ID: ${this.context.assessmentId || 'N/A'}
- Metric ID: ${this.context.metricId || 'N/A'}

Guidelines:
- When users ask general questions, use get_assessment_context
- When users want to see their progress, use get_current_answers
- When users ask for analysis or scores, use calculate_maturity_score or generate_insights
- When users want recommendations, use generate_improvement_plan
- For weak areas or gaps, use identify_weak_areas
- Combine multiple tools if needed to provide comprehensive answers
- Always provide specific, actionable advice

Response Format:
- Use emojis: 🎯 (goals), 📊 (analysis), 💡 (tips), ⚠️ (warnings), ✅ (success), 🚀 (improvements)
- Use markdown headers (##, ###) for sections
- Use bullet points for lists
- Use bold (**text**) for emphasis
- Keep paragraphs short and scannable`;
  }

  /**
   * Make HTTP request to Bedrock
   */
  private async makeBedrockRequest(payload: any): Promise<any> {
    const payloadStr = JSON.stringify(payload);

    return new Promise((resolve, reject) => {
      const options = {
        hostname: `bedrock-runtime.${REGION}.amazonaws.com`,
        port: 443,
        path: `/model/${MODEL_ID}/invoke`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadStr),
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
            try {
              const responseData = JSON.parse(data);
              resolve(responseData);
            } catch (error) {
              reject(new Error(`Failed to parse response: ${data}`));
            }
          } else {
            reject(new Error(`Bedrock API returned ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(payloadStr);
      req.end();
    });
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.context.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory(): LLMAgentMessage[] {
    return this.context.conversationHistory;
  }
}
