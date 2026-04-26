/**
 * Professional Footer — shown on public pages (landing, marketplace, about, etc.)
 */
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Footer() {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-deep-space/80 backdrop-blur-sm" dir={isHebrew ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-3">
              <img src="/img/new/logo-mestory-small.png" alt="MeStory" className="h-12 w-auto object-contain nav-logo-glow" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {isHebrew
                ? 'יש לך סיפור. אנחנו נהפוך אותו לספר.'
                : 'You have a story. We turn it into a book.'
              }
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">
              {isHebrew ? 'המוצר' : 'Product'}
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/dashboard" className="hover:text-memorial-gold transition">{isHebrew ? 'הספרים שלי' : 'My Books'}</Link></li>
              <li><Link to="/marketplace" className="hover:text-memorial-gold transition">{isHebrew ? 'חנות ספרים' : 'Book Store'}</Link></li>
              <li><Link to="/guides" className="hover:text-memorial-gold transition">{isHebrew ? 'מדריכים' : 'Guides'}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">
              {isHebrew ? 'מידע' : 'Info'}
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-memorial-gold transition">{isHebrew ? 'אודות' : 'About'}</Link></li>
              <li><Link to="/faq" className="hover:text-memorial-gold transition">{isHebrew ? 'שאלות נפוצות' : 'FAQ'}</Link></li>
              <li><Link to="/privacy" className="hover:text-memorial-gold transition">{isHebrew ? 'פרטיות' : 'Privacy'}</Link></li>
              <li><Link to="/terms" className="hover:text-memorial-gold transition">{isHebrew ? 'תנאי שימוש' : 'Terms'}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3 text-sm">
              {isHebrew ? 'צור קשר' : 'Contact'}
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="mailto:mestory.tec@gmail.com" className="hover:text-memorial-gold transition">
                  mestory.tec@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; {year} MeStory. {isHebrew ? 'כל הזכויות שמורות.' : 'All rights reserved.'}
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            {isHebrew ? 'נבנה עם' : 'Built with'} <Heart className="w-3 h-3 text-red-500" /> {isHebrew ? 'בישראל' : 'in Israel'}
          </p>
        </div>
      </div>
    </footer>
  );
}
