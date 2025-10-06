#!/usr/bin/env node
/**
 * Migra todos los gastos legacy (type: 'recurring') al nuevo formato
 * con type: 'recurring-template' y campo recurrence normalizado.
 * Uso:
 *   node backend/scripts/migrateRecurringExpenses.js [--dry]
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import Expense from '../src/core/domain/entities/Expense.js';
import RecurrenceValidator from '../src/core/application/services/RecurrenceValidator.js';
import { connectDB } from '../src/shared/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dry = process.argv.includes('--dry');

function ensureEnv() {
  if (process.env.MONGODB_URI) return;
  const cands = ['.env.local','.env.development','.env','backend/.env.local','backend/.env.development','backend/.env'];
  for (const rel of cands) {
    const full = path.resolve(process.cwd(), rel);
    if (fs.existsSync(full)) {
      dotenv.config({ path: full });
      if (process.env.MONGODB_URI) break;
    }
  }
}

async function run() {
  ensureEnv();
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI no definida');
    process.exit(1);
  }
  await connectDB();
  const legacy = await Expense.find({ type: 'recurring', 'recurringConfig._migrated': { $ne: true } });
  if (legacy.length === 0) {
    console.log('No hay gastos legacy para migrar.');
    await mongoose.connection.close();
    return;
  }
  console.log(`Encontrados ${legacy.length} gastos legacy para migrar${dry ? ' (dry-run)' : ''}`);
  let migrated = 0; let errors = 0;
  for (const exp of legacy) {
    try {
      if (!exp.recurringConfig) {
        console.warn('Sin recurringConfig, omitido', exp._id); continue;
      }
      const newRec = RecurrenceValidator.convertFromLegacy(exp.recurringConfig, exp.date);
      if (!dry) {
        exp.recurrence = newRec;
        exp.recurringConfig._migrated = true;
        exp.recurringConfig._migratedAt = new Date();
        exp.type = 'recurring-template';
        await exp.save();
      }
      migrated++;
    } catch (e) {
      errors++;
      console.error('Error migrando', exp._id, e.message);
    }
  }
  console.log(`Migrados: ${migrated}, Errores: ${errors}`);
  if (dry) console.log('Dry-run: no se guardaron cambios.');
  await mongoose.connection.close();
}

run().catch(e => { console.error('Fallo migración', e); process.exit(1); });
