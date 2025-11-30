# 📸 Configuración de Cloudinary para Imágenes de Estudiantes

Este documento explica cómo configurar y usar el servicio de Cloudinary para el almacenamiento de fotografías de estudiantes.

## 🚀 Configuración Inicial

### 1. Crear cuenta en Cloudinary

1. Ve a [https://cloudinary.com](https://cloudinary.com)
2. Crea una cuenta gratuita (incluye 25GB de almacenamiento)
3. Una vez registrado, accede al Dashboard

### 2. Obtener credenciales

En el Dashboard de Cloudinary, encontrarás tus credenciales:

- **Cloud Name**: Nombre de tu cuenta en Cloudinary
- **API Key**: Clave de API
- **API Secret**: Secreto de API

### 3. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `Backend/` (puedes copiar `.env.example`):

```bash
cp .env.example .env
```

Edita el archivo `.env` y agrega tus credenciales de Cloudinary:

```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

## 📚 API Endpoints

### Subir foto de estudiante (CREATE)
```http
POST /api/upload/photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
  - photo: (file) Archivo de imagen
  - studentId: (string) ID del estudiante
```

**Respuesta exitosa:**
```json
{
  "ok": true,
  "photoUrl": "https://res.cloudinary.com/...",
  "publicId": "asistia/students/student_ALU123_1234567890",
  "mensaje": "Foto subida exitosamente",
  "imageInfo": {
    "width": 800,
    "height": 600,
    "format": "png",
    "bytes": 125432
  }
}
```

### Obtener foto de estudiante (READ)
```http
GET /api/upload/photo/:studentId
Authorization: Bearer {token}
```

**Respuesta exitosa:**
```json
{
  "ok": true,
  "photoUrl": "https://res.cloudinary.com/...",
  "publicId": "asistia/students/student_ALU123_1234567890",
  "imageInfo": {
    "width": 800,
    "height": 600,
    "format": "png",
    "bytes": 125432,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Actualizar foto de estudiante (UPDATE)
```http
PUT /api/upload/photo/:studentId
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
  - photo: (file) Nuevo archivo de imagen
```

**Respuesta exitosa:**
```json
{
  "ok": true,
  "photoUrl": "https://res.cloudinary.com/...",
  "publicId": "asistia/students/student_ALU123_1234567891",
  "mensaje": "Foto actualizada exitosamente",
  "imageInfo": {
    "width": 800,
    "height": 600,
    "format": "png",
    "bytes": 125432
  }
}
```

### Eliminar foto de estudiante (DELETE)
```http
DELETE /api/upload/photo/:studentId
Authorization: Bearer {token}
```

**Respuesta exitosa:**
```json
{
  "ok": true,
  "mensaje": "Foto eliminada exitosamente"
}
```

## 🔧 Funcionalidades del Servicio

El servicio `cloudinaryService.js` proporciona los siguientes métodos:

### Métodos principales

1. **uploadImage(file, options)**: Sube una imagen a Cloudinary
2. **getImageUrl(publicId, options)**: Obtiene la URL de una imagen (con transformaciones opcionales)
3. **getImageInfo(publicId)**: Obtiene información detallada de una imagen
4. **updateImage(oldPublicId, newFile, options)**: Actualiza una imagen (elimina la anterior y sube la nueva)
5. **deleteImage(publicId)**: Elimina una imagen de Cloudinary
6. **deleteMultipleImages(publicIds)**: Elimina múltiples imágenes
7. **searchImages(folder, options)**: Busca imágenes en una carpeta

### Características

- ✅ Almacenamiento automático en la carpeta `asistia/students`
- ✅ Transformación automática de imágenes (máximo 800x800px, calidad auto)
- ✅ Soporte para formatos: JPG, JPEG, PNG, WEBP
- ✅ Límite de tamaño: 5MB por imagen
- ✅ Nombres únicos basados en ID de estudiante y timestamp
- ✅ Eliminación automática de fotos anteriores al actualizar

## 📝 Ejemplos de Uso

### Subir foto con cURL

```bash
curl -X POST http://localhost:3000/api/upload/photo \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "photo=@/ruta/a/la/imagen.jpg" \
  -F "studentId=ALU123"
```

### Actualizar foto con cURL

```bash
curl -X PUT http://localhost:3000/api/upload/photo/ALU123 \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "photo=@/ruta/a/la/nueva/imagen.jpg"
```

### Eliminar foto con cURL

```bash
curl -X DELETE http://localhost:3000/api/upload/photo/ALU123 \
  -H "Authorization: Bearer TU_TOKEN"
```

## 🔒 Seguridad

- Todos los endpoints requieren autenticación JWT
- Las imágenes se almacenan en formato seguro (HTTPS)
- Validación de tipo de archivo (solo imágenes)
- Límite de tamaño de archivo (5MB)

## 📦 Estructura en Cloudinary

Las imágenes se organizan de la siguiente manera:

```
Cloudinary/
└── asistia/
    └── students/
        ├── student_ALU123_1234567890
        ├── student_ALU456_1234567891
        └── student_ALU789_1234567892
```

## 🐛 Solución de Problemas

### Error: "Cloudinary is not configured"

Asegúrate de que las variables de entorno estén configuradas correctamente:

```bash
echo $CLOUDINARY_CLOUD_NAME
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET
```

### Error: "Imagen no encontrada"

- Verifica que el `studentId` sea correcto
- Verifica que el estudiante tenga una foto registrada en la base de datos

### Error: "Solo se permiten archivos de imagen"

Asegúrate de que el archivo sea una imagen válida (JPG, PNG, WEBP)

## 📖 Recursos Adicionales

- [Documentación oficial de Cloudinary](https://cloudinary.com/documentation)
- [SDK de Node.js para Cloudinary](https://cloudinary.com/documentation/node_integration)
- [Multer Storage Cloudinary](https://github.com/affanshahid/multer-storage-cloudinary)


