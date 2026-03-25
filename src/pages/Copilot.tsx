import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BarChart3,
  FileText,
  Building2,
  Shield,
  Presentation,
  Send,
  Bot,
  X,
  AlertCircle,
} from 'lucide-react';
import { getDataAccess } from '../data/DataAccessLayer';
import { TemplateEngine } from '../ai/local/templateEngine';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StreamingText } from '../components/ui/StreamingText';
import { useAppStore } from '../store/appStore';
import { useThemeStore } from '../store/themeStore';
import { useSecurity, RequirePermission } from '../security/SecurityContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ProactiveAlert {
  id: string;
  message: string;
  type: 'info' | 'warning';
}

const quickActions = [
  {
    id: 'daily-summary',
    label: 'Daily Posture Summary',
    icon: BarChart3,
    keyword: 'daily',
  },
  {
    id: 'exam-response',
    label: 'Draft Exam Response',
    icon: FileText,
    keyword: 'exam',
  },
  {
    id: 'vendor-risk',
    label: 'Vendor Risk Top-3',
    icon: Building2,
    keyword: 'vendor',
  },
  {
    id: 'compliance-gap',
    label: 'Compliance Gap Brief',
    icon: Shield,
    keyword: 'compliance',
  },
  {
    id: 'board-pack',
    label: 'Board Pack Outline',
    icon: Presentation,
    keyword: 'board',
  },
];

const faqTopics = [
  'What is IRM Command?',
  'How are risk scores calculated?',
  'What frameworks are supported?',
  'How does the TPRM module work?',
  'What is an MRA vs MRIA?',
  'How does continuous monitoring work?',
  'What data sources feed the dashboard?',
  'How are KRI thresholds set?',
  'What is the control testing process?',
  'How does regulatory change management work?',
  'What is operational resilience?',
  'How are vendor tiers determined?',
  'What is the AI governance framework?',
  'How are exam narratives generated?',
  'What is the scoring methodology?',
  'How does the audit trail work?',
  'What compliance reports are available?',
  'How does the board pack get generated?',
];

const getContextualSuggestions = (module: string): string[] => {
  switch (module) {
    case 'dashboard':
      return ['Review KRI breaches', 'Generate weekly report', 'Risk heat map summary'];
    case 'tprm':
      return [
        `Assess ${vendors[0]?.name || 'vendor'}`,
        'Review SLA breaches',
        'Vendor health snapshot',
      ];
    case 'compliance':
      return ['Analyze latest reg change', 'Review open MRAs', 'Compliance roadmap'];
    case 'workbench':
      return ['Run stress scenario', 'Compare assessments', 'Control effectiveness'];
    default:
      return ['Get started', 'View recent insights', 'Explore framework'];
  }
};

const getProactiveAlerts = (module: string): ProactiveAlert[] => {
  const alerts: ProactiveAlert[] = [];

  if (Math.random() > 0.6) {
    alerts.push({
      id: 'kri-breach',
      message: '3 KRIs in breach status – shall I generate a summary?',
      type: 'warning',
    });
  }

  if (module === 'tprm' && Math.random() > 0.7) {
    const vendor = vendors[0];
    if (vendor) {
      alerts.push({
        id: 'sla-breach',
        message: `${vendor.name} SLA breach alert – review recommended`,
        type: 'warning',
      });
    }
  }

  if (Math.random() > 0.65) {
    alerts.push({
      id: 'reg-change',
      message: 'New regulatory change detected – would you like an impact analysis?',
      type: 'info',
    });
  }

  return alerts.slice(0, 2);
};

const Copilot: React.FC = () => {
  const { can: canPerform } = useSecurity();
  const { isDark } = useThemeStore();
  const currentModule = useAppStore((s) => s.currentModule);
  const selectedEntityId = useAppStore((s) => s.selectedEntityId);
  const selectedEntityType = useAppStore((s) => s.selectedEntityType);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [proactiveAlerts, setProactiveAlerts] = useState<ProactiveAlert[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const templateEngine = useRef(new TemplateEngine()).current;

  const dal = getDataAccess();
  const risks = dal.getRisks();
  const controls = dal.getControls();
  const vendors = dal.getVendors();
  const issues = dal.getIssues();
  const kris = dal.getKRIs();
  const lossEvents = dal.getLossEvents();
  const regulatoryChanges = dal.getRegulatoryChanges();
  const monitoringAlerts = dal.getMonitoringAlerts();

  useEffect(() => {
    const alerts = getProactiveAlerts(currentModule);
    setProactiveAlerts(alerts);
  }, [currentModule]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const generateResponse = useCallback(
    async (userMessage: string): Promise<string> => {
      return templateEngine.generateCopilotResponse({
        module: currentModule,
        entityId: selectedEntityId || undefined,
        message: userMessage,
      });
    },
    [currentModule, selectedEntityId, templateEngine]
  );

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate brief thinking delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const responseText = await generateResponse(userMessage);

      const newAssistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, newAssistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          'I encountered an issue processing your request. Please try again or rephrase your question.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, generateResponse]);

  const handleQuickAction = useCallback(
    (actionId: string, label: string) => {
      const messagePrompts: Record<string, string> = {
        'daily-summary': 'Generate daily posture summary',
        'exam-response': 'Draft exam response',
        'vendor-risk': 'What are the top 3 riskiest vendors?',
        'compliance-gap': 'Compliance gap brief',
        'board-pack': 'Generate board pack outline',
      };

      setInputValue(messagePrompts[actionId] || label);
    },
    []
  );

  const handleDismissAlert = useCallback((alertId: string) => {
    setProactiveAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const contextualSuggestions = getContextualSuggestions(currentModule);

  const bgClass = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200';
  const cardBgClass = isDark ? 'bg-gray-800' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const mutedTextClass = isDark ? 'text-gray-400' : 'text-gray-600';
  const hoverClass = isDark ? 'hover:bg-blue-900/20' : 'hover:bg-blue-50';
  const hoverBorderClass = isDark ? 'hover:border-blue-700' : 'hover:border-blue-300';
  const inputBgClass = isDark ? 'bg-gray-700' : 'bg-white';
  const inputBorderClass = isDark ? 'border-gray-600' : 'border-gray-300';

  return (
    <div className={`flex h-full ${bgClass}`}>
      {/* Left Section: Quick Actions & Context (30%) */}
      <div className={`w-3/10 border-r ${borderClass} p-6 overflow-y-auto`}>
        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h3 className={`text-sm font-semibold ${textClass} mb-4`}>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id, action.label)}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${borderClass} ${hoverClass} ${hoverBorderClass} transition-colors text-left`}
                >
                  <Icon className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'} flex-shrink-0`} />
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Context Panel */}
        <div className={`mb-8 p-4 ${cardBgClass} rounded-lg border ${borderClass}`}>
          <h3 className={`text-sm font-semibold ${textClass} mb-3`}>
            Current Context
          </h3>
          <div className="space-y-2">
            <div>
              <p className={`text-xs ${mutedTextClass} mb-1`}>Module</p>
              <Badge variant="secondary">
                {currentModule.charAt(0).toUpperCase() + currentModule.slice(1)}
              </Badge>
            </div>
            {selectedEntityId && (
              <div>
                <p className={`text-xs ${mutedTextClass} mb-1`}>Selected Entity</p>
                <Badge variant="primary">{selectedEntityId}</Badge>
              </div>
            )}
          </div>
          <p className={`text-xs ${mutedTextClass} mt-3`}>
            The copilot is aware of your current context and will tailor responses accordingly.
          </p>
        </div>

        {/* Contextual Suggestions */}
        <div>
          <h3 className={`text-sm font-semibold ${textClass} mb-3`}>
            Suggested Topics
          </h3>
          <div className="space-y-2">
            {contextualSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setInputValue(suggestion)}
                className={`w-full text-left px-3 py-2 text-sm ${cardBgClass} border ${borderClass} rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Section: Chat Interface (70%) */}
      <div className={`flex-1 flex flex-col ${cardBgClass}`}>
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Bot className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-4`} />
                <p className={`${mutedTextClass} text-sm leading-relaxed`}>
                  Welcome to IRM Command Copilot. I'm your AI-powered GRC assistant, calibrated
                  to supervisory expectations across enterprise risk, compliance, and third-party
                  risk management. How can I assist your risk oversight today?
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex gap-3 max-w-md ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-blue-900' : 'bg-blue-100'} flex items-center justify-center flex-shrink-0`}>
                    <Bot className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                )}

                <div
                  className={`rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : `${isDark ? 'bg-gray-700 text-gray-100 border border-gray-600' : 'bg-gray-100 text-gray-900 border border-gray-200'} rounded-bl-none`
                  }`}
                >
                  {message.isStreaming ? (
                    <StreamingText text={message.content} />
                  ) : (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                  <p className="text-xs mt-2 opacity-60">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-blue-900' : 'bg-blue-100'} flex items-center justify-center flex-shrink-0`}>
                  <Bot className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg rounded-bl-none px-4 py-3`}>
                  <div className="flex gap-1">
                    <div className={`w-2 h-2 ${isDark ? 'bg-gray-500' : 'bg-gray-400'} rounded-full animate-bounce`} />
                    <div className={`w-2 h-2 ${isDark ? 'bg-gray-500' : 'bg-gray-400'} rounded-full animate-bounce delay-100`} />
                    <div className={`w-2 h-2 ${isDark ? 'bg-gray-500' : 'bg-gray-400'} rounded-full animate-bounce delay-200`} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Proactive Alerts */}
        {proactiveAlerts.length > 0 && (
          <div className={`px-6 pt-2 pb-4 space-y-2 border-t ${borderClass}`}>
            {proactiveAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.type === 'warning'
                    ? isDark ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50 border border-amber-200'
                    : isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <AlertCircle
                  className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    alert.type === 'warning'
                      ? isDark ? 'text-amber-400' : 'text-amber-600'
                      : isDark ? 'text-blue-400' : 'text-blue-600'
                  }`}
                />
                <p
                  className={`text-sm flex-1 ${
                    alert.type === 'warning'
                      ? isDark ? 'text-amber-200' : 'text-amber-800'
                      : isDark ? 'text-blue-200' : 'text-blue-800'
                  }`}
                >
                  {alert.message}
                </p>
                <button
                  onClick={() => handleDismissAlert(alert.id)}
                  className="flex-shrink-0"
                  aria-label="Dismiss alert"
                >
                  <X className="w-4 h-4 opacity-50 hover:opacity-100" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className={`border-t ${borderClass} p-6 ${cardBgClass}`}>
          <RequirePermission permission="copilot:interact">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about risks, controls, vendors, compliance..."
                className={`flex-1 px-4 py-2 rounded-lg border ${inputBorderClass} ${inputBgClass} ${textClass} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className={`p-2 rounded-lg bg-blue-600 ${isDark ? 'hover:bg-blue-700' : 'hover:bg-blue-700'} text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className={`text-xs ${mutedTextClass} mt-2`}>
              Tip: Use Ctrl+Enter to send
            </p>
          </RequirePermission>
        </div>
      </div>
    </div>
  );
};

export default Copilot;
