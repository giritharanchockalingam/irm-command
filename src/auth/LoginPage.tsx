import React, { useState } from 'react';
import { useAuth } from './AuthContext';

interface DemoUser {
  role: string;
  name: string;
  email: string;
  description: string;
}

const DEMO_USERS: DemoUser[] = [
  { role: 'Chief Risk Officer', name: 'Sarah Chen', email: 'cro@irmcommand.demo', description: 'Full admin access' },
  { role: 'Risk Administrator', name: 'Robert Martinez', email: 'admin@irmcommand.demo', description: 'Risk & control management' },
  { role: 'Compliance Officer', name: 'Michael Rodriguez', email: 'compliance@irmcommand.demo', description: 'Compliance & controls' },
  { role: 'TPRM Analyst', name: 'Jennifer Park', email: 'tprm@irmcommand.demo', description: 'Vendor risk management' },
  { role: 'Internal Auditor', name: 'David Thompson', email: 'auditor@irmcommand.demo', description: 'Read-only + audit export' },
  { role: 'Regulatory Examiner', name: 'Lisa Anderson', email: 'examiner@irmcommand.demo', description: 'Minimal read-only view' },
];

export default function LoginPage() {
  const { login, loginAs, error: authError, isLoading } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSSO = async () => {
    try {
      setLocalError(null);
      await login({ provider: 'sso' });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : 'SSO login failed. Please try again.'
      );
    }
  };

  const handleDemoLogin = (demoUser: DemoUser) => {
    try {
      setLocalError(null);
      loginAs(demoUser.email);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : `Failed to login as ${demoUser.role}`
      );
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Background accent glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main card */}
      <div className="relative w-full max-w-2xl">
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl">
          {/* Header with logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg opacity-80 blur-md" />
                <div className="relative w-full h-full bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">I</span>
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">IRM Command</h1>
            <p className="text-slate-400 text-lg">Integrated Risk Management Platform</p>
          </div>

          {/* Error message */}
          {displayError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{displayError}</p>
            </div>
          )}

          {/* SSO Login */}
          <div className="mb-8">
            <p className="text-slate-300 text-sm font-semibold mb-4">Sign in with your organization</p>
            <button
              onClick={handleSSO}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Sign in with SSO
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-slate-900/50 text-slate-500">or use demo credentials</span>
            </div>
          </div>

          {/* Demo Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {DEMO_USERS.map((demoUser) => (
              <button
                key={demoUser.email}
                onClick={() => handleDemoLogin(demoUser)}
                disabled={isLoading}
                className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-lg p-4 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="font-semibold text-white text-sm group-hover:text-cyan-400 transition">
                  {demoUser.role}
                </div>
                <div className="text-slate-400 text-xs mt-1">{demoUser.name}</div>
                <div className="text-slate-500 text-xs mt-0.5">{demoUser.description}</div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center text-slate-500 text-xs border-t border-slate-800 pt-6">
            <span>SOC 2 Type II Compliant</span>
            <span className="mx-2">|</span>
            <span>Enterprise SSO + MFA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
