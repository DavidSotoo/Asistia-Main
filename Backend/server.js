// server.js
// Backend refactorizado para control de asistencia con Node.js + Express + PostgreSQL

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Importar servicios de base de datos
const databaseService = require('./services/databaseService');

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
    'http://127.0.0.1:5500',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://127.0.0.1:8081'
  ],
  credentials: true
}));

// Middleware de logging
app.use(morgan('combined'));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await databaseService.healthCheck();
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      database: dbHealth
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      error: error.message
    });
  }
});

// Endpoint para generar QR
app.post('/generarQR', async (req, res) => {
  try {
    const { nombre, apellido, matricula, grupo } = req.body;
    if (!nombre || !apellido || !matricula || !grupo) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    // Guardar estudiante en la base de datos
    const databaseService = require('./services/databaseService');
    const prisma = databaseService.getClient();

    // Verificar si el estudiante ya existe
    const existingStudent = await prisma.student.findUnique({
      where: { id: matricula }
    });

    if (!existingStudent) {
      // Crear nuevo estudiante
      await prisma.student.create({
        data: {
          id: matricula,
          nombre,
          apellido,
          grupo
        }
      });
    } else {
      // Actualizar datos del estudiante si es necesario
      await prisma.student.update({
        where: { id: matricula },
        data: {
          nombre,
          apellido,
          grupo
        }
      });
    }

    // El texto del QR puede ser un JSON o solo la matrícula, aquí usamos JSON
    const qrData = JSON.stringify({ nombre: `${nombre} ${apellido}`, matricula, grupo });
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

// Función para inicializar el servidor
async function startServer() {
  try {
    // Conectar a la base de datos
    await databaseService.connect();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor de asistencia escuchando en http://localhost:${PORT}`);
      console.log(`📊 Health check disponible en http://localhost:${PORT}/health`);
      console.log(`🔐 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Base de datos: PostgreSQL con Prisma`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido. Cerrando servidor...');
  await databaseService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT recibido. Cerrando servidor...');
  await databaseService.disconnect();
  process.exit(0);
});

// Iniciar servidor
startServer();