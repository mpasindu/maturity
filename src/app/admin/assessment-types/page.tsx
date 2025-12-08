/**
 * Assessment Types Admin Panel
 * 
 * Allows administrators to manage assessment types
 * (add, edit, delete, reorder)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical } from 'lucide-react';

interface AssessmentType {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isActive: boolean;
  orderIndex: number;
}

export default function AssessmentTypesAdmin() {
  const [types, setTypes] = useState<AssessmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    isActive: true
  });

  const categories = ['Software', 'Infrastructure', 'Tools', 'Process', 'Security', 'Other'];

  useEffect(() => {
    loadAssessmentTypes();
  }, []);

  const loadAssessmentTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/assessment-types?includeInactive=true');
      
      if (!response.ok) {
        throw new Error('Failed to load assessment types');
      }
      
      const data = await response.json();
      setTypes(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id?: string) => {
    try {
      const url = '/api/admin/assessment-types';
      const method = id ? 'PUT' : 'POST';
      const payload = id ? { id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save assessment type');
      }

      await loadAssessmentTypes();
      setEditingId(null);
      setShowAddForm(false);
      setFormData({ name: '', description: '', category: '', isActive: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment type?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/assessment-types?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete assessment type');
      }

      await loadAssessmentTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const startEdit = (type: AssessmentType) => {
    setEditingId(type.id);
    setFormData({
      name: type.name,
      description: type.description || '',
      category: type.category || '',
      isActive: type.isActive
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ name: '', description: '', category: '', isActive: true });
  };

  const toggleStatus = async (type: AssessmentType) => {
    try {
      const response = await fetch('/api/admin/assessment-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: type.id,
          name: type.name,
          description: type.description,
          category: type.category,
          isActive: !type.isActive,
          orderIndex: type.orderIndex
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await loadAssessmentTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessment Types</h1>
            <p className="text-gray-600">Manage available assessment types for the platform</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Type
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-red-500 text-xl">❌</span>
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
          <button 
            onClick={() => setError(null)}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add New Type Form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Add New Assessment Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="e.g., Microservice"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={2}
              placeholder="Brief description of this assessment type..."
            />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              Active
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => handleSave()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Assessment Types List */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Current Assessment Types</h3>
        </div>
        
        {types.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📝</div>
            <p>No assessment types configured yet.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add First Type
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {types.map((type) => (
              <div key={type.id} className="px-6 py-4">
                {editingId === type.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        >
                          <option value="">Select category...</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="mr-2"
                        />
                        Active
                      </label>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSave(type.id)}
                        className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-gray-400 cursor-move">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">{type.name}</h4>
                          {type.category && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              {type.category}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs ${
                            type.isActive 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {type.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {type.description && (
                          <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(type)}
                        className={`px-3 py-1 rounded text-sm ${
                          type.isActive
                            ? 'bg-red-100 text-red-600 hover:bg-red-200'
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {type.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => startEdit(type)}
                        className="p-2 text-gray-600 hover:text-blue-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.id)}
                        className="p-2 text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{types.length}</div>
          <div className="text-sm text-gray-600">Total Types</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {types.filter(t => t.isActive).length}
          </div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {types.filter(t => !t.isActive).length}
          </div>
          <div className="text-sm text-red-600">Inactive</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {new Set(types.map(t => t.category).filter(Boolean)).size}
          </div>
          <div className="text-sm text-blue-600">Categories</div>
        </div>
      </div>
    </div>
  );
}