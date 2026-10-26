import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { consumeAccountLinkToken, consumeProviderAccessToken } from './lib/auth';
import './styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

// Токен забираем до рендера: к моменту запроса /auth/me адресная строка уже
// очищена, а StrictMode не прочитает fragment повторно.
const providerAccessToken = consumeProviderAccessToken();

// Одноразовый токен привязки читаем так же до рендера: страница /link-account
// должна получить его из памяти, даже если StrictMode смонтирует её дважды.
consumeAccountLinkToken();

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider initialAccessToken={providerAccessToken}>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
