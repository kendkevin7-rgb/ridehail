import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RideProvider } from './contexts/RideContext';
import { PaymentProvider } from './contexts/PaymentContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AuthLayout } from './components/layout/AuthLayout';
import { RiderLayout } from './components/layout/RiderLayout';
import { DriverLayout } from './components/layout/DriverLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { HomePage } from './pages/rider/HomePage';
import { BookRidePage } from './pages/rider/BookRidePage';
import { RideHistoryPage } from './pages/rider/RideHistoryPage';
import { ProfilePage } from './pages/rider/ProfilePage';
import { PaymentMethodsPage } from './pages/rider/PaymentMethodsPage';
import DriverDashboardPage from './pages/driver/DriverDashboardPage';
import VerificationPage from './pages/driver/VerificationPage';
import RideRequestsPage from './pages/driver/RideRequestsPage';
import EarningsPage from './pages/driver/EarningsPage';
import DriverProfilePage from './pages/driver/DriverProfilePage';
import { UserRole } from './types';
import { Spinner } from './components/ui/Spinner';
import { RiderProvider } from './contexts/RiderContext';
import { DriverProvider } from './contexts/DriverContext';

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === UserRole.RIDER) return <Navigate to="/rider/home" replace />;
  return <Navigate to="/driver/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <RideProvider>
            <PaymentProvider>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>
                <Route
                  path="/rider"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.RIDER]}>
                      <RiderProvider>
                        <RiderLayout />
                      </RiderProvider>
                    </ProtectedRoute>
                  }
                >
                  <Route path="home" element={<HomePage />} />
                  <Route path="book" element={<BookRidePage />} />
                  <Route path="history" element={<RideHistoryPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="payments" element={<PaymentMethodsPage />} />
                  <Route index element={<Navigate to="home" replace />} />
                </Route>
                <Route
                  path="/driver"
                  element={
                    <ProtectedRoute allowedRoles={[UserRole.DRIVER]}>
                      <DriverProvider>
                        <DriverLayout />
                      </DriverProvider>
                    </ProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<DriverDashboardPage />} />
                  <Route path="verification" element={<VerificationPage />} />
                  <Route path="requests" element={<RideRequestsPage />} />
                  <Route path="earnings" element={<EarningsPage />} />
                  <Route path="profile" element={<DriverProfilePage />} />
                  <Route index element={<Navigate to="dashboard" replace />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </PaymentProvider>
          </RideProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
