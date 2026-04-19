import { ReactNode, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { WifiOff } from 'lucide-react';
import Navbar from './Navbar';

const logoIcon = '/img/new/logo-mestory-large.png';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation('common');
  const { isRTL, language } = useLanguage();
  const isHebrew = language === 'he';
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Offline Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-[999] bg-amber-600 text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          {isHebrew ? 'אין חיבור לאינטרנט. חלק מהתכונות לא יעבדו.' : 'No internet connection. Some features may not work.'}
        </div>
      )}

      {/* Skip Link for Accessibility - WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        {t('accessibility.skip_to_content', 'Skip to main content')}
      </a>
      <Navbar />
      <main className={`${isOffline ? 'pt-28' : 'pt-20'} flex-1`} role="main" id="main-content" tabIndex={-1}>
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
