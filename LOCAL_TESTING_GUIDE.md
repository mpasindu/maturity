# Local Testing Guide - AWS Bedrock Integration

This guide shows you how to test the Bedrock integration locally **without** AWS infrastructure.

## Quick Start - Test Database & Service Layer

### Step 1: Verify Database Setup

Check that the Bedrock tables were created successfully:

```bash
# Connect to your PostgreSQL database
psql -U postgres -d maturity_assessment

# Verify Bedrock tables exist
\dt bedrock*

# Should show:
# bedrock_conversations
# bedrock_messages
# bedrock_recommendations
# bedrock_evidence_analysis
# bedrock_knowledge_sync
```

Or use a database GUI tool and verify the 5 Bedrock tables exist.

### Step 2: Create Test Script

Create `/scripts/test-bedrock-local.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testBedrockDatabase() {
  console.log("🧪 Testing Bedrock Database Tables...\n");

  try {
    // Test 1: Create a test conversation
    console.log("Test 1: Creating conversation...");
    const conversation = await prisma.bedrockConversation.create({
      data: {
        sessionId: "test-session-123",
        userId: "test-user-456",
        status: "ACTIVE",
        contextSnapshot: {
          sessionId: "test-session-123",
          userId: "test-user-456",
          currentMetric: {
            id: "metric-test",
            name: "Test Metric",
            level: 2,
          },
        },
      },
    });
    console.log("✅ Conversation created:", conversation.id);

    // Test 2: Add messages
    console.log("\nTest 2: Adding messages...");
    const userMessage = await prisma.bedrockMessage.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: "What is Level 3 monitoring?",
        messageType: "QUESTION",
      },
    });
    console.log("✅ User message created:", userMessage.id);

    const assistantMessage = await prisma.bedrockMessage.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: "Level 3 monitoring includes comprehensive observability...",
        messageType: "ANSWER",
      },
    });
    console.log("✅ Assistant message created:", assistantMessage.id);

    // Test 3: Create recommendation
    console.log("\nTest 3: Creating recommendation...");
    const recommendation = await prisma.bedrockRecommendation.create({
      data: {
        conversationId: conversation.id,
        sessionId: "test-session-123",
        recommendationType: "BEST_PRACTICE",
        title: "Implement Distributed Tracing",
        description: "Add distributed tracing to improve observability",
        confidenceScore: 0.85,
        priority: "HIGH",
        supportingCitations: {
          citations: ["Best practice from AWS Well-Architected"],
        },
      },
    });
    console.log("✅ Recommendation created:", recommendation.id);

    // Test 4: Create evidence analysis
    console.log("\nTest 4: Creating evidence analysis...");
    const evidence = await prisma.bedrockEvidenceAnalysis.create({
      data: {
        conversationId: conversation.id,
        sessionId: "test-session-123",
        metricId: "metric-test-123",
        evidenceText: "We use CloudWatch with custom dashboards",
        analysisSummary: "Good basic monitoring setup",
        maturityLevelSuggestion: 3,
        confidenceScore: 0.78,
        alignmentScore: 0.75,
        strengths: ["CloudWatch configured", "Custom dashboards"],
        gaps: ["Missing distributed tracing"],
      },
    });
    console.log("✅ Evidence analysis created:", evidence.id);

    // Test 5: Query conversation with messages
    console.log("\nTest 5: Querying conversation with messages...");
    const fullConversation = await prisma.bedrockConversation.findUnique({
      where: { id: conversation.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
        recommendations: true,
        evidenceAnalyses: true,
      },
    });
    console.log("✅ Full conversation retrieved:");
    console.log(`   - Messages: ${fullConversation?.messages.length}`);
    console.log(
      `   - Recommendations: ${fullConversation?.recommendations.length}`
    );
    console.log(
      `   - Evidence analyses: ${fullConversation?.evidenceAnalyses.length}`
    );

    // Test 6: Cleanup
    console.log("\nTest 6: Cleaning up test data...");
    await prisma.bedrockConversation.delete({
      where: { id: conversation.id },
    });
    console.log("✅ Test data cleaned up");

    console.log("\n🎉 All database tests passed!\n");
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testBedrockDatabase().catch(console.error);
```

### Step 3: Run Database Test

```bash
# Install ts-node if you haven't
npm install -D ts-node

# Run the test
npx ts-node scripts/test-bedrock-local.ts
```

Expected output:

```
🧪 Testing Bedrock Database Tables...

Test 1: Creating conversation...
✅ Conversation created: abc-123-...
Test 2: Adding messages...
✅ User message created: def-456-...
✅ Assistant message created: ghi-789-...
Test 3: Creating recommendation...
✅ Recommendation created: jkl-012-...
Test 4: Creating evidence analysis...
✅ Evidence analysis created: mno-345-...
Test 5: Querying conversation with messages...
✅ Full conversation retrieved:
   - Messages: 2
   - Recommendations: 1
   - Evidence analyses: 1
Test 6: Cleaning up test data...
✅ Test data cleaned up

🎉 All database tests passed!
```

