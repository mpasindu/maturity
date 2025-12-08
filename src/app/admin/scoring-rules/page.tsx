'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, Check, X, Save, RotateCcw } from 'lucide-react';

interface ScoringRule {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isDefault: boolean;
  
  // Level 1: Metric Scoring
  metricAnsweredValue: number;
  metricUnansweredValue: number;
  metricMaxLevel: number;
  
  // Level 2: Topic Scoring
  topicScoreMethod: string;
  topicScaleMin: number;
  topicScaleMax: number;
  topicExcludeEmpty: boolean;
  
  // Level 3: Pillar Scoring
  pillarScoreMethod: string;
  pillarExcludeEmpty: boolean;
  pillarMinTopics: number;
  
  // Level 4: Overall Scoring
  overallScoreMethod: string;
  overallExcludeEmpty: boolean;
  overallMinPillars: number;
  
  // Additional Configuration
  roundingPrecision: number;
  penalizeIncomplete: boolean;
  
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

const SCORING_METHODS = [
  { value: 'AVERAGE', label: 'Average' },
  { value: 'WEIGHTED_AVERAGE', label: 'Weighted Average' },
  { value: 'PERCENTAGE_TO_SCALE', label: 'Percentage to Scale' },
  { value: 'SUM', label: 'Sum' },
  { value: 'MEDIAN', label: 'Median' },
  { value: 'MIN', label: 'Minimum' },
  { value: 'MAX', label: 'Maximum' }
];

const DEFAULT_RULE: Omit<ScoringRule, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
  name: '',
  description: '',
  isActive: true,
  isDefault: false,
  
  // Level 1: Metric Scoring
  metricAnsweredValue: 1,
  metricUnansweredValue: 0,
  metricMaxLevel: 5,
  
  // Level 2: Topic Scoring
  topicScoreMethod: 'PERCENTAGE_TO_SCALE',
  topicScaleMin: 0.0,
  topicScaleMax: 5.0,
  topicExcludeEmpty: true,
  
  // Level 3: Pillar Scoring
  pillarScoreMethod: 'AVERAGE',
  pillarExcludeEmpty: true,
  pillarMinTopics: 1,
  
  // Level 4: Overall Scoring
  overallScoreMethod: 'AVERAGE',
  overallExcludeEmpty: true,
  overallMinPillars: 1,
  
  // Additional Configuration
  roundingPrecision: 2,
  penalizeIncomplete: true
};

export default function ScoringRulesPage() {
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editData, setEditData] = useState<Partial<ScoringRule>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      console.log('Starting to load scoring rules...');
      const response = await fetch('/api/admin/scoring-rules');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        setRules(data.data);
        console.log('Rules loaded successfully:', data.data.length);
      } else {
        console.error('API returned error:', data.error);
        showMessage('error', data.error || 'Failed to load scoring rules');
      }
    } catch (error) {
      console.error('Failed to load scoring rules:', error);
      showMessage('error', 'Failed to load scoring rules: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/admin/scoring-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      
      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Scoring rule created successfully');
        setCreating(false);
        setEditData({});
        loadRules();
      } else {
        showMessage('error', data.error || 'Failed to create scoring rule');
      }
    } catch (error) {
      showMessage('error', 'Failed to create scoring rule');
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/scoring-rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      
      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Scoring rule updated successfully');
        setEditing(null);
        setEditData({});
        loadRules();
      } else {
        showMessage('error', data.error || 'Failed to update scoring rule');
      }
    } catch (error) {
      showMessage('error', 'Failed to update scoring rule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scoring rule?')) return;
    
    try {
      const response = await fetch(`/api/admin/scoring-rules/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Scoring rule deleted successfully');
        loadRules();
      } else {
        showMessage('error', data.error || 'Failed to delete scoring rule');
      }
    } catch (error) {
      showMessage('error', 'Failed to delete scoring rule');
    }
  };

  const startEdit = (rule: ScoringRule) => {
    setEditing(rule.id);
    setEditData(rule);
  };

  const startCreate = () => {
    setCreating(true);
    setEditData(DEFAULT_RULE);
  };

  const cancelEdit = () => {
    setEditing(null);
    setCreating(false);
    setEditData({});
  };

  const updateEditData = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading scoring rules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Scoring Rules Configuration</h1>
                <p className="text-gray-600 mt-1">
                  Configure dynamic maturity calculation rules for assessments
                </p>
              </div>
            </div>
            <button
              onClick={startCreate}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Rule
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {/* Rules List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Existing Scoring Rules ({rules.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rule Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric Rules
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aggregation Methods
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Create Row */}
                {creating && (
                  <CreateEditRow
                    data={editData}
                    onChange={updateEditData}
                    onSave={handleCreate}
                    onCancel={cancelEdit}
                    isCreating={true}
                  />
                )}

                {/* Existing Rules */}
                {rules.map((rule) => (
                  <React.Fragment key={rule.id}>
                    {editing === rule.id ? (
                      <CreateEditRow
                        data={editData}
                        onChange={updateEditData}
                        onSave={() => handleUpdate(rule.id)}
                        onCancel={cancelEdit}
                        isCreating={false}
                      />
                    ) : (
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {rule.name}
                              </div>
                              {rule.isDefault && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Default
                                </span>
                              )}
                            </div>
                            {rule.description && (
                              <div className="text-sm text-gray-500 mt-1">
                                {rule.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            rule.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>Answered: {rule.metricAnsweredValue}</div>
                          <div>Unanswered: {rule.metricUnansweredValue}</div>
                          <div>Max Level: {rule.metricMaxLevel}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>Topic: {rule.topicScoreMethod}</div>
                          <div>Pillar: {rule.pillarScoreMethod}</div>
                          <div>Overall: {rule.overallScoreMethod}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" suppressHydrationWarning>
                          {new Date(rule.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => startEdit(rule)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {!rule.isDefault && (
                              <button
                                onClick={() => handleDelete(rule.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {rules.length === 0 && !creating && (
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No scoring rules configured</p>
                <p className="text-gray-400 mt-2">Create your first scoring rule to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CreateEditRowProps {
  data: Partial<ScoringRule>;
  onChange: (field: string, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  isCreating: boolean;
}

function CreateEditRow({ data, onChange, onSave, onCancel, isCreating }: CreateEditRowProps) {
  return (
    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
      <td className="px-4 py-6" colSpan={6}>
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Settings className="h-5 w-5 text-blue-600 mr-2" />
                {isCreating ? 'Create New Scoring Rule' : 'Edit Scoring Rule'}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onCancel}
                  className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  className="inline-flex items-center px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isCreating ? 'Create' : 'Save'}
                </button>
              </div>
            </div>

            {/* Form Content */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <Settings className="h-4 w-4 text-gray-600 mr-2" />
                    Basic Information
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rule Name *
                      </label>
                      <input
                        type="text"
                        value={data.name || ''}
                        onChange={(e) => onChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter rule name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={2}
                        value={data.description || ''}
                        onChange={(e) => onChange('description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter description"
                      />
                    </div>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={data.isActive || false}
                          onChange={(e) => onChange('isActive', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={data.isDefault || false}
                          onChange={(e) => onChange('isDefault', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Set as Default</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Level 1: Metric Scoring */}
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-red-100 text-red-800 text-xs rounded-full flex items-center justify-center mr-2">1</span>
                    Metric Scoring
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Answered Value
                      </label>
                      <select
                        value={data.metricAnsweredValue || 1}
                        onChange={(e) => onChange('metricAnsweredValue', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      >
                        <option value={1}>Use Level (1)</option>
                        <option value={0}>Always Zero (0)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unanswered Value
                      </label>
                      <input
                        type="number"
                        value={data.metricUnansweredValue || 0}
                        onChange={(e) => onChange('metricUnansweredValue', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Max Level
                      </label>
                      <input
                        type="number"
                        value={data.metricMaxLevel || 5}
                        onChange={(e) => onChange('metricMaxLevel', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                        min="1"
                        max="10"
                      />
                    </div>
                  </div>
                </div>

                {/* Level 2: Topic Scoring */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-orange-100 text-orange-800 text-xs rounded-full flex items-center justify-center mr-2">2</span>
                    Topic Scoring
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Score Method
                      </label>
                      <select
                        value={data.topicScoreMethod || 'PERCENTAGE_TO_SCALE'}
                        onChange={(e) => onChange('topicScoreMethod', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      >
                        {SCORING_METHODS.map(method => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={data.topicExcludeEmpty !== false}
                          onChange={(e) => onChange('topicExcludeEmpty', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-xs text-gray-700">Exclude Empty</span>
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Scale Min
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={data.topicScaleMin || 0}
                        onChange={(e) => onChange('topicScaleMin', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Scale Max
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={data.topicScaleMax || 5}
                        onChange={(e) => onChange('topicScaleMax', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Level 3: Pillar Scoring */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-green-100 text-green-800 text-xs rounded-full flex items-center justify-center mr-2">3</span>
                    Pillar Scoring
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Score Method
                      </label>
                      <select
                        value={data.pillarScoreMethod || 'AVERAGE'}
                        onChange={(e) => onChange('pillarScoreMethod', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      >
                        {SCORING_METHODS.map(method => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Min Topics Required
                      </label>
                      <input
                        type="number"
                        value={data.pillarMinTopics || 1}
                        onChange={(e) => onChange('pillarMinTopics', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={data.pillarExcludeEmpty !== false}
                        onChange={(e) => onChange('pillarExcludeEmpty', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-xs text-gray-700">Exclude Empty Pillars</span>
                    </label>
                  </div>
                </div>

                {/* Level 4: Overall Scoring */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center justify-center mr-2">4</span>
                    Overall Scoring
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Score Method
                      </label>
                      <select
                        value={data.overallScoreMethod || 'AVERAGE'}
                        onChange={(e) => onChange('overallScoreMethod', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      >
                        {SCORING_METHODS.map(method => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Min Pillars Required
                      </label>
                      <input
                        type="number"
                        value={data.overallMinPillars || 1}
                        onChange={(e) => onChange('overallMinPillars', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={data.overallExcludeEmpty !== false}
                        onChange={(e) => onChange('overallExcludeEmpty', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-xs text-gray-700">Exclude Empty Pillars</span>
                    </label>
                  </div>
                </div>

                {/* Additional Configuration */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                    <Settings className="h-4 w-4 text-purple-600 mr-2" />
                    Additional Settings
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Rounding Precision
                      </label>
                      <input
                        type="number"
                        value={data.roundingPrecision || 2}
                        onChange={(e) => onChange('roundingPrecision', parseInt(e.target.value))}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                        min="0"
                        max="5"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={data.penalizeIncomplete !== false}
                          onChange={(e) => onChange('penalizeIncomplete', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-xs text-gray-700">Penalize Incomplete</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}