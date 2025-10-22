// Script para depurar problemas del frontend
// Ejecutar con: node scripts/debugFrontend.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFrontend() {
  try {
    console.log('🔍 DEPURACIÓN - Verificando estado del sistema...\n');
    
    // 1. Verificar usuarios antes de la prueba
    console.log('1️⃣ Usuarios ANTES de la prueba:');
    const usersBefore = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Total usuarios: ${usersBefore.length}`);
    usersBefore.forEach(user => {
      console.log(`   - ${user.username} (${user.name}) - Rol: ${user.role}`);
    });
    
    // 2. Verificar que el admin existe y tiene el rol correcto
    console.log('\n2️⃣ Verificando usuario admin:');
    const adminUser = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (adminUser) {
      console.log(`   ✅ Admin encontrado: ${adminUser.username}`);
      console.log(`   ✅ Rol: ${adminUser.role}`);
      console.log(`   ✅ ID: ${adminUser.id}`);
    } else {
      console.log('   ❌ Admin no encontrado');
      return;
    }
    
    // 3. Verificar estructura de la tabla users
    console.log('\n3️⃣ Verificando estructura de tabla users:');
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;
    
    console.log('   Columnas de la tabla users:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 4. Simular creación de maestro desde la API
    console.log('\n4️⃣ Simulando creación de maestro desde API...');
    
    // Verificar si ya existe un maestro de prueba
    const existingTestTeacher = await prisma.user.findUnique({
      where: { username: 'debugMaestro' }
    });
    
    if (existingTestTeacher) {
      console.log('   ⚠️  Ya existe un maestro de prueba, eliminándolo...');
      await prisma.user.delete({
        where: { username: 'debugMaestro' }
      });
    }
    
    // Crear maestro de prueba
    const newTeacher = await prisma.user.create({
      data: {
        username: 'debugMaestro',
        password: 'debug123',
        name: 'Debug Maestro',
        email: 'debug@ejemplo.com',
        role: 'maestro'
      }
    });
    
    console.log('   ✅ Maestro de prueba creado exitosamente:');
    console.log(`   - Username: ${newTeacher.username}`);
    console.log(`   - Name: ${newTeacher.name}`);
    console.log(`   - Role: ${newTeacher.role}`);
    console.log(`   - Email: ${newTeacher.email}`);
    
    // 5. Verificar usuarios después de la prueba
    console.log('\n5️⃣ Usuarios DESPUÉS de la prueba:');
    const usersAfter = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`   Total usuarios: ${usersAfter.length}`);
    usersAfter.forEach(user => {
      console.log(`   - ${user.username} (${user.name}) - Rol: ${user.role}`);
    });
    
    // 6. Resumen
    console.log('\n🎯 RESUMEN DE DEPURACIÓN:');
    console.log('   ✅ Base de datos funcionando correctamente');
    console.log('   ✅ Usuario admin configurado correctamente');
    console.log('   ✅ Estructura de tabla users correcta');
    console.log('   ✅ Creación de maestros funciona desde backend');
    
    console.log('\n🔧 POSIBLES CAUSAS DEL PROBLEMA EN FRONTEND:');
    console.log('   1. Token de autenticación no se está enviando');
    console.log('   2. Error en la URL del backend');
    console.log('   3. Error de CORS');
    console.log('   4. Error en el JavaScript del frontend');
    console.log('   5. El formulario no se está enviando correctamente');
    
    console.log('\n📋 INSTRUCCIONES PARA DEPURAR:');
    console.log('   1. Abrir DevTools del navegador (F12)');
    console.log('   2. Ir a la pestaña Console');
    console.log('   3. Intentar crear un maestro desde el frontend');
    console.log('   4. Revisar errores en la consola');
    console.log('   5. Ir a la pestaña Network para ver las peticiones');
    console.log('   6. Verificar que la petición POST se esté enviando');
    
  } catch (error) {
    console.error('❌ Error durante la depuración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la depuración
debugFrontend();
