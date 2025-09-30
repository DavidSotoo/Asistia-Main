
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("formAlumno");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const matricula = document.getElementById("matricula").value.trim();
    const grupo = document.getElementById("grupo").value.trim();
    const mensaje = document.getElementById("mensaje");

    // Validación frontend
    if (!nombre || !matricula || !grupo) {
      mensaje.textContent = "⚠️ Todos los campos son obligatorios.";
      mensaje.style.color = "red";
      return;
    }

    try {
      const respuesta = await fetch("http://localhost:3000/generarQR", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, matricula, grupo })
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        document.getElementById("qrImagen").src = data.qr;
        document.getElementById("qrImagen").hidden = false;
        document.getElementById("descargarQR").href = data.qr;
        document.getElementById("descargarQR").hidden = false;

        mensaje.textContent = "✅ QR generado con éxito.";
        mensaje.style.color = "green";
      } else {
        mensaje.textContent = `❌ Error: ${data.error}`;
        mensaje.style.color = "red";
      }
    } catch (error) {
      console.error(error);
      mensaje.textContent = "❌ Error de conexión con el servidor.";
      mensaje.style.color = "red";
    }
  });
});
