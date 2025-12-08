import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

/**
 * API endpoint to calculate maturity scores for a completed assessment
 * POST /api/assessments/calculate-maturity
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting calculation API endpoint');
    console.log('📋 Prisma client available:', !!prisma);
    console.log('📋 Prisma client methods:', Object.keys(prisma));
    
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Starting maturity calculation for session: ${sessionId}`);

    // Get the assessment session
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
      return NextResponse.json(
        { success: false, error: 'Assessment session not found' },
        { status: 404 }
      );
    }

    // Get scoring rule (from session or default)
    let scoringRule;
    if (session.scoringRuleId) {
      scoringRule = await prisma.scoringRules.findUnique({
        where: { id: session.scoringRuleId }
      });
    }
    
    if (!scoringRule) {
      scoringRule = await prisma.scoringRules.findFirst({
        where: { isDefault: true, isActive: true }
      });
    }

    if (!scoringRule) {
      return NextResponse.json(
        { success: false, error: 'No scoring rule configured' },
        { status: 400 }
      );
    }

    // Calculate maturity scores using the new service
    const result = await calculateMaturityScores(session, scoringRule);

    // Store the results
    await storeMaturityResults(result);

    console.log(`✅ Maturity calculation completed for session: ${sessionId}`);

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error calculating maturity scores:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to calculate maturity scores',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate maturity scores using the 4-level hierarchy
 */
