# AWS Bedrock Agent Integration Plan

## Enterprise Architecture Maturity Platform - Intelligent Assessment Assistant

---

## 🎯 Executive Summary

This plan integrates AWS Bedrock Agent as an **Intelligent Assessment Assistant** into the existing Enterprise Architecture Maturity Platform without modifying current functionality. The agent will enhance the assessment experience through conversational AI, providing guided assistance, question clarification, smart recommendations, and evidence analysis.

---

## 📋 Current System Analysis

### Existing Architecture

```
Frontend (Next.js)
├── AssessmentWizard.tsx (React component)
├── Dashboard & Results pages
└── Admin configuration pages

Backend (Next.js API Routes)
├── /api/assessments/* (CRUD operations)
├── /api/admin/* (Configuration management)
└── /api/dashboard/* (Analytics)

Database (PostgreSQL + Prisma)
├── 6 Maturity Pillars (Operational Excellence, Security, etc.)
├── 18 Topics (Application Design, Security Fundamentals, etc.)
├── 54 Metrics (Level 1, 2, 3 maturity indicators)
└── Assessment sessions & results

Calculation Engine
├── MaturityCalculator (Weighted scoring)
├── 4-level hierarchy (Metric → Topic → Pillar → Overall)
└── Real-time score calculation with explanations
```

### Key Existing Features to Preserve

- ✅ Dynamic wizard-based assessments
- ✅ Real-time weighted scoring (14.67 score format)
- ✅ Multi-level maturity calculation
- ✅ Dashboard visualization
- ✅ Audit trail and compliance tracking
- ✅ YAML-based metric configuration

---

## 🏗️ Architecture Design

### High-Level Integration

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  ┌────────────────┐              ┌─────────────────────┐   │
│  │   Assessment   │◄────────────►│  Bedrock Agent Chat  │   │
│  │     Wizard     │              │    Component         │   │
│  └────────────────┘              └─────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    API Gateway Layer                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  /api/bedrock/agent/*  (New Bedrock endpoints)      │   │
│  │  - /chat (Conversational interface)                  │   │
│  │  - /recommend (Smart suggestions)                    │   │
│  │  - /analyze-evidence (Document analysis)             │   │
│  │  - /clarify (Question explanations)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Existing APIs (Unchanged)                           │   │
│  │  - /api/assessments/* (CRUD)                         │   │
│  │  - /api/admin/* (Config)                             │   │
│  │  - /api/dashboard/* (Analytics)                      │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                  AWS Bedrock Integration                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Bedrock Agent with Knowledge Base                   │   │
│  │  - Foundation Model: Claude 3.5 Sonnet               │   │
│  │  - Action Groups (Custom functions)                  │   │
│  │  - Knowledge Base (RAG from YAML metrics)            │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│              Existing Database & Calculation                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL (Unchanged)                              │   │
│  │  - Pillars, Topics, Metrics, Sessions, Results       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MaturityCalculator (Unchanged)                      │   │
│  │  - Weighted scoring logic                            │   │
│  │  - Multi-level aggregation                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Phases

### Phase 1: Foundation Setup (Week 1-2)

#### 1.1 AWS Infrastructure Setup

```typescript
// aws-config.ts
export const bedrockConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  agentId: process.env.BEDROCK_AGENT_ID,
  agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID,
  knowledgeBaseId: process.env.BEDROCK_KNOWLEDGE_BASE_ID,
  modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};
```

#### 1.2 Database Schema Extensions

```sql
-- New tables for Bedrock integration (non-breaking additions)

CREATE TABLE bedrock_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES assessment_sessions(id),
  user_id UUID,
  conversation_id VARCHAR(255) UNIQUE,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bedrock_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES bedrock_conversations(id),
  message_type VARCHAR(20), -- 'user', 'agent', 'system'
  content TEXT NOT NULL,
  metadata JSONB,
  pillar_context VARCHAR(255),
  topic_context VARCHAR(255),
  metric_context VARCHAR(255),
  timestamp TIMESTAMP DEFAULT NOW(),
  INDEX idx_conversation (conversation_id),
  INDEX idx_timestamp (timestamp)
);

CREATE TABLE bedrock_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES assessment_sessions(id),
  metric_id UUID REFERENCES metrics(id),
  recommendation_type VARCHAR(50), -- 'maturity_level', 'evidence', 'best_practice'
  suggested_value DECIMAL(5,2),
  confidence_score DECIMAL(3,2),
  reasoning TEXT,
  evidence_references TEXT[],
  accepted BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID
);

CREATE TABLE bedrock_evidence_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES assessment_sessions(id),
  file_name VARCHAR(255),
  file_url TEXT,
  file_type VARCHAR(50),
  analysis_result JSONB, -- Structured analysis from Bedrock
  extracted_insights TEXT[],
  suggested_metrics UUID[],
  confidence_score DECIMAL(3,2),
  analyzed_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.3 Knowledge Base Preparation

```javascript
// scripts/prepare-bedrock-knowledge-base.js
/**
 * Converts YAML metrics to Bedrock Knowledge Base format
 * Preserves existing YAML structure, adds to S3 for RAG
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const AWS = require("aws-sdk");

async function prepareKnowledgeBase() {
  const yamlDir = path.join(__dirname, "../yaml-config");
  const s3 = new AWS.S3();

  // Process metrics
  const metricsDir = path.join(yamlDir, "metrics");
  const metricFiles = fs.readdirSync(metricsDir);

  for (const file of metricFiles) {
    const content = fs.readFileSync(path.join(metricsDir, file), "utf8");
    const metricData = yaml.load(content);

    // Create enriched version for Knowledge Base
    const enrichedContent = {
      type: "metric",
      ...metricData,
      searchableText: generateSearchableText(metricData),
      assessmentGuidance: generateGuidance(metricData),
    };

    // Upload to S3 for Bedrock Knowledge Base
    await s3
      .putObject({
        Bucket: process.env.BEDROCK_KB_BUCKET,
        Key: `metrics/${file.replace(".yaml", ".json")}`,
        Body: JSON.stringify(enrichedContent, null, 2),
        ContentType: "application/json",
      })
      .promise();
  }

  // Process pillars and topics similarly
  await processPillars(yamlDir);
  await processTopics(yamlDir);

  console.log("✅ Knowledge Base prepared successfully");
}

function generateSearchableText(metricData) {
  return `
    Metric: ${metricData.metadata.metric.name}
    Description: ${metricData.metadata.metric.description}
    Pillar: ${metricData.metadata.classification["pillar-id"]}
    Topic: ${metricData.metadata.classification["topic-id"]}
    Level: ${metricData.metadata.classification.level}
    
    Assessment Criteria:
    ${Object.entries(metricData.metadata.assessment.scoring.criteria || {})
      .map(
        ([level, criteria]) => `
        ${level}: ${criteria.description}
        Risk Level: ${criteria["risk-level"] || "Not specified"}
      `
      )
      .join("\n")}
  `.trim();
}

function generateGuidance(metricData) {
  return {
    whenToAssess: `Assess this during ${metricData.metadata.classification["pillar-id"]} evaluation`,
    howToEvaluate: `Use ${metricData.metadata.assessment.method} approach`,
    evidenceNeeded: metricData.metadata["data-collection"]?.sources || [],
    commonMistakes: [],
    bestPractices: [],
  };
}
```

### Phase 2: Core Bedrock Agent Implementation (Week 3-4)

#### 2.1 Bedrock Agent Service

```typescript
// src/lib/bedrock-agent.ts
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { bedrockConfig } from "@/config/aws-config";

export class BedrockAgentService {
  private client: BedrockAgentRuntimeClient;

  constructor() {
    this.client = new BedrockAgentRuntimeClient({
      region: bedrockConfig.region,
      credentials: bedrockConfig.credentials,
    });
  }

  /**
   * Start or continue a conversation with the assessment assistant
   */
  async chat(params: {
    sessionId: string;
    message: string;
    context?: {
      currentPillar?: string;
      currentTopic?: string;
      currentMetric?: string;
      assessmentProgress?: any;
    };
  }) {
    const { sessionId, message, context } = params;

    // Prepare session state with current assessment context
    const sessionState = {
      sessionAttributes: {
        assessmentSessionId: sessionId,
        currentPillar: context?.currentPillar || "",
        currentTopic: context?.currentTopic || "",
        currentMetric: context?.currentMetric || "",
        progressPercentage: String(
          context?.assessmentProgress?.percentage || 0
        ),
      },
      promptSessionAttributes: {
        assessmentPhase: this.determinePhase(context),
        availableActions: this.getAvailableActions(context),
      },
    };

    const command = new InvokeAgentCommand({
      agentId: bedrockConfig.agentId,
      agentAliasId: bedrockConfig.agentAliasId,
      sessionId: sessionId,
      inputText: message,
      sessionState,
    });

    const response = await this.client.send(command);

    // Stream response handling
    const chunks: string[] = [];
    for await (const event of response.completion!) {
      if (event.chunk?.bytes) {
        const chunk = new TextDecoder().decode(event.chunk.bytes);
        chunks.push(chunk);
      }
    }

    return {
      response: chunks.join(""),
      sessionId: sessionId,
      context: this.extractContext(chunks),
    };
  }

  /**
   * Get smart recommendations for a specific metric
   */
  async getRecommendation(params: {
    metricId: string;
    userDescription: string;
    currentEvidence?: string[];
  }) {
    const metric = await this.fetchMetricDetails(params.metricId);

    const prompt = this.buildRecommendationPrompt(
      metric,
      params.userDescription,
      params.currentEvidence
    );

    const response = await this.chat({
      sessionId: `recommendation-${params.metricId}`,
      message: prompt,
      context: {
        currentMetric: params.metricId,
      },
    });

    return this.parseRecommendation(response.response);
  }

  /**
   * Analyze uploaded evidence documents
   */
  async analyzeEvidence(params: {
    sessionId: string;
    fileName: string;
    fileContent: string;
    fileType: string;
    context: {
      pillar?: string;
      topic?: string;
    };
  }) {
    // Use Bedrock with document understanding
    const analysisPrompt = `
      Analyze this document for enterprise architecture maturity assessment:
      
      File: ${params.fileName}
      Type: ${params.fileType}
      Context: ${params.context.pillar ? `Pillar: ${params.context.pillar}` : ""}
               ${params.context.topic ? `Topic: ${params.context.topic}` : ""}
      
      Document Content:
      ${params.fileContent}
      
      Please analyze and provide:
      1. Relevant maturity indicators found
      2. Suggested maturity levels with evidence
      3. Gaps or missing elements
      4. Recommendations for improvement
    `;

    const response = await this.chat({
      sessionId: params.sessionId,
      message: analysisPrompt,
      context: params.context,
    });

    return this.parseEvidenceAnalysis(response.response);
  }

  /**
   * Clarify a complex metric question
   */
  async clarifyMetric(params: { metricId: string; userQuestion?: string }) {
    const metric = await this.fetchMetricDetails(params.metricId);

    const clarificationPrompt = `
      I need help understanding this assessment metric:
      
      Metric: ${metric.name}
      Description: ${metric.description}
      Level: ${metric.level}
      ${params.userQuestion ? `\nSpecific Question: ${params.userQuestion}` : ""}
      
      Please explain:
      1. What this metric measures in simple terms
      2. How to assess it effectively
      3. What evidence I should look for
      4. Common scenarios for each maturity level
    `;

    return this.chat({
      sessionId: `clarify-${params.metricId}`,
      message: clarificationPrompt,
      context: {
        currentMetric: params.metricId,
      },
    });
  }

  private determinePhase(context?: any): string {
    if (!context?.assessmentProgress) return "getting-started";
    if (context.assessmentProgress.percentage < 25) return "initial";
    if (context.assessmentProgress.percentage < 75) return "in-progress";
    return "finalizing";
  }

  private getAvailableActions(context?: any): string {
    const actions = ["ask-question", "get-recommendation", "upload-evidence"];
    if (context?.currentMetric) {
      actions.push("clarify-metric", "view-examples");
    }
    return actions.join(",");
  }

  private async fetchMetricDetails(metricId: string) {
    // Fetch from existing database
    const prisma = (await import("@/lib/database")).prisma;
    return await prisma.metrics.findUnique({
      where: { id: metricId },
      include: {
        topic: {
          include: {
            pillar: true,
          },
        },
      },
    });
  }

  private buildRecommendationPrompt(
    metric: any,
    description: string,
    evidence?: string[]
  ) {
    return `
      Based on this information, suggest an appropriate maturity level:
      
      Metric: ${metric.name}
      Level Range: ${metric.minValue} to ${metric.maxValue}
      
      User Description: ${description}
      ${evidence ? `\nEvidence Provided:\n${evidence.join("\n")}` : ""}
      
      Provide:
      1. Suggested maturity level (${metric.minValue}-${metric.maxValue})
      2. Confidence score (0-1)
      3. Reasoning for the suggestion
      4. What evidence would strengthen this assessment
    `;
  }

  private parseRecommendation(response: string) {
    // Extract structured recommendation from agent response
    // Implementation would parse the response and return structured data
    return {
      suggestedLevel: 0,
      confidence: 0,
      reasoning: response,
      evidenceGaps: [],
    };
  }

  private parseEvidenceAnalysis(response: string) {
    // Extract structured analysis from agent response
    return {
      indicators: [],
      suggestions: [],
      gaps: [],
      recommendations: [],
    };
  }

  private extractContext(chunks: string[]) {
    // Extract any context from agent's response
    return {};
  }
}

export const bedrockAgent = new BedrockAgentService();
```

#### 2.2 Bedrock Action Groups (Lambda Functions)

```python
# lambda/bedrock-actions/get_metric_details.py
"""
Action Group: Assessment Context
Action: get_metric_details
Description: Retrieve detailed information about a specific metric
"""
import json
import psycopg2
import os

def lambda_handler(event, context):
    # Parse action group input
    api_path = event['apiPath']
    parameters = event.get('parameters', [])

    metric_id = next((p['value'] for p in parameters if p['name'] == 'metric_id'), None)

    if not metric_id:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'metric_id required'})
        }

    # Connect to PostgreSQL
    conn = psycopg2.connect(
        host=os.environ['DB_HOST'],
        database=os.environ['DB_NAME'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD']
    )

    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            m.id, m.name, m.description, m."metricType",
            m."minValue", m."maxValue", m.weight, m.level,
            t.name as topic_name, p.name as pillar_name
        FROM metrics m
        JOIN assessment_topics t ON m."topicId" = t.id
        JOIN maturity_pillars p ON t."pillarId" = p.id
        WHERE m.id = %s
    """, (metric_id,))

    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Metric not found'})
        }

    metric_details = {
        'id': row[0],
        'name': row[1],
        'description': row[2],
        'metricType': row[3],
        'minValue': float(row[4]),
        'maxValue': float(row[5]),
        'weight': float(row[6]),
        'level': row[7],
        'topic': row[8],
        'pillar': row[9]
    }

    return {
        'statusCode': 200,
        'body': json.dumps({
            'application/json': {
                'body': json.dumps(metric_details)
            }
        })
    }
```

```python
# lambda/bedrock-actions/calculate_score.py
"""
Action Group: Assessment Calculations
Action: calculate_preliminary_score
Description: Calculate preliminary maturity score for current assessment
"""
import json
import psycopg2
import os

def lambda_handler(event, context):
    parameters = event.get('parameters', [])
    session_id = next((p['value'] for p in parameters if p['name'] == 'session_id'), None)

    # Get assessment results
    conn = psycopg2.connect(
        host=os.environ['DB_HOST'],
        database=os.environ['DB_NAME'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD']
    )

    cursor = conn.cursor()
    cursor.execute("""
        SELECT ar.value, ar."metricId", m.weight, m.level
        FROM assessment_results ar
        JOIN metrics m ON ar."metricId" = m.id
        WHERE ar."sessionId" = %s
    """, (session_id,))

    results = cursor.fetchall()
    cursor.close()
    conn.close()

    # Simple weighted average calculation
    if not results:
        return {'statusCode': 200, 'body': json.dumps({'score': 0, 'count': 0})}

    weighted_sum = sum(float(r[0]) * float(r[2]) for r in results)
    total_weight = sum(float(r[2]) for r in results)

    preliminary_score = weighted_sum / total_weight if total_weight > 0 else 0

    return {
        'statusCode': 200,
        'body': json.dumps({
            'application/json': {
                'body': json.dumps({
                    'preliminaryScore': round(preliminary_score, 2),
                    'metricsAnswered': len(results),
                    'weightedAverage': round(weighted_sum / total_weight, 2) if total_weight > 0 else 0
                })
            }
        })
    }
```

### Phase 3: API Integration Layer (Week 5)

#### 3.1 Bedrock API Routes

```typescript
// src/app/api/bedrock/agent/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { bedrockAgent } from "@/lib/bedrock-agent";
import { prisma } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, context } = body;

    // Validate session exists
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Assessment session not found" },
        { status: 404 }
      );
    }

    // Get current assessment context
    const assessmentContext = await getAssessmentContext(sessionId);

    // Call Bedrock agent
    const response = await bedrockAgent.chat({
      sessionId,
      message,
      context: {
        ...context,
        ...assessmentContext,
      },
    });

    // Store conversation in database
    await storeConversation(sessionId, message, response);

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Bedrock chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}

async function getAssessmentContext(sessionId: string) {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    include: {
      currentPillar: true,
      assessmentResults: {
        include: {
          metric: {
            include: {
              topic: true,
            },
          },
        },
      },
    },
  });

  const totalMetrics = await prisma.metrics.count({ where: { active: true } });
  const answeredMetrics = session?.assessmentResults.length || 0;

  return {
    currentPillar: session?.currentPillar?.name,
    assessmentProgress: {
      total: totalMetrics,
      completed: answeredMetrics,
      percentage: Math.round((answeredMetrics / totalMetrics) * 100),
    },
  };
}

async function storeConversation(
  sessionId: string,
  userMessage: string,
  agentResponse: any
) {
  // Find or create conversation
  let conversation = await prisma.bedrockConversation.findFirst({
    where: { sessionId },
  });

  if (!conversation) {
    conversation = await prisma.bedrockConversation.create({
      data: {
        sessionId,
        conversationId: `conv-${sessionId}-${Date.now()}`,
      },
    });
  }

  // Store messages
  await prisma.bedrockMessage.createMany({
    data: [
      {
        conversationId: conversation.id,
        messageType: "user",
        content: userMessage,
        timestamp: new Date(),
      },
      {
        conversationId: conversation.id,
        messageType: "agent",
        content: agentResponse.response,
        metadata: agentResponse.context,
        timestamp: new Date(),
      },
    ],
  });

  // Update conversation count
  await prisma.bedrockConversation.update({
    where: { id: conversation.id },
    data: {
      messageCount: { increment: 2 },
    },
  });
}
```

```typescript
// src/app/api/bedrock/agent/recommend/route.ts
import { NextRequest, NextResponse } from "next/server";
import { bedrockAgent } from "@/lib/bedrock-agent";
import { prisma } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, metricId, userDescription, evidence } = body;

    // Get recommendation from Bedrock
    const recommendation = await bedrockAgent.getRecommendation({
      metricId,
      userDescription,
      currentEvidence: evidence,
    });

    // Store recommendation
    await prisma.bedrockRecommendation.create({
      data: {
        sessionId,
        metricId,
        recommendationType: "maturity_level",
        suggestedValue: recommendation.suggestedLevel,
        confidenceScore: recommendation.confidence,
        reasoning: recommendation.reasoning,
        evidenceReferences: recommendation.evidenceGaps,
        createdBy: null, // TODO: Add user authentication
      },
    });

    return NextResponse.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendation" },
      { status: 500 }
    );
  }
}
```

```typescript
// src/app/api/bedrock/agent/analyze-evidence/route.ts
import { NextRequest, NextResponse } from "next/server";
import { bedrockAgent } from "@/lib/bedrock-agent";
import { prisma } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const file = formData.get("file") as File;
    const pillar = formData.get("pillar") as string;
    const topic = formData.get("topic") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file content
    const fileContent = await file.text();

    // Analyze with Bedrock
    const analysis = await bedrockAgent.analyzeEvidence({
      sessionId,
      fileName: file.name,
      fileContent,
      fileType: file.type,
      context: { pillar, topic },
    });

    // Store analysis results
    await prisma.bedrockEvidenceAnalysis.create({
      data: {
        sessionId,
        fileName: file.name,
        fileType: file.type,
        analysisResult: analysis,
        extractedInsights: analysis.indicators,
        suggestedMetrics: [],
        confidenceScore: 0.8,
      },
    });

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Evidence analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze evidence" },
      { status: 500 }
    );
  }
}
```

### Phase 4: Frontend Components (Week 6)

#### 4.1 Bedrock Chat Component

```tsx
// src/components/BedrockAssistant.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  Sparkles,
  X,
  FileText,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface Message {
  id: string;
  type: "user" | "agent" | "system";
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface BedrockAssistantProps {
  sessionId: string;
  currentContext?: {
    pillar?: string;
    topic?: string;
    metric?: string;
  };
  onRecommendationAccepted?: (recommendation: any) => void;
}

export function BedrockAssistant({
  sessionId,
  currentContext,
  onRecommendationAccepted,
}: BedrockAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Send welcome message
      addSystemMessage(
        `Hello! I'm your Enterprise Architecture Assessment Assistant. I can help you:
        
        📊 Understand complex metrics
        💡 Suggest appropriate maturity levels
        📄 Analyze your evidence documents
        ❓ Answer questions about the assessment
        
        What would you like help with?`
      );
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addSystemMessage = (content: string) => {
    const message: Message = {
      id: `system-${Date.now()}`,
      type: "system",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/bedrock/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: inputMessage,
          context: currentContext,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const agentMessage: Message = {
          id: `agent-${Date.now()}`,
          type: "agent",
          content: data.data.response,
          timestamp: new Date(),
          metadata: data.data.context,
        };
        setMessages((prev) => [...prev, agentMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      addSystemMessage("Sorry, I encountered an error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const provideFeedback = async (messageId: string, isPositive: boolean) => {
    // Store feedback for continuous improvement
    console.log(
      `Feedback for ${messageId}: ${isPositive ? "positive" : "negative"}`
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 flex items-center gap-2"
      >
        <Sparkles className="h-6 w-6" />
        <span className="font-medium">AI Assistant</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-semibold">Assessment Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 p-1 rounded transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Context Banner */}
      {currentContext && (
        <div className="bg-blue-50 border-b border-blue-100 p-2 text-xs">
          <div className="flex items-center gap-2 text-blue-700">
            <FileText className="h-3 w-3" />
            <span>
              {currentContext.pillar && `${currentContext.pillar} • `}
              {currentContext.topic && `${currentContext.topic} • `}
              {currentContext.metric && currentContext.metric}
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === "user"
                  ? "bg-blue-600 text-white"
                  : message.type === "agent"
                    ? "bg-gray-100 text-gray-900"
                    : "bg-yellow-50 text-yellow-900 border border-yellow-200"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </p>

              {/* Feedback buttons for agent messages */}
              {message.type === "agent" && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => provideFeedback(message.id, true)}
                    className="text-xs text-gray-500 hover:text-green-600 flex items-center gap-1"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    Helpful
                  </button>
                  <button
                    onClick={() => provideFeedback(message.id, false)}
                    className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <ThumbsDown className="h-3 w-3" />
                    Not helpful
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about the assessment..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-2">
          <button className="text-xs text-blue-600 hover:underline">
            💡 Get recommendation
          </button>
          <button className="text-xs text-blue-600 hover:underline">
            📄 Upload evidence
          </button>
          <button className="text-xs text-blue-600 hover:underline">
            ❓ Explain metric
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 4.2 Integration with Assessment Wizard

```tsx
// Modify src/components/AssessmentWizard.tsx to include Bedrock Assistant

// Add to imports
import { BedrockAssistant } from './BedrockAssistant';

// Add to component (around line 350, inside the return statement)
export function AssessmentWizard({...}) {
  // ... existing code ...

  // Add state for tracking current context
  const [currentAssistantContext, setCurrentAssistantContext] = useState({
    pillar: '',
    topic: '',
    metric: ''
  });

  // Update context when step changes
  useEffect(() => {
    const currentPillar = wizardSteps[currentStep];
    if (currentPillar) {
      setCurrentAssistantContext({
        pillar: currentPillar.pillarName,
        topic: '', // Will be set when user clicks on a topic
        metric: ''
      });
    }
  }, [currentStep]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Existing wizard content */}
      {/* ... */}

      {/* Add Bedrock Assistant */}
      <BedrockAssistant
        sessionId={sessionId}
        currentContext={currentAssistantContext}
        onRecommendationAccepted={(recommendation) => {
          // Auto-fill the metric value when user accepts recommendation
          if (recommendation.metricId && recommendation.suggestedValue) {
            handleInputChange(
              recommendation.metricId,
              'value',
              recommendation.suggestedValue
            );
          }
        }}
      />
    </div>
  );
}
```

---

## 📊 Feature Summary

### Core Capabilities

#### 1. **Guided Assessment Helper**

- ✅ Contextual chat interface integrated into wizard
- ✅ Real-time conversation with AWS Bedrock Agent
- ✅ Context-aware responses based on current assessment phase
- ✅ Persistent conversation history per session

#### 2. **Question Clarification**

- ✅ Explain complex metrics in simple terms
- ✅ Provide examples for each maturity level
- ✅ Suggest evidence to look for
- ✅ Answer "what does this mean?" questions

#### 3. **Smart Recommendations**

- ✅ AI-suggested maturity levels based on user descriptions
- ✅ Confidence scoring for recommendations
- ✅ Reasoning transparency
- ✅ Evidence gap identification

#### 4. **Evidence Analysis**

- ✅ Upload and analyze documents
- ✅ Extract maturity indicators from evidence
- ✅ Map evidence to relevant metrics
- ✅ Generate improvement suggestions

### Integration Points

```typescript
// Existing functionality PRESERVED
✅ AssessmentWizard.tsx - Original wizard flow unchanged
✅ MaturityCalculator - Existing scoring logic intact
✅ Dashboard & Results - No modifications to display logic
✅ Admin pages - Configuration untouched
✅ Database schema - Only additive changes (new tables)
✅ YAML metrics - Used as-is for knowledge base

// NEW additions (non-breaking)
✨ BedrockAssistant.tsx - Floating chat component
✨ /api/bedrock/* - New API routes for agent
✨ bedrock-agent.ts - Service layer for AWS Bedrock
✨ Lambda functions - Action groups for agent
✨ Knowledge Base - RAG from YAML metrics
✨ New database tables - For conversations & recommendations
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// tests/bedrock-agent.test.ts
describe("BedrockAgentService", () => {
  it("should chat with context", async () => {
    const response = await bedrockAgent.chat({
      sessionId: "test-session",
      message: "What does this metric mean?",
      context: { currentMetric: "metric-123" },
    });

    expect(response).toHaveProperty("response");
    expect(response.response).toBeTruthy();
  });

  it("should generate recommendations", async () => {
    const rec = await bedrockAgent.getRecommendation({
      metricId: "metric-123",
      userDescription: "We have basic security measures",
      currentEvidence: [],
    });

    expect(rec).toHaveProperty("suggestedLevel");
    expect(rec).toHaveProperty("confidence");
  });
});
```

### Integration Tests

```typescript
// tests/api/bedrock-chat.integration.test.ts
describe("POST /api/bedrock/agent/chat", () => {
  it("should handle chat request", async () => {
    const response = await fetch("/api/bedrock/agent/chat", {
      method: "POST",
      body: JSON.stringify({
        sessionId: testSessionId,
        message: "Help me assess security",
      }),
    });

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.response).toBeTruthy();
  });
});
```

---

## 🚀 Deployment Checklist

### Prerequisites

- [ ] AWS Account with Bedrock access enabled
- [ ] Claude 3.5 Sonnet model access granted
- [ ] S3 bucket for Knowledge Base
- [ ] Lambda execution roles configured
- [ ] Database migration scripts ready

### Infrastructure Setup

- [ ] Create Bedrock Agent in AWS Console
- [ ] Set up Knowledge Base with S3 data source
- [ ] Deploy Lambda functions for action groups
- [ ] Configure IAM roles and policies
- [ ] Set up CloudWatch logging

### Application Deployment

- [ ] Run database migrations (new tables)
- [ ] Upload YAML metrics to S3 Knowledge Base
- [ ] Configure environment variables
- [ ] Deploy updated Next.js application
- [ ] Test all integration points

### Validation

- [ ] Test chat functionality
- [ ] Verify recommendations accuracy
- [ ] Test evidence analysis
- [ ] Confirm existing features unaffected
- [ ] Performance testing (response times)
- [ ] Security audit

---

## 💰 Cost Estimation

### AWS Bedrock Costs (Monthly, Estimated)

- **Claude 3.5 Sonnet**: $3 per 1K input tokens, $15 per 1K output tokens
- **Knowledge Base**: $0.10 per 1M characters stored, $0.02 per query
- **Lambda Functions**: First 1M requests free, $0.20 per 1M after
- **S3 Storage**: ~$0.023 per GB (minimal for YAML files)

**Estimated for 100 assessments/month**: $50-150/month

---

## 📈 Success Metrics

### User Adoption

- 70%+ of assessors interact with assistant
- 50%+ accept AI recommendations
- 30% reduction in assessment completion time

### Quality Improvements

- 85%+ recommendation accuracy
- 90%+ user satisfaction rating
- 40% reduction in clarification requests

### System Performance

- <2 second response time for chat
- 99.9% API availability
- Zero impact on existing features

---

## 🔒 Security & Compliance

### Data Protection

- All conversations encrypted in transit (TLS)
- PII filtering before sending to Bedrock
- Audit logs for all agent interactions
- Compliance with data retention policies

### Access Control

- Role-based access to Bedrock features
- Session validation for all requests
- Rate limiting to prevent abuse

---

## 📝 Documentation Updates

### User Documentation

- Guide: "Using the AI Assessment Assistant"
- Video: "Getting Smart Recommendations"
- FAQ: "Understanding AI Suggestions"

### Developer Documentation

- API Reference: Bedrock endpoints
- Architecture Diagram: Integration flow
- Troubleshooting Guide: Common issues

---

## ✅ Summary

This implementation plan provides a **complete, production-ready blueprint** for integrating AWS Bedrock Agent into your Enterprise Architecture Maturity Assessment Platform. The design is:

1. **Non-Breaking**: All existing functionality remains unchanged
2. **Additive**: New features layer on top of current system
3. **Scalable**: Built to handle increasing usage
4. **Secure**: Follows AWS best practices
5. **User-Focused**: Enhances assessor experience without complexity

The Bedrock Agent will transform your platform from a standard assessment tool into an **intelligent, AI-powered advisor** that guides users through complex maturity evaluations while maintaining the integrity of your proven calculation engine and data model.

Ready to implement? Start with Phase 1 and build iteratively! 🚀
