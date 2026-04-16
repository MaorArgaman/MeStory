import { Suspense, ReactNode } from 'react';
import ErrorBoundary from './ErrorBoundary';
import LoadingScreen from './LoadingScreen';

interface Props {
  children: ReactNode;
  /** Optional name used only for debugging / error reporting */
  name?: string;
}

/**
 * PageBoundary — isolates a single page so a crash or chunk-load failure
 * in one route does not take down the rest of the app.
 *
 * Wraps the page in:
 *   - Suspense (for React.lazy chunks)
 *   - ErrorBoundary (catches render errors)
 */
export default function PageBoundary({ children }: Props) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