## Test Service Layer with Mock AWS

### Step 1: Install Mocking Library

```bash
npm install -D jest @types/jest ts-jest
npm install -D @jest/globals
```

### Step 2: Create Mock Bedrock Client

Create `/src/lib/__mocks__/bedrock-client.ts`:

```typescript
// Mock AWS Bedrock responses
export class MockBedrockAgentRuntimeClient {
  async send(command: any) {
    const commandName = command.constructor.name;

    if (commandName === "InvokeAgentCommand") {
      // Mock agent response
      return {
        sessionId: "mock-session-123",
        completion: this.mockCompletionStream(),
      };
    }

    if (commandName === "RetrieveCommand") {
      // Mock knowledge base retrieval
      return {
        retrievalResults: [
          {
            content: {
              text: "Level 3 monitoring includes distributed tracing...",
            },
            score: 0.85,
            location: { s3Location: { uri: "s3://bucket/metric.json" } },
          },
        ],
      };
    }

    if (commandName === "RetrieveAndGenerateCommand") {
      // Mock generation with retrieval
      return {
        output: {
          text: "Based on your current setup, I recommend implementing distributed tracing.",
        },
      };
    }

    return {};
  }

  private async *mockCompletionStream() {
    // Mock streaming response
    const chunks = [
      "Level 3 monitoring ",
      "requires comprehensive ",
      "observability with distributed tracing.",
    ];

    for (const chunk of chunks) {
      yield {
        chunk: {
          bytes: new TextEncoder().encode(chunk),
        },
      };
    }
  }
}
```

### Step 3: Create Service Test

Create `/src/lib/__tests__/bedrock-agent.test.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

// Mock AWS SDK before importing service
jest.mock("@aws-sdk/client-bedrock-agent-runtime", () => {
  return {
    BedrockAgentRuntimeClient: jest.fn().mockImplementation(() => {
      return {
        send: jest.fn().mockImplementation(async (command) => {
          const commandName = command.constructor.name;

          if (commandName === "InvokeAgentCommand") {
            return {
              sessionId: "mock-session-123",
              completion: (async function* () {
                yield {
                  chunk: {
                    bytes: new TextEncoder().encode("Mock AI response"),
                  },
                };
              })(),
            };
          }

          return {};
        }),
      };
    }),
    InvokeAgentCommand: class InvokeAgentCommand {
      constructor(public input: any) {}
    },
    RetrieveCommand: class RetrieveCommand {
      constructor(public input: any) {}
    },
    RetrieveAndGenerateCommand: class RetrieveAndGenerateCommand {
      constructor(public input: any) {}
    },
  };
});

import { BedrockAgentService } from "../bedrock-agent";

const prisma = new PrismaClient();
const service = new BedrockAgentService();

describe("BedrockAgentService - Local Tests", () => {
  let testConversationId: string;

  afterAll(async () => {
    // Cleanup
    if (testConversationId) {
      await prisma.bedrockConversation
        .delete({
          where: { id: testConversationId },
        })
        .catch(() => {});
    }
    await prisma.$disconnect();
  });

  test("should initialize conversation", async () => {
    const conversationId = await service.initConversation(
      "test-session-local",
      "test-user-local",
      {
        sessionId: "test-session-local",
        userId: "test-user-local",
        currentMetric: {
          id: "metric-test",
          name: "Test Metric",
          description: "Test description",
          level: 2,
          topicId: "topic-test",
          topicName: "Test Topic",
          pillarId: "pillar-test",
          pillarName: "Test Pillar",
        },
      }
    );

    expect(conversationId).toBeDefined();
    expect(typeof conversationId).toBe("string");
    testConversationId = conversationId;

    // Verify in database
    const conversation = await prisma.bedrockConversation.findUnique({
      where: { id: conversationId },
    });
    expect(conversation).toBeTruthy();
    expect(conversation?.sessionId).toBe("test-session-local");
  });

  test("should send message and get response", async () => {
    if (!testConversationId) {
      throw new Error("No conversation initialized");
    }

    const response = await service.sendMessage(
      testConversationId,
      "What is Level 3 monitoring?"
    );

    expect(response).toBeDefined();
    expect(response.role).toBe("assistant");
    expect(response.content).toBeTruthy();
    expect(typeof response.content).toBe("string");

    // Verify messages in database
    const messages = await prisma.bedrockMessage.findMany({
      where: { conversationId: testConversationId },
      orderBy: { createdAt: "asc" },
    });

    expect(messages.length).toBeGreaterThanOrEqual(2); // System + User + Assistant
  });
});
```

### Step 4: Run Service Tests

```bash
# Add test script to package.json
npm pkg set scripts.test="jest"

# Run tests
npm test bedrock-agent.test
```

## Test Without AWS - Simple Node Script

For the quickest test without AWS or complex setup:

Create `/scripts/test-bedrock-simple.js`:

