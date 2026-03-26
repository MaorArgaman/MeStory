import { ImgHTMLAttributes, useState } from 'react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'loading'> {
  /** Image source URL */
  src: string;
  /**
   * Alt text for the image. Required for accessibility.
   * Pass empty string for decorative images.
   */
  alt: string;
  /** Whether to lazy load the image (default: true) */
  lazy?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Whether this is a decorative image (adds role="presentation") */
  decorative?: boolean;
  /** Fallback content to show while loading or on error */
  fallback?: React.ReactNode;
}

/**
 * OptimizedImage component with built-in lazy loading and accessibility features.
 *
 * Features:
 * - Automatic lazy loading with loading="lazy"
 * - Async decoding with decoding="async"
 * - Proper alt text handling
 * - role="presentation" for decorative images
 * - Optional fallback for loading/error states
 *
 * Usage:
 * - For content images: <OptimizedImage src="/img/book.jpg" alt="Cover of The Great Adventure by John Doe" />
 * - For decorative images: <OptimizedImage src="/img/pattern.png" alt="" decorative />
 * - For above-the-fold images: <OptimizedImage src="/img/hero.jpg" alt="Hero banner" lazy={false} />
 */
export default function OptimizedImage({
  src,
  alt,
  lazy = true,
  className = '',
  decorative = false,
  fallback,
  ...props
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);

  // Handle image load error
  const handleError = () => {
    setHasError(true);
  };

  // If there's an error and a fallback is provided, show the fallback
  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src}
      alt={decorative ? '' : alt}
      loading={lazy ? 'lazy' : undefined}
      decoding="async"
      className={className}
      onError={handleError}
      {...(decorative && { role: 'presentation', 'aria-hidden': true })}
      {...props}
    />
  );
}

/**
 * Helper function to generate descriptive alt text for book covers
 */
export function getBookCoverAlt(bookTitle: string, authorName?: string): string {
  if (authorName) {
    return `Cover of ${bookTitle} by ${authorName}`;
  }
  return `Cover of ${bookTitle}`;
}

/**
 * Helper function to generate descriptive alt text for author profile images
 */
export function getAuthorProfileAlt(authorName: string): string {
  return `Profile picture of ${authorName}`;
}

/**
 * Helper function to generate descriptive alt text for feature images
 */
export function getFeatureImageAlt(featureTitle: string): string {
  return `Illustration for ${featureTitle}`;
}
