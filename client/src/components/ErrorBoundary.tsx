import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Detect stale-chunk errors that happen after a new deploy:
 * the browser's cached index.js references old chunk filenames that
 * no longer exist on the server. The server returns an HTML 404 page
 * instead of JS, triggering these errors.
 */
function isChunkLoadError(error: Error): boolean {
  const msg = error.message || '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    msg.includes('text/html')
  );
}

const RELOAD_KEY = 'mestory-chunk-reload';

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Auto-reload ONCE on chunk load errors (stale deploy cache).
    // Use sessionStorage to prevent infinite reload loops.
    if (isChunkLoadError(error)) {
      const lastReload = sessionStorage.getItem(RELOAD_KEY);
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 30_000) {
        sessionStorage.setItem(RELOAD_KEY, String(now));
        window.location.reload();
        return;
      }
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isChunk = this.state.error && isChunkLoadError(this.state.error);

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              {isChunk ? 'New version available' : 'Something went wrong'}
            </h2>
            <p className="text-gray-400 mb-6">
              {isChunk
                ? 'The app has been updated. Please refresh to load the latest version.'
                : 'We encountered an unexpected error. Please try again or refresh the page.'}
            </p>
            <button
              onClick={isChunk ? () => window.location.reload() : this.handleRetry}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-medium transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              {isChunk ? 'Refresh' : 'Try Again'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
