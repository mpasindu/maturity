import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch single assessment target
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const target = await prisma.assessmentTarget.findUnique({
      where: { id },
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

    if (!target) {
      return NextResponse.json(
        { error: 'Assessment target not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(target);
  } catch (error) {
    console.error('Error fetching assessment target:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update assessment target
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Check if target exists
    const existingTarget = await prisma.assessmentTarget.findUnique({
      where: { id },
    });

    if (!existingTarget) {
      return NextResponse.json(
        { error: 'Assessment target not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.name || !body.type || !body.organizationId) {
      return NextResponse.json(
        { error: 'Name, type, and organization are required' },
        { status: 400 }
      );
    }

    // Update assessment target
    const target = await prisma.assessmentTarget.update({
      where: { id },
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

    return NextResponse.json(target);
  } catch (error) {
    console.error('Error updating assessment target:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete assessment target
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if target exists
    const existingTarget = await prisma.assessmentTarget.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assessmentSessions: true,
            maturityCalculations: true,
          },
        },
      },
    });

    if (!existingTarget) {
      return NextResponse.json(
        { error: 'Assessment target not found' },
        { status: 404 }
      );
    }

    // Check if target has associated data
    if (existingTarget._count.assessmentSessions > 0 || existingTarget._count.maturityCalculations > 0) {
      return NextResponse.json(
        { error: 'Cannot delete assessment target with existing assessments or calculations' },
        { status: 409 }
      );
    }

    // Delete assessment target
    await prisma.assessmentTarget.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Assessment target deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment target:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}