import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all assessment targets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (type) {
      where.type = type;
    }

    // Get total count for pagination
    const total = await prisma.assessmentTarget.count({ where });

    // Fetch assessment targets with organization data
    const targets = await prisma.assessmentTarget.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            assessmentSessions: true,
            maturityCalculations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return NextResponse.json({
      targets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching assessment targets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new assessment target
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type || !body.organizationId) {
      return NextResponse.json(
        { error: 'Name, type, and organization are required' },
        { status: 400 }
      );
    }

    // Create assessment target
    const target = await prisma.assessmentTarget.create({
      data: {
        name: body.name,
        type: body.type,
        description: body.description,
        organizationId: body.organizationId,
        technologyStack: body.technologyStack,
        cloudProvider: body.cloudProvider,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            assessmentSessions: true,
            maturityCalculations: true,
          },
        },
      },
    });

    return NextResponse.json(target, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment target:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}