const groupService = require('../services/groupService');

const createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'El nombre del grupo es requerido.' });
    }
    const group = await groupService.createGroup(name);
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el grupo', error: error.message });
  }
};

const getAllGroups = async (req, res) => {
  try {
    const groups = await groupService.getAllGroups();
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los grupos', error: error.message });
  }
};

const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const group = await groupService.updateGroup(id, name);
    res.status(200).json(group);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el grupo', error: error.message });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    await groupService.deleteGroup(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el grupo', error: error.message });
  }
};

module.exports = {
  createGroup,
  getAllGroups,
  updateGroup,
  deleteGroup,
};