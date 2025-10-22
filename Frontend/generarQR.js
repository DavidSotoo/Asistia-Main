
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById("formAlumno");
  const generarNuevoQRBtn = document.getElementById("generarNuevoQR");
  const nombreInput = document.getElementById("nombre");
  const apellidoInput = document.getElementById("apellido");
  const matriculaInput = document.getElementById("matricula");
  const grupoInput = document.getElementById("grupo");
  if (!form) return;

  // Función para resetear el formulario y ocultar elementos
  function resetForm() {
    form.reset();
    document.getElementById("qrImagen").src = "placeholderQR.svg";
    document.getElementById("qrImagen").hidden = false;
    document.getElementById("descargarQR").href = "";
    document.getElementById("descargarQR").hidden = true;
    generarNuevoQRBtn.hidden = true;
    const mensaje = document.getElementById("mensaje");
    if (mensaje) {
      mensaje.textContent = "";
    }
  }

  // Función para validar y restringir entrada en tiempo real
  function validateInput(input, allowedRegex, errorMessage) {
    input.addEventListener('input', (e) => {
      // Remover caracteres inválidos directamente
      e.target.value = e.target.value.replace(allowedRegex, '');
    });

    input.addEventListener('paste', (e) => {
      const paste = (e.clipboardData || window.clipboardData).getData('text');
      if (!paste.match(new RegExp(`^[${allowedRegex.source.slice(1, -2)}]*$`))) {
        e.preventDefault();
        const mensaje = document.getElementById("mensaje");
        if (mensaje) {
          mensaje.textContent = errorMessage;
          mensaje.style.color = "orange";
          setTimeout(() => {
            mensaje.textContent = "";
          }, 3000);
        }
      }
    });
  }

  // Aplicar validaciones en tiempo real
  validateInput(nombreInput, /[^a-zA-Z\s]/g, "Solo se permiten letras y espacios en el nombre.");
  validateInput(apellidoInput, /[^a-zA-Z\s]/g, "Solo se permiten letras y espacios en el apellido.");
  validateInput(matriculaInput, /[^0-9]/g, "Solo se permiten números en la matrícula.");
  validateInput(grupoInput, /[^a-zA-Z0-9\s]/g, "Solo se permiten letras, números y espacios en el grupo.");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const matricula = document.getElementById("matricula").value.trim();
    const grupo = document.getElementById("grupo").value.trim();
    const mensaje = document.getElementById("mensaje");

    // Validación frontend
    if (!nombre || !apellido || !matricula || !grupo) {
      mensaje.textContent = "⚠️ Todos los campos son obligatorios.";
      mensaje.style.color = "red";
      return;
    }

    try {
      const respuesta = await fetch("http://localhost:3000/generarQR", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, apellido, matricula, grupo })
      });

      const data = await respuesta.json();

      if (respuesta.ok) {
        document.getElementById("qrImagen").src = data.qr;
        document.getElementById("qrImagen").hidden = false;
        document.getElementById("descargarQR").href = data.qr;
        document.getElementById("descargarQR").hidden = false;
        generarNuevoQRBtn.hidden = false;

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

  // Event listener para el botón "Generar Nuevo QR"
  if (generarNuevoQRBtn) {
    generarNuevoQRBtn.addEventListener("click", resetForm);
  }
});
