# Simplified AWS Bedrock Chat Integration

## Overview

This is a **much simpler** alternative to the full Bedrock Agent setup. Instead of Knowledge Bases and Action Groups, it:

1. ✅ Uses Claude directly via Bedrock Runtime API
2. ✅ Passes all context in the prompt (pillar, topic, metric, scores)
3. ✅ No Knowledge Base setup required
4. ✅ No Agent creation required
5. ✅ Just need Bedrock model access

## What It Does

The AI assistant helps users during assessments by:

- **Explaining** what each metric measures
- **Suggesting** appropriate maturity scores based on project description
- **Providing** AWS Cloud Excellence best practices
- **Recommending** improvements to reach higher levels
- **Answering** questions about evidence and criteria

## Setup (5 minutes)

### 1. Request Bedrock Model Access

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess)
2. Click "Manage model access"
3. Request access to: **Anthropic Claude 3.5 Sonnet v2**
4. Wait for approval (usually instant)

That's it! No Knowledge Base, no Agent setup needed.

### 2. Set Environment Variables

Add to your `.env.local`:

```bash
# AWS Credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_SESSION_TOKEN=your-session-token  # Optional, for temporary credentials
```

### 3. Test It

```bash
npm run dev
```

Navigate to any assessment and click the chat icon on a metric!

## Usage in Your App

### Add Chat to Assessment Page

```tsx
import AssessmentChat from "@/components/AssessmentChat";

// In your component:
const [showChat, setShowChat] = useState(false);

<button onClick={() => setShowChat(true)}>Ask AI Assistant</button>;

{
  showChat && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl h-[600px] m-4">
        <AssessmentChat
          metricId={metric.id}
          sessionId={session.id}
          metricName={metric.name}
          projectInfo="We are implementing microservices on AWS ECS..."
          onClose={() => setShowChat(false)}
        />
      </div>
    </div>
  );
}
```

## API Endpoint

### POST `/api/chat`

Send a message and get AI response:

```typescript
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "What should our monitoring score be?",
    metricId: "metric-uuid",
    sessionId: "session-uuid", // Optional
    projectInfo: "We use CloudWatch and Datadog", // Optional
  }),
});

const data = await response.json();
// { response: "Based on...", quickPrompts: [...] }
```

### GET `/api/chat?sessionId=xxx&metricId=yyy`

Get chat history for a session/metric.

## How It Works

1. **User asks question** about a metric
2. **System retrieves** pillar, topic, metric details from database
3. **Claude receives** structured prompt with:
   - Metric description and criteria
   - Current assessment score (if any)
   - Project context from user
   - AWS Cloud Excellence maturity levels
4. **Claude responds** with relevant guidance
5. **Conversation saved** to database for continuity

## Context Passed to Claude

For each chat, Claude receives:

```
You are an Enterprise Architecture Maturity Assessment assistant.

Current Assessment Context:
- Pillar: Security (Protect information, systems, and assets)
- Topic: Security Fundamentals (IAM, encryption, monitoring)
- Metric: Multi-Factor Authentication (MFA usage across accounts)
- Current Score: Level 2
- Evidence: "MFA enabled for root account only"
- Project Info: "AWS Organization with 15 accounts"

Maturity Levels:
Level 1: Ad-hoc, reactive
Level 2: Basic processes, some documentation
Level 3: Documented, consistently applied
Level 4: Quantitatively managed, metrics-driven
Level 5: Continuous optimization

Guide the user on appropriate scoring and improvements.
```

## Cost

Much cheaper than full Bedrock Agent:

- **Claude 3.5 Sonnet**: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens
- **100 conversations** (~500 tokens each): ~$1-2/month
- **No Knowledge Base costs**
- **No Agent costs**

## Comparison

| Feature        | Full Bedrock Agent    | Simple Chat            |
| -------------- | --------------------- | ---------------------- |
| Setup Time     | 30-40 min             | 5 min                  |
| AWS Resources  | Agent, KB, Lambda, S3 | Just model access      |
| Knowledge Base | Yes (OpenSearch)      | No (context in prompt) |
| Cost           | ~$20-40/month         | ~$1-2/month            |
| Flexibility    | Complex workflows     | Simple Q&A             |
| Best For       | Multi-step tasks      | Assessment guidance    |

## Files Created

- `/src/lib/bedrock-simple-chat.ts` - Core chat logic
- `/src/app/api/chat/route.ts` - API endpoint
- `/src/components/AssessmentChat.tsx` - React UI component

## Example Conversations

**User**: "What does this metric measure?"
**AI**: "This metric evaluates Multi-Factor Authentication (MFA) adoption across your AWS accounts. It measures how comprehensively you've implemented MFA beyond just the root account..."

**User**: "We have MFA on root and admin users. What score?"
**AI**: "Based on your description, you're at **Level 2 (Developing)**. You've moved beyond just root account protection, which is good. To reach Level 3, you'd need..."

**User**: "How do we improve to Level 4?"
**AI**: "To reach Level 4 (Managed), you should: 1) Enforce MFA via SCPs 2) Monitor MFA compliance with AWS Config 3) Set up automated remediation for non-compliant users..."

## Next Steps

1. ✅ Request Claude model access
2. ✅ Set environment variables
3. ✅ Add chat button to your assessment UI
4. ✅ Test with real questions
5. Optional: Customize system prompts for your specific use case

---

**This approach is recommended** if you want AI assistance without the complexity of full Bedrock Agent setup!
