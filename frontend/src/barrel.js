/**
 * Barrel exports para frontend - Índice central de utilidades compartidas
 * 
 * Centraliza las exportaciones más utilizadas para simplificar imports
 * y reducir la complejidad de rutas relativas profundas.
 */

// Hooks compartidos más utilizados
export { useAuth } from './shared/contexts/AuthContext';
export { useNotification } from './shared/contexts/NotificationContext';
export { useInventory } from './shared/contexts/InventoryContext';
export { usePaymentMethods } from './shared/contexts/PaymentMethodsContext';
export { useFinancialReports } from './shared/hooks/useFinancialReports';
export { useBarberStats } from './shared/hooks/useBarberStats';
export { useDetailedReports } from './shared/hooks/useDetailedReports';
export { useFetch } from './shared/hooks/useFetch';
export { useForm } from './shared/hooks/useForm';

// Componentes UI más utilizados
export { default as Button } from './shared/components/ui/button';
export { default as Card } from './shared/components/ui/card';
export { default as LoadingSpinner } from './shared/components/ui/LoadingSpinner';
export { default as UserAvatar } from './shared/components/ui/UserAvatar';
export { default as StatusBadge } from './shared/components/ui/StatusBadge';
export { default as GradientButton } from './shared/components/ui/GradientButton';
export { default as GradientText } from './shared/components/ui/GradientText';

// Componentes comunes más utilizados
export { Button as CommonButton, FormControls, DataDisplay, Feedback } from './shared/components/common';
export { default as Modal } from './shared/components/modals/Modal';
export { default as ErrorBoundary } from './shared/components/ErrorBoundary';

// Componentes de layout
export { default as Navbar } from './shared/components/layout/Navbar';
export { default as PageContainer } from './shared/components/layout/PageContainer';

// Servicios más utilizados
export { api } from './shared/services/api';
export { authService } from './shared/services/authService';
export { cacheService } from './shared/services/cacheService';

// Utilidades más utilizadas
export { logger } from './shared/utils/logger';
export { formatDate, formatAmount } from './shared/utils/dateUtils';
export { default as performanceTracker } from './shared/utils/performanceTracker';

// Componentes de autenticación
export { default as ProtectedRoute } from './features/auth/ProtectedRoute';
export { default as RequireAuth } from './features/auth/RequireAuth';

// Re-exportar módulo de gastos recurrentes desde shared
export * from './shared/recurring-expenses/index.js';