import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { SecurityProvider } from './security/SecurityContext';
import { AuthProvider, RequireAuth, useAuth } from './auth/AuthContext';
import LoginPage from './auth/LoginPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getTelemetry, setTelemetryContext } from './telemetry';
import { getConfig } from './config';
import EnvironmentBanner from './components/EnvironmentBanner'; // CISO-009
import { authorizeRoute } from './security/AuthorizationMiddleware'; // CISO-003
import { useThemeStore } from './store/themeStore';

// Lazy load page components
const DashboardPage = React.lazy(() => import('./pages/Dashboard'));
const TPRMPage = React.lazy(() => import('./pages/TPRM'));
const CompliancePage = React.lazy(() => import('./pages/Compliance'));
const WorkbenchPage = React.lazy(() => import('./pages/Workbench'));
const CopilotPage = React.lazy(() => import('./pages/Copilot'));
const AICommandCenterPage = React.lazy(() => import('./pages/AICommandCenter'));
const ControlRegisterPage = React.lazy(() => import('./pages/ControlRegister'));
const ExceptionsPage = React.lazy(() => import('./pages/Exceptions'));
const ArchitecturePage = React.lazy(() => import('./pages/Architecture'));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
  </div>
);

// Track page navigations for telemetry
function NavigationTracker() {
  const location = useLocation();

  useEffect(() => {
    getTelemetry().trackEvent('page_view', {
      path: location.pathname,
      timestamp: new Date().toISOString(),
    });
  }, [location.pathname]);

  return null;
}

// Per-module error boundary wrapper
function ModuleBoundary({ module, children }: { module: string; children: React.ReactNode }) {
  return (
    <ErrorBoundary module={module}>
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * CISO-003 REMEDIATION: Route-level permission guard.
 * Enforces authorization BEFORE rendering any module content.
 * Works in conjunction with RequireAuth — this adds permission checks
 * beyond simple authentication.
 */
function RequireRoutePermission({ path, children }: { path: string; children: React.ReactNode }) {
  const { user, claims } = useAuth();
  const { isDark } = useThemeStore();

  if (!user) {
    return <LoginPage />;
  }

  const decision = authorizeRoute(claims, path);

  if (!decision.allowed) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>
        <div className={`max-w-md mx-auto p-8 ${isDark ? 'bg-slate-900 border-red-800/50' : 'bg-white border-red-200'} border rounded-lg text-center`}>
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isDark ? 'bg-red-900/30' : 'bg-red-100'} flex items-center justify-center`}>
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>Access Denied</h2>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'} mb-4`}>{decision.reason}</p>
          <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Module: {decision.rule?.description || path}<br />
            Your roles: {user.roles?.join(', ') || 'None'}
          </p>
          <button
            onClick={() => window.history.back()}
            className={`mt-6 px-4 py-2 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-slate-800'} rounded text-sm`}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Health indicator footer (visible in non-production)
function HealthIndicator() {
  const config = getConfig();
  const { isDark } = useThemeStore();
  if (config.app.environment === 'production') return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-gray-200'} border-t px-4 py-1 flex items-center justify-between text-xs text-slate-500`}>
      <span>IRM Sentinel v{config.app.version} | {config.app.environment}</span>
      <span className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        System Operational
      </span>
    </div>
  );
}

// Initialize telemetry context for the session
function TelemetryInitializer() {
  useEffect(() => {
    const config = getConfig();
    setTelemetryContext({
      tenantId: config.tenant.id,
      sessionId: `SES-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    });
  }, []);
  return null;
}

function AppRoutes() {
  return (
    <>
      <EnvironmentBanner />
      <NavigationTracker />
      <TelemetryInitializer />
      <Routes>
        {/* Login route — accessible without auth */}
        <Route path="/login" element={<LoginPage />} />

        {/* All app routes require authentication */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          element={
            <RequireAuth fallback={<LoginPage />}>
              <Layout />
            </RequireAuth>
          }
        >
          {/* CISO-003: Every route wrapped with permission enforcement */}
          <Route path="/dashboard" element={<RequireRoutePermission path="/dashboard"><ModuleBoundary module="Dashboard"><DashboardPage /></ModuleBoundary></RequireRoutePermission>} />
          <Route path="/tprm" element={<RequireRoutePermission path="/tprm"><ModuleBoundary module="TPRM"><TPRMPage /></ModuleBoundary></RequireRoutePermission>} />
          <Route path="/tprm/:vendorId" element={<RequireRoutePermission path="/tprm"><ModuleBoundary module="TPRM"><TPRMPage /></ModuleBoundary></RequireRoutePermission>} />
          <Route path="/compliance" element={<RequireRoutePermission path="/compliance"><ModuleBoundary module="Compliance"><CompliancePage /></ModuleBoundary></RequireRoutePermission>} />
          <Route path="/workbench" element={<RequireRoutePermission path="/workbench"><ModuleBoundary module="Workbench"><WorkbenchPage /></ModuleBoundary></RequireRoutePermission>} />
          <Route path="/copilot" element={<RequireRoutePermission path="/copilot"><ModuleBoundary module="Copilot"><CopilotPage /></ModuleBoundary></RequireRoutePermission>} />
          <Route path="/ai" element={<RequireRoutePermission path="/ai"><ModuleBoundary module="AICommandCenter"><AICommandCenterPage /></ModuleBoundary></RequireRoutePermission>} />
          <Route path="/control-register" element={<RequireRoutePermission path="/control-register"><ModuleBoundary module="ControlRegister"><ControlRegisterPage /></ModuleBoundary></RequireRoutePermission>} />
          <Route path="/exceptions" element={<RequireRoutePermission path="/exceptions"><ModuleBoundary module="Exceptions"><ExceptionsPage /></ModuleBoundary></RequireRoutePermission>} />
          <Route path="/architecture" element={<RequireRoutePermission path="/architecture"><ModuleBoundary module="Architecture"><ArchitecturePage /></ModuleBoundary></RequireRoutePermission>} />
        </Route>

        {/* 404 catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <HealthIndicator />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary module="App">
      <AuthProvider>
        <SecurityProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SecurityProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
