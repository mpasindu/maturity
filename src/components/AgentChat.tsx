'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Sparkles, TrendingUp, Target, Loader2 } from 'lucide-react';

interface AgentChatProps {
  sessionId: string;
  targetId?: string;
  targetName?: string;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

const AgentChat: React.FC<AgentChatProps> = ({ 
  sessionId, 
  targetId,
  targetName,
  onClose 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add welcome message
    setMessages([{
      role: 'agent',
      content: `👋 Hi! I'm your **LLM-powered AI Assessment Coach**. I use Claude AI to intelligently coordinate between specialized agents:\n\n🤖 **Assessment Coach Agent** - Helps you understand metrics and tracks progress\n📊 **Scoring Analyst Agent** - Analyzes scores and generates insights\n\n✨ **Powered by Claude 3.5 Sonnet** - I can understand natural language and reason about your questions!\n\nYou can ask me anything like:\n• "Explain this metric to me"\n• "How am I doing so far?"\n• "Analyze my assessment and tell me where I'm weak"\n• "What should I focus on improving?"\n• "Give me specific recommendations"\n• "Show me examples for this metric"\n\nHow can I help you today?`,
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId,
          context: {
            targetId,
            targetName
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get agent response');
      }

      const data = await response.json();

      const agentMessage: Message = {
        role: 'agent',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, agentMessage]);

    } catch (error) {
      console.error('Agent chat error:', error);
      
      const errorMessage: Message = {
        role: 'agent',
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { icon: Target, label: 'My Progress', query: 'What is my current progress?' },
    { icon: TrendingUp, label: 'Analyze', query: 'Analyze my assessment and show me insights' },
    { icon: Sparkles, label: 'Recommendations', query: 'Give me improvement recommendations' },
  ];

  const handleQuickAction = (query: string) => {
    setInput(query);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-2xl border-2 border-purple-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bot className="h-8 w-8" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div>
            <h3 className="text-lg font-bold">AI Assessment Coach</h3>
            <p className="text-sm text-purple-100">Powered by 2-Agent MCP System</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100">
        <div className="flex gap-2 overflow-x-auto">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action.query)}
              className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg hover:bg-purple-100 transition-colors whitespace-nowrap text-sm border border-purple-200 shadow-sm"
            >
              <action.icon className="h-4 w-4 text-purple-600" />
              <span className="text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start space-x-3 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="h-5 w-5 text-white" />
                ) : (
                  <Bot className="h-5 w-5 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900 border border-gray-200'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </div>
                <div
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  <span className="text-sm text-gray-600">Agent is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-xl">
        <div className="flex items-end space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your assessment..."
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
          >
            <Send className="h-5 w-5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Ask me to analyze, explain, or give recommendations!
        </p>
      </div>
    </div>
  );
};

export default AgentChat;
