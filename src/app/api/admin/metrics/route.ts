import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/metrics - Get all metrics
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const topicId = url.searchParams.get('topicId');
    const level = url.searchParams.get('level');
    const active = url.searchParams.get('active');

    const where: any = {};
    if (topicId) where.topicId = topicId;
    if (level) where.level = parseInt(level);
    if (active !== null) where.active = active === 'true';

    const metrics = await prisma.metric.findMany({
      where,
      include: {
        topic: {
          include: {
            pillar: true
          }
        }
      },
      orderBy: [
        { topic: { pillar: { name: 'asc' } } },
        { topic: { name: 'asc' } },
        { level: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

// POST /api/admin/metrics - Create a new metric
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      topicId, 
      name, 
      description, 
      metricType, 
      minValue, 
      maxValue, 
      weight, 
      level, 
      active, 
      tags 
    } = body;

    if (!topicId || !name || !metricType) {
      return NextResponse.json(
        { error: 'Topic ID, name, and metric type are required' },
        { status: 400 }
      );
    }

    const metric = await prisma.metric.create({
      data: {
        topicId,
        name,
        description,
        metricType,
        minValue: minValue || 1,
        maxValue: maxValue || 3,
        weight: weight || 1.0,
        level: level || 1,
        active: active !== undefined ? active : true,
        tags: tags || [],
      },
      include: {
        topic: {
          include: {
            pillar: true
          }
        }
      }
    });

    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    console.error('Error creating metric:', error);
    return NextResponse.json(
      { error: 'Failed to create metric' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/metrics - Update a metric
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      name, 
      description, 
      metricType, 
      minValue, 
      maxValue, 
      weight, 
      level, 
      active, 
      tags 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Metric ID is required' },
        { status: 400 }
      );
    }

    const metric = await prisma.metric.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(metricType && { metricType }),
        ...(minValue !== undefined && { minValue }),
        ...(maxValue !== undefined && { maxValue }),
        ...(weight !== undefined && { weight }),
        ...(level !== undefined && { level }),
        ...(active !== undefined && { active }),
        ...(tags !== undefined && { tags }),
      },
      include: {
        topic: {
          include: {
            pillar: true
          }
        }
      }
    });

    return NextResponse.json(metric);
  } catch (error) {
    console.error('Error updating metric:', error);
    return NextResponse.json(
      { error: 'Failed to update metric' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/metrics - Delete a metric
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Metric ID is required' },
        { status: 400 }
      );
    }

    // Delete assessment results first due to foreign key constraints
    await prisma.assessmentResult.deleteMany({
      where: { metricId: id }
    });

    await prisma.metric.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting metric:', error);
    return NextResponse.json(
      { error: 'Failed to delete metric' },
      { status: 500 }
    );
  }
}