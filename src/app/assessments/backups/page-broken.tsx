'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Users, TrendingUp, Eye, Edit2, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AssessmentType {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
}

interface Assessment {
  id: string;
  name: string;
  organization: string;
  createdAt: string;
  status: string;
  typeId: string;
  type?: {
    name: string;
    category: string;
  };
}

export default function AssessmentsPage() {
  console.log('🚀 AssessmentsPage component is rendering');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    typeId: '',
    organization: 'Sample Organization'
  });
  const router = useRouter();

  // Simple state management
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [testCounter, setTestCounter] = useState(0);

  console.log('🔧 Component state before useEffect:', { isLoading, assessments: assessments.length, mounted, testCounter });

  // SIMPLE TEST EFFECT - just to see if ANY useEffect works
  useEffect(() => {
    console.log('🟥 SIMPLE TEST useEffect EXECUTED!');
    setTestCounter(prev => prev + 1);
    console.log('🟥 Test counter updated');
  }, []);

  // DEBUG EFFECT
  useEffect(() => {
    console.log('🟧 DEBUG useEffect - mounted state change', mounted);
  }, [mounted]);

  // Load assessments on component mount - FORCING EXECUTION
  useEffect(() => {
    console.log('🟨 useEffect for loadAssessments started');
    setMounted(true);
    
    // Force immediate execution
    (async () => {
      try {
        console.log('🟦 Starting to fetch assessments...');
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/assessments');
        console.log('🔗 Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Raw API response:', data);
        console.log('✅ Assessments array:', data.assessments);
        console.log('✅ Assessments count:', data.assessments?.length || 0);
        
        setAssessments(data.assessments || []);
        console.log('🎯 State updated with assessments');
      } catch (err) {
        console.error('❌ Error loading assessments:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assessments');
        setAssessments([]);
      } finally {
        console.log('🏁 Setting isLoading to false');
        setIsLoading(false);
      }
    })();
  }, []);

  // Load assessment types on component mount - FORCING EXECUTION
  useEffect(() => {
    console.log('🟨 useEffect for loadAssessmentTypes started');
    
    (async () => {
      try {
        console.log('🟪 Starting to fetch assessment types...');
        const response = await fetch('/api/admin/assessment-types');
        console.log('🟪 Assessment types response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🟪 Assessment types loaded:', data);
          setAssessmentTypes(data || []);
        }
      } catch (err) {
        console.error('❌ Error loading assessment types:', err);
      }
    })();
  }, []);

  const loadAssessments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/assessments');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Assessments loaded:', data.assessments?.length || 0);
      setAssessments(data.assessments || []);
    } catch (err) {
      console.error('❌ Error loading assessments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assessments');
      setAssessments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssessmentTypes = async () => {
    try {
      const response = await fetch('/api/admin/assessment-types');
      if (response.ok) {
        const result = await response.json();
        const types = result.data || result;
        setAssessmentTypes(types.filter((type: AssessmentType) => type.isActive));
      }
    } catch (error) {
      console.error('Error loading assessment types:', error);
    }
  };

  // Debug logging
  console.log('🔍 Assessments page state:', { 
    assessmentsCount: assessments.length, 
    isLoading, 
    error,
    hasAssessmentTypes: assessmentTypes.length > 0
  });

  async function handleCreateAssessment(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.typeId) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      const selectedType = assessmentTypes.find(type => type.id === formData.typeId);
      
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: selectedType?.name || 'APPLICATION',
          organization: formData.organization,
          status: 'DRAFT',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create assessment');
      }

      const newAssessment = await response.json();

      if (newAssessment?.id) {
        setShowCreateModal(false);
        setFormData({ name: '', typeId: '', organization: 'Sample Organization' });
        
        // Refresh the assessments list
        const refreshResponse = await fetch('/api/assessments');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setAssessments(refreshData.assessments || []);
        }
        
        router.push(`/assessments/${newAssessment.id}`);
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      alert('Failed to create assessment. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteAssessment(id: string) {
    if (confirm('Are you sure you want to delete this assessment?')) {
      try {
        setIsDeleting(true);
        
        const response = await fetch(`/api/assessments/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete assessment');
        }

        // Refresh the assessments list
        const refreshResponse = await fetch('/api/assessments');
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setAssessments(refreshData.assessments || []);
        }
      } catch (error) {
        console.error('Error deleting assessment:', error);
        alert('Failed to delete assessment. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  }

  const filteredAssessments = assessments.filter((assessment: any) => {
    const matchesSearch = assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (assessment.organization?.name || assessment.organization || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || assessment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Debug logging for filtering
  console.log('Filtering debug:', { 
    searchTerm, 
    statusFilter, 
    totalAssessments: assessments.length,
    filteredCount: filteredAssessments.length 
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading assessments...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600">Error loading assessments: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Assessment Dashboard</h1>
          <p className="text-xl text-gray-600">
            Manage and track your enterprise architecture maturity assessments
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                <p className="text-2xl font-bold text-gray-900">{assessments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessments.filter((a: any) => a.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessments.filter((a: any) => a.status === 'IN_PROGRESS').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Edit2 className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assessments.filter((a: any) => a.status === 'DRAFT').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full sm:w-80 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              disabled={isCreating}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Assessment
            </button>
          </div>
        </div>

        {/* Assessment List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredAssessments.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments found</h3>
              <p className="text-gray-600 mb-6">
                {assessments.length === 0
                  ? "Get started by creating your first assessment"
                  : "Try adjusting your search criteria"}
              </p>
              {assessments.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Assessment
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assessment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssessments.map((assessment: any) => (
                    <tr key={assessment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assessment.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {assessment.id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {assessment.type || 'APPLICATION'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {assessment.organization?.name || assessment.organization || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assessment.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : assessment.status === 'IN_PROGRESS'
                            ? 'bg-yellow-100 text-yellow-800'
                            : assessment.status === 'DRAFT'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {assessment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(assessment.startedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${assessment.progress || 0}%`,
                              }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {assessment.progress || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {assessment.status === 'COMPLETED' && (
                            <button
                              onClick={() => router.push(`/assessments/${assessment.id}/results`)}
                              className="text-green-600 hover:text-green-900 p-1"
                              title="View Results"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => router.push(`/assessments/${assessment.id}`)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Edit Assessment"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteAssessment(assessment.id)}
                            disabled={isDeleting}
                            className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                            title="Delete Assessment"
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
        </div>

        {/* Create Assessment Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New Assessment</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateAssessment} className="space-y-4">
                <div>
                  <label htmlFor="assessmentName" className="block text-sm font-medium text-gray-700 mb-1">
                    Assessment Name *
                  </label>
                  <input
                    id="assessmentName"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter assessment name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="assessmentType" className="block text-sm font-medium text-gray-700 mb-1">
                    Assessment Type *
                  </label>
                  <select
                    id="assessmentType"
                    value={formData.typeId}
                    onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select assessment type</option>
                    {assessmentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <input
                    id="organization"
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter organization name"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Assessment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}