# 🚀 Asistia Development Guide

## Scripts de Desarrollo

Este proyecto incluye scripts mejorados para manejar el desarrollo de manera más eficiente y controlada.

### 📋 Comandos Disponibles

#### Opción 1: Script de Node.js (Recomendado)
```bash
# Iniciar todo (backend + frontend)
node dev.js start

# Detener todos los servicios
node dev.js stop

# Reiniciar todos los servicios
node dev.js restart

# Matar procesos que estén ocupando los puertos
node dev.js kill

# Ver ayuda
node dev.js
```

#### Opción 2: Script de Bash (Más corto)
```bash
# Iniciar todo
./start.sh start

# Detener todo
./start.sh stop

# Reiniciar todo
./start.sh restart

# Matar procesos
./start.sh kill
```

### 🎯 Características Principales

- ✅ **Manejo automático de puertos ocupados**: Si los puertos 3000 o 3001 están ocupados, el script los libera automáticamente
- ✅ **Cierre graceful**: Los servicios se cierran correctamente cuando presionas Ctrl+C
- ✅ **Logs separados**: Cada servicio muestra sus logs con prefijos identificables
- ✅ **Reinicio inteligente**: Si un servicio falla, se reinicia automáticamente
- ✅ **Manejo de errores**: Muestra errores claros y sugerencias de solución

### 🔧 Puertos Utilizados

- **Backend**: `http://localhost:3000`
- **Frontend**: `http://localhost:3001`

### 🚨 Solución de Problemas

#### Error "EADDRINUSE" (Puerto en uso)
Si ves este error, simplemente ejecuta:
```bash
node dev.js kill
# o
./start.sh kill
```

Esto matará todos los procesos que estén usando los puertos 3000 y 3001.

#### Servicios que no se detienen
Si los servicios no se detienen con Ctrl+C, ejecuta:
```bash
node dev.js stop
# o
./start.sh stop
```

#### Reinicio completo
Para reiniciar todo desde cero:
```bash
node dev.js restart
# o
./start.sh restart
```

### 📝 Flujo de Trabajo Recomendado

1. **Iniciar desarrollo**:
   ```bash
   node dev.js start
   ```

2. **Desarrollar normalmente** - Los servicios se mantienen corriendo

3. **Si algo se rompe**:
   ```bash
   node dev.js restart
   ```

4. **Al terminar el día**:
   - Presiona `Ctrl+C` para cerrar todo gracefully
   - O ejecuta `node dev.js stop`

### 🔍 Monitoreo

Los logs se muestran en tiempo real con prefijos:
- `[Backend]` - Logs del servidor backend
- `[Frontend]` - Logs del servidor frontend

### ⚡ Mejoras Implementadas

1. **Manejo de señales**: Ambos servidores ahora manejan SIGTERM y SIGINT correctamente
2. **Detección de puertos ocupados**: El script detecta y libera puertos automáticamente
3. **Reinicio automático**: Si un puerto está ocupado, se libera y reinicia el servicio
4. **Logs mejorados**: Información clara sobre el estado de cada servicio
5. **Cierre graceful**: Los servicios se cierran limpiamente sin dejar procesos zombie

---

💡 **Tip**: Usa `node dev.js start` para iniciar todo y `Ctrl+C` para detener todo de manera segura.
