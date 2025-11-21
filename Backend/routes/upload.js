const express = require('express');
const router = express.Router();
const { upload, uploadPhoto } = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');

// Ruta para subir foto
router.post('/photo', authenticateToken, upload.single('photo'), uploadPhoto);

module.exports = router;
