/**
 * LLM-Powered Assessment Interviewer Agent
 * Uses Claude to conduct natural, conversational assessments
 */

import { AssessmentInterviewerAgent, InterviewQuestion, InterviewAnswer } from './assessment-interviewer';
import https from 'https';

const API_KEY = process.env.BEDROCK_API_KEY;
const REGION = process.env.AWS_REGION || 'us-east-1';
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class LLMInterviewerAgent {
  private baseAgent: AssessmentInterviewerAgent;
  private conversationHistory: ConversationMessage[] = [];
  private currentQuestion: InterviewQuestion | null = null;
  private awaitingAnswer: boolean = false;
  private assessmentId?: number;

  constructor(sessionId: string, assessmentId?: number) {
    this.baseAgent = new AssessmentInterviewerAgent(sessionId);
    this.assessmentId = assessmentId;
  }

  /**
   * Start the interview
   */
  async startInterview(): Promise<string> {
    // Initialize the base agent
    const init = await this.baseAgent.initializeInterview();

    if (!init.success) {
      return `❌ ${init.message}`;
    }

    // Get current question and progress
    const { question, progress, previousAnswer } = await this.baseAgent.getCurrentQuestion();
    this.currentQuestion = question;
    this.awaitingAnswer = true;

    if (!question) {
      return '✅ Assessment already completed!';
    }

    // Check if resuming or starting fresh
    const isResuming = progress.answeredQuestions > 0;

    let opening: string;
    
    if (isResuming) {
      // Generate resume message with Claude
      opening = await this.generateResumeMessage(progress, question);
    } else {
      // Generate conversational opening with Claude
      opening = await this.generateInterviewOpening(init.totalQuestions, init.pillars, question);
    }
    
    this.conversationHistory.push({
      role: 'assistant',
      content: opening,
    });

    return opening;
  }

  /**
   * Handle user message during interview
   */
  async handleMessage(userMessage: string): Promise<string> {
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    // Check if user is providing an answer
    if (this.awaitingAnswer && this.currentQuestion) {
      const answer = await this.parseAnswer(userMessage, this.currentQuestion);
      
      if (answer) {
        // Submit answer
        const result = await this.baseAgent.submitAnswer(answer);
        
        if (result.success) {
          this.currentQuestion = result.nextQuestion;
          this.awaitingAnswer = result.nextQuestion !== null;

          // Generate response with next question or completion
          const response = await this.generateFollowUpResponse(
            answer,
            result.nextQuestion,
            result.progress
          );

          this.conversationHistory.push({
            role: 'assistant',
            content: response,
          });

          return response;
        } else {
          return `❌ ${result.message}`;
        }
      }
    }

    // Handle other commands
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('skip') || lowerMessage.includes('pass')) {
      return await this.handleSkip();
    }

    if (lowerMessage.includes('back') || lowerMessage.includes('previous')) {
      return await this.handlePrevious();
    }

    if (lowerMessage.includes('progress') || lowerMessage.includes('status')) {
      return await this.handleProgress();
    }

    if (lowerMessage.includes('help')) {
      return await this.handleHelp();
    }

    // Use Claude to interpret unclear response
    return await this.clarifyResponse(userMessage);
  }

  /**
   * Parse user answer using Claude
   */
  private async parseAnswer(
    userMessage: string,
    question: InterviewQuestion
  ): Promise<InterviewAnswer | null> {
    try {
      const systemPrompt = `You are an assessment interviewer. Parse the user's response to determine their maturity level.

Current Question: "${question.question}"
Metric: ${question.metricName}
Context: ${question.context}

Maturity Levels:
- Level 1 (Initial): ${question.examples?.level1}
- Level 2 (Managed): ${question.examples?.level2}
- Level 3 (Optimized): ${question.examples?.level3}

Parse the user's response and extract:
1. Maturity level (1, 2, or 3)
2. Confidence (low, medium, high)
3. Any notes or evidence mentioned

Respond in JSON format:
{
  "level": <1, 2, or 3>,
  "confidence": "<low, medium, or high>",
  "notes": "<optional notes>",
  "evidence": ["<optional evidence>"]
}

If the response is unclear or doesn't indicate a level, return: { "unclear": true }`;

      const response = await this.invokeClaude(systemPrompt, userMessage);
      
      try {
        const parsed = JSON.parse(response);
        
        if (parsed.unclear) {
          return null;
        }

        return {
          metricId: question.metricId,
          level: parsed.level,
          confidence: parsed.confidence || 'medium',
          notes: parsed.notes,
          evidence: parsed.evidence,
        };
      } catch {
        return null;
      }
    } catch (error) {
      console.error('Error parsing answer:', error);
      return null;
    }
  }

  /**
   * Generate conversational opening
   */
  private async generateInterviewOpening(
    totalQuestions: number,
    pillars: string[],
    firstQuestion: InterviewQuestion
  ): Promise<string> {
    const systemPrompt = `You are a friendly, professional assessment interviewer conducting an enterprise architecture maturity assessment.

Assessment Details:
- Total Questions: ${totalQuestions}
- Pillars: ${pillars.join(', ')}

Your task is to:
1. Welcome the user warmly
2. Explain the assessment process briefly
3. Ask the first question naturally
4. Make it conversational and encouraging

First Question Details:
- Metric: ${firstQuestion.metricName}
- Topic: ${firstQuestion.topicName}
- Pillar: ${firstQuestion.pillarName}
- Context: ${firstQuestion.context}

Maturity Levels:
- Level 1 (Initial): ${firstQuestion.examples?.level1}
- Level 2 (Managed): ${firstQuestion.examples?.level2}
- Level 3 (Optimized): ${firstQuestion.examples?.level3}

Create a warm, professional opening that asks the first question naturally.`;

    return await this.invokeClaude(
      systemPrompt,
      'Generate the interview opening and first question'
    );
  }

  /**
   * Generate resume message when continuing previous interview
   */
  private async generateResumeMessage(
    progress: any,
    nextQuestion: InterviewQuestion
  ): Promise<string> {
    const systemPrompt = `You are a friendly, professional assessment interviewer.

The user is resuming a partially completed assessment.

Progress:
- Completed: ${progress.answeredQuestions}/${progress.totalQuestions} (${progress.percentComplete}%)
- Current Pillar: ${nextQuestion.pillarName}
- Current Topic: ${nextQuestion.topicName}

Your task is to:
1. Welcome them back warmly
2. Acknowledge their progress so far
3. Ask the next question naturally
4. Be encouraging and supportive

Next Question Details:
- Metric: ${nextQuestion.metricName}
- Topic: ${nextQuestion.topicName}
- Pillar: ${nextQuestion.pillarName}
- Context: ${nextQuestion.context}

Maturity Levels:
- Level 1 (Initial): ${nextQuestion.examples?.level1}
- Level 2 (Managed): ${nextQuestion.examples?.level2}
- Level 3 (Optimized): ${nextQuestion.examples?.level3}

Create a welcoming resume message that shows their progress and asks the next question.`;

    return await this.invokeClaude(
      systemPrompt,
      'Generate the resume message and next question'
    );
  }

  /**
   * Generate follow-up response after answer
   */
  private async generateFollowUpResponse(
    answer: InterviewAnswer,
    nextQuestion: InterviewQuestion | null,
    progress: any
  ): Promise<string> {
    if (!nextQuestion) {
      return await this.generateCompletionMessage(progress);
    }

    const systemPrompt = `You are a friendly assessment interviewer.

The user just answered:
- Metric: Previous question
- Level: ${answer.level} (${answer.level === 1 ? 'Initial' : answer.level === 2 ? 'Managed' : 'Optimized'})
- Notes: ${answer.notes || 'None'}

Progress:
- Completed: ${progress.answeredQuestions}/${progress.totalQuestions}
- ${progress.percentComplete}% complete

Next Question:
- Metric: ${nextQuestion.metricName}
- Topic: ${nextQuestion.topicName}
- Pillar: ${nextQuestion.pillarName}
- Context: ${nextQuestion.context}

Maturity Levels:
- Level 1 (Initial): ${nextQuestion.examples?.level1}
- Level 2 (Managed): ${nextQuestion.examples?.level2}
- Level 3 (Optimized): ${nextQuestion.examples?.level3}

Generate a natural transition:
1. Acknowledge their previous answer positively
2. Provide brief progress update if it's a milestone (10%, 25%, 50%, 75%)
3. Ask the next question conversationally
4. Keep it encouraging and professional`;

    return await this.invokeClaude(
      systemPrompt,
      'Generate follow-up with next question'
    );
  }

  /**
   * Generate completion message
   */
  private async generateCompletionMessage(progress: any): Promise<string> {
    const summary = await this.baseAgent.getSummary();

    const systemPrompt = `You are a friendly assessment interviewer.

The user has completed the assessment!

Summary:
- Total Questions: ${summary.totalQuestions}
- Answered: ${summary.answered}
- Skipped: ${summary.skipped}

By Level:
- Level 1 (Initial): ${summary.byLevel[1]} answers
- Level 2 (Managed): ${summary.byLevel[2]} answers
- Level 3 (Optimized): ${summary.byLevel[3]} answers

Create a warm, congratulatory completion message that:
1. Celebrates their completion
2. Summarizes their responses briefly
3. Encourages them to view their detailed results
4. Thanks them for their time`;

    return await this.invokeClaude(
      systemPrompt,
      'Generate completion message'
    );
  }

  /**
   * Clarify unclear response
   */
  private async clarifyResponse(userMessage: string): Promise<string> {
    if (!this.currentQuestion) {
      return 'No active question. Type "start" to begin the interview.';
    }

    const systemPrompt = `You are an assessment interviewer. The user's response was unclear.

Current Question: "${this.currentQuestion.question}"
Metric: ${this.currentQuestion.metricName}
User's Response: "${userMessage}"

Gently ask them to clarify which maturity level (1, 2, or 3) best describes their situation.
Remind them of the options:
- Level 1 (Initial): ${this.currentQuestion.examples?.level1}
- Level 2 (Managed): ${this.currentQuestion.examples?.level2}
- Level 3 (Optimized): ${this.currentQuestion.examples?.level3}

Be friendly and helpful.`;

    return await this.invokeClaude(systemPrompt, 'Clarify the question');
  }

  /**
   * Handle skip command
   */
  private async handleSkip(): Promise<string> {
    const result = await this.baseAgent.skipQuestion();
    this.currentQuestion = result.nextQuestion;
    this.awaitingAnswer = result.nextQuestion !== null;

    if (!result.nextQuestion) {
      return '✅ No more questions. Assessment complete!';
    }

    return `⏭️ Skipped. Next question:\n\n**${result.nextQuestion.topicName}** - ${result.nextQuestion.metricName}\n\n${result.nextQuestion.question}\n\nOptions:\n- Level 1: ${result.nextQuestion.examples?.level1}\n- Level 2: ${result.nextQuestion.examples?.level2}\n- Level 3: ${result.nextQuestion.examples?.level3}`;
  }

  /**
   * Handle previous command
   */
  private async handlePrevious(): Promise<string> {
    const result = await this.baseAgent.previousQuestion();
    this.currentQuestion = result.question;
    this.awaitingAnswer = result.question !== null;

    if (!result.question) {
      return 'No previous question available.';
    }

    return `⬅️ Going back:\n\n**${result.question.topicName}** - ${result.question.metricName}\n\n${result.question.question}\n\n${result.previousAnswer ? `Previous answer: Level ${result.previousAnswer.level}` : 'Not yet answered'}`;
  }

  /**
   * Handle progress command
   */
  private async handleProgress(): Promise<string> {
    const progress = this.baseAgent.getProgress();
    const summary = await this.baseAgent.getSummary();

    return `📊 **Assessment Progress**

**Overall:**
- ${progress.answeredQuestions}/${progress.totalQuestions} questions answered (${progress.percentComplete}%)
- Current: Question ${progress.currentQuestion}
- Pillar: ${progress.currentPillar}
- Topic: ${progress.currentTopic}

**By Maturity Level:**
- Level 1 (Initial): ${summary.byLevel[1]} answers
- Level 2 (Managed): ${summary.byLevel[2]} answers
- Level 3 (Optimized): ${summary.byLevel[3]} answers

${progress.percentComplete < 100 ? 'Keep going! 🚀' : 'Ready to complete! ✅'}`;
  }

  /**
   * Handle help command
   */
  private async handleHelp(): Promise<string> {
    return `💡 **Interview Help**

**Answer Questions:**
Just tell me your maturity level naturally, like:
- "We're at level 2"
- "I'd say we're managed"
- "Level 3 - fully optimized"
- "Initial level, we're just starting"

**Commands:**
- **Skip** - Skip current question
- **Back** - Go to previous question
- **Progress** - See your progress
- **Help** - Show this message

**Maturity Levels:**
- **Level 1 (Initial)** - Basic, ad-hoc, minimal documentation
- **Level 2 (Managed)** - Documented, some automation, monitored
- **Level 3 (Optimized)** - Fully automated, continuously improving

Just answer naturally, and I'll understand! 😊`;
  }

  /**
   * Invoke Claude
   */
  private async invokeClaude(systemPrompt: string, userMessage: string): Promise<string> {
    if (!API_KEY) {
      return 'Bedrock API key not configured';
    }

    const messages = [
      ...this.conversationHistory.slice(-6), // Last 6 messages for context
      { role: 'user' as const, content: userMessage },
    ];

    const payload = JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
      temperature: 0.7,
    });

    return new Promise((resolve, reject) => {
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
            try {
              const responseData = JSON.parse(data);
              const text = responseData.content[0].text;
              resolve(text);
            } catch (error) {
              reject(new Error('Failed to parse response'));
            }
          } else {
            reject(new Error(`Bedrock API returned ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }
}
