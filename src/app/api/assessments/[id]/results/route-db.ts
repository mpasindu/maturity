import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { MaturityCalculator } from '@/lib/maturity-calculator';

const db = DatabaseService.getInstance();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await db.client.assessmentSession.findUnique({
      where: { id: params.id },
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
      },
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

    // Calculate overall maturity and pillar scores
    const calculator = MaturityCalculator.getInstance();
    
    // Get all assessment results for this session
    const assessmentResults = await db.client.assessmentResult.findMany({
      where: { sessionId: params.id },
      include: {
        metric: {
          include: {
            topic: {
              include: {
                pillar: true,
              },
            },
          },
        },
      },
    });

    // Get pillar scores
    const pillars = await db.client.maturityPillar.findMany({
      include: {
        topics: {
          include: {
            metrics: true,
          },
        },
      },
    });

    const pillarScores = pillars.map((pillar: any) => {
      const topicScores = pillar.topics.map((topic: any) => {
        const metricScores = topic.metrics.map((metric: any) => {
          const result = assessmentResults.find((r: any) => r.metricId === metric.id);
          const value = result?.value ? Number(result.value) : 0;
          return calculator.calculateMetricScore(
            value,
            metric.metricType,
            metric.weight,
            metric.minValue,
            metric.maxValue
          );
        });

        return calculator.calculateTopicScore(metricScores, topic.weight);
      });

      return calculator.calculatePillarScore(topicScores, pillar.weight);
    });

    const overallMaturity = calculator.calculateOverallMaturity(pillarScores);

    // Format pillar scores for response
    const formattedPillarScores = pillars.map((pillar: any, index: number) => {
      const topicScores = pillar.topics.map((topic: any, topicIndex: number) => {
        const metricScores = topic.metrics.map((metric: any) => {
          const result = assessmentResults.find((r: any) => r.metricId === metric.id);
          const value = result?.value ? Number(result.value) : 0;
          return calculator.calculateMetricScore(
            value,
            metric.metricType,
            metric.weight,
            metric.minValue,
            metric.maxValue
          );
        });

        const topicScore = calculator.calculateTopicScore(metricScores, topic.weight);
        return {
          topicId: topic.id,
          topicName: topic.name,
          score: topicScore.score,
        };
      });

      return {
        pillarId: pillar.id,
        pillarName: pillar.name,
        score: pillarScores[index].score,
        topicScores,
      };
    });

    // Generate recommendations
    const recommendations = calculator.generateRecommendations(pillarScores);

    return NextResponse.json({
      session: {
        id: session.id,
        targetName: session.target.name,
        organization: session.target.organization,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        status: session.status,
      },
      overallMaturity,
      pillarScores: formattedPillarScores,
      recommendations,
    });

  } catch (error) {
    console.error('Error fetching assessment results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}