const multer = require('multer');
const path = require('path');

// Configurar almacenamiento de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/photos/'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `upload_${timestamp}${ext}`);
  }
});

const upload = multer({
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

// Función del controlador para subir foto
const uploadPhoto = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No se ha subido ningún archivo'
      });
    }

    const photoUrl = `/uploads/photos/${req.file.filename}`;

    res.json({
      ok: true,
      photoUrl,
      mensaje: 'Foto subida exitosamente'
    });
  } catch (error) {
    console.error('Error subiendo foto:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error interno del servidor'
    });
  }
};

module.exports = {
  upload,
  uploadPhoto
};
