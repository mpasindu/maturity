/**
 * Scoring Analyst Agent - MCP Server
 * Analyzes assessments and generates insights
 */

import { prisma } from '../src/lib/database';

export interface AnalystMessage {
  role: 'analyst' | 'coach' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface MaturityInsight {
  overallScore: number;
  maturityLevel: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export class ScoringAnalystAgent {
  private analysisCache: Map<string, any> = new Map();

  /**
   * Calculate full maturity scores
   */
  async calculateFullMaturity(sessionId: string) {
    // Check cache first
    const cacheKey = `maturity_${sessionId}_${Date.now()}`;
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
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

    // Calculate scores by pillar
    const pillarScores: Record<string, { score: number; count: number; level: number }> = {};
    
    session.assessmentResults.forEach((result: any) => {
      const pillarName = result.metric.topic.pillar.name;
      if (!pillarScores[pillarName]) {
        pillarScores[pillarName] = { score: 0, count: 0, level: 0 };
      }
      
      pillarScores[pillarName].score += result.metric.level;
      pillarScores[pillarName].count += 1;
      pillarScores[pillarName].level = result.metric.level;
    });

    // Calculate averages
    const pillarAverages: Record<string, number> = {};
    Object.keys(pillarScores).forEach(pillar => {
      pillarAverages[pillar] = pillarScores[pillar].score / pillarScores[pillar].count;
    });

    // Calculate overall score
    const overallScore = Object.values(pillarAverages).reduce((sum, score) => sum + score, 0) / 
                         Object.keys(pillarAverages).length;

    const result = {
      sessionId,
      overallScore: parseFloat(overallScore.toFixed(2)),
      pillarScores: pillarAverages,
      totalMetrics: session.assessmentResults.length,
      maturityLevel: this.getMaturityLevel(overallScore),
      calculatedAt: new Date()
    };

    // Cache result
    this.analysisCache.set(cacheKey, result);

    return result;
  }

  /**
   * Identify weak areas
   */
  async identifyWeakAreas(sessionId: string, threshold: number = 2.0) {
    const maturity = await this.calculateFullMaturity(sessionId);
    
    const weakAreas = Object.entries(maturity.pillarScores)
      .filter(([_, score]) => (score as number) < threshold)
      .sort(([_, a], [__, b]) => (a as number) - (b as number))
      .map(([pillar, score]) => ({
        pillar,
        score: parseFloat((score as number).toFixed(2)),
        severity: (score as number) < 1.5 ? 'critical' : (score as number) < 2.0 ? 'high' : 'medium'
      }));

    return {
      sessionId,
      threshold,
      weakAreas,
      totalIdentified: weakAreas.length
    };
  }

  /**
   * Generate improvement plan
   */
  async generateImprovementPlan(sessionId: string, pillarId?: string) {
    const maturity = await this.calculateFullMaturity(sessionId);
    const weakAreas = await this.identifyWeakAreas(sessionId);

    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
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

    // Filter by pillar if specified
    const targetResults = pillarId 
      ? session.assessmentResults.filter((r: any) => r.metric.topic.pillar.id === pillarId)
      : session.assessmentResults;

    // Group by topic
    const topicGroups: Record<string, any[]> = {};
    targetResults.forEach((result: any) => {
      const topicName = result.metric.topic.name;
      if (!topicGroups[topicName]) {
        topicGroups[topicName] = [];
      }
      topicGroups[topicName].push(result);
    });

    // Generate recommendations
    const recommendations = [];

    for (const [topicName, results] of Object.entries(topicGroups)) {
      const avgLevel = results.reduce((sum: number, r: any) => sum + r.metric.level, 0) / results.length;
      
      if (avgLevel < 2) {
        recommendations.push({
          topic: topicName,
          priority: 'high',
          currentLevel: parseFloat(avgLevel.toFixed(1)),
          actions: [
            'Document current state and processes',
            'Identify automation opportunities',
            'Create measurement baselines'
          ]
        });
      } else if (avgLevel < 2.5) {
        recommendations.push({
          topic: topicName,
          priority: 'medium',
          currentLevel: parseFloat(avgLevel.toFixed(1)),
          actions: [
            'Implement monitoring and alerting',
            'Standardize procedures across teams',
            'Begin automation rollout'
          ]
        });
      }
    }

    return {
      sessionId,
      pillarId,
      overallScore: maturity.overallScore,
      recommendations: recommendations.slice(0, 5), // Top 5 priorities
      generatedAt: new Date()
    };
  }

  /**
   * Compare to benchmarks
   */
  async compareToBenchmarks(sessionId: string, industry?: string) {
    const maturity = await this.calculateFullMaturity(sessionId);
    
    // Mock benchmark data - in production, this would come from a database
    const benchmarks: Record<string, number> = {
      'Technology': 2.3,
      'Financial Services': 2.5,
      'Healthcare': 2.1,
      'Manufacturing': 2.0,
      'Retail': 1.9,
      'Default': 2.2
    };

    const benchmarkScore = benchmarks[industry || 'Default'] || benchmarks['Default'];
    const difference = maturity.overallScore - benchmarkScore;

    return {
      sessionId,
      industry: industry || 'General',
      yourScore: maturity.overallScore,
      benchmarkScore,
      difference: parseFloat(difference.toFixed(2)),
      percentile: this.calculatePercentile(maturity.overallScore, benchmarkScore),
      comparison: difference >= 0 ? 'above' : 'below'
    };
  }

  /**
   * Get historical trends
   */
  async getHistoricalTrends(targetId: string) {
    const sessions = await prisma.assessmentSession.findMany({
      where: { 
        targetId,
        status: 'COMPLETED'
      },
      include: {
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
      },
      orderBy: { completedAt: 'asc' },
      take: 10
    });

    const trends = sessions.map(session => {
      const pillarScores: Record<string, number[]> = {};
      
      session.assessmentResults.forEach((result: any) => {
        const pillarName = result.metric.topic.pillar.name;
        if (!pillarScores[pillarName]) {
          pillarScores[pillarName] = [];
        }
        pillarScores[pillarName].push(result.metric.level);
      });

      const pillarAverages: Record<string, number> = {};
      Object.keys(pillarScores).forEach(pillar => {
        const avg = pillarScores[pillar].reduce((a, b) => a + b, 0) / pillarScores[pillar].length;
        pillarAverages[pillar] = parseFloat(avg.toFixed(2));
      });

      const overall = Object.values(pillarAverages).reduce((a, b) => a + b, 0) / 
                     Object.keys(pillarAverages).length;

      return {
        sessionId: session.id,
        date: session.completedAt || session.startedAt,
        overallScore: parseFloat(overall.toFixed(2)),
        pillarScores: pillarAverages
      };
    });

    return {
      targetId,
      assessmentCount: trends.length,
      trends,
      latestScore: trends[trends.length - 1]?.overallScore || 0,
      oldestScore: trends[0]?.overallScore || 0,
      improvement: trends.length > 1 
        ? parseFloat((trends[trends.length - 1].overallScore - trends[0].overallScore).toFixed(2))
        : 0
    };
  }

  /**
   * Send message to Coach Agent
   */
  async sendToCoach(message: string, data: any) {
    return {
      from: 'analyst',
      to: 'coach',
      message,
      data,
      timestamp: new Date()
    };
  }

  /**
   * Generate comprehensive insights
   */
  async generateInsights(sessionId: string): Promise<MaturityInsight> {
    const maturity = await this.calculateFullMaturity(sessionId);
    const weakAreas = await this.identifyWeakAreas(sessionId);

    // Identify strengths (scores >= 2.5)
    const strengths = Object.entries(maturity.pillarScores)
      .filter(([_, score]) => (score as number) >= 2.5)
      .map(([pillar, _]) => pillar);

    // Get weaknesses
    const weaknesses = weakAreas.weakAreas.map(w => w.pillar);

    // Generate recommendations
    const improvementPlan = await this.generateImprovementPlan(sessionId);
    const recommendations = improvementPlan.recommendations.map(r => 
      `${r.topic}: ${r.actions[0]}`
    );

    return {
      overallScore: maturity.overallScore,
      maturityLevel: maturity.maturityLevel,
      strengths,
      weaknesses,
      recommendations
    };
  }

  /**
   * Helper: Get maturity level from score
   */
  private getMaturityLevel(score: number): string {
    if (score >= 2.7) return 'Optimized';
    if (score >= 2.0) return 'Managed';
    if (score >= 1.3) return 'Developing';
    return 'Initial';
  }

  /**
   * Helper: Calculate percentile
   */
  private calculatePercentile(score: number, benchmark: number): number {
    const percentile = ((score / (benchmark * 1.5)) * 100);
    return Math.min(Math.round(percentile), 100);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.analysisCache.clear();
  }
}
