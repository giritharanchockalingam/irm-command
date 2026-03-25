import React, { useState, useMemo, useCallback } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Shield,
  FlaskConical,
  Bot,
  Menu,
  X,
  Sun,
  Moon,
  Bell,
  ChevronRight,
  ChevronLeft,
  ClipboardCheck,
  LogOut,
  Brain,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../auth/AuthContext';
import { getDataAccess } from '../data/DataAccessLayer';
import { orchestrate } from '../ai/orchestrator';
import { FormattedMessage } from './FormattedMessage';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  module: string;
}

const navItems: NavItem[] = [
  { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard', module: 'dashboard' },
  { icon: <Building2 size={20} />, label: 'TPRM', path: '/tprm', module: 'tprm' },
  { icon: <Shield size={20} />, label: 'Compliance', path: '/compliance', module: 'compliance' },
  { icon: <FlaskConical size={20} />, label: 'AI Workbench', path: '/workbench', module: 'workbench' },
  { icon: <Brain size={20} />, label: 'AI Command Center', path: '/ai', module: 'ai' },
  { icon: <AlertTriangle size={20} />, label: 'Exceptions', path: '/exceptions', module: 'exceptions' },
  { icon: <ClipboardCheck size={20} />, label: 'SOC 2 Controls', path: '/control-register', module: 'control-register' },
  { icon: <Layers size={20} />, label: 'Architecture', path: '/architecture', module: 'architecture' },
];

interface CopilotMessage {
  role: 'user' | 'assistant';
  text: string;
}

function CopilotSidePanel({ isDark, onClose }: { isDark: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isGenerating) return;

    const userMsg: CopilotMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsGenerating(true);

    // Call the AI orchestrator
    orchestrate({ message: trimmed, context: { currentPage: 'copilot' } })
      .then((response) => {
        const meta = ` [${response.domain.join(', ')} | ${response.complexity} | ${response.toolsUsed.length} tools]`;
        setMessages((prev) => [...prev, { role: 'assistant', text: response.message }]);
      })
      .catch(() => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: 'I encountered an issue generating a response. Please try rephrasing your question.' },
        ]);
      })
      .finally(() => {
        setIsGenerating(false);
      });
  }, [input, isGenerating]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div
      className={`fixed right-0 top-0 h-full w-96 ${
        isDark ? 'bg-navy-900 border-slate-700' : 'bg-white border-gray-200'
      } border-l shadow-2xl flex flex-col z-50`}
    >
      <div className={`flex items-center justify-between p-4 ${isDark ? 'border-slate-700' : 'border-gray-200'} border-b`}>
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-semibold">IRM Copilot</span>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className={`p-1.5 rounded text-xs ${isDark ? 'hover:bg-navy-800 text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'}`}
              title="Clear messages"
            >
              Clear
            </button>
          )}
          <button onClick={onClose} className={`p-1 rounded ${isDark ? 'hover:bg-navy-800' : 'hover:bg-gray-100'}`}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Ask about risks, controls, vendors, compliance, or SOC 2 controls. Try: "What are the top risks?" or "Summarize vendor status."
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[90%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white text-sm'
                  : isDark
                    ? 'bg-slate-800/80 text-slate-200'
                    : 'bg-gray-50 text-gray-800 border border-gray-100'
              }`}
            >
              {msg.role === 'user' ? (
                msg.text
              ) : (
                <FormattedMessage text={msg.text} isDark={isDark} />
              )}
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className={`rounded-lg p-3 text-sm ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
              <span className="animate-pulse">Analyzing...</span>
            </div>
          </div>
        )}
      </div>

      <div className={`p-4 pb-8 ${isDark ? 'border-slate-700' : 'border-gray-200'} border-t`}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything... (Enter to send)"
          className={`w-full p-2 rounded-lg text-sm ${isDark ? 'bg-navy-800 border-slate-600 text-slate-100' : 'bg-gray-100 border-gray-300 text-gray-800'} border resize-none focus:outline-none focus:border-cyan-500`}
          rows={3}
        />
        <button
          onClick={handleSend}
          disabled={isGenerating || !input.trim()}
          className="mt-2 w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
        >
          {isGenerating ? 'Generating...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

function Layout() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const location = useLocation();
  const isDark = useThemeStore((state) => state.isDark);
  const toggleTheme = useThemeStore((state) => state.toggle);
  const { copilotOpen, toggleCopilot } = useAppStore();
  const currentModule = useAppStore((state) => state.currentModule);
  const { user, logout } = useAuth();

  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: { label: string; path: string }[] = [{ label: 'Home', path: '/' }];

    let currentPath = '';
    for (const segment of pathSegments) {
      currentPath += '/' + segment;
      const navItem = navItems.find((item) => item.path === currentPath);
      if (navItem) {
        breadcrumbs.push({ label: navItem.label, path: currentPath });
      } else {
        breadcrumbs.push({ label: segment.charAt(0).toUpperCase() + segment.slice(1), path: currentPath });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const [showNotifications, setShowNotifications] = useState(false);

  // Data-driven notifications from seed data
  const notifications = useMemo(() => {
    const dal = getDataAccess();
    const alerts: { id: string; type: 'critical' | 'warning' | 'info'; title: string; detail: string; time: string }[] = [];

    // Overdue issues
    const issues = dal.getIssues();
    const overdueIssues = issues.filter(i => {
      const due = i.dueDate instanceof Date ? i.dueDate : new Date(i.dueDate);
      return due < new Date() && i.status !== 'Closed';
    });
    if (overdueIssues.length > 0) {
      alerts.push({
        id: 'overdue-issues',
        type: 'critical',
        title: `${overdueIssues.length} Overdue Issue${overdueIssues.length > 1 ? 's' : ''}`,
        detail: overdueIssues.slice(0, 2).map(i => i.title).join('; '),
        time: 'Action required',
      });
    }

    // KRI breaches
    const kris = dal.getKRIs();
    const breachedKRIs = kris.filter(k => k.breachLevel === 'Breach' || k.breachLevel === 'Critical');
    if (breachedKRIs.length > 0) {
      alerts.push({
        id: 'kri-breaches',
        type: 'warning',
        title: `${breachedKRIs.length} KRI${breachedKRIs.length > 1 ? 's' : ''} in Breach`,
        detail: breachedKRIs.slice(0, 2).map(k => k.name).join('; '),
        time: 'Monitoring',
      });
    }

    // Vendor contracts expiring within 90 days
    const vendors = dal.getVendors();
    const expiringVendors = vendors.filter(v => {
      const expiry = v.contractExpiry instanceof Date ? v.contractExpiry : new Date(v.contractExpiry);
      const daysUntil = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntil > 0 && daysUntil <= 90;
    });
    if (expiringVendors.length > 0) {
      alerts.push({
        id: 'vendor-expiry',
        type: 'info',
        title: `${expiringVendors.length} Vendor Contract${expiringVendors.length > 1 ? 's' : ''} Expiring`,
        detail: expiringVendors.slice(0, 2).map(v => v.name).join('; '),
        time: 'Within 90 days',
      });
    }

    return alerts;
  }, []);
  const notificationCount = notifications.length;

  return (
    <div className={`flex h-screen ${isDark ? 'bg-navy-950' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <aside
        className={`${
          sidebarExpanded ? 'w-64' : 'w-16'
        } ${isDark ? 'bg-navy-900 border-slate-700' : 'bg-white border-gray-200'} border-r theme-transition flex flex-col`}
      >
        {/* Logo */}
        <div className={`flex items-center justify-center h-16 ${isDark ? 'border-slate-700' : 'border-gray-200'} border-b`}>
          <Link to="/" className="flex items-center gap-3 px-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold`}>
              I
            </div>
            {sidebarExpanded && <span className="font-bold text-sm">IRM Command</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.module}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? isDark
                      ? 'bg-cyan-500 text-white'
                      : 'bg-cyan-100 text-cyan-900'
                    : isDark
                      ? 'text-slate-300 hover:bg-navy-800'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                {sidebarExpanded && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className={`px-3 pb-10 pt-2 ${isDark ? 'border-slate-700' : 'border-gray-200'} border-t`}>
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className={`w-full flex items-center ${sidebarExpanded ? 'justify-start pl-3 gap-2' : 'justify-center'} py-1.5 rounded-lg ${isDark ? 'hover:bg-navy-800 text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'} transition-colors`}
            title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarExpanded ? <ChevronLeft size={16} /> : <Menu size={18} />}
            {sidebarExpanded && <span className="text-xs font-medium">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className={`h-16 ${isDark ? 'bg-navy-850 border-slate-700' : 'bg-white border-gray-200'} border-b theme-transition flex items-center justify-between px-6`}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center gap-2">
                {index > 0 && <ChevronRight size={16} className={isDark ? 'text-slate-500' : 'text-gray-400'} />}
                <Link
                  to={crumb.path}
                  className={`text-sm ${
                    index === breadcrumbs.length - 1
                      ? isDark
                        ? 'text-slate-100 font-semibold'
                        : 'text-slate-900 font-semibold'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-300'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {crumb.label}
                </Link>
              </div>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-navy-800' : 'hover:bg-gray-100'} transition-colors`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg ${isDark ? 'hover:bg-navy-800' : 'hover:bg-gray-100'} transition-colors`}
                aria-label={`${notificationCount} notifications`}
              >
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className={`absolute right-0 top-full mt-2 w-80 z-50 rounded-lg shadow-xl border ${isDark ? 'bg-navy-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</span>
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{notificationCount} active</span>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className={`px-4 py-6 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          No active notifications
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 border-b last:border-0 ${isDark ? 'border-slate-700/50 hover:bg-navy-800' : 'border-gray-100 hover:bg-gray-50'} transition-colors cursor-pointer`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                n.type === 'critical' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{n.title}</div>
                                <div className={`text-xs mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{n.detail}</div>
                                <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{n.time}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User info + logout */}
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <div className={`text-xs font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{user.displayName}</div>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.roles.join(', ')}</div>
                </div>
                <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-cyan-600' : 'bg-cyan-400'} flex items-center justify-center text-white text-xs font-bold`}>
                  {user.displayName.split(' ').map(n => n[0]).join('')}
                </div>
                <button
                  onClick={() => logout()}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-navy-800 text-slate-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'} transition-colors`}
                  title="Sign out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content area */}
        <main className={`flex-1 overflow-y-auto pb-8 ${isDark ? 'bg-navy-950' : 'bg-gray-50'}`}>
          <Outlet />
        </main>
      </div>

      {/* Copilot floating button */}
      <button
        onClick={toggleCopilot}
        className={`fixed bottom-14 right-6 z-50 w-14 h-14 rounded-full ${
          isDark ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-cyan-500 hover:bg-cyan-600'
        } text-white flex items-center justify-center shadow-lg ${copilotOpen ? 'alert-pulse' : ''} transition-all`}
      >
        <Bot size={24} />
      </button>

      {/* Copilot side panel */}
      {copilotOpen && (
        <CopilotSidePanel isDark={isDark} onClose={toggleCopilot} />
      )}
    </div>
  );
}

export default Layout;
