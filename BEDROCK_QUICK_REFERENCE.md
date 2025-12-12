# AWS Bedrock Integration - Quick Reference

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Install dependencies (already done)
npm install

# Configure AWS credentials in .env
AWS_REGION=us-east-1
BEDROCK_AGENT_ID=your-agent-id
BEDROCK_KNOWLEDGE_BASE_ID=your-kb-id
```

### 2. Deploy Lambda Functions

```bash
cd lambda-functions
./deploy.sh  # Or follow README.md
```

### 3. Upload Knowledge Base

```bash
node scripts/prepare-bedrock-knowledge-base.js
```

---

## 📖 Service API Reference

### Initialize Conversation

```typescript
import { bedrockService } from '@/lib/bedrock-agent';

const conversationId = await bedrockService.initConversation(
  sessionId: string,
  userId: string,
  context: ConversationContext
);
```

### Send Message

```typescript
const response = await bedrockService.sendMessage(
  conversationId: string,
  message: string,
  context?: Partial<ConversationContext>
);
// Returns: { role, content, messageType, metadata }
```

### Get Recommendations

```typescript
const recommendations = await bedrockService.getRecommendations(
  sessionId: string,
  context: ConversationContext
);
// Returns: BedrockRecommendation[]
```

### Analyze Evidence

```typescript
const analysis = await bedrockService.analyzeEvidence(
  conversationId: string,
  sessionId: string,
  metricId: string,
  evidenceText: string,
  evidenceUrls?: string[],
  evidenceType?: string
);
// Returns: EvidenceAnalysis
```

### Explain Calculation

```typescript
const explanation = await bedrockService.explainCalculation(
  conversationId: string,
  calculationId: string
);
// Returns: string (explanation)
```

---

## 🗄️ Database Tables

### bedrock_conversations

```typescript
{
  id: UUID
  sessionId: UUID (FK → assessment_sessions)
  userId: UUID
  bedrockSessionId?: string (AWS session ID)
  contextSnapshot: JSON
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  startedAt, lastInteractionAt, endedAt
}
```

### bedrock_messages

```typescript
{
  id: UUID
  conversationId: UUID (FK → bedrock_conversations)
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  messageType?: 'question' | 'answer' | 'recommendation' | ...
  metadata?: JSON
  createdAt
}
```

### bedrock_recommendations

```typescript
{
  id: UUID
  conversationId?: UUID
  sessionId: UUID (FK → assessment_sessions)
  recommendationType: 'metric_suggestion' | 'best_practice' | ...
  title: string
  description: string
  confidenceScore: decimal(3,2)
  priority: 'low' | 'medium' | 'high' | 'critical'
  supportingCitations: JSON
  userFeedback?: 'helpful' | 'not_helpful' | 'applied'
}
```

### bedrock_evidence_analysis

```typescript
{
  id: UUID
  conversationId?: UUID
  sessionId, metricId: UUID
  evidenceText: string
  analysisSummary: string
  maturityLevelSuggestion: int(1-5)
  confidenceScore: decimal(3,2)
  strengths, gaps: JSON arrays
  criteriaMatched: JSON
  userAccepted?: boolean
}
```

---

## 🔧 Lambda Functions

### get_metric_details.py

**Purpose**: Get metric information  
**Endpoint**: GET /metric/details?metricId=uuid  
**Returns**: Metric + Topic + Pillar details

### calculate_score.py

**Purpose**: Real-time score calculation  
**Endpoint**: POST /calculate/score?sessionId=uuid  
**Returns**: Overall/Pillar/Topic scores + statistics

### get_assessment_context.py

**Purpose**: Get session context  
**Endpoint**: GET /session/context?sessionId=uuid  
**Returns**: Session + Progress + Recent activity

---

## 📝 Common Patterns

### Pattern 1: Chat During Assessment

```typescript
// When user asks a question during assessment
const conversationId = await bedrockService.initConversation(
  session.id,
  user.id,
  {
    sessionId: session.id,
    userId: user.id,
    currentMetric: currentQuestion,
    assessmentData: {
      answeredMetrics: session.progress.answered,
      totalMetrics: session.progress.total,
      completionPercentage: session.progress.percentage,
    },
  }
);

const response = await bedrockService.sendMessage(
  conversationId,
  "What does Level 3 mean for this metric?"
);

console.log(response.content);
```

### Pattern 2: Get Proactive Recommendations

```typescript
// After user completes a pillar
const recommendations = await bedrockService.getRecommendations(session.id, {
  sessionId: session.id,
  userId: user.id,
  assessmentData: currentProgress,
});

recommendations.forEach((rec) => {
  if (rec.priority === "high") {
    showNotification(rec.title, rec.description);
  }
});
```

### Pattern 3: Evidence Analysis

```typescript
// When user provides evidence
const analysis = await bedrockService.analyzeEvidence(
  conversationId,
  session.id,
  currentMetric.id,
  userEvidence,
  evidenceUrls,
  "document"
);

