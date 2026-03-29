import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { SocketProvider } from './contexts/SocketContext';
import RequireAuth from './components/RequireAuth';
import RedirectIfAuth from './components/RedirectIfAuth';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { OrganizationSchema, WebsiteSchema } from './components/seo';
import { GoogleAnalytics } from './components/analytics';
import { LanguageRedirect, LanguageRoute } from './components/routing';

// Initialize i18n
import './i18n';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import DashboardPage from './pages/DashboardPage';
import BookWritingPage from './pages/BookWritingPage';
import DesignStudioPage from './pages/DesignStudioPage';
import BookLayoutPage from './pages/BookLayoutPage';
import BookDesignPage from './pages/BookDesignPage';
import PublishingPage from './pages/PublishingPage';
import PublishMetadata from './pages/publish/PublishMetadata';
import MarketplacePage from './pages/MarketplacePage';
import SubscriptionPage from './pages/SubscriptionPage';
import SettingsPage from './pages/SettingsPage';
import UpgradeSuccessPage from './pages/UpgradeSuccessPage';
import ReaderPage from './pages/ReaderPage';
import BookDetailsPage from './pages/BookDetailsPage';
import AuthorProfilePage from './pages/AuthorProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCheck from './components/AdminCheck';
import LibraryPage from './pages/LibraryPage';
import EarningsPage from './pages/EarningsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import FAQPage from './pages/FAQPage';
import AboutPage from './pages/AboutPage';
import GuidesPage from './pages/GuidesPage';
import HowToWriteBook from './pages/guides/HowToWriteBook';
import HowToPublishBook from './pages/guides/HowToPublishBook';
import HowToEarnMoney from './pages/guides/HowToEarnMoney';
import NotFoundPage from './pages/NotFoundPage';
import MyStoryPage from './pages/MyStoryPage';

// Localized public routes component factory
function createLocalizedRoutes() {
  // Helper to wrap a page with LanguageRoute and Layout
  const LocalizedLayout = ({ children }: { children: React.ReactNode }) => (
    <LanguageRoute>
      <Layout>{children}</Layout>
    </LanguageRoute>
  );

  // Helper for landing page (no Layout, has RedirectIfAuth)
  const LocalizedLanding = () => (
    <LanguageRoute>
      <RedirectIfAuth><LandingPage /></RedirectIfAuth>
    </LanguageRoute>
  );

  return (
    <>
      {/* English routes */}
      <Route path="/en" element={<LocalizedLanding />} />
      <Route path="/en/my-story" element={<LocalizedLayout><MyStoryPage /></LocalizedLayout>} />
      <Route path="/en/marketplace" element={<LocalizedLayout><MarketplacePage /></LocalizedLayout>} />
      <Route path="/en/book/:id" element={<LocalizedLayout><BookDetailsPage /></LocalizedLayout>} />
      <Route path="/en/faq" element={<LocalizedLayout><FAQPage /></LocalizedLayout>} />
      <Route path="/en/about" element={<LocalizedLayout><AboutPage /></LocalizedLayout>} />
      <Route path="/en/privacy" element={<LocalizedLayout><PrivacyPolicyPage /></LocalizedLayout>} />
      <Route path="/en/terms" element={<LocalizedLayout><TermsOfServicePage /></LocalizedLayout>} />
      <Route path="/en/guides" element={<LocalizedLayout><GuidesPage /></LocalizedLayout>} />
      <Route path="/en/guides/write-book" element={<LocalizedLayout><HowToWriteBook /></LocalizedLayout>} />
      <Route path="/en/guides/publish-book" element={<LocalizedLayout><HowToPublishBook /></LocalizedLayout>} />
      <Route path="/en/guides/earn-money" element={<LocalizedLayout><HowToEarnMoney /></LocalizedLayout>} />

      {/* Hebrew routes */}
      <Route path="/he" element={<LocalizedLanding />} />
      <Route path="/he/my-story" element={<LocalizedLayout><MyStoryPage /></LocalizedLayout>} />
      <Route path="/he/marketplace" element={<LocalizedLayout><MarketplacePage /></LocalizedLayout>} />
      <Route path="/he/book/:id" element={<LocalizedLayout><BookDetailsPage /></LocalizedLayout>} />
      <Route path="/he/faq" element={<LocalizedLayout><FAQPage /></LocalizedLayout>} />
      <Route path="/he/about" element={<LocalizedLayout><AboutPage /></LocalizedLayout>} />
      <Route path="/he/privacy" element={<LocalizedLayout><PrivacyPolicyPage /></LocalizedLayout>} />
      <Route path="/he/terms" element={<LocalizedLayout><TermsOfServicePage /></LocalizedLayout>} />
      <Route path="/he/guides" element={<LocalizedLayout><GuidesPage /></LocalizedLayout>} />
      <Route path="/he/guides/write-book" element={<LocalizedLayout><HowToWriteBook /></LocalizedLayout>} />
      <Route path="/he/guides/publish-book" element={<LocalizedLayout><HowToPublishBook /></LocalizedLayout>} />
      <Route path="/he/guides/earn-money" element={<LocalizedLayout><HowToEarnMoney /></LocalizedLayout>} />
    </>
  );
}

