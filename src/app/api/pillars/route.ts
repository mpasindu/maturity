import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { mockPillars } from '@/lib/mock-data';

export async function GET() {
  try {
    console.log('Fetching pillars from database...');
    
    const pillars = await prisma.maturityPillar.findMany({
      where: {
        isActive: true,
      },
      include: {
        topics: {
          where: {
            isActive: true,
          },
          orderBy: {
            orderIndex: 'asc',
          },
          include: {
            metrics: {
              where: {
                active: true,
              },
              orderBy: {
                level: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(pillars);
  } catch (error) {
    console.error('Error fetching pillars from database:', error);
    console.log('Falling back to mock data...');
    
    // Fallback to mock data if database fails
    return NextResponse.json(mockPillars);
  }
}