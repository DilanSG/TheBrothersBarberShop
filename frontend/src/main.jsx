import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app.jsx';
import './index.css';
import { AuthProvider } from './shared/contexts/AuthContext.jsx';
import { NotificationProvider } from './shared/contexts/NotificationContext.jsx';

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
			</NotificationProvider>
		</AuthProvider>
	</BrowserRouter>
);
