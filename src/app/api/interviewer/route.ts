import { NextRequest, NextResponse } from 'next/server';
import { LLMInterviewerAgent } from '@/../../mcp-servers/llm-interviewer-agent';

// Store interviewer sessions (in production, use Redis or database)
const activeSessions = new Map<string, LLMInterviewerAgent>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sessionId, message, assessmentId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Get or create interviewer for this session
    let interviewer = activeSessions.get(sessionId);

    if (action === 'start') {
      // Start new interview
      interviewer = new LLMInterviewerAgent(sessionId, assessmentId);
      activeSessions.set(sessionId, interviewer);

      const response = await interviewer.startInterview();

      return NextResponse.json({
        success: true,
        response,
        action: 'started',
        timestamp: new Date().toISOString(),
      });
    }

    if (!interviewer) {
      return NextResponse.json(
        { error: 'Interview not started. Use action: "start" to begin.' },
        { status: 400 }
      );
    }

    if (action === 'message') {
      if (!message) {
        return NextResponse.json(
          { error: 'message is required' },
          { status: 400 }
        );
      }

      const response = await interviewer.handleMessage(message);

      return NextResponse.json({
        success: true,
        response,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "start" or "message"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Interviewer API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Clear session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      activeSessions.delete(sessionId);
      return NextResponse.json({ success: true, message: 'Session cleared' });
    }

    return NextResponse.json(
      { error: 'sessionId required' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}