```javascript
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testBedrockSimple() {
  console.log("🧪 Simple Bedrock Test\n");

  try {
    // 1. Create conversation
    console.log("1. Creating test conversation...");
    const conv = await prisma.bedrockConversation.create({
      data: {
        sessionId: "simple-test-" + Date.now(),
        userId: "test-user",
        status: "ACTIVE",
        contextSnapshot: { test: true },
      },
    });
    console.log("✅ Created:", conv.id);

    // 2. Add messages
    console.log("\n2. Adding messages...");
    await prisma.bedrockMessage.createMany({
      data: [
        {
          conversationId: conv.id,
          role: "USER",
          content: "Hello AI",
          messageType: "QUESTION",
        },
        {
          conversationId: conv.id,
          role: "ASSISTANT",
          content: "Hello! How can I help?",
          messageType: "ANSWER",
        },
      ],
    });
    console.log("✅ Added 2 messages");

    // 3. Query back
    console.log("\n3. Retrieving conversation...");
    const result = await prisma.bedrockConversation.findUnique({
      where: { id: conv.id },
      include: { messages: true },
    });
    console.log(
      "✅ Found conversation with",
      result.messages.length,
      "messages"
    );

    // 4. Cleanup
    console.log("\n4. Cleaning up...");
    await prisma.bedrockConversation.delete({ where: { id: conv.id } });
    console.log("✅ Cleaned up");

    console.log("\n🎉 All tests passed!\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testBedrockSimple();
```

Run it:

```bash
node scripts/test-bedrock-simple.js
```

## Test the Knowledge Base Script (Without S3)

Test the YAML processing without uploading to S3:

Create `/scripts/test-kb-processing.js`:

```javascript
const fs = require("fs").promises;
const path = require("path");
const yaml = require("js-yaml");

async function testKBProcessing() {
  console.log("🧪 Testing Knowledge Base Processing\n");

  const yamlDir = path.join(__dirname, "../yaml-config");

  // Load a sample metric
  const metricsDir = path.join(yamlDir, "metrics");
  const files = await fs.readdir(metricsDir);
  const sampleFile = files.find((f) => f.endsWith(".yaml"));

  if (!sampleFile) {
    console.log("❌ No YAML files found");
    return;
  }

  console.log("📄 Loading:", sampleFile);
  const content = await fs.readFile(path.join(metricsDir, sampleFile), "utf8");
  const metric = yaml.load(content);

  console.log("\n✅ Metric loaded:");
  console.log("   Name:", metric.name);
  console.log("   Description:", metric.description?.substring(0, 50) + "...");
  console.log("   Level:", metric.level);

  // Convert to KB format (simplified)
  const kbDocument = {
    id: metric.id || metric.name.toLowerCase().replace(/\s+/g, "-"),
    type: "metric",
    name: metric.name,
    description: metric.description,
    level: metric.level,
    criteria: metric.criteria || {},
    fullText: `# ${metric.name}\n\n${metric.description || ""}`,
  };

  console.log("\n✅ Converted to KB format:");
  console.log(JSON.stringify(kbDocument, null, 2).substring(0, 300) + "...");

  console.log("\n🎉 KB processing test passed!\n");
}

testKBProcessing();
```

Run it:

```bash
node scripts/test-kb-processing.js
```

## Quick Database Queries

Test directly in PostgreSQL:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE 'bedrock%';

-- Count records in each table
SELECT
  'bedrock_conversations' as table_name, COUNT(*) as count
FROM bedrock_conversations
UNION ALL
SELECT 'bedrock_messages', COUNT(*) FROM bedrock_messages
UNION ALL
SELECT 'bedrock_recommendations', COUNT(*) FROM bedrock_recommendations
UNION ALL
SELECT 'bedrock_evidence_analysis', COUNT(*) FROM bedrock_evidence_analysis;

-- Test inserting a conversation
INSERT INTO bedrock_conversations (id, session_id, user_id, status, context_snapshot)
VALUES (gen_random_uuid(), 'test-123', 'user-456', 'ACTIVE', '{"test": true}')
RETURNING id;

-- Clean up test data
DELETE FROM bedrock_conversations WHERE session_id LIKE 'test-%';
```

## Troubleshooting Local Tests

### Issue: Prisma Client not found

```bash
npx prisma generate
```

### Issue: Database connection error

```bash
# Check your .env DATABASE_URL
cat .env | grep DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT NOW();"
```

### Issue: Tables don't exist

```bash
# Re-run migration
npx prisma db push
```

### Issue: TypeScript errors

```bash
# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

## Next Steps After Local Testing

Once local tests pass:

1. ✅ **Database working** → Configure AWS credentials
2. ✅ **Service layer working** → Deploy Lambda functions
3. ✅ **KB processing working** → Upload to S3
4. ✅ **All tests passing** → Build API routes

---

**Summary**: You can fully test the database schema, Prisma models, and service structure locally without any AWS infrastructure. The mock tests validate the code logic, while real AWS integration can be added later.
