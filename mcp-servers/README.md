# 🤖 Two-Agent MCP System

## Overview

This directory contains the **Model Context Protocol (MCP)** implementation for a dual-agent architecture that assists users with enterprise architecture maturity assessments.

## Architecture

### Agent 1: Assessment Coach Agent 🎯

**File:** `assessment-coach.ts`

**Purpose:** Guides users through assessments with contextual help

**Capabilities:**

- `getAssessmentContext(metricId?)` - Retrieves pillar/topic/metric details
- `getCurrentAnswers()` - Fetches user's current assessment progress
- `suggestImprovements(metricId, evidence)` - Recommends better scores
- `explainMetric(metricId)` - Breaks down what a metric measures
- `provideExamples(metricId, level)` - Real-world examples for maturity levels

**Communication:**

- Receives user messages
- Requests analysis from Scoring Analyst Agent
- Formats responses for users

---

### Agent 2: Scoring Analyst Agent 📊

**File:** `scoring-analyst.ts`

**Purpose:** Analyzes completed assessments and generates insights

**Capabilities:**

- `calculateFullMaturity(sessionId)` - Runs scoring algorithms
- `identifyWeakAreas(sessionId, threshold)` - Finds weak areas across pillars
- `generateImprovementPlan(sessionId, pillarId?)` - Creates actionable plans
- `compareToBenchmarks(sessionId, industry?)` - Compares to industry standards
- `getHistoricalTrends(targetId)` - Forecasts maturity trajectory
- `generateInsights(sessionId)` - Comprehensive analysis

**Communication:**

- Receives requests from Coach Agent
- Performs complex calculations
- Returns structured data

---

### Agent Coordinator 🔄

**File:** `agent-coordinator.ts`

**Purpose:** Manages communication between agents

**Features:**

- Message routing between Coach and Analyst
- Context management
- Response formatting
- Caching for performance

---

## Agent Communication Flow

```
User → Coach Agent → Analyst Agent → Coach Agent → User
```

### Example Interaction:

1. **User:** "Analyze my assessment"
2. **Coach Agent:** Receives message, identifies need for analysis
3. **Coach → Analyst:** "Calculate maturity for session XYZ"
4. **Analyst:** Calculates scores, identifies weak areas, generates recommendations
5. **Analyst → Coach:** Returns structured data
6. **Coach → User:** Formats and presents insights in friendly language

---

## API Endpoint

**Endpoint:** `POST /api/agents/chat`

**Request:**

```json
{
  "message": "What are my weak areas?",
  "sessionId": "session-uuid",
  "context": {
    "targetId": "target-uuid",
    "targetName": "Production System",
    "industry": "Technology"
  }
}
```

**Response:**

```json
{
  "success": true,
  "response": "🔍 **Weak Areas Identified**\n\nFound 3 area(s)...",
  "timestamp": "2025-12-09T..."
}
```

---

## UI Integration

### Talk to Agent Button

Located in `AssessmentWizard.tsx` header (top-right)

**Features:**

- Opens full-screen agent chat modal
- Purple/blue/indigo gradient styling
- Bot icon with animated pulse indicator
- Quick action buttons for common queries

### AI Help Buttons (Existing)

Located on each metric card

**Features:**

- Metric-specific context help
- Uses existing Bedrock chat
- Unchanged functionality

---

## User Queries Supported

### Progress Tracking

- "What's my current progress?"
- "How am I doing?"
- "Show me what I've completed"

### Analysis

- "Analyze my assessment"
- "What's my score?"
- "Give me insights"

### Recommendations

- "What should I improve?"
- "Give me recommendations"
- "Show me my weak areas"

### Learning

- "Explain this metric"
- "What are the maturity levels?"
- "Show me examples"

### Comparison

- "How do I compare to benchmarks?"
- "What's the industry average?"
- "Am I above or below average?"

---

## Quick Actions

Pre-built query buttons for common tasks:

1. **My Progress** 🎯
   - Query: "What is my current progress?"
   - Shows answered metrics by pillar

2. **Analyze** 📈
   - Query: "Analyze my assessment and show me insights"
   - Full maturity analysis with strengths/weaknesses

3. **Recommendations** ✨
   - Query: "Give me improvement recommendations"
   - Actionable improvement plan

---

## Database Schema

The agents use existing Prisma models:

- `AssessmentSession` - Session data
- `AssessmentResult` - User answers
- `MaturityPillar` - Pillar definitions
- `AssessmentTopic` - Topic definitions
- `Metric` - Metric definitions
- `BedrockMessage` - Chat history (optional)
- `BedrockRecommendation` - Generated recommendations (optional)

---

## Performance

### Caching

- Analyst caches calculation results
- Cache invalidated after data changes
- Reduces redundant calculations

### Response Times

- Simple queries: < 500ms
- Analysis queries: 1-2s
- Full insights: 2-3s

---

## Example Conversations

### Example 1: Progress Check

```
User: "How am I doing?"

Agent: 📈 Your Progress

Total Questions Answered: 45

By Pillar:
• Security: 12 metric(s)
• Reliability: 15 metric(s)
• Performance: 18 metric(s)

Keep going! You're making great progress! 🚀
```

### Example 2: Full Analysis

```
User: "Analyze my assessment"

Agent: 📊 Assessment Analysis

Overall Maturity Score: 2.3/3.0 (Managed)

💪 Strengths:
• Performance Efficiency
• Security

⚠️ Areas for Improvement:
• Cost Optimization
• Operational Excellence

🎯 Top Recommendations:
1. Cost Management: Document current state and processes
2. Monitoring Basics: Implement monitoring and alerting
3. Backup Automation: Begin automation rollout
```

### Example 3: Metric Explanation

```
User: "Explain this metric"

Agent: 📖 Disaster Recovery Planning

Evaluates your organization's ability to recover from disasters.

Context: This metric is part of Reliability pillar, under the
Disaster Recovery topic.

Maturity Levels:
• Level 1: Ad-hoc, reactive, no formal processes
• Level 2: Documented, repeatable, some automation
• Level 3: Fully automated, continuous improvement, best-in-class

Scoring Guide: Rate from 1-5 based on maturity. For Level 2,
consider the depth and automation of implementation.
```

---

## Testing

### Test the Agents

1. Start dev server: `npm run dev`
2. Navigate to any assessment
3. Click "Talk to Agent" button (purple gradient, top-right)
4. Try quick actions or ask questions

### Test Queries

```
- "What's my progress?"
- "Analyze my assessment"
- "What are my weak areas?"
- "Give me recommendations"
- "Explain metric X"
- "Show me examples for level 2"
```

---

## Future Enhancements

### Planned Features

- [ ] Historical trend visualization
- [ ] Industry benchmark comparisons
- [ ] Automated recommendation prioritization
- [ ] Multi-session analysis
- [ ] Export insights to PDF
- [ ] Voice input support
- [ ] Scheduled assessment reminders

### Agent Improvements

- [ ] Natural language understanding (NLU)
- [ ] Sentiment analysis
- [ ] Proactive suggestions
- [ ] Learning from user feedback
- [ ] Multi-language support

---

## Troubleshooting

### Agent not responding

- Check `/api/agents/chat` endpoint
- Verify database connection
- Check browser console for errors

### Wrong context

- Ensure `sessionId` is passed correctly
- Verify assessment data exists
- Check agent coordinator routing

### Performance issues

- Clear agent cache: `coordinator.clearAll()`
- Check database query performance
- Monitor API response times

---

## Technical Details

### Dependencies

- Next.js 15+ (App Router)
- Prisma (Database ORM)
- TypeScript
- Lucide Icons

### No External APIs Required

- Agents run entirely on your infrastructure
- No external AI API calls (separate from Bedrock chat)
- Pure TypeScript logic

### Scalability

- Stateless agent instances
- Session-based coordination
- Horizontal scaling ready

---

## Credits

Built for the Enterprise Architecture Maturity Assessment Platform
Implements Model Context Protocol (MCP) architecture
Dual-agent system: Coach + Analyst working together

---

**Happy Assessing! 🚀**
