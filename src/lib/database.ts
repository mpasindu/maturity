import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database utility functions
export class DatabaseService {
  private static instance: DatabaseService;
  public client: PrismaClient;

  private constructor() {
    this.client = prisma;
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Transaction wrapper
  async transaction<T>(
    callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return this.client.$transaction(callback);
  }

  // Assessment-specific queries
  async getAssessmentWithFullData(sessionId: string) {
    return this.client.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        target: {
          include: {
            organization: true,
          },
        },
        assessmentResults: {
          include: {
            metric: {
              include: {
                topic: {
                  include: {
                    pillar: true,
                  },
                },
              },
            },
          },
        },
        currentPillar: true,
        auditLogs: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });
  }

  async getMaturityPillarsWithTopicsAndMetrics() {
    return this.client.maturityPillar.findMany({
      where: { isActive: true },
      include: {
        topics: {
          where: { isActive: true },
          include: {
            metrics: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { category: 'asc' },
    });
  }

  async getAssessmentSessionsByTarget(targetId: string) {
    return this.client.assessmentSession.findMany({
      where: { targetId },
      include: {
        target: true,
        currentPillar: true,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async getOrganizationAssessments(organizationId: string) {
    return this.client.assessmentSession.findMany({
      where: {
        target: {
          organizationId,
        },
      },
      include: {
        target: true,
        currentPillar: true,
        assessmentResults: {
          include: {
            metric: {
              include: {
                topic: {
                  include: {
                    pillar: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  // Batch operations
  async batchCreateAssessmentResults(
    results: Array<{
      sessionId: string;
      metricId: string;
      value: number;
      notes?: string;
      evidenceUrls?: string[];
    }>
  ) {
    return this.client.assessmentResult.createMany({
      data: results,
      skipDuplicates: true,
    });
  }

  async batchUpdateAssessmentResults(
    updates: Array<{
      id: string;
      value: number;
      notes?: string;
      evidenceUrls?: string[];
    }>
  ) {
    const updatePromises = updates.map((update) =>
      this.client.assessmentResult.update({
        where: { id: update.id },
        data: {
          value: update.value,
          notes: update.notes,
          evidenceUrls: update.evidenceUrls,
        },
      })
    );

    return Promise.all(updatePromises);
  }

  // Audit logging
  async createAuditLog(
    sessionId: string | null,
    userId: string,
    action: string,
    entityType?: string,
    entityId?: string,
    oldValues?: any,
    newValues?: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    return this.client.auditLog.create({
      data: {
        sessionId,
        userId,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        ipAddress,
        userAgent,
      },
    });
  }

  // Cleanup operations
  async cleanupDraftSessions(olderThanDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return this.client.assessmentSession.deleteMany({
      where: {
        status: 'DRAFT',
        startedAt: {
          lt: cutoffDate,
        },
      },
    });
  }

  // Statistics queries
  async getAssessmentStatistics(organizationId?: string) {
    const baseWhere = organizationId
      ? { target: { organizationId } }
      : {};

    const [
      totalAssessments,
      completedAssessments,
      inProgressAssessments,
      averageCompletionTime,
    ] = await Promise.all([
      this.client.assessmentSession.count({
        where: baseWhere,
      }),
      this.client.assessmentSession.count({
        where: {
          ...baseWhere,
          status: 'COMPLETED',
        },
      }),
      this.client.assessmentSession.count({
        where: {
          ...baseWhere,
          status: 'IN_PROGRESS',
        },
      }),
      this.client.assessmentSession.count({
        where: {
          ...baseWhere,
          status: 'COMPLETED',
          completedAt: { not: null },
        },
      }),
    ]);

    return {
      totalAssessments,
      completedAssessments,
      inProgressAssessments,
      completionRate: totalAssessments > 0 ? (completedAssessments / totalAssessments) * 100 : 0,
    };
  }

  // Search functionality
  async searchAssessments(
    query: string,
    organizationId?: string,
    limit: number = 20,
    offset: number = 0
  ) {
    const baseWhere = organizationId
      ? { target: { organizationId } }
      : {};

    return this.client.assessmentSession.findMany({
      where: {
        ...baseWhere,
        OR: [
          {
            target: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            target: {
              description: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      include: {
        target: {
          include: {
            organization: true,
          },
        },
        currentPillar: true,
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  // Close connection
  async disconnect() {
    await this.client.$disconnect();
  }
}

export default DatabaseService;