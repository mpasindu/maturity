import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { MaturityCalculator } from '@/lib/maturity-calculator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('Loading detailed assessment data for ID:', id);

    // Find by assessment session ID
    const assessmentSession = await prisma.assessmentSession.findUnique({
      where: { id },
      include: {
        target: {
          include: {
            organization: true
          }
        },
        assessmentResults: {
          include: {
            metric: {
              include: {
                topic: {
                  include: { pillar: true }
                }
              }
            }
          }
        }
      }
    });

    if (!assessmentSession) {
      return NextResponse.json({
        success: false,
        error: 'Assessment not found'
      }, { status: 404 });
    }

    // Calculate assessment analysis using MaturityCalculator
    const results = assessmentSession.assessmentResults;
    
    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No assessment results found'
      }, { status: 404 });
    }

    // Use the same calculation engine as the results page
    const calculator = MaturityCalculator.getInstance();
    
    // Group results by pillar for calculation (same as results page)
    const pillarGroups = results.reduce((acc: any, result: any) => {
      const pillarId = result.metric.topic.pillar.id;
      if (!acc[pillarId]) {
        acc[pillarId] = {
          pillar: result.metric.topic.pillar,
          topics: new Map()
        };
      }
      
      const topicId = result.metric.topic.id;
      if (!acc[pillarId].topics.has(topicId)) {
        acc[pillarId].topics.set(topicId, {
          topic: result.metric.topic,
          metrics: []
        });
      }
      
      acc[pillarId].topics.get(topicId).metrics.push({
        metric: result.metric,
        result: result
      });
      
      return acc;
    }, {});

    // Calculate pillar scores using the same logic as results page
    const calculatedPillarScores = Object.values(pillarGroups).map((group: any) => {
      const topicScores = Array.from(group.topics.values()).map((topicData: any) => {
        const metricScores = topicData.metrics.map((metricData: any) => {
          const metricScore = calculator.calculateMetricScore(
            Number(metricData.result.value),
            metricData.metric.metricType as any,
            Number(metricData.metric.minValue),
            Number(metricData.metric.maxValue),
            Number(metricData.metric.weight)
          );
          
          return {
            ...metricScore,
            metricId: metricData.metric.id,
            metricName: metricData.metric.name,
          };
        });

        const topicScore = calculator.calculateTopicScore(metricScores, Number(topicData.topic.weight));
        
        return {
          ...topicScore,
          topicId: topicData.topic.id,
          topicName: topicData.topic.name,
        };
      });

      const pillarScore = calculator.calculatePillarScore(topicScores, Number(group.pillar.weight));

      return {
        ...pillarScore,
        pillarId: group.pillar.id,
        pillarName: group.pillar.name,
        category: group.pillar.category as any,
        description: group.pillar.description,
      };
    });

    // Calculate overall maturity using the same logic as results page
    const overallMaturity = calculator.calculateOverallMaturity(calculatedPillarScores);
    const overallScore = overallMaturity.overallScore;

    // Helper functions for dashboard format using MaturityCalculator
    const getMaturityLevel = (score: number): string => {
      const maturityLevel = calculator.determineMaturityLevel(score);
      // Map to dashboard-friendly names
      switch (maturityLevel.name) {
        case 'Initial': return 'Initial';
        case 'Developing': return 'Managed';
        case 'Defined': return 'Defined';
        case 'Managed':
        case 'Optimized': return 'Optimizing';
        default: return 'Initial';
      }
    };

    const getMaturityLevelNumber = (score: number): number => {
      const maturityLevel = calculator.determineMaturityLevel(score);
      return maturityLevel.level;
    };

    const getLevelColor = (score: number): string => {
      const maturityLevel = calculator.determineMaturityLevel(score);
      return maturityLevel.color;
    };

    // Convert calculated pillar scores to dashboard format
    const pillars = calculatedPillarScores.map(pillarScore => {
      const level = getMaturityLevelNumber(pillarScore.score);
      const levelName = getMaturityLevel(pillarScore.score);
      const color = getLevelColor(pillarScore.score);
      
      // Create topic summaries from the calculated data
      const topics = pillarScore.topicScores?.map((topicScore: any) => ({
        name: topicScore.topicName,
        level: getMaturityLevel(topicScore.score),
        color: getLevelColor(topicScore.score)
      })) || [];
      
      return {
        id: pillarScore.pillarId,
        name: pillarScore.pillarName,
        score: Math.round(pillarScore.score * 100) / 100,
        level: level,
        maturityLevel: levelName,
        color: color,
        topics: topics
      };
    });

    // Create topic details from calculated data
    const topicDetails = calculatedPillarScores.flatMap(pillarScore => 
      pillarScore.topicScores?.map((topicScore: any) => {
        const level = getMaturityLevelNumber(topicScore.score);
        const levelName = getMaturityLevel(topicScore.score);
        const color = getLevelColor(topicScore.score);
        
        return {
          pillar: pillarScore.pillarName,
          topic: topicScore.topicName,
          level: levelName,
          levelNumber: level,
          color: color
        };
      }) || []
    );
    
    const overallLevelName = getMaturityLevel(overallScore);
    const overallMaturityPercent = Math.round(((overallScore - 1) / 4) * 100);

    // Generate insights and recommendations
    const keyHighlights = [
      `Assessment completed with ${results.length} metrics evaluated`,
      `Overall maturity level: ${overallLevelName}`,
      `Strongest pillar: ${pillars.reduce((best, pillar) => pillar.score > best.score ? pillar : best, pillars[0])?.name || 'N/A'}`,
      `${pillars.filter(p => p.level >= 3).length} pillar(s) at defined level or above`
    ];

    const recommendations = [
      {
        type: 'improvement',
        title: 'Focus on lowest scoring pillars',
        description: `Prioritize improvement in ${pillars.filter(p => p.level <= 2).map(p => p.name).join(', ')} to raise overall maturity.`,
        priority: 'high'
      },
      {
        type: 'guidance',
        title: 'Establish baseline metrics',
        description: 'Document current state and create improvement roadmap based on assessment results.',
        priority: 'medium'
      },
      {
        type: 'review',
        title: 'Regular reassessment',
        description: 'Schedule quarterly reviews to track progress and adjust improvement plans.',
        priority: 'low'
      }
    ];

    const assessmentDetail = {
      id: assessmentSession.id,
      name: assessmentSession.target.name,
      type: assessmentSession.target.type,
      overallScore: Math.round(overallScore * 100) / 100,
      maturityLevel: overallLevelName,
      overallMaturityPercent: overallMaturityPercent,
      confidence: 85,
      lastAssessed: assessmentSession.lastModified?.toISOString() || assessmentSession.startedAt?.toISOString() || new Date().toISOString(),
      assessor: 'System Assessment',
      pillars: pillars,
      topicDetails: topicDetails,
      keyHighlights: keyHighlights,
      recommendations: recommendations,
      nextActions: [
        'Review detailed assessment results',
        'Create improvement action plan',
        'Assign ownership for identified gaps',
        'Schedule follow-up assessment'
      ]
    };

    return NextResponse.json({
      success: true,
      data: assessmentDetail
    });

  } catch (error) {
    console.error('Error loading assessment detail:', error);
    return NextResponse.json(
      { error: 'Failed to load assessment detail' },
      { status: 500 }
    );
  }
}
