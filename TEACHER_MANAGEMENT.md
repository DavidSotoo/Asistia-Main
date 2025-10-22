# Gestión de Maestros - Sistema de Asistencia

## Descripción

Se ha implementado un sistema completo de gestión de maestros que permite:

1. **Para Administradores:**
   - Crear nuevos maestros
   - Ver lista de maestros registrados
   - Eliminar maestros
   - Acceso completo a todas las funcionalidades del sistema

2. **Para Maestros:**
   - Menú específico con opciones limitadas
   - Escanear códigos QR
   - Generar códigos QR para estudiantes
   - Ver lista de asistencias
   - No pueden crear otros maestros ni acceder a funciones administrativas

## Cambios Implementados

### Backend

1. **Nuevas Rutas (`/api/teachers/`):**
   - `POST /create` - Crear nuevo maestro (solo admin)
   - `GET /list` - Listar maestros (solo admin)
   - `GET /:id` - Obtener información de un maestro
   - `PUT /:id` - Actualizar maestro
   - `DELETE /:id` - Eliminar maestro (solo admin)

2. **Base de Datos:**
   - Agregado campo `email` a la tabla `users`
   - Soporte para roles: `admin`, `maestro`, `operador`

3. **Middleware:**
   - Verificación de roles para acceso a funciones administrativas
   - Autenticación mejorada con JWT

### Frontend

1. **Nuevas Secciones:**
   - Formulario para crear maestros (solo visible para admin)
   - Lista de maestros con opciones de eliminación
   - Menú específico para maestros

2. **Lógica de Navegación:**
   - Detección automática del rol del usuario
   - Menús diferenciados según el rol
   - Control de acceso a funciones administrativas

3. **Estilos:**
   - Diseño responsivo para formularios
   - Estilos consistentes con el tema existente

## Instalación y Configuración

### 1. Migrar la Base de Datos

Ejecutar el script de migración para agregar el campo email:

```bash
cd Backend
node scripts/addEmailToUsers.js
```

### 2. Usuario Administrador por Defecto

El script de migración crea automáticamente un usuario administrador:

- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Email:** `admin@asistia.com`
- **Rol:** `admin`

### 3. Reiniciar el Servidor

```bash
cd Backend
npm start
```

## Uso del Sistema

### Para Administradores

1. **Iniciar Sesión:**
   - Usar las credenciales de administrador
   - El sistema detectará automáticamente el rol

2. **Crear Maestros:**
   - Hacer clic en "Crear Maestro" en el menú principal
   - Completar el formulario con los datos del maestro
   - El sistema asignará automáticamente el rol "maestro"

3. **Gestionar Maestros:**
   - Ver lista de maestros registrados
   - Eliminar maestros si es necesario

### Para Maestros

1. **Iniciar Sesión:**
   - Usar las credenciales proporcionadas por el administrador
   - El sistema mostrará el menú específico para maestros

2. **Funciones Disponibles:**
   - Escanear códigos QR de estudiantes
   - Generar códigos QR para nuevos estudiantes
   - Ver lista de asistencias
   - Cerrar sesión

## Estructura de Roles

### Admin
- Acceso completo al sistema
- Puede crear, editar y eliminar maestros
- Puede generar códigos QR
- Puede escanear códigos QR
- Puede ver todas las asistencias

### Maestro
- Puede escanear códigos QR
- Puede generar códigos QR para estudiantes
- Puede ver lista de asistencias
- No puede crear otros usuarios

### Operador (rol por defecto)
- Funcionalidades básicas del sistema original

## API Endpoints

### Crear Maestro
```http
POST /api/teachers/create
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "username": "maestro1",
  "password": "password123",
  "name": "Juan Pérez",
  "email": "juan@ejemplo.com"
}
```

### Listar Maestros
```http
GET /api/teachers/list
Authorization: Bearer <admin_token>
```

### Eliminar Maestro
```http
DELETE /api/teachers/:id
Authorization: Bearer <admin_token>
```

## Seguridad

- Todas las operaciones de gestión de maestros requieren autenticación
- Solo los administradores pueden crear, modificar o eliminar maestros
- Los tokens JWT incluyen información del rol del usuario
- Validación de permisos en cada endpoint

## Notas Técnicas

- El sistema mantiene compatibilidad con la funcionalidad existente
- Los cambios son retrocompatibles
- Se mantiene la estructura de base de datos existente
- El frontend se adapta automáticamente según el rol del usuario

## Solución de Problemas

### Error: "Campo email ya existe"
- El script de migración detecta automáticamente si el campo ya existe
- Es seguro ejecutar el script múltiples veces

### Error de permisos al crear maestros
- Verificar que el usuario tenga rol de "admin"
- Verificar que el token JWT sea válido

### Menú no se muestra correctamente
- Verificar que el usuario esté autenticado
- Verificar que el rol esté correctamente asignado en la base de datos