function AppContent() {
  const { loading } = useAuth();
  const { direction, language } = useLanguage();
  const location = useLocation();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Get locale for SEO schemas
  const locale = language === 'he' ? 'he' : 'en';

  return (
    <div dir={direction} lang={language}>
      {/* Google Analytics */}
      <GoogleAnalytics />

      {/* Global SEO Structured Data */}
      <OrganizationSchema locale={locale} />
      <WebsiteSchema locale={locale} />

      <Toaster
        position="top-right"
        toastOptions={{
          className: 'glass',
          style: {
            background: 'rgba(17, 17, 35, 0.9)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />

      <AnimatePresence mode="wait">
        <ErrorBoundary>
          <LanguageRedirect>
            <Routes location={location} key={location.pathname}>
              {/* Root path - LanguageRedirect handles redirecting to /en or /he */}
              <Route path="/" element={<RedirectIfAuth><LandingPage /></RedirectIfAuth>} />

              {/* Language-prefixed public routes (explicit /en and /he) */}
              {createLocalizedRoutes()}

              {/* Authentication routes (no language prefix needed) */}
              <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
              <Route path="/register" element={<RedirectIfAuth><RegisterPage /></RedirectIfAuth>} />
              <Route path="/auth-success" element={<AuthSuccessPage />} />

              {/* Protected Routes with Layout - no language prefix */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </RequireAuth>
                }
              />
              <Route
                path="/editor/:bookId"
                element={
                  <RequireAuth>
                    <BookWritingPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/design/:bookId"
                element={
                  <RequireAuth>
                    <DesignStudioPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/layout/:bookId"
                element={
                  <RequireAuth>
                    <BookLayoutPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/book-design/:bookId"
                element={
                  <RequireAuth>
                    <BookDesignPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/publish/:bookId"
                element={
                  <RequireAuth>
                    <Layout>
                      <PublishingPage />
                    </Layout>
                  </RequireAuth>
                }
              />
              <Route
                path="/publish-metadata/:bookId"
                element={
                  <RequireAuth>
                    <Layout>
                      <PublishMetadata />
                    </Layout>
                  </RequireAuth>
                }
              />

              {/* Backwards compatible public routes (without language prefix) */}
              <Route
                path="/my-story"
                element={
                  <Layout>
                    <MyStoryPage />
                  </Layout>
                }
              />
              <Route
                path="/marketplace"
                element={
                  <Layout>
                    <MarketplacePage />
                  </Layout>
                }
              />
              <Route
                path="/book/:id"
                element={
                  <Layout>
                    <BookDetailsPage />
                  </Layout>
                }
              />
              <Route
                path="/faq"
                element={
                  <Layout>
                    <FAQPage />
                  </Layout>
                }
              />
              <Route
                path="/about"
                element={
                  <Layout>
                    <AboutPage />
                  </Layout>
                }
              />
              <Route
                path="/privacy"
                element={
                  <Layout>
                    <PrivacyPolicyPage />
                  </Layout>
                }
              />
              <Route
                path="/terms"
                element={
                  <Layout>
                    <TermsOfServicePage />
                  </Layout>
                }
              />
              <Route
                path="/guides"
                element={
                  <Layout>
                    <GuidesPage />
                  </Layout>
                }
              />
              <Route
                path="/guides/write-book"
                element={
                  <Layout>
                    <HowToWriteBook />
                  </Layout>
                }
              />
              <Route
                path="/guides/publish-book"
                element={
                  <Layout>
                    <HowToPublishBook />
                  </Layout>
                }
              />
              <Route
                path="/guides/earn-money"
                element={
                  <Layout>
                    <HowToEarnMoney />
                  </Layout>
                }
              />

              {/* More protected routes */}
              <Route
                path="/subscription"
                element={
                  <RequireAuth>
                    <Layout>
                      <SubscriptionPage />
                    </Layout>
                  </RequireAuth>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAuth>
                    <Layout>
                      <SettingsPage />
                    </Layout>
                  </RequireAuth>
                }
              />
              <Route
                path="/success"
                element={
                  <RequireAuth>
                    <UpgradeSuccessPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/read/:bookId"
                element={<ReaderPage />}
              />
              <Route
                path="/profile/:id"
                element={
                  <Layout>
                    <AuthorProfilePage />
                  </Layout>
                }
              />

              {/* Library Route */}
              <Route
                path="/library"
                element={
                  <RequireAuth>
                    <Layout>
                      <LibraryPage />
                    </Layout>
                  </RequireAuth>
                }
              />

              {/* Earnings Route */}
              <Route
                path="/earnings"
                element={
                  <RequireAuth>
                    <Layout>
                      <EarningsPage />
                    </Layout>
                  </RequireAuth>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <RequireAuth>
                    <AdminCheck>
                      <Layout>
                        <AdminDashboard />
                      </Layout>
                    </AdminCheck>
                  </RequireAuth>
                }
              />

              {/* Catch all - redirect to landing page */}
              <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
            </Routes>
          </LanguageRedirect>
        </ErrorBoundary>
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <CurrencyProvider>
        <AuthProvider>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </AuthProvider>
      </CurrencyProvider>
    </LanguageProvider>
  );
}

export default App;
