#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🎛️ Creating default scoring rule...\n');

  try {
    const scoringRule = await prisma.scoringRules.create({
      data: {
        name: 'Default Maturity Scoring',
        description: 'Standard maturity scoring configuration for assessments',
        isActive: true,
        isDefault: true,
        metricAnsweredValue: 1.0,
        metricUnansweredValue: 0.0,
        metricMaxLevel: 4,
        topicScoreMethod: 'AVERAGE',
        topicScaleMin: 0.0,
        topicScaleMax: 4.0,
        topicExcludeEmpty: false,
        pillarScoreMethod: 'WEIGHTED_AVERAGE',
        pillarExcludeEmpty: false,
        pillarMinTopics: 1,
        overallScoreMethod: 'WEIGHTED_AVERAGE',
        overallExcludeEmpty: false,
        overallMinPillars: 1,
        roundingPrecision: 2,
        penalizeIncomplete: false,
        createdBy: 'system'
      }
    });

    console.log(`✅ Created scoring rule: ${scoringRule.name}`);
    console.log(`   ID: ${scoringRule.id}`);
    console.log(`   Default: ${scoringRule.isDefault}`);
    console.log(`   Active: ${scoringRule.isActive}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);