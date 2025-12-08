/**
 * Organization Settings API Route
 * 
 * Provides CRUD operations for organization settings including logo management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

// GET - Retrieve organization settings
export async function GET(request: NextRequest) {
  try {
    // Get the first organization (assuming single organization setup)
    let organization = await prisma.organization.findFirst();

    // If no organization exists, create a default one
    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: 'Example Corporation',
          description: 'A sample organization for testing',
        },
      });
    }

    // Fetch additional fields using raw query as fallback
    let additionalFields = { logoUrl: '', website: '', contactEmail: '' };
    try {
      const result: any[] = await prisma.$queryRaw`
        SELECT "logoUrl", website, "contactEmail" 
        FROM organizations 
        WHERE id = ${organization.id}
      `;
      if (result.length > 0) {
        additionalFields = {
          logoUrl: result[0].logoUrl || '',
          website: result[0].website || '',
          contactEmail: result[0].contactEmail || '',
        };
      }
    } catch (rawError) {
      console.warn('Could not fetch additional fields:', rawError);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...organization,
        ...additionalFields,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching organization data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch organization data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// PUT - Update organization settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Organization name is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (body.contactEmail && body.contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.contactEmail)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid email format',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    // Validate website URL format if provided
    if (body.website && body.website.trim()) {
      try {
        new URL(body.website);
      } catch {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid website URL format',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }
    }

    // Get the first organization or create one if none exists
    let organization = await prisma.organization.findFirst();

    if (!organization) {
      // Create new organization
      organization = await prisma.organization.create({
        data: {
          name: body.name.trim(),
          description: body.description || null,
        },
      });
    } else {
      // Update existing organization  
      organization = await prisma.organization.update({
        where: { id: organization.id },
        data: {
          name: body.name.trim(),
          description: body.description || null,
        },
      });
    }

    // Handle additional fields separately if they exist in the database
    try {
      if (body.website || body.contactEmail || body.logoUrl) {
        await prisma.$executeRaw`
          UPDATE organizations 
          SET 
            website = ${body.website?.trim() || null},
            "contactEmail" = ${body.contactEmail?.trim() || null},
            "logoUrl" = ${body.logoUrl || null},
            "updatedAt" = NOW()
          WHERE id = ${organization.id}
        `;
      }
    } catch (rawError) {
      console.warn('Could not update additional fields, they may not exist in schema:', rawError);
    }

    // Fetch the updated organization
    const updatedOrg = await prisma.organization.findUnique({
      where: { id: organization.id }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedOrg,
        logoUrl: body.logoUrl || '',
        website: body.website?.trim() || '',
        contactEmail: body.contactEmail?.trim() || '',
      },
      message: 'Organization settings updated successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error updating organization data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update organization data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}