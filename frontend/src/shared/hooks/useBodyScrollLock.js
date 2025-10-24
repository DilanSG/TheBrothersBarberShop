import { useEffect } from 'react';

/**
 * Hook personalizado para bloquear/desbloquear el scroll del body
 * Preserva la scrollbar para evitar layout shifts
 */
export const useBodyScrollLock = (isLocked = false) => {
  useEffect(() => {
    if (!isLocked) return;

    // Guardar el overflow original
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;

    // Calcular el ancho de la scrollbar
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Aplicar estilos para bloquear scroll pero mantener scrollbar visual
    document.body.style.overflow = 'hidden';
    
    // Compensar el ancho de la scrollbar para evitar layout shift
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${parseInt(originalPaddingRight) + scrollbarWidth}px`;
    }

    // Cleanup function para restaurar estilos originales
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isLocked]);
};

export default useBodyScrollLock;