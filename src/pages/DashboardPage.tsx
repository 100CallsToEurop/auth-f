import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Профиль</h1>
        <dl className="details">
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>ID</dt>
            <dd>{user.id}</dd>
          </div>
        </dl>
        <button className="button secondary" onClick={() => void handleLogout()} disabled={loggingOut}>
          {loggingOut ? 'Выход…' : 'Выйти'}
        </button>
      </div>
    </div>
  );
}
