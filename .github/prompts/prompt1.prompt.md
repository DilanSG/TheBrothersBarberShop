---
mode: agent
---
# Prompt para Copilot: Auditoría y Mejora en la Gestión de Gastos

## Contexto
Estoy trabajando en una página de reportes que incluye un módulo de gestión de gastos. Necesito que analices cómo se están gestionando actualmente los gastos en el código y me sugieras la mejor manera de manejar esta funcionalidad para evitar incompatibilidades y problemas futuros.

### Objetivos:
1. **Analizar el código actual** de la gestión de gastos (modelos, controladores, vistas, lógica de negocio, integraciones, etc.).
2. **Detectar posibles problemas** de diseño, compatibilidad, escalabilidad o mantenibilidad.
3. **Sugerir una arquitectura o patrón de gestión de gastos** que:
   - Sea clara y fácilmente escalable.
   - Permita futuras integraciones (por ejemplo, con ERPs, APIs externas, múltiples monedas, etc.).
   - Evite duplicidad de datos, problemas de sincronización o errores comunes.
   - Sea compatible con el stack tecnológico del proyecto.
   - Siga buenas prácticas de desarrollo (separación de responsabilidades, validaciones, manejo de errores, etc.).

### Qué espero que hagas:
- Explica **cómo se está gestionando actualmente** la información de gastos a partir del código.
- Enumera **potenciales riesgos o problemas** en la implementación actual.
- Propón **mejoras concretas** o un refactor (estructura de carpetas, clases, endpoints recomendados, flujo de datos, etc.).
- Si es posible, ejemplifica con **fragmentos de código** o esquemas.
- Asegúrate de que la solución propuesta facilite el mantenimiento y evolución a futuro.
- Indica si ves dependencias tecnológicas críticas o puntos de acoplamiento fuerte a evitar.

### Información adicional
- El stack tecnológico es: [Especificar stack aquí, por ejemplo: Node.js + Express, React, MongoDB, etc.]
- Si necesitas analizar archivos específicos, pide que te los indique.

---

**Instrucciones para Copilot:**  
Analiza el código y entrega:
- Diagnóstico actual (cómo funciona la gestión de gastos).
- Lista de problemas o riesgos.
- Sugerencia de solución robusta y escalable, con justificación técnica.
- Ejemplos de estructura o fragmentos de código si corresponde.