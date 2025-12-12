# LLM-Based Agent System Documentation

## Overview

The application now features an **LLM-powered multi-agent system** using AWS Bedrock and Claude 3.5 Sonnet. This replaces the previous keyword-based routing with intelligent AI reasoning and tool calling.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Interface                       │
│                      (AgentChat.tsx)                         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Endpoint                              │
│                 /api/agents/chat                             │
│           (Manages conversation history)                     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│               LLMAgentCoordinator                            │
│                                                              │
│  ┌────────────────────────────────────────────────┐         │
│  │          Claude 3.5 Sonnet (Bedrock)          │         │
│  │                                                │         │
│  │  • Understands user intent                    │         │
│  │  • Reasons about which tools to call          │         │
│  │  • Generates natural responses                │         │
│  │  • Tool calling with function definitions     │         │
│  └────────────────────┬───────────────────────────┘         │
│                       │                                      │
│         ┌─────────────┴──────────────┐                      │
│         ▼                            ▼                       │
│  ┌──────────────┐          ┌─────────────────┐             │
│  │   Coach      │          │    Analyst      │             │
│  │   Agent      │          │    Agent        │             │
│  │              │          │                 │             │
│  │ Tools:       │          │ Tools:          │             │
│  │ • Context    │          │ • Calculate     │             │
│  │ • Answers    │          │ • Analyze       │             │
│  │ • Explain    │          │ • Recommend     │             │
│  │ • Examples   │          │ • Insights      │             │
│  └──────────────┘          └─────────────────┘             │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   (via Prisma)  │
                    └─────────────────┘
```

## Key Components

### 1. LLMAgentCoordinator (`/mcp-servers/llm-agent-coordinator.ts`)

The brain of the system. Uses Claude to:

- **Understand natural language** - No more keyword matching!
- **Reason about user intent** - Intelligently decide which tools to call
- **Call multiple tools** - Can chain tool calls to answer complex questions
- **Generate contextual responses** - Natural, conversational answers

**Key Features:**

- **Tool Calling**: Claude has 8 defined tools it can invoke
- **Conversation Memory**: Maintains full conversation history
- **Multi-turn Reasoning**: Can call multiple tools in sequence
- **Error Handling**: Graceful fallbacks for API errors

### 2. Tool Definitions

Claude has access to 8 specialized tools:

#### Coach Agent Tools:

1. **get_assessment_context** - Get metric/topic/pillar details
2. **get_current_answers** - Check user's progress
3. **explain_metric** - Detailed metric explanations
4. **provide_examples** - Practical examples at different maturity levels

#### Analyst Agent Tools:

5. **calculate_maturity_score** - Full maturity calculation
6. **identify_weak_areas** - Find low-scoring areas
7. **generate_improvement_plan** - Create action plans
8. **generate_insights** - Comprehensive analysis

### 3. How It Works

#### Example Flow: User asks "How am I doing?"

```typescript
1. User Input: "How am I doing?"
   ↓
2. LLMAgentCoordinator receives message
   ↓
3. Claude analyzes intent → Determines needs: progress + analysis
   ↓
4. Claude calls tool: get_current_answers()
   ↓
5. Tool Result: { answeredCount: 12, totalCount: 45, progress: 26.7% }
   ↓
6. Claude calls tool: calculate_maturity_score()
   ↓
7. Tool Result: { overallScore: 1.8, pillars: [...] }
   ↓
8. Claude synthesizes results into natural response:
   "📊 Here's your current progress:

   You've completed 12 out of 45 questions (26.7% complete).
   Your current maturity score is 1.8/3.0 (Initial level).

   Keep going! Focus on completing the remaining questions..."
```

#### Tool Calling Loop:

```typescript
while (toolCalls < maxToolCalls) {
  // 1. Claude receives context + conversation history
  response = await makeBedrockRequest(payload);

  // 2. Check if Claude wants to use a tool
  if (response.hasToolUse) {
    // 3. Execute the tool (e.g., calculate_maturity_score)
    toolResult = await executeTool(toolName, input);

    // 4. Send result back to Claude
    payload.messages.push({
      role: "user",
      content: { type: "tool_result", content: toolResult },
    });

    // 5. Continue loop - Claude may call more tools
    continue;
  }

  // 6. No more tools needed - Claude generates final response
  finalResponse = response.text;
  break;
}
```

## Key Differences from Previous System

### Before (Keyword-Based):

```typescript
// Simple keyword matching
if (message.includes("analyze") || message.includes("score")) {
  return await analyst.calculateScore();
}
```

**Limitations:**

- Rigid keyword matching
- No context understanding
- Can't handle variations
- No natural conversation

### After (LLM-Based):

```typescript
// Claude understands intent and reasons
const response = await claude.invokeWithTools(message, tools);
// Claude decides: "User wants analysis + recommendations"
// → Calls calculate_maturity_score()
// → Calls identify_weak_areas()
// → Synthesizes into natural response
```

**Advantages:**

- ✅ Natural language understanding
- ✅ Context-aware reasoning
- ✅ Conversational responses
- ✅ Multi-step problem solving
- ✅ Handles variations and typos
- ✅ Can ask clarifying questions

## Configuration

### Required Environment Variables:

```bash
# AWS Bedrock Configuration
BEDROCK_API_KEY=your-api-key-here
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
```

### Optional (for Knowledge Base):

```bash
BEDROCK_KB_ID=your-kb-id
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## API Usage

### Send Message:

```typescript
POST /api/agents/chat
{
  "message": "Analyze my assessment and give recommendations",
  "sessionId": "unique-session-id",
  "context": {
    "assessmentId": 123,
    "metricId": 456
  }
}
```

### Response:

```typescript
{
  "success": true,
  "response": "📊 Assessment Analysis...",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "usedLLM": true
}
```

### Clear History:

```typescript
DELETE /api/agents/chat?sessionId=unique-session-id
```

## System Prompt

Claude is given this system prompt to guide its behavior:

```
You are an intelligent AI assistant helping users with enterprise
architecture maturity assessments. You coordinate between two
specialized agents:

1. Assessment Coach Agent: Helps users understand metrics, provides
   examples, explains concepts, and tracks progress

2. Scoring Analyst Agent: Calculates maturity scores, identifies
   weaknesses, and generates improvement recommendations

Your role is to:
- Understand user intent and call the appropriate tools
- Provide clear, actionable guidance in a friendly, professional tone
- Use emojis strategically to make responses visually appealing
- Format responses with proper markdown
- Be concise but thorough
- Focus on helping users improve their maturity scores
```

## Example Conversations

### Example 1: Getting Started

```
User: "I'm new here, what should I do?"

Claude:
🎯 Welcome! Let me help you get started.

First, let me check your current progress...
[Calls: get_current_answers()]

📊 **Your Status:**
- Questions answered: 3/45 (6.7%)
- Current maturity score: Not enough data yet

💡 **Recommended Next Steps:**
1. Start with the Data Management pillar
2. Answer questions honestly based on your current practices
3. Use the AI Help button if you need clarification
4. Come back here anytime for progress updates!

Ready to continue? Let me know if you have questions!
```

### Example 2: Complex Analysis

```
User: "Analyze my assessment and tell me what I should focus on"

Claude:
[Calls: calculate_maturity_score()]
[Calls: identify_weak_areas()]
[Calls: generate_improvement_plan()]

📊 **Assessment Analysis**

**Overall Score:** 1.8/3.0 (Initial Level)

⚠️ **Weak Areas Identified:**
1. Data Quality (1.2/3.0)
2. Security Practices (1.5/3.0)
3. Monitoring & Alerts (1.3/3.0)

🚀 **Priority Recommendations:**

**1. Improve Data Quality First**
- Implement data validation rules
- Create data quality metrics
- Establish data governance policies

**2. Strengthen Security**
- Enable MFA for all users
- Implement encryption at rest
- Set up security audit logs

**3. Enhance Monitoring**
- Deploy application monitoring tools
- Create alerting thresholds
- Establish incident response procedures

💡 These areas will give you the biggest maturity score improvements!
```

## Testing

### 1. Start the Development Server:

```bash
npm run dev
```

### 2. Open Assessment:

- Go to http://localhost:3000/assessments
- Click any assessment
- Click "Talk to Agent" button (purple, top-right)

### 3. Try These Queries:

```
- "How am I doing?"
- "What's my current score?"
- "Analyze my assessment"
- "What are my weak areas?"
- "Give me recommendations"
- "Explain the data quality metric"
- "Show me examples for level 2"
- "What should I focus on improving?"
```

### 4. Watch the Magic:

- Claude will understand your intent
- Call appropriate tools automatically
- Provide natural, contextual responses
- Remember conversation context

## Troubleshooting

### Error: "Bedrock API key not configured"

**Solution:** Add `BEDROCK_API_KEY` to `.env.local`

### Error: "Tool execution failed"

**Solution:** Check database connection and session data

### Response is generic/not specific

**Solution:** Provide more context (metricId, assessmentId) in the request

### Conversation loses context

**Solution:** Session histories are in-memory. Use Redis/DB for production.

## Production Considerations

### 1. Conversation History Storage

Current implementation stores histories in memory:

```typescript
const sessionHistories = new Map<string, any[]>();
```

**For Production:**

- Use Redis for fast access
- Or store in PostgreSQL with session table
- Implement TTL/cleanup for old sessions

### 2. Rate Limiting

Add rate limiting to prevent abuse:

```typescript
// Example with express-rate-limit
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per 15 minutes
});
```

### 3. Cost Optimization

- Monitor Bedrock API costs
- Implement caching for common queries
- Set max_tokens appropriately
- Consider cheaper models for simple queries

### 4. Error Handling

- Add retry logic for transient failures
- Implement fallback responses
- Log all errors for debugging
- Alert on high error rates

### 5. Security

- Sanitize user inputs
- Validate session IDs
- Implement proper authentication
- Rate limit per user, not just IP

## Benefits of LLM-Based Approach

1. **Natural Conversations** - Users can ask questions naturally
2. **Context Understanding** - Claude understands intent, not just keywords
3. **Multi-Step Reasoning** - Can handle complex, multi-part questions
4. **Adaptive Responses** - Tailors answers to user's specific situation
5. **Continuous Improvement** - Can be improved by refining prompts
6. **Extensible** - Easy to add new tools without changing logic
7. **User-Friendly** - No need to learn specific commands

## Next Steps

### Potential Enhancements:

1. **Streaming Responses** - Show responses as they're generated
2. **Voice Input** - Allow users to speak questions
3. **Suggested Follow-ups** - Show relevant next questions
4. **Multi-language Support** - Claude supports 100+ languages
5. **Sentiment Analysis** - Detect user frustration and adapt
6. **Learning from Feedback** - Track thumbs up/down to improve
7. **Integration with KB** - Add knowledge base for domain expertise
8. **Agent Memory** - Remember user preferences across sessions

## Files Modified/Created

### Created:

- `/mcp-servers/llm-agent-coordinator.ts` - LLM-based coordinator with tool calling

### Modified:

- `/src/app/api/agents/chat/route.ts` - Updated to use LLM coordinator
- `/src/components/AgentChat.tsx` - Updated welcome message to mention LLM

### Unchanged:

- `/mcp-servers/assessment-coach.ts` - Tools remain the same
- `/mcp-servers/scoring-analyst.ts` - Tools remain the same
- `/mcp-servers/agent-coordinator.ts` - Preserved for reference (not used)
- All other components - No breaking changes

## Comparison: Rule-Based vs LLM-Based

| Feature          | Rule-Based (Old) | LLM-Based (New)                |
| ---------------- | ---------------- | ------------------------------ |
| Intent Detection | Keywords         | Natural Language Understanding |
| Flexibility      | Rigid            | Adaptive                       |
| Conversational   | No               | Yes                            |
| Multi-step       | Manual           | Automatic                      |
| Context Aware    | Limited          | Comprehensive                  |
| Extensibility    | Complex          | Simple (add tools)             |
| User Experience  | Command-like     | Natural conversation           |
| Error Handling   | Generic          | Context-specific               |
| Cost             | Free             | ~$0.003 per request            |
| Latency          | <100ms           | 500-2000ms                     |

## Conclusion

The LLM-based agent system transforms the assessment experience from a **command-driven interface** to a **natural conversation**. Users can ask questions however they want, and Claude will intelligently coordinate the agents to provide helpful, contextual responses.

**Key Achievement:** Zero breaking changes to existing functionality while adding powerful AI capabilities! 🎉
