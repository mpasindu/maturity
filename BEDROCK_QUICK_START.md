# 🚀 Quick Start - AWS Bedrock Chat

## ⚡ 3-Step Setup

### 1. Get AWS Credentials (Permanent Recommended)

**AWS Console → IAM → Users → Create User**

1. Username: `maturity-bedrock-user`
2. Attach policy: `AmazonBedrockFullAccess`
3. Create Access Keys
4. Copy credentials

### 2. Update `.env.local`

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...  # Your new permanent key
AWS_SECRET_ACCESS_KEY=...
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

### 3. Request Model Access

[AWS Bedrock Console](https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess) → **Claude 3.5 Sonnet v2** → Request

---

## ✅ Test It

```bash
# Test Bedrock access
node test-bedrock-access.js

# Start app
npm run dev

# Open: http://localhost:3000
# Go to Assessments → Click any assessment → Click "AI Help" on any metric
```

---

## 🎯 Usage

1. Navigate to assessment wizard
2. Click **"AI Help"** button on metric
3. Ask questions:
   - "What does this metric measure?"
   - "What score should we give?"
   - "How do we improve to Level 4?"

---

## 🐛 Common Issues

| Error           | Solution                             |
| --------------- | ------------------------------------ |
| Token expired   | Get new credentials                  |
| Model not found | Request Bedrock access               |
| Access denied   | Add `bedrock:InvokeModel` permission |

---

## 📁 Key Files

- **Chat Service**: `/src/lib/bedrock-simple-chat.ts`
- **API Route**: `/src/app/api/chat/route.ts`
- **UI Component**: `/src/components/AssessmentChat.tsx`
- **Integration**: `/src/components/AssessmentWizard.tsx`

---

## 💰 Cost

~$0.008 per conversation = **$0.80/100 conversations**

---

**Full documentation**: See `BEDROCK_CHAT_COMPLETE.md`
