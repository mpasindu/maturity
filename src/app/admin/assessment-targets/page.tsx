'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  Building,
  Server,
  Cloud,
  X,
  Save,
  RefreshCw
} from 'lucide-react';

interface AssessmentTarget {
  id: string;
  name: string;
  type: string;
  description?: string;
  organizationId: string;
  technologyStack?: any;
  cloudProvider?: string;
  createdAt: string;
  updatedAt: string;
  organization: {
    id: string;
    name: string;
  };
  _count: {
    assessmentSessions: number;
    maturityCalculations: number;
  };
}

interface Organization {
  id: string;
  name: string;
}

interface Options {
  targetTypes: string[];
  cloudProviders: string[];
}

export default function AssessmentTargetsAdmin() {
  const [targets, setTargets] = useState<AssessmentTarget[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [options, setOptions] = useState<Options>({ targetTypes: [], cloudProviders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTarget, setEditingTarget] = useState<AssessmentTarget | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    organizationId: '',
    cloudProvider: '',
    technologyStack: '',
  });

  // Load data
  useEffect(() => {
    Promise.all([
      loadTargets(),
      loadOrganizations(),
      loadOptions(),
    ]);
  }, [currentPage, searchTerm, typeFilter]);

  const loadTargets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter && { type: typeFilter }),
      });

      const response = await fetch(`/api/admin/assessment-targets?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTargets(data.targets);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(data.error || 'Failed to load targets');
      }
    } catch (err) {
      setError('Failed to load targets');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations');
      const data = await response.json();
      if (response.ok) {
        setOrganizations(data);
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
    }
  };

  const loadOptions = async () => {
    try {
      const response = await fetch('/api/admin/assessment-targets/options');
      const data = await response.json();
      if (response.ok) {
        setOptions(data);
      }
    } catch (err) {
      console.error('Failed to load options:', err);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingTarget(null);
    setFormData({
      name: '',
      type: '',
      description: '',
      organizationId: '',
      cloudProvider: '',
      technologyStack: '',
    });
    setShowModal(true);
  };

  const openEditModal = (target: AssessmentTarget) => {
    setModalMode('edit');
    setEditingTarget(target);
    setFormData({
      name: target.name,
      type: target.type,
      description: target.description || '',
      organizationId: target.organizationId,
      cloudProvider: target.cloudProvider || '',
      technologyStack: target.technologyStack ? JSON.stringify(target.technologyStack, null, 2) : '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTarget(null);
    setSaving(false);
    setFormData({
      name: '',
      type: '',
      description: '',
      organizationId: '',
      cloudProvider: '',
      technologyStack: '',
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!formData.name || !formData.type || !formData.organizationId) {
        setError('Name, type, and organization are required');
        return;
      }

      // Prepare data
      const data = {
        ...formData,
        technologyStack: formData.technologyStack ? JSON.parse(formData.technologyStack) : null,
        cloudProvider: formData.cloudProvider || null,
      };

      const url = modalMode === 'create' 
        ? '/api/admin/assessment-targets'
        : `/api/admin/assessment-targets/${editingTarget?.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        closeModal();
        loadTargets();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save target');
      }
    } catch (err) {
      setError('Failed to save target');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (target: AssessmentTarget) => {
    if (!confirm(`Are you sure you want to delete "${target.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/assessment-targets/${target.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadTargets();
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete target');
      }
    } catch (err) {
      setError('Failed to delete target');
    }
  };

  const formatType = (type: string) => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CLOUD':
        return <Cloud className="h-4 w-4" />;
      case 'INFRASTRUCTURE':
      case 'PLATFORM':
        return <Server className="h-4 w-4" />;
      default:
        return <Building className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessment Targets</h1>
          <p className="text-gray-600">Manage systems, applications, and platforms for assessment</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Target
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search targets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {options.targetTypes.map((type) => (
                <option key={type} value={type}>
                  {formatType(type)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={loadTargets}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Targets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Loading targets...</p>
          </div>
        ) : targets.length === 0 ? (
          <div className="p-8 text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No targets found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || typeFilter 
                ? "Try adjusting your search criteria" 
                : "Get started by adding your first assessment target"
              }
            </p>
            {!searchTerm && !typeFilter && (
              <button
                onClick={openCreateModal}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Target
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cloud Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {targets.map((target) => (
                  <tr key={target.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getTypeIcon(target.type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {target.name}
                          </div>
                          {target.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {target.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {formatType(target.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {target.organization.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {target.cloudProvider ? formatType(target.cloudProvider) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-xs text-gray-500">
                        {target._count.assessmentSessions} sessions
                        <br />
                        {target._count.maturityCalculations} calculations
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(target)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(target)}
                          className="text-red-600 hover:text-red-900"
                          disabled={target._count.assessmentSessions > 0 || target._count.maturityCalculations > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === 'create' ? 'Create Assessment Target' : 'Edit Assessment Target'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter target name"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  {options.targetTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatType(type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Organization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization *
                </label>
                <select
                  value={formData.organizationId}
                  onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cloud Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cloud Provider
                </label>
                <select
                  value={formData.cloudProvider}
                  onChange={(e) => setFormData({ ...formData, cloudProvider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select cloud provider</option>
                  {options.cloudProviders.map((provider) => (
                    <option key={provider} value={provider}>
                      {formatType(provider)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter description"
                />
              </div>

              {/* Technology Stack */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Technology Stack (JSON)
                </label>
                <textarea
                  value={formData.technologyStack}
                  onChange={(e) => setFormData({ ...formData, technologyStack: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder='{"framework": "React", "language": "TypeScript"}'
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.type || !formData.organizationId}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}