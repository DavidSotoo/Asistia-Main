// services/databaseService.js
// Servicio de base de datos usando Prisma

const { PrismaClient } = require('@prisma/client');

class DatabaseService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Conectar a la base de datos
   */
  async connect() {
    try {
      await this.prisma.$connect();
      console.log('✅ Conectado a PostgreSQL con Prisma');
    } catch (error) {
      console.error('❌ Error conectando a la base de datos:', error);
      throw error;
    }
  }

  /**
   * Desconectar de la base de datos
   */
  async disconnect() {
    try {
      await this.prisma.$disconnect();
      console.log('🔌 Desconectado de PostgreSQL');
    } catch (error) {
      console.error('❌ Error desconectando de la base de datos:', error);
    }
  }

  /**
   * Obtener cliente de Prisma
   */
  getClient() {
    return this.prisma;
  }

  /**
   * Verificar salud de la base de datos
   */
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}

// Crear instancia singleton
const databaseService = new DatabaseService();

module.exports = databaseService;
