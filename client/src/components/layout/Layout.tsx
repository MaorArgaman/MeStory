import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import Navbar from './Navbar';

const logoIcon = '/img/logo-glow.png';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation('common');
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Skip Link for Accessibility - WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        {t('accessibility.skip_to_content', 'Skip to main content')}
      </a>
      <Navbar />
      <main className="pt-20 flex-1" role="main" id="main-content" tabIndex={-1}>
        {children}
      </main>

      {/* Footer */}
      <footer className="footer-paper relative bg-deep-space/90 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col items-center gap-4">
          <img
            src={logoIcon}
            alt="MeStory"
            className="nav-logo-glow h-12 w-auto object-contain"
          />
          <p className="text-gray-400 text-sm text-center">
            <span dir="rtl">נבנה עם ❤️ בישראל</span>
            {' · '}
            <span>Built with ❤️ in Israel</span>
          </p>
          <p className="text-gray-600 text-xs">
            &copy; {new Date().getFullYear()} MeStory. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
