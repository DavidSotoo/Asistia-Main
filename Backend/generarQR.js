const QRCode = require("qrcode");

// Lista de IDs de alumnos (puedes agregar más)
const alumnos = ["ALU123", "ALU456", "ALU789"];

(async () => {
  for (const id of alumnos) {
    await QRCode.toFile(`${id}.png`, id);
    console.log(`✅ QR generado: ${id}.png`);
  }
})();
