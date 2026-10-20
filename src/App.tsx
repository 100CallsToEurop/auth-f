import { type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

function Loading() {
  return (
    <div className="page">
      <div className="spinner" aria-label="Загрузка" />
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
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
