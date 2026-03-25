import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import {
  Shield,
  BarChart3,
  Brain,
  Users,
  FileText,
  AlertTriangle,
  Lock,
  Eye,
  Mail,
  User,
  ChevronRight,
} from 'lucide-react';

// ============ DEMO USERS ============

interface DemoUser {
  role: string;
  name: string;
  email: string;
  description: string;
  icon: React.ReactNode;
}

const DEMO_USERS: DemoUser[] = [
  { role: 'Chief Risk Officer', name: 'Sarah Chen', email: 'cro@irmcommand.demo', description: 'Full admin access — all modules', icon: <Shield size={16} /> },
  { role: 'Risk Administrator', name: 'Robert Martinez', email: 'admin@irmcommand.demo', description: 'Risk & control management', icon: <AlertTriangle size={16} /> },
  { role: 'Compliance Officer', name: 'Michael Rodriguez', email: 'compliance@irmcommand.demo', description: 'Compliance & regulatory', icon: <FileText size={16} /> },
  { role: 'TPRM Analyst', name: 'Jennifer Park', email: 'tprm@irmcommand.demo', description: 'Vendor risk management', icon: <Users size={16} /> },
  { role: 'Internal Auditor', name: 'David Thompson', email: 'auditor@irmcommand.demo', description: 'Read-only + audit export', icon: <Eye size={16} /> },
  { role: 'Regulatory Examiner', name: 'Lisa Anderson', email: 'examiner@irmcommand.demo', description: 'Minimal read-only view', icon: <Lock size={16} /> },
];

// ============ FEATURES ============

const PLATFORM_FEATURES = [
  { icon: <BarChart3 size={20} className="text-cyan-400" />, title: 'Enterprise Risk Dashboard', desc: 'Real-time risk scores, KRI breaches, capital-at-risk, and control coverage metrics' },
  { icon: <Users size={20} className="text-blue-400" />, title: 'Third-Party Risk Management', desc: 'Vendor assessment, SLA monitoring, concentration risk, and continuous monitoring' },
  { icon: <FileText size={20} className="text-purple-400" />, title: 'Compliance & Controls', desc: 'SOC 2, Basel III, NIST CSF, ISO 27001 — automated control testing and evidence' },
  { icon: <Brain size={20} className="text-emerald-400" />, title: 'AI Command Center', desc: 'Natural language queries over your risk data with MCP tool registry and RAG knowledge base' },
  { icon: <AlertTriangle size={20} className="text-amber-400" />, title: 'Risk Scoring Studio', desc: 'AI-powered scenario assessment with composite scoring, factor decomposition, and XAI narratives' },
  { icon: <Shield size={20} className="text-rose-400" />, title: 'SOC 2 Control Register', desc: '93+ controls with test results, evidence tracking, and automated compliance gap detection' },
];

// ============ COMPONENT ============

export default function LoginPage() {
  const { login, loginAs, error: authError, isLoading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'demo'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const displayError = localError || authError;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    try {
      if (mode === 'signup') {
        // Stub: In production, this would call supabase.auth.signUp()
        setSignupSuccess(true);
        return;
      }
      // Attempt login (demo mode will auto-handle)
      await login({ provider: email });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Authentication failed.');
    }
  };

  const handleSSO = async () => {
    try {
      setLocalError(null);
      await login({ provider: 'sso' });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'SSO login failed.');
    }
  };

  const handleGoogleOAuth = async () => {
    try {
      setLocalError(null);
      // Stub: In production, this would trigger supabase.auth.signInWithOAuth({ provider: 'google' })
      await login({ provider: 'google' });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Google sign-in failed.');
    }
  };

  const handleDemoLogin = (demoUser: DemoUser) => {
    try {
      setLocalError(null);
      loginAs(demoUser.email);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : `Failed to login as ${demoUser.role}`);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ============ LEFT PANEL: Features ============ */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-navy-950 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between h-full p-10">
          {/* Logo & Branding */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-xl font-bold text-white">I</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">IRM Command</h1>
                <p className="text-xs text-slate-400">Integrated Risk Management</p>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="flex-1 flex flex-col justify-center -mt-4">
            <h2 className="text-lg font-semibold text-white mb-1">Enterprise GRC Platform</h2>
            <p className="text-sm text-slate-400 mb-6">
              AI-powered risk management for G-SIB banks and regulated financial institutions
            </p>

            <div className="space-y-4">
              {PLATFORM_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 group">
                  <div className="mt-0.5 p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 group-hover:border-slate-600 transition">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{feature.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-xs text-slate-500 flex items-center gap-4">
            <span className="flex items-center gap-1"><Lock size={10} /> SOC 2 Type II</span>
            <span>•</span>
            <span>Enterprise SSO + MFA</span>
            <span>•</span>
            <span>RBAC + RLS</span>
          </div>
        </div>
      </div>

      {/* ============ RIGHT PANEL: Auth Form ============ */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo (hidden on desktop) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">I</span>
              </div>
              <h1 className="text-2xl font-bold text-white">IRM Command</h1>
            </div>
            <p className="text-sm text-slate-400">Integrated Risk Management Platform</p>
          </div>

          {/* Auth Mode Tabs */}
          <div className="flex bg-slate-800/50 rounded-lg p-1 mb-6 border border-slate-700/50">
            {[
              { id: 'signin' as const, label: 'Sign In' },
              { id: 'signup' as const, label: 'Sign Up' },
              { id: 'demo' as const, label: 'Demo Access' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setMode(tab.id); setLocalError(null); setSignupSuccess(false); }}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  mode === tab.id
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Error Display */}
          {displayError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/40 rounded-lg">
              <p className="text-red-400 text-sm">{displayError}</p>
            </div>
          )}

          {/* Signup Success */}
          {signupSuccess && mode === 'signup' && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/40 rounded-lg">
              <p className="text-green-400 text-sm font-medium">Account created!</p>
              <p className="text-green-400/70 text-xs mt-1">Check your email to confirm, then sign in.</p>
            </div>
          )}

          {/* ---- SIGN IN / SIGN UP MODE ---- */}
          {(mode === 'signin' || mode === 'signup') && (
            <>
              {/* OAuth Buttons */}
              <div className="space-y-3 mb-5">
                {/* Google OAuth */}
                <button
                  onClick={handleGoogleOAuth}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-gray-50 text-slate-800 font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                </button>

                {/* Microsoft / Entra ID */}
                <button
                  onClick={handleSSO}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg width="18" height="18" viewBox="0 0 23 23">
                    <rect width="10.5" height="10.5" fill="#f25022" />
                    <rect x="12.5" width="10.5" height="10.5" fill="#7fba00" />
                    <rect y="12.5" width="10.5" height="10.5" fill="#00a4ef" />
                    <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#ffb900" />
                  </svg>
                  {mode === 'signup' ? 'Sign up with Microsoft' : 'Sign in with Microsoft'}
                </button>

                {/* Enterprise SSO */}
                <button
                  onClick={handleSSO}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock size={16} />
                  Enterprise SSO (Okta / SAML)
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-slate-950 text-slate-500">or continue with email</span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Min 6 characters' : '••••••••'}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {mode === 'signup' ? 'Create Account' : 'Sign In'}
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Mode switch */}
              <p className="text-center text-xs text-slate-500 mt-4">
                {mode === 'signin' ? (
                  <>Don't have an account?{' '}
                    <button onClick={() => { setMode('signup'); setLocalError(null); }} className="text-cyan-400 hover:text-cyan-300 font-medium">
                      Sign up
                    </button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button onClick={() => { setMode('signin'); setLocalError(null); setSignupSuccess(false); }} className="text-cyan-400 hover:text-cyan-300 font-medium">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </>
          )}

          {/* ---- DEMO ACCESS MODE ---- */}
          {mode === 'demo' && (
            <>
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-white mb-1">Demo Credentials</h3>
                <p className="text-sm text-slate-400">
                  Click any role below to instantly sign in and explore IRM Command with that persona's permissions.
                </p>
              </div>

              <div className="space-y-2.5">
                {DEMO_USERS.map((demoUser) => (
                  <button
                    key={demoUser.email}
                    onClick={() => handleDemoLogin(demoUser)}
                    disabled={isLoading}
                    className="w-full group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-lg p-3.5 transition text-left disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                  >
                    <div className="p-2 rounded-lg bg-slate-700/50 text-cyan-400 group-hover:bg-cyan-600/20 transition">
                      {demoUser.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-white group-hover:text-cyan-400 transition">
                          {demoUser.role}
                        </span>
                        <ChevronRight size={14} className="text-slate-600 group-hover:text-cyan-400 transition" />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{demoUser.name}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs text-slate-500">{demoUser.description}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-5 p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-300">Note:</span> Demo mode uses local authentication with pre-configured roles.
                  In production, all users authenticate via Enterprise SSO (Okta, Microsoft Entra ID) with MFA enforcement and RBAC policies.
                </p>
              </div>
            </>
          )}

          {/* Bottom footer */}
          <div className="mt-8 text-center text-[10px] text-slate-600">
            IRM Command v1.0.0 • Prototype • Built for G-SIB Banks
          </div>
        </div>
      </div>
    </div>
  );
}
