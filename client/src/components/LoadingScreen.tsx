import BookLoader from './common/BookLoader';

/**
 * App-level loading screen — shown while auth state is being resolved.
 * Uses the BookLoader fullscreen variant with page-flip animation.
 */
export default function LoadingScreen() {
  return <BookLoader variant="fullscreen" />;
}
