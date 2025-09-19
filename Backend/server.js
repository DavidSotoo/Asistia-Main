// server.js
// Backend simple para control de asistencia con Node.js + Express

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "database.json");

// Middleware para parsear JSON
app.use(express.json());

// Endpoint principal: registrar asistencia
app.post("/api/asistencia", (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      ok: false,
      mensaje: "El cuerpo de la solicitud debe incluir un id",
    });
  }

  fs.readFile(DB_PATH, "utf8", (err, data) => {
    if (err) {
      console.error("Error leyendo la base de datos:", err);
      return res.status(500).json({
        ok: false,
        mensaje: "Error interno al leer la base de datos",
      });
    }

    let estudiantes;
    try {
      estudiantes = JSON.parse(data);
    } catch (parseErr) {
      console.error("Error parseando la base de datos:", parseErr);
      return res.status(500).json({
        ok: false,
        mensaje: "Error interno al procesar la base de datos",
      });
    }

    const alumno = estudiantes.find((e) => e.id === id);

    if (!alumno) {
      return res.json({
        ok: false,
        alumno: { nombre: "Error", estado: "No registrado" },
      });
    }

    if (alumno.estado !== "Presente") {
      alumno.estado = "Presente";
      fs.writeFile(DB_PATH, JSON.stringify(estudiantes, null, 2), (err) => {
        if (err) {
          console.error("Error escribiendo en la base de datos:", err);
          return res.status(500).json({
            ok: false,
            mensaje: "Error interno al guardar asistencia",
          });
        }
        return res.json({ ok: true, alumno });
      });
    } else {
      return res.json({
        ok: true,
        alumno,
        mensaje: "Alumno ya estaba marcado como presente",
      });
    }
  });
});

// 🆕 Endpoint extra: obtener listado completo
app.get("/api/listado", (req, res) => {
  fs.readFile(DB_PATH, "utf8", (err, data) => {
    if (err) {
      console.error("Error leyendo la base de datos:", err);
      return res.status(500).json({
        ok: false,
        mensaje: "Error interno al leer la base de datos",
      });
    }

    let estudiantes;
    try {
      estudiantes = JSON.parse(data);
    } catch (parseErr) {
      console.error("Error parseando la base de datos:", parseErr);
      return res.status(500).json({
        ok: false,
        mensaje: "Error interno al procesar la base de datos",
      });
    }

    return res.json({ ok: true, alumnos: estudiantes });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor de asistencia escuchando en http://localhost:${PORT}`);
});
