'use client';

import React, { useState, useEffect } from 'react';
import { Bot, ArrowLeft, Sparkles, MessageSquare, Plus, Building2, Server, Cloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import InterviewerChat from '@/components/InterviewerChat';

interface AssessmentTarget {
  id: string;
  name: string;
  type: 'APPLICATION' | 'SYSTEM' | 'PLATFORM';
  description?: string;
  organization?: {
    id: string;
    name: string;
  };
  _count?: {
    assessmentSessions: number;
  };
  latestSession?: {
    id: string;
    status: string;
    lastModified: string;
  };
}

export default function AIInterviewPage() {
  const router = useRouter();
  const [targets, setTargets] = useState<AssessmentTarget[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<AssessmentTarget | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showNewTargetForm, setShowNewTargetForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTargetData, setNewTargetData] = useState({
    name: '',
    type: 'APPLICATION' as 'APPLICATION' | 'SYSTEM' | 'PLATFORM',
    description: ''
  });

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      const response = await fetch('/api/targets');
      if (!response.ok) throw new Error('Failed to fetch targets');
      const data = await response.json();
      setTargets(data.targets || []);
    } catch (err) {
      setError('Failed to load assessment targets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTarget = async (target: AssessmentTarget) => {
    try {
      // Create a new assessment session for this target
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: target.id,
          status: 'IN_PROGRESS'
        })
      });

      if (!response.ok) throw new Error('Failed to create assessment session');
      
      const data = await response.json();
      setSessionId(data.id);
      setSelectedTarget(target);
    } catch (err) {
      setError('Failed to start assessment');
      console.error(err);
    }
  };

  const handleCreateNewTarget = async () => {
    if (!newTargetData.name.trim()) {
      alert('Please enter a target name');
      return;
    }

    try {
      const response = await fetch('/api/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTargetData)
      });

      if (!response.ok) throw new Error('Failed to create target');
      
      const newTarget = await response.json();
      setTargets([...targets, newTarget]);
      setShowNewTargetForm(false);
      setNewTargetData({ name: '', type: 'APPLICATION', description: '' });
      
      // Automatically select the new target
      await handleSelectTarget(newTarget);
    } catch (err) {
      setError('Failed to create new target');
      console.error(err);
    }
  };

  const handleBackToSelection = () => {
    setSelectedTarget(null);
    setSessionId(null);
    fetchTargets(); // Refresh the list
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show interviewer chat if target selected
  if (selectedTarget && sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={handleBackToSelection}
              className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Target Selection
            </button>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <Bot className="w-8 h-8 text-indigo-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    AI Interview: {selectedTarget.name}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {selectedTarget.type} • {selectedTarget.organization?.name || 'Organization'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interviewer Chat */}
          <InterviewerChat
            sessionId={sessionId}
            onComplete={() => {
              // Refresh targets and go back to selection
              fetchTargets();
              handleBackToSelection();
            }}
          />
        </div>
      </div>
    );
  }

  // Show assessment selection
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-4 mr-4">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    AI-Powered Assessment Interview
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Let our AI interviewer guide you through the assessment by asking questions one at a time
                  </p>
                </div>
              </div>
              <Sparkles className="w-12 h-12 text-purple-500" />
            </div>

            {/* Features */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50 rounded-lg p-4">
                <MessageSquare className="w-6 h-6 text-indigo-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Interactive</h3>
                <p className="text-sm text-gray-600">Conversational question flow</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <Bot className="w-6 h-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-gray-900">AI-Guided</h3>
                <p className="text-sm text-gray-600">Smart follow-up questions</p>
              </div>
              <div className="bg-pink-50 rounded-lg p-4">
                <Sparkles className="w-6 h-6 text-pink-600 mb-2" />
                <h3 className="font-semibold text-gray-900">Intelligent</h3>
                <p className="text-sm text-gray-600">Context-aware assistance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Target Selection */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Select Assessment Target
          </h2>
          <button
            onClick={() => setShowNewTargetForm(true)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Target
          </button>
        </div>

        {/* New Target Form */}
        {showNewTargetForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Assessment Target</h3>
              <button
                onClick={() => setShowNewTargetForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Name *
                </label>
                <input
                  type="text"
                  value={newTargetData.name}
                  onChange={(e) => setNewTargetData({ ...newTargetData, name: e.target.value })}
                  placeholder="e.g., My Application, Cloud Platform"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={newTargetData.type}
                  onChange={(e) => setNewTargetData({ ...newTargetData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="APPLICATION">Application</option>
                  <option value="SYSTEM">System</option>
                  <option value="PLATFORM">Platform</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newTargetData.description}
                  onChange={(e) => setNewTargetData({ ...newTargetData, description: e.target.value })}
                  placeholder="Brief description of what you're assessing"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowNewTargetForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNewTarget}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700"
                >
                  Create & Start Interview
                </button>
              </div>
            </div>
          </div>
        )}

        {targets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Assessment Targets
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first assessment target to begin
            </p>
            <button
              onClick={() => setShowNewTargetForm(true)}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Create New Target
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {targets.map((target) => {
              const getTypeIcon = () => {
                switch(target.type) {
                  case 'APPLICATION': return <Building2 className="w-8 h-8 text-blue-600" />;
                  case 'SYSTEM': return <Server className="w-8 h-8 text-purple-600" />;
                  case 'PLATFORM': return <Cloud className="w-8 h-8 text-indigo-600" />;
                }
              };

              return (
                <div
                  key={target.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        {getTypeIcon()}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {target.name}
                          </h3>
                          <p className="text-xs text-gray-500 uppercase font-medium mb-2">
                            {target.type}
                          </p>
                          {target.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {target.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>
                        {target._count?.assessmentSessions || 0} assessments
                      </span>
                      {target.latestSession && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          target.latestSession.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {target.latestSession.status}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleSelectTarget(target)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                    >
                      <Bot className="w-5 h-5 mr-2" />
                      Start AI Interview
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
