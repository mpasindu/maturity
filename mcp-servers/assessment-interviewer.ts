/**
 * Assessment Interviewer Agent
 * Conducts interactive assessments by asking questions and recording answers
 * Completely separate from Coach and Analyst agents
 */

import { prisma } from '../src/lib/database';

export interface InterviewQuestion {
  metricId: string;
  metricName: string;
  topicName: string;
  pillarName: string;
  question: string;
  context: string;
  level: number;
  examples?: {
    level1: string;
    level2: string;
    level3: string;
  };
}

export interface InterviewAnswer {
  metricId: string;
  level: number;
  confidence: 'low' | 'medium' | 'high';
  notes?: string;
  evidence?: string[];
}

export interface InterviewProgress {
  sessionId: string;
  totalQuestions: number;
  answeredQuestions: number;
  currentQuestion: number;
  percentComplete: number;
  currentPillar?: string;
  currentTopic?: string;
}

export class AssessmentInterviewerAgent {
  private sessionId: string;
  private currentQuestionIndex: number = 0;
  private questions: InterviewQuestion[] = [];
  private answers: Map<string, InterviewAnswer> = new Map();

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Initialize interview session - load all questions
   */
  async initializeInterview(): Promise<{
    success: boolean;
    totalQuestions: number;
    pillars: string[];
    message: string;
  }> {
    try {
      // Get session details
      const session = await prisma.assessmentSession.findUnique({
        where: { id: this.sessionId },
        include: {
          target: true,
        },
      });

      if (!session) {
        return {
          success: false,
          totalQuestions: 0,
          pillars: [],
          message: 'Assessment session not found',
        };
      }

      // Load all active metrics with their relationships
      const pillars = await prisma.maturityPillar.findMany({
        where: { isActive: true },
        include: {
          topics: {
            where: { isActive: true },
            include: {
              metrics: {
                where: { active: true },
                orderBy: [
                  { level: 'asc' },
                  { name: 'asc' },
                ],
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });

      // Build questions
      this.questions = [];
      for (const pillar of pillars) {
        for (const topic of pillar.topics) {
          for (const metric of topic.metrics) {
            this.questions.push({
              metricId: metric.id,
              metricName: metric.name,
              topicName: topic.name,
              pillarName: pillar.name,
              question: this.generateQuestion(metric.name, metric.description),
              context: metric.description || '',
              level: metric.level,
              examples: this.generateExamples(metric.name, metric.level),
            });
          }
        }
      }

      // Load existing answers
      const existingAnswers = await prisma.assessmentResult.findMany({
        where: { sessionId: this.sessionId },
      });

      for (const result of existingAnswers) {
        this.answers.set(result.metricId, {
          metricId: result.metricId,
          level: Number(result.value),
          confidence: 'medium',
          notes: result.notes || undefined,
          evidence: result.evidenceUrls,
        });
      }

      // Resume from first unanswered question
      this.currentQuestionIndex = 0;
      for (let i = 0; i < this.questions.length; i++) {
        if (!this.answers.has(this.questions[i].metricId)) {
          this.currentQuestionIndex = i;
          break;
        }
      }

      // If all questions answered, stay at last question
      if (this.currentQuestionIndex === 0 && this.answers.size === this.questions.length) {
        this.currentQuestionIndex = this.questions.length;
      }

      return {
        success: true,
        totalQuestions: this.questions.length,
        pillars: pillars.map(p => p.name),
        message: `Interview initialized with ${this.questions.length} questions across ${pillars.length} pillars. Resuming from question ${this.currentQuestionIndex + 1}.`,
      };
    } catch (error: any) {
      console.error('Error initializing interview:', error);
      return {
        success: false,
        totalQuestions: 0,
        pillars: [],
        message: `Failed to initialize: ${error.message}`,
      };
    }
  }

  /**
   * Get current question
   */
  async getCurrentQuestion(): Promise<{
    question: InterviewQuestion | null;
    progress: InterviewProgress;
    previousAnswer?: InterviewAnswer;
  }> {
    if (this.questions.length === 0) {
      await this.initializeInterview();
    }

    const question = this.questions[this.currentQuestionIndex] || null;
    const previousAnswer = question ? this.answers.get(question.metricId) : undefined;

    return {
      question,
      progress: this.getProgress(),
      previousAnswer,
    };
  }

  /**
   * Submit answer and move to next question
   */
  async submitAnswer(answer: InterviewAnswer): Promise<{
    success: boolean;
    message: string;
    nextQuestion: InterviewQuestion | null;
    progress: InterviewProgress;
  }> {
    try {
      // Validate answer
      if (!answer.metricId || answer.level < 1 || answer.level > 3) {
        return {
          success: false,
          message: 'Invalid answer: level must be 1, 2, or 3',
          nextQuestion: null,
          progress: this.getProgress(),
        };
      }

      // Store answer in memory
      this.answers.set(answer.metricId, answer);

      // Save to database - check if result already exists
      const existingResult = await prisma.assessmentResult.findFirst({
        where: {
          sessionId: this.sessionId,
          metricId: answer.metricId,
        },
      });

      if (existingResult) {
        // Update existing result
        await prisma.assessmentResult.update({
          where: { id: existingResult.id },
          data: {
            value: answer.level,
            notes: answer.notes,
            evidenceUrls: answer.evidence || [],
            assessedAt: new Date(),
          },
        });
      } else {
        // Create new result
        await prisma.assessmentResult.create({
          data: {
            sessionId: this.sessionId,
            metricId: answer.metricId,
            value: answer.level,
            notes: answer.notes,
            evidenceUrls: answer.evidence || [],
          },
        });
      }

      // Move to next question
      this.currentQuestionIndex++;

      const nextQuestion = this.questions[this.currentQuestionIndex] || null;

      // Update session status if completed
      if (!nextQuestion) {
        await prisma.assessmentSession.update({
          where: { id: this.sessionId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      } else {
        await prisma.assessmentSession.update({
          where: { id: this.sessionId },
          data: {
            status: 'IN_PROGRESS',
          },
        });
      }

      return {
        success: true,
        message: nextQuestion ? 'Answer saved, moving to next question' : 'Assessment completed!',
        nextQuestion,
        progress: this.getProgress(),
      };
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      return {
        success: false,
        message: `Failed to save answer: ${error.message}`,
        nextQuestion: null,
        progress: this.getProgress(),
      };
    }
  }

  /**
   * Skip current question
   */
  async skipQuestion(): Promise<{
    nextQuestion: InterviewQuestion | null;
    progress: InterviewProgress;
  }> {
    this.currentQuestionIndex++;
    const nextQuestion = this.questions[this.currentQuestionIndex] || null;

    return {
      nextQuestion,
      progress: this.getProgress(),
    };
  }

  /**
   * Go back to previous question
   */
  async previousQuestion(): Promise<{
    question: InterviewQuestion | null;
    progress: InterviewProgress;
    previousAnswer?: InterviewAnswer;
  }> {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }

    return this.getCurrentQuestion();
  }

  /**
   * Jump to specific question by index
   */
  async jumpToQuestion(index: number): Promise<{
    question: InterviewQuestion | null;
    progress: InterviewProgress;
  }> {
    if (index >= 0 && index < this.questions.length) {
      this.currentQuestionIndex = index;
    }

    const { question, progress } = await this.getCurrentQuestion();
    return { question, progress };
  }

  /**
   * Get interview progress
   */
  getProgress(): InterviewProgress {
    const currentQuestion = this.questions[this.currentQuestionIndex];

    return {
      sessionId: this.sessionId,
      totalQuestions: this.questions.length,
      answeredQuestions: this.answers.size,
      currentQuestion: this.currentQuestionIndex + 1,
      percentComplete: Math.round((this.answers.size / this.questions.length) * 100),
      currentPillar: currentQuestion?.pillarName,
      currentTopic: currentQuestion?.topicName,
    };
  }

  /**
   * Get all unanswered questions
   */
  getUnansweredQuestions(): InterviewQuestion[] {
    return this.questions.filter(q => !this.answers.has(q.metricId));
  }

  /**
   * Get summary of answers
   */
  async getSummary(): Promise<{
    totalQuestions: number;
    answered: number;
    skipped: number;
    byPillar: Record<string, { answered: number; total: number }>;
    byLevel: Record<number, number>;
  }> {
    const byPillar: Record<string, { answered: number; total: number }> = {};
    const byLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0 };

    for (const question of this.questions) {
      if (!byPillar[question.pillarName]) {
        byPillar[question.pillarName] = { answered: 0, total: 0 };
      }
      byPillar[question.pillarName].total++;

      const answer = this.answers.get(question.metricId);
      if (answer) {
        byPillar[question.pillarName].answered++;
        byLevel[answer.level]++;
      }
    }

    return {
      totalQuestions: this.questions.length,
      answered: this.answers.size,
      skipped: this.questions.length - this.answers.size,
      byPillar,
      byLevel,
    };
  }

  /**
   * Generate natural language question from metric
   */
  private generateQuestion(metricName: string, description?: string | null): string {
    const cleanName = metricName.replace(/_/g, ' ').toLowerCase();
    
    // Generate contextual question
    const questions = [
      `How would you rate your current ${cleanName}?`,
      `What maturity level best describes your ${cleanName}?`,
      `Where would you place your organization for ${cleanName}?`,
      `How mature is your ${cleanName}?`,
    ];

    return questions[Math.floor(Math.random() * questions.length)];
  }

  /**
   * Generate examples for each maturity level
   */
  private generateExamples(metricName: string, currentLevel: number): {
    level1: string;
    level2: string;
    level3: string;
  } {
    const cleanName = metricName.replace(/_/g, ' ').toLowerCase();

    return {
      level1: `Initial: Basic or ad-hoc ${cleanName} with minimal documentation`,
      level2: `Managed: Documented ${cleanName} with some automation and monitoring`,
      level3: `Optimized: Fully automated ${cleanName} with continuous improvement`,
    };
  }
}
