'use client';

import React, { useState, useEffect } from 'react';

interface Assessment {
  id: string;
  name: string;
  organization: string;
  createdAt: string;
  status: string;
}

export default function AssessmentsPageMinimal() {
  console.log('🚀 MINIMAL AssessmentsPage rendering');
  
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testCounter, setTestCounter] = useState(0);

  console.log('🔧 State:', { assessments: assessments.length, isLoading, testCounter });

  // MINIMAL TEST EFFECT
  useEffect(() => {
    console.log('🟥 MINIMAL TEST useEffect EXECUTED!');
    setTestCounter(prev => prev + 1);
    console.log('🟥 Test counter updated to:', testCounter + 1);
  }, []);

  // MINIMAL DATA LOAD EFFECT
  useEffect(() => {
    console.log('🟦 MINIMAL DATA useEffect started');
    
    const loadData = async () => {
      try {
        console.log('🟦 Fetching assessments...');
        const response = await fetch('/api/assessments');
        console.log('🟦 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🟦 Data received:', data);
          setAssessments(data.assessments || []);
          console.log('🟦 Assessments set to state');
        }
      } catch (err) {
        console.error('🟦 Error:', err);
      } finally {
        setIsLoading(false);
        console.log('🟦 Loading set to false');
      }
    };
    
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Assessments (Minimal Test) - Counter: {testCounter}
        </h1>
        
        {isLoading ? (
          <p>Loading assessments...</p>
        ) : (
          <div>
            <p>Found {assessments.length} assessments:</p>
            <ul>
              {assessments.map((assessment) => (
                <li key={assessment.id} className="p-2 border-b">
                  {assessment.name} - {assessment.organization}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}