/**
 * Assessment Types API Route
 * 
 * Provides CRUD operations for assessment types
 * Used by admin panel to manage available assessment types
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock data for development (replace with actual database queries)
const mockAssessmentTypes = [
  { id: '1', name: 'Application', description: 'Software applications and services', category: 'Software', isActive: true, orderIndex: 1 },
  { id: '2', name: 'System', description: 'Complete software systems', category: 'Software', isActive: true, orderIndex: 2 },
  { id: '3', name: 'Platform', description: 'Technology platforms and frameworks', category: 'Infrastructure', isActive: true, orderIndex: 3 },
  { id: '4', name: 'Cloud', description: 'Cloud-based services and infrastructure', category: 'Infrastructure', isActive: true, orderIndex: 4 },
  { id: '5', name: 'Tools', description: 'Development and operational tools', category: 'Tools', isActive: true, orderIndex: 5 },
  { id: '6', name: 'Process', description: 'Business and operational processes', category: 'Process', isActive: true, orderIndex: 6 },
  { id: '7', name: 'Infrastructure', description: 'Physical and virtual infrastructure', category: 'Infrastructure', isActive: true, orderIndex: 7 },
  { id: '8', name: 'Service', description: 'Microservices and API services', category: 'Software', isActive: true, orderIndex: 8 }
];

// GET - List all assessment types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const category = searchParams.get('category');

    // TODO: Replace with actual database query
    // const types = await prisma.assessmentType.findMany({
    //   where: {
    //     ...(includeInactive ? {} : { isActive: true }),
    //     ...(category ? { category } : {})
    //   },
    //   orderBy: { orderIndex: 'asc' }
    // });

    let filteredTypes = mockAssessmentTypes;
    
    if (!includeInactive) {
      filteredTypes = filteredTypes.filter(type => type.isActive);
    }
    
    if (category) {
      filteredTypes = filteredTypes.filter(type => type.category === category);
    }

    return NextResponse.json({
      success: true,
      data: filteredTypes,
      count: filteredTypes.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching assessment types:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch assessment types',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new assessment type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, isActive = true, orderIndex } = body;

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database query
    // // Check if name already exists
    // const existingType = await prisma.assessmentType.findUnique({
    //   where: { name: name.trim() }
    // });
    
    // if (existingType) {
    //   return NextResponse.json(
    //     { success: false, error: 'Assessment type with this name already exists' },
    //     { status: 409 }
    //   );
    // }

    // // Create new assessment type
    // const newType = await prisma.assessmentType.create({
    //   data: {
    //     name: name.trim(),
    //     description: description?.trim(),
    //     category: category?.trim(),
    //     isActive,
    //     orderIndex: orderIndex || mockAssessmentTypes.length + 1
    //   }
    // });

    // Mock creation for development
    const newType = {
      id: String(mockAssessmentTypes.length + 1),
      name: name.trim(),
      description: description?.trim() || null,
      category: category?.trim() || null,
      isActive,
      orderIndex: orderIndex || mockAssessmentTypes.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newType,
      message: 'Assessment type created successfully',
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating assessment type:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create assessment type',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update assessment type
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, category, isActive, orderIndex } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required for update' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database query
    // const updatedType = await prisma.assessmentType.update({
    //   where: { id },
    //   data: {
    //     name: name.trim(),
    //     description: description?.trim(),
    //     category: category?.trim(),
    //     isActive,
    //     orderIndex,
    //     updatedAt: new Date()
    //   }
    // });

    // Mock update for development
    const updatedType = {
      id,
      name: name.trim(),
      description: description?.trim() || null,
      category: category?.trim() || null,
      isActive,
      orderIndex,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: updatedType,
      message: 'Assessment type updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating assessment type:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update assessment type',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove assessment type
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required for deletion' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual database query
    // // Check if type is in use
    // const inUseCount = await prisma.assessmentTarget.count({
    //   where: { type: id }
    // });
    
    // if (inUseCount > 0) {
    //   return NextResponse.json(
    //     { 
    //       success: false, 
    //       error: `Cannot delete assessment type. It is currently used by ${inUseCount} assessment(s).`
    //     },
    //     { status: 409 }
    //   );
    // }

    // // Delete the assessment type
    // await prisma.assessmentType.delete({
    //   where: { id }
    // });

    return NextResponse.json({
      success: true,
      message: 'Assessment type deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting assessment type:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete assessment type',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}