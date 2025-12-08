/**
 * Individual Assessment Detail Page
 * 
 * Shows comprehensive maturity analysis similar to ALM System report format
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Home, Download, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AssessmentDetail {
  id: string;
  name: string;
  type: 'APPLICATION' | 'SYSTEM' | 'PLATFORM';
  overallScore: number;
  maturityLevel: string;
  overallMaturityPercent: number;
  confidence: number;
  lastAssessed: string;
  assessor?: string;
  pillars: PillarAnalysis[];
  topicDetails: TopicDetail[];
  keyHighlights: string[];
  recommendations: Recommendation[];
  nextActions: string[];
}

interface PillarAnalysis {
  id: string;
  name: string;
  score: number;
  level: number;
  maturityLevel: string;
  color: string;
  topics: TopicSummary[];
}

interface TopicSummary {
  name: string;
  level: string;
  color: string;
}

interface TopicDetail {
  pillar: string;
  topic: string;
  level: string;
  levelNumber: number;
  color: string;
}

interface Recommendation {
  type: 'improvement' | 'guidance' | 'review';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

const COLORS = {
  Level1: '#ef4444', // red
  Level2: '#f97316', // orange  
  Level3: '#22c55e', // green
  Level4: '#3b82f6', // blue
  Level5: '#8b5cf6', // purple
};

const LEVEL_COLORS = {
  1: '#ef4444',
  2: '#f97316', 
  3: '#22c55e',
  4: '#3b82f6',
  5: '#8b5cf6',
};

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      loadAssessmentDetail(params.id as string);
    }
  }, [params?.id]);

  const loadAssessmentDetail = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/maturity/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to load assessment details');
      }
      
      const data = await response.json();
      setAssessment(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading assessment details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded border p-6 text-center">
            <div className="text-red-500 mb-4">Error</div>
            <p className="text-gray-600 mb-4">{error || 'Assessment not found'}</p>
            <div className="flex gap-3 justify-center">
              <Link 
                href="/dashboard"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const overallMaturityData = [
    { name: 'Level1', value: 3.03, color: COLORS.Level1 },
    { name: 'Level2', value: 42.42, color: COLORS.Level2 },
    { name: 'Level3', value: 54.55, color: COLORS.Level3 },
  ];

  const pillarChartData = assessment.pillars.map(pillar => ({
    name: pillar.name,
    score: pillar.score,
    level: pillar.level,
    color: LEVEL_COLORS[pillar.level as keyof typeof LEVEL_COLORS]
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <span className="text-gray-300">•</span>
          <span className="text-gray-600">Assessment Details</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {assessment.name} Maturity Analysis
              </h1>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span>Type: {assessment.type}</span>
                <span>Last Assessed: {new Date(assessment.lastAssessed).toLocaleDateString()}</span>
                {assessment.assessor && <span>Assessor: {assessment.assessor}</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-lg font-bold">Overall Maturity</span>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {assessment.overallScore}
              </div>
              <div className="text-sm text-gray-600">
                Score: {assessment.overallScore} | Level: {assessment.maturityLevel}
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Overall Maturity Levels Pie Chart */}
          <div className="bg-white rounded border p-6">
            <h3 className="text-lg font-bold mb-4">Overall Maturity Levels</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overallMaturityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {overallMaturityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {overallMaturityData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm">{item.name} {item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pillar Scores Bar Chart */}
          <div className="bg-white rounded border p-6">
            <h3 className="text-lg font-bold mb-4">Pillar Maturity Levels</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pillarChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Key Highlights */}
        <div className="bg-white rounded border p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">📋 Quick Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Key Highlights</h4>
              <ul className="space-y-2">
                {assessment.keyHighlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Recommendations</h4>
              <ul className="space-y-2">
                {assessment.recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{rec.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Detailed Topic Breakdown Table */}
        <div className="bg-white rounded border p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">📊 Detailed Breakdown by Topics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium">Pillar</th>
                  <th className="text-left p-3 font-medium">Topics</th>
                  <th className="text-left p-3 font-medium">Level</th>
                </tr>
              </thead>
              <tbody>
                {assessment.topicDetails.map((topic, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{topic.pillar}</td>
                    <td className="p-3">{topic.topic}</td>
                    <td className="p-3">
                      <span 
                        className="px-2 py-1 rounded text-sm font-medium"
                        style={{ 
                          backgroundColor: topic.color + '20',
                          color: topic.color 
                        }}
                      >
                        {topic.level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Recommendations */}
        <div className="bg-white rounded border p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">💡 Detailed Recommendations</h3>
          <div className="space-y-4">
            {assessment.recommendations.map((rec, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {rec.type === 'improvement' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                    {rec.type === 'guidance' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {rec.type === 'review' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                    <span className="font-medium">{rec.title}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded border p-6">
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </button>
            <Link 
              href={`/assessments/${assessment.id}/results`}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              View Full Results
            </Link>
            <Link 
              href={`/assessments/${assessment.id}`}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              View Assessment Record
            </Link>
            <Link 
              href="/assessments"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Start New Assessment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}