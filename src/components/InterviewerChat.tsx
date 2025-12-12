'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, User, ArrowRight, ArrowLeft, SkipForward, HelpCircle, Volume2, VolumeX } from 'lucide-react';

interface InterviewerChatProps {
  sessionId?: string;
  assessmentId?: number;
  assessmentName?: string;
  onClose?: () => void;
  onComplete?: () => void;
}

interface Message {
  role: 'user' | 'interviewer';
  content: string;
  timestamp: Date;
}

const InterviewerChat: React.FC<InterviewerChatProps> = ({ 
  sessionId: providedSessionId, 
  assessmentId,
  assessmentName,
  onClose,
  onComplete
}) => {
  const [sessionId] = useState(providedSessionId || `interview-${Date.now()}`);
  const [currentAssessmentId] = useState(assessmentId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Speak the last interviewer message
    if (messages.length > 0 && voiceEnabled) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'interviewer') {
        speakText(lastMessage.content);
      }
    }
  }, [messages, voiceEnabled]);

  // Cleanup: stop speech when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const speakText = (text: string) => {
    // Cancel any ongoing speech
    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel();
    }

    // Clean the text (remove emojis and special formatting)
    const cleanText = text.replace(/[✅❌🤖💬✨⏭️📊]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const startInterview = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/interviewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          sessionId,
          assessmentId: currentAssessmentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start interview');
      }

      const data = await response.json();

      const interviewerMessage: Message = {
        role: 'interviewer',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages([interviewerMessage]);
      setInterviewStarted(true);

    } catch (error) {
      console.error('Failed to start interview:', error);
      
      const errorMessage: Message = {
        role: 'interviewer',
        content: '❌ Sorry, I encountered an error starting the interview. Please try again.',
        timestamp: new Date(),
      };

      setMessages([errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/interviewer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'message',
          sessionId,
          assessmentId: currentAssessmentId,
          message: userMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const interviewerMessage: Message = {
        role: 'interviewer',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, interviewerMessage]);

      // Check if interview is complete
      if (data.completed && onComplete) {
        setTimeout(() => {
          onComplete();
        }, 2000); // Give user time to read final message
      }

    } catch (error) {
      console.error('Interview chat error:', error);
      
      const errorMessage: Message = {
        role: 'interviewer',
        content: '❌ Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
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

  const sendQuickCommand = (command: string) => {
    setInput(command);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            <div>
              <h3 className="font-semibold text-lg">AI Interview Agent</h3>
              <p className="text-xs text-indigo-100">Interactive Assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              className={`text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors ${isSpeaking ? 'animate-pulse' : ''}`}
              title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
            >
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Welcome Screen */}
        {!interviewStarted && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="h-20 w-20 text-indigo-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              AI-Powered Assessment Interview
            </h2>
            <p className="text-gray-600 mb-6 max-w-md">
              I'll guide you through the assessment by asking questions about your 
              enterprise architecture maturity. Just answer naturally, and I'll 
              understand!
            </p>
            <div className="bg-indigo-50 rounded-lg p-4 mb-6 max-w-md">
              <h3 className="font-semibold text-indigo-900 mb-2">How it works:</h3>
              <ul className="text-left text-sm text-indigo-800 space-y-1">
                <li>✅ I'll ask questions one at a time</li>
                <li>✅ Answer naturally (Level 1, 2, or 3)</li>
                <li>✅ Skip questions if needed</li>
                <li>✅ Go back to change answers</li>
                <li>✅ Track your progress</li>
              </ul>
            </div>
            <button
              onClick={startInterview}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>Starting Interview...</>
              ) : (
                <>
                  Start Interview
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Chat Messages */}
        {(interviewStarted || messages.length > 0) && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'interviewer' && (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-indigo-600" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        msg.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-2">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => sendQuickCommand('progress')}
                  disabled={isLoading}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                >
                  📊 Progress
                </button>
                <button
                  onClick={() => sendQuickCommand('skip')}
                  disabled={isLoading}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <SkipForward className="h-3 w-3" />
                  Skip
                </button>
                <button
                  onClick={() => sendQuickCommand('back')}
                  disabled={isLoading}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back
                </button>
                <button
                  onClick={() => sendQuickCommand('help')}
                  disabled={isLoading}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <HelpCircle className="h-3 w-3" />
                  Help
                </button>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-gray-50 rounded-b-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Answer the question or type a command..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tip: Answer with "Level 1", "Level 2", or "Level 3" - or describe your maturity naturally
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewerChat;
