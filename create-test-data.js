#!/usr/bin/env node

/**
 * Create test data and complete an assessment for testing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Creating test assessment data...\n');

  try {
    // Find or create an assessment target
    let target = await prisma.assessmentTarget.findFirst();
    
    if (!target) {
      console.log('No target found, creating one...');
      const org = await prisma.organization.findFirst();
      if (!org) {
        throw new Error('No organization found. Please run the seeder first.');
      }
      
      target = await prisma.assessmentTarget.create({
        data: {
          name: 'Test Web Application',
          type: 'APPLICATION',
          description: 'Test target for maturity calculation',
          organizationId: org.id,
          technologyStack: ['React', 'Node.js'],
          cloudProvider: 'AWS'
        }
      });
    }

    console.log(`✅ Using target: ${target.name} (${target.id})`);

    // Create a new assessment session
    const session = await prisma.assessmentSession.create({
      data: {
        targetId: target.id,
        assessorId: 'test-user-id', // Dummy assessor ID
        status: 'IN_PROGRESS',
        currentPillarId: null,
        progressData: {},
        startedAt: new Date(),
      }
    });

    console.log(`✅ Created assessment session: ${session.id}`);

    // Get some metrics to create assessment results
    const metrics = await prisma.metric.findMany({
      take: 10,
      include: {
        topic: {
          include: {
            pillar: true
          }
        }
      }
    });

    console.log(`✅ Found ${metrics.length} metrics`);

    // Create assessment results for the metrics
    const assessmentResults = [];
    for (const metric of metrics) {
      const value = Math.floor(Math.random() * 4) + 1; // Random value 1-4
      
      const result = await prisma.assessmentResult.create({
        data: {
          sessionId: session.id,
          metricId: metric.id,
          value: value,
          notes: `Test result for ${metric.name}`,
          evidenceUrls: [],
          assessedAt: new Date()
        }
      });
      
      assessmentResults.push(result);
    }

    console.log(`✅ Created ${assessmentResults.length} assessment results`);

    // Mark the session as completed
    await prisma.assessmentSession.update({
      where: { id: session.id },
      data: { 
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    console.log(`✅ Marked session as completed`);

    console.log('\n🎯 Test data created successfully!');
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Target ID: ${target.id}`);
    console.log(`   You can now test the calculation workflow`);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);