'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';

interface Pillar {
  id: string;
  name: string;
  description?: string;
  category: string;
  weight: number;
  isActive: boolean;
  topics?: Topic[];
}

interface Topic {
  id: string;
  name: string;
  metrics?: Metric[];
}

interface Metric {
  id: string;
  name: string;
  level: number;
  active: boolean;
}

export default function PillarsPage() {
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPillar, setEditingPillar] = useState<Pillar | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    'OPERATIONAL_EXCELLENCE',
    'RELIABILITY', 
    'SECURITY',
    'PERFORMANCE_EFFICIENCY',
    'COST_OPTIMIZATION',
    'SUSTAINABILITY'
  ];

  useEffect(() => {
    fetchPillars();
  }, []);

  const fetchPillars = async () => {
    try {
      const response = await fetch('/api/admin/pillars');
      if (!response.ok) throw new Error('Failed to fetch pillars');
      const data = await response.json();
      setPillars(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pillars');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePillar = async (pillarData: Partial<Pillar>) => {
    try {
      const response = await fetch('/api/admin/pillars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pillarData),
      });
      if (!response.ok) throw new Error('Failed to create pillar');
      await fetchPillars();
      setShowCreateForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pillar');
    }
  };

  const handleUpdatePillar = async (pillarData: Partial<Pillar>) => {
    try {
      const response = await fetch('/api/admin/pillars', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pillarData),
      });
      if (!response.ok) throw new Error('Failed to update pillar');
      await fetchPillars();
      setEditingPillar(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pillar');
    }
  };

  const handleDeletePillar = async (pillarId: string) => {
    if (!confirm('Are you sure you want to delete this pillar? This will also delete all associated topics and metrics.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/pillars?id=${pillarId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete pillar');
      await fetchPillars();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pillar');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Maturity Pillars</h2>
          <p className="text-gray-600">Manage the main pillars of your maturity assessment</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Pillar</span>
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

      {/* Create Form */}
      {showCreateForm && (
        <PillarForm
          categories={categories}
          onSubmit={handleCreatePillar}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Pillars List */}
      <div className="grid gap-6">
        {pillars.map((pillar) => (
          <div key={pillar.id} className="bg-white rounded-lg shadow border border-gray-200">
            {editingPillar?.id === pillar.id ? (
              <PillarForm
                pillar={editingPillar}
                categories={categories}
                onSubmit={handleUpdatePillar}
                onCancel={() => setEditingPillar(null)}
              />
            ) : (
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{pillar.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pillar.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {pillar.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {pillar.category.replace('_', ' ')}
                      </span>
                    </div>
                    {pillar.description && (
                      <p className="text-gray-600 mb-3">{pillar.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Weight: {pillar.weight}</span>
                      <span>Topics: {pillar.topics?.length || 0}</span>
                      <span>Metrics: {pillar.topics?.reduce((acc, topic) => acc + (topic.metrics?.length || 0), 0) || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingPillar(pillar)}
                      className="p-2 text-gray-400 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePillar(pillar.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Topics Preview */}
                {pillar.topics && pillar.topics.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Topics:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {pillar.topics.map((topic) => (
                        <div key={topic.id} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                          {topic.name}
                          <span className="ml-2 text-xs text-gray-400">
                            ({topic.metrics?.length || 0} metrics)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface PillarFormProps {
  pillar?: Pillar;
  categories: string[];
  onSubmit: (data: Partial<Pillar>) => void;
  onCancel: () => void;
}

function PillarForm({ pillar, categories, onSubmit, onCancel }: PillarFormProps) {
  const [formData, setFormData] = useState({
    name: pillar?.name || '',
    description: pillar?.description || '',
    category: pillar?.category || categories[0],
    weight: pillar?.weight || 1.0,
    isActive: pillar?.isActive !== undefined ? pillar.isActive : true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(pillar ? { ...pillar, ...formData } : formData);
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {pillar ? 'Edit Pillar' : 'Create New Pillar'}
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
            placeholder="Brief description of this pillar..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input w-full"
              required
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 1.0 })}
              className="input w-full"
            />
          </div>
        </div>

        <div>
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
            <span>{pillar ? 'Update' : 'Create'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}