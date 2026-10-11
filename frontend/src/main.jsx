import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
            },
            success: { iconTheme: { primary: '#16A34A', secondary: 'white' } },
            error: { iconTheme: { primary: '#DC2626', secondary: 'white' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
