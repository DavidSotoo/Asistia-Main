#!/usr/bin/env node

/**
 * Script de desarrollo para Asistia
 * Maneja el inicio y parada del backend y frontend
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
  backend: {
    port: 3000,
    path: './Backend',
    script: 'server.js'
  },
  frontend: {
    port: 3001,
    path: './',
    script: 'serve-frontend.js'
  }
};

// Variables globales para los procesos
let backendProcess = null;
let frontendProcess = null;
let isShuttingDown = false;

/**
 * Función para matar procesos que estén usando un puerto específico
 */
function killProcessOnPort(port) {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' 
      ? `netstat -ano | findstr :${port}` 
      : `lsof -ti:${port}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        // No hay procesos usando el puerto
        resolve();
        return;
      }

      const pids = stdout.trim().split('\n').filter(pid => pid);
      
      if (pids.length === 0) {
        resolve();
        return;
      }

      console.log(`🔴 Matando procesos en puerto ${port}: ${pids.join(', ')}`);
      
      const killCommand = process.platform === 'win32'
        ? `taskkill /F /PID ${pids.join(' /PID ')}`
        : `kill -9 ${pids.join(' ')}`;
      
      exec(killCommand, (killError) => {
        if (killError) {
          console.error(`❌ Error matando procesos en puerto ${port}:`, killError.message);
          reject(killError);
        } else {
          console.log(`✅ Procesos en puerto ${port} terminados correctamente`);
          resolve();
        }
      });
    });
  });
}

/**
 * Inicia el servidor backend
 */
function startBackend() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Iniciando backend...');
    
    const backendPath = path.join(__dirname, CONFIG.backend.path);
    backendProcess = spawn('node', [CONFIG.backend.script], {
      cwd: backendPath,
      stdio: 'pipe'
    });

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Backend] ${output.trim()}`);
      
      if (output.includes('Servidor de asistencia escuchando')) {
        console.log('✅ Backend iniciado correctamente');
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(`[Backend Error] ${error.trim()}`);
      
      if (error.includes('EADDRINUSE')) {
        console.log('⚠️  Puerto 3000 ocupado, intentando liberarlo...');
        killProcessOnPort(CONFIG.backend.port)
          .then(() => {
            console.log('🔄 Reiniciando backend...');
            startBackend().then(resolve).catch(reject);
          })
          .catch(reject);
      }
    });

    backendProcess.on('close', (code) => {
      if (!isShuttingDown) {
        console.log(`❌ Backend terminado inesperadamente con código ${code}`);
      }
    });

    backendProcess.on('error', (error) => {
      console.error('❌ Error iniciando backend:', error.message);
      reject(error);
    });
  });
}

/**
 * Inicia el servidor frontend
 */
function startFrontend() {
  return new Promise((resolve, reject) => {
    console.log('🌐 Iniciando frontend...');
    
    const frontendPath = path.join(__dirname, CONFIG.frontend.path);
    frontendProcess = spawn('node', [CONFIG.frontend.script], {
      cwd: frontendPath,
      stdio: 'pipe'
    });

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`[Frontend] ${output.trim()}`);
      
      if (output.includes('Frontend servido en')) {
        console.log('✅ Frontend iniciado correctamente');
        resolve();
      }
    });

    frontendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error(`[Frontend Error] ${error.trim()}`);
      
      if (error.includes('EADDRINUSE')) {
        console.log('⚠️  Puerto 3001 ocupado, intentando liberarlo...');
        killProcessOnPort(CONFIG.frontend.port)
          .then(() => {
            console.log('🔄 Reiniciando frontend...');
            startFrontend().then(resolve).catch(reject);
          })
          .catch(reject);
      }
    });

    frontendProcess.on('close', (code) => {
      if (!isShuttingDown) {
        console.log(`❌ Frontend terminado inesperadamente con código ${code}`);
      }
    });

    frontendProcess.on('error', (error) => {
      console.error('❌ Error iniciando frontend:', error.message);
      reject(error);
    });
  });
}

/**
 * Detiene todos los procesos
 */
function stopAll() {
  return new Promise((resolve) => {
    isShuttingDown = true;
    console.log('\n🛑 Deteniendo servicios...');

    let stoppedCount = 0;
    const totalProcesses = 2;

    function checkAllStopped() {
      stoppedCount++;
      if (stoppedCount >= totalProcesses) {
        console.log('✅ Todos los servicios detenidos correctamente');
        resolve();
      }
    }

    // Detener backend
    if (backendProcess) {
      console.log('🔴 Deteniendo backend...');
      backendProcess.kill('SIGTERM');
      setTimeout(() => {
        if (!backendProcess.killed) {
          backendProcess.kill('SIGKILL');
        }
        checkAllStopped();
      }, 2000);
    } else {
      checkAllStopped();
    }

    // Detener frontend
    if (frontendProcess) {
      console.log('🔴 Deteniendo frontend...');
      frontendProcess.kill('SIGTERM');
      setTimeout(() => {
        if (!frontendProcess.killed) {
          frontendProcess.kill('SIGKILL');
        }
        checkAllStopped();
      }, 2000);
    } else {
      checkAllStopped();
    }
  });
}

/**
 * Función principal
 */
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'start':
      try {
        console.log('🎯 Iniciando Asistia Development Environment...\n');
        
        // Verificar si los puertos están ocupados y liberarlos
        await killProcessOnPort(CONFIG.backend.port);
        await killProcessOnPort(CONFIG.frontend.port);
        
        // Iniciar servicios
        await startBackend();
        await startFrontend();
        
        console.log('\n🎉 ¡Servicios iniciados correctamente!');
        console.log(`📊 Backend: http://localhost:${CONFIG.backend.port}`);
        console.log(`🌐 Frontend: http://localhost:${CONFIG.frontend.port}`);
        console.log('\n💡 Presiona Ctrl+C para detener todos los servicios\n');
        
      } catch (error) {
        console.error('❌ Error iniciando servicios:', error.message);
        await stopAll();
        process.exit(1);
      }
      break;

    case 'stop':
      await stopAll();
      process.exit(0);
      break;

    case 'restart':
      console.log('🔄 Reiniciando servicios...');
      await stopAll();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
      await main(); // Reiniciar
      break;

    case 'kill':
      console.log('💀 Matando procesos en puertos...');
      await killProcessOnPort(CONFIG.backend.port);
      await killProcessOnPort(CONFIG.frontend.port);
      console.log('✅ Procesos terminados');
      break;

    default:
      console.log(`
🚀 Asistia Development Script

Comandos disponibles:
  node dev.js start    - Inicia backend y frontend
  node dev.js stop     - Detiene todos los servicios
  node dev.js restart  - Reinicia todos los servicios
  node dev.js kill     - Mata procesos en puertos 3000 y 3001

Ejemplos:
  node dev.js start    # Iniciar todo
  node dev.js kill     # Si algo se queda colgado
      `);
      break;
  }
}

// Manejo de señales del sistema
process.on('SIGINT', async () => {
  console.log('\n🛑 Señal de interrupción recibida...');
  await stopAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Señal de terminación recibida...');
  await stopAll();
  process.exit(0);
});

// Ejecutar función principal
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { startBackend, startFrontend, stopAll, killProcessOnPort };
