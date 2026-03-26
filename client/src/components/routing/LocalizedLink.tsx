import { forwardRef } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { useLocalizedPath } from '../../hooks/useLocalizedPath';

export interface LocalizedLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  /**
   * If true, don't add language prefix even for public routes
   */
  skipLocalization?: boolean;
}

/**
 * A wrapper around react-router-dom's Link that automatically
 * adds language prefix for public localized routes
 */
const LocalizedLink = forwardRef<HTMLAnchorElement, LocalizedLinkProps>(
  ({ to, skipLocalization = false, ...props }, ref) => {
    const { localizedPath } = useLocalizedPath();

    // Determine the final path
    const finalPath = skipLocalization ? to : localizedPath(to);

    return <Link ref={ref} to={finalPath} {...props} />;
  }
);

LocalizedLink.displayName = 'LocalizedLink';

export default LocalizedLink;
