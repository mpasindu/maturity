import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all organizations for dropdown
export async function GET(request: NextRequest) {
  try {
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}