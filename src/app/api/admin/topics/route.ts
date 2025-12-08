import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/topics - Get all topics with metrics
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pillarId = url.searchParams.get('pillarId');

    const where = pillarId ? { pillarId } : {};

    const topics = await prisma.assessmentTopic.findMany({
      where,
      include: {
        metrics: {
          orderBy: { level: 'asc' }
        },
        pillar: true
      },
      orderBy: { orderIndex: 'asc' }
    });

    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}

// POST /api/admin/topics - Create a new topic
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pillarId, name, description, weight, orderIndex } = body;

    if (!pillarId || !name) {
      return NextResponse.json(
        { error: 'Pillar ID and name are required' },
        { status: 400 }
      );
    }

    const topic = await prisma.assessmentTopic.create({
      data: {
        pillarId,
        name,
        description,
        weight: weight || 1.0,
        orderIndex: orderIndex || 0,
        isActive: true,
      },
      include: {
        metrics: true,
        pillar: true
      }
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json(
      { error: 'Failed to create topic' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/topics - Update a topic
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, weight, orderIndex, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    const topic = await prisma.assessmentTopic.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(weight !== undefined && { weight }),
        ...(orderIndex !== undefined && { orderIndex }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        metrics: true,
        pillar: true
      }
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json(
      { error: 'Failed to update topic' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/topics - Delete a topic
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    // Delete metrics first due to foreign key constraints
    await prisma.assessmentResult.deleteMany({
      where: {
        metric: {
          topicId: id
        }
      }
    });

    await prisma.metric.deleteMany({
      where: { topicId: id }
    });

    await prisma.assessmentTopic.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json(
      { error: 'Failed to delete topic' },
      { status: 500 }
    );
  }
}