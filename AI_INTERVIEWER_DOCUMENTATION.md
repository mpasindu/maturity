# 🎤 AI Assessment Interviewer Agent - Documentation

## Overview

The **AI Assessment Interviewer Agent** is a completely separate, LLM-powered agent that conducts interactive assessments through natural conversation. Unlike the existing Coach and Analyst agents (which help with existing assessments), this agent actively **asks questions and records answers**, creating assessments through dialogue.

---

## 🎯 Purpose

**Traditional Assessment**: User manually fills out forms, selecting maturity levels for each metric.

**AI Interview Assessment**: Conversational AI guides user through questions, understands natural responses, and automatically records answers.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              User Interface                         │
│                                                     │
│  1. Dashboard: "AI Interview" button               │
│  2. /ai-interview page: Assessment selection       │
│  3. InterviewerChat.tsx: Conversational UI         │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│           API Endpoint                              │
│       /api/interviewer                              │
│                                                     │
│  Actions: "start" | "message"                       │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│        LLMInterviewerAgent                          │
│    (llm-interviewer-agent.ts)                       │
│                                                     │
│  • Manages conversation                             │
│  • Uses Claude to understand responses              │
│  • Parses maturity levels from natural language     │
│  • Generates follow-up questions                    │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│      AssessmentInterviewerAgent                     │
│   (assessment-interviewer.ts)                       │
│                                                     │
│  • Loads all metrics as questions                   │
│  • Manages question navigation                      │
│  • Saves answers to database                        │
│  • Tracks progress                                  │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
                ┌───────┐
                │Prisma │
                │  DB   │
                └───────┘
```

---

## 📁 New Files Created

### 1. `/mcp-servers/assessment-interviewer.ts`

**Base interviewer logic** (rule-based, no LLM)

**Key Classes:**

- `AssessmentInterviewerAgent`

**Key Methods:**

```typescript
initializeInterview(); // Load all questions from database
getCurrentQuestion(); // Get current question
submitAnswer(answer); // Save answer and move to next
skipQuestion(); // Skip current question
previousQuestion(); // Go back
getProgress(); // Get completion stats
getSummary(); // Get summary by pillar/level
```

**Features:**

- Loads all active metrics as questions
- Maintains current question index
- Saves answers to `assessment_results` table
- Tracks answered vs unanswered questions
- Updates session status (DRAFT → IN_PROGRESS → COMPLETED)

---

### 2. `/mcp-servers/llm-interviewer-agent.ts`

**LLM-powered conversational layer** (uses Claude)

**Key Classes:**

- `LLMInterviewerAgent`

**Key Methods:**

```typescript
startInterview(); // Generate welcome + first question
handleMessage(userMessage); // Process user responses
parseAnswer(); // Extract maturity level from natural language
generateFollowUpResponse(); // Create next question
generateCompletionMessage(); // Celebrate completion
clarifyResponse(); // Ask for clarification if unclear
```

**Features:**

- **Natural Language Understanding**: Parses responses like:
  - "We're at level 2"
  - "I'd say managed"
  - "Level 3 - fully optimized"
  - "Initial level, we're just starting"
- **Conversational Flow**:
  - Warm welcome message
  - Acknowledges previous answers
  - Provides progress updates at milestones
  - Encouraging tone
- **Smart Clarification**:
  - If response unclear, asks for clarification
  - Reminds user of level options
  - Doesn't fail, just helps user

---

### 3. `/src/app/api/interviewer/route.ts`

**API endpoint for interviewer**

**Endpoints:**

```typescript
POST /api/interviewer
{
  "action": "start",
  "sessionId": "uuid"
}
// Returns: Welcome message + first question

POST /api/interviewer
{
  "action": "message",
  "sessionId": "uuid",
  "message": "We're at level 2"
}
// Returns: Acknowledgment + next question

DELETE /api/interviewer?sessionId=uuid
// Clears session
```

---

### 4. `/src/components/InterviewerChat.tsx`

**Beautiful UI component for interview**

**Features:**

- Welcome screen with "Start Interview" button
- Chat-style message bubbles
- Quick action buttons:
  - 📊 Progress - See completion status
  - ⏭️ Skip - Skip current question
  - ⬅️ Back - Go to previous question
  - ❓ Help - Show help
- Real-time message display
- Loading indicators
- Conversational tips

**Design:**

- Green gradient theme (to distinguish from purple Agent Chat)
- ClipboardList icon
- Professional interview aesthetic
- Responsive layout

---

### 5. Updated `/src/components/AssessmentWizard.tsx`

**Added "AI Interview" button**

**Changes:**

```tsx
// Import
import InterviewerChat from "./InterviewerChat";

// State
const [showInterviewerChat, setShowInterviewerChat] = useState(false);

// Button (green gradient, left of "Talk to Agent")
<button onClick={() => setShowInterviewerChat(true)}>
  <ClipboardList /> AI Interview
</button>;

// Modal
{
  showInterviewerChat && (
    <InterviewerChat
      sessionId={sessionId}
      onClose={() => setShowInterviewerChat(false)}
    />
  );
}
```

---

### 6. Updated `/prisma/schema.prisma`

**Added unique constraint**

```prisma
model AssessmentResult {
  // ... existing fields

  @@unique([sessionId, metricId], name: "sessionId_metricId")
  @@map("assessment_results")
}
```

**Why?** Allows `upsert` in interviewer (update existing answer or create new).

---

## 🎬 User Flow

### 1. Starting Interview

```
User clicks "AI Interview" button
  ↓
Welcome screen appears
  ↓
User clicks "Start Interview"
  ↓
Claude generates warm welcome:

"👋 Hi! Welcome to your Enterprise Architecture Maturity Assessment!
I'll be your guide today. I have 45 questions across 5 pillars.

Don't worry - we can skip questions, go back, or take breaks anytime!

Let's start with Data Management.

**Data Quality**
How would you rate your current data quality management?

Your options:
• Level 1 (Initial): Basic data quality with minimal validation
• Level 2 (Managed): Documented quality standards with monitoring
• Level 3 (Optimized): Automated quality checks with continuous improvement

What level best describes your organization?"
```

### 2. User Responds

```
User types: "I think we're at level 2"
  ↓
Claude parses response:
  {
    "level": 2,
    "confidence": "high",
    "notes": null
  }
  ↓
Saves to database
  ↓
Generates follow-up:

"Great! Level 2 (Managed) for data quality shows you have documented
standards in place. That's solid! 📊

You've completed 1/45 questions (2% complete)

Next up: **Data Governance**
How mature is your data governance framework?

• Level 1 (Initial): Ad-hoc governance, no formal policies
• Level 2 (Managed): Documented governance with defined roles
• Level 3 (Optimized): Enterprise-wide governance with automation

Where would you place your organization?"
```

### 3. Throughout Interview

```
User can:
  • Answer naturally ("level 3", "managed", "we're optimized", etc.)
  • Click "Progress" to see completion stats
  • Click "Skip" to skip questions
  • Click "Back" to change previous answers
  • Click "Help" for guidance
  • Type "progress", "skip", "back", "help" as commands
```

### 4. Completion

```
After last question answered:

"🎉 Congratulations! You've completed the assessment!

Here's a quick summary:
• Total Questions: 45
• You answered: 43
• Skipped: 2

Your Maturity Distribution:
• Level 1 (Initial): 12 answers
• Level 2 (Managed): 24 answers
• Level 3 (Optimized): 7 answers

Great job! Your responses have been saved. Click 'View Results'
in the dashboard to see your detailed maturity analysis.

Thanks for your time! 🚀"
```

---

## 🎨 UI/UX Features

### Visual Design

- **Color**: Green gradient (distinguishes from purple agent chat)
- **Icon**: ClipboardList (interview/form icon)
- **Theme**: Professional interview aesthetic
- **Layout**: Full-screen modal with chat interface

### User Experience

1. **Welcome Screen**:
   - Explains what to expect
   - Shows features (skip, back, progress)
   - "Start Interview" button

2. **Chat Interface**:
   - Message bubbles (user blue, AI gray)
   - Timestamps
   - Typing indicators
   - Smooth scrolling

3. **Quick Actions**:
   - Always visible above input
   - One-click commands
   - Visual feedback

4. **Input Area**:
   - Large text input
   - Hint text with examples
   - Send button
   - Enter to send

### Accessibility

- Keyboard navigation (Enter to send)
- Clear visual feedback
- Descriptive button labels
- Progress indicators

---

## 🔧 Technical Details

### Answer Parsing with Claude

**System Prompt for Parsing:**

```
You are an assessment interviewer. Parse the user's response to
determine their maturity level.

Current Question: "How mature is your data quality?"
Maturity Levels:
- Level 1 (Initial): Basic, ad-hoc
- Level 2 (Managed): Documented, monitored
- Level 3 (Optimized): Automated, improving

User said: "I think we're at level 2"

Respond in JSON:
{
  "level": 2,
  "confidence": "high",
  "notes": null
}
```

**Claude understands:**

- "Level 2" → level 2
- "Managed" → level 2
- "We're optimized" → level 3
- "Initial" → level 1
- "2" → level 2
- "Three" → level 3

### Database Operations

**Save Answer:**

```typescript
await prisma.assessmentResult.upsert({
  where: {
    sessionId_metricId: {
      sessionId,
      metricId,
    },
  },
  update: {
    value: level,
    notes,
    evidenceUrls: evidence || [],
    assessedAt: new Date(),
  },
  create: {
    sessionId,
    metricId,
    value: level,
    notes,
    evidenceUrls: evidence || [],
  },
});
```

**Update Session Status:**

```typescript
// When completed
await prisma.assessmentSession.update({
  where: { id: sessionId },
  data: {
    status: "COMPLETED",
    completedAt: new Date(),
  },
});
```

---

## 🎯 Key Differences from Other Agents

| Feature          | Coach Agent       | Analyst Agent     | **Interviewer Agent**      |
| ---------------- | ----------------- | ----------------- | -------------------------- |
| **Purpose**      | Explain metrics   | Analyze scores    | **Conduct assessment**     |
| **When Used**    | During assessment | After completion  | **Instead of manual form** |
| **Interaction**  | Q&A about metrics | Analysis requests | **Structured interview**   |
| **Data Flow**    | Read-only         | Read + calculate  | **Write (creates data)**   |
| **Button Color** | Purple gradient   | (same)            | **Green gradient**         |
| **Icon**         | Bot               | (same)            | **ClipboardList**          |
| **Output**       | Explanations      | Insights          | **Assessment results**     |

---

## 💡 Use Cases

### When to Use Interviewer Agent:

1. ✅ **New assessments** - Starting from scratch
2. ✅ **Remote interviews** - Interviewer not present
3. ✅ **Guided assessments** - Users need structure
4. ✅ **Conversational preference** - Users prefer talking over forms
5. ✅ **Consistency** - Ensure all questions asked

### When to Use Traditional Form:

1. ✅ **Quick updates** - Just changing few metrics
2. ✅ **Expert users** - Know exactly what they're doing
3. ✅ **Batch entry** - Copy/paste from documents
4. ✅ **Visual comparison** - See all metrics at once

### When to Use Coach/Analyst Agents:

1. ✅ **Help with specific metric** - "What does this mean?"
2. ✅ **Analysis of results** - "How did I do?"
3. ✅ **Recommendations** - "What should I improve?"

---

## 🧪 Testing

### Test the Interviewer:

1. **Start Dev Server:**

   ```bash
   npm run dev
   ```

2. **Open Assessment:**

   ```
   http://localhost:3000/assessments
   Click any assessment
   ```

3. **Start Interview:**
   - Click green "AI Interview" button
   - Click "Start Interview"
   - Watch Claude generate welcome

4. **Test Responses:**

   ```
   Try these:
   - "level 2"
   - "We're managed"
   - "I'd say level 3"
   - "Initial level"
   - "2"
   - "optimized"
   ```

5. **Test Commands:**

   ```
   - Click "Progress"
   - Click "Skip"
   - Click "Back"
   - Click "Help"
   - Type "progress"
   ```

6. **Complete Interview:**
   - Answer all questions
   - See completion message
   - Check database for results

---

## 🔒 Data Storage

### Database Tables Used:

**assessment_results:**

```sql
id          | uuid
sessionId   | uuid (FK to assessment_sessions)
metricId    | uuid (FK to metrics)
value       | decimal (1.0, 2.0, or 3.0)
notes       | text (optional)
evidenceUrls| text[] (optional)
assessedAt  | timestamp
```

**assessment_sessions:**

```sql
status      | enum (DRAFT → IN_PROGRESS → COMPLETED)
completedAt | timestamp (set when last question answered)
```

---

## 🎨 Conversation Examples

### Example 1: Clear Answer

```
AI: "How would you rate your data quality?"
User: "Level 2"
AI: "Excellent! Level 2 (Managed) shows documented standards.
     Next question..."
```

### Example 2: Natural Language

```
AI: "What maturity level for security?"
User: "We're pretty optimized, have automation"
AI: "Perfect! Level 3 (Optimized) with automation - great work!
     Next question..."
```

### Example 3: Unclear Response

```
AI: "How mature is your architecture?"
User: "It's okay I guess"
AI: "I want to make sure I understand correctly. Which level
     best describes your architecture?

     • Level 1 (Initial): Basic, ad-hoc
     • Level 2 (Managed): Documented, monitored
     • Level 3 (Optimized): Automated, improving

     You can say something like 'level 2' or 'managed' 😊"
```

### Example 4: Using Commands

```
User: "progress"
AI: "📊 Assessment Progress

     Overall: 12/45 questions (26% complete)
     Current: Question 13

     By Level:
     • Level 1: 3 answers
     • Level 2: 7 answers
     • Level 3: 2 answers

     Keep going! 🚀"
```

---

## 🚀 Future Enhancements

### Planned Features:

1. **Voice Input** - Speak answers instead of typing
2. **Multi-language** - Conduct interviews in any language
3. **Follow-up Questions** - Ask "why" for deeper insights
4. **Evidence Collection** - "Can you provide an example?"
5. **Real-time Scoring** - Show score as you go
6. **Interview Resume** - Pause and continue later
7. **Interview Templates** - Different styles (quick, detailed, etc.)
8. **Interview Analytics** - Track completion rates, time per question

---

## 💰 Cost Estimate

### Per Interview:

- **Questions**: ~45
- **Tokens per Q&A**: ~500 (question + answer parsing + follow-up)
- **Total tokens**: ~22,500
- **Cost**: ~$0.10 per complete interview

### Volume Pricing:

- **10 interviews**: ~$1.00
- **100 interviews**: ~$10.00
- **1,000 interviews**: ~$100.00

**Much cheaper than human interviewer time!**

---

## 🎉 Summary

### What Was Built:

✅ **Separate interviewer agent** - Completely independent from Coach/Analyst
✅ **LLM-powered conversations** - Natural language understanding
✅ **Automated answer parsing** - Extracts maturity levels from responses
✅ **Beautiful interview UI** - Green-themed, chat-style interface
✅ **Progress tracking** - Shows completion status
✅ **Navigation** - Skip, back, help commands
✅ **Database integration** - Saves directly to assessment_results
✅ **No breaking changes** - All existing features still work

### Key Benefits:

🎯 **Conversational** - Feels like talking to a person
🎯 **Flexible** - Answer however you want
🎯 **Guided** - AI leads you through assessment
🎯 **Efficient** - Faster than manual form filling
🎯 **Accurate** - Claude ensures responses properly recorded
🎯 **Professional** - Polished interview experience

---

## 🚀 How to Access AI Interview

### Option 1: From Dashboard

1. Go to Dashboard (`/dashboard`)
2. Click the **"AI Interview"** button (purple gradient, bot icon)
3. Select an assessment from the list
4. Start the interactive interview

### Option 2: Direct Link

1. Navigate to `/ai-interview`
2. Choose an assessment
3. Begin the AI-guided interview

### What You'll See:

1. **Assessment Selection Page**
   - Shows all available assessments
   - Displays assessment status and progress
   - Beautiful card-based layout with gradient effects

2. **Interview Interface**
   - Full-screen chat interface
   - AI interviewer guides you through questions
   - Natural conversation flow
   - Progress indicators
   - Easy navigation

### Interview Flow:

```
Step 1: Select Assessment
   ↓
Step 2: AI Starts Interview
   ↓
Step 3: Answer Questions Naturally
   ↓
Step 4: Complete Assessment
   ↓
Step 5: Return to Selection (or Dashboard)
```

---

**Ready to conduct your first AI-powered assessment interview?**

Click the **"AI Interview"** button from your dashboard! 🚀
