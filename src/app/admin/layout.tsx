'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, BarChart3, Users, Database, Target, Layers, FileText, Building, Calculator } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Assessment Targets', href: '/admin/assessment-targets', icon: Building },
    { name: 'Pillars', href: '/admin/pillars', icon: Layers },
    { name: 'Topics', href: '/admin/topics', icon: Target },
    { name: 'Metrics', href: '/admin/metrics', icon: FileText },
    { name: 'Assessment Types', href: '/admin/assessment-types', icon: Database },
    { name: 'Scoring Rules', href: '/admin/scoring-rules', icon: Calculator },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Settings className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Admin Panel</span>
          </div>
        </div>
        
        <nav className="mt-6">
          <div className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <h1 className="text-lg font-semibold text-gray-900">
            Enterprise Architecture Maturity - Admin
          </h1>
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Application
            </Link>
          </div>
        </div>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}