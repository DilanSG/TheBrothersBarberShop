import crypto from 'crypto';
import { logger } from '../shared/utils/logger.js';

/**
 * Servicio para generar y validar códigos de verificación para reembolsos
 * Los códigos se regeneran cada hora automáticamente
 */
class RefundVerificationService {
  constructor() {
    this.currentCode = null;
    this.codeGeneratedAt = null;
    this.generateNewCode();
    
    // Generar nuevo código cada hora
    setInterval(() => {
      this.generateNewCode();
    }, 60 * 60 * 1000); // 1 hora
  }

  /**
   * Generar un nuevo código de verificación
   */
  generateNewCode() {
    // Generar código de 6 dígitos
    this.currentCode = Math.floor(100000 + Math.random() * 900000).toString();
    this.codeGeneratedAt = new Date();
    
    logger.info('🔐 Nuevo código de verificación de reembolsos generado', {
      code: this.currentCode,
      generatedAt: this.codeGeneratedAt
    });
    
    console.log(`🔐 Código de verificación de reembolsos: ${this.currentCode}`);
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
export const refundVerificationService = new RefundVerificationService();
export default RefundVerificationService;