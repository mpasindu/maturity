import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    const scoringRules = await prisma.scoringRules.findMany({
      orderBy: [
        { isDefault: 'desc' },
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: scoringRules
    });
  } catch (error) {
    console.error('Error fetching scoring rules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scoring rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // If setting as default, unset other defaults first
    if (body.isDefault) {
      await prisma.scoringRules.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const scoringRule = await prisma.scoringRules.create({
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive ?? true,
        isDefault: body.isDefault ?? false,
        
        // Level 1: Metric Scoring
        metricAnsweredValue: body.metricAnsweredValue ?? 1,
        metricUnansweredValue: body.metricUnansweredValue ?? 0,
        metricMaxLevel: body.metricMaxLevel ?? 5,
        
        // Level 2: Topic Scoring
        topicScoreMethod: body.topicScoreMethod ?? 'PERCENTAGE_TO_SCALE',
        topicScaleMin: body.topicScaleMin ?? 0.0,
        topicScaleMax: body.topicScaleMax ?? 5.0,
        topicExcludeEmpty: body.topicExcludeEmpty ?? true,
        
        // Level 3: Pillar Scoring
        pillarScoreMethod: body.pillarScoreMethod ?? 'AVERAGE',
        pillarExcludeEmpty: body.pillarExcludeEmpty ?? true,
        pillarMinTopics: body.pillarMinTopics ?? 1,
        
        // Level 4: Overall Scoring
        overallScoreMethod: body.overallScoreMethod ?? 'AVERAGE',
        overallExcludeEmpty: body.overallExcludeEmpty ?? true,
        overallMinPillars: body.overallMinPillars ?? 1,
        
        // Additional Configuration
        roundingPrecision: body.roundingPrecision ?? 2,
        penalizeIncomplete: body.penalizeIncomplete ?? true,
        
        createdBy: body.createdBy || 'admin'
      }
    });

    return NextResponse.json({
      success: true,
      data: scoringRule
    });
  } catch (error) {
    console.error('Error creating scoring rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create scoring rule' },
      { status: 500 }
    );
  }
}