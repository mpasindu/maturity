'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface MaturityOverview {
  id: string;
  name: string;
  type: 'APPLICATION' | 'SYSTEM' | 'PLATFORM';
  overallScore: number;
  maturityLevel: 'Initial' | 'Managed' | 'Defined' | 'Optimizing';
  confidence: number;
  lastAssessed: string;
  trend: 'improving' | 'declining' | 'stable' | 'new';
  pillarBreakdown: PillarScore[];
  riskFactors: string[];
  status: string;
  isActive: boolean;
  assessmentId?: string;
  detailUrl?: string;
  resultsUrl?: string;
}

interface PillarScore {
  id: string;
  name: string;
  score: number;
  weight: number;
  topicCount: number;
  metricCount: number;
  trend: 'improving' | 'declining' | 'stable';
}

const getMaturityColor = (score: number) => {
  // Updated thresholds for actual calculated score ranges
  // Score of 14.67 should be "Optimizing" (green)
  if (score >= 12) return 'text-green-600';     // Optimizing
  if (score >= 9) return 'text-blue-600';      // Managed  
  if (score >= 6) return 'text-yellow-600';    // Defined
  if (score >= 3) return 'text-orange-600';    // Developing
  return 'text-red-600';                       // Initial
};

const getMaturityBarColor = (score: number) => {
  if (score >= 12) return 'bg-green-500';      // Optimizing
  if (score >= 9) return 'bg-blue-500';       // Managed
  if (score >= 6) return 'bg-yellow-500';     // Defined
  if (score >= 3) return 'bg-orange-500';     // Developing
  return 'bg-red-500';                        // Initial
};

const getStatusBadge = (score: number) => {
  if (score >= 12) return 'bg-green-100 text-green-800';    // Optimizing
  if (score >= 9) return 'bg-blue-100 text-blue-800';      // Managed
  if (score >= 6) return 'bg-yellow-100 text-yellow-800';   // Defined
  if (score >= 3) return 'bg-orange-100 text-orange-800';   // Developing
  return 'bg-red-100 text-red-800';                        // Initial
};

const MaturityDashboard: React.FC = () => {
  const router = useRouter();
  const [targets, setTargets] = useState<MaturityOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/maturity');
      
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }
      
      const data = await response.json();
      setTargets(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded border p-6 text-center">
            <div className="text-red-500 mb-4">Error</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={loadDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    total: targets.length,
    excellent: targets.filter(t => t.overallScore >= 12).length,    // Optimizing
    good: targets.filter(t => t.overallScore >= 9 && t.overallScore < 12).length,  // Managed
    fair: targets.filter(t => t.overallScore >= 6 && t.overallScore < 9).length,   // Defined  
    poor: targets.filter(t => t.overallScore < 6).length,           // Developing + Initial
    avgScore: targets.length > 0 ? targets.reduce((sum, t) => sum + t.overallScore, 0) / targets.length : 0,
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Maturity Dashboard</h1>
          <p className="text-gray-600">Enterprise architecture maturity assessment overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded border p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Assets</div>
          </div>
          
          <div className="bg-white rounded border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.excellent}</div>
            <div className="text-sm text-gray-600">Excellent</div>
          </div>
          
          <div className="bg-white rounded border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.good}</div>
            <div className="text-sm text-gray-600">Good</div>
          </div>
          
          <div className="bg-white rounded border p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.fair}</div>
            <div className="text-sm text-gray-600">Fair</div>
          </div>
          
          <div className="bg-white rounded border p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.poor}</div>
            <div className="text-sm text-gray-600">Poor</div>
          </div>
          
          <div className="bg-white rounded border p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.avgScore.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Avg Score</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded border p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={loadDashboardData}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Refresh
            </button>
            <Link 
              href="/assessments"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              New Assessment
            </Link>
          </div>
        </div>

        {/* Main Content */}
        {targets.length === 0 ? (
          <div className="bg-white rounded border p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessment Data</h3>
            <p className="text-gray-600 mb-4">Create your first assessment to see maturity insights.</p>
            <Link 
              href="/assessments"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Create First Assessment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {targets.map((target, index) => (
              <div 
                key={target.id}
                className={`bg-white rounded border p-4 hover:shadow-md transition-shadow cursor-pointer ${
                  !target.isActive ? 'opacity-60 bg-gray-50' : ''
                }`}
                onClick={() => {
                  if (target.detailUrl) {
                    router.push(target.detailUrl);
                  } else {
                    // For not-started targets, redirect to create new assessment
                    router.push('/assessments');
                  }
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-gray-900 text-sm">{target.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    target.status === 'not-started' 
                      ? 'bg-gray-100 text-gray-600'
                      : getStatusBadge(target.overallScore)
                  }`}>
                    {target.status === 'not-started' ? 'Not Started' : target.maturityLevel}
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Score</span>
                    <span>
                      {target.status === 'not-started' 
                        ? 'No data' 
                        : `${target.overallScore.toFixed(1)}`
                      }
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-full rounded-full ${
                        target.status === 'not-started' 
                          ? 'bg-gray-300' 
                          : getMaturityBarColor(target.overallScore)
                      }`}
                      style={{ 
                        width: target.status === 'not-started' 
                          ? '0%' 
                          : `${Math.min((target.overallScore / 20) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                  <span>{target.type}</span>
                  <span>
                    {target.status === 'not-started' 
                      ? 'Not Started' 
                      : <span suppressHydrationWarning>{new Date(target.lastAssessed).toLocaleDateString()}</span>
                    }
                  </span>
                </div>
                
                {/* Assessment Links */}
                {target.isActive && target.detailUrl && (
                  <div className="flex gap-2 text-xs">
                    <span 
                      className="text-blue-600 hover:text-blue-800 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(target.detailUrl!);
                      }}
                    >
                      View Details
                    </span>
                    {target.resultsUrl && (
                      <>
                        <span className="text-gray-300">|</span>
                        <span 
                          className="text-green-600 hover:text-green-800 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(target.resultsUrl!);
                          }}
                        >
                          View Results
                        </span>
                      </>
                    )}
                  </div>
                )}
                
                {!target.isActive && (
                  <div className="text-xs text-gray-500">
                    Click to start assessment
                  </div>
                )}
                
                {target.riskFactors.length > 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    {target.riskFactors.length} risk factor{target.riskFactors.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="bg-white rounded border p-4 mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Maturity Levels</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Initial (0-3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-sm text-gray-600">Developing (3-6)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-600">Defined (6-9)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Managed (9-12)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Optimizing (12+)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaturityDashboard;
