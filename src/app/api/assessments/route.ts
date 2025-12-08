import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const organizationId = searchParams.get('organizationId');

    // Build where clause for filtering
    const where: any = {};
    
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (organizationId) {
      where.target = {
        organizationId: organizationId
      };
    }

    // Get total count for pagination
    const total = await prisma.assessmentSession.count({ where });

    // Fetch assessments with pagination
    const dbSessions = await prisma.assessmentSession.findMany({
      where,
      include: {
        target: {
          include: {
            organization: true
          }
        }
      },
      orderBy: { lastModified: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    // Convert to expected format
    const assessments = dbSessions.map(session => ({
      id: session.id,
      name: session.target.name ? `${session.target.name} Assessment` : 'Assessment',
      organizationId: session.target.organizationId,
      organization: session.target.organization?.name || '',
      targetId: session.targetId,
      target: session.target,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString(),
      lastModified: session.lastModified.toISOString(),
      progress: 0 // TODO: Calculate actual progress
    }));

    return NextResponse.json({
      assessments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.targetId) {
      return NextResponse.json(
        { error: 'Assessment target is required' },
        { status: 400 }
      );
    }

    // Create assessment session in database
    const newSession = await prisma.assessmentSession.create({
      data: {
        targetId: body.targetId,
        assessorId: body.assessorId || 'system', // TODO: Get from auth
        status: 'DRAFT',
        progressData: {}
      },
      include: {
        target: {
          include: {
            organization: true
          }
        }
      }
    });

    // Convert to expected format
    const assessment = {
      id: newSession.id,
      name: newSession.target.name ? `${newSession.target.name} Assessment` : 'Assessment',
      organizationId: newSession.target.organizationId,
      organization: newSession.target.organization?.name || '',
      targetId: newSession.targetId,
      target: newSession.target,
      status: newSession.status,
      startedAt: newSession.startedAt.toISOString(),
      completedAt: newSession.completedAt?.toISOString(),
      lastModified: newSession.lastModified.toISOString(),
      progress: 0,
      responses: {} // Empty responses for new assessment
    };

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}