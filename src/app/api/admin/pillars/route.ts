import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/pillars - Get all pillars with topics and metrics
export async function GET() {
  try {
    const pillars = await prisma.maturityPillar.findMany({
      include: {
        topics: {
          include: {
            metrics: {
              orderBy: { level: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(pillars);
  } catch (error) {
    console.error('Error fetching pillars:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pillars' },
      { status: 500 }
    );
  }
}

// POST /api/admin/pillars - Create a new pillar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, weight } = body;

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      );
    }

    const pillar = await prisma.maturityPillar.create({
      data: {
        name,
        description,
        category,
        weight: weight || 1.0,
        isActive: true,
      },
      include: {
        topics: {
          include: {
            metrics: true
          }
        }
      }
    });

    return NextResponse.json(pillar, { status: 201 });
  } catch (error) {
    console.error('Error creating pillar:', error);
    return NextResponse.json(
      { error: 'Failed to create pillar' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/pillars - Update a pillar
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, category, weight, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Pillar ID is required' },
        { status: 400 }
      );
    }

    const pillar = await prisma.maturityPillar.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(weight !== undefined && { weight }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        topics: {
          include: {
            metrics: true
          }
        }
      }
    });

    return NextResponse.json(pillar);
  } catch (error) {
    console.error('Error updating pillar:', error);
    return NextResponse.json(
      { error: 'Failed to update pillar' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/pillars - Delete a pillar
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Pillar ID is required' },
        { status: 400 }
      );
    }

    // Delete in correct order due to foreign key constraints
    await prisma.assessmentResult.deleteMany({
      where: {
        metric: {
          topic: {
            pillarId: id
          }
        }
      }
    });

    await prisma.metric.deleteMany({
      where: {
        topic: {
          pillarId: id
        }
      }
    });

    await prisma.assessmentTopic.deleteMany({
      where: { pillarId: id }
    });

    await prisma.maturityPillar.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pillar:', error);
    return NextResponse.json(
      { error: 'Failed to delete pillar' },
      { status: 500 }
    );
  }
}