/**
 * Configuración de Impresora Térmica
 * Para impresoras térmicas 58mm y 80mm
 */

/**
 * Obtener configuración de impresora según interfaz
 * @param {string} printerInterface - Tipo de interfaz: 'tcp', 'usb', 'serial'
 * @returns {Object} Configuración de la impresora
 */
export const getPrinterConfig = (printerInterface = 'tcp') => {
  const configs = {
    tcp: {
      type: 'network',
      interface: 'tcp',
      ip: process.env.PRINTER_IP || '192.168.1.100',
      port: parseInt(process.env.PRINTER_PORT) || 9100,
      timeout: 5000
    },
    usb: {
      type: 'usb',
      interface: 'usb',
      vendorId: process.env.PRINTER_VENDOR_ID || '0x04b8',
      productId: process.env.PRINTER_PRODUCT_ID || '0x0e03'
    },
    serial: {
      type: 'serial',
      interface: 'serial',
      port: process.env.PRINTER_SERIAL_PORT || 'COM1',
      baudRate: parseInt(process.env.PRINTER_BAUD_RATE) || 9600
    }
  };

  return configs[printerInterface] || configs.tcp;
};

/**
 * Obtener información del negocio para facturas
 * @returns {Object} Información del negocio
 */
export const getBusinessInfo = () => {
  return {
    name: process.env.BUSINESS_NAME || 'The Brothers Barber Shop',
    address: process.env.BUSINESS_ADDRESS || 'Calle Principal #123',
    city: process.env.BUSINESS_CITY || 'Bogotá',
    country: process.env.BUSINESS_COUNTRY || 'Colombia',
    phone: process.env.BUSINESS_PHONE || '+57 300 123 4567',
    email: process.env.BUSINESS_EMAIL || 'contacto@thebrothersbarbershop.com',
    taxId: process.env.BUSINESS_TAX_ID || 'NIT: 900.123.456-7',
    website: process.env.BUSINESS_WEBSITE || 'www.thebrothersbarbershop.com',
    
    // Configuración de factura
    invoicePrefix: process.env.INVOICE_PREFIX || 'TBB',
    currency: process.env.BUSINESS_CURRENCY || 'COP',
    currencySymbol: process.env.BUSINESS_CURRENCY_SYMBOL || '$',
    
    // Footer de factura
    footer: process.env.INVOICE_FOOTER || '¡Gracias por su preferencia!',
    slogan: process.env.BUSINESS_SLOGAN || 'Tu estilo, nuestra pasión'
  };
};

/**
 * Configuración de formato de impresión
 */
export const printFormat = {
  paperWidth: 58, // mm (58mm o 80mm son estándares)
  encoding: 'UTF-8',
  codePage: 'CP437', // Página de códigos para caracteres especiales
  
  // Márgenes (caracteres)
  marginLeft: 0,
  marginRight: 0,
  
  // Alineación
  align: {
    left: 'left',
    center: 'center',
    right: 'right'
  },
  
  // Tamaños de texto
  textSize: {
    small: 0,
    normal: 1,
    large: 2,
    xlarge: 3
  },
  
  // Estilos
  style: {
    bold: true,
    underline: true,
    italic: false // No todas las impresoras térmicas soportan italic
  }
};

/**
 * Comandos ESC/POS básicos
 */
export const escPosCommands = {
  INIT: '\x1B\x40', // Inicializar impresora
  CUT: '\x1D\x56\x00', // Cortar papel
  FEED: '\x1B\x64\x02', // Avanzar papel 2 líneas
  
  // Alineación
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_RIGHT: '\x1B\x61\x02',
  
  // Tamaño de texto
  SIZE_NORMAL: '\x1D\x21\x00',
  SIZE_DOUBLE: '\x1D\x21\x11',
  
  // Estilos
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  UNDERLINE_ON: '\x1B\x2D\x01',
  UNDERLINE_OFF: '\x1B\x2D\x00'
};

export default {
  getPrinterConfig,
  getBusinessInfo,
  printFormat,
  escPosCommands
};
