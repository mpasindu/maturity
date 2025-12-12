/**
 * Simple Local Test for Bedrock Database Tables
 * 
 * Run this to verify the database schema is working correctly
 * No AWS required - just tests Prisma and PostgreSQL
 * 
 * Usage: node scripts/test-bedrock-simple.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBedrockDatabase() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 BEDROCK DATABASE TEST');
  console.log('='.repeat(60) + '\n');

  const sessionId = `test-${Date.now()}`;
  let conversationId = null;
  let testSessionId = null;

  try {
    // First, create a test assessment session (required for foreign key)
    console.log('✓ Setup: Creating test assessment session...');
    
    // Get or create a test organization
    let testOrg = await prisma.organization.findFirst({
      where: { name: 'Test Organization' }
    });
    
    if (!testOrg) {
      testOrg = await prisma.organization.create({
        data: {
          name: 'Test Organization',
          description: 'For testing Bedrock integration'
        }
      });
    }
    
    // Create test assessment target
    const testTarget = await prisma.assessmentTarget.create({
      data: {
        organizationId: testOrg.id,
        name: 'Test Target',
        type: 'APPLICATION'
      }
    });
    
    // Create test pillar, topic, and metric
    const testPillar = await prisma.maturityPillar.create({
      data: {
        name: 'Test Pillar',
        category: 'OPERATIONAL_EXCELLENCE',
        isActive: true
      }
    });
    
    const testTopic = await prisma.assessmentTopic.create({
      data: {
        pillarId: testPillar.id,
        name: 'Test Topic',
        isActive: true
      }
    });
    
    const testMetric = await prisma.metric.create({
      data: {
        topicId: testTopic.id,
        name: 'Test Metric',
        description: 'For testing Bedrock integration',
        metricType: 'SCALE',
        level: 2,
        active: true
      }
    });
    
    // Create test assessment session
    const testSession = await prisma.assessmentSession.create({
      data: {
        targetId: testTarget.id,
        assessorId: 'test-assessor-123',
        status: 'IN_PROGRESS'
      }
    });
    testSessionId = testSession.id;
    console.log('  ✅ Test session, pillar, topic, and metric created');

    // Test 1: Create Conversation
    console.log('\n✓ Test 1: Creating conversation...');
    const conversation = await prisma.bedrockConversation.create({
      data: {
        sessionId: testSession.id,
        userId: 'test-user-123',
        status: 'ACTIVE',
        contextSnapshot: {
          sessionId: testSession.id,
          userId: 'test-user-123',
          currentMetric: {
            id: 'metric-test',
            name: 'Test Metric',
            level: 2
          }
        }
      }
    });
    conversationId = conversation.id;
    console.log('  ✅ Conversation created:', conversationId.substring(0, 8) + '...');

    // Test 2: Add Messages
    console.log('\n✓ Test 2: Adding messages...');
    const userMessage = await prisma.bedrockMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: 'What is Level 3 monitoring?',
        messageType: 'QUESTION'
      }
    });
    console.log('  ✅ User message created');

    const assistantMessage = await prisma.bedrockMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: 'Level 3 monitoring includes comprehensive observability with distributed tracing, custom metrics, and proactive alerting.',
        messageType: 'ANSWER',
        metadata: {
          confidence: 0.95,
          sources: ['AWS Well-Architected Framework']
        }
      }
    });
    console.log('  ✅ Assistant message created');

    // Test 3: Create Recommendation
    console.log('\n✓ Test 3: Creating recommendation...');
    const recommendation = await prisma.bedrockRecommendation.create({
      data: {
        conversationId: conversation.id,
        sessionId: testSession.id,
        recommendationType: 'BEST_PRACTICE',
        title: 'Implement Distributed Tracing',
        description: 'Add distributed tracing to improve observability across microservices. This will help identify bottlenecks and improve debugging.',
        confidenceScore: 0.87,
        priority: 'HIGH',
        impactEstimate: 'Could improve monitoring score by 0.5-1.0 points',
        supportingCitations: {
          citations: [
            {
              source: 'AWS Well-Architected Framework',
              content: 'Distributed tracing enables deep insights...',
              relevance: 0.92
            }
          ]
        },
        relatedMetrics: ['metric-monitoring-basics', 'metric-observability']
      }
    });
    console.log('  ✅ Recommendation created');

    // Test 4: Create Evidence Analysis
    console.log('\n✓ Test 4: Creating evidence analysis...');
    const evidence = await prisma.bedrockEvidenceAnalysis.create({
      data: {
        conversationId: conversation.id,
        sessionId: testSession.id,
        metricId: testMetric.id,
        evidenceText: 'We have CloudWatch monitoring with custom dashboards showing CPU, memory, and network metrics. Alerts configured for threshold breaches.',
        evidenceType: 'DOCUMENT',
        analysisSummary: 'Good basic monitoring setup with CloudWatch. Custom dashboards and alerting are in place, indicating Level 2-3 maturity.',
        maturityLevelSuggestion: 3,
        confidenceScore: 0.82,
        alignmentScore: 0.78,
        strengths: {
          items: [
            'CloudWatch monitoring configured',
            'Custom dashboards created',
            'Threshold-based alerting active'
          ]
        },
        gaps: {
          items: [
            'No distributed tracing mentioned',
            'Missing anomaly detection',
            'No mention of correlation across services'
          ]
        },
        criteriaMatched: {
          level2: ['Basic monitoring', 'Alert configuration'],
          level3: ['Custom dashboards']
        }
      }
    });
    console.log('  ✅ Evidence analysis created');

    // Test 5: Query Full Conversation
    console.log('\n✓ Test 5: Querying full conversation...');
    const fullConversation = await prisma.bedrockConversation.findUnique({
      where: { id: conversation.id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        recommendations: true,
        evidenceAnalyses: true
      }
    });
    
    console.log('  ✅ Full conversation retrieved:');
    console.log(`     - Messages: ${fullConversation.messages.length}`);
    console.log(`     - Recommendations: ${fullConversation.recommendations.length}`);
    console.log(`     - Evidence Analyses: ${fullConversation.evidenceAnalyses.length}`);

    // Test 6: Test Queries
    console.log('\n✓ Test 6: Testing queries...');
    
    const activeConversations = await prisma.bedrockConversation.count({
      where: { status: 'ACTIVE' }
    });
    console.log(`  ✅ Active conversations: ${activeConversations}`);

    const highPriorityRecs = await prisma.bedrockRecommendation.count({
      where: { priority: 'HIGH' }
    });
    console.log(`  ✅ High priority recommendations: ${highPriorityRecs}`);

    // Test 7: Cleanup
    console.log('\n✓ Test 7: Cleaning up test data...');
    await prisma.bedrockConversation.delete({
      where: { id: conversation.id }
    });
    await prisma.assessmentSession.delete({
      where: { id: testSessionId }
    });
    console.log('  ✅ Test data deleted');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ Database schema is working correctly');
    console.log('✅ All Bedrock tables are accessible');
    console.log('✅ Prisma client is properly generated');
    console.log('✅ Relationships and cascading deletes work');
    console.log('\n📋 Next Steps:');
    console.log('   1. Configure AWS credentials in .env');
    console.log('   2. Deploy Lambda functions to AWS');
    console.log('   3. Create Bedrock Agent in AWS Console');
    console.log('   4. Test with real AWS Bedrock service\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    console.error('\nError:', error.message);
    console.error('\nFull error:', error);
    
    // Cleanup on error
    if (conversationId) {
      try {
        await prisma.bedrockConversation.delete({
          where: { id: conversationId }
        });
        console.log('\n✅ Cleaned up test data after error');
      } catch (cleanupError) {
        console.error('⚠️  Could not cleanup:', cleanupError.message);
      }
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
console.log('Starting Bedrock database tests...\n');
testBedrockDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
