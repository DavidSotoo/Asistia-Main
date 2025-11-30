
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
    
    // Limpiar estado de la foto si existe
    if (typeof stopPhotoCamera === 'function') {
      stopPhotoCamera();
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

  // NOTA: El event listener del submit se maneja en script.js
  // Este archivo solo maneja validaciones de input y el botón de resetear
  // Se eliminó el event listener del submit para evitar conflictos con script.js
  // que maneja la creación de estudiantes con foto a través de /api/alumnos/create

  // Event listener para el botón "Generar Nuevo QR"
  if (generarNuevoQRBtn) {
    generarNuevoQRBtn.addEventListener("click", resetForm);
  }
});
