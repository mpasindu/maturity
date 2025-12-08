import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch target types and cloud provider options
export async function GET(request: NextRequest) {
  try {
    // These come from the Prisma enum definitions
    const targetTypes = [
      'PLATFORM',
      'SYSTEM', 
      'APPLICATION',
      'CLOUD',
      'TOOLS',
      'PROCESS',
      'INFRASTRUCTURE',
      'SERVICE'
    ];

    const cloudProviders = [
      'AWS',
      'AZURE',
      'GCP', 
      'HYBRID',
      'ON_PREMISE'
    ];

    return NextResponse.json({
      targetTypes,
      cloudProviders,
    });
  } catch (error) {
    console.error('Error fetching options:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}