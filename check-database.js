#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking database state...\n');

  try {
    // Check scoring rules
    const scoringRules = await prisma.scoringRules.findMany();
    console.log(`📏 Scoring rules: ${scoringRules.length}`);
    scoringRules.forEach(rule => {
      console.log(`   - ${rule.name} (default: ${rule.isDefault}, active: ${rule.isActive})`);
    });

    // Check targets
    const targets = await prisma.assessmentTarget.findMany();
    console.log(`\n🎯 Assessment targets: ${targets.length}`);
    targets.forEach(target => {
      console.log(`   - ${target.name} (${target.id})`);
    });

    // Check sessions
    const sessions = await prisma.assessmentSession.findMany();
    console.log(`\n📋 Assessment sessions: ${sessions.length}`);
    sessions.forEach(session => {
      console.log(`   - ${session.id} (status: ${session.status})`);
    });

    // Check metrics
    const metrics = await prisma.metric.findMany();
    console.log(`\n📊 Metrics: ${metrics.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);