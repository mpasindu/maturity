import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Build where clause
    const where: any = {};
    
    if (organizationId) {
      where.organizationId = organizationId;
    }

    // Fetch targets with their latest session info
    const dbTargets = await prisma.assessmentTarget.findMany({
      where,
      include: {
        organization: true,
        assessmentSessions: {
          orderBy: { lastModified: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            lastModified: true,
          }
        },
        _count: {
          select: {
            assessmentSessions: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform to expected format
    const targets = dbTargets.map(target => ({
      id: target.id,
      name: target.name,
      type: target.type,
      description: target.description,
      organization: target.organization ? {
        id: target.organization.id,
        name: target.organization.name
      } : undefined,
      _count: target._count,
      latestSession: target.assessmentSessions[0] || undefined
    }));

    return NextResponse.json({
      targets,
      total: targets.length
    });
  } catch (error) {
    console.error('Error fetching targets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, description, organizationId } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['APPLICATION', 'SYSTEM', 'PLATFORM'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be APPLICATION, SYSTEM, or PLATFORM' },
        { status: 400 }
      );
    }

    // Get or create default organization if none provided
    let targetOrgId = organizationId;
    if (!targetOrgId) {
      let defaultOrg = await prisma.organization.findFirst({
        where: { name: 'Default Organization' }
      });

      if (!defaultOrg) {
        defaultOrg = await prisma.organization.create({
          data: {
            name: 'Default Organization'
          }
        });
      }
      
      targetOrgId = defaultOrg.id;
    }

    // Create the target
    const target = await prisma.assessmentTarget.create({
      data: {
        name,
        type,
        description: description || null,
        organizationId: targetOrgId
      },
      include: {
        organization: true,
        _count: {
          select: {
            assessmentSessions: true
          }
        }
      }
    });

    return NextResponse.json({
      id: target.id,
      name: target.name,
      type: target.type,
      description: target.description,
      organization: target.organization ? {
        id: target.organization.id,
        name: target.organization.name
      } : undefined,
      _count: target._count
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating target:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
