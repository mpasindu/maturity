'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessment, usePillars, useUpdateAssessment } from '@/hooks/useAssessments';
import { AssessmentWizard } from '@/components/AssessmentWizard';
import { ChevronLeft, CheckCircle, Home } from 'lucide-react';
import Link from 'next/link';

interface AssessmentPageClientProps {
  assessmentId: string;
}

export function AssessmentPageClient({ assessmentId }: AssessmentPageClientProps) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { data: sessionData, isLoading: sessionLoading, error: sessionError } = useAssessment(assessmentId);
  const { data: pillars = [], isLoading: pillarsLoading, error: pillarsError } = usePillars();
  const updateMutation = useUpdateAssessment();

  const isLoading = sessionLoading || pillarsLoading;
  const loadError = sessionError || pillarsError;

  async function saveProgress(data: any, isComplete?: boolean) {
    try {
      const updateData: any = { responses: data || {} };
      if (isComplete) {
        updateData.status = 'COMPLETED';
      }
      
      await updateMutation.mutateAsync({
        id: assessmentId,
        data: updateData
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      setError('Failed to save progress');
    }
  }

  async function completeAssessment(data: any) {
    try {
      await updateMutation.mutateAsync({
        id: assessmentId,
        data: { 
          responses: data || {},
          status: 'COMPLETED'
        }
      });
      router.push(`/assessments/${assessmentId}/results`);
    } catch (error) {
      console.error('Error completing assessment:', error);
      setError('Failed to complete assessment');
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading assessment...</span>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                Error: {loadError?.message || error}
              </div>
              <button
                onClick={() => router.push('/assessments')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Assessments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              <div className="text-gray-600 mb-4">Assessment not found</div>
              <button
                onClick={() => router.push('/assessments')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Assessments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="h-5 w-5 mr-1" />
              Dashboard
            </Link>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => router.push('/assessments')}
              className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Back to Assessments
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{sessionData.name}</h1>
                <p className="text-gray-600 mt-1">
                  Organization: {sessionData.organization?.name || sessionData.organization || 'N/A'}
                </p>
                <div className="flex items-center mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    sessionData.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : sessionData.status === 'IN_PROGRESS'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {sessionData.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              {sessionData.status === 'COMPLETED' && (
                <button
                  onClick={() => router.push(`/assessments/${assessmentId}/results`)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  View Results
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Assessment Wizard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <AssessmentWizard
            sessionId={assessmentId}
            pillars={pillars}
            initialData={sessionData.responses || {}}
            onSave={saveProgress}
            onComplete={completeAssessment}
          />
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-700">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}