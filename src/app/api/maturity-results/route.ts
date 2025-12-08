import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get latest maturity results for targets
 * GET /api/maturity-results?organizationId=xxx
 * GET /api/maturity-results?targetId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const targetId = searchParams.get('targetId');

    if (!organizationId && !targetId) {
      return NextResponse.json(
        { success: false, error: 'Either organizationId or targetId is required' },
        { status: 400 }
      );
    }

    if (targetId) {
      // Get latest result for specific target
      const result = await prisma.maturityCalculation.findFirst({
        where: { 
          targetId: targetId
        },
        include: {
          target: true
        },
        orderBy: {
          calculatedAt: 'desc'
        }
      });

      if (!result) {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No maturity results found for this target'
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          targetId: result.targetId,
          targetName: result.target.name,
          targetType: result.target.type,
          overallScore: Number(result.overallScore),
          maturityLevel: result.maturityLevel,
          lastCalculated: result.calculatedAt,
          sessionId: result.sessionId,
          organizationId: result.target.organizationId,
          pillarScores: result.pillarBreakdown,
          completionPercentage: (result.explanation as any)?.completionPercentage,
          scoringRuleName: 'Dynamic Scoring Rule'
        }
      });
    }

    if (organizationId) {
      // Get latest results for all targets in organization
      const results = await prisma.maturityCalculation.findMany({
        where: { 
          target: {
            organizationId: organizationId
          }
        },
        include: {
          target: true
        },
        orderBy: {
          calculatedAt: 'desc'
        }
      });

      const data = results.map(result => ({
        targetId: result.targetId,
        targetName: result.target.name,
        targetType: result.target.type,
        overallScore: Number(result.overallScore),
        maturityLevel: result.maturityLevel,
        lastCalculated: result.calculatedAt,
        sessionId: result.sessionId,
        organizationId: result.target.organizationId,
        pillarScores: result.pillarBreakdown,
        completionPercentage: (result.explanation as any)?.completionPercentage,
        scoringRuleName: 'Dynamic Scoring Rule'
      }));

      // Calculate organization stats
      const totalTargets = await prisma.assessmentTarget.count({
        where: { organizationId }
      });

      const assessedTargets = results.length;
      const averageScore = assessedTargets > 0 
        ? results.reduce((sum, result) => sum + Number(result.overallScore), 0) / assessedTargets
        : 0;

      // Calculate maturity level distribution
      const maturityDistribution = results.reduce((acc, result) => {
        acc[result.maturityLevel] = (acc[result.maturityLevel] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return NextResponse.json({
        success: true,
        data: data,
        stats: {
          totalTargets,
          assessedTargets,
          averageScore: Math.round(averageScore * 100) / 100,
          maturityDistribution,
          lastAssessmentDate: results.length > 0 ? results[0].calculatedAt : null
        }
      });
    }

  } catch (error) {
    console.error('Error fetching maturity results:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch maturity results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}