import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Default Organization',
      description: 'Default organization for initial setup',
    },
  });

  // Create default maturity pillars
  const pillars = await Promise.all([
    prisma.maturityPillar.create({
      data: {
        name: 'Operational Excellence',
        description: 'Operational excellence practices and processes',
        category: 'OPERATIONAL_EXCELLENCE',
        weight: 1.0,
      },
    }),
    prisma.maturityPillar.create({
      data: {
        name: 'Security',
        description: 'Security architecture and compliance',
        category: 'SECURITY',
        weight: 1.2,
      },
    }),
    prisma.maturityPillar.create({
      data: {
        name: 'Reliability',
        description: 'System reliability and resilience',
        category: 'RELIABILITY',
        weight: 1.1,
      },
    }),
    prisma.maturityPillar.create({
      data: {
        name: 'Performance Efficiency',
        description: 'Performance optimization and efficiency',
        category: 'PERFORMANCE_EFFICIENCY',
        weight: 0.9,
      },
    }),
    prisma.maturityPillar.create({
      data: {
        name: 'Cost Optimization',
        description: 'Cost management and optimization',
        category: 'COST_OPTIMIZATION',
        weight: 0.8,
      },
    }),
    prisma.maturityPillar.create({
      data: {
        name: 'Sustainability',
        description: 'Environmental sustainability and green practices',
        category: 'SUSTAINABILITY',
        weight: 0.7,
      },
    }),
  ]);

  // Create sample topics for each pillar
  for (const pillar of pillars) {
    await prisma.assessmentTopic.createMany({
      data: [
        {
          pillarId: pillar.id,
          name: `${pillar.name} Standards`,
          description: `Standards and guidelines for ${pillar.name.toLowerCase()}`,
          weight: 1.0,
          orderIndex: 1,
        },
        {
          pillarId: pillar.id,
          name: `${pillar.name} Processes`,
          description: `Processes and procedures for ${pillar.name.toLowerCase()}`,
          weight: 1.0,
          orderIndex: 2,
        },
        {
          pillarId: pillar.id,
          name: `${pillar.name} Tools`,
          description: `Tools and technologies for ${pillar.name.toLowerCase()}`,
          weight: 0.8,
          orderIndex: 3,
        },
      ],
    });
  }

  // Get created topics and add metrics
  const topics = await prisma.assessmentTopic.findMany();
  
  for (const topic of topics) {
    await prisma.metric.createMany({
      data: [
        {
          topicId: topic.id,
          name: 'Maturity Level',
          description: 'Overall maturity level assessment',
          metricType: 'SCALE',
          minValue: 1,
          maxValue: 5,
          weight: 1.0,
        },
        {
          topicId: topic.id,
          name: 'Documentation Quality',
          description: 'Quality and completeness of documentation',
          metricType: 'SCALE',
          minValue: 1,
          maxValue: 5,
          weight: 0.8,
        },
        {
          topicId: topic.id,
          name: 'Implementation Status',
          description: 'Implementation and adoption status',
          metricType: 'PERCENTAGE',
          minValue: 0,
          maxValue: 100,
          weight: 1.2,
        },
      ],
    });
  }

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.create({
    data: {
      email: 'admin@maturity-platform.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
    },
  });

  // Create sample assessment target
  await prisma.assessmentTarget.create({
    data: {
      organizationId: organization.id,
      name: 'Sample Application',
      type: 'APPLICATION',
      description: 'Sample application for demonstration',
      cloudProvider: 'AWS',
      technologyStack: {
        frontend: ['React', 'TypeScript'],
        backend: ['Node.js', 'Express'],
        database: ['PostgreSQL'],
        cloud: ['AWS Lambda', 'AWS RDS'],
      },
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });