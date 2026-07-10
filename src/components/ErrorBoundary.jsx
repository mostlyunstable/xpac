import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-lg">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-xl p-xl max-w-md w-full text-center animate-pop-in">
            <div className="relative mb-lg inline-block">
              <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-error">error</span>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-error flex items-center justify-center">
                <span className="material-symbols-outlined text-xs text-white">refresh</span>
              </div>
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface mb-md">Something went wrong</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
              An unexpected error occurred. This has been logged and our team has been notified.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-xl py-3 font-body-md text-body-md bg-primary text-white rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-2 mx-auto"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
