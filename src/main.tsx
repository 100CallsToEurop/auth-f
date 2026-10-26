import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { consumeProviderAccessToken } from './lib/auth';
import './styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

// Токен забираем до рендера: к моменту запроса /auth/me адресная строка уже
// очищена, а StrictMode не прочитает fragment повторно.
const providerAccessToken = consumeProviderAccessToken();

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider initialAccessToken={providerAccessToken}>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
