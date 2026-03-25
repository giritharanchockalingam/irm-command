import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { SecurityProvider } from './security/SecurityContext';
import { AuthProvider, RequireAuth } from './auth/AuthContext';
import LoginPage from './auth/LoginPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getTelemetry, setTelemetryContext } from './telemetry';
import { getConfig } from './config';

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

// Health indicator footer (visible in non-production)
function HealthIndicator() {
  const config = getConfig();
  if (config.app.environment === 'production') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 border-t border-slate-700 px-4 py-1 flex items-center justify-between text-xs text-slate-500">
      <span>IRM Command v{config.app.version} | {config.app.environment}</span>
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
          <Route path="/dashboard" element={<ModuleBoundary module="Dashboard"><DashboardPage /></ModuleBoundary>} />
          <Route path="/tprm" element={<ModuleBoundary module="TPRM"><TPRMPage /></ModuleBoundary>} />
          <Route path="/tprm/:vendorId" element={<ModuleBoundary module="TPRM"><TPRMPage /></ModuleBoundary>} />
          <Route path="/compliance" element={<ModuleBoundary module="Compliance"><CompliancePage /></ModuleBoundary>} />
          <Route path="/workbench" element={<ModuleBoundary module="Workbench"><WorkbenchPage /></ModuleBoundary>} />
          <Route path="/copilot" element={<ModuleBoundary module="Copilot"><CopilotPage /></ModuleBoundary>} />
          <Route path="/ai" element={<ModuleBoundary module="AICommandCenter"><AICommandCenterPage /></ModuleBoundary>} />
          <Route path="/control-register" element={<ModuleBoundary module="ControlRegister"><ControlRegisterPage /></ModuleBoundary>} />
          <Route path="/exceptions" element={<ModuleBoundary module="Exceptions"><ExceptionsPage /></ModuleBoundary>} />
          <Route path="/architecture" element={<ModuleBoundary module="Architecture"><ArchitecturePage /></ModuleBoundary>} />
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
