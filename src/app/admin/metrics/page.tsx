'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Tag, Filter } from 'lucide-react';

interface Metric {
  id: string;
  name: string;
  description?: string;
  level: number;
  active: boolean;
  tags: string[];
  topicId: string;
  topic?: {
    id: string;
    name: string;
    pillar?: {
      id: string;
      name: string;
    };
  };
}

interface Topic {
  id: string;
  name: string;
  pillarId: string;
  pillar?: {
    id: string;
    name: string;
  };
}

interface Pillar {
  id: string;
  name: string;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMetric, setEditingMetric] = useState<Metric | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Filters
  const [selectedPillar, setSelectedPillar] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedActive, setSelectedActive] = useState<string>('');
  
  const [error, setError] = useState<string | null>(null);

  const levels = [1, 2, 3, 4, 5];

  useEffect(() => {
    fetchPillars();
    fetchTopics();
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (selectedPillar) {
      fetchTopics();
    }
  }, [selectedPillar]);

  useEffect(() => {
    fetchMetrics();
  }, [selectedTopic, selectedLevel, selectedActive]);

  const fetchPillars = async () => {
    try {
      const response = await fetch('/api/admin/pillars');
      if (!response.ok) throw new Error('Failed to fetch pillars');
      const data = await response.json();
      setPillars(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pillars');
    }
  };

  const fetchTopics = async () => {
    try {
      const url = selectedPillar 
        ? `/api/admin/topics?pillarId=${selectedPillar}`
        : '/api/admin/topics';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch topics');
      const data = await response.json();
      setTopics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch topics');
    }
  };

  const fetchMetrics = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedTopic) params.append('topicId', selectedTopic);
      if (selectedLevel) params.append('level', selectedLevel);
      if (selectedActive) params.append('active', selectedActive);

      const url = `/api/admin/metrics${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMetric = async (metricData: Partial<Metric>) => {
    try {
      const response = await fetch('/api/admin/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...metricData, topicId: selectedTopic }),
      });
      if (!response.ok) throw new Error('Failed to create metric');
      await fetchMetrics();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create metric');
    }
  };

  const handleUpdateMetric = async (metricData: Partial<Metric>) => {
    try {
      const response = await fetch('/api/admin/metrics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metricData),
      });
      if (!response.ok) throw new Error('Failed to update metric');
      await fetchMetrics();
      setEditingMetric(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update metric');
    }
  };

  const handleDeleteMetric = async (metricId: string) => {
    if (!confirm('Are you sure you want to delete this metric?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/metrics?id=${metricId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete metric');
      await fetchMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete metric');
    }
  };

  const clearFilters = () => {
    setSelectedPillar('');
    setSelectedTopic('');
    setSelectedLevel('');
    setSelectedActive('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const filteredTopics = selectedPillar 
    ? topics.filter(t => t.pillarId === selectedPillar)
    : topics;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assessment Metrics</h2>
          <p className="text-gray-600">Manage individual metrics within assessment topics</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={!selectedTopic}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>Add Metric</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">{error}</div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </h3>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pillar
            </label>
            <select
              value={selectedPillar}
              onChange={(e) => {
                setSelectedPillar(e.target.value);
                setSelectedTopic(''); // Reset topic when pillar changes
              }}
              className="input w-full"
            >
              <option value="">All Pillars</option>
              {pillars.map((pillar) => (
                <option key={pillar.id} value={pillar.id}>
                  {pillar.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="input w-full"
            >
              <option value="">All Topics</option>
              {filteredTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="input w-full"
            >
              <option value="">All Levels</option>
              {levels.map((level) => (
                <option key={level} value={level.toString()}>
                  Level {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedActive}
              onChange={(e) => setSelectedActive(e.target.value)}
              className="input w-full"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && selectedTopic && (
        <MetricForm
          availableTopics={filteredTopics}
          defaultTopicId={selectedTopic}
          onSubmit={handleCreateMetric}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Metrics List */}
      <div className="space-y-4">
        {metrics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {selectedTopic ? 
              'No metrics found for the selected filters. Create your first metric above.' :
              'Select a topic to view and manage metrics.'
            }
          </div>
        ) : (
          metrics.map((metric) => (
            <div key={metric.id} className="bg-white rounded-lg shadow border border-gray-200">
              {editingMetric?.id === metric.id ? (
                <MetricForm
                  metric={editingMetric}
                  availableTopics={filteredTopics}
                  onSubmit={handleUpdateMetric}
                  onCancel={() => setEditingMetric(null)}
                />
              ) : (
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{metric.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          metric.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {metric.active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Level {metric.level}
                        </span>
                      </div>
                      
                      {metric.description && (
                        <p className="text-gray-600 mb-3">{metric.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span>Topic: {metric.topic?.name}</span>
                        <span>Pillar: {metric.topic?.pillar?.name}</span>
                      </div>

                      {metric.tags && metric.tags.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {metric.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingMetric(metric)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMetric(metric.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface MetricFormProps {
  metric?: Metric;
  availableTopics: Topic[];
  defaultTopicId?: string;
  onSubmit: (data: Partial<Metric>) => void;
  onCancel: () => void;
}

function MetricForm({ metric, availableTopics, defaultTopicId, onSubmit, onCancel }: MetricFormProps) {
  const [formData, setFormData] = useState({
    name: metric?.name || '',
    description: metric?.description || '',
    level: metric?.level || 1,
    active: metric?.active !== undefined ? metric.active : true,
    tags: metric?.tags || [],
    topicId: metric?.topicId || defaultTopicId || '',
  });
  const [newTag, setNewTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(metric ? { ...metric, ...formData } : formData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {metric ? 'Edit Metric' : 'Create New Metric'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input w-full h-20 resize-none"
            placeholder="Brief description of this metric..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic *
            </label>
            <select
              value={formData.topicId}
              onChange={(e) => setFormData({ ...formData, topicId: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">Select topic...</option>
              {availableTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name} ({topic.pillar?.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level *
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              className="input w-full"
              required
            >
              {[1, 2, 3, 4, 5].map((level) => (
                <option key={level} value={level}>
                  Level {level}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
        </div>

        {/* Tags Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          
          {/* Current Tags */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          
          {/* Add Tag Input */}
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="input flex-1"
              placeholder="Add a tag..."
            />
            <button
              type="button"
              onClick={addTag}
              className="btn-secondary"
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Cancel</span>
          </button>
          <button
            type="submit"
            className="btn-primary flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{metric ? 'Update' : 'Create'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}