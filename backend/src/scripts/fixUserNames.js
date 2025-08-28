import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const fixUserNames = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    const users = await User.find({ role: 'barber' });
    console.log(`\nEncontrados ${users.length} usuarios barberos`);

    for (const user of users) {
      console.log(`\nRevisando usuario ${user._id}:`);
      console.log(`- Username: ${user.username}`);
      console.log(`- Name: ${user.name}`);
      console.log(`- Email: ${user.email}`);

      // Si no tiene name, usar username
      if (!user.name && user.username) {
        user.name = user.username;
        await user.save();
        console.log(`✅ Actualizado nombre a: ${user.name}`);
      }
      // Si no tiene username, usar name
      else if (!user.username && user.name) {
        user.username = user.name;
        await user.save();
        console.log(`✅ Actualizado username a: ${user.username}`);
      }
      // Si no tiene ninguno, usar email
      else if (!user.name && !user.username) {
        const nameFromEmail = user.email.split('@')[0];
        user.name = nameFromEmail;
        user.username = nameFromEmail;
        await user.save();
        console.log(`✅ Actualizado nombre y username a: ${nameFromEmail}`);
      }
    }

    console.log('\nProceso completado');
    mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

fixUserNames();
