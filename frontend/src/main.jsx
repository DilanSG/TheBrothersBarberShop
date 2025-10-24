import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import * as Sentry from "@sentry/react";
import App from './app.jsx';
import './index.css';
import { AuthProvider } from './shared/contexts/AuthContext.jsx';
import { NotificationProvider } from './shared/contexts/NotificationContext.jsx';

// 🐛 Configurar Sentry para error tracking (Vercel)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN_FRONTEND;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% de sesiones
    replaysOnErrorSampleRate: 1.0, // 100% cuando hay error
    
    // Filtrar errores sensibles
    beforeSend(event) {
      // No enviar errores de desarrollo
      if (import.meta.env.MODE === 'development') {
        console.error('Sentry (dev mode):', event);
        return null;
      }
      return event;
    },
  });
  console.log('✅ Sentry inicializado en frontend (Vercel)');
} else {
  console.log('ℹ️  Sentry deshabilitado (VITE_SENTRY_DSN_FRONTEND no configurado)');
}

// Obtener la base URL del entorno o usar un valor por defecto
const baseUrl = import.meta.env.BASE_URL || '/';

ReactDOM.createRoot(document.getElementById('root')).render(
	<BrowserRouter 
		basename={baseUrl}
		future={{
			v7_startTransition: true,
			v7_relativeSplatPath: true
		}}
	>
		<AuthProvider>
			<NotificationProvider>
				<App />
				<SpeedInsights />
				<Analytics />
			</NotificationProvider>
		</AuthProvider>
	</BrowserRouter>
);
