# Backend de Control de Asistencia

Backend refactorizado para sistema de control de asistencia con escaneo QR.

## 🚀 Características

- ✅ API RESTful con Express.js
- ✅ Autenticación JWT
- ✅ Middleware de seguridad (Helmet, CORS)
- ✅ Logging con Morgan
- ✅ Manejo de errores centralizado
- ✅ Estructura modular (rutas, servicios, middleware)
- ✅ Compatibilidad con endpoints existentes

## 📁 Estructura del Proyecto

```
Backend/
├── routes/
│   ├── attendance.js    # Rutas de asistencia
│   └── auth.js          # Rutas de autenticación
├── services/
│   ├── attendanceService.js  # Lógica de negocio de asistencia
│   └── authService.js        # Lógica de autenticación
├── middleware/
│   ├── auth.js          # Middleware de autenticación
│   └── errorHandler.js  # Manejo de errores
├── database.json        # Base de datos de estudiantes
├── server.js           # Punto de entrada principal
└── package.json        # Dependencias
```

## 🛠️ Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno (opcional):
```bash
cp .env.example .env
```

3. Ejecutar en desarrollo:
```bash
npm run dev
```

4. Ejecutar en producción:
```bash
npm start
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verify` - Verificar token

### Asistencia
- `POST /api/asistencia` - Registrar asistencia (compatible)
- `GET /api/listado` - Obtener listado de estudiantes (compatible)
- `GET /api/stats` - Estadísticas de asistencia
- `PUT /api/student/:id/status` - Actualizar estado de estudiante

### Sistema
- `GET /health` - Health check

## 🔧 Variables de Entorno

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=asistia-secret-key-2024
JWT_EXPIRES_IN=24h
```

## 📝 Ejemplos de Uso

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Registrar Asistencia
```bash
curl -X POST http://localhost:3000/api/asistencia \
  -H "Content-Type: application/json" \
  -d '{"id": "ALU123"}'
```

### Obtener Estadísticas
```bash
curl http://localhost:3000/api/stats
```

## 🚀 Mejoras Implementadas

1. **Estructura Modular**: Separación clara de responsabilidades
2. **Seguridad**: Helmet, CORS, JWT
3. **Logging**: Morgan para logs de requests
4. **Manejo de Errores**: Middleware centralizado
5. **Compatibilidad**: Mantiene endpoints existentes
6. **Escalabilidad**: Fácil agregar nuevas funcionalidades

## 🔄 Migración

El refactor mantiene **100% de compatibilidad** con el código existente:
- Los endpoints `/api/asistencia` y `/api/listado` funcionan igual
- La estructura de respuesta se mantiene
- El frontend existente no requiere cambios
