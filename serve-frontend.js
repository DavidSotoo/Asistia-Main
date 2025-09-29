// serve-frontend.js
// Servidor simple para servir el frontend

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'Frontend')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🌐 Frontend servido en http://localhost:${PORT}`);
  console.log(`📱 Abre tu navegador y ve a: http://localhost:${PORT}`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando servidor frontend...');
  server.close(() => {
    console.log('Servidor frontend cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido. Cerrando servidor frontend...');
  server.close(() => {
    console.log('Servidor frontend cerrado correctamente');
    process.exit(0);
  });
});

