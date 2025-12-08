import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

/**
 * Endpoint to trigger maturity calculation when an assessment session is completed
 * POST /api/assessments/[sessionId]/complete
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Completing assessment session: ${sessionId}`);

    // Update session status to COMPLETED
    const updatedSession = await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: { 
        status: 'COMPLETED'
      }
    });

    console.log(`✅ Assessment session marked as completed: ${sessionId}`);

    // Trigger maturity calculation
    const calculateResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/assessments/calculate-maturity`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      }
    );

    if (!calculateResponse.ok) {
      const error = await calculateResponse.json();
      console.error('Failed to calculate maturity scores:', error);
      
      // Session is still marked as completed, but calculation failed
      return NextResponse.json({
        success: true,
        sessionCompleted: true,
        calculationError: error.error || 'Failed to calculate maturity scores'
      }, { status: 200 });
    }

    const calculationResult = await calculateResponse.json();
    
    console.log(`🎯 Maturity calculation completed for session: ${sessionId}`);

    return NextResponse.json({
      success: true,
      sessionCompleted: true,
      calculationResult: calculationResult.data
    });

  } catch (error) {
    console.error('Error completing assessment session:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to complete assessment session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}