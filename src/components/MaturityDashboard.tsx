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
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded border p-8 text-center max-w-md mx-auto mt-20">
            <div className="text-red-600 mb-4 text-xl font-semibold">Error Loading Dashboard</div>
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

        {/* Stats Grid - Keep Status Colors */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded border p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Assets</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-white rounded border border-green-200 p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-green-600">{stats.excellent}</div>
            <div className="text-sm text-gray-600">Excellent</div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white rounded border border-blue-200 p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.good}</div>
            <div className="text-sm text-gray-600">Good</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-white rounded border border-yellow-200 p-4 text-center hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-yellow-600">{stats.fair}</div>
            <div className="text-sm text-gray-600">Fair</div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-white rounded border border-red-200 p-4 text-center hover:shadow-md transition-shadow">
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
            <Link 
              href="/ai-interview"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded hover:from-indigo-700 hover:to-purple-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              AI Interview
            </Link>
          </div>
        </div>

        {/* Main Content */}
        {targets.length === 0 ? (
          <div className="bg-white rounded border p-8 text-center">
            <p className="text-gray-500 mb-4">No assessment data available. Create your first assessment to see maturity insights.</p>
            <Link 
              href="/assessments"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Create Assessment
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {targets.map((target, index) => {
              // Determine background gradient based on score
              let bgGradient = 'from-gray-50 to-white';
              let borderColor = 'border-gray-200';
              let glowColor = '';
              
              if (target.status !== 'not-started') {
                if (target.overallScore >= 12) {
                  bgGradient = 'from-green-50 to-white';
                  borderColor = 'border-green-200';
                  glowColor = 'hover:shadow-green-200';
                } else if (target.overallScore >= 9) {
                  bgGradient = 'from-blue-50 to-white';
                  borderColor = 'border-blue-200';
                  glowColor = 'hover:shadow-blue-200';
                } else if (target.overallScore >= 6) {
                  bgGradient = 'from-yellow-50 to-white';
                  borderColor = 'border-yellow-200';
                  glowColor = 'hover:shadow-yellow-200';
                } else if (target.overallScore >= 3) {
                  bgGradient = 'from-orange-50 to-white';
                  borderColor = 'border-orange-200';
                  glowColor = 'hover:shadow-orange-200';
                } else {
                  bgGradient = 'from-red-50 to-white';
                  borderColor = 'border-red-200';
                  glowColor = 'hover:shadow-red-200';
                }
              }
              
              return (
                <div 
                  key={target.id}
                  className={`bg-gradient-to-br ${bgGradient} rounded border ${borderColor} p-4 hover:shadow-md ${glowColor} transition-all cursor-pointer ${
                    !target.isActive ? 'opacity-70' : ''
                  }`}
                  onClick={() => {
                    if (target.detailUrl) {
                      router.push(target.detailUrl);
                    } else {
                      router.push('/assessments');
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{target.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      target.status === 'not-started' 
                        ? 'bg-gray-100 text-gray-700'
                        : getStatusBadge(target.overallScore)
                    }`}>
                      {target.status === 'not-started' ? '⏸️ Not Started' : `✨ ${target.maturityLevel}`}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Maturity Score</span>
                      <span className="font-semibold text-gray-900">
                        {target.status === 'not-started' 
                          ? 'No data' 
                          : `${target.overallScore.toFixed(1)} / 20`
                        }
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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

                  <div className="flex gap-2 text-xs text-gray-500 mb-3">
                    <span className="bg-white px-2 py-1 rounded">{target.type}</span>
                    <span className="bg-white px-2 py-1 rounded">
                      {target.status === 'not-started' 
                        ? 'Not Started' 
                        : <span suppressHydrationWarning>{new Date(target.lastAssessed).toLocaleDateString()}</span>
                      }
                    </span>
                  </div>
                  
                  {/* Assessment Links */}
                  {target.isActive && target.detailUrl && (
                    <div className="flex gap-2">
                      <span 
                        className="flex-1 text-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(target.detailUrl!);
                        }}
                      >
                        📋 Details
                      </span>
                      {target.resultsUrl && (
                        <span 
                          className="flex-1 text-center px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(target.resultsUrl!);
                          }}
                        >
                          📊 Results
                        </span>
                      )}
                    </div>
                  )}
                  
                  {!target.isActive && (
                    <div className="text-center text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded">
                      🚀 Click to start assessment
                    </div>
                  )}
                  
                  {target.riskFactors.length > 0 && (
                    <div className="mt-3 text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg font-medium text-center">
                      ⚠️ {target.riskFactors.length} risk factor{target.riskFactors.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="bg-white rounded border p-4 mt-6">
          <h4 className="font-semibold text-gray-900 mb-3">Maturity Levels</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Initial (0-3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Developing (3-6)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Defined (6-9)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Managed (9-12)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              <span className="text-sm text-gray-700">Optimizing (12+)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaturityDashboard;
