import { type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { useAuth } from './context/AuthContext';
import { AccountLinkPage } from './pages/AccountLinkPage';
import { LoginPage } from './pages/LoginPage';
import { PasswordPage } from './pages/PasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProvidersPage } from './pages/ProvidersPage';
import { RegisterPage } from './pages/RegisterPage';
import { SessionsPage } from './pages/SessionsPage';

function Loading() {
  return (
    <div className="page">
      <div className="spinner" role="status" aria-live="polite" aria-label="Загрузка" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') {
    return <Loading />;
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') {
    return <Loading />;
  }
  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      {/* Экран подтверждения привязки SSO открыт и гостю, и вошедшему
          пользователю: сессию здесь ещё не выдаём, а GuestRoute отправил бы
          вошедшего на главную, сломав подтверждение. */}
      <Route path="/link-account" element={<AccountLinkPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="providers" element={<ProvidersPage />} />
        <Route path="password" element={<PasswordPage />} />
        <Route path="sessions" element={<SessionsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
