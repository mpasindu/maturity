'use client';

import Link from 'next/link';

export default function WileyLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold tracking-wider text-slate-900" style={{ fontFamily: 'serif' }}>
              WILEY
            </div>
            <Link 
              href="/dashboard"
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-all font-medium shadow-lg"
            >
              Access Platform
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Compact */}
      <section className="flex-1 flex items-center justify-center py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-red-700 to-blue-900 mb-3">
              Wiley Cloud Excellence Strategy
            </h1>
            <p className="text-lg text-slate-700 max-w-3xl mx-auto font-medium">
              Unified multi-cloud governance, financial operations, and maturity assessment
            </p>
          </div>
        </div>
      </section>

      {/* Wiley Architecture Layers Detailed - MOVED TO TOP */}
      <section className="py-12 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-slate-900 to-blue-900 text-transparent bg-clip-text">
            Full Architecture Layers
          </h2>
          
          {/* Layer 3 - Cloud */}
          <div className="mb-8 bg-white rounded-xl p-6 border border-blue-200 shadow-md">
            <h3 className="text-xl font-bold text-blue-900 mb-4">🌥️ Layer 3: Cloud Platforms</h3>
            <p className="text-slate-700 mb-4">Foundation layer with three leading cloud providers ensuring redundancy and choice</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <img src="/gcp-logo.png" alt="GCP" className="h-8 object-contain mx-auto mb-2" />
                <p className="text-sm font-medium">Google Cloud Platform</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <img src="/aws-logo.png" alt="AWS" className="h-8 object-contain mx-auto mb-2" />
                <p className="text-sm font-medium">AWS Control Tower</p>
              </div>
              <div className="text-center p-4 bg-sky-50 rounded-lg border border-sky-200">
                <img src="/azure-logo.png" alt="Azure" className="h-8 object-contain mx-auto mb-2" />
                <p className="text-sm font-medium">Microsoft Azure</p>
              </div>
            </div>
          </div>

          {/* Layer 2 - Control */}
          <div className="mb-8 bg-white rounded-xl p-6 border border-purple-200 shadow-md">
            <h3 className="text-xl font-bold text-purple-900 mb-4">⚙️ Layer 2: Control & Governance</h3>
            <p className="text-slate-700 mb-4">Management layer providing financial operations and policy enforcement across all clouds</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <img src="/vegacloud.png" alt="Vega" className="h-6 object-contain" />
                  <h4 className="font-bold text-green-900">Vega Cloud</h4>
                </div>
                <p className="text-sm text-slate-700">FinOps Platform - Cost optimization, budget tracking, multi-cloud spend visibility</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <img src="/stacklet-logo.svg" alt="Stacklet" className="h-6 object-contain" />
                  <h4 className="font-bold text-purple-900">Stacklet</h4>
                </div>
                <p className="text-sm text-slate-700">Governance - Policy enforcement, compliance automation, security standards</p>
              </div>
            </div>
          </div>

          {/* Layer 1 - Reporting */}
          <div className="bg-white rounded-xl p-6 border border-red-200 shadow-md">
            <h3 className="text-xl font-bold text-red-900 mb-4">📊 Layer 1: Maturity Assessment & Reporting</h3>
            <p className="text-slate-700 mb-4">Intelligence layer providing comprehensive enterprise architecture maturity evaluation</p>
            <div className="flex items-center justify-center mb-4">
              <img src="/maturityiq.svg" alt="MaturityIQ" className="h-32 object-contain drop-shadow-lg" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                <div className="font-bold text-yellow-900 mb-2">Tools & DevOps</div>
                <p className="text-xs text-slate-600">CI/CD, Automation, Monitoring</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                <div className="font-bold text-orange-900 mb-2">Applications</div>
                <p className="text-xs text-slate-600">Architecture, Performance, Scalability</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <div className="font-bold text-green-900 mb-2">Platforms</div>
                <p className="text-xs text-slate-600">Infrastructure, Services, APIs</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="font-bold text-blue-900 mb-2">Cloud Strategy</div>
                <p className="text-xs text-slate-600">Multi-cloud, Migration, Optimization</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wiley Multi-Cloud Strategy Stats */}
      <section className="py-12 bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-slate-900 to-blue-900 text-transparent bg-clip-text">
            Wiley Multi-Cloud Excellence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-all">
              <div className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 text-transparent bg-clip-text mb-2">3</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Cloud Platforms</h3>
              <p className="text-slate-600 text-sm">GCP, AWS, Azure integrated with unified governance</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-all">
              <div className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-transparent bg-clip-text mb-2">2</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Control Layers</h3>
              <p className="text-slate-600 text-sm">FinOps (Vega) & Governance (Stacklet) automation</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 hover:shadow-lg transition-all">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text mb-2">∞</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Maturity Metrics</h3>
              <p className="text-slate-600 text-sm">Continuous assessment across all dimensions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Wiley Capabilities */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-slate-900 to-blue-900 text-transparent bg-clip-text">
            Wiley Platform Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-200 hover:shadow-lg transition-all">
              <div className="text-5xl mb-4">🌐</div>
              <h3 className="text-xl font-bold text-red-900 mb-3">Multi-Cloud Strategy</h3>
              <p className="text-slate-700">Unified management across Google Cloud, AWS, and Azure with consistent policies and controls</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-green-900 mb-3">FinOps Excellence</h3>
              <p className="text-slate-700">Cost optimization and spend visibility powered by Vega Cloud for maximum cloud value</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-all">
              <div className="text-5xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-purple-900 mb-3">Governance Compliance</h3>
              <p className="text-slate-700">Automated policy enforcement and compliance tracking with Stacklet governance platform</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-slate-900 to-blue-900 text-transparent bg-clip-text">
            Wiley Platform Benefits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 hover:shadow-lg transition-all">
              <div className="text-3xl">🎯</div>
              <div>
                <h4 className="font-bold text-lg text-red-900 mb-2">Unified Visibility</h4>
                <p className="text-slate-700">Single pane of glass across all cloud platforms with centralized metrics and KPIs</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 hover:shadow-lg transition-all">
              <div className="text-3xl">💡</div>
              <div>
                <h4 className="font-bold text-lg text-green-900 mb-2">Cost Intelligence</h4>
                <p className="text-slate-700">Reduce cloud spend by 20-30% with Vega's FinOps automation and recommendations</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 hover:shadow-lg transition-all">
              <div className="text-3xl">🛡️</div>
              <div>
                <h4 className="font-bold text-lg text-purple-900 mb-2">Security Compliance</h4>
                <p className="text-slate-700">Automated policy enforcement ensuring 99%+ compliance with security standards</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 hover:shadow-lg transition-all">
              <div className="text-3xl">📈</div>
              <div>
                <h4 className="font-bold text-lg text-blue-900 mb-2">Continuous Improvement</h4>
                <p className="text-slate-700">Data-driven insights and actionable recommendations for architectural maturity growth</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-12 bg-gradient-to-r from-red-50 to-orange-50 border-t border-red-200">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-600 text-transparent bg-clip-text">
            Ready to Transform Your Architecture?
          </h2>
          <p className="text-lg text-slate-700 mb-6 max-w-2xl mx-auto">
            Start your enterprise architecture maturity journey with Wiley's comprehensive multi-cloud assessment platform.
          </p>
          <Link 
            href="/dashboard"
            className="inline-block px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-lg hover:from-red-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
          >
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer - Compact */}
      <footer className="bg-slate-900 text-slate-400 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>&copy; 2025 Wiley. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
