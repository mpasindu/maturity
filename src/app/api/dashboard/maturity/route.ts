import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { MaturityCalculator } from '@/lib/maturity-calculator';

interface DashboardTarget {
  id: string;
  name: string;
  type: 'APPLICATION' | 'SYSTEM' | 'PLATFORM';
  overallScore: number;
  maturityLevel: 'Initial' | 'Managed' | 'Defined' | 'Optimizing';
  confidence: number;
  lastAssessed: string;
  trend: 'improving' | 'declining' | 'stable' | 'new';
  pillarBreakdown: PillarScore[];
  riskFactors: string[];
  status: string;
  isActive: boolean;
  assessmentId?: string; // ID of the latest assessment session
  detailUrl?: string; // URL to assessment detail page
  resultsUrl?: string; // URL to assessment results page
}

interface PillarScore {
  id: string;
  name: string;
  score: number;
  weight: number;
  topicCount: number;
  metricCount: number;
  trend: 'improving' | 'declining' | 'stable';
}

// Helper function for consistent maturity level determination using MaturityCalculator
const getMaturityLevelDisplay = (score: number, calculator: MaturityCalculator) => {
  const maturityLevel = calculator.determineMaturityLevel(score);
  
  // Map MaturityCalculator levels to dashboard interface levels
  let dashboardLevel: 'Initial' | 'Managed' | 'Defined' | 'Optimizing';
  switch (maturityLevel.name) {
    case 'Initial':
      dashboardLevel = 'Initial';
      break;
    case 'Developing':
      dashboardLevel = 'Managed';
      break;
    case 'Defined':
      dashboardLevel = 'Defined';
      break;
    case 'Managed':
    case 'Optimized':
      dashboardLevel = 'Optimizing';
      break;
    default:
      dashboardLevel = 'Initial';
  }
  
  return {
    name: dashboardLevel,
    level: maturityLevel.level,
    color: maturityLevel.color
  };
};

const getTrend = (): 'improving' | 'declining' | 'stable' => {
  const trends = ['improving', 'declining', 'stable'] as const;
  return trends[Math.floor(Math.random() * trends.length)];
};

export async function GET(request: NextRequest) {
  try {
    console.log('Dashboard API: Starting data fetch...');
    
    const timeoutId = setTimeout(() => {
      console.log('Dashboard API: Request taking longer than expected...');
    }, 5000);

    // Get all assessment targets
    const allTargets = await prisma.assessmentTarget.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        assessmentSessions: {
          where: {
            status: {
              in: ['COMPLETED', 'IN_PROGRESS', 'DRAFT']
            }
          },
          orderBy: {
            lastModified: 'desc'
          },
          take: 1, // Only get the latest session
          include: {
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
        },
        maturityCalculations: {
          orderBy: {
            calculatedAt: 'desc'
          },
          take: 1 // Only get the latest calculation
        }
      },
      orderBy: { name: 'asc' }
    });

    clearTimeout(timeoutId);
    console.log(`Dashboard API: Found ${allTargets.length} assessment targets`);

    // Group targets by name and get the latest one for each unique name
    const uniqueTargetsByName = new Map<string, any>();
    
    allTargets.forEach(target => {
      const existingTarget = uniqueTargetsByName.get(target.name);
      
      if (!existingTarget) {
        uniqueTargetsByName.set(target.name, target);
      } else {
        // Compare which target has the most recent activity
        const currentLatestSession = target.assessmentSessions[0];
        const existingLatestSession = existingTarget.assessmentSessions[0];
        
        // If current target has a session and existing doesn't, use current
        if (currentLatestSession && !existingLatestSession) {
          uniqueTargetsByName.set(target.name, target);
        } 
        // If both have sessions, use the one with most recent activity
        else if (currentLatestSession && existingLatestSession) {
          const currentTime = new Date(currentLatestSession.lastModified || currentLatestSession.startedAt).getTime();
          const existingTime = new Date(existingLatestSession.lastModified || existingLatestSession.startedAt).getTime();
          
          if (currentTime > existingTime) {
            uniqueTargetsByName.set(target.name, target);
          }
        }
        // If neither has sessions, use the one created more recently
        else if (!currentLatestSession && !existingLatestSession) {
          const currentTime = new Date(target.updatedAt || target.createdAt).getTime();
          const existingTime = new Date(existingTarget.updatedAt || existingTarget.createdAt).getTime();
          
          if (currentTime > existingTime) {
            uniqueTargetsByName.set(target.name, target);
          }
        }
      }
    });

    const uniqueTargets = Array.from(uniqueTargetsByName.values());
    console.log(`Dashboard API: Filtered to ${uniqueTargets.length} unique targets by name`);

    // Initialize calculator for consistent maturity level determination
    const calculator = MaturityCalculator.getInstance();

    const dashboardData: DashboardTarget[] = uniqueTargets.map(target => {
      try {
        const latestSession = target.assessmentSessions[0];
        const latestCalculation = target.maturityCalculations[0];
        
        // If no assessment sessions, show as "Not Started"
        if (!latestSession) {
          console.log(`No assessment for ${target.name}, showing as not started`);
          return {
            id: target.id,
            name: target.name,
            type: target.type as 'APPLICATION' | 'SYSTEM' | 'PLATFORM',
            overallScore: 0,
            maturityLevel: 'Initial' as const,
            confidence: 0,
            lastAssessed: 'Not Started',
            trend: 'new' as const,
            pillarBreakdown: [],
            riskFactors: ['No assessments completed'],
            status: 'not-started',
            isActive: false,
            assessmentId: undefined,
            detailUrl: undefined,
            resultsUrl: undefined
          };
        }

        // Calculate maturity using the same engine as results page
        let overallScore = 0;
        let confidence = 0;
        const pillarBreakdown: PillarScore[] = [];

        if (latestCalculation) {
          // Use existing calculation if available
          console.log(`Dashboard: Using existing calculation for ${target.name} with score ${latestCalculation.overallScore}`);
          overallScore = parseFloat(latestCalculation.overallScore.toString());
          confidence = parseFloat(latestCalculation.confidence.toString());
          
          if (latestCalculation.pillarBreakdown && typeof latestCalculation.pillarBreakdown === 'object') {
            Object.entries(latestCalculation.pillarBreakdown as any).forEach(([pillarName, data]: [string, any]) => {
              pillarBreakdown.push({
                id: data.id || pillarName,
                name: pillarName,
                score: data.score || 0,
                weight: data.weight || 1.0,
                topicCount: data.topicCount || 0,
                metricCount: data.metricCount || 0,
                trend: getTrend()
              });
            });
          }
        } else if (latestSession.assessmentResults?.length > 0) {
          // Use the same calculation engine as results page
          console.log(`Dashboard: Calculating on-the-fly for ${target.name} with ${latestSession.assessmentResults.length} results`);
          
          const calculator = MaturityCalculator.getInstance();
          
          // Group results by pillar for calculation (same as results page)
          const pillarGroups = latestSession.assessmentResults.reduce((acc: any, result: any) => {
            const pillarId = result.metric.topic.pillar.id;
            if (!acc[pillarId]) {
              acc[pillarId] = {
                pillar: result.metric.topic.pillar,
                topics: new Map()
              };
            }
            
            const topicId = result.metric.topic.id;
            if (!acc[pillarId].topics.has(topicId)) {
              acc[pillarId].topics.set(topicId, {
                topic: result.metric.topic,
                metrics: []
              });
            }
            
            acc[pillarId].topics.get(topicId).metrics.push({
              metric: result.metric,
              result: result
            });
            
            return acc;
          }, {});

          // Calculate pillar scores using the same logic as results page
          const calculatedPillarScores = Object.values(pillarGroups).map((group: any) => {
            const topicScores = Array.from(group.topics.values()).map((topicData: any) => {
              const metricScores = topicData.metrics.map((metricData: any) => {
                const metricScore = calculator.calculateMetricScore(
                  Number(metricData.result.value),
                  metricData.metric.metricType as any,
                  Number(metricData.metric.minValue),
                  Number(metricData.metric.maxValue),
                  Number(metricData.metric.weight)
                );
                
                return {
                  ...metricScore,
                  metricId: metricData.metric.id,
                  metricName: metricData.metric.name,
                };
              });

              const topicScore = calculator.calculateTopicScore(metricScores, Number(topicData.topic.weight));
              
              return {
                ...topicScore,
                topicId: topicData.topic.id,
                topicName: topicData.topic.name,
              };
            });

            const pillarScore = calculator.calculatePillarScore(topicScores, Number(group.pillar.weight));

            return {
              ...pillarScore,
              pillarId: group.pillar.id,
              pillarName: group.pillar.name,
              category: group.pillar.category as any,
              description: group.pillar.description,
            };
          });

          // Calculate overall maturity using the same logic as results page
          const overallMaturity = calculator.calculateOverallMaturity(calculatedPillarScores);
          overallScore = overallMaturity.overallScore;
          
          // Convert to dashboard format
          calculatedPillarScores.forEach((pillar: any) => {
            pillarBreakdown.push({
              id: pillar.pillarId,
              name: pillar.pillarName,
              score: pillar.score,
              weight: pillar.weight,
              topicCount: pillar.topicScores?.length || 0,
              metricCount: pillar.topicScores?.reduce((total: number, topic: any) => total + (topic.metricScores?.length || 0), 0) || 0,
              trend: getTrend()
            });
          });
          
          confidence = Math.min(95, calculatedPillarScores.length * 15); // Confidence based on number of pillars
        } else {
          // Session exists but no results yet
          console.log(`Dashboard: No assessment results for ${target.name}, using default scores`);
          overallScore = 1.0; // Default initial score
          confidence = 10; // Low confidence
        }

        const lastAssessed = latestSession.completedAt?.toISOString() || 
                           latestSession.lastModified?.toISOString() ||
                           latestSession.startedAt?.toISOString();

        const maturityDisplay = getMaturityLevelDisplay(overallScore, calculator);
        
        return {
          id: target.id,
          name: target.name,
          type: target.type as 'APPLICATION' | 'SYSTEM' | 'PLATFORM',
          overallScore: Math.round(overallScore * 100) / 100,
          maturityLevel: maturityDisplay.name,
          confidence,
          lastAssessed,
          trend: getTrend(),
          pillarBreakdown,
          riskFactors: overallScore < 2.0 ? ['Below target maturity level'] : [],
          status: latestSession.status?.toLowerCase() || 'draft',
          isActive: true,
          assessmentId: latestSession.id,
          detailUrl: `/dashboard/maturity/${latestSession.id}`,
          resultsUrl: `/assessments/${latestSession.id}/results`
        };
      } catch (error) {
        console.error(`Error processing target ${target.name}:`, error);
        // Return safe default for targets with errors
        return {
          id: target.id,
          name: target.name,
          type: target.type as 'APPLICATION' | 'SYSTEM' | 'PLATFORM',
          overallScore: 0,
          maturityLevel: 'Initial' as const,
          confidence: 0,
          lastAssessed: 'Error',
          trend: 'stable' as const,
          pillarBreakdown: [],
          riskFactors: ['Data processing error'],
          status: 'error',
          isActive: false,
          assessmentId: undefined,
          detailUrl: undefined,
          resultsUrl: undefined
        };
      }
    });

    console.log(`Dashboard API: Processed ${dashboardData.length} assessment targets`);
    console.log(`Dashboard API: Success, returning data`);

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      summary: {
        total: dashboardData.length,
        notStarted: dashboardData.filter(d => d.status === 'not-started').length,
        inProgress: dashboardData.filter(d => d.status === 'in_progress' || d.status === 'draft').length,
        completed: dashboardData.filter(d => d.status === 'completed').length,
        averageScore: dashboardData.filter(d => d.isActive).reduce((sum, d) => sum + d.overallScore, 0) / 
                      Math.max(1, dashboardData.filter(d => d.isActive).length)
      }
    });
  } catch (error) {
    console.error('Dashboard API: Error fetching data:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}