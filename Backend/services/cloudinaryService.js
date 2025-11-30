// services/cloudinaryService.js
// Servicio CRUD genérico para almacenamiento de imágenes en Cloudinary

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {
  constructor() {
    this.cloudinary = cloudinary;
  }

  /**
   * CREATE: Subir imagen a Cloudinary
   * @param {Buffer|string} file - Buffer del archivo o ruta del archivo
   * @param {Object} options - Opciones de subida
   * @param {string} options.folder - Carpeta donde almacenar (default: 'asistia/images')
   * @param {string} options.publicId - Public ID personalizado (opcional)
   * @param {string} options.prefix - Prefijo para el public_id (opcional)
   * @param {Array} options.transformation - Transformaciones a aplicar (opcional)
   * @param {boolean} options.overwrite - Si sobrescribir imagen existente (default: false)
   * @returns {Promise<Object>} - Resultado de la subida con publicId, url y metadata
   */
  async create(file, options = {}) {
    try {
      if (!file) {
        throw new Error('Archivo de imagen es requerido');
      }

      const {
        folder = 'asistia/images',
        publicId,
        prefix,
        transformation = [],
        overwrite = false
      } = options;

      // Generar publicId si no se proporciona
      let finalPublicId = publicId;
      if (!finalPublicId) {
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 9);
        if (prefix) {
          finalPublicId = `${prefix}_${timestamp}_${randomSuffix}`;
        } else {
          finalPublicId = `image_${timestamp}_${randomSuffix}`;
        }
      }

      const uploadOptions = {
        folder: folder,
        public_id: finalPublicId,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        overwrite: overwrite,
        resource_type: 'image'
      };

      // Aplicar transformaciones por defecto si no se especifican
      if (transformation.length > 0) {
        uploadOptions.transformation = transformation;
      } else {
        uploadOptions.transformation = [
          {
            width: 800,
            height: 800,
            crop: 'limit',
            quality: 'auto',
            format: 'auto'
          }
        ];
      }

      const result = await cloudinary.uploader.upload(file, uploadOptions);

      return {
        ok: true,
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at,
        folder: result.folder
      };
    } catch (error) {
      console.error('Error subiendo imagen a Cloudinary:', error);
      throw new Error(`Error al subir imagen: ${error.message}`);
    }
  }

  /**
   * READ: Obtener información de una imagen
   * @param {string} publicId - Public ID de la imagen
   * @returns {Promise<Object>} - Información completa de la imagen
   */
  async read(publicId) {
    try {
      if (!publicId) {
        throw new Error('Public ID es requerido');
      }

      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'image'
      });

      return {
        ok: true,
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        createdAt: result.created_at,
        folder: result.folder,
        version: result.version
      };
    } catch (error) {
      console.error('Error obteniendo información de imagen:', error);
      if (error.http_code === 404) {
        throw new Error('Imagen no encontrada');
      }
      throw new Error(`Error al obtener información de imagen: ${error.message}`);
    }
  }

  /**
   * READ: Obtener URL de imagen con transformaciones opcionales
   * @param {string} publicId - Public ID de la imagen
   * @param {Object} options - Opciones de transformación
   * @param {number} options.width - Ancho deseado
   * @param {number} options.height - Alto deseado
   * @param {string} options.crop - Tipo de crop (limit, fill, fit, etc.)
   * @param {string} options.quality - Calidad (auto, 80, etc.)
   * @param {string} options.format - Formato (auto, jpg, png, webp, etc.)
   * @returns {string} - URL de la imagen transformada
   */
  getUrl(publicId, options = {}) {
    try {
      if (!publicId) {
        throw new Error('Public ID es requerido');
      }

      const {
        width,
        height,
        crop = 'limit',
        quality = 'auto',
        format
      } = options;

      const transformation = [];

      if (width || height) {
        transformation.push({
          width: width,
          height: height,
          crop: crop,
          quality: quality
        });
      } else if (quality !== 'auto') {
        transformation.push({ quality: quality });
      }

      if (format) {
        transformation.push({ format: format });
      }

      return cloudinary.url(publicId, {
        secure: true,
        transformation: transformation.length > 0 ? transformation : undefined
      });
    } catch (error) {
      console.error('Error obteniendo URL de imagen:', error);
      throw new Error(`Error al obtener URL de imagen: ${error.message}`);
    }
  }

  /**
   * UPDATE: Actualizar imagen en Cloudinary
   * Elimina la imagen anterior y sube una nueva
   * @param {string} oldPublicId - Public ID de la imagen antigua
   * @param {Buffer|string} newFile - Nueva imagen
   * @param {Object} options - Opciones de subida (mismas que create)
   * @returns {Promise<Object>} - Resultado de la actualización
   */
  async update(oldPublicId, newFile, options = {}) {
    try {
      if (!newFile) {
        throw new Error('Archivo de imagen es requerido');
      }

      // Eliminar imagen anterior si existe
      if (oldPublicId) {
        try {
          await this.delete(oldPublicId);
        } catch (error) {
          console.warn('No se pudo eliminar la imagen anterior:', error.message);
        }
      }

      // Subir nueva imagen
      const uploadResult = await this.create(newFile, options);

      return {
        ok: true,
        message: 'Imagen actualizada exitosamente',
        ...uploadResult
      };
    } catch (error) {
      console.error('Error actualizando imagen:', error);
      throw new Error(`Error al actualizar imagen: ${error.message}`);
    }
  }

  /**
   * DELETE: Eliminar imagen de Cloudinary
   * @param {string} publicId - Public ID de la imagen
   * @returns {Promise<Object>} - Resultado de la eliminación
   */
  async delete(publicId) {
    try {
      if (!publicId) {
        throw new Error('Public ID es requerido para eliminar la imagen');
      }

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image'
      });

      if (result.result === 'not found') {
        throw new Error('Imagen no encontrada');
      }

      return {
        ok: true,
        message: 'Imagen eliminada exitosamente',
        result: result.result
      };
    } catch (error) {
      console.error('Error eliminando imagen de Cloudinary:', error);
      throw new Error(`Error al eliminar imagen: ${error.message}`);
    }
  }

  /**
   * DELETE: Eliminar múltiples imágenes
   * @param {string[]} publicIds - Array de Public IDs
   * @returns {Promise<Object>} - Resultado de la eliminación
   */
  async deleteMultiple(publicIds) {
    try {
      if (!Array.isArray(publicIds) || publicIds.length === 0) {
        throw new Error('Se requiere un array de Public IDs');
      }

      const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: 'image'
      });

      return {
        ok: true,
        message: 'Imágenes eliminadas exitosamente',
        deleted: result.deleted,
        notFound: result.not_found || []
      };
    } catch (error) {
      console.error('Error eliminando múltiples imágenes:', error);
      throw new Error(`Error al eliminar imágenes: ${error.message}`);
    }
  }

  /**
   * READ: Buscar/listar imágenes en un folder
   * @param {string} folder - Carpeta donde buscar
   * @param {Object} options - Opciones de búsqueda
   * @param {number} options.maxResults - Máximo de resultados (default: 500)
   * @param {string} options.nextCursor - Cursor para paginación
   * @param {string[]} options.tags - Tags para filtrar
   * @returns {Promise<Object>} - Resultado de la búsqueda
   */
  async list(folder = 'asistia/images', options = {}) {
    try {
      const {
        maxResults = 500,
        nextCursor,
        tags
      } = options;

      const searchOptions = {
        resource_type: 'image',
        type: 'upload',
        prefix: folder,
        max_results: maxResults
      };

      if (nextCursor) {
        searchOptions.next_cursor = nextCursor;
      }

      if (tags && Array.isArray(tags) && tags.length > 0) {
        searchOptions.tags = tags;
      }

      const result = await cloudinary.search
        .expression(`${folder}/*`)
        .max_results(maxResults)
        .execute();

      return {
        ok: true,
        total: result.total_count,
        images: result.resources.map(img => ({
          publicId: img.public_id,
          url: img.secure_url,
          width: img.width,
          height: img.height,
          format: img.format,
          bytes: img.bytes,
          createdAt: img.created_at,
          folder: img.folder
        })),
        nextCursor: result.next_cursor
      };
    } catch (error) {
      console.error('Error buscando imágenes:', error);
      throw new Error(`Error al buscar imágenes: ${error.message}`);
    }
  }

  /**
   * Utilidad: Extraer publicId de una URL de Cloudinary
   * @param {string} url - URL de Cloudinary
   * @returns {string|null} - PublicId extraído o null
   */
  extractPublicIdFromUrl(url) {
    try {
      if (!url || typeof url !== 'string') {
        return null;
      }

      // Patrón para URLs de Cloudinary
      // Ejemplo: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
      const cloudinaryUrlPattern = /\/v\d+\/(.+?)(?:\.[^.]+)?$/;
      const match = url.match(cloudinaryUrlPattern);

      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }

      // Si no coincide con el patrón estándar, intentar extraer desde el final
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      const publicIdWithoutExt = lastPart.replace(/\.[^.]+$/, '');
      
      // Verificar si parece un publicId válido
      if (publicIdWithoutExt && publicIdWithoutExt.length > 0) {
        return publicIdWithoutExt;
      }

      return null;
    } catch (error) {
      console.error('Error extrayendo publicId de URL:', error);
      return null;
    }
  }

  /**
   * Configurar storage de Multer para Cloudinary (genérico)
   * @param {Object} config - Configuración del storage
   * @param {string} config.folder - Carpeta donde almacenar
   * @param {Function} config.publicIdGenerator - Función para generar public_id
   * @returns {Object} - Storage configurado
   */
  getMulterStorage(config = {}) {
    const {
      folder = 'asistia/images',
      publicIdGenerator
    } = config;

    // Verificar si Cloudinary está configurado
    if (!this.isConfigured()) {
      console.warn('Cloudinary no está configurado. Usando almacenamiento local como fallback.');
      // Usar almacenamiento local como fallback
      const path = require('path');
      const fs = require('fs');
      
      const uploadDir = 'uploads/photos';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      return multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const identifier = req.body.id || req.params.id || req.body.identifier || 'unknown';
          const timestamp = Date.now();
          const ext = path.extname(file.originalname);
          cb(null, `${identifier}_${timestamp}${ext}`);
        }
      });
    }
    
    return new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req, file) => {
        let publicId;
        
        if (publicIdGenerator && typeof publicIdGenerator === 'function') {
          publicId = await publicIdGenerator(req, file);
        } else {
          const identifier = req.body.id || req.params.id || req.body.identifier || 'general';
          const timestamp = Date.now();
          publicId = `${identifier}_${timestamp}`;
        }

        return {
          folder: folder,
          public_id: publicId,
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [
            {
              width: 800,
              height: 800,
              crop: 'limit',
              quality: 'auto'
            }
          ]
        };
      }
    });
  }

  /**
   * Obtener middleware de Multer configurado
   * @param {Object} config - Configuración (mismas opciones que getMulterStorage)
   * @returns {Object} - Middleware de Multer
   */
  getUploadMiddleware(config = {}) {
    const storage = this.getMulterStorage(config);
    return multer({
      storage: storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB límite
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Solo se permiten archivos de imagen'), false);
        }
      }
    });
  }

  /**
   * Verificar si Cloudinary está configurado correctamente
   * @returns {boolean}
   */
  isConfigured() {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }

  // Métodos de compatibilidad con nombres anteriores (deprecated)
  /**
   * @deprecated Usar create() en su lugar
   */
  async uploadImage(file, options = {}) {
    return this.create(file, options);
  }

  /**
   * @deprecated Usar read() en su lugar
   */
  async getImageInfo(publicId) {
    return this.read(publicId);
  }

  /**
   * @deprecated Usar getUrl() en su lugar
   */
  getImageUrl(publicId, options = {}) {
    return this.getUrl(publicId, options);
  }

  /**
   * @deprecated Usar update() en su lugar
   */
  async updateImage(oldPublicId, newFile, options = {}) {
    return this.update(oldPublicId, newFile, options);
  }

  /**
   * @deprecated Usar delete() en su lugar
   */
  async deleteImage(publicId) {
    return this.delete(publicId);
  }

  /**
   * @deprecated Usar deleteMultiple() en su lugar
   */
  async deleteMultipleImages(publicIds) {
    return this.deleteMultiple(publicIds);
  }

  /**
   * @deprecated Usar list() en su lugar
   */
  async searchImages(folder = 'asistia/images', options = {}) {
    return this.list(folder, options);
  }
}

module.exports = new CloudinaryService();
