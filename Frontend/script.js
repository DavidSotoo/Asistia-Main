    const btnVolverMenuEscanear = document.getElementById('btnVolverMenuEscanear');
    const btnVolverMenuGenerar = document.getElementById('btnVolverMenuGenerar');

    if (btnVolverMenuEscanear) {
      btnVolverMenuEscanear.addEventListener('click', () => {
        menuPrincipal.style.display = '';
        seccionEscanear.style.display = 'none';
        seccionGenerar.style.display = 'none';
      });
    }
    if (btnVolverMenuGenerar) {
      btnVolverMenuGenerar.addEventListener('click', () => {
        menuPrincipal.style.display = '';
        seccionEscanear.style.display = 'none';
        seccionGenerar.style.display = 'none';
      });
    }
/* script.js
   Lógica de escaneo QR en tiempo real usando jsQR.
   Comentarios en español describiendo cada parte importante.
*/

(() => {
  // --- Menú principal: navegación entre pantallas ---
  document.addEventListener('DOMContentLoaded', () => {
    const menuPrincipal = document.getElementById('menuPrincipal');
    const btnIrEscanear = document.getElementById('btnIrEscanear');
    const btnIrGenerar = document.getElementById('btnIrGenerar');
    const seccionEscanear = document.getElementById('seccionEscanear');
    const seccionGenerar = document.getElementById('seccionGenerar');
    const logoutBtn = document.getElementById('logoutBtn');

    // Mostrar solo el menú principal al inicio
    if (menuPrincipal && seccionEscanear && seccionGenerar) {
      menuPrincipal.style.display = '';
      seccionEscanear.style.display = 'none';
      seccionGenerar.style.display = 'none';
    }

    if (btnIrEscanear) {
      btnIrEscanear.addEventListener('click', () => {
        menuPrincipal.style.display = 'none';
        seccionEscanear.style.display = '';
        seccionGenerar.style.display = 'none';
      });
    }
    if (btnIrGenerar) {
      btnIrGenerar.addEventListener('click', () => {
        menuPrincipal.style.display = 'none';
        seccionEscanear.style.display = 'none';
        seccionGenerar.style.display = '';
      });
    }
    // Botón cerrar sesión: regresa al menú principal
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        menuPrincipal.style.display = '';
        seccionEscanear.style.display = 'none';
        seccionGenerar.style.display = 'none';
      });
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

  // Variables del QR scanner
  let streamingStream = null;     // MediaStream actual
  let scanning = false;           // Flag principal de escaneo
  let rafId = null;               // requestAnimationFrame id
  const ctx = canvas.getContext('2d');

  // Previene re-escaneos rápidos: guardamos { id: timestamp }
  const recentlyScanned = new Map();
  const DUPLICATE_TIMEOUT_MS = 5000; // 5 segundos para permitir re-escaneo del mismo QR

  // Simula un "backend" con una tabla local (puedes ampliar)
  const fakeDatabase = {
    "ALU123": { nombre: "María", apellido: "García", estado: "Presente" },
    "ALU456": { nombre: "Carlos", apellido: "Pérez", estado: "Tarde" },
    "ALU789": { nombre: "Lucía", apellido: "Rodríguez", estado: "Presente" }
  };

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

    // Llamada real al backend
    registerAttendance(decodedText)
      .then(response => {
        // Mostrar en UI
        showResult(decodedText, response);
        // Añadir al historial
        addToHistory(decodedText, response);
      })
      .catch(err => {
        console.error('Error en petición al backend:', err);
        showResult(decodedText, { ok: false, mensaje: 'Error de conexión con el servidor' });
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
    const savedToken = localStorage.getItem('asistia_auth_token');
    const savedUser = localStorage.getItem('asistia_user');
    
    if (savedToken && savedUser) {
      try {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        isAuthenticated = true;
        showMainApp();
        return true;
      } catch (e) {
        localStorage.removeItem('asistia_auth_token');
        localStorage.removeItem('asistia_user');
      }
    }
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
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Añadir token de autenticación si está disponible
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${BACKEND_URL}/api/asistencia`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ id: qrText })
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en la petición al backend:', error);
      // Fallback a datos simulados si el backend no está disponible
      const alumno = fakeDatabase[qrText];
      if (alumno) {
        return { ok: true, alumno };
      } else {
        return {
          ok: false,
          alumno: { nombre: "Error", apellido: "", estado: "No registrado" },
          mensaje: 'Error de conexión con el servidor. Usando datos locales.'
        };
      }
    }
  }

  // Muestra resultado en la tarjeta principal
  function showResult(qrText, response) {
    resultCard.classList.remove('empty');
    resultCard.innerHTML = ''; // limpiamos

    const title = document.createElement('div');
    title.className = 'result-name';
    const alumno = response.alumno || {};
    title.textContent = `${alumno.nombre || '—'} ${alumno.apellido || ''}`.trim();

    const idLine = document.createElement('div');
    idLine.style.fontSize = '0.9rem';
    idLine.style.color = 'var(--muted)';
    idLine.textContent = `ID escaneado: ${qrText}`;

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
  function addToHistory(qrText, response) {
    const li = document.createElement('li');
    const time = new Date().toLocaleTimeString();
    const alumno = response.alumno || {};
    li.textContent = `${time} — ${qrText} — ${alumno.nombre || 'Desconocido'} ${alumno.apellido || ''} — ${alumno.estado || ''}`;
    historyList.prepend(li);

    // Limita el historial a 30 entradas
    while (historyList.children.length > 30) {
      historyList.removeChild(historyList.lastChild);
    }
  }

  // Botones
  // Event listeners para autenticación
  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);

  // Botones del QR scanner
  startBtn.addEventListener('click', startCamera);
  stopBtn.addEventListener('click', stopCamera);

  // Intento de usar linterna/torch si el dispositivo lo soporta
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

  // Inicialización de la aplicación
  function initializeApp() {
    // Verificar autenticación al cargar
    if (!checkAuthentication()) {
      showLoginForm();
    } else {
      // Obtener estadísticas si está autenticado
      logStats();
    }
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }

  // FIN del IIFE
})();
