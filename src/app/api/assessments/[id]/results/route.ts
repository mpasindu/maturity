import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { MaturityCalculator } from '@/lib/maturity-calculator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get assessment session from database
    const session = await prisma.assessmentSession.findUnique({
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
        { error: 'Assessment session not found' },
        { status: 404 }
      );
    }

    if (session.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Assessment not completed yet' },
        { status: 400 }
      );
    }

    // Calculate scores using the maturity calculator
    const calculator = MaturityCalculator.getInstance();
    
    // Group results by pillar for calculation
    const pillarGroups = session.assessmentResults.reduce((acc: any, result: any) => {
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

    // Calculate pillar scores
    const pillarScores = Object.values(pillarGroups).map((group: any) => {
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

    // Calculate overall maturity
    const overallMaturity = calculator.calculateOverallMaturity(pillarScores);

    // Mock recommendations for now (can be enhanced later)
    const mockRecommendations = [
      {
        title: "Improve Security Baseline",
        description: "Focus on implementing basic security measures and policies",
        priority: "high",
        pillar: "Security"
      },
      {
        title: "Enhance Monitoring Capabilities", 
        description: "Implement comprehensive monitoring and alerting systems",
        priority: "medium",
        pillar: "Operational Excellence"
      }
    ];

    return NextResponse.json({
      session: {
        id: session.id,
        name: session.target?.name ? `${session.target.name} Assessment` : 'Assessment',
        organization: session.target?.organization || null,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        status: session.status,
      },
      overallMaturity,
      pillarScores,
      recommendations: mockRecommendations,
    });

  } catch (error) {
    console.error('Error fetching assessment results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}