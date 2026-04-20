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
        <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-900 via-purple-900/30 to-indigo-900/30">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-memorial-gold/10 border border-memorial-gold/20 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-memorial-gold" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isChunk ? 'גרסה חדשה זמינה' : 'אופס! משהו השתבש'}
            </h2>
            <p className="text-sm text-gray-400 mb-1" dir="ltr">
              {isChunk ? 'A new version is available' : 'Oops! Something went wrong'}
            </p>
            <p className="text-gray-400 mb-8 mt-4">
              {isChunk
                ? 'האפליקציה עודכנה. רענן את הדף כדי לטעון את הגרסה החדשה.'
                : 'נתקלנו בשגיאה לא צפויה. אפשר לנסות שוב, זה בדרך כלל עוזר.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-memorial-gold to-amber-600 hover:from-amber-500 hover:to-amber-600 rounded-xl text-white font-medium transition-all shadow-lg shadow-memorial-gold/20"
            >
              <RefreshCw className="w-5 h-5" />
              {isChunk ? 'רענן את הדף' : 'נסה שוב'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
