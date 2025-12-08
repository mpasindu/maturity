/**
 * Main Dashboard Page
 * 
 * Displays the maturity dashboard with traffic light indicators
 */

'use client';

import MaturityDashboard from '@/components/MaturityDashboard';

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <MaturityDashboard />
    </div>
  );
}