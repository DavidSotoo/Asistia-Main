const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createGroup = async (name) => {
  return prisma.group.create({
    data: { name },
  });
};

const getAllGroups = async () => {
  return prisma.group.findMany({
    include: {
      _count: {
        select: { students: true },
      },
    },
  });
};

const updateGroup = async (id, name) => {
  return prisma.group.update({
    where: { id: parseInt(id) },
    data: { name },
  });
};

const deleteGroup = async (id) => {
  // Opcional: Asegurarse de que no se pueda borrar un grupo con alumnos.
  // La lógica de negocio decidirá si primero se deben reasignar los alumnos.
  return prisma.group.delete({
    where: { id: parseInt(id) },
  });
};

module.exports = {
  createGroup,
  getAllGroups,
  updateGroup,
  deleteGroup,
};