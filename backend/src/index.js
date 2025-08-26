// Carga variables de entorno antes de cualquier otra cosa
import 'dotenv/config';

import app from './app.js';
import connectDB from './config/database.js';
import { validateEnv } from './config/index.js';

// Valida variables de entorno requeridas
validateEnv();

// Conecta a la base de datos
await connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});