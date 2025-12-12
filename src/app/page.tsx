import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Tech Background with RAG Visualization */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        
        {/* RAG Orbs - Representing Retrieval, Augmentation, Generation */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-purple-300 to-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-gradient-to-br from-blue-300 to-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/3 w-72 h-72 bg-gradient-to-br from-indigo-300 to-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-1/4 w-56 h-56 bg-gradient-to-br from-pink-300 to-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{animationDelay: '3s'}}></div>
        
        {/* Additional smaller orbs for depth */}
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-gradient-to-br from-cyan-300 to-cyan-100 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-gradient-to-br from-violet-300 to-violet-100 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse" style={{animationDelay: '2.5s'}}></div>
        
        {/* Subtle Radial Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.05),transparent_50%)]"></div>
      </div>

      <div className="relative container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-block mb-6 px-4 py-2 bg-purple-50 rounded-full border border-purple-200">
            <span className="text-purple-600 text-sm font-medium">⚡ Powered by AI & RAG Technology</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-transparent bg-clip-text leading-tight">
            Enterprise Architecture
            <br />
            Maturity Assessment
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
            Transform your enterprise architecture with AI-powered maturity assessments. 
            Leverage Retrieval-Augmented Generation for real-time insights and recommendations.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/assessments"
              className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span className="relative z-10">🎯 Start Assessment</span>
            </Link>
            <Link 
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300 border border-gray-200 hover:scale-105 shadow-sm hover:shadow-md"
            >
              📊 View Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Bar - Tech Stats with Icons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          <div className="bg-gradient-to-br from-purple-50 to-white backdrop-blur-sm rounded-2xl p-6 text-center border border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all duration-300 shadow-sm">
            <div className="text-5xl mb-3">🏛️</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text mb-2">5</div>
            <div className="text-gray-600 text-sm font-medium">Architecture Pillars</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-white backdrop-blur-sm rounded-2xl p-6 text-center border border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300 shadow-sm">
            <div className="text-5xl mb-3">🔬</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-transparent bg-clip-text mb-2">15+</div>
            <div className="text-gray-600 text-sm font-medium">Analysis Topics</div>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-white backdrop-blur-sm rounded-2xl p-6 text-center border border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all duration-300 shadow-sm">
            <div className="text-5xl mb-3">📊</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 text-transparent bg-clip-text mb-2">50+</div>
            <div className="text-gray-600 text-sm font-medium">Metrics & KPIs</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-white backdrop-blur-sm rounded-2xl p-6 text-center border border-green-100 hover:border-green-300 hover:shadow-lg transition-all duration-300 shadow-sm">
            <div className="text-5xl mb-3">🧠</div>
            <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-transparent bg-clip-text mb-2">RAG</div>
            <div className="text-gray-600 text-sm font-medium">AI Assistant</div>
          </div>
        </div>

        {/* Feature Cards - Tech Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="group bg-gradient-to-br from-purple-50 to-white backdrop-blur-sm rounded-3xl shadow-md p-8 text-center border border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all duration-500 hover:scale-105">
            <div className="text-6xl mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">⚡</div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">Real-Time Scoring</h3>
            <p className="text-gray-600 leading-relaxed">
              Advanced traffic light system with dynamic maturity scoring based on 
              configurable weights and intelligent algorithms.
            </p>
          </div>
          
          <div className="group bg-gradient-to-br from-blue-50 to-white backdrop-blur-sm rounded-3xl shadow-md p-8 text-center border border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-500 hover:scale-105">
            <div className="text-6xl mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">�</div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-transparent bg-clip-text">RAG AI Engine</h3>
            <p className="text-gray-600 leading-relaxed">
              Retrieval-Augmented Generation powered by Claude 3.5 for contextual 
              insights, best practices, and personalized recommendations.
            </p>
          </div>
          
          <div className="group bg-gradient-to-br from-pink-50 to-white backdrop-blur-sm rounded-3xl shadow-md p-8 text-center border border-pink-100 hover:border-pink-300 hover:shadow-xl transition-all duration-500 hover:scale-105">
            <div className="text-6xl mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">�</div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-rose-600 text-transparent bg-clip-text">Live Analytics</h3>
            <p className="text-gray-600 leading-relaxed">
              Real-time data processing with multi-dimensional drill-down from 
              overall scores to granular metric analysis.
            </p>
          </div>
        </div>

        {/* Maturity Levels - Clean White Widget */}
        <div className="bg-gradient-to-br from-gray-50 to-white backdrop-blur-sm rounded-3xl shadow-lg p-10 mb-20 border border-gray-200">
          <h2 className="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">Maturity Assessment Framework</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 border border-red-200 rounded-2xl bg-gradient-to-b from-red-50 to-white hover:from-red-100 hover:border-red-300 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md">
              <div className="text-4xl mb-3">🔴</div>
              <h4 className="font-bold text-xl text-red-600 mb-2">Initial</h4>
              <div className="text-red-500 font-semibold mb-2">0-1.3</div>
              <p className="text-sm text-gray-600">Ad-hoc processes, reactive approach, minimal documentation</p>
            </div>
            <div className="text-center p-6 border border-amber-200 rounded-2xl bg-gradient-to-b from-amber-50 to-white hover:from-amber-100 hover:border-amber-300 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md">
              <div className="text-4xl mb-3">🟡</div>
              <h4 className="font-bold text-xl text-amber-600 mb-2">Managed</h4>
              <div className="text-amber-500 font-semibold mb-2">1.3-2.0</div>
              <p className="text-sm text-gray-600">Documented processes, basic controls in place</p>
            </div>
            <div className="text-center p-6 border border-green-200 rounded-2xl bg-gradient-to-b from-green-50 to-white hover:from-green-100 hover:border-green-300 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md">
              <div className="text-4xl mb-3">🟢</div>
              <h4 className="font-bold text-xl text-green-600 mb-2">Defined</h4>
              <div className="text-green-500 font-semibold mb-2">2.0-2.7</div>
              <p className="text-sm text-gray-600">Standardized processes, good practices established</p>
            </div>
            <div className="text-center p-6 border border-blue-200 rounded-2xl bg-gradient-to-b from-blue-50 to-white hover:from-blue-100 hover:border-blue-300 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md">
              <div className="text-4xl mb-3">✨</div>
              <h4 className="font-bold text-xl text-blue-600 mb-2">Optimizing</h4>
              <div className="text-blue-500 font-semibold mb-2">2.7-3.0</div>
              <p className="text-sm text-gray-600">Continuous improvement, innovation driven</p>
            </div>
          </div>
        </div>

        {/* Assessment Pillars - Tech Icons */}
        <div className="bg-gradient-to-br from-indigo-50 to-white backdrop-blur-sm rounded-3xl shadow-lg p-10 mb-16 border border-indigo-200">
          <h2 className="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Five Key Assessment Pillars</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center p-6 bg-gradient-to-b from-purple-50 to-white rounded-2xl hover:from-purple-100 transition-all duration-300 hover:scale-105 border border-purple-200 hover:border-purple-300 shadow-sm hover:shadow-md">
              <div className="text-5xl mb-4">�</div>
              <h4 className="font-bold text-lg mb-3 text-purple-700">Security</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Zero-trust architecture, encryption, compliance & threat detection
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-b from-blue-50 to-white rounded-2xl hover:from-blue-100 transition-all duration-300 hover:scale-105 border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md">
              <div className="text-5xl mb-4">�</div>
              <h4 className="font-bold text-lg mb-3 text-blue-700">Reliability</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                High availability, auto-scaling, disaster recovery & fault tolerance
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-b from-pink-50 to-white rounded-2xl hover:from-pink-100 transition-all duration-300 hover:scale-105 border border-pink-200 hover:border-pink-300 shadow-sm hover:shadow-md">
              <div className="text-5xl mb-4">🚀</div>
              <h4 className="font-bold text-lg mb-3 text-pink-700">Performance</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Low latency, high throughput, caching & resource optimization
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-b from-green-50 to-white rounded-2xl hover:from-green-100 transition-all duration-300 hover:scale-105 border border-green-200 hover:border-green-300 shadow-sm hover:shadow-md">
              <div className="text-5xl mb-4">�</div>
              <h4 className="font-bold text-lg mb-3 text-green-700">Cost</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                FinOps practices, resource tagging, budget alerts & optimization
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-b from-amber-50 to-white rounded-2xl hover:from-amber-100 transition-all duration-300 hover:scale-105 border border-amber-200 hover:border-amber-300 shadow-sm hover:shadow-md">
              <div className="text-5xl mb-4">🛠️</div>
              <h4 className="font-bold text-lg mb-3 text-amber-700">Operations</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                CI/CD, IaC, observability, automation & incident management
              </p>
            </div>
          </div>
        </div>

        {/* Key Features Section - Tech Enhanced */}
        <div className="bg-gradient-to-br from-slate-50 to-white backdrop-blur-sm rounded-3xl shadow-lg p-10 mb-16 border border-slate-200">
          <h2 className="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-slate-700 to-indigo-700 text-transparent bg-clip-text">Platform Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-white hover:from-purple-100 transition-all duration-300 border border-purple-200 hover:border-purple-300 shadow-sm hover:shadow-md">
              <div className="text-3xl">🔍</div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-purple-700">Deep Analysis</h4>
                <p className="text-gray-600">Multi-layer assessment from infrastructure to application architecture</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-white hover:from-blue-100 transition-all duration-300 border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md">
              <div className="text-3xl">⚙️</div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-blue-700">Dynamic Weighting</h4>
                <p className="text-gray-600">Configurable scoring algorithms with custom weight distributions</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-pink-50 to-white hover:from-pink-100 transition-all duration-300 border border-pink-200 hover:border-pink-300 shadow-sm hover:shadow-md">
              <div className="text-3xl">💡</div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-pink-700">AI Recommendations</h4>
                <p className="text-gray-600">Context-aware suggestions powered by retrieval-augmented generation</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-white hover:from-green-100 transition-all duration-300 border border-green-200 hover:border-green-300 shadow-sm hover:shadow-md">
              <div className="text-3xl">📋</div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-green-700">Compliance Tracking</h4>
                <p className="text-gray-600">Complete audit trail with versioned assessment history</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-white hover:from-amber-100 transition-all duration-300 border border-amber-200 hover:border-amber-300 shadow-sm hover:shadow-md">
              <div className="text-3xl">👥</div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-amber-700">Team Collaboration</h4>
                <p className="text-gray-600">Role-based access with Admin, Assessor & Viewer permissions</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-white hover:from-indigo-100 transition-all duration-300 border border-indigo-200 hover:border-indigo-300 shadow-sm hover:shadow-md">
              <div className="text-3xl">🏢</div>
              <div>
                <h4 className="font-bold text-lg mb-2 text-indigo-700">Multi-Tenancy</h4>
                <p className="text-gray-600">Enterprise-grade isolation for multiple organizations</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section - Clean White Widget */}
        <div className="text-center bg-gradient-to-br from-indigo-50 to-white backdrop-blur-sm rounded-3xl shadow-lg p-12 border border-indigo-200 hover:border-indigo-300 transition-all duration-300">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-transparent bg-clip-text">Ready to Transform Your Enterprise?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Start your first assessment today and unlock insights that drive real architectural improvements.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/assessments"
              className="group relative inline-flex items-center px-10 py-5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <span className="relative z-10">🚀 Start Your Assessment</span>
            </Link>
            <Link 
              href="/admin"
              className="inline-flex items-center px-10 py-5 bg-white text-gray-700 text-xl font-bold rounded-xl hover:bg-gray-50 transition-all duration-300 border border-gray-200 hover:scale-105 shadow-sm hover:shadow-md"
            >
              ⚙️ Admin Panel
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-12">
          <div className="flex items-center justify-center gap-8 text-gray-500">
            <Link 
              href="/dashboard" 
              className="hover:text-purple-600 transition-colors font-medium"
            >
              Dashboard →
            </Link>
            <Link 
              href="/assessments" 
              className="hover:text-purple-600 transition-colors font-medium"
            >
              Assessments →
            </Link>
            <Link 
              href="/admin" 
              className="hover:text-purple-600 transition-colors font-medium"
            >
              Admin →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
