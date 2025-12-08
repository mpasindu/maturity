'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Users, TrendingUp, Eye, Edit2, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Assessment {
  id: string;
  name: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
    description: string;
  };
  status: string;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  progress?: number;
  frequency?: string;
  scheduledDate?: string;
  nextAssessmentDate?: string;
}

const AssessmentsPage: React.FC = () => {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showNewAssessmentModal, setShowNewAssessmentModal] = useState(false);
  const [assessmentTypes, setAssessmentTypes] = useState<any[]>([]);
  const [assessmentTargets, setAssessmentTargets] = useState<any[]>([]);
  const [newAssessment, setNewAssessment] = useState({
    targetId: '',
    organizationId: 'org-1', // Default organization
    description: '',
    frequency: 'quarterly', // Default frequency
    scheduledDate: '', // Assessment scheduled date
    nextAssessmentDate: '' // Next assessment date based on frequency
  });

  // Load assessments data
  useEffect(() => {
    loadAssessmentsData();
    loadAssessmentTypes();
    loadAssessmentTargets();
  }, []);

  const loadAssessmentTypes = async () => {
    try {
      const response = await fetch('/api/admin/assessment-types');
      if (response.ok) {
        const data = await response.json();
        setAssessmentTypes(data.data || []);
      }
    } catch (error) {
      console.error('Error loading assessment types:', error);
    }
  };

  const loadAssessmentTargets = async () => {
    try {
      const response = await fetch('/api/dashboard/maturity');
      const result = await response.json();
      setAssessmentTargets(result.data || []);
    } catch (error) {
      console.error('Error loading assessment targets:', error);
      setAssessmentTargets([]);
    }
  };  // Calculate next assessment date based on frequency
  const calculateNextAssessmentDate = (scheduledDate: string, frequency: string): string => {
    if (!scheduledDate) return '';
    
    const date = new Date(scheduledDate);
    
    switch (frequency) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        return '';
    }
    
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  };

  // Update next assessment date when scheduled date or frequency changes
  useEffect(() => {
    if (newAssessment.scheduledDate && newAssessment.frequency) {
      const nextDate = calculateNextAssessmentDate(newAssessment.scheduledDate, newAssessment.frequency);
      setNewAssessment(prev => ({ ...prev, nextAssessmentDate: nextDate }));
    }
  }, [newAssessment.scheduledDate, newAssessment.frequency]);

  const loadAssessmentsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/assessments');
      
      if (!response.ok) {
        throw new Error('Failed to load assessments data');
      }
      
      const data = await response.json();
      setAssessments(data.assessments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createNewAssessment = async () => {
    try {
      setCreating(true);
      
      // Validate required fields
      if (!newAssessment.targetId) {
        setError('Assessment target is required');
        return;
      }

      if (!newAssessment.scheduledDate) {
        setError('Scheduled date is required');
        return;
      }

      // Find the selected target to get its name
      const selectedTarget = assessmentTargets.find(target => target.id === newAssessment.targetId);
      const assessmentName = selectedTarget ? `${selectedTarget.name} Assessment` : 'New Assessment';

      // Calculate next assessment date
      const nextDate = calculateNextAssessmentDate(newAssessment.scheduledDate, newAssessment.frequency);

      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: assessmentName,
          targetId: newAssessment.targetId,
          organizationId: newAssessment.organizationId,
          description: newAssessment.description.trim(),
          frequency: newAssessment.frequency,
          scheduledDate: newAssessment.scheduledDate,
          nextAssessmentDate: nextDate,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create assessment');
      }

      const createdAssessment = await response.json();
      
      // Reset form and close modal
      setNewAssessment({
        targetId: '',
        organizationId: 'org-1',
        description: '',
        frequency: 'quarterly',
        scheduledDate: '',
        nextAssessmentDate: ''
      });
      setShowNewAssessmentModal(false);
      setError(null);
      
      // Reload assessments list
      await loadAssessmentsData();
      
      // Navigate to the new assessment
      router.push(`/assessments/${createdAssessment.id}`);
    } catch (error) {
      console.error('Error creating assessment:', error);
      setError('Failed to create assessment');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) {
      return;
    }

    try {
      setDeleting(id);
      const response = await fetch(`/api/assessments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete assessment');
      }

      // Reload assessments after deletion
      await loadAssessmentsData();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      setError('Failed to delete assessment');
    } finally {
      setDeleting(null);
    }
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch = assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessment.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || assessment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
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
            <div className="text-center">
              <div className="text-red-600 mb-4">Error loading assessments: {error}</div>
              <button 
                onClick={loadAssessmentsData}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back to Dashboard Link */}
        <div className="mb-6">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

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
                  {assessments.filter((a) => a.status === 'COMPLETED').length}
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
                  {assessments.filter((a) => a.status === 'IN_PROGRESS').length}
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
                  {assessments.filter((a) => a.status === 'DRAFT').length}
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
              onClick={() => setShowNewAssessmentModal(true)}
              disabled={creating}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="h-5 w-5 mr-2" />
              {creating ? 'Creating...' : 'New Assessment'}
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
                  onClick={createNewAssessment}
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
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
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
                  {filteredAssessments.map((assessment) => (
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
                          {assessment.organization?.name || 'N/A'}
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
                        <div>
                          <div className="text-sm text-gray-900 capitalize">
                            {assessment.frequency || 'Not set'}
                          </div>
                          <div className="text-xs text-gray-500" suppressHydrationWarning>
                            {assessment.nextAssessmentDate 
                              ? `Next: ${new Date(assessment.nextAssessmentDate).toLocaleDateString()}`
                              : 'No schedule'
                            }
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" suppressHydrationWarning>
                        {new Date(assessment.createdAt).toLocaleDateString()}
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
                            disabled={deleting === assessment.id}
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

        {/* New Assessment Modal */}
        {showNewAssessmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Assessment</h3>
              
              <div className="space-y-4">
                {/* Assessment Target */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assessment Target *
                  </label>
                  <select
                    value={newAssessment.targetId}
                    onChange={(e) => setNewAssessment({...newAssessment, targetId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select assessment target</option>
                    {assessmentTargets.map((target) => (
                      <option key={target.id} value={target.id}>
                        {target.name} ({target.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Organization */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <select
                    value={newAssessment.organizationId}
                    onChange={(e) => setNewAssessment({...newAssessment, organizationId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="org-1">Example Corporation</option>
                  </select>
                </div>

                {/* Assessment Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assessment Frequency *
                  </label>
                  <select
                    value={newAssessment.frequency}
                    onChange={(e) => setNewAssessment({...newAssessment, frequency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                {/* Scheduled Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    value={newAssessment.scheduledDate}
                    onChange={(e) => setNewAssessment({...newAssessment, scheduledDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split('T')[0]} // Minimum date is today
                    suppressHydrationWarning
                  />
                </div>

                {/* Next Assessment Date (Auto-calculated) */}
                {newAssessment.nextAssessmentDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Next Assessment Date
                    </label>
                    <input
                      type="date"
                      value={newAssessment.nextAssessmentDate}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically calculated based on frequency
                    </p>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newAssessment.description}
                    onChange={(e) => setNewAssessment({...newAssessment, description: e.target.value})}
                    placeholder="Enter assessment description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                    {error}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowNewAssessmentModal(false);
                    setNewAssessment({
                      targetId: '',
                      organizationId: 'org-1',
                      description: '',
                      frequency: 'quarterly',
                      scheduledDate: '',
                      nextAssessmentDate: ''
                    });
                    setError(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewAssessment}
                  disabled={creating || !newAssessment.targetId || !newAssessment.scheduledDate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Assessment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentsPage;