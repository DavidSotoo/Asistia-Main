const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');

// Rutas para el CRUD de Grupos
router.post('/', groupController.createGroup);
router.get('/', groupController.getAllGroups);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

module.exports = router;