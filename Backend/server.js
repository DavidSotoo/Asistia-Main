// server.js
// Backend refactorizado para control de asistencia con Node.js + Express

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Importar rutas
const attendanceRoutes = require('./routes/attendance');
const authRoutes = require('./routes/auth');

// QRCode para generar QR
const QRCode = require('qrcode');

// Importar middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'file://',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ],
  credentials: true
}));

// Middleware de logging
app.use(morgan('combined'));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Endpoint para generar QR
app.post('/generarQR', async (req, res) => {
  try {
    const { nombre, matricula, grupo } = req.body;
    if (!nombre || !matricula || !grupo) {
      return res.status(400).json({ error: 'Faltan datos' });
    }
    // El texto del QR puede ser un JSON o solo la matrícula, aquí usamos JSON
    const qrData = JSON.stringify({ nombre, matricula, grupo });
    const qr = await QRCode.toDataURL(qrData);
    res.json({ qr });
  } catch (error) {
    console.error('Error generando QR:', error);
    res.status(500).json({ error: 'Error generando QR' });
  }
});

// Rutas de la API
app.use('/api', attendanceRoutes);
app.use('/api/auth', authRoutes);

// Middleware de manejo de errores
app.use(notFound);
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de asistencia escuchando en http://localhost:${PORT}`);
  console.log(`📊 Health check disponible en http://localhost:${PORT}/health`);
  console.log(`🔐 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido. Cerrando servidor...');
  process.exit(0);
});
