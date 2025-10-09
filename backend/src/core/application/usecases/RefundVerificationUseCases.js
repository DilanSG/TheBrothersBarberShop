import crypto from 'crypto';
import { logger } from '../../../shared/utils/logger.js';

/**
 * Casos de uso para generar y validar códigos de verificación para reembolsos
 * Los códigos se regeneran cada hora automáticamente
 */
class RefundVerificationUseCases {
  constructor() {
    this.currentCode = null;
    this.codeGeneratedAt = null;
    this.generateNewCode(); // Sin log en constructor
    
    // Generar nuevo código cada hora
    setInterval(() => {
      this.generateNewCode(true); // Con log en intervalos
    }, 60 * 60 * 1000); // 1 hora
  }

  /**
   * Inicializar logging del sistema de seguridad
   */
  initializeLogging() {
    logger.security(`Código de verificación de reembolsos generado: ${this.currentCode} (Válido por 1 hora)`);
  }

  /**
   * Generar un nuevo código de verificación
   */
  generateNewCode(showLog = false) {
    // Generar código de 6 dígitos
    this.currentCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.codeGeneratedAt = new Date();
    
    if (showLog) {
      logger.security(`Código de verificación de reembolsos generado: ${this.currentCode} (Válido por 1 hora)`);
    }
  }

  /**
   * Obtener el código actual
   */
  getCurrentCode() {
    return {
      code: this.currentCode,
      generatedAt: this.codeGeneratedAt,
      expiresAt: new Date(this.codeGeneratedAt.getTime() + 60 * 60 * 1000)
    };
  }

  /**
   * Validar un código
   */
  validateCode(inputCode) {
    if (!inputCode || !this.currentCode) {
      return false;
    }
    
    return inputCode.toString() === this.currentCode;
  }

  /**
   * Tiempo restante hasta el próximo código
   */
  getTimeUntilNextCode() {
    if (!this.codeGeneratedAt) return 0;
    
    const nextCodeTime = new Date(this.codeGeneratedAt.getTime() + 60 * 60 * 1000);
    const now = new Date();
    
    return Math.max(0, nextCodeTime.getTime() - now.getTime());
  }
}

// Instancia singleton
export const refundVerificationService = new RefundVerificationUseCases();
export default RefundVerificationUseCases;