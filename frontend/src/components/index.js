// Componentes de autenticación
export { default as ProtectedRoute } from './auth/ProtectedRoute';
export { default as PublicRoute } from './auth/PublicRoute';
export { default as RequireAuth } from './auth/RequireAuth';

// Componentes de layout
export { default as Navbar } from './layout/Navbar';
export { default as PageContainer } from './layout/PageContainer';

// Componentes de notificaciones
export { default as NotificationContainer } from './notifications/NotificationContainer';

// Componentes de inventario
export { default as InventorySnapshot } from './inventory/InventorySnapshot';
export { default as SavedInventoriesModal } from './inventory/SavedInventoriesModal';

// Componentes de usuario
export * from './user';

// Componentes UI
export * from './ui';
