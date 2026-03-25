import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Trash2,
  ChevronRight,
  Zap,
  Brain,
  Database,
  Shield,
  AlertTriangle,
  BookOpen,
  Cpu,
  MessageSquare,
  X,
  Menu,
} from 'lucide-react';
import { useAIAssistant, AIMessage } from '../hooks/useAIAssistant';
import { useThemeStore } from '../store/themeStore';
import { getIRMToolServer } from '../ai/mcp/irm-tools';
import { KNOWLEDGE_BASE } from '../ai/knowledge-service';
import { FormattedMessage } from '../components/FormattedMessage';

const PROVIDER_CONFIGS = {
  simple: { name: 'Groq', model: 'mixtral-8x7b', tokens: 8000 },
  medium: { name: 'OpenAI', model: 'gpt-4', tokens: 8000 },
  complex: { name: 'Claude', model: 'claude-3-opus', tokens: 200000 },
};

const QUICK_ACTIONS = [
  'What are the top risks by severity?',
  'Show compliance gaps across frameworks',
  'Which vendors have SLA violations?',
  'Summarize SOC 2 readiness',
  'List overdue audit findings',
  'What KRIs are in breach?',
];

const DOMAIN_COLORS: Record<string, string> = {
  risk: 'bg-red-500',
  compliance: 'bg-blue-500',
  vendor: 'bg-purple-500',
  audit: 'bg-green-500',
  soc2: 'bg-orange-500',
};

export default function AICommandCenter() {
  const { isDark } = useThemeStore();
  const { messages, isLoading, sendMessage, clearMessages, isListening, startListening, stopListening } =
    useAIAssistant();
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get IRM tools grouped by domain
  const toolsByDomain = useMemo(() => {
    try {
      const toolServer = getIRMToolServer();
      const allTools = toolServer.listTools();
      const grouped: Record<string, typeof allTools> = {};

      allTools.forEach((tool) => {
        const domain = tool.metadata?.domain || 'general';
        if (!grouped[domain]) {
          grouped[domain] = [];
        }
        grouped[domain].push(tool);
      });

      return grouped;
    } catch {
      return {};
    }
  }, []);

  // Get knowledge base grouped by docType, then by documentTitle with section counts
  const docsByType = useMemo(() => {
    // First group sections by docType → documentTitle
    const byType: Record<string, Record<string, number>> = {};

    KNOWLEDGE_BASE.forEach((section) => {
      const docType = section.docType || 'general';
      if (!byType[docType]) {
        byType[docType] = {};
      }
      const title = section.documentTitle || section.sectionTitle;
      byType[docType][title] = (byType[docType][title] || 0) + 1;
    });

    // Convert to array format: { title, sectionCount }[]
    const result: Record<string, { title: string; sectionCount: number }[]> = {};
    Object.entries(byType).forEach(([docType, docs]) => {
      result[docType] = Object.entries(docs).map(([title, count]) => ({
        title,
        sectionCount: count,
      }));
    });

    return result;
  }, []);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const handleQuickAction = (action: string) => {
    sendMessage(action);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const bgClass = isDark ? 'bg-navy-950' : 'bg-gray-50';
  const cardClass = isDark ? 'bg-slate-800' : 'bg-white';
  const textClass = isDark ? 'text-slate-100' : 'text-gray-900';
  const borderClass = isDark ? 'border-slate-700' : 'border-gray-200';
  const hoverClass = isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100';

  return (
    <div className={`flex h-full ${bgClass} ${textClass}`}>
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col lg:flex-row gap-4 p-4 lg:p-6">
        {/* Chat Section */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500 text-white">
                <Bot size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">IRM Sentinel Center</h1>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  AI-Powered GRC Intelligence
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`lg:hidden p-2 rounded-lg ${hoverClass}`}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Messages Area */}
          <div
            className={`flex-1 overflow-y-auto mb-6 p-4 rounded-lg ${cardClass} border ${borderClass} space-y-4`}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Brain size={48} className="text-cyan-500 opacity-50" />
                <p className={`text-center ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Start by asking about risks, controls, compliance, or vendors.
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div key={message.id}>
                    <div
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}
                    >
                      <div
                        className={`max-w-sm lg:max-w-lg px-4 py-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-cyan-500 text-white rounded-br-none'
                            : `${isDark ? 'bg-slate-800/80 border border-slate-700' : 'bg-white border border-gray-100 shadow-sm'} rounded-bl-none`
                        }`}
                      >
                        {message.role === 'user' ? (
                          <p className="text-sm">{message.content}</p>
                        ) : (
                          <FormattedMessage text={message.content} isDark={isDark} />
                        )}
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    {message.role === 'assistant' && message.metadata && (
                      <div className="flex flex-wrap gap-2 ml-0 mb-4">
                        {message.metadata.domain &&
                          message.metadata.domain.map((d) => (
                            <span
                              key={d}
                              className={`text-xs px-2 py-1 rounded-full text-white ${
                                DOMAIN_COLORS[d] || 'bg-gray-500'
                              }`}
                            >
                              {d}
                            </span>
                          ))}
                        {message.metadata.provider && (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-500 text-white">
                            {message.metadata.provider}
                          </span>
                        )}
                        {message.metadata.ragUsed && (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-500 text-white">
                            RAG Grounded
                          </span>
                        )}
                        {message.metadata.toolsUsed && message.metadata.toolsUsed.length > 0 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-orange-500 text-white">
                            {message.metadata.toolsUsed.length} tools
                          </span>
                        )}
                        {message.metadata.complexity && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full text-white ${
                              message.metadata.complexity === 'simple'
                                ? 'bg-blue-500'
                                : message.metadata.complexity === 'medium'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                          >
                            {message.metadata.complexity}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${cardClass}`}>
                      <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-cyan-500 animate-pulse" />
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                          Analyzing...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick Actions */}
          {messages.length === 0 && (
            <div className="mb-6">
              <p className={`text-xs font-semibold mb-3 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Quick Actions
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action)}
                    className={`text-xs px-3 py-2 rounded-full border border-cyan-500 text-cyan-500 ${hoverClass} transition-colors`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className={`rounded-lg border ${borderClass} p-4 ${cardClass}`}>
            <div className="flex flex-col gap-3">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about risks, controls, compliance, vendors..."
                rows={3}
                className={`w-full p-3 rounded-lg border ${borderClass} focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none ${
                  isDark ? 'bg-slate-700 text-slate-100' : 'bg-white text-gray-900'
                }`}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={clearMessages}
                  className={`p-2 rounded-lg ${hoverClass} transition-colors`}
                  title="Clear messages"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening
                      ? 'bg-green-500 text-white'
                      : `${hoverClass}`
                  }`}
                  title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Send message (Enter)"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        {sidebarOpen && (
          <div className={`w-full lg:w-80 flex flex-col gap-4 max-h-screen overflow-y-auto`}>
            {/* MCP Tool Registry */}
            <div className={`rounded-lg border ${borderClass} p-4 ${cardClass}`}>
              <div className="flex items-center gap-2 mb-4">
                <Zap size={18} className="text-cyan-500" />
                <h3 className="font-semibold">MCP Tool Registry</h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(toolsByDomain).length > 0 ? (
                  Object.entries(toolsByDomain).map(([domain, tools]) => (
                    <div key={domain}>
                      <h4
                        className={`text-xs font-bold uppercase mb-2 px-2 py-1 rounded ${
                          DOMAIN_COLORS[domain] || 'bg-gray-500'
                        } text-white w-fit`}
                      >
                        {domain}
                      </h4>
                      <div className="space-y-2 ml-2">
                        {tools.map((tool) => (
                          <div key={tool.name} className="text-xs">
                            <p className="font-medium text-cyan-400">{tool.name}</p>
                            <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                              {tool.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    No tools available
                  </p>
                )}
              </div>
            </div>

            {/* Knowledge Base */}
            <div className={`rounded-lg border ${borderClass} p-4 ${cardClass}`}>
              <div className="flex items-center gap-2 mb-4">
                <Database size={18} className="text-purple-500" />
                <h3 className="font-semibold">Knowledge Base</h3>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(docsByType).length > 0 ? (
                  Object.entries(docsByType).map(([docType, docs]) => (
                    <div key={docType}>
                      <h4 className="text-xs font-bold uppercase mb-2 text-purple-400">
                        {docType}
                      </h4>
                      <div className="space-y-2 ml-2">
                        {docs.map((doc, idx) => (
                          <div key={idx} className="text-xs flex items-start gap-2">
                            <BookOpen size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                                {doc.sectionCount} {doc.sectionCount === 1 ? 'section' : 'sections'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    No documents available
                  </p>
                )}
              </div>
            </div>

            {/* LLM Routing Strategy */}
            <div className={`rounded-lg border ${borderClass} p-4 ${cardClass}`}>
              <div className="flex items-center gap-2 mb-4">
                <Brain size={18} className="text-blue-500" />
                <h3 className="font-semibold">LLM Routing</h3>
              </div>
              <div className="space-y-3">
                {Object.entries(PROVIDER_CONFIGS).map(([tier, config]) => (
                  <div key={tier} className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-cyan-400 capitalize">{tier}</p>
                        <p className="text-xs">{config.name}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-green-500 text-white">
                        Local Fallback
                      </span>
                    </div>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      {config.model} • {config.tokens.toLocaleString()} tokens
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