async function calculateMaturityScores(session: any, scoringRule: any) {
  console.log(`📏 Using scoring rule: ${scoringRule.name}`);

  // Get all pillars, topics, and metrics
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

  // Organize assessment results by metric ID
  const resultsMap = new Map<string, number>();
  session.assessmentResults.forEach((result: any) => {
    resultsMap.set(result.metricId, Number(result.value));
  });

  const warnings: string[] = [];
  
  // Level 1: Calculate Metric Scores
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
          const score = scoringRule.metricAnsweredValue === 1 ? metric.level : scoringRule.metricAnsweredValue;
          
          metricScores[metric.id] = {
            score,
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

  // Level 2: Calculate Topic Scores
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
      
      let topicScore = 0;
      const validScores = topicMetrics.filter(m => m.value !== null);
      
      if (validScores.length > 0) {
        switch (scoringRule.topicScoreMethod) {
          case 'AVERAGE':
            topicScore = validScores.reduce((sum, m) => sum + m.score, 0) / validScores.length;
            break;
          case 'WEIGHTED_AVERAGE':
            const totalWeight = validScores.reduce((sum, m) => sum + m.weight, 0);
            const weightedSum = validScores.reduce((sum, m) => sum + (m.score * m.weight), 0);
            topicScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
            break;
          case 'PERCENTAGE_TO_SCALE':
            const percentage = validScores.reduce((sum, m) => sum + m.score, 0) / topicMetrics.length;
            const scale = Number(scoringRule.topicScaleMax) - Number(scoringRule.topicScaleMin);
            topicScore = Number(scoringRule.topicScaleMin) + (percentage * scale);
            break;
          default:
            topicScore = validScores.reduce((sum, m) => sum + m.score, 0) / validScores.length;
        }
      }
      
      topicScores[topic.id] = {
        score: Math.max(0, Math.min(Number(scoringRule.topicScaleMax), topicScore)),
        answered: answeredCount,
        total: topicMetrics.length,
        weight: Number(topic.weight),
        pillarId: pillar.id
      };
    }
  }

  console.log(`📋 Calculated ${Object.keys(topicScores).length} topic scores`);

  // Level 3: Calculate Pillar Scores
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
    
    let pillarScore = 0;
    const validTopics = scoringRule.pillarExcludeEmpty 
      ? pillarTopics.filter(t => t.answered > 0)
      : pillarTopics;
    
    if (validTopics.length > 0 && answeredTopics >= scoringRule.pillarMinTopics) {
      switch (scoringRule.pillarScoreMethod) {
        case 'AVERAGE':
          pillarScore = validTopics.reduce((sum, t) => sum + t.score, 0) / validTopics.length;
          break;
        case 'WEIGHTED_AVERAGE':
          const totalWeight = validTopics.reduce((sum, t) => sum + t.weight, 0);
          const weightedSum = validTopics.reduce((sum, t) => sum + (t.score * t.weight), 0);
          pillarScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
          break;
        default:
          pillarScore = validTopics.reduce((sum, t) => sum + t.score, 0) / validTopics.length;
      }
    }
    
    pillarScores[pillar.id] = {
      score: Math.max(0, pillarScore),
      level: getMaturityLevel(pillarScore),
      weight: Number(pillar.weight),
      topicCount: pillarTopics.length,
      answeredTopics: answeredTopics
    };
  }

  console.log(`🏛️ Calculated ${Object.keys(pillarScores).length} pillar scores`);

  // Level 4: Calculate Overall Score
  const pillarValues = Object.values(pillarScores);
  const answeredPillars = pillarValues.filter((p: any) => p.answeredTopics > 0).length;
  
  if (answeredPillars < scoringRule.overallMinPillars) {
    warnings.push(`Only ${answeredPillars} pillars have answers, minimum required: ${scoringRule.overallMinPillars}`);
  }
  
  let overallScore = 0;
  const validPillars = scoringRule.overallExcludeEmpty 
    ? pillarValues.filter((p: any) => p.answeredTopics > 0)
    : pillarValues;
  
  if (validPillars.length > 0 && answeredPillars >= scoringRule.overallMinPillars) {
    switch (scoringRule.overallScoreMethod) {
      case 'AVERAGE':
        overallScore = validPillars.reduce((sum: number, p: any) => sum + p.score, 0) / validPillars.length;
        break;
      case 'WEIGHTED_AVERAGE':
        const totalWeight = validPillars.reduce((sum: number, p: any) => sum + p.weight, 0);
        const weightedSum = validPillars.reduce((sum: number, p: any) => sum + (p.score * p.weight), 0);
        overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
        break;
      default:
        overallScore = validPillars.reduce((sum: number, p: any) => sum + p.score, 0) / validPillars.length;
    }
  }

  const completionPercentage = (answeredMetrics / totalMetrics) * 100;
  const finalScore = Math.round(overallScore * Math.pow(10, scoringRule.roundingPrecision)) / Math.pow(10, scoringRule.roundingPrecision);

  console.log(`🎯 Overall score: ${finalScore}, Completion: ${completionPercentage.toFixed(1)}%`);

  return {
    sessionId: session.id,
    targetId: session.targetId,
    targetType: session.target.type, // Add target type
    scoringRuleId: scoringRule.id,
    overallScore: finalScore,
    maturityLevel: getMaturityLevel(finalScore),
    confidence: completionPercentage / 100, // Use completion percentage as confidence
    algorithmVersion: '1.0', // Version of the calculation algorithm
    pillarBreakdown: pillarScores, // Rename to match database schema
    topicBreakdown: topicScores,   // Rename to match database schema
    metricBreakdown: metricScores, // Rename to match database schema
    explanation: {
      calculatedAt: new Date().toISOString(),
      ruleName: scoringRule.name,
      totalMetrics,
      answeredMetrics,
      completionPercentage,
      warnings
    }
  };
}

/**
 * Store maturity calculation results
 */
async function storeMaturityResults(result: any) {
  console.log(`💾 Storing calculation results for target: ${result.targetId}`);

  // Create new result record (simplified without isLatest logic)
  const storedResult = await prisma.maturityCalculation.create({
    data: {
      sessionId: result.sessionId,
      targetId: result.targetId,
      targetType: result.targetType,
      overallScore: result.overallScore,
      maturityLevel: result.maturityLevel,
      confidence: result.confidence,
      algorithmVersion: result.algorithmVersion,
      pillarBreakdown: result.pillarBreakdown,
      topicBreakdown: result.topicBreakdown,
      metricBreakdown: result.metricBreakdown,
      explanation: result.explanation,
      calculatedAt: new Date()
    }
  });

  console.log(`✅ Successfully stored calculation results with ID: ${storedResult.id}`);
  return storedResult;
}

/**
 * Convert numerical score to maturity level
 */
function getMaturityLevel(score: number): string {
  if (score >= 4.0) return 'OPTIMIZING';
  if (score >= 3.0) return 'DEFINED';
  if (score >= 2.0) return 'MANAGED';
  return 'INITIAL';
}