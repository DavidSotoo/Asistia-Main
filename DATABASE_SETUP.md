# 🗄️ Configuración de Base de Datos PostgreSQL

## Resumen

El proyecto Asistia ahora usa **PostgreSQL** con **Prisma ORM** en lugar del archivo JSON. La base de datos se ejecuta en **Docker** para máxima simplicidad.

## 🚀 Inicio Rápido

### 1. Iniciar la Base de Datos
```bash
# Opción 1: Usar el script
./start.sh start

# Opción 2: Comando directo
docker-compose up -d
```

### 2. Iniciar el Backend
```bash
cd Backend
npm start
```

## 📊 Estructura de la Base de Datos

### Tablas Principales

#### `users` - Usuarios del Sistema
- `id` (UUID, Primary Key)
- `username` (String, Unique)
- `password` (String)
- `name` (String)
- `role` (String: 'administrador', 'profesor', 'operador')

#### `students` - Estudiantes
- `id` (String, Primary Key) - Ej: "ALU123"
- `nombre` (String)
- `apellido` (String)
- `grupo` (String, Optional)
- `email` (String, Optional)
- `telefono` (String, Optional)

#### `attendance` - Registros de Asistencia
- `id` (UUID, Primary Key)
- `studentId` (String, Foreign Key)
- `status` (String: 'Presente', 'Ausente', 'Tarde')
- `attendanceDate` (Date)
- `attendanceTime` (Timestamp)
- `notes` (Text, Optional)

## 🔧 Comandos Útiles

### Docker
```bash
# Iniciar base de datos
docker-compose up -d

# Detener base de datos
docker-compose down

# Ver logs
docker-compose logs -f postgres

# Reiniciar base de datos
docker-compose restart postgres
```

### Prisma
```bash
cd Backend

# Generar cliente
npx prisma generate

# Ver datos en la base de datos
npx prisma studio

# Aplicar cambios al esquema
npx prisma db push

# Crear migración
npx prisma migrate dev --name nombre_migracion

# Resetear base de datos
npx prisma migrate reset
```

## 🔗 Conexión a la Base de Datos

### Desde la Aplicación
- **URL**: `postgresql://asistia_user:asistia_password@localhost:5432/asistia_db`
- **Host**: `localhost`
- **Puerto**: `5432`
- **Base de datos**: `asistia_db`
- **Usuario**: `asistia_user`
- **Contraseña**: `asistia_password`

### Desde Herramientas Externas
Puedes conectarte usando cualquier cliente PostgreSQL como:
- **pgAdmin**
- **DBeaver**
- **TablePlus**
- **psql** (línea de comandos)

## 📝 Migración de Datos

Los datos del archivo `database.json` original ya fueron migrados automáticamente. Si necesitas migrar datos nuevamente:

```bash
cd Backend
node scripts/migrateData.js
```

## 🛠️ Desarrollo

### Estructura de Archivos
```
Backend/
├── prisma/
│   └── schema.prisma          # Esquema de la base de datos
├── services/
│   ├── databaseService.js     # Conexión a la base de datos
│   ├── attendanceService.js   # Lógica de asistencia
│   └── authService.js         # Lógica de autenticación
├── scripts/
│   └── migrateData.js         # Script de migración
└── .env                       # Variables de entorno
```

### Variables de Entorno
```env
DATABASE_URL="postgresql://asistia_user:asistia_password@localhost:5432/asistia_db?schema=public"
JWT_SECRET="asistia-secret-key-2024"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV=development
```

## 🐛 Solución de Problemas

### La base de datos no inicia
```bash
# Verificar que Docker esté corriendo
docker ps

# Ver logs de error
docker-compose logs postgres

# Reiniciar completamente
docker-compose down
docker-compose up -d
```

### Error de conexión desde la aplicación
1. Verificar que la base de datos esté corriendo: `docker-compose ps`
2. Verificar las variables de entorno en `.env`
3. Verificar que el puerto 5432 esté disponible

### Datos no se muestran
1. Verificar que la migración se ejecutó: `node scripts/migrateData.js`
2. Verificar datos en Prisma Studio: `npx prisma studio`

## 🎉 Ventajas de PostgreSQL + Prisma

✅ **Persistencia real**: Los datos no se pierden al reiniciar  
✅ **Consultas complejas**: Filtros, ordenamiento, relaciones  
✅ **Escalabilidad**: Maneja miles de registros sin problemas  
✅ **Seguridad**: Transacciones, constraints, validaciones  
✅ **Desarrollo fácil**: Prisma genera tipos TypeScript automáticamente  
✅ **Portabilidad**: Docker hace que funcione en cualquier sistema  

## 📚 Recursos Adicionales

- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de PostgreSQL](https://www.postgresql.org/docs/)
- [Docker Compose](https://docs.docker.com/compose/)