// Pre-fill the score based on AI suggestion
setScore(analysis.maturityLevelSuggestion);
setConfidence(analysis.confidenceScore);
showStrengths(analysis.strengths);
showGaps(analysis.gaps);
```

### Pattern 4: Explain Results

```typescript
// After calculation completes
const explanation = await bedrockService.explainCalculation(
  conversationId,
  calculation.id
);

displayExplanation(explanation);
```

---

## 🐛 Troubleshooting

### Issue: Prisma client not updated

```bash
npx prisma generate
```

### Issue: Database out of sync

```bash
npx prisma db push
```

### Issue: TypeScript errors on BedrockConversation

```typescript
// Restart TypeScript server in VS Code
// Cmd+Shift+P → "TypeScript: Restart TS Server"
```

### Issue: AWS credentials not working

```bash
# Test AWS credentials
aws sts get-caller-identity

# Verify Bedrock access
aws bedrock-agent list-agents
```

### Issue: Lambda function timeout

```bash
# Increase timeout in Lambda console
# Check CloudWatch logs for details
aws logs tail /aws/lambda/BedrockAgent-GetMetricDetails
```

---

## 📊 Monitoring

### CloudWatch Metrics to Watch

- Lambda invocation count
- Lambda error rate
- Bedrock token usage
- Database connection count
- API response times

### CloudWatch Alarms to Set

```bash
# Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name bedrock-lambda-errors \
  --metric-name Errors \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold

# Bedrock throttling
aws cloudwatch put-metric-alarm \
  --alarm-name bedrock-throttling \
  --metric-name ThrottleCount \
  --threshold 5
```

### Database Queries to Monitor

```sql
-- Active conversations
SELECT COUNT(*) FROM bedrock_conversations WHERE status = 'ACTIVE';

-- Messages per hour
SELECT COUNT(*) FROM bedrock_messages
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Top recommendation types
SELECT recommendation_type, COUNT(*)
FROM bedrock_recommendations
GROUP BY recommendation_type
ORDER BY COUNT(*) DESC;
```

---

## 🔑 Environment Variables

```env
# Required
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
BEDROCK_AGENT_ID=...
BEDROCK_AGENT_ALIAS_ID=...
BEDROCK_KNOWLEDGE_BASE_ID=...

# Optional
BEDROCK_DATA_SOURCE_ID=...
BEDROCK_KB_S3_BUCKET=maturity-assessment-kb
BEDROCK_KB_S3_PREFIX=knowledge-base/
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# Lambda Functions (for deployment)
DB_CLUSTER_ARN=arn:aws:rds:...
DB_SECRET_ARN=arn:aws:secretsmanager:...
DB_NAME=maturity_assessment
```

---

## 📚 File Locations

```
Key Implementation Files:
├── src/
│   ├── config/aws-config.ts          (AWS configuration)
│   └── lib/bedrock-agent.ts          (Core service - 700 lines)
├── lambda-functions/
│   ├── get_metric_details.py         (Lambda 1 - 190 lines)
│   ├── calculate_score.py            (Lambda 2 - 370 lines)
│   ├── get_assessment_context.py     (Lambda 3 - 310 lines)
│   └── README.md                     (Deployment guide)
├── scripts/
│   └── prepare-bedrock-knowledge-base.js  (KB automation)
├── prisma/
│   ├── schema.prisma                 (Database models)
│   └── migrations/add_bedrock_tables.sql  (Migration)
└── Documentation:
    ├── BEDROCK_AGENT_IMPLEMENTATION_PLAN.md
    ├── BEDROCK_PHASE1_COMPLETE.md
    ├── BEDROCK_IMPLEMENTATION_STATUS.md
    └── BEDROCK_PHASE1_2_3_COMPLETE.md
```

---

## ⚡ Performance Tips

1. **Conversation Management**
   - End conversations when assessment completes
   - Clean up old conversations periodically
   - Limit message history to last 20 messages

2. **Recommendations**
   - Cache recommendations per metric
   - Refresh only when context changes significantly
   - Batch recommendation requests

3. **Evidence Analysis**
   - Show loading state for 2-5 second analysis time
   - Process evidence client-side first (validation)
   - Use optimistic UI updates

4. **Lambda Optimization**
   - Keep functions warm with CloudWatch Events
   - Use appropriate memory sizes
   - Monitor cold start times

---

## 🎯 Next Steps Checklist

- [ ] Configure AWS credentials in `.env`
- [ ] Create Bedrock Agent in AWS Console
- [ ] Deploy 3 Lambda functions
- [ ] Upload YAML metrics to S3
- [ ] Test Lambda functions with sample data
- [ ] Create API routes in `/api/bedrock/`
- [ ] Build BedrockAssistant component
- [ ] Integrate with AssessmentWizard
- [ ] Write unit tests
- [ ] Deploy to staging
- [ ] Production rollout

---

**Quick Links**:

- [Full Implementation Plan](BEDROCK_AGENT_IMPLEMENTATION_PLAN.md)
- [Lambda Deployment Guide](lambda-functions/README.md)
- [Complete Status](BEDROCK_PHASE1_2_3_COMPLETE.md)
