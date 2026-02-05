import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import RequireAuth from './components/RequireAuth';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/LoadingScreen';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthSuccessPage from './pages/AuthSuccessPage';
import DashboardPage from './pages/DashboardPage';
import BookWritingPage from './pages/BookWritingPage';
import DesignStudioPage from './pages/DesignStudioPage';
import BookLayoutPage from './pages/BookLayoutPage';
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

function AppContent() {
  const { loading } = useAuth();
  const location = useLocation();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div dir="auto">
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
        <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth-success" element={<AuthSuccessPage />} />

        {/* Protected Routes with Layout */}
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
        <Route
          path="/marketplace"
          element={
            <Layout>
              <MarketplacePage />
            </Layout>
          }
        />
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
          path="/book/:id"
          element={
            <Layout>
              <BookDetailsPage />
            </Layout>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <Layout>
              <AuthorProfilePage />
            </Layout>
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
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
