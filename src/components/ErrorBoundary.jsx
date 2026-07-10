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
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-lg p-xl max-w-md w-full text-center">
            <span className="material-symbols-outlined text-6xl text-error mb-lg block">error</span>
            <h1 className="font-headline-md text-headline-md text-on-surface mb-md">Something went wrong</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-xl py-2.5 font-body-md text-body-md bg-primary text-white rounded-lg shadow-sm hover:shadow-md active:scale-95 transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
