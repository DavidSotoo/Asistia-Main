// scripts/seed.js
// Crea usuarios iniciales en la base de datos

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando base de datos...');

  // Crear usuario admin
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123',
      name: 'Administrador',
      role: 'administrador',
      email: 'admin@asistia.com'
    }
  });

  console.log(`✅ Usuario creado: ${admin.username} (${admin.role})`);

  // Crear usuario profesor de prueba
  const profesor = await prisma.user.upsert({
    where: { username: 'profesor' },
    update: {},
    create: {
      username: 'profesor',
      password: 'profesor123',
      name: 'Profesor Demo',
      role: 'profesor',
      email: 'profesor@asistia.com'
    }
  });

  console.log(`✅ Usuario creado: ${profesor.username} (${profesor.role})`);

  console.log('\n📋 Credenciales de acceso:');
  console.log('   Admin     → usuario: admin     | contraseña: admin123');
  console.log('   Profesor  → usuario: profesor  | contraseña: profesor123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
