import React, { Component, ErrorInfo } from 'react';
import { getTelemetry } from '../telemetry';
import { getConfig } from '../config';

interface Props {
  children: React.ReactNode;
  module?: string; // Optional: which module this boundary wraps
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    getTelemetry().trackError(
      error,
      {
        module: this.props.module || 'app',
        componentStack: errorInfo.componentStack || '',
      },
      false
    );
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { error } = this.state;
      const config = getConfig();
      const showDetails = config.app.environment !== 'production';

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="max-w-lg text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-slate-200">
              {this.props.module ? `${this.props.module} Module Error` : 'Application Error'}
            </h2>
            <p className="text-slate-400 mb-4">
              An unexpected error occurred. This incident has been logged for review.
            </p>
            {showDetails && error && (
              <pre className="text-left text-xs bg-slate-800 p-4 rounded mb-4 overflow-auto max-h-40 text-red-400 font-mono">
                {error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              IRM Sentinel v{config.app.version} | {config.app.environment}
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
