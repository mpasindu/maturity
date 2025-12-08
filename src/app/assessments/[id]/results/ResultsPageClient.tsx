'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { FileText, Download, TrendingUp, CheckCircle, AlertCircle, Target, ChevronLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAssessmentResults } from '@/hooks/useAssessments';
import Link from 'next/link';

export function ResultsPageClient({ assessmentId }: { assessmentId: string }) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const { data: results, isLoading, error: queryError } = useAssessmentResults(assessmentId);

  async function handleExportResults() {
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/export`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export results');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `assessment-results-${assessmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting results:', error);
      setError('Failed to export results');
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading results...</span>
          </div>
        </div>
      </div>
    );
  }

  if (queryError || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                Error: {queryError?.message || error}
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

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              <div className="text-gray-600 mb-4">No results found for this assessment</div>
              <button
                onClick={() => router.push(`/assessments/${assessmentId}`)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { session, overallMaturity, pillarScores, recommendations, trends } = results;

  // Use session as assessment for backwards compatibility
  const assessment = session;
  const overallScore = overallMaturity?.overallScore || 0;
  const actualMaxScore = overallMaturity?.maxScore || 100;
  const displayMaxScore = 50; // Always use 50 for better visual scaling
  const overallPercentage = displayMaxScore > 0 ? Math.round((overallScore / displayMaxScore) * 100) : 0;

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              <div className="text-gray-600 mb-4">Assessment data not available</div>
              <button
                onClick={() => router.push(`/assessments/${assessmentId}`)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data with display scaling
  const chartData = (pillarScores || []).map((pillar: any) => ({
    name: pillar.pillarName,
    score: pillar.score,
    maxScore: displayMaxScore, // Use consistent display max
    percentage: ((pillar.score / displayMaxScore) * 100).toFixed(1)
  }));

  const radarData = (pillarScores || []).map((pillar: any) => ({
    pillar: (pillar.pillarName || pillar.name || '').substring(0, 10) + '...', // Truncate for radar chart
    score: pillar.score || 0,
    maxScore: displayMaxScore, // Use consistent display max
  }));

  const maturityLevelColors = {
    1: '#ef4444', // red-500
    2: '#f97316', // orange-500
    3: '#eab308', // yellow-500
    4: '#22c55e', // green-500
    5: '#3b82f6', // blue-500
  };

  const getMaturityLevelName = (level: number) => {
    const levels = {
      1: 'Initial',
      2: 'Developing',
      3: 'Defined',
      4: 'Managed',
      5: 'Optimized'
    };
    return levels[level as keyof typeof levels] || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
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
                <h1 className="text-3xl font-bold text-gray-900">Assessment Results</h1>
                <p className="text-gray-600 mt-1">
                  {assessment.name} • {assessment.organization?.name || assessment.organization || 'N/A'}
                </p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-600 font-medium">Completed</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-600">
                    <span suppressHydrationWarning>{new Date(assessment.updatedAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleExportResults}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overall Score</p>
                <p className="text-3xl font-bold text-gray-900">
                  {overallScore.toFixed(1)} <span className="text-lg text-gray-500">/ {displayMaxScore}</span>
                </p>
                <p className="text-sm text-gray-500">
                  {overallPercentage}% ({getMaturityLevelName(Math.round(overallScore))} Level)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Strengths</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(pillarScores || []).filter((p: any) => p.score >= (displayMaxScore * 0.3)).length}
                </p>
                <p className="text-sm text-gray-500">High-performing areas (≥30%)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Opportunities</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(pillarScores || []).filter((p: any) => p.score < (displayMaxScore * 0.25)).length}
                </p>
                <p className="text-sm text-gray-500">Areas for improvement (&lt;25%)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Pillar Performance
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis domain={[0, 50]} />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      `${value.toFixed(1)} / 50`,
                      'Score'
                    ]}
                  />
                  <Bar 
                    dataKey="score" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Maturity Overview
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="pillar" fontSize={12} />
                  <PolarRadiusAxis 
                    angle={90}
                    domain={[0, 50]}
                    fontSize={12}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    formatter={(value: any, name: any, props: any) => [
                      `${value.toFixed(1)} / 50`,
                      'Score'
                    ]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Detailed Assessment Results
          </h3>
          
          <div className="space-y-6">
            {(pillarScores || []).map((pillar: any, index: number) => (
              <div key={index} className="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{pillar.name}</h4>
                    <p className="text-sm text-gray-600">{pillar.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {pillar.score?.toFixed(1) || '0.0'}
                      <span className="text-sm text-gray-500 ml-1">/ {displayMaxScore}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      {displayMaxScore > 0 ? Math.round((pillar.score / displayMaxScore) * 100) : 0}% Complete
                    </div>
                    <div 
                      className="text-sm px-2 py-1 rounded-full font-medium"
                      style={{
                        backgroundColor: `${maturityLevelColors[pillar.maturityLevel as keyof typeof maturityLevelColors]}20`,
                        color: maturityLevelColors[pillar.maturityLevel as keyof typeof maturityLevelColors]
                      }}
                    >
                      Level {pillar.maturityLevel} - {getMaturityLevelName(pillar.maturityLevel)}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((pillar.score || 0) / 5) * 100}%`,
                      backgroundColor: maturityLevelColors[pillar.maturityLevel as keyof typeof maturityLevelColors]
                    }}
                  />
                </div>

                {/* Topic Breakdown */}
                {pillar.topics && pillar.topics.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Topic Breakdown:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pillar.topics.map((topic: any, topicIndex: number) => (
                        <div key={topicIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{topic.name}</span>
                          <span className="text-sm font-medium text-gray-900">
                            {topic.score?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Recommendations for Improvement
              </h3>
            </div>
            
            <div className="space-y-4">
              {recommendations.map((rec: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex-shrink-0">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{
                        backgroundColor: rec.priority === 'HIGH' ? '#ef4444' : rec.priority === 'MEDIUM' ? '#f97316' : '#22c55e'
                      }}
                    >
                      {rec.priority === 'HIGH' ? 'H' : rec.priority === 'MEDIUM' ? 'M' : 'L'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {rec.pillar} - {rec.topic}
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">{rec.recommendation}</p>
                    <div className="text-xs text-gray-500">
                      Current Score: {rec.currentScore?.toFixed(1) || 'N/A'} • Target Score: {rec.targetScore?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-700">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}