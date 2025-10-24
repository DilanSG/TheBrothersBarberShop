#!/usr/bin/env node
/**
 * Script de diagnóstico para gastos recurrentes
 * Objetivo: listar y validar el estado de plantillas e instancias recurrentes
 * y detectar razones por las que no aparecen en el frontend.
 *
 * Uso:
 *   node backend/scripts/diagnoseRecurringExpenses.js [--json] [--limit=N]
 *
 * Salida:
 *   - Resumen de conteos por tipo y estado
 *   - Errores de migración o configuración
 *   - Muestras de documentos problemáticos
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import Expense from '../src/core/domain/entities/Expense.js';
import { connectDB } from '../src/shared/config/database.js';
import RecurrenceValidator from '../src/core/application/services/RecurrenceValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const argFlags = process.argv.slice(2);
const asJson = argFlags.includes('--json');
const limitFlag = argFlags.find(f => f.startsWith('--limit='));
const uriFlag = argFlags.find(f => f.startsWith('--uri='));
const sampleLimit = limitFlag ? parseInt(limitFlag.split('=')[1], 10) : 5;

// Intentar varias rutas si no hay MONGODB_URI todavía (sin await)
function ensureMongoUri() {
  if (process.env.MONGODB_URI) return; // ya definido
  const candidates = [
    '.env.local', '.env.development', '.env',
    'backend/.env.local', 'backend/.env.development', 'backend/.env'
  ].map(p => path.resolve(process.cwd(), p));
  for (const f of candidates) {
    try {
      if (fs.existsSync(f)) {
        dotenv.config({ path: f });
        if (process.env.MONGODB_URI) break;
      }
    } catch {}
  }
  if (uriFlag && !process.env.MONGODB_URI) {
    process.env.MONGODB_URI = uriFlag.split('=')[1];
  }
}

function safe(obj, pathStr, def = undefined) {
  try {
    return pathStr.split('.').reduce((o, k) => (o && k in o ? o[k] : undefined), obj) ?? def;
  } catch { return def; }
}

async function run() {
  const start = Date.now();
  const result = {
    meta: {
      startedAt: new Date().toISOString(),
      mongodbUriHash: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/[^@]*@/, '***@') : 'NO_URI',
      sampleLimit,
    },
    counts: {},
    issues: [],
    samples: {}
  };

  ensureMongoUri();
  if (!process.env.MONGODB_URI) {
    const msg = 'MONGODB_URI no definida. Proporcione --uri=mongodb://user:pass@host/db o defina en .env';
    if (asJson) {
      console.error(JSON.stringify({ error: msg }));
    } else {
      console.error('\u26A0\uFE0F  ' + msg);
      console.error('Buscadas rutas de .env en: raiz (.env, .env.local, .env.development) y backend/');
    }
    process.exit(1);
  }
  await connectDB();

  // 1. Conteos básicos por type
  const pipeline = [
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ];
  const typeCountsRaw = await Expense.aggregate(pipeline);
  result.counts.byType = Object.fromEntries(typeCountsRaw.map(r => [r._id || 'unknown', r.count]));

  // 2. Plantillas actuales
  const templates = await Expense.find({ type: 'recurring-template' }).lean();
  const legacy = await Expense.find({ type: 'recurring', 'recurringConfig._migrated': { $ne: true } }).lean();
  const migratedLegacy = await Expense.find({ type: 'recurring', 'recurringConfig._migrated': true }).lean();
  const instances = await Expense.find({ type: 'recurring-instance' }).lean();

  result.counts.templates = templates.length;
  result.counts.legacyPending = legacy.length;
  result.counts.legacyMigratedButTypeNotUpdated = migratedLegacy.length; // sanity check
  result.counts.instances = instances.length;

  // 3. Estado de activación / datos clave
  const classifyTemplate = (t) => {
    const isActive = safe(t, 'recurrence.isActive', safe(t, 'recurringConfig.isActive', true));
    const pattern = safe(t, 'recurrence.pattern', safe(t, 'recurringConfig.frequency'));
    const interval = safe(t, 'recurrence.interval', safe(t, 'recurringConfig.interval', 1));
    const startDate = safe(t, 'recurrence.startDate', safe(t, 'recurringConfig.startDate'));
    const endDate = safe(t, 'recurrence.endDate', safe(t, 'recurringConfig.endDate'));
    const lastProcessed = safe(t, 'recurrence.lastProcessed', safe(t, 'recurringConfig.lastProcessed'));
    return { _id: t._id, description: t.description, amount: t.amount, isActive, pattern, interval, startDate, endDate, lastProcessed };
  };

  result.samples.templateSummary = templates.slice(0, sampleLimit).map(classifyTemplate);
  result.samples.legacySummary = legacy.slice(0, sampleLimit).map(classifyTemplate);

  // 4. Validaciones de configuración
  const configIssues = [];
  for (const t of templates) {
    try {
      if (!t.recurrence) {
        configIssues.push({ id: t._id, description: t.description, issue: 'Template sin recurrence (posible migración incompleta)' });
        continue;
      }
      if (!t.recurrence.pattern) {
        configIssues.push({ id: t._id, description: t.description, issue: 'recurrence.pattern vacío' });
      }
      if (t.recurrence.startDate && t.recurrence.endDate && new Date(t.recurrence.endDate) < new Date(t.recurrence.startDate)) {
        configIssues.push({ id: t._id, description: t.description, issue: 'endDate < startDate' });
      }
      // Validar normalización base usando convertFromLegacy invertido como referencia (aprox)
      // (Aquí podríamos agregar validaciones específicas por patrón si hace falta)
    } catch (e) {
      configIssues.push({ id: t._id, description: t.description, issue: 'Error validando: ' + e.message });
    }
  }
  if (legacy.length > 0) {
    for (const l of legacy.slice(0, sampleLimit)) {
      configIssues.push({ id: l._id, description: l.description, issue: 'Legacy sin migrar - no aparecerá en el frontend' });
    }
  }
  result.issues = configIssues;

  // 5. Recomendaciones
  const recommendations = [];
  if (legacy.length > 0) {
    recommendations.push(`Migrar ${legacy.length} gastos legacy (type: 'recurring') a 'recurring-template'.`);
  }
  if (templates.length === 0 && legacy.length === 0) {
    recommendations.push('No hay plantillas recurrentes. Crear nuevas para reemplazar el monto inferido.');
  }
  if (configIssues.length === 0 && templates.length > 0) {
    recommendations.push('Las plantillas recurrentes parecen válidas; revisar frontend si siguen sin mostrarse.');
  }
  result.recommendations = recommendations;

  result.meta.durationMs = Date.now() - start;

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('=== Diagnóstico de Gastos Recurrentes ===');
    console.log('Conteos por type:', result.counts.byType);
    console.log('Resumen:', {
      templates: result.counts.templates,
      legacyPending: result.counts.legacyPending,
      instances: result.counts.instances
    });
    if (result.counts.legacyPending > 0) {
      console.log(`⚠️  Hay ${result.counts.legacyPending} gastos legacy sin migrar (no llegan al front).`);
    }
    if (result.issues.length) {
      console.log('\nProblemas detectados:');
      for (const iss of result.issues) {
        console.log(` - ${iss.id} :: ${iss.description} -> ${iss.issue}`);
      }
    }
    if (result.samples.templateSummary.length) {
      console.log('\nMuestras de plantillas (primeros):');
      for (const s of result.samples.templateSummary) {
        console.log(` * ${s._id} | ${s.description} | ${s.pattern}/${s.interval} | activo=${s.isActive} | $${s.amount}`);
      }
    }
    if (result.samples.legacySummary.length) {
      console.log('\nMuestras legacy sin migrar:');
      for (const s of result.samples.legacySummary) {
        console.log(` * ${s._id} | ${s.description} | freq=${s.pattern} | activo=${s.isActive} | $${s.amount}`);
      }
    }
    if (result.recommendations.length) {
      console.log('\nRecomendaciones:');
      result.recommendations.forEach(r => console.log(' - ' + r));
    }
    console.log(`\nTiempo: ${result.meta.durationMs} ms`);
  }

  await mongoose.connection.close();
}

run().catch(err => {
  console.error('Error ejecutando diagnóstico:', err);
  process.exit(1);
});
