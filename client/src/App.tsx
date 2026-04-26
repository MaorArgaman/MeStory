import { lazy, Suspense } from 'react';
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
import BookLoader from './components/common/BookLoader';
import ErrorBoundary from './components/ErrorBoundary';
import PageBoundary from './components/PageBoundary';
import { OrganizationSchema, WebsiteSchema } from './components/seo';
import { GoogleAnalytics } from './components/analytics';
import { LanguageRedirect, LanguageRoute } from './components/routing';
import AdminCheck from './components/AdminCheck';
import { useOfflineDetection } from './hooks/useOfflineDetection';
import { useNativeAuthSync } from './hooks/useNativeAuthSync';

// Initialize i18n
import './i18n';

// Eagerly loaded (landing page is critical for first paint / SEO)
import LandingPage from './pages/LandingPage';

// Lazy-loaded pages — each is its own chunk so a failure in one
// cannot break the others, and bundle size per route is minimized.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AuthSuccessPage = lazy(() => import('./pages/AuthSuccessPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const BookWritingPage = lazy(() => import('./pages/BookWritingPage'));
const DesignStudioPage = lazy(() => import('./pages/DesignStudioPage'));
const BookLayoutPage = lazy(() => import('./pages/BookLayoutPage'));
const BookDesignPage = lazy(() => import('./pages/BookDesignPage'));
const PublishingPage = lazy(() => import('./pages/PublishingPage'));
const PublishMetadata = lazy(() => import('./pages/publish/PublishMetadata'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const UpgradeSuccessPage = lazy(() => import('./pages/UpgradeSuccessPage'));
const PaymentReturnPage = lazy(() => import('./pages/PaymentReturnPage'));
const ReaderPage = lazy(() => import('./pages/ReaderPage'));
const BookDetailsPage = lazy(() => import('./pages/BookDetailsPage'));
const AuthorProfilePage = lazy(() => import('./pages/AuthorProfilePage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const LibraryPage = lazy(() => import('./pages/LibraryPage'));
const EarningsPage = lazy(() => import('./pages/EarningsPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const GuidesPage = lazy(() => import('./pages/GuidesPage'));
const HowToWriteBook = lazy(() => import('./pages/guides/HowToWriteBook'));
const HowToPublishBook = lazy(() => import('./pages/guides/HowToPublishBook'));
const HowToEarnMoney = lazy(() => import('./pages/guides/HowToEarnMoney'));
const HowToCollaborate = lazy(() => import('./pages/guides/HowToCollaborate'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AccessibilityStatementPage = lazy(() => import('./pages/AccessibilityStatementPage'));
const MyStoryPage = lazy(() => import('./pages/MyStoryPage'));
const InvitationPage = lazy(() => import('./pages/InvitationPage'));
const ContributePage = lazy(() => import('./pages/ContributePage'));
const PrintBookPage = lazy(() => import('./pages/PrintBookPage'));
const DiagnoseImagesPage = lazy(() => import('./pages/DiagnoseImagesPage'));

// Localized public routes component factory
function createLocalizedRoutes() {
  // Helper to wrap a page with LanguageRoute + Layout + per-page boundary
  const LocalizedLayout = ({ children }: { children: React.ReactNode }) => (
    <LanguageRoute>
      <Layout>
        <PageBoundary>{children}</PageBoundary>
      </Layout>
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
      <Route path="/en/login" element={<LanguageRoute><RedirectIfAuth><PageBoundary><LoginPage /></PageBoundary></RedirectIfAuth></LanguageRoute>} />
      <Route path="/en/register" element={<LanguageRoute><RedirectIfAuth><PageBoundary><RegisterPage /></PageBoundary></RedirectIfAuth></LanguageRoute>} />
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
      <Route path="/en/guides/collaborate" element={<LocalizedLayout><HowToCollaborate /></LocalizedLayout>} />
      <Route path="/en/accessibility" element={<LocalizedLayout><AccessibilityStatementPage /></LocalizedLayout>} />

      {/* Hebrew routes */}
      <Route path="/he" element={<LocalizedLanding />} />
      <Route path="/he/login" element={<LanguageRoute><RedirectIfAuth><PageBoundary><LoginPage /></PageBoundary></RedirectIfAuth></LanguageRoute>} />
      <Route path="/he/register" element={<LanguageRoute><RedirectIfAuth><PageBoundary><RegisterPage /></PageBoundary></RedirectIfAuth></LanguageRoute>} />
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
      <Route path="/he/guides/collaborate" element={<LocalizedLayout><HowToCollaborate /></LocalizedLayout>} />
      <Route path="/he/accessibility" element={<LocalizedLayout><AccessibilityStatementPage /></LocalizedLayout>} />
    </>
  );
}

function AppContent() {
  const { loading } = useAuth();
  const { direction, language } = useLanguage();
  const location = useLocation();
  useOfflineDetection();
  useNativeAuthSync();

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
        {/* Outer ErrorBoundary is the last line of defense for the shell itself */}
        <ErrorBoundary>
          <LanguageRedirect>
            {/* Suspense wraps lazy-loaded pages — BookLoader is shown while the chunk downloads */}
            <Suspense fallback={<BookLoader variant="fullscreen" />}>
            <Routes location={location} key={location.pathname}>
              {/* Root path - LanguageRedirect handles redirecting to /en or /he */}
              <Route path="/" element={<RedirectIfAuth><LandingPage /></RedirectIfAuth>} />

              {/* Language-prefixed public routes (explicit /en and /he) */}
              {createLocalizedRoutes()}

              {/* Authentication routes (no language prefix needed) */}
              <Route path="/login" element={<RedirectIfAuth><PageBoundary><LoginPage /></PageBoundary></RedirectIfAuth>} />
              <Route path="/register" element={<RedirectIfAuth><PageBoundary><RegisterPage /></PageBoundary></RedirectIfAuth>} />
              <Route path="/auth-success" element={<PageBoundary><AuthSuccessPage /></PageBoundary>} />

              {/* Invitation route (accessible without auth, will redirect to login if needed) */}
              <Route path="/invitation/:token" element={<PageBoundary><InvitationPage /></PageBoundary>} />
              <Route path="/contribute/:bookId" element={<PageBoundary><ContributePage /></PageBoundary>} />

              {/* Print-only route used by Puppeteer/headless Chrome to export a book as PDF.
                  No Layout, no auth wrapper — the token is injected via ?token=... query param. */}
              <Route path="/print/:bookId" element={<PageBoundary><PrintBookPage /></PageBoundary>} />

              {/* Internal image diagnostic page — visit /diagnose-images/:bookId
                  to see every image URL saved on the book and migrate them to
                  permanent storage with one click. */}
              <Route
                path="/diagnose-images/:bookId"
                element={
                  <RequireAuth>
                    <PageBoundary><DiagnoseImagesPage /></PageBoundary>
                  </RequireAuth>
                }
              />

              {/* Protected Routes with Layout - no language prefix */}
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <Layout>
                      <PageBoundary><DashboardPage /></PageBoundary>
                    </Layout>
                  </RequireAuth>
                }
              />
              <Route
                path="/editor/:bookId"
                element={
                  <RequireAuth>
                    <PageBoundary><BookWritingPage /></PageBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/design/:bookId"
                element={
                  <RequireAuth>
                    <PageBoundary><DesignStudioPage /></PageBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/layout/:bookId"
                element={
                  <RequireAuth>
                    <PageBoundary><BookLayoutPage /></PageBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/book-design/:bookId"
                element={
                  <RequireAuth>
                    <PageBoundary><BookDesignPage /></PageBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/publish/:bookId"
                element={
                  <RequireAuth>
                    <Layout>
                      <PageBoundary><PublishingPage /></PageBoundary>
                    </Layout>
                  </RequireAuth>
                }
              />
              <Route
                path="/publish-metadata/:bookId"
                element={
                  <RequireAuth>
                    <Layout>
                      <PageBoundary><PublishMetadata /></PageBoundary>
                    </Layout>
                  </RequireAuth>
                }
              />

              {/* Backwards compatible public routes (without language prefix) */}
              <Route
                path="/my-story"
                element={
                  <Layout>
                    <PageBoundary><MyStoryPage /></PageBoundary>
                  </Layout>
                }
              />
              <Route
                path="/marketplace"
                element={
                  <Layout>
                    <PageBoundary><MarketplacePage /></PageBoundary>
                  </Layout>
                }
              />
              <Route
                path="/book/:id"
                element={
                  <Layout>
                    <PageBoundary><BookDetailsPage /></PageBoundary>
                  </Layout>
                }
              />
              <Route
                path="/faq"
                element={
                  <Layout>
                    <PageBoundary><FAQPage /></PageBoundary>
                  </Layout>
                }
              />
              <Route
                path="/about"
                element={
                  <Layout>
                    <PageBoundary><AboutPage /></PageBoundary>
                  </Layout>
                }
              />
              <Route
                path="/privacy"
                element={
                  <Layout>
                    <PageBoundary><PrivacyPolicyPage /></PageBoundary>
                  </Layout>
                }
              />
              <Route
                path="/terms"
                element={
                  <Layout>
                    <PageBoundary><TermsOfServicePage /></PageBoundary>
                  </Layout>
                }
              />
              <Route
                path="/guides"
                element={
                  <Layout>
                    <PageBoundary><GuidesPage /></PageBoundary>
                  </Layout>
                }
              />
              <Route
                path="/guides/write-book"
                element={
                  <Layout>
                    <PageBoundary><HowToWriteBook /></PageBoundary>
                  </Layout>
                }
              />
              <Route
                path="/guides/publish-book"
                element={
                  <Layout>
                    <PageBoundary><HowToPublishBook /></PageBoundary>
                  </Layout>
                }
              />
              <Route
                path="/guides/earn-money"
                element={
                  <Layout>
                    <PageBoundary><HowToEarnMoney /></PageBoundary>
                  </Layout>
                }
              />
              <Route
                path="/guides/collaborate"
                element={
                  <Layout>
                    <PageBoundary><HowToCollaborate /></PageBoundary>
                  </Layout>
                }
              />
              <Route
                path="/accessibility"
                element={
                  <Layout>
                    <PageBoundary><AccessibilityStatementPage /></PageBoundary>
                  </Layout>
                }
              />

              {/* More protected routes */}
              <Route
                path="/subscription"
                element={
                  <RequireAuth>
                    <Layout>
                      <PageBoundary><SubscriptionPage /></PageBoundary>
                    </Layout>
                  </RequireAuth>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAuth>
                    <Layout>
                      <PageBoundary><SettingsPage /></PageBoundary>
                    </Layout>
                  </RequireAuth>
                }
              />
              <Route
                path="/success"
                element={
                  <RequireAuth>
                    <PageBoundary><UpgradeSuccessPage /></PageBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/payment/success"
                element={
                  <RequireAuth>
                    <PageBoundary><PaymentReturnPage variant="success" /></PageBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/payment/cancel"
                element={
                  <RequireAuth>
                    <PageBoundary><PaymentReturnPage variant="cancel" /></PageBoundary>
                  </RequireAuth>
                }
              />
              <Route
                path="/read/:bookId"
                element={<PageBoundary><ReaderPage /></PageBoundary>}
              />
              <Route
                path="/profile/:id"
                element={
                  <Layout>
                    <PageBoundary><AuthorProfilePage /></PageBoundary>
                  </Layout>
                }
              />

              {/* Library Route */}
              <Route
                path="/library"
                element={
                  <RequireAuth>
                    <Layout>
                      <PageBoundary><LibraryPage /></PageBoundary>
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
                      <PageBoundary><EarningsPage /></PageBoundary>
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
                        <PageBoundary><AdminDashboard /></PageBoundary>
                      </Layout>
                    </AdminCheck>
                  </RequireAuth>
                }
              />

              {/* Catch all - redirect to landing page */}
              <Route path="*" element={<Layout><PageBoundary><NotFoundPage /></PageBoundary></Layout>} />
            </Routes>
            </Suspense>
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
