# TODO: Modificaciones de Menús por Rol

## Información Recopilada
- **Administrador (admin)**: Solo podrá generar maestros y ver la lista de alumnos. Quitar escanear QR, generar QR y ver asistencias.
- **Maestros (maestro)**: Podrán ver todas las opciones menos generar maestros. Agregar "Alumnos" al menú de maestros.

## Plan de Cambios
1. **Frontend/index.html**:
   - Agregar botón "Alumnos" en la sección `menuMaestro` para maestros.

2. **Frontend/script.js**:
   - En `showMainApp()`, ocultar botones no permitidos para admin: `btnIrEscanear`, `btnIrGenerar`, `btnIrLista`.
   - Agregar event listener para el nuevo botón "Alumnos" en `menuMaestro`.
   - Asegurar navegación correcta para maestros a la sección de alumnos.

## Archivos Dependientes
- Frontend/index.html
- Frontend/script.js

## Pasos de Seguimiento
- [x] Modificar HTML para agregar botón en menuMaestro. (Ya existía btnMaestroAlumnos)
- [x] Actualizar script.js para ocultar botones en menuPrincipal para admin.
- [x] Agregar lógica de navegación para el botón Alumnos en maestros. (Ya existía event listener)
- [] Probar cambios: Verificar que admin solo vea Crear Maestro y Alumnos; maestros vean Escanear QR, Generar QR, Ver Asistencias y Alumnos.
