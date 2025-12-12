import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Enterprise Architecture Maturity Assessment
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Comprehensive platform for evaluating enterprise architecture maturity across 
            applications, systems, and platforms with dynamic scoring and visual insights.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              📊 View Dashboard
            </Link>
            <Link 
              href="/assessments"
              className="inline-flex items-center px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              ➕ New Assessment
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🟢🟡🔴</div>
            <h3 className="text-xl font-semibold mb-4">Traffic Light System</h3>
            <p className="text-gray-600">
              Visual maturity indicators with red, amber, and green color coding 
              based on comprehensive scoring algorithms.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-4">Dynamic Calculations</h3>
            <p className="text-gray-600">
              Real-time maturity calculations with weighted scoring across 
              security, reliability, performance, cost, and operational pillars.
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-4">Detailed Insights</h3>
            <p className="text-gray-600">
              Drill down from overall scores to pillar, topic, and metric levels 
              with detailed recommendations and next actions.
            </p>
          </div>
        </div>

        {/* Maturity Levels */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Maturity Assessment Framework</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="text-2xl mb-2">🔴</div>
              <h4 className="font-semibold text-red-800">Initial (0-1.3)</h4>
              <p className="text-sm text-red-600">Ad-hoc processes, reactive approach</p>
            </div>
            <div className="text-center p-4 border border-amber-200 rounded-lg bg-amber-50">
              <div className="text-2xl mb-2">🟡</div>
              <h4 className="font-semibold text-amber-800">Managed (1.3-2.0)</h4>
              <p className="text-sm text-amber-600">Documented processes, basic controls</p>
            </div>
            <div className="text-center p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="text-2xl mb-2">🟢</div>
              <h4 className="font-semibold text-green-800">Defined (2.0-2.7)</h4>
              <p className="text-sm text-green-600">Standardized processes, good practices</p>
            </div>
            <div className="text-center p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="text-2xl mb-2">✨</div>
              <h4 className="font-semibold text-blue-800">Optimizing (2.7-3.0)</h4>
              <p className="text-sm text-blue-600">Continuous improvement, innovation</p>
            </div>
          </div>
        </div>

        {/* Assessment Pillars */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Assessment Pillars</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center p-4">
              <div className="text-3xl mb-3">🔒</div>
              <h4 className="font-semibold mb-2">Security</h4>
              <p className="text-sm text-gray-600">
                Security controls, monitoring, compliance, and risk management
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-3">🛡️</div>
              <h4 className="font-semibold mb-2">Reliability</h4>
              <p className="text-sm text-gray-600">
                High availability, disaster recovery, fault tolerance
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-3">⚡</div>
              <h4 className="font-semibold mb-2">Performance</h4>
              <p className="text-sm text-gray-600">
                Response times, throughput, resource optimization
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-3">💰</div>
              <h4 className="font-semibold mb-2">Cost</h4>
              <p className="text-sm text-gray-600">
                Cost optimization, resource efficiency, financial planning
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-3xl mb-3">⚙️</div>
              <h4 className="font-semibold mb-2">Operations</h4>
              <p className="text-sm text-gray-600">
                Process automation, monitoring, incident management
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="text-center mt-16">
          <div className="flex items-center justify-center gap-6">
            <Link 
              href="/dashboard" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View Dashboard →
            </Link>
            <Link 
              href="/assessments" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Browse Assessments →
            </Link>
            <Link 
              href="/admin" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Admin Panel →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}