import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get assessment session from database
    const dbSession = await prisma.assessmentSession.findUnique({
      where: { id },
      include: {
        target: {
          include: {
            organization: true
          }
        },
        assessmentResults: {
          include: {
            metric: {
              include: {
                topic: {
                  include: {
                    pillar: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!dbSession) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Convert database session to assessment format
    const responses: any = {};
    
    // Convert assessment results to responses format that the wizard expects
    dbSession.assessmentResults.forEach(result => {
      // Convert Decimal values to appropriate types based on metric type
      let convertedValue: any = result.value;
      
      if (result.metric?.metricType === 'SCALE' || result.metric?.metricType === 'PERCENTAGE') {
        // Convert Decimal to number for scale and percentage types
        convertedValue = Number(result.value);
      } else if (result.metric?.metricType === 'BOOLEAN') {
        // Convert to boolean for boolean types
        const decimalValue = Number(result.value);
        convertedValue = decimalValue === 1;
      } else {
        // For other types, convert to string
        convertedValue = String(result.value);
      }
      
      responses[result.metricId] = {
        value: convertedValue,
        notes: result.notes,
        evidenceUrls: result.evidenceUrls
      };
    });

    const assessmentData = {
      id: dbSession.id,
      name: dbSession.target?.name ? `${dbSession.target.name} Assessment` : 'Assessment',
      organizationId: dbSession.target?.organizationId || 'unknown',
      organization: dbSession.target?.organization || null,
      targetId: dbSession.targetId,
      target: dbSession.target,
      currentPillarId: dbSession.currentPillarId,
      progressData: dbSession.progressData || {},
      status: dbSession.status,
      startedAt: dbSession.startedAt?.toISOString(),
      completedAt: dbSession.completedAt?.toISOString(),
      createdAt: dbSession.startedAt?.toISOString(),
      updatedAt: dbSession.lastModified?.toISOString(),
      responses: responses, // Add responses for wizard
      assessmentResults: dbSession.assessmentResults // Keep original results for compatibility
    };

    return NextResponse.json(assessmentData);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { responses, status, ...updateData } = body;

    console.log('PUT Assessment - Received data:', { id, status, responsesType: typeof responses, responsesKeys: responses ? Object.keys(responses) : 'none' });

    // Check if assessment session exists in database
    const dbSession = await prisma.assessmentSession.findUnique({
      where: { id }
    });

    if (!dbSession) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Update database session
    const updatedSession = await prisma.assessmentSession.update({
      where: { id },
      data: {
        status: status || dbSession.status,
        currentPillarId: updateData.currentPillarId || dbSession.currentPillarId,
        progressData: updateData.progressData || dbSession.progressData,
        completedAt: status === 'COMPLETED' ? new Date() : dbSession.completedAt,
        lastModified: new Date()
      },
      include: {
        target: {
          include: {
            organization: true
          }
        },
        assessmentResults: {
          include: {
            metric: {
              include: {
                topic: {
                  include: {
                    pillar: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Save assessment results if provided (responses is an object with metricId as keys)
    if (responses && typeof responses === 'object' && Object.keys(responses).length > 0) {
      console.log('PUT Assessment - Saving responses:', Object.keys(responses).length, 'metrics');
      
      // Upsert results for each metric (update if exists, create if not)
      for (const [metricId, responseData] of Object.entries(responses)) {
        const response = responseData as any;
        console.log(`PUT Assessment - Saving metric ${metricId}:`, response);
        
        // Check if result exists
        const existingResult = await prisma.assessmentResult.findFirst({
          where: {
            sessionId: id,
            metricId: metricId,
          },
        });

        if (existingResult) {
          // Update existing
          await prisma.assessmentResult.update({
            where: { id: existingResult.id },
            data: {
              value: response.value?.toString() || '0',
              notes: response.notes || null,
              evidenceUrls: response.evidenceUrls || [],
              assessedAt: new Date()
            }
          });
        } else {
          // Create new
          await prisma.assessmentResult.create({
            data: {
              sessionId: id,
              metricId: metricId,
              value: response.value?.toString() || '0',
              notes: response.notes || null,
              evidenceUrls: response.evidenceUrls || [],
              assessedAt: new Date()
            }
          });
        }
      }
    }

    // Fetch the updated session with all assessment results
    const sessionWithResults = await prisma.assessmentSession.findUnique({
      where: { id },
      include: {
        target: {
          include: {
            organization: true
          }
        },
        assessmentResults: {
          include: {
            metric: {
              include: {
                topic: {
                  include: {
                    pillar: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Convert to assessment format and return
    const responses_obj: any = {};
    
    // Convert assessment results to responses format that the wizard expects
    sessionWithResults?.assessmentResults.forEach(result => {
      // Convert Decimal values to appropriate types based on metric type
      let convertedValue: any = result.value;
      
      if (result.metric?.metricType === 'SCALE' || result.metric?.metricType === 'PERCENTAGE') {
        // Convert Decimal to number for scale and percentage types
        convertedValue = Number(result.value);
      } else if (result.metric?.metricType === 'BOOLEAN') {
        // Convert to boolean for boolean types
        const decimalValue = Number(result.value);
        convertedValue = decimalValue === 1;
      } else {
        // For other types, convert to string
        convertedValue = String(result.value);
      }
      
      responses_obj[result.metricId] = {
        value: convertedValue,
        notes: result.notes,
        evidenceUrls: result.evidenceUrls
      };
    });

    const assessmentData = {
      id: sessionWithResults?.id || id,
      name: sessionWithResults?.target?.name ? `${sessionWithResults.target.name} Assessment` : 'Assessment',
      organizationId: sessionWithResults?.target?.organizationId || 'unknown',
      organization: sessionWithResults?.target?.organization || null,
      targetId: sessionWithResults?.targetId || '',
      target: sessionWithResults?.target || null,
      currentPillarId: sessionWithResults?.currentPillarId,
      progressData: sessionWithResults?.progressData || {},
      status: sessionWithResults?.status || updatedSession.status,
      startedAt: sessionWithResults?.startedAt?.toISOString(),
      completedAt: sessionWithResults?.completedAt?.toISOString(),
      createdAt: sessionWithResults?.startedAt?.toISOString(),
      updatedAt: sessionWithResults?.lastModified?.toISOString(),
      responses: responses_obj, // Add responses for wizard
      assessmentResults: sessionWithResults?.assessmentResults || [] // Keep original results for compatibility
    };

    return NextResponse.json(assessmentData);
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Delete all related data in the correct order to avoid foreign key constraints
    
    // 1. Delete maturity calculations first (they reference the session)
    await prisma.maturityCalculation.deleteMany({
      where: { sessionId: id }
    });
    
    // 2. Delete all assessment results
    await prisma.assessmentResult.deleteMany({
      where: { sessionId: id }
    });
    
    // 3. Finally delete the assessment session
    await prisma.assessmentSession.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}