import { NextRequest, NextResponse } from 'next/server';
import { LLMAgentCoordinator, AgentContext } from '@/../../mcp-servers/llm-agent-coordinator';

// Store conversation histories per session (in production, use Redis or database)
const sessionHistories = new Map<string, any[]>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, context, useLLM = true } = body;

    if (!message || !sessionId) {
      return NextResponse.json(
        { error: 'Message and sessionId are required' },
        { status: 400 }
      );
    }

    // Get or initialize conversation history
    if (!sessionHistories.has(sessionId)) {
      sessionHistories.set(sessionId, []);
    }

    // Build agent context
    const agentContext: AgentContext = {
      sessionId,
      assessmentId: context?.assessmentId,
      metricId: context?.metricId,
      pillarId: context?.pillarId,
      topicId: context?.topicId,
      conversationHistory: sessionHistories.get(sessionId) || [],
    };

    // Create LLM-based agent coordinator
    const coordinator = new LLMAgentCoordinator(agentContext);

    // Process user message with LLM reasoning
    const response = await coordinator.handleUserMessage(message);

    // Update conversation history
    sessionHistories.set(sessionId, coordinator.getHistory());

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
      usedLLM: true,
    });

  } catch (error) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process agent request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Clear history endpoint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      sessionHistories.delete(sessionId);
      return NextResponse.json({ success: true, message: 'History cleared' });
    }

    return NextResponse.json(
      { error: 'sessionId required' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear history' },
      { status: 500 }
    );
  }
}
