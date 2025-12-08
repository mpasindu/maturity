import { PrismaClient } from '@prisma/client';
import { mockPillars } from '../src/lib/mock-data';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('📝 Clearing existing data...');
  await prisma.assessmentResult.deleteMany();
  await prisma.metric.deleteMany();
  await prisma.assessmentTopic.deleteMany();
  await prisma.maturityPillar.deleteMany();

  console.log('🏗️ Creating pillars, topics, and metrics...');

  for (const pillarData of mockPillars) {
    console.log(`Creating pillar: ${pillarData.name}`);
    
    const pillar = await prisma.maturityPillar.create({
      data: {
        name: pillarData.name,
        description: pillarData.description,
        weight: pillarData.weight,
        category: pillarData.category as any,
        isActive: true,
      },
    });

    for (let topicIndex = 0; topicIndex < (pillarData.topics || []).length; topicIndex++) {
      const topicData = pillarData.topics![topicIndex];
      console.log(`  Creating topic: ${topicData.name}`);
      
      const topic = await prisma.assessmentTopic.create({
        data: {
          name: topicData.name,
          description: topicData.description,
          pillarId: pillar.id,
          orderIndex: topicIndex + 1,
          isActive: true,
          weight: topicData.weight,
        },
      });      for (const metricData of topicData.metrics || []) {
        console.log(`    Creating metric: ${metricData.name}`);
        
        await prisma.metric.create({
          data: {
            name: metricData.name,
            description: metricData.description,
            topicId: topic.id,
            metricType: metricData.metricType as any,
            minValue: metricData.minValue,
            maxValue: metricData.maxValue,
            weight: metricData.weight,
            level: metricData.level,
            active: metricData.active,
            tags: metricData.tags,
          },
        });
      }
    }
  }

  // Create a default organization
  console.log('🏢 Creating default organization...');
  await prisma.organization.upsert({
    where: { id: 'org-1' },
    update: {},
    create: {
      id: 'org-1',
      name: 'Example Corporation',
      description: 'A sample organization for testing',
    },
  });

  // Create a default admin user
  console.log('👤 Creating default admin user...');
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: 'hashed_password_here', // In real app, hash this
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });