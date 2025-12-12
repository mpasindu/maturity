import { NextRequest, NextResponse } from 'next/server';
import {
  chatWithClaude,
  getAssessmentContext,
  saveChatMessage,
  getChatHistory,
  getQuickPrompts,
} from '@/lib/bedrock-http-chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, metricId, sessionId, projectInfo } = body;

    if (!message || !metricId) {
      return NextResponse.json(
        { error: 'Message and metricId are required' },
        { status: 400 }
      );
    }

    // Get assessment context
    const context = await getAssessmentContext(metricId, sessionId);
    
    if (!context) {
      return NextResponse.json(
        { error: 'Metric not found' },
        { status: 404 }
      );
    }

    // Add project info if provided
    if (projectInfo) {
      context.projectInfo = projectInfo;
    }

    // Get conversation history
    const history = sessionId 
      ? await getChatHistory(sessionId, metricId)
      : [];

    // Chat with Claude
    const result = await chatWithClaude(message, context, history);

    console.log('Chat result:', {
      hasResponse: !!result.response,
      responseLength: result.response?.length || 0,
      hasError: !!result.error,
      error: result.error,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Save to database if session provided
    if (sessionId && result.response) {
      await saveChatMessage(sessionId, metricId, message, result.response);
    }

    // Get quick prompts for next questions
    const quickPrompts = getQuickPrompts(context);

    return NextResponse.json({
      response: result.response,
      quickPrompts,
      context: {
        pillarName: context.pillarName,
        topicName: context.topicName,
        metricName: context.metricName,
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const metricId = searchParams.get('metricId');

    if (!sessionId || !metricId) {
      return NextResponse.json(
        { error: 'sessionId and metricId are required' },
        { status: 400 }
      );
    }

    // Get chat history
    const history = await getChatHistory(sessionId, metricId);

    // Get context for quick prompts
    const context = await getAssessmentContext(metricId, sessionId);
    const quickPrompts = context ? getQuickPrompts(context) : [];

    return NextResponse.json({
      history,
      quickPrompts,
    });
  } catch (error: any) {
    console.error('Chat history API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
