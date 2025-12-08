'use client';

import React from 'react';
import { BarChart3, Layers, Target, FileText, Users, Database } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { name: 'Maturity Pillars', value: '6', icon: Layers, color: 'bg-blue-500' },
    { name: 'Assessment Topics', value: '8', icon: Target, color: 'bg-green-500' },
    { name: 'Metrics', value: '20+', icon: FileText, color: 'bg-purple-500' },
    { name: 'Active Users', value: '12', icon: Users, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <p className="text-gray-600">Manage your enterprise architecture assessment platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/admin/pillars"
            className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
          >
            <Layers className="h-8 w-8 text-blue-500 mb-2" />
            <h4 className="font-medium text-gray-900">Manage Pillars</h4>
            <p className="text-sm text-gray-600">Add, edit, or remove maturity pillars</p>
          </a>
          
          <a
            href="/admin/topics"
            className="block p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all"
          >
            <Target className="h-8 w-8 text-green-500 mb-2" />
            <h4 className="font-medium text-gray-900">Manage Topics</h4>
            <p className="text-sm text-gray-600">Configure assessment topics and categories</p>
          </a>

          <a
            href="/admin/metrics"
            className="block p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
          >
            <FileText className="h-8 w-8 text-purple-500 mb-2" />
            <h4 className="font-medium text-gray-900">Manage Metrics</h4>
            <p className="text-sm text-gray-600">Define and maintain assessment metrics</p>
          </a>

          <a
            href="/admin/assessment-types"
            className="block p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all"
          >
            <Database className="h-8 w-8 text-orange-500 mb-2" />
            <h4 className="font-medium text-gray-900">Assessment Types</h4>
            <p className="text-sm text-gray-600">Manage assessment types and categories</p>
          </a>

          <a
            href="/admin/users"
            className="block p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all"
          >
            <Users className="h-8 w-8 text-indigo-500 mb-2" />
            <h4 className="font-medium text-gray-900">User Management</h4>
            <p className="text-sm text-gray-600">Manage user accounts and permissions</p>
          </a>

          <a
            href="/admin/reports"
            className="block p-4 border border-gray-200 rounded-lg hover:border-teal-300 hover:shadow-md transition-all"
          >
            <BarChart3 className="h-8 w-8 text-teal-500 mb-2" />
            <h4 className="font-medium text-gray-900">Reports & Analytics</h4>
            <p className="text-sm text-gray-600">View system reports and analytics</p>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Database schema updated with new metric fields</span>
            <span className="text-xs text-gray-400">2 hours ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">6 maturity pillars configured</span>
            <span className="text-xs text-gray-400">4 hours ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-600">CSV data structure implemented</span>
            <span className="text-xs text-gray-400">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}