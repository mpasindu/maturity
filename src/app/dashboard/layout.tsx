/**
 * Dashboard Layout
 * 
 * Common layout for dashboard pages
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center space-x-4">
            <a href="/" className="text-gray-600 hover:text-blue-600">
              Home
            </a>
            <span className="text-gray-400">›</span>
            <a href="/dashboard" className="text-blue-600 font-medium">
              Dashboard
            </a>
          </nav>
        </div>
      </div>
      <main>{children}</main>
    </div>
  );
}