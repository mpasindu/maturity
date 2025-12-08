import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const scoringRule = await prisma.scoringRules.findUnique({
      where: { id }
    });

    if (!scoringRule) {
      return NextResponse.json(
        { success: false, error: 'Scoring rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: scoringRule
    });
  } catch (error) {
    console.error('Error fetching scoring rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scoring rule' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // If setting as default, unset other defaults first
    if (body.isDefault) {
      await prisma.scoringRules.updateMany({
        where: { 
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    const scoringRule = await prisma.scoringRules.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
        isDefault: body.isDefault,
        
        // Level 1: Metric Scoring
        metricAnsweredValue: body.metricAnsweredValue,
        metricUnansweredValue: body.metricUnansweredValue,
        metricMaxLevel: body.metricMaxLevel,
        
        // Level 2: Topic Scoring
        topicScoreMethod: body.topicScoreMethod,
        topicScaleMin: body.topicScaleMin,
        topicScaleMax: body.topicScaleMax,
        topicExcludeEmpty: body.topicExcludeEmpty,
        
        // Level 3: Pillar Scoring
        pillarScoreMethod: body.pillarScoreMethod,
        pillarExcludeEmpty: body.pillarExcludeEmpty,
        pillarMinTopics: body.pillarMinTopics,
        
        // Level 4: Overall Scoring
        overallScoreMethod: body.overallScoreMethod,
        overallExcludeEmpty: body.overallExcludeEmpty,
        overallMinPillars: body.overallMinPillars,
        
        // Additional Configuration
        roundingPrecision: body.roundingPrecision,
        penalizeIncomplete: body.penalizeIncomplete
      }
    });

    return NextResponse.json({
      success: true,
      data: scoringRule
    });
  } catch (error) {
    console.error('Error updating scoring rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update scoring rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Don't allow deleting the default rule
    const rule = await prisma.scoringRules.findUnique({ where: { id } });
    if (rule?.isDefault) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the default scoring rule' },
        { status: 400 }
      );
    }

    await prisma.scoringRules.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Scoring rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting scoring rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete scoring rule' },
      { status: 500 }
    );
  }
}