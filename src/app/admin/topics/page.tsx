'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowUp, ArrowDown } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  description?: string;
  pillarId: string;
  orderIndex: number;
  isActive: boolean;
  metrics?: Metric[];
  pillar?: {
    id: string;
    name: string;
  };
}

interface Metric {
  id: string;
  name: string;
  level: number;
  active: boolean;
}

interface Pillar {
  id: string;
  name: string;
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPillars();
    fetchTopics();
  }, []);

  useEffect(() => {
    if (selectedPillar) {
      fetchTopics();
    }
  }, [selectedPillar]);

  const fetchPillars = async () => {
    try {
      const response = await fetch('/api/admin/pillars');
      if (!response.ok) throw new Error('Failed to fetch pillars');
      const data = await response.json();
      setPillars(data);
      if (data.length > 0 && !selectedPillar) {
        setSelectedPillar(data[0].id);
      }
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
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (topicData: Partial<Topic>) => {
    try {
      const response = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...topicData, pillarId: selectedPillar }),
      });
      if (!response.ok) throw new Error('Failed to create topic');
      await fetchTopics();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create topic');
    }
  };

  const handleUpdateTopic = async (topicData: Partial<Topic>) => {
    try {
      const response = await fetch('/api/admin/topics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData),
      });
      if (!response.ok) throw new Error('Failed to update topic');
      await fetchTopics();
      setEditingTopic(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update topic');
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to delete this topic? This will also delete all associated metrics.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/topics?id=${topicId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete topic');
      await fetchTopics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete topic');
    }
  };

  const handleReorderTopic = async (topicId: string, direction: 'up' | 'down') => {
    const currentTopic = topics.find(t => t.id === topicId);
    if (!currentTopic) return;

    const pillarTopics = topics.filter(t => t.pillarId === currentTopic.pillarId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    
    const currentIndex = pillarTopics.findIndex(t => t.id === topicId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= pillarTopics.length) return;

    const otherTopic = pillarTopics[newIndex];
    
    try {
      // Swap order indices
      await Promise.all([
        fetch('/api/admin/topics', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...currentTopic, 
            orderIndex: otherTopic.orderIndex 
          }),
        }),
        fetch('/api/admin/topics', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ...otherTopic, 
            orderIndex: currentTopic.orderIndex 
          }),
        })
      ]);
      
      await fetchTopics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder topics');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pillarTopics = topics.filter(t => t.pillarId === selectedPillar)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assessment Topics</h2>
          <p className="text-gray-600">Manage topics within each maturity pillar</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          disabled={!selectedPillar}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>Add Topic</span>
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

      {/* Pillar Selection */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Pillar
        </label>
        <select
          value={selectedPillar}
          onChange={(e) => setSelectedPillar(e.target.value)}
          className="input w-full max-w-md"
        >
          <option value="">Select a pillar...</option>
          {pillars.map((pillar) => (
            <option key={pillar.id} value={pillar.id}>
              {pillar.name}
            </option>
          ))}
        </select>
      </div>

      {/* Create Form */}
      {showCreateForm && selectedPillar && (
        <TopicForm
          onSubmit={handleCreateTopic}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Topics List */}
      {selectedPillar && (
        <div className="space-y-4">
          {pillarTopics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No topics found for this pillar. Create your first topic above.
            </div>
          ) : (
            pillarTopics.map((topic, index) => (
              <div key={topic.id} className="bg-white rounded-lg shadow border border-gray-200">
                {editingTopic?.id === topic.id ? (
                  <TopicForm
                    topic={editingTopic}
                    onSubmit={handleUpdateTopic}
                    onCancel={() => setEditingTopic(null)}
                  />
                ) : (
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-gray-500">#{topic.orderIndex}</span>
                          <h3 className="text-lg font-medium text-gray-900">{topic.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            topic.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {topic.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {topic.description && (
                          <p className="text-gray-600 mb-3">{topic.description}</p>
                        )}
                        <div className="text-sm text-gray-500">
                          Metrics: {topic.metrics?.length || 0}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleReorderTopic(topic.id, 'up')}
                          disabled={index === 0}
                          className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReorderTopic(topic.id, 'down')}
                          disabled={index === pillarTopics.length - 1}
                          className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingTopic(topic)}
                          className="p-2 text-gray-400 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Metrics Preview */}
                    {topic.metrics && topic.metrics.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Metrics:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {topic.metrics.map((metric) => (
                            <div key={metric.id} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                              {metric.name}
                              <span className="ml-2 text-xs text-gray-400">
                                Level {metric.level}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface TopicFormProps {
  topic?: Topic;
  onSubmit: (data: Partial<Topic>) => void;
  onCancel: () => void;
}

function TopicForm({ topic, onSubmit, onCancel }: TopicFormProps) {
  const [formData, setFormData] = useState({
    name: topic?.name || '',
    description: topic?.description || '',
    orderIndex: topic?.orderIndex || 1,
    isActive: topic?.isActive !== undefined ? topic.isActive : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(topic ? { ...topic, ...formData } : formData);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {topic ? 'Edit Topic' : 'Create New Topic'}
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
            placeholder="Brief description of this topic..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Index
            </label>
            <input
              type="number"
              min="1"
              value={formData.orderIndex}
              onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 1 })}
              className="input w-full"
            />
          </div>

          <div className="flex items-center pt-6">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
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
            <span>{topic ? 'Update' : 'Create'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}