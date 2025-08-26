import mongoose from 'mongoose';
import User from '../models/User.js';
import { config } from '../config/index.js';

await mongoose.connect(config.database.uri, config.database.options);

await User.deleteMany({});
await User.create([
  { username: 'admin', email: 'admin@barber.com', password: 'admin123', role: 'admin' }
]);

console.log('Usuarios de ejemplo insertados');
process.exit(0);