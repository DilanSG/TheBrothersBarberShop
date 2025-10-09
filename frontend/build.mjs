import { existsSync } from 'fs';
import { spawn } from 'child_process';

async function buildApp() {
  console.log('Starting build process...');
  
  // Verificar si vite está disponible
  const vitePath = './node_modules/.bin/vite';
  const viteJs = './node_modules/vite/bin/vite.js';
  
  let command, args;
  
  if (existsSync(viteJs)) {
    console.log('Using Vite JavaScript file directly...');
    command = 'node';
    args = [viteJs, 'build'];
  } else {
    console.log('Falling back to npx...');
    command = 'npx';
    args = ['vite', 'build'];
  }
  
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: true
  });
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log('Build completed successfully!');
      process.exit(0);
    } else {
      console.error('Build failed with code:', code);
      process.exit(1);
    }
  });
  
  child.on('error', (error) => {
    console.error('Build process error:', error);
    process.exit(1);
  });
}

buildApp();