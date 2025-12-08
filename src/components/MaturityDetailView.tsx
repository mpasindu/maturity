/**
 * Detailed Maturity View Component
 * 
 * Shows pillar-level breakdown with drill-down to topics and metrics
 * Displays traffic light indicators at all levels
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Types for detailed view
interface MaturityDetail {
  id: string;
  name: string;
  type: 'APPLICATION' | 'SYSTEM' | 'PLATFORM';
  overallScore: number;
  maturityLevel: string;
  confidence: number;
  lastAssessed: string;
  assessmentHistory: AssessmentHistory[];
  pillars: PillarDetail[];
  recommendations: string[];
  nextActions: string[];
}

interface PillarDetail {
  id: string;
  name: string;
  description: string;
  score: number;
  weight: number;
  confidence: number;
  trend: 'improving' | 'declining' | 'stable';
  topics: TopicDetail[];
  riskFactors: string[];
}

interface TopicDetail {
  id: string;
  name: string;
  description: string;
  score: number;
  weight: number;
  confidence: number;
  metrics: MetricDetail[];
  trend: 'improving' | 'declining' | 'stable';
}

interface MetricDetail {
  id: string;
  name: string;
  description: string;
  score: number;
  weight: number;
  value: string;
  confidence: number;
  reasoning: string;
  evidenceLinks: string[];
  lastUpdated: string;
}

interface AssessmentHistory {
  date: string;
  score: number;
  assessor: string;
  notes: string;
}

// Color utilities (same as dashboard)
const getMaturityColor = (score: number) => {
  if (score >= 2.0) return 'text-green-600 bg-green-100 border-green-300';
  if (score >= 1.3) return 'text-amber-600 bg-amber-100 border-amber-300';
  return 'text-red-600 bg-red-100 border-red-300';
};

const getMaturityIcon = (score: number) => {
  if (score >= 2.0) return '🟢';
  if (score >= 1.3) return '🟡';
  return '🔴';
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'improving': return '📈';
    case 'declining': return '📉';
    case 'stable': return '➡️';
    default: return '➡️';
  }
};

// Pillar Card Component
const PillarCard: React.FC<{ 
  pillar: PillarDetail; 
  onExpand: (pillarId: string) => void;
  isExpanded: boolean;
}> = ({ pillar, onExpand, isExpanded }) => {
  const colorClass = getMaturityColor(pillar.score);
  const icon = getMaturityIcon(pillar.score);
  const trendIcon = getTrendIcon(pillar.trend);

  return (
    <div className={`border-2 rounded-lg p-6 ${colorClass}`}>
      {/* Pillar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-lg">{pillar.name}</h3>
            <p className="text-sm opacity-75">{pillar.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold">
            {pillar.score.toFixed(1)}
          </div>
          <div className="text-xs opacity-75">
            Weight: {(pillar.weight * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Pillar Metrics */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            {trendIcon} {pillar.trend}
          </span>
          <span>
            Confidence: {(pillar.confidence * 100).toFixed(0)}%
          </span>
          <span>
            Topics: {pillar.topics.length}
          </span>
        </div>
        <button 
          onClick={() => onExpand(pillar.id)}
          className="px-3 py-1 bg-white bg-opacity-50 rounded text-sm hover:bg-opacity-75"
        >
          {isExpanded ? 'Collapse' : 'Expand'} Topics
        </button>
      </div>

      {/* Risk Factors */}
      {pillar.riskFactors.length > 0 && (
        <div className="mb-4 p-3 bg-white bg-opacity-30 rounded">
          <div className="font-medium mb-2">⚠️ Risk Factors:</div>
          <ul className="text-sm space-y-1">
            {pillar.riskFactors.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expanded Topics */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white border-opacity-30">
          <h4 className="font-medium mb-3">Topic Breakdown:</h4>
          <div className="space-y-3">
            {pillar.topics.map(topic => (
              <TopicSummary key={topic.id} topic={topic} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Topic Summary Component
const TopicSummary: React.FC<{ topic: TopicDetail }> = ({ topic }) => {
  const icon = getMaturityIcon(topic.score);
  const trendIcon = getTrendIcon(topic.trend);

  return (
    <div className="bg-white bg-opacity-30 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="font-medium">{topic.name}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span>{topic.score.toFixed(1)}</span>
          <span>{trendIcon}</span>
        </div>
      </div>
      <p className="text-sm opacity-75 mb-2">{topic.description}</p>
      <div className="text-xs opacity-75">
        Metrics: {topic.metrics.length} | 
        Weight: {(topic.weight * 100).toFixed(0)}% |
        Confidence: {(topic.confidence * 100).toFixed(0)}%
      </div>
    </div>
  );
};

// Assessment History Chart Component
const HistoryChart: React.FC<{ history: AssessmentHistory[] }> = ({ history }) => {
  if (history.length === 0) return null;

  const maxScore = Math.max(...history.map(h => h.score), 3.0);
  const minScore = Math.min(...history.map(h => h.score), 0);

  return (
    <div className="bg-white rounded-lg p-4 border">
      <h4 className="font-semibold mb-4">Assessment History</h4>
      <div className="h-48 flex items-end justify-between gap-2">
        {history.slice(-10).map((assessment, idx) => {
          const height = ((assessment.score - minScore) / (maxScore - minScore)) * 100;
          const color = getMaturityColor(assessment.score);
          
          return (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div className="text-xs mb-1">{assessment.score.toFixed(1)}</div>
              <div 
                className={`w-full rounded-t ${color} border-2`}
                style={{ height: `${height}%`, minHeight: '20px' }}
              />
              <div className="text-xs mt-1 rotate-45 origin-left" suppressHydrationWarning>
                {new Date(assessment.date).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main Component
const MaturityDetailView: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const targetId = params.id as string;
  
  const [target, setTarget] = useState<MaturityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<'overview' | 'history' | 'recommendations'>('overview');

  useEffect(() => {
    if (targetId) {
      loadTargetDetails();
    }
  }, [targetId]);

  const loadTargetDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/maturity/${targetId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load target details');
      }
      
      const data = await response.json();
      setTarget(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const togglePillarExpansion = (pillarId: string) => {
    const newExpanded = new Set(expandedPillars);
    if (newExpanded.has(pillarId)) {
      newExpanded.delete(pillarId);
    } else {
      newExpanded.add(pillarId);
    }
    setExpandedPillars(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading target details...</p>
        </div>
      </div>
    );
  }

  if (error || !target) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <span className="text-red-500 text-xl">❌</span>
          <div>
            <h3 className="font-semibold text-red-800">Error Loading Target</h3>
            <p className="text-red-600">{error || 'Target not found'}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button 
            onClick={loadTargetDetails}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
          <Link 
            href="/dashboard"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const overallIcon = getMaturityIcon(target.overallScore);
  const overallColor = getMaturityColor(target.overallScore);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-600">
        <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
        <span className="mx-2">›</span>
        <span className="font-medium">{target.name}</span>
      </div>

      {/* Header */}
      <div className={`border-2 rounded-lg p-6 ${overallColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-3xl">{overallIcon}</span>
            <div>
              <h1 className="text-2xl font-bold">{target.name}</h1>
              <p className="text-lg opacity-75">{target.type} • {target.maturityLevel}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {target.overallScore.toFixed(1)}
            </div>
            <div className="text-sm opacity-75">Overall Score</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div>
            Confidence: {(target.confidence * 100).toFixed(0)}% | 
            Last Assessed: <span suppressHydrationWarning>{new Date(target.lastAssessed).toLocaleDateString()}</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => router.push(`/assessments/${targetId}/edit`)}
              className="px-3 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75"
            >
              Edit Assessment
            </button>
            <button 
              onClick={() => router.push(`/assessments/${targetId}/reassess`)}
              className="px-3 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75"
            >
              Reassess
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Pillar Overview', icon: '📊' },
            { key: 'history', label: 'Assessment History', icon: '📈' },
            { key: 'recommendations', label: 'Recommendations', icon: '💡' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Based on Active View */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Pillar Breakdown</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setExpandedPillars(new Set(target.pillars.map(p => p.id)))}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Expand All
              </button>
              <button 
                onClick={() => setExpandedPillars(new Set())}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Collapse All
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {target.pillars.map(pillar => (
              <PillarCard 
                key={pillar.id} 
                pillar={pillar}
                onExpand={togglePillarExpansion}
                isExpanded={expandedPillars.has(pillar.id)}
              />
            ))}
          </div>
        </div>
      )}

      {activeView === 'history' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Assessment History</h2>
          <HistoryChart history={target.assessmentHistory} />
          
          <div className="bg-white rounded-lg border">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold">Recent Assessments</h3>
            </div>
            <div className="divide-y">
              {target.assessmentHistory.slice(0, 5).map((assessment, idx) => (
                <div key={idx} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {getMaturityIcon(assessment.score)} Score: {assessment.score.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span suppressHydrationWarning>{new Date(assessment.date).toLocaleDateString()}</span> by {assessment.assessor}
                    </div>
                    {assessment.notes && (
                      <div className="text-sm text-gray-500 mt-1">{assessment.notes}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeView === 'recommendations' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Recommendations & Next Actions</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-800 mb-4">💡 Improvement Recommendations</h3>
              <ul className="space-y-3">
                {target.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span className="text-blue-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-800 mb-4">🎯 Next Actions</h3>
              <ul className="space-y-3">
                {target.nextActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span className="text-green-700">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaturityDetailView;