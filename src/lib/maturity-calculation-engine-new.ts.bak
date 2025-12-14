import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ScoringRuleConfig {
  id: string;
  name: string;
  metricAnsweredValue: number;
  metricUnansweredValue: number;
  metricMaxLevel: number;
  topicScoreMethod: string;
  topicScaleMin: number;
  topicScaleMax: number;
  topicExcludeEmpty: boolean;
  pillarScoreMethod: string;
  pillarExcludeEmpty: boolean;
  pillarMinTopics: number;
  overallScoreMethod: string;
  overallExcludeEmpty: boolean;
  overallMinPillars: number;
  roundingPrecision: number;
  penalizeIncomplete: boolean;
}

export interface MaturityCalculationResult {
  sessionId: string;
  targetId: string;
  scoringRuleId: string;
  overallScore: number;
  maturityLevel: string;
  pillarScores: Record<string, {
    score: number;
    level: string;
    weight: number;
    topicCount: number;
    answeredTopics: number;
  }>;
  topicScores: Record<string, {
    score: number;
    answered: number;
    total: number;
    weight: number;
    pillarId: string;
  }>;
  metricScores: Record<string, {
    score: number;
    value: number | null;
    level: number;
    weight: number;
    topicId: string;
  }>;
  calculationMetadata: {
    calculatedAt: string;
    ruleName: string;
    totalMetrics: number;
    answeredMetrics: number;
    completionPercentage: number;
    warnings: string[];
  };
}

export class MaturityCalculationService {
  
  /**
   * Calculate maturity scores for a completed assessment session
   */
  async calculateMaturityScores(sessionId: string): Promise<MaturityCalculationResult> {
    console.log(`🧮 Starting maturity calculation for session: ${sessionId}`);
    
    // 1. Get assessment session with all related data
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        target: true,
        scoringRule: true,
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
      throw new Error(`Assessment session ${sessionId} not found`);
    }

    // 2. Get scoring rules (use session's rule or default)
    let scoringRule = session.scoringRule;
    if (!scoringRule) {
      scoringRule = await prisma.scoringRules.findFirst({
        where: { isDefault: true, isActive: true }
      });
      if (!scoringRule) {
        throw new Error('No scoring rule configured and no default rule found');
      }
    }

    console.log(`📏 Using scoring rule: ${scoringRule.name}`);

    // 3. Get all pillars, topics, and metrics for complete structure
    const allPillars = await prisma.maturityPillar.findMany({
      where: { isActive: true },
      include: {
        topics: {
          where: { isActive: true },
          include: {
            metrics: {
              where: { active: true }
            }
          }
        }
      }
    });

    // 4. Organize assessment results by metric ID
    const resultsMap = new Map<string, number>();
    session.assessmentResults.forEach((result: any) => {
      resultsMap.set(result.metricId, Number(result.value));
    });

    const warnings: string[] = [];
    
    // 5. Calculate Level 1: Metric Scores
    const metricScores: Record<string, any> = {};
    let totalMetrics = 0;
    let answeredMetrics = 0;

    for (const pillar of allPillars) {
      for (const topic of pillar.topics) {
        for (const metric of topic.metrics) {
          totalMetrics++;
          const hasAnswer = resultsMap.has(metric.id);
          
          if (hasAnswer) {
            answeredMetrics++;
            const rawValue = resultsMap.get(metric.id)!;
            const normalizedScore = this.calculateMetricScore(
              rawValue, 
              metric.level, 
              this.convertScoringRule(scoringRule)
            );
            
            metricScores[metric.id] = {
              score: normalizedScore,
              value: rawValue,
              level: metric.level,
              weight: Number(metric.weight),
              topicId: topic.id
            };
          } else {
            metricScores[metric.id] = {
              score: scoringRule.metricUnansweredValue,
              value: null,
              level: metric.level,
              weight: Number(metric.weight),
              topicId: topic.id
            };
          }
        }
      }
    }

    console.log(`📊 Calculated ${Object.keys(metricScores).length} metric scores`);

    // 6. Calculate Level 2: Topic Scores
    const topicScores: Record<string, any> = {};
    
    for (const pillar of allPillars) {
      for (const topic of pillar.topics) {
        const topicMetrics = topic.metrics.map(m => metricScores[m.id]);
        const answeredCount = topicMetrics.filter(m => m.value !== null).length;
        
        if (scoringRule.topicExcludeEmpty && answeredCount === 0) {
          topicScores[topic.id] = {
            score: 0,
            answered: 0,
            total: topicMetrics.length,
            weight: Number(topic.weight),
            pillarId: pillar.id
          };
          continue;
        }
        
        const topicScore = this.calculateTopicScore(
          topicMetrics,
          this.convertScoringRule(scoringRule),
          answeredCount > 0
        );
        
        topicScores[topic.id] = {
          score: topicScore,
          answered: answeredCount,
          total: topicMetrics.length,
          weight: Number(topic.weight),
          pillarId: pillar.id
        };
      }
    }

    console.log(`📋 Calculated ${Object.keys(topicScores).length} topic scores`);

    // 7. Calculate Level 3: Pillar Scores
    const pillarScores: Record<string, any> = {};
    
    for (const pillar of allPillars) {
      const pillarTopics = pillar.topics.map(t => topicScores[t.id]);
      const answeredTopics = pillarTopics.filter(t => t.answered > 0).length;
      
      if (scoringRule.pillarExcludeEmpty && answeredTopics === 0) {
        pillarScores[pillar.id] = {
          score: 0,
          level: 'INITIAL',
          weight: Number(pillar.weight),
          topicCount: pillarTopics.length,
          answeredTopics: 0
        };
        continue;
      }
      
      if (answeredTopics < scoringRule.pillarMinTopics) {
        warnings.push(`Pillar ${pillar.name} has ${answeredTopics} answered topics, minimum required: ${scoringRule.pillarMinTopics}`);
      }
      
      const pillarScore = this.calculatePillarScore(
        pillarTopics,
        this.convertScoringRule(scoringRule),
        answeredTopics >= scoringRule.pillarMinTopics
      );
      
      pillarScores[pillar.id] = {
        score: pillarScore,
        level: this.getMaturityLevel(pillarScore),
        weight: Number(pillar.weight),
        topicCount: pillarTopics.length,
        answeredTopics: answeredTopics
      };
    }

    console.log(`🏛️ Calculated ${Object.keys(pillarScores).length} pillar scores`);

    // 8. Calculate Level 4: Overall Score
    const pillarValues = Object.values(pillarScores);
    const answeredPillars = pillarValues.filter((p: any) => p.answeredTopics > 0).length;
    
    if (answeredPillars < scoringRule.overallMinPillars) {
      warnings.push(`Only ${answeredPillars} pillars have answers, minimum required: ${scoringRule.overallMinPillars}`);
    }
    
    const overallScore = this.calculateOverallScore(
      pillarValues,
      this.convertScoringRule(scoringRule),
      answeredPillars >= scoringRule.overallMinPillars
    );

    const completionPercentage = (answeredMetrics / totalMetrics) * 100;

    console.log(`🎯 Overall score: ${overallScore}, Completion: ${completionPercentage.toFixed(1)}%`);

    const result: MaturityCalculationResult = {
      sessionId: session.id,
      targetId: session.targetId,
      scoringRuleId: scoringRule.id,
      overallScore: this.roundScore(overallScore, scoringRule.roundingPrecision),
      maturityLevel: this.getMaturityLevel(overallScore),
      pillarScores,
      topicScores,
      metricScores,
      calculationMetadata: {
        calculatedAt: new Date().toISOString(),
        ruleName: scoringRule.name,
        totalMetrics,
        answeredMetrics,
        completionPercentage,
        warnings
      }
    };

    return result;
  }

  /**
   * Convert Prisma ScoringRules model to ScoringRuleConfig
   */
  private convertScoringRule(scoringRule: any): ScoringRuleConfig {
    return {
      ...scoringRule,
      topicScaleMin: Number(scoringRule.topicScaleMin),
      topicScaleMax: Number(scoringRule.topicScaleMax),
      metricAnsweredValue: Number(scoringRule.metricAnsweredValue),
      metricUnansweredValue: Number(scoringRule.metricUnansweredValue),
      pillarMinTopics: Number(scoringRule.pillarMinTopics),
      overallMinPillars: Number(scoringRule.overallMinPillars),
      roundingPrecision: Number(scoringRule.roundingPrecision)
    };
  }

  /**
   * Calculate individual metric score based on scoring rules
   */
  private calculateMetricScore(
    rawValue: number, 
    metricLevel: number, 
    rules: ScoringRuleConfig
  ): number {
    if (rules.metricAnsweredValue === 1) {
      // Use the actual level value
      return metricLevel;
    } else {
      // Always use fixed value (typically 0)
      return rules.metricAnsweredValue;
    }
  }

  /**
   * Calculate topic score from metric scores
   */
  private calculateTopicScore(
    metricScores: any[],
    rules: ScoringRuleConfig,
    hasAnswers: boolean
  ): number {
    if (!hasAnswers && rules.topicExcludeEmpty) {
      return 0;
    }

    const validScores = metricScores.filter(m => m.value !== null);
    
    if (validScores.length === 0) {
      return 0;
    }

    let score = 0;
    
    switch (rules.topicScoreMethod) {
      case 'AVERAGE':
        score = validScores.reduce((sum, m) => sum + m.score, 0) / validScores.length;
        break;
        
      case 'WEIGHTED_AVERAGE':
        const totalWeight = validScores.reduce((sum, m) => sum + m.weight, 0);
        const weightedSum = validScores.reduce((sum, m) => sum + (m.score * m.weight), 0);
        score = totalWeight > 0 ? weightedSum / totalWeight : 0;
        break;
        
      case 'PERCENTAGE_TO_SCALE':
        const percentage = validScores.reduce((sum, m) => sum + m.score, 0) / metricScores.length;
        const scale = rules.topicScaleMax - rules.topicScaleMin;
        score = rules.topicScaleMin + (percentage * scale);
        break;
        
      case 'SUM':
        score = validScores.reduce((sum, m) => sum + m.score, 0);
        break;
        
      case 'MIN':
        score = Math.min(...validScores.map(m => m.score));
        break;
        
      case 'MAX':
        score = Math.max(...validScores.map(m => m.score));
        break;
        
      case 'MEDIAN':
        const sorted = validScores.map(m => m.score).sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        score = sorted.length % 2 === 0 
          ? (sorted[mid - 1] + sorted[mid]) / 2 
          : sorted[mid];
        break;
        
      default:
        score = validScores.reduce((sum, m) => sum + m.score, 0) / validScores.length;
    }

    return Math.max(0, Math.min(rules.topicScaleMax, score));
  }

  /**
   * Calculate pillar score from topic scores
   */
  private calculatePillarScore(
    topicScores: any[],
    rules: ScoringRuleConfig,
    meetsMinimum: boolean
  ): number {
    if (!meetsMinimum) {
      return 0;
    }

    const validTopics = rules.pillarExcludeEmpty 
      ? topicScores.filter(t => t.answered > 0)
      : topicScores;
    
    if (validTopics.length === 0) {
      return 0;
    }

    let score = 0;
    
    switch (rules.pillarScoreMethod) {
      case 'AVERAGE':
        score = validTopics.reduce((sum, t) => sum + t.score, 0) / validTopics.length;
        break;
        
      case 'WEIGHTED_AVERAGE':
        const totalWeight = validTopics.reduce((sum, t) => sum + t.weight, 0);
        const weightedSum = validTopics.reduce((sum, t) => sum + (t.score * t.weight), 0);
        score = totalWeight > 0 ? weightedSum / totalWeight : 0;
        break;
        
      default:
        score = validTopics.reduce((sum, t) => sum + t.score, 0) / validTopics.length;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate overall score from pillar scores
   */
  private calculateOverallScore(
    pillarScores: any[],
    rules: ScoringRuleConfig,
    meetsMinimum: boolean
  ): number {
    if (!meetsMinimum) {
      return 0;
    }

    const validPillars = rules.overallExcludeEmpty 
      ? pillarScores.filter(p => p.answeredTopics > 0)
      : pillarScores;
    
    if (validPillars.length === 0) {
      return 0;
    }

    let score = 0;
    
    switch (rules.overallScoreMethod) {
      case 'AVERAGE':
        score = validPillars.reduce((sum, p) => sum + p.score, 0) / validPillars.length;
        break;
        
      case 'WEIGHTED_AVERAGE':
        const totalWeight = validPillars.reduce((sum, p) => sum + p.weight, 0);
        const weightedSum = validPillars.reduce((sum, p) => sum + (p.score * p.weight), 0);
        score = totalWeight > 0 ? weightedSum / totalWeight : 0;
        break;
        
      default:
        score = validPillars.reduce((sum, p) => sum + p.score, 0) / validPillars.length;
    }

    return Math.max(0, score);
  }

  /**
   * Convert numerical score to maturity level
   */
  private getMaturityLevel(score: number): string {
    if (score >= 4.0) return 'OPTIMIZING';
    if (score >= 3.0) return 'DEFINED';
    if (score >= 2.0) return 'MANAGED';
    return 'INITIAL';
  }

  /**
   * Round score to specified precision
   */
  private roundScore(score: number, precision: number): number {
    const factor = Math.pow(10, precision);
    return Math.round(score * factor) / factor;
  }

  /**
   * Store calculated results in the database
   */
  async storeCalculationResults(result: MaturityCalculationResult): Promise<void> {
    console.log(`💾 Storing calculation results for target: ${result.targetId}`);
    
    // Mark any existing results as not latest
    await prisma.calculatedMaturityResult.updateMany({
      where: { 
        targetId: result.targetId,
        isLatest: true 
      },
      data: { isLatest: false }
    });

    // Create new result record
    await prisma.calculatedMaturityResult.create({
      data: {
        sessionId: result.sessionId,
        targetId: result.targetId,
        scoringRuleId: result.scoringRuleId,
        overallScore: result.overallScore,
        maturityLevel: result.maturityLevel,
        pillarScores: result.pillarScores,
        topicScores: result.topicScores,
        metricScores: result.metricScores,
        calculationMetadata: result.calculationMetadata,
        isLatest: true
      }
    });

    console.log(`✅ Successfully stored calculation results`);
  }

  /**
   * Get latest maturity results for a target
   */
  async getLatestResults(targetId: string): Promise<MaturityCalculationResult | null> {
    const result = await prisma.calculatedMaturityResult.findFirst({
      where: { 
        targetId,
        isLatest: true 
      },
      include: {
        session: true,
        target: true,
        scoringRule: true
      }
    });

    if (!result) {
      return null;
    }

    return {
      sessionId: result.sessionId,
      targetId: result.targetId,
      scoringRuleId: result.scoringRuleId,
      overallScore: Number(result.overallScore),
      maturityLevel: result.maturityLevel,
      pillarScores: result.pillarScores as any,
      topicScores: result.topicScores as any,
      metricScores: result.metricScores as any,
      calculationMetadata: result.calculationMetadata as any
    };
  }

  /**
   * Recalculate and store results for a completed assessment
   */
  async processCompletedAssessment(sessionId: string): Promise<MaturityCalculationResult> {
    console.log(`🔄 Processing completed assessment: ${sessionId}`);
    
    const result = await this.calculateMaturityScores(sessionId);
    await this.storeCalculationResults(result);
    
    console.log(`🎉 Assessment processing complete`);
    return result;
  }
}

export const maturityCalculationService = new MaturityCalculationService();