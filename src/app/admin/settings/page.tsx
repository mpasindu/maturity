'use client';

import React, { useState, useEffect } from 'react';
import { Save, Upload, Building2, Loader2, Check, X, AlertCircle, Trash2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  website?: string;
  contactEmail?: string;
  createdAt: string;
  updatedAt: string;
}

const AdminSettingsPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization>({
    id: '',
    name: '',
    description: '',
    logoUrl: '',
    website: '',
    contactEmail: '',
    createdAt: '',
    updatedAt: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    contactEmail: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load organization data on component mount
  useEffect(() => {
    loadOrganizationData();
  }, []);

  // Update form data when organization data changes
  useEffect(() => {
    setFormData({
      name: organization.name || '',
      description: organization.description || '',
      website: organization.website || '',
      contactEmail: organization.contactEmail || '',
    });
    setLogoPreview(organization.logoUrl || '');
  }, [organization]);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/organization');
      const result = await response.json();

      if (result.success) {
        setOrganization(result.data);
      } else {
        showMessage('error', result.error || 'Failed to load organization data');
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
      showMessage('error', 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      showMessage('error', 'Please select a valid image file (JPEG, PNG, GIF, WebP, or SVG)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'File size must be less than 5MB');
      return;
    }

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await fetch('/api/admin/organization/logo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        return result.data.logoUrl;
      } else {
        showMessage('error', result.error || 'Failed to upload logo');
        return null;
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      showMessage('error', 'Failed to upload logo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Upload logo if a new one was selected
      let logoUrl = organization.logoUrl;
      if (logoFile) {
        const uploadedLogoUrl = await uploadLogo();
        if (uploadedLogoUrl) {
          logoUrl = uploadedLogoUrl;
        } else {
          return; // Upload failed, don't proceed with save
        }
      }

      // Save organization data
      const response = await fetch('/api/admin/organization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          logoUrl,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOrganization(result.data);
        setLogoFile(null);
        showMessage('success', 'Organization settings saved successfully');
      } else {
        showMessage('error', result.error || 'Failed to save organization settings');
      }
    } catch (error) {
      console.error('Error saving organization settings:', error);
      showMessage('error', 'Failed to save organization settings');
    } finally {
      setSaving(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading organization settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your organization settings and branding</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-3 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <span className={`text-sm font-medium ${
            message.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {message.text}
          </span>
        </div>
      )}

      {/* Organization Information Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Organization Information</h2>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter organization name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter organization description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              placeholder="contact@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Logo
            </label>
            <div className="space-y-4">
              {/* Logo Preview */}
              {logoPreview && (
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-20 w-20 object-contain border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Upload Button */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>Choose Logo</span>
                </label>
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: JPEG, PNG, GIF, WebP, SVG. Max size: 5MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || uploading || !formData.name.trim()}
          className="inline-flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {(saving || uploading) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>
            {uploading ? 'Uploading...' : saving ? 'Saving...' : 'Save Settings'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;