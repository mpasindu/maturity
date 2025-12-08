'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Assessment {
  id: string;
  name: string;
  organization: string;
  createdAt: string;
  status: string;
  typeId: string;
  type?: {
    name: string;
    category: string;
  };
}

const AssessmentsPage: React.FC = () => {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load assessments data - EXACT SAME PATTERN AS DASHBOARD
  useEffect(() => {
    loadAssessmentsData();
  }, []);

  const loadAssessmentsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assessments');
      
      if (!response.ok) {
        throw new Error('Failed to load assessments data');
      }
      
      const data = await response.json();
      setAssessments(data.assessments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Loading Assessments...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Error</h1>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={loadAssessmentsData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
          <button 
            onClick={() => router.push('/assessments/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            New Assessment
          </button>
        </div>

        {assessments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No assessments found</p>
            <button 
              onClick={() => router.push('/assessments/new')}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create your first assessment
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Found {assessments.length} assessments</h2>
              <div className="space-y-4">
                {assessments.map((assessment) => (
                  <div 
                    key={assessment.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/assessments/${assessment.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{assessment.name}</h3>
                        <p className="text-gray-600">{assessment.organization}</p>
                        <p className="text-sm text-gray-500">
                          Created: {new Date(assessment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                          {assessment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentsPage;