/* script.js
   Lógica de escaneo QR en tiempo real usando jsQR.
   Comentarios en español describiendo cada parte importante.
*/

(() => {
  // --- Menú principal: navegación entre pantallas ---
  document.addEventListener('DOMContentLoaded', () => {
    const menuPrincipal = document.getElementById('menuPrincipal');
    const menuMaestro = document.getElementById('menuMaestro');
    const btnIrEscanear = document.getElementById('btnIrEscanear');
    const btnIrGenerar = document.getElementById('btnIrGenerar');
    const btnIrLista = document.getElementById('btnIrLista');
    const btnIrAlumnos = document.getElementById('btnIrAlumnos');
    const btnCrearMaestro = document.getElementById('btnCrearMaestro');
    const btnMaestroEscanear = document.getElementById('btnMaestroEscanear');
    const btnMaestroGenerar = document.getElementById('btnMaestroGenerar');
    const btnMaestroLista = document.getElementById('btnMaestroLista');
    const btnMaestroAlumnos = document.getElementById('btnMaestroAlumnos');
    const seccionEscanear = document.getElementById('seccionEscanear');
    const seccionGenerar = document.getElementById('seccionGenerar');
    const seccionListado = document.getElementById('seccionListado');
    const seccionAlumnos = document.getElementById('seccionAlumnos');
    const seccionCrearMaestro = document.getElementById('seccionCrearMaestro');
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnMaestro = document.getElementById('logoutBtnMaestro');
    const btnVolverMenuEscanear = document.getElementById('btnVolverMenuEscanear');
    const btnVolverMenuGenerar = document.getElementById('btnVolverMenuGenerar');
    const btnVolverMenuListado = document.getElementById('btnVolverMenuListado');
    const btnVolverMenuAlumnos = document.getElementById('btnVolverMenuAlumnos');
    const btnVolverMenuCrearMaestro = document.getElementById('btnVolverMenuCrearMaestro');

    // Función para ocultar todas las secciones
    const hideAllSections = () => {
      if (menuPrincipal) menuPrincipal.style.display = 'none';
      if (menuMaestro) menuMaestro.style.display = 'none';
      if (seccionEscanear) seccionEscanear.style.display = 'none';
      if (seccionGenerar) seccionGenerar.style.display = 'none';
      if (seccionListado) seccionListado.style.display = 'none';
      if (seccionAlumnos) seccionAlumnos.style.display = 'none';
      if (seccionCrearMaestro) seccionCrearMaestro.style.display = 'none';
    };

    // Mostrar solo el menú principal al inicio
    if (menuPrincipal && seccionEscanear && seccionGenerar && seccionListado && seccionAlumnos) {
      hideAllSections();
      menuPrincipal.style.display = '';
    }

    if (btnIrEscanear) {
      btnIrEscanear.addEventListener('click', () => {
        hideAllSections();
        seccionEscanear.style.display = '';
      });
    }
    if (btnIrGenerar) {
      btnIrGenerar.addEventListener('click', () => {
        hideAllSections();
        seccionGenerar.style.display = '';
      });
    }
    if (btnIrLista) {
      btnIrLista.addEventListener('click', () => {
        hideAllSections();
        seccionListado.style.display = '';
        loadAttendanceList();
      });
    }
    if (btnIrAlumnos) {
      btnIrAlumnos.addEventListener('click', () => {
        hideAllSections();
        seccionAlumnos.style.display = '';
        loadStudentsList();
      });
    }
    if (btnCrearMaestro) {
      btnCrearMaestro.addEventListener('click', () => {
        hideAllSections();
        seccionCrearMaestro.style.display = '';
        loadTeachersList();
      });
    }

    // Mostrar botón de crear maestro para maestros también
    if (currentUser && (currentUser.role === 'administrador' || currentUser.role === 'maestro')) {
      if (btnCrearMaestro) {
        btnCrearMaestro.style.display = '';
      }
    }
    if (btnMaestroEscanear) {
      btnMaestroEscanear.addEventListener('click', () => {
        hideAllSections();
        seccionEscanear.style.display = '';
        // Marcar que estamos en modo maestro para controlar la navegación
        window.isTeacherMode = true;
      });
    }
    if (btnMaestroGenerar) {
      btnMaestroGenerar.addEventListener('click', () => {
        hideAllSections();
        seccionGenerar.style.display = '';
      });
    }
    if (btnMaestroLista) {
      btnMaestroLista.addEventListener('click', () => {
        hideAllSections();
        seccionListado.style.display = '';
        loadAttendanceList();
      });
    }
    if (btnMaestroAlumnos) {
      btnMaestroAlumnos.addEventListener('click', () => {
        hideAllSections();
        seccionAlumnos.style.display = '';
        loadStudentsList();
      });
    }

    // Botón cerrar sesión: regresa al menú principal
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
    if (logoutBtnMaestro) {
      logoutBtnMaestro.addEventListener('click', handleLogout);
    }

    // Función para mostrar el menú principal según el rol del usuario
    const showMainMenu = () => {
      hideAllSections();
      if (currentUser && currentUser.role === 'maestro') {
        menuMaestro.style.display = '';
      } else {
        menuPrincipal.style.display = '';
      }
    };

    // Botones para volver al menú principal desde cada sección
    if (btnVolverMenuEscanear) {
      btnVolverMenuEscanear.addEventListener('click', showMainMenu);
    }
    if (btnVolverMenuGenerar) {
      btnVolverMenuGenerar.addEventListener('click', showMainMenu);
    }
    if (btnVolverMenuListado) {
      btnVolverMenuListado.addEventListener('click', showMainMenu);
    }
    if (btnVolverMenuAlumnos) {
      btnVolverMenuAlumnos.addEventListener('click', showMainMenu);
    }
    if (btnVolverMenuCrearMaestro) {
      btnVolverMenuCrearMaestro.addEventListener('click', showMainMenu);
    }
  });
  // Configuración del backend
  const BACKEND_URL = 'http://localhost:3000';
  
  // Elementos del DOM para login
  const loginContainer = document.getElementById('loginContainer');
  const mainApp = document.getElementById('mainApp');
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  // Elementos del DOM para QR scanner
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const resultCard = document.getElementById('resultCard');
  const historyList = document.getElementById('historyList');
  const torchToggle = document.getElementById('torchToggle');

  // Estado de autenticación
  let isAuthenticated = false;
  let currentUser = null;
  let authToken = null;
  window.currentUser = null;

  // Variables del QR scanner
  let streamingStream = null;     // MediaStream actual
  let scanning = false;           // Flag principal de escaneo
  let rafId = null;               // requestAnimationFrame id
  const ctx = canvas.getContext('2d');

  // Variables para captura de foto
  let photoStream = null;         // MediaStream para foto
  let capturedPhotoBlob = null;   // Blob de la foto capturada
  const photoCtx = photoCanvas.getContext('2d');

  // Previene re-escaneos rápidos: guardamos { id: timestamp }
  const recentlyScanned = new Map();
  const DUPLICATE_TIMEOUT_MS = 5000; // 5 segundos para permitir re-escaneo del mismo QR

  // Inicia la cámara y stream
  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('getUserMedia no está soportado en este navegador.');
      return;
    }

    // Pedimos preferentemente la cámara trasera en móvil
    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: 'environment' } // 'user' para cámara frontal
      }
    };

    try {
      streamingStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = streamingStream;
      await video.play();
      scanning = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;

      // Ajusta canvas al tamaño del video real
      resizeCanvasToVideo();
      // Empieza el loop de escaneo
      tick();
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      alert('No se pudo acceder a la cámara. Revisa permisos o prueba otro navegador.');
    }
  }

  // Detiene el stream y el loop de escaneo
  function stopCamera() {
    scanning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    if (rafId) cancelAnimationFrame(rafId);
    if (streamingStream) {
      streamingStream.getTracks().forEach(t => t.stop());
      streamingStream = null;
    }
    video.pause();
    video.srcObject = null;
    // limpia canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Ajusta canvas al tamaño del video para una lectura realista
  function resizeCanvasToVideo() {
    const vw = video.videoWidth || video.clientWidth;
    const vh = video.videoHeight || video.clientHeight;
    // Si no hay dimensiones aún, espera
    if (!vw || !vh) return;
    canvas.width = vw;
    canvas.height = vh;
  }

  // Bucle de escaneo: dibuja frame en canvas y ejecuta jsQR sobre ImageData
  function tick() {
    if (!scanning) return;
    resizeCanvasToVideo();
    // Dibuja el frame actual en el canvas
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    } catch (err) {
      // en algunos navegadores, drawImage puede lanzar hasta que el video tenga frames
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // jsQR espera Uint8ClampedArray con ancho y alto
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth" // intenta invertir colores si QR oscuro/claros
    });

    if (code) {
      handleDecoded(code.data);
      // Opcional: dibujar la caja del QR detectado (útil para debug)
      drawBoundingBox(code.location);
    }

    rafId = requestAnimationFrame(tick);
  }

  // Dibuja un rectángulo sobre el QR detectado para feedback visual (debug / UX)
  function drawBoundingBox(location) {
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(14,165,164,0.9)";
    ctx.moveTo(location.topLeftCorner.x, location.topLeftCorner.y);
    ctx.lineTo(location.topRightCorner.x, location.topRightCorner.y);
    ctx.lineTo(location.bottomRightCorner.x, location.bottomRightCorner.y);
    ctx.lineTo(location.bottomLeftCorner.x, location.bottomLeftCorner.y);
    ctx.closePath();
    ctx.stroke();
  }

  // Lógica al decodificar un QR
  function handleDecoded(decodedText) {
    const now = Date.now();
    // Si fue escaneado recientemente, lo ignoramos
    const last = recentlyScanned.get(decodedText);
    if (last && (now - last < DUPLICATE_TIMEOUT_MS)) {
      console.log('Ignorado (duplicado rápido):', decodedText);
      return;
    }
    // Guardamos timestamp
    recentlyScanned.set(decodedText, now);
    // Limpieza de map para no crecer indefinidamente
    cleanupRecentlyScanned();

    // Log en consola (requisito)
    console.log('QR decodificado:', decodedText);

    // Parsear datos del QR (esperamos JSON con matricula, nombre, apellido, grupo)
    let qrData;
    try {
      qrData = JSON.parse(decodedText);
    } catch (e) {
      console.error('Error parseando QR:', e);
      showResult(decodedText, { ok: false, mensaje: 'Formato de QR inválido' });
      return;
    }

    if (!qrData.matricula) {
      console.error('QR no contiene matricula');
      showResult(decodedText, { ok: false, mensaje: 'QR no contiene matrícula válida' });
      return;
    }

    // Llamada real al backend con la matricula
    registerAttendance(qrData.matricula)
      .then(response => {
        // Reproducir sonido de éxito si la respuesta es exitosa
        if (response.ok) {
          const successSound = document.getElementById('successSound');
          if (successSound) {
            successSound.currentTime = 0; // Reiniciar el sonido si ya se estaba reproduciendo
            successSound.play().catch(err => console.warn('No se pudo reproducir el sonido:', err));
          }
        }
        // Mostrar en UI
        showResult(qrData, response);
        // Añadir al historial
        addToHistory(qrData, response);
      })
      .catch(err => {
        console.error('Error en petición al backend:', err);
        showResult(qrData, { ok: false, mensaje: 'Error de conexión con el servidor' });
      });
  }

  // Limpia entradas antiguas de recentlyScanned cada cierto tiempo
  function cleanupRecentlyScanned() {
    const now = Date.now();
    for (const [key, ts] of recentlyScanned.entries()) {
      if (now - ts > DUPLICATE_TIMEOUT_MS * 6) { // p.ej. 30s
        recentlyScanned.delete(key);
      }
    }
  }

  // Funciones de autenticación
  function checkAuthentication() {
    // Siempre mostrar formulario de login al refrescar la página
    return false;
  }

  function showLoginForm() {
    loginContainer.style.display = 'flex';
    mainApp.style.display = 'none';
    isAuthenticated = false;
    currentUser = null;
    authToken = null;
  }

  function showMainApp() {
    loginContainer.style.display = 'none';
    mainApp.style.display = 'grid';
    isAuthenticated = true;

    // Mostrar el menú correcto según el rol del usuario
    if (currentUser && currentUser.role === 'maestro') {
      document.getElementById('menuMaestro').style.display = '';
      document.getElementById('menuPrincipal').style.display = 'none';
    } else {
      document.getElementById('menuPrincipal').style.display = '';
      document.getElementById('menuMaestro').style.display = 'none';

      // Para admin, mostrar solo botones de Crear Maestro y Alumnos
      if (currentUser && currentUser.role === 'administrador') {
        // Ocultar botones no necesarios para admin
        const btnIrEscanear = document.getElementById('btnIrEscanear');
        const btnIrGenerar = document.getElementById('btnIrGenerar');
        const btnIrLista = document.getElementById('btnIrLista');
        const btnCrearMaestro = document.getElementById('btnCrearMaestro');
        const btnIrAlumnos = document.getElementById('btnIrAlumnos');

        if (btnIrEscanear) btnIrEscanear.style.display = 'none';
        if (btnIrGenerar) btnIrGenerar.style.display = 'none';
        if (btnIrLista) btnIrLista.style.display = 'none';
        if (btnCrearMaestro) btnCrearMaestro.style.display = 'block';
        if (btnIrAlumnos) btnIrAlumnos.style.display = 'block';
      }
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    // Limpiar errores previos
    hideLoginError();
    
    // Validación básica
    if (!username || !password) {
      showLoginError('Por favor, completa todos los campos');
      return;
    }
    
    // Mostrar estado de carga
    setLoginLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      
      if (data.ok) {
        // Login exitoso
        authToken = data.data.token;
        currentUser = data.data.user;
        window.currentUser = currentUser;

        // Guardar en localStorage
        localStorage.setItem('asistia_auth_token', authToken);
        localStorage.setItem('asistia_user', JSON.stringify(currentUser));

        isAuthenticated = true;
        showMainApp();

        // Limpiar formulario
        loginForm.reset();
      } else {
        // Login fallido
        showLoginError(data.mensaje || 'Error de autenticación');
      }
    } catch (error) {
      console.error('Error en login:', error);
      showLoginError('Error de conexión con el servidor');
    } finally {
      setLoginLoading(false);
    }
  }

  function handleLogout() {
    // Detener cámara si está activa
    stopCamera();
    
    // Limpiar sesión
    localStorage.removeItem('asistia_auth_token');
    localStorage.removeItem('asistia_user');
    isAuthenticated = false;
    currentUser = null;
    authToken = null;
    
    // Mostrar formulario de login
    showLoginForm();
  }

  function showLoginError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
  }

  function hideLoginError() {
    loginError.style.display = 'none';
  }

  function setLoginLoading(loading) {
    const btnText = loginBtn.querySelector('.btn-text');
    const btnLoading = loginBtn.querySelector('.btn-loading');
    
    if (loading) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline';
      loginBtn.disabled = true;
    } else {
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      loginBtn.disabled = false;
    }
  }

  // Llamada real al backend para registrar asistencia
  async function registerAttendance(qrText) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch(`${BACKEND_URL}/api/asistencia`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: qrText })
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error en la petición al backend:', error);
      return {
        ok: false,
        alumno: { nombre: "Error", apellido: "", estado: "No registrado" },
        mensaje: 'Error de conexión con el servidor'
      };
    }
  }

  // Muestra resultado en la tarjeta principal
  function showResult(qrData, response) {
    resultCard.classList.remove('empty');
    resultCard.innerHTML = ''; // limpiamos

    const alumno = response.alumno || {};

    // Mostrar foto si existe
    if (alumno.photoUrl) {
      const photoContainer = document.createElement('div');
      photoContainer.className = 'result-photo-container';
      const photoImg = document.createElement('img');
      photoImg.className = 'result-photo';
      photoImg.src = `${BACKEND_URL}${alumno.photoUrl}`;
      photoImg.alt = `Foto de ${alumno.nombre} ${alumno.apellido}`;
      photoContainer.appendChild(photoImg);
      resultCard.appendChild(photoContainer);
    }

    const title = document.createElement('div');
    title.className = 'result-name';
    title.textContent = `${alumno.nombre || qrData.nombre || '—'} ${alumno.apellido || qrData.apellido || ''}`.trim();

    const idLine = document.createElement('div');
    idLine.style.fontSize = '0.9rem';
    idLine.style.color = 'var(--muted)';
    idLine.textContent = `ID escaneado: ${qrData.matricula || qrData}`;

    const state = document.createElement('div');
    state.className = 'result-state';
    state.textContent = alumno.estado || (response.mensaje || 'Sin estado');
    // tiny styling según estado
    if ((alumno.estado || '').toLowerCase().includes('pres')) {
      state.style.background = 'var(--success)';
      state.style.color = '#042017';
    } else {
      state.style.background = 'rgba(255,255,255,0.06)';
      state.style.color = 'var(--muted)';
    }

    // Mensaje adicional del backend (si existe)
    const note = document.createElement('div');
    note.style.marginTop = '8px';
    note.style.color = 'var(--muted)';
    note.style.fontSize = '0.85rem';
    if (response.mensaje) note.textContent = response.mensaje;

    resultCard.appendChild(title);
    resultCard.appendChild(idLine);
    resultCard.appendChild(state);
    if (response.mensaje) resultCard.appendChild(note);
  }

  // Añade el evento al historial visible
  function addToHistory(qrData, response) {
    const li = document.createElement('li');
    const time = new Date().toLocaleTimeString();
    const alumno = response.alumno || {};
    li.textContent = `${time} — ${qrData.matricula || qrData} — ${alumno.nombre || qrData.nombre || 'Desconocido'} ${alumno.apellido || qrData.apellido || ''} — ${alumno.estado || ''}`;
    historyList.prepend(li);

    // Limita el historial a 30 entradas
    while (historyList.children.length > 30) {
      historyList.removeChild(historyList.lastChild);
    }
  }

  // Botones
  // Event listeners para autenticación
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Botones del QR scanner
  if (startBtn) {
    startBtn.addEventListener('click', startCamera);
  }
  if (stopBtn) {
    stopBtn.addEventListener('click', stopCamera);
  }

  // Intento de usar linterna/torch si el dispositivo lo soporta
  if (torchToggle) {
    torchToggle.addEventListener('change', async (e) => {
      const enabled = e.target.checked;
      if (!streamingStream) {
        alert('Primero inicia la cámara para usar la linterna.');
        torchToggle.checked = false;
        return;
      }
      const videoTrack = streamingStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      if (!capabilities.torch) {
        alert('Este dispositivo no soporta linterna/torch a través de la API.');
        torchToggle.checked = false;
        return;
      }
      try {
        await videoTrack.applyConstraints({ advanced: [{ torch: enabled }] });
      } catch (err) {
        console.warn('No fue posible cambiar la linterna:', err);
        alert('No se pudo activar la linterna en este dispositivo.');
        torchToggle.checked = false;
      }
    });
  }

  // Función para obtener estadísticas del backend
  async function getAttendanceStats() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/stats`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }

  // Función para mostrar estadísticas en consola (opcional)
  async function logStats() {
    const stats = await getAttendanceStats();
    if (stats && stats.ok) {
      console.log('📊 Estadísticas de asistencia:', stats.stats);
    }
  }

  // Si cerramos la pestaña o recargamos, detenemos la cámara
  window.addEventListener('pagehide', stopCamera);
  window.addEventListener('unload', stopCamera);
  window.addEventListener('pagehide', stopPhotoCamera);
  window.addEventListener('unload', stopPhotoCamera);

  // Inicialización de la aplicación
  function initializeApp() {
    // Verificar autenticación al cargar
    if (!checkAuthentication()) {
      // Mostrar formulario de login
      showLoginForm();
    } else {
      // Obtener estadísticas si está autenticado
      logStats();
    }
  }

  // Función para mostrar la lista de asistencia directamente sin login
  function showAttendanceListDirectly() {
    loginContainer.style.display = 'none';
    mainApp.style.display = 'grid';
    // Ocultar menú principal y mostrar solo la sección de lista
    document.getElementById('menuPrincipal').style.display = 'none';
    document.getElementById('seccionListado').style.display = '';
    loadAttendanceList();
  }

  // Función para cargar la lista de asistencia
  async function loadAttendanceList() {
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/listado`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        renderAttendanceTable(data.alumnos);
        updateStats(data.alumnos);
      } else {
        console.error('Error obteniendo lista:', data.mensaje);
        alert('Error al cargar la lista de asistencia');
      }
    } catch (error) {
      console.error('Error cargando lista de asistencia:', error);
      alert('Error de conexión con el servidor');
    }
  }

  // Función para renderizar la tabla de asistencia
  function renderAttendanceTable(alumnos) {
    const tableBody = document.getElementById('attendanceTableBody');
    tableBody.innerHTML = '';

    alumnos.forEach(alumno => {
      const row = document.createElement('tr');

      // ID
      const idCell = document.createElement('td');
      idCell.textContent = alumno.id;
      row.appendChild(idCell);

      // Nombre
      const nombreCell = document.createElement('td');
      nombreCell.textContent = alumno.nombre;
      row.appendChild(nombreCell);

      // Apellido
      const apellidoCell = document.createElement('td');
      apellidoCell.textContent = alumno.apellido;
      row.appendChild(apellidoCell);

      // Estado
      const estadoCell = document.createElement('td');
      const statusBadge = document.createElement('span');
      statusBadge.className = `status-badge status-${alumno.estado.toLowerCase()}`;
      statusBadge.textContent = alumno.estado;
      estadoCell.appendChild(statusBadge);
      row.appendChild(estadoCell);

      // Última actualización
      const updateCell = document.createElement('td');
      updateCell.className = 'last-updated';
      updateCell.textContent = alumno.lastUpdated ? new Date(alumno.lastUpdated).toLocaleString() : 'N/A';
      row.appendChild(updateCell);

      // Acciones
      const actionsCell = document.createElement('td');
      const presenteBtn = document.createElement('button');
      presenteBtn.className = 'action-btn presente';
      presenteBtn.textContent = 'Presente';
      presenteBtn.onclick = () => updateStudentStatus(alumno.id, 'Presente');

      const ausenteBtn = document.createElement('button');
      ausenteBtn.className = 'action-btn ausente';
      ausenteBtn.textContent = 'Ausente';
      ausenteBtn.onclick = () => updateStudentStatus(alumno.id, 'Ausente');

      const tardeBtn = document.createElement('button');
      tardeBtn.className = 'action-btn tarde';
      tardeBtn.textContent = 'Tarde';
      tardeBtn.onclick = () => updateStudentStatus(alumno.id, 'Tarde');

      actionsCell.appendChild(presenteBtn);
      actionsCell.appendChild(ausenteBtn);
      actionsCell.appendChild(tardeBtn);
      row.appendChild(actionsCell);

      tableBody.appendChild(row);
    });
  }

  // Función para actualizar estadísticas
  function updateStats(alumnos) {
    const total = alumnos.length;
    const presentes = alumnos.filter(a => a.estado === 'Presente').length;
    const ausentes = alumnos.filter(a => a.estado === 'Ausente').length;
    const tarde = alumnos.filter(a => a.estado === 'Tarde').length;

    document.getElementById('totalAlumnos').textContent = total;
    document.getElementById('totalPresentes').textContent = presentes;
    document.getElementById('totalAusentes').textContent = ausentes;
    document.getElementById('totalTarde').textContent = tarde;
  }

  // Función para exportar a CSV
  async function exportToCSV() {
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/export/csv`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      // Crear blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'asistencia.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert('Archivo CSV descargado exitosamente');
    } catch (error) {
      console.error('Error descargando CSV:', error);
      alert('Error al descargar el archivo CSV');
    }
  }

  // Hacer función global para que pueda ser llamada desde HTML
  window.exportToCSV = exportToCSV;

  // Función para actualizar el estado de un estudiante
  async function updateStudentStatus(id, status) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/student/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        // Recargar la lista después de actualizar
        loadAttendanceList();
        alert(`Estado actualizado: ${data.alumno.nombre} ${data.alumno.apellido} - ${data.alumno.estado}`);
      } else {
        console.error('Error actualizando estado:', data.mensaje);
        alert('Error al actualizar el estado del estudiante');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      alert('Error de conexión con el servidor');
    }
  }

  // Función para cargar la lista de alumnos
  async function loadStudentsList() {
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/alumnos`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        renderStudentsTable(data.alumnos);
      } else {
        console.error('Error obteniendo lista de alumnos:', data.mensaje);
        alert('Error al cargar la lista de alumnos');
      }
    } catch (error) {
      console.error('Error cargando lista de alumnos:', error);
      alert('Error de conexión con el servidor');
    }
  }

  // Función para cargar la lista de alumnos en la sección generar
  async function loadStudentsListGenerar() {
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/alumnos`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        renderStudentsTableGenerar(data.alumnos);
      } else {
        console.error('Error obteniendo lista de alumnos:', data.mensaje);
        alert('Error al cargar la lista de alumnos');
      }
    } catch (error) {
      console.error('Error cargando lista de alumnos:', error);
      alert('Error de conexión con el servidor');
    }
  }

  // Función para renderizar las tarjetas de alumnos
  function renderStudentsTable(alumnos) {
    const cardsContainer = document.getElementById('studentsCardsContainer');
    cardsContainer.innerHTML = '';

    console.log('🔍 DIAGNÓSTICO - Renderizando lista de alumnos:', alumnos.length, 'alumnos');

    alumnos.forEach(alumno => {
      console.log('👤 Alumno:', {
        id: alumno.id,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        photoUrl: alumno.photoUrl,
        matricula: alumno.matricula,
        grupo: alumno.grupo
      });

      const card = document.createElement('div');
      card.className = 'student-card';

      const cardHeader = document.createElement('div');
      cardHeader.className = 'student-card-header';

      const studentId = document.createElement('span');
      studentId.className = 'student-id';
      studentId.textContent = `ID: ${alumno.id}`;
      cardHeader.appendChild(studentId);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete-student logout-btn';
      deleteBtn.textContent = 'Eliminar';
      deleteBtn.onclick = () => deleteStudent(alumno.id);
      cardHeader.appendChild(deleteBtn);

      card.appendChild(cardHeader);

      // Mostrar foto o avatar con iniciales
      const photoContainer = document.createElement('div');
      photoContainer.className = 'student-photo-container';

      if (alumno.photoUrl) {
        console.log('📸 Alumno tiene photoUrl:', alumno.photoUrl);
        const fullPhotoUrl = `${BACKEND_URL}${alumno.photoUrl}`;
        console.log('🔗 URL completa de la foto:', fullPhotoUrl);

        const photoImg = document.createElement('img');
        photoImg.className = 'student-photo';
        photoImg.src = fullPhotoUrl;
        photoImg.alt = `Foto de ${alumno.nombre} ${alumno.apellido}`;

        // Agregar eventos de diagnóstico
        photoImg.onload = () => {
          console.log('✅ Foto cargada exitosamente:', fullPhotoUrl);
        };
        photoImg.onerror = (e) => {
          console.error('❌ Error cargando foto:', fullPhotoUrl, e);
        };

        photoContainer.appendChild(photoImg);
      } else {
        console.log('👤 Alumno NO tiene photoUrl, creando avatar');
        // Crear avatar con iniciales
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'student-avatar';
        const iniciales = `${alumno.nombre.charAt(0)}${alumno.apellido.charAt(0)}`.toUpperCase();
        console.log('🔤 Iniciales generadas:', iniciales, 'para', alumno.nombre, alumno.apellido);
        avatarDiv.textContent = iniciales;
        avatarDiv.title = `${alumno.nombre} ${alumno.apellido}`;
        photoContainer.appendChild(avatarDiv);
      }

      card.appendChild(photoContainer);

      const studentName = document.createElement('div');
      studentName.className = 'student-name';
      studentName.textContent = alumno.nombre;
      card.appendChild(studentName);

      const studentLastname = document.createElement('div');
      studentLastname.className = 'student-lastname';
      studentLastname.textContent = alumno.apellido;
      card.appendChild(studentLastname);

      const studentGroup = document.createElement('div');
      studentGroup.className = 'student-group';
      studentGroup.textContent = alumno.grupo || 'N/A';
      card.appendChild(studentGroup);

      const qrContainer = document.createElement('div');
      qrContainer.className = 'student-qr-container';

      const qrLabel = document.createElement('div');
      qrLabel.className = 'student-qr-label';
      qrLabel.textContent = 'Código QR';
      qrContainer.appendChild(qrLabel);

      const qrImg = document.createElement('img');
      qrImg.className = 'student-qr-image';
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(JSON.stringify({
        id: alumno.id,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        matricula: alumno.matricula,
        grupo: alumno.grupo
      }))}`;
      qrImg.alt = `QR de ${alumno.nombre} ${alumno.apellido}`;
      qrContainer.appendChild(qrImg);

      card.appendChild(qrContainer);
      cardsContainer.appendChild(card);
    });

    console.log('✅ Renderizado completado de', alumnos.length, 'tarjetas de alumnos');
  }

  // Función para renderizar las tarjetas de alumnos en la sección generar
  function renderStudentsTableGenerar(alumnos) {
    const cardsContainer = document.getElementById('studentsCardsContainerGenerar');
    cardsContainer.innerHTML = '';

    alumnos.forEach(alumno => {
      const card = document.createElement('div');
      card.className = 'student-card';

      const cardHeader = document.createElement('div');
      cardHeader.className = 'student-card-header';

      const studentId = document.createElement('span');
      studentId.className = 'student-id';
      studentId.textContent = `ID: ${alumno.id}`;
      cardHeader.appendChild(studentId);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete-student logout-btn';
      deleteBtn.textContent = 'Eliminar';
      deleteBtn.onclick = () => deleteStudent(alumno.id);
      cardHeader.appendChild(deleteBtn);

      card.appendChild(cardHeader);

      // Mostrar foto si existe
      if (alumno.photoUrl) {
        const photoContainer = document.createElement('div');
        photoContainer.className = 'student-photo-container';
        const photoImg = document.createElement('img');
        photoImg.className = 'student-photo';
        photoImg.src = `${BACKEND_URL}${alumno.photoUrl}`;
        photoImg.alt = `Foto de ${alumno.nombre} ${alumno.apellido}`;
        photoContainer.appendChild(photoImg);
        card.appendChild(photoContainer);
      }

      const studentName = document.createElement('div');
      studentName.className = 'student-name';
      studentName.textContent = alumno.nombre;
      card.appendChild(studentName);

      const studentLastname = document.createElement('div');
      studentLastname.className = 'student-lastname';
      studentLastname.textContent = alumno.apellido;
      card.appendChild(studentLastname);

      const studentGroup = document.createElement('div');
      studentGroup.className = 'student-group';
      studentGroup.textContent = alumno.grupo || 'N/A';
      card.appendChild(studentGroup);

      const qrContainer = document.createElement('div');
      qrContainer.className = 'student-qr-container';

      const qrLabel = document.createElement('div');
      qrLabel.className = 'student-qr-label';
      qrLabel.textContent = 'Código QR';
      qrContainer.appendChild(qrLabel);

      const qrImg = document.createElement('img');
      qrImg.className = 'student-qr-image';
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(JSON.stringify({
        id: alumno.id,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        matricula: alumno.matricula,
        grupo: alumno.grupo
      }))}`;
      qrImg.alt = `QR de ${alumno.nombre} ${alumno.apellido}`;
      qrContainer.appendChild(qrImg);

      card.appendChild(qrContainer);
      cardsContainer.appendChild(card);
    });
  }

  // Función para eliminar un estudiante
  async function deleteStudent(studentId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este estudiante? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/alumnos/${studentId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        alert('Estudiante eliminado exitosamente');
        loadStudentsList(); // Recargar la lista
      } else {
        console.error('Error eliminando estudiante:', data.mensaje);
        alert('Error al eliminar el estudiante');
      }
    } catch (error) {
      console.error('Error eliminando estudiante:', error);
      alert('Error de conexión con el servidor');
    }
  }

  // Funciones para gestión de maestros
  async function createTeacher(teacherData) {
    try {
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (!authToken) {
        throw new Error('No hay token de autenticación');
      }
      
      headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch(`${BACKEND_URL}/api/teachers/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(teacherData)
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Error de autorización: ${response.status}`);
        }
        
        const errorText = await response.text();
        console.error('❌ Error en respuesta:', errorText);
        throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error creando maestro:', error);
      throw error;
    }
  }

  async function loadTeachersList() {
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/teachers/list`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        renderTeachersList(data.data);
      } else {
        console.error('Error obteniendo lista de maestros:', data.mensaje);
        alert('Error al cargar la lista de maestros');
      }
    } catch (error) {
      console.error('Error cargando lista de maestros:', error);
      alert('Error de conexión con el servidor');
    }
  }

  function renderTeachersList(teachers) {
    const teachersList = document.getElementById('teachersList');
    teachersList.innerHTML = '';

    if (teachers.length === 0) {
      teachersList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No hay maestros registrados</p>';
      return;
    }

    teachers.forEach(teacher => {
      const teacherItem = document.createElement('div');
      teacherItem.className = 'teacher-item';

      teacherItem.innerHTML = `
        <div class="teacher-info">
          <div class="teacher-name">${teacher.name}</div>
          <div class="teacher-details">
            Usuario: ${teacher.username}
            ${teacher.email ? ` | Email: ${teacher.email}` : ''}
            <br>
            Creado: ${new Date(teacher.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div class="teacher-actions">
          <button class="btn btn-small btn-danger" onclick="deleteTeacher('${teacher.id}')">Eliminar</button>
        </div>
      `;

      teachersList.appendChild(teacherItem);
    });
  }

  async function deleteTeacher(teacherId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este maestro?')) {
      return;
    }

    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/teachers/${teacherId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        alert('Maestro eliminado exitosamente');
        loadTeachersList(); // Recargar la lista
      } else {
        console.error('Error eliminando maestro:', data.mensaje);
        alert('Error al eliminar el maestro');
      }
    } catch (error) {
      console.error('Error eliminando maestro:', error);
      alert('Error de conexión con el servidor');
    }
  }

  // Hacer funciones globales para que puedan ser llamadas desde HTML
  window.deleteTeacher = deleteTeacher;

  // Event listener para el formulario de crear maestro
  function setupTeacherFormListener() {
    const formCrearMaestro = document.getElementById('formCrearMaestro');
    
    if (formCrearMaestro) {
      // Remover listener anterior si existe
      formCrearMaestro.removeEventListener('submit', handleTeacherFormSubmit);
      // Agregar nuevo listener
      formCrearMaestro.addEventListener('submit', handleTeacherFormSubmit);
    }
  }

  // Función para manejar el envío del formulario
  async function handleTeacherFormSubmit(event) {
    event.preventDefault();
    
    
    // Verificar que hay token de autenticación
    if (!authToken) {
      alert('Error: No hay sesión activa. Por favor, inicia sesión nuevamente.');
      handleLogout();
      return;
    }
    
    const formCrearMaestro = event.target;
    const formData = new FormData(formCrearMaestro);
    const teacherData = {
      username: formData.get('username'),
      password: formData.get('password'),
      name: formData.get('name'),
      email: formData.get('email') || null
    };

    // Validar datos requeridos
    if (!teacherData.username || !teacherData.password || !teacherData.name) {
      alert('Por favor, completa todos los campos requeridos.');
      return;
    }

    try {
      const response = await createTeacher(teacherData);
      
      if (response.ok) {
        alert('Maestro creado exitosamente');
        formCrearMaestro.reset();
        loadTeachersList(); // Recargar la lista
      } else {
        alert(response.mensaje || 'Error al crear el maestro');
      }
    } catch (error) {
      console.error('❌ Error creando maestro:', error);
      if (error.message.includes('401') || error.message.includes('403')) {
        alert('Error de autorización. Por favor, inicia sesión nuevamente.');
        handleLogout();
      } else {
        alert('Error de conexión con el servidor');
      }
    }
  }

  // Inicializar cuando el DOM esté listo
  // Event listener para el botón de exportar CSV
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeApp();
      setupTeacherFormListener();
    });
  } else {
    initializeApp();
    setupTeacherFormListener();
  }

  // Funciones para captura de foto
  async function startPhotoCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('getUserMedia no está soportado en este navegador.');
      return;
    }

    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: 'user' }, // Cámara frontal para fotos
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    };

    try {
      photoStream = await navigator.mediaDevices.getUserMedia(constraints);
      const photoVideo = document.getElementById('photoVideo');
      photoVideo.srcObject = photoStream;
      await photoVideo.play();

      document.getElementById('startPhotoCamera').disabled = true;
      document.getElementById('capturePhoto').disabled = false;
      document.getElementById('retakePhoto').style.display = 'none';
      document.getElementById('photoPreview').style.display = 'none';
    } catch (err) {
      console.error('Error al acceder a la cámara para foto:', err);
      alert('No se pudo acceder a la cámara para tomar foto.');
    }
  }

  function stopPhotoCamera() {
    if (photoStream) {
      photoStream.getTracks().forEach(t => t.stop());
      photoStream = null;
    }
    const photoVideo = document.getElementById('photoVideo');
    if (photoVideo) {
      photoVideo.pause();
      photoVideo.srcObject = null;
    }
    document.getElementById('startPhotoCamera').disabled = false;
    document.getElementById('capturePhoto').disabled = true;
    document.getElementById('retakePhoto').style.display = 'none';
    document.getElementById('photoPreview').style.display = 'none';
  }

  function capturePhoto() {
    const photoVideo = document.getElementById('photoVideo');
    const photoCanvas = document.getElementById('photoCanvas');
    const capturedPhoto = document.getElementById('capturedPhoto');

    if (!photoVideo || !photoCanvas) return;

    // Ajustar canvas al tamaño del video
    photoCanvas.width = photoVideo.videoWidth;
    photoCanvas.height = photoVideo.videoHeight;

    // Dibujar el frame actual en el canvas
    photoCtx.drawImage(photoVideo, 0, 0, photoCanvas.width, photoCanvas.height);

    // Convertir a blob
    photoCanvas.toBlob(blob => {
      capturedPhotoBlob = blob;
      capturedPhoto.src = URL.createObjectURL(blob);

      // Mostrar preview y ocultar video
      document.getElementById('photoPreview').style.display = '';
      photoVideo.style.display = 'none';
      document.getElementById('capturePhoto').disabled = true;
      document.getElementById('retakePhoto').style.display = '';
    }, 'image/jpeg', 0.8);
  }

  function retakePhoto() {
    // Limpiar blob anterior
    if (capturedPhotoBlob) {
      URL.revokeObjectURL(capturedPhoto.src);
      capturedPhotoBlob = null;
    }

    // Mostrar video y ocultar preview
    document.getElementById('photoVideo').style.display = '';
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('capturePhoto').disabled = false;
    document.getElementById('retakePhoto').style.display = 'none';
  }

  // Función para crear alumno con foto
  async function createStudentWithPhoto(formData) {
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Crear FormData con los datos del formulario y la foto
      const submitData = new FormData();

      // Agregar campos del formulario
      submitData.append('nombre', formData.get('nombre'));
      submitData.append('apellido', formData.get('apellido'));
      submitData.append('matricula', formData.get('matricula'));
      submitData.append('grupo', formData.get('grupo'));

      // Agregar foto si existe
      if (capturedPhotoBlob) {
        submitData.append('photo', capturedPhotoBlob, `photo_${Date.now()}.jpg`);
      }

      const response = await fetch(`${BACKEND_URL}/api/alumnos/create`, {
        method: 'POST',
        headers,
        body: submitData
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creando alumno:', error);
      throw error;
    }
  }

  // Event listeners para captura de foto
  if (document.getElementById('startPhotoCamera')) {
    document.getElementById('startPhotoCamera').addEventListener('click', startPhotoCamera);
  }
  if (document.getElementById('capturePhoto')) {
    document.getElementById('capturePhoto').addEventListener('click', capturePhoto);
  }
  if (document.getElementById('retakePhoto')) {
    document.getElementById('retakePhoto').addEventListener('click', retakePhoto);
  }

  // Modificar el event listener del formulario de alumno
  const formAlumno = document.getElementById('formAlumno');
  if (formAlumno) {
    formAlumno.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(formAlumno);
      const nombre = formData.get('nombre');
      const apellido = formData.get('apellido');
      const matricula = formData.get('matricula');
      const grupo = formData.get('grupo');

      if (!nombre || !apellido || !matricula || !grupo) {
        alert('Por favor, completa todos los campos requeridos');
        return;
      }

      try {
        const response = await createStudentWithPhoto(formData);

        if (response.ok) {
          alert('Alumno creado exitosamente');
          formAlumno.reset();
          stopPhotoCamera();

          // Generar QR directamente en el frontend
          const alumno = response.alumno;
          const qrData = JSON.stringify({
            id: alumno.id,
            nombre: alumno.nombre,
            apellido: alumno.apellido,
            matricula: alumno.matricula,
            grupo: alumno.grupo,
            photoUrl: alumno.photoUrl
          });

          QRCode.toDataURL(qrData, (err, url) => {
            if (err) {
              console.error('Error generando QR:', err);
              document.getElementById('mensaje').textContent = '❌ Error generando QR.';
              document.getElementById('mensaje').style.color = 'red';
              return;
            }

            document.getElementById('qrImagen').src = url;
            document.getElementById('qrImagen').hidden = false;
            document.getElementById('descargarQR').href = url;
            document.getElementById('descargarQR').hidden = false;
            document.getElementById('generarNuevoQR').hidden = false;

            document.getElementById('mensaje').textContent = '✅ QR generado con éxito.';
            document.getElementById('mensaje').style.color = 'green';
          });
        } else {
          alert(response.mensaje || 'Error al crear el alumno');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión con el servidor');
      }
    });
  }

  // FIN del IIFE
})();
