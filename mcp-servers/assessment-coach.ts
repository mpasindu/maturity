/**
 * Assessment Coach Agent - MCP Server
 * Guides users through assessments with contextual help
 */

import { prisma } from '../src/lib/database';

export interface CoachMessage {
  role: 'user' | 'coach' | 'analyst';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class AssessmentCoachAgent {
  private conversationHistory: CoachMessage[] = [];
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Get comprehensive assessment context
   */
  async getAssessmentContext(metricId?: string) {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: this.sessionId },
      include: {
        target: true,
        assessmentResults: {
          include: {
            metric: {
              include: {
                topic: {
                  include: {
                    pillar: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!session) {
      throw new Error('Assessment session not found');
    }

    // If specific metric requested
    if (metricId) {
      const result = session.assessmentResults.find(r => r.metricId === metricId);
      if (result && result.metric) {
        return {
          sessionInfo: {
            id: session.id,
            status: session.status,
            targetName: session.target?.name,
            targetType: session.target?.type
          },
          pillar: {
            id: result.metric.topic.pillar.id,
            name: result.metric.topic.pillar.name,
            description: result.metric.topic.pillar.description,
            category: result.metric.topic.pillar.category
          },
          topic: {
            id: result.metric.topic.id,
            name: result.metric.topic.name,
            description: result.metric.topic.description,
            weight: result.metric.topic.weight
          },
          metric: {
            id: result.metric.id,
            name: result.metric.name,
            description: result.metric.description,
            level: result.metric.level,
            metricType: result.metric.metricType,
            minValue: result.metric.minValue,
            maxValue: result.metric.maxValue,
            currentValue: result.value,
            notes: result.notes
          }
        };
      }
    }

    // Return full session context
    return {
      sessionInfo: {
        id: session.id,
        status: session.status,
        targetName: session.target?.name,
        targetType: session.target?.type,
        startedAt: session.startedAt,
        totalAnswered: session.assessmentResults.length
      },
      progress: this.calculateProgress(session)
    };
  }

  /**
   * Get current assessment answers
   */
  async getCurrentAnswers() {
    const results = await prisma.assessmentResult.findMany({
      where: { sessionId: this.sessionId },
      include: {
        metric: {
          include: {
            topic: {
              include: {
                pillar: true
              }
            }
          }
        }
      },
      orderBy: { assessedAt: 'desc' }
    });

    return results.map(r => ({
      pillarName: r.metric.topic.pillar.name,
      topicName: r.metric.topic.name,
      metricName: r.metric.name,
      metricLevel: r.metric.level,
      value: r.value,
      notes: r.notes,
      assessedAt: r.assessedAt
    }));
  }

  /**
   * Suggest improvements based on evidence
   */
  async suggestImprovements(metricId: string, userEvidence: string) {
    const context = await this.getAssessmentContext(metricId);
    
    if (!context.metric) {
      throw new Error('Metric not found in context');
    }
    
    const suggestions = {
      metricName: context.metric.name,
      currentLevel: context.metric.level,
      currentValue: context.metric.currentValue,
      evidence: userEvidence,
      recommendations: [] as string[]
    };

    // Generate level-specific recommendations
    if (context.metric.level === 1) {
      suggestions.recommendations = [
        'Document your current processes and procedures',
        'Create a baseline measurement of current state',
        'Identify quick wins for immediate improvement'
      ];
    } else if (context.metric.level === 2) {
      suggestions.recommendations = [
        'Implement automation for manual processes',
        'Establish metrics and monitoring',
        'Create standard operating procedures (SOPs)'
      ];
    } else {
      suggestions.recommendations = [
        'Optimize and fine-tune existing processes',
        'Implement continuous improvement cycles',
        'Share best practices across teams'
      ];
    }

    return suggestions;
  }

  /**
   * Explain metric in detail
   */
  async explainMetric(metricId: string) {
    const context = await this.getAssessmentContext(metricId);
    
    if (!context.metric || !context.pillar || !context.topic) {
      throw new Error('Complete metric context not found');
    }
    
    return {
      name: context.metric.name,
      description: context.metric.description,
      level: context.metric.level,
      pillarContext: `This metric is part of ${context.pillar.name} pillar, under the ${context.topic.name} topic.`,
      maturityLevels: {
        1: 'Initial - Ad-hoc, reactive, no formal processes',
        2: 'Managed - Documented, repeatable, some automation',
        3: 'Optimized - Fully automated, continuous improvement, best-in-class'
      },
      scoringGuide: this.getScoringGuide(context.metric.metricType, context.metric.level)
    };
  }

  /**
   * Provide real-world examples
   */
  async provideExamples(metricId: string, level: number) {
    const context = await this.getAssessmentContext(metricId);
    
    if (!context.metric) {
      throw new Error('Metric not found in context');
    }
    
    const examples = {
      metricName: context.metric.name,
      level: level,
      examples: [] as string[]
    };

    // Generate examples based on metric and level
    if (level === 1) {
      examples.examples = [
        'Manual processes with no documentation',
        'Reactive approach to issues',
        'Limited or no automation',
        'Individual knowledge, not shared'
      ];
    } else if (level === 2) {
      examples.examples = [
        'Documented procedures and runbooks',
        'Semi-automated workflows',
        'Regular reviews and updates',
        'Shared knowledge base'
      ];
    } else {
      examples.examples = [
        'Fully automated processes',
        'Continuous monitoring and alerting',
        'Self-healing capabilities',
        'Regular optimization and innovation'
      ];
    }

    return examples;
  }

  /**
   * Send message to Scoring Analyst Agent
   */
  async requestAnalysis(query: string) {
    this.conversationHistory.push({
      role: 'coach',
      content: query,
      timestamp: new Date(),
      metadata: { targetAgent: 'analyst' }
    });

    // This will be handled by the agent coordinator
    return {
      requestId: `req_${Date.now()}`,
      query,
      sessionId: this.sessionId,
      status: 'pending'
    };
  }

  /**
   * Receive response from Scoring Analyst
   */
  async receiveAnalystResponse(response: string, metadata?: Record<string, any>) {
    this.conversationHistory.push({
      role: 'analyst',
      content: response,
      timestamp: new Date(),
      metadata
    });

    return {
      processed: true,
      conversationLength: this.conversationHistory.length
    };
  }

  /**
   * Helper: Calculate progress
   */
  private calculateProgress(session: any) {
    const totalMetrics = session.assessmentResults.length;
    const byPillar: Record<string, number> = {};

    session.assessmentResults.forEach((result: any) => {
      const pillarName = result.metric.topic.pillar.name;
      byPillar[pillarName] = (byPillar[pillarName] || 0) + 1;
    });

    return {
      totalAnswered: totalMetrics,
      byPillar
    };
  }

  /**
   * Helper: Get scoring guide for metric type
   */
  private getScoringGuide(metricType: string, level: number) {
    const guides: Record<string, string> = {
      'SCALE': `Rate from 1-5 based on maturity. For Level ${level}, consider the depth and automation of implementation.`,
      'BOOLEAN': `Answer Yes/No. Yes indicates you meet Level ${level} criteria fully.`,
      'PERCENTAGE': `Enter 0-100%. Higher percentages indicate better maturity at Level ${level}.`,
      'COUNT': `Enter actual count. Compare against best practices for Level ${level}.`
    };

    return guides[metricType] || 'Provide accurate assessment based on evidence.';
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): CoachMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }
}
