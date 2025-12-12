'use client';

import { useState } from 'react';
import { MessageCircle, Send, X, Sparkles } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AssessmentChatProps {
  metricId: string;
  sessionId?: string;
  metricName: string;
  projectInfo?: string;
  onClose?: () => void;
}

export default function AssessmentChat({
  metricId,
  sessionId,
  metricName,
  projectInfo,
  onClose,
}: AssessmentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickPrompts, setQuickPrompts] = useState<string[]>([]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          metricId,
          sessionId,
          projectInfo,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update quick prompts
      if (data.quickPrompts) {
        setQuickPrompts(data.quickPrompts);
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">AI Assessment Assistant</h3>
            <p className="text-xs text-blue-100">{metricName}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-500 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-blue-400" />
            <p className="font-medium">Ask me anything about this metric!</p>
            <p className="text-sm mt-1">
              I can help explain what it measures, suggest scores, and provide AWS best practices.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      {quickPrompts.length > 0 && messages.length === 0 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(prompt)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this metric..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
