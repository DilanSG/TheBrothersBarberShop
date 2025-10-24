/**
 * Gestor centralizado para el bloqueo de scroll del body
 * Maneja múltiples modales de forma segura
 */

class ScrollLockManager {
  constructor() {
    this.lockCount = 0;
    this.originalOverflow = null;
    this.isLocked = false;
  }

  /**
   * Bloquea el scroll del body
   * Incrementa el contador para manejar múltiples modales
   */
  lock() {
    if (this.lockCount === 0) {
      // Guardar el estilo original solo la primera vez
      this.originalOverflow = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
      this.isLocked = true;
    }
    
    this.lockCount++;
  }

  /**
   * Desbloquea el scroll del body
   * Decrementa el contador y solo restaura cuando llega a 0
   */
  unlock() {
    // Prevenir unlock cuando el contador ya está en 0
    if (this.lockCount <= 0) {
      return;
    }
    
    this.lockCount--;
    
    if (this.lockCount === 0) {
      // Restaurar el overflow original solo cuando no hay más modales
      const restoredOverflow = this.originalOverflow || 'auto';
      document.body.style.overflow = restoredOverflow;
      this.isLocked = false;
    }
  }

  /**
   * Fuerza el desbloqueo (para casos de emergencia)
   */
  forceUnlock() {
    this.lockCount = 0;
    document.body.style.overflow = this.originalOverflow || 'auto';
    this.isLocked = false;
  }

  /**
   * Obtiene el estado actual
   */
  getState() {
    return {
      lockCount: this.lockCount,
      isLocked: this.isLocked,
      originalOverflow: this.originalOverflow
    };
  }
}

// Instancia singleton
const scrollLockManager = new ScrollLockManager();

export default scrollLockManager;