# 🧪 Testing Guide - Two-Agent MCP System

## Quick Test Steps

### 1. Start the Application

```bash
npm run dev
```

Visit: http://localhost:3000

### 2. Navigate to Assessments

Click on "Assessments" or go to: http://localhost:3000/assessments

### 3. Open Any Assessment

Click on any assessment card to enter the wizard

### 4. Find the "Talk to Agent" Button

**Location:** Top-right corner of the wizard header
**Look for:** Purple/blue gradient button with Bot icon 🤖

### 5. Click "Talk to Agent"

A full-screen modal should appear with:

- Purple gradient header
- "AI Assessment Coach" title
- 3 quick action buttons
- Welcome message from the agent
- Chat input area

---

## Test Scenarios

### Scenario 1: Progress Check ✅

1. Click "My Progress" quick action (or type manually)
2. **Expected:** Agent shows:
   - Total questions answered
   - Breakdown by pillar
   - Encouraging message

**Sample Query:**

```
"What is my current progress?"
```

**Expected Response:**

```
📈 Your Progress

Total Questions Answered: 45

By Pillar:
• Security: 12 metric(s)
• Reliability: 15 metric(s)
• Performance: 18 metric(s)

Keep going! You're making great progress! 🚀
```

---

### Scenario 2: Full Analysis 📊

1. Click "Analyze" quick action
2. **Expected:** Agent shows:
   - Overall maturity score
   - Strengths (high-scoring pillars)
   - Weaknesses (low-scoring pillars)
   - Top 3 recommendations

**Sample Query:**

```
"Analyze my assessment and show me insights"
```

**Expected Response:**

```
📊 Assessment Analysis

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

---

### Scenario 3: Get Recommendations 💡

1. Click "Recommendations" quick action
2. **Expected:** Agent shows:
   - Overall score
   - Priority action items
   - Specific improvements for each topic

**Sample Query:**

```
"Give me improvement recommendations"
```

**Expected Response:**

```
💡 Improvement Plan

Overall Score: 2.3/3.0

Priority Actions:
1. Cost Management (Priority: high)
   Current Level: 1.8
   • Document current state and processes
   • Identify automation opportunities
   • Create measurement baselines

2. Monitoring (Priority: medium)
   Current Level: 2.1
   • Implement monitoring and alerting
   • Standardize procedures across teams
   • Begin automation rollout
```

---

### Scenario 4: Context-Aware Help 🎯

1. Type: "What's my progress?"
2. **Expected:** Shows your current completion status

3. Type: "What are my weak areas?"
4. **Expected:** Shows pillars below threshold

---

## Verify Existing Functionality

### AI Help Buttons Still Work ✅

1. Find any metric in the wizard
2. Look for the blue/purple gradient "AI Help" button on each metric card
3. Click it
4. **Expected:** AssessmentChat modal opens (Claude/Bedrock chat)
5. Ask: "What does this metric measure?"
6. **Expected:** Get Claude's response about that specific metric

**Important:** Both systems should work independently!

- "AI Help" = Metric-specific Bedrock/Claude chat
- "Talk to Agent" = General assessment Coach/Analyst agents

---

## Visual Checks

### Talk to Agent Button

- [ ] Purple/blue/indigo gradient background
- [ ] Bot icon visible
- [ ] "Talk to Agent" text (desktop)
- [ ] Icon only (mobile)
- [ ] Located top-right of wizard header

### Agent Chat Modal

- [ ] Full-screen overlay
- [ ] Gradient header (purple → blue → indigo)
- [ ] "AI Assessment Coach" title
- [ ] "Powered by 2-Agent MCP System" subtitle
- [ ] 3 quick action buttons below header
- [ ] Welcome message visible
- [ ] Chat messages in bubble style
- [ ] User messages: blue gradient (right-aligned)
- [ ] Agent messages: gray (left-aligned)
- [ ] Avatar icons for user/agent
- [ ] Timestamps on messages
- [ ] Multi-line textarea input
- [ ] Send button (gradient)
- [ ] X button to close (top-right)

---

## Error Handling

### Test Error Scenarios

1. **Type gibberish**
   - Type: "asdfasdf"
   - **Expected:** Agent tries to interpret or asks for clarification

2. **Empty message**
   - Try to send empty message
   - **Expected:** Send button disabled

3. **Network error simulation**
   - Disconnect internet briefly
   - Send message
   - **Expected:** Error message displayed in chat

---

## Performance Checks

### Response Times

- [ ] Quick actions respond in < 500ms
- [ ] Progress query responds in < 1s
- [ ] Analysis query responds in < 2s
- [ ] Full insights respond in < 3s

### Loading States

- [ ] "Agent is thinking..." shows while processing
- [ ] Spinner animates properly
- [ ] No UI freezing

---

## Browser Console Checks

### No Errors

Open browser DevTools (F12) → Console tab

- [ ] No red errors when opening agent chat
- [ ] No errors when sending messages
- [ ] No errors when clicking quick actions
- [ ] No errors when closing modal

### Network Tab

Check API calls:

- [ ] POST to `/api/agents/chat` succeeds (status 200)
- [ ] Response contains `success: true`
- [ ] Response has `response` field with agent message

---

## Database Checks (Optional)

If you want to verify data persistence:

1. Check `BedrockMessage` table for agent conversations
2. Check `BedrockRecommendation` table for generated suggestions

---

## Compatibility Checks

### Desktop Browsers

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari

### Mobile/Responsive

- [ ] Button shows icon only on small screens
- [ ] Modal is responsive
- [ ] Chat messages wrap properly
- [ ] Input area accessible

---

## Integration Checks

### With Existing Features

- [ ] Assessment saving still works
- [ ] Step navigation works
- [ ] Progress bar updates correctly
- [ ] Auto-save triggers properly
- [ ] Complete assessment button works
- [ ] Existing AI Help buttons work

---

## Common Issues & Solutions

### Issue: Button not visible

**Solution:** Check import in AssessmentWizard.tsx, verify Bot icon import from lucide-react

### Issue: Modal doesn't open

**Solution:** Check state management, verify `showAgentChat` state

### Issue: Agent not responding

**Solution:** Check `/api/agents/chat` endpoint, verify database connection

### Issue: "Cannot find module" error

**Solution:** Check import paths in `route.ts`, should use `@/../../mcp-servers/`

### Issue: TypeScript errors

**Solution:** Check all nullable fields have proper guards (`if (!context.metric)`)

---

## Success Criteria

✅ **Pass:** All test scenarios work as expected
✅ **Pass:** No console errors
✅ **Pass:** Existing features unaffected
✅ **Pass:** UI looks good on desktop & mobile
✅ **Pass:** Response times acceptable
✅ **Pass:** Error handling graceful

---

## Next Steps After Testing

1. **Gather Feedback**
   - Ask users what questions they ask
   - Note common patterns
   - Identify missing features

2. **Iterate**
   - Improve agent responses based on feedback
   - Add more quick actions
   - Enhance formatting

3. **Monitor**
   - Track usage metrics
   - Monitor error rates
   - Optimize performance

---

## Need Help?

Check these files:

- `/mcp-servers/README.md` - Agent system documentation
- `AGENT_IMPLEMENTATION_COMPLETE.md` - Implementation overview
- Browser DevTools Console - For runtime errors

---

**Happy Testing! 🚀**
