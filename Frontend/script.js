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
    const seccionGestionarMaterias = document.getElementById('seccionGestionarMaterias');
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutBtnMaestro = document.getElementById('logoutBtnMaestro');
    const btnVolverMenuEscanear = document.getElementById('btnVolverMenuEscanear');
    const btnVolverMenuGenerar = document.getElementById('btnVolverMenuGenerar');
    const btnVolverMenuListado = document.getElementById('btnVolverMenuListado');
    const btnVolverMenuAlumnos = document.getElementById('btnVolverMenuAlumnos');
    const btnVolverMenuCrearMaestro = document.getElementById('btnVolverMenuCrearMaestro');
    const btnVolverMenuMaterias = document.getElementById('btnVolverMenuMaterias');
    const btnGestionarMaterias = document.getElementById('btnGestionarMaterias');

    // Función para ocultar todas las secciones (compatibilidad)
    const hideAllSections = () => {
      if (menuPrincipal) menuPrincipal.style.display = 'none';
      if (menuMaestro) menuMaestro.style.display = 'none';
      if (seccionEscanear) seccionEscanear.style.display = 'none';
      if (seccionGenerar) seccionGenerar.style.display = 'none';
      if (seccionListado) seccionListado.style.display = 'none';
      if (seccionAlumnos) seccionAlumnos.style.display = 'none';
      if (seccionCrearMaestro) seccionCrearMaestro.style.display = 'none';
      if (seccionGestionarMaterias) seccionGestionarMaterias.style.display = 'none';
    };

    // ── Sidebar: conectar todos los nav items ───────────────
    document.querySelectorAll('.ds-nav-item[data-section]').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        if (section && window.dsNavigate) window.dsNavigate(section);
      });
    });

    // Action cards del dashboard
    document.querySelectorAll('.ds-action-card[data-nav]').forEach(card => {
      card.addEventListener('click', () => {
        const section = card.dataset.nav;
        if (section && window.dsNavigate) window.dsNavigate(section);
      });
    });

    // Botones "volver" — navegan al dashboard
    const backBtns = [
      'btnVolverMenuEscanear', 'btnVolverMenuGenerar',
      'btnVolverMenuListado', 'btnVolverMenuAlumnos',
      'btnVolverMenuCrearMaestro', 'btnVolverMenuMaterias'
    ];
    backBtns.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => window.dsNavigate && window.dsNavigate('seccionDashboard'));
    });

    // Logout — todos los botones
    ['logoutBtn', 'logoutBtnTop', 'logoutBtnMaestro'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', handleLogout);
    });
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

  // Función helper para obtener el token (siempre desde localStorage como fuente de verdad)
  function getAuthToken() {
    if (authToken) {
      return authToken;
    }
    // Si no hay token en memoria, intentar recuperarlo de localStorage
    const savedToken = localStorage.getItem('asistia_auth_token');
    if (savedToken) {
      authToken = savedToken;
      return authToken;
    }
    return null;
  }

  // Función helper para establecer el token
  function setAuthToken(token) {
    authToken = token;
    if (token) {
      localStorage.setItem('asistia_auth_token', token);
    } else {
      localStorage.removeItem('asistia_auth_token');
    }
  }

  // Variables del QR scanner
  let streamingStream = null;     // MediaStream actual
  let scanning = false;           // Flag principal de escaneo
  let rafId = null;               // requestAnimationFrame id
  const ctx = canvas.getContext('2d');

  // Variables para captura de foto
  let photoStream = null;         // MediaStream para foto
  let capturedPhotoBlob = null;   // Blob de la foto capturada
  let photoCtx = null;            // Contexto del canvas (inicializado después de DOM)

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

  // Función para mostrar un toast/notificación bonita
  function showToast(title, message, isError = false) {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : ''}`;

    const icon = document.createElement('div');
    icon.className = 'toast-icon';
    icon.textContent = isError ? '✕' : '✓';

    const content = document.createElement('div');
    content.className = 'toast-content';

    const titleEl = document.createElement('div');
    titleEl.className = 'toast-title';
    titleEl.textContent = title;

    const messageEl = document.createElement('div');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;

    content.appendChild(titleEl);
    if (message) {
      content.appendChild(messageEl);
    }

    toast.appendChild(icon);
    toast.appendChild(content);

    toastContainer.appendChild(toast);

    // Remover el toast después de 3 segundos
    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
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
          
          // Mostrar mensaje bonito de éxito
          const alumno = response.alumno || {};
          const nombreCompleto = `${alumno.nombre || qrData.nombre || 'Alumno'} ${alumno.apellido || qrData.apellido || ''}`.trim();
          const estado = alumno.estado || 'Registrado';
          const mensaje = response.mensaje || `Asistencia registrada: ${estado}`;
          
          showToast('✓ Escaneo exitoso', `${nombreCompleto} - ${mensaje}`);
        } else {
          // Mostrar mensaje de error si no fue exitoso
          const mensajeError = response.mensaje || 'Error al registrar la asistencia';
          showToast('✕ Error', mensajeError, true);
        }
        // Mostrar en UI
        showResult(qrData, response);
        // Añadir al historial
        addToHistory(qrData, response);
      })
      .catch(err => {
        console.error('Error en petición al backend:', err);
        showResult(qrData, { ok: false, mensaje: 'Error de conexión con el servidor' });
        showToast('✕ Error', 'Error de conexión con el servidor', true);
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
    // Verificar si hay sesión guardada
    const savedToken = localStorage.getItem('asistia_auth_token');
    const savedUser = localStorage.getItem('asistia_user');
    
    if (savedToken && savedUser) {
      try {
        setAuthToken(savedToken);
        currentUser = JSON.parse(savedUser);
        window.currentUser = currentUser;
        isAuthenticated = true;
        return true;
      } catch (error) {
        console.error('Error cargando sesión guardada:', error);
        localStorage.removeItem('asistia_auth_token');
        localStorage.removeItem('asistia_user');
        authToken = null;
        return false;
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

  // Función auxiliar para verificar si el usuario es administrador
  function isAdmin() {
    if (!currentUser || !currentUser.role) return false;
    const role = currentUser.role.toLowerCase();
    return role === 'administrador' || role === 'admin';
  }

  function showMainApp() {
    loginContainer.style.display = 'none';
    mainApp.style.display = 'block';
    isAuthenticated = true;

    // Actualizar topbar con info del usuario
    const nameStr = (currentUser && currentUser.name) || (currentUser && currentUser.username) || 'Usuario';
    const initials = nameStr.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const avatarEl = document.getElementById('dsAvatarInitials');
    const usernameEl = document.getElementById('dsTopbarUsername');
    const welcomeEl = document.getElementById('dashWelcome');
    if (avatarEl) avatarEl.textContent = initials;
    if (usernameEl) usernameEl.textContent = nameStr;
    if (welcomeEl) welcomeEl.textContent = `Bienvenido de nuevo, ${nameStr}`;

    // Fecha actual en topbar
    const dateEl = document.getElementById('dashDateText');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('es-MX', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
    }

    // Mostrar/ocultar elementos admin-only
    const adminEls = document.querySelectorAll('.admin-only');
    adminEls.forEach(el => {
      el.style.display = isAdmin() ? '' : 'none';
    });

    // Navegar al dashboard como pantalla inicial
    dsNavigate('seccionDashboard');
    loadDashboard();
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
        const token = data.data.token;
        const user = data.data.user;
        
        // Establecer token usando la función helper
        setAuthToken(token);
        currentUser = user;
        window.currentUser = currentUser;

        console.log('✅ Usuario autenticado:', currentUser.name, '- Rol:', currentUser.role);

        // Guardar usuario en localStorage
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
    setAuthToken(null);
    localStorage.removeItem('asistia_user');
    isAuthenticated = false;
    currentUser = null;
    window.currentUser = null;
    
    // Mostrar formulario de login
    showLoginForm();
  }

  // ══════════════════════════════════════════════════════════
  //  DASHBOARD — Navegación y carga de datos
  // ══════════════════════════════════════════════════════════

  const ALL_SECTIONS = [
    'seccionDashboard', 'seccionEscanear', 'seccionGenerar',
    'seccionListado', 'seccionAlumnos', 'seccionCrearMaestro',
    'seccionGestionarMaterias', 'menuPrincipal', 'menuMaestro'
  ];

  const SECTION_TITLES = {
    seccionDashboard: 'Dashboard',
    seccionEscanear: 'Escanear QR',
    seccionGenerar: 'Generar QR',
    seccionListado: 'Asistencias Hoy',
    seccionAlumnos: 'Alumnos',
    seccionCrearMaestro: 'Maestros',
    seccionGestionarMaterias: 'Materias'
  };

  // Exponer globalmente para que el HTML inline pueda llamarla
  window.dsNavigate = function dsNavigate(sectionId) {
    // Ocultar todas las secciones de contenido
    ALL_SECTIONS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    // Mostrar la sección solicitada
    const target = document.getElementById(sectionId);
    if (target) {
      target.style.display = '';
      target.classList.remove('ds-fade-in');
      void target.offsetWidth; // reflow
      target.classList.add('ds-fade-in');
    }

    // Actualizar título del topbar
    const pageTitle = document.getElementById('dsPageTitle');
    if (pageTitle) pageTitle.textContent = SECTION_TITLES[sectionId] || 'Asistia';

    // Actualizar estado activo del sidebar
    document.querySelectorAll('.ds-nav-item[data-section]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === sectionId);
    });

    // Cargar datos de la sección si es necesario
    if (sectionId === 'seccionDashboard') loadDashboard();
    if (sectionId === 'seccionListado') loadAttendanceList();
    if (sectionId === 'seccionAlumnos') loadStudentsList();
    if (sectionId === 'seccionCrearMaestro') loadTeachersList();
    if (sectionId === 'seccionGestionarMaterias') { loadSubjectsList(); loadTeachersForSubjects(); }
  };

  // ── Carga de datos del dashboard ──────────────────────────
  async function loadDashboard() {
    try {
      // Cargar stats de asistencia + alumnos totales
      const [statsRes, alumnosRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/stats`),
        fetch(`${BACKEND_URL}/api/alumnos/list`)
      ]);

      // Stats de asistencia
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.ok && statsData.stats) {
          const s = statsData.stats;
          // Total alumnos
          const elTotal = document.getElementById('statTotalAlumnos');
          if (elTotal) { elTotal.textContent = s.total; elTotal.classList.remove('loading'); }
          // Asistencia hoy %
          const elAsis = document.getElementById('statAsistenciaHoy');
          const elAsisTrend = document.getElementById('statAsistenciaDetail');
          if (elAsis) {
            elAsis.textContent = `${s.attendanceRate}%`;
            elAsis.classList.remove('loading');
          }
          if (elAsisTrend) elAsisTrend.textContent = `${s.presente} presente${s.presente !== 1 ? 's' : ''} hoy`;
        }
      }

      // Alumnos recientes (últimos 5)
      if (alumnosRes.ok) {
        const alumnosData = await alumnosRes.json();
        if (alumnosData.ok && alumnosData.alumnos) {
          renderRecentStudents(alumnosData.alumnos.slice(-5).reverse());
        }
      }

      // Si es admin: cargar maestros y materias
      if (isAdmin()) {
        loadDashboardAdminStats();
      }

    } catch (err) {
      console.warn('Error cargando dashboard stats:', err);
      // Mostrar 0 en caso de error de red
      ['statTotalAlumnos','statTotalMaestros','statTotalMaterias','statAsistenciaHoy'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.textContent = '0'; el.classList.remove('loading'); }
      });
      renderRecentStudents([]);
    }
  }

  async function loadDashboardAdminStats() {
    try {
      const token = getAuthToken();
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [teachersRes, subjectsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/teachers/list`, { headers }),
        fetch(`${BACKEND_URL}/api/subjects/list`, { headers })
      ]);

      if (teachersRes.ok) {
        const tData = await teachersRes.json();
        const elT = document.getElementById('statTotalMaestros');
        if (elT && tData.ok) { elT.textContent = (tData.data || []).length; elT.classList.remove('loading'); }
      }
      if (subjectsRes.ok) {
        const sData = await subjectsRes.json();
        const elS = document.getElementById('statTotalMaterias');
        if (elS && sData.ok) { elS.textContent = (sData.data || []).length; elS.classList.remove('loading'); }
      }
    } catch (err) {
      console.warn('Error cargando stats admin:', err);
    }
  }

  function renderRecentStudents(alumnos) {
    const tbody = document.getElementById('dashRecentStudents');
    if (!tbody) return;
    if (!alumnos || alumnos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="ds-table-empty">No hay alumnos registrados aún.</td></tr>';
      return;
    }
    tbody.innerHTML = alumnos.map(a => {
      const initials = `${(a.nombre||'')[0]||'?'}${(a.apellido||'')[0]||''}`.toUpperCase();
      const nombre = `${a.nombre||''} ${a.apellido||''}`.trim();
      const grupo = a.grupo || '—';
      const matricula = a.id || a.matricula || '—';
      // Estado de hoy (del campo estado si existe, o '-')
      const estado = a.estado || null;
      const chipHtml = estado
        ? `<span class="ds-chip ${estado === 'Presente' ? 'present' : estado === 'Tarde' ? 'late' : 'absent'}">${estado}</span>`
        : `<span class="ds-chip enrolled">Inscrito</span>`;
      return `
        <tr>
          <td><div class="student-cell"><div class="ds-mini-avatar">${initials}</div><span class="student-name">${nombre}</span></div></td>
          <td>${grupo}</td>
          <td style="font-family:monospace;font-size:12px;">${matricula}</td>
          <td>${chipHtml}</td>
        </tr>`;
    }).join('');
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
      const token = getAuthToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

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
      photoContainer.style.textAlign = 'center';
      photoContainer.style.marginBottom = '16px';
      
      const photoImg = document.createElement('img');
      photoImg.className = 'result-photo';
      photoImg.style.width = '120px';
      photoImg.style.height = '120px';
      photoImg.style.objectFit = 'cover';
      photoImg.style.borderRadius = '12px';
      photoImg.style.border = '3px solid var(--accent)';
      photoImg.style.boxShadow = '0 4px 12px rgba(14, 165, 164, 0.3)';
      
      // Si la URL ya es completa (Cloudinary), usarla directamente
      // Si es una ruta relativa (local), agregar el prefijo del backend
      const photoUrl = alumno.photoUrl.startsWith('http://') || alumno.photoUrl.startsWith('https://')
        ? alumno.photoUrl
        : `${BACKEND_URL}${alumno.photoUrl}`;
      
      photoImg.src = photoUrl;
      photoImg.alt = `Foto de ${alumno.nombre || ''} ${alumno.apellido || ''}`;
      
      // Manejar errores de carga de imagen
      photoImg.onerror = function() {
        console.warn('No se pudo cargar la imagen:', photoUrl);
        photoContainer.style.display = 'none';
      };
      
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
      // Mostrar aplicación si está autenticado
      showMainApp();
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
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
        // Si la URL ya es completa (Cloudinary), usarla directamente
        // Si es una ruta relativa (local), agregar el prefijo del backend
        const fullPhotoUrl = alumno.photoUrl.startsWith('http://') || alumno.photoUrl.startsWith('https://')
          ? alumno.photoUrl
          : `${BACKEND_URL}${alumno.photoUrl}`;
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
        // Si la URL ya es completa (Cloudinary), usarla directamente
        // Si es una ruta relativa (local), agregar el prefijo del backend
        photoImg.src = alumno.photoUrl.startsWith('http://') || alumno.photoUrl.startsWith('https://')
          ? alumno.photoUrl
          : `${BACKEND_URL}${alumno.photoUrl}`;
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
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
      const token = getAuthToken();
      if (!token) {
        console.error('❌ No hay token disponible');
        throw new Error('No hay token de autenticación');
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${BACKEND_URL}/api/teachers/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(teacherData)
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error de autorización: ${errorData.mensaje || 'Token inválido o sin permisos'}`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.mensaje || `Error HTTP: ${response.status}`;
        throw new Error(errorMessage);
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
      const token = getAuthToken();
      if (!token) {
        console.error('No hay token de autenticación');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${BACKEND_URL}/api/teachers/list`, {
        method: 'GET',
        headers
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error de autorización:', errorData.mensaje || 'Token inválido');
        // No mostrar alerta aquí para evitar múltiples mensajes
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        renderTeachersList(data.data);
      } else {
        console.error('Error obteniendo lista de maestros:', data.mensaje);
        // No mostrar alerta, solo log
      }
    } catch (error) {
      console.error('Error cargando lista de maestros:', error);
      // No mostrar alerta para evitar múltiples mensajes
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
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
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
    const token = getAuthToken();
    if (!token) {
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
      if (error.message && (error.message.includes('401') || error.message.includes('403') || error.message.includes('autorización'))) {
        alert('Error de autorización. Por favor, inicia sesión nuevamente.');
        handleLogout();
      } else {
        const errorMessage = error.message || 'Error de conexión con el servidor';
        alert(errorMessage);
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

    // Detener stream anterior si existe
    if (photoStream) {
      photoStream.getTracks().forEach(track => track.stop());
      photoStream = null;
    }

    // Limpiar foto anterior si existe
    if (capturedPhotoBlob) {
      const capturedPhoto = document.getElementById('capturedPhoto');
      if (capturedPhoto && capturedPhoto.src && capturedPhoto.src.startsWith('blob:')) {
        URL.revokeObjectURL(capturedPhoto.src);
      }
      capturedPhotoBlob = null;
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
      if (!photoVideo) {
        throw new Error('Elemento de video no encontrado');
      }
      
      photoVideo.srcObject = photoStream;
      await photoVideo.play();

      // Asegurar que el video sea visible
      photoVideo.style.display = '';
      
      document.getElementById('startPhotoCamera').disabled = true;
      document.getElementById('capturePhoto').disabled = false;
      document.getElementById('retakePhoto').style.display = 'none';
      document.getElementById('photoPreview').style.display = 'none';
    } catch (err) {
      console.error('Error al acceder a la cámara para foto:', err);
      let errorMessage = 'No se pudo acceder a la cámara para tomar foto.';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración del navegador.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No se encontró ninguna cámara. Por favor, verifica que haya una cámara conectada.';
      }
      alert(errorMessage);
    }
  }

  function stopPhotoCamera() {
    if (photoStream) {
      photoStream.getTracks().forEach(track => track.stop());
      photoStream = null;
    }
    const photoVideo = document.getElementById('photoVideo');
    if (photoVideo) {
      photoVideo.pause();
      photoVideo.srcObject = null;
    }
    
    // Limpiar foto capturada
    if (capturedPhotoBlob) {
      const capturedPhoto = document.getElementById('capturedPhoto');
      if (capturedPhoto && capturedPhoto.src && capturedPhoto.src.startsWith('blob:')) {
        URL.revokeObjectURL(capturedPhoto.src);
      }
      capturedPhotoBlob = null;
    }
    
    const startBtn = document.getElementById('startPhotoCamera');
    const captureBtn = document.getElementById('capturePhoto');
    const retakeBtn = document.getElementById('retakePhoto');
    const preview = document.getElementById('photoPreview');
    
    if (startBtn) startBtn.disabled = false;
    if (captureBtn) captureBtn.disabled = true;
    if (retakeBtn) retakeBtn.style.display = 'none';
    if (preview) preview.style.display = 'none';
    if (photoVideo) photoVideo.style.display = '';
  }

  function capturePhoto() {
    const photoVideo = document.getElementById('photoVideo');
    const photoCanvas = document.getElementById('photoCanvas');
    const capturedPhoto = document.getElementById('capturedPhoto');

    if (!photoVideo || !photoCanvas) {
      console.error('Elementos de cámara no encontrados');
      return;
    }

    // Verificar que el video esté listo
    if (photoVideo.readyState !== photoVideo.HAVE_ENOUGH_DATA) {
      alert('El video aún no está listo. Por favor, espera un momento.');
      return;
    }

    // Inicializar contexto del canvas si no existe
    if (!photoCtx) {
      photoCtx = photoCanvas.getContext('2d');
    }

    // Ajustar canvas al tamaño del video
    photoCanvas.width = photoVideo.videoWidth;
    photoCanvas.height = photoVideo.videoHeight;

    // Dibujar el frame actual en el canvas
    photoCtx.drawImage(photoVideo, 0, 0, photoCanvas.width, photoCanvas.height);

    // Convertir a blob
    photoCanvas.toBlob(blob => {
      if (!blob) {
        alert('Error al capturar la foto. Por favor, intenta de nuevo.');
        return;
      }
      
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
    const capturedPhoto = document.getElementById('capturedPhoto');
    const photoVideo = document.getElementById('photoVideo');
    
    // Limpiar blob anterior
    if (capturedPhotoBlob && capturedPhoto) {
      if (capturedPhoto.src && capturedPhoto.src.startsWith('blob:')) {
        URL.revokeObjectURL(capturedPhoto.src);
      }
      capturedPhotoBlob = null;
    }

    // Mostrar video y ocultar preview
    if (photoVideo) {
      photoVideo.style.display = '';
    }
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('capturePhoto').disabled = false;
    document.getElementById('retakePhoto').style.display = 'none';
  }

  // Función para crear alumno con foto
  async function createStudentWithPhoto(formData) {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      }

      // Crear FormData con los datos del formulario y la foto
      const submitData = new FormData();

      // Agregar campos del formulario
      submitData.append('nombre', formData.get('nombre'));
      submitData.append('apellido', formData.get('apellido'));
      submitData.append('matricula', formData.get('matricula'));
      submitData.append('grupo', formData.get('grupo'));

      // Agregar campos opcionales si existen
      const email = formData.get('email');
      const telefono = formData.get('telefono');
      if (email) {
        submitData.append('email', email);
      }
      if (telefono) {
        submitData.append('telefono', telefono);
      }

      // Agregar foto si existe
      if (capturedPhotoBlob) {
        submitData.append('photo', capturedPhotoBlob, `photo_${Date.now()}.jpg`);
        console.log('✅ Foto agregada al formulario, tamaño:', capturedPhotoBlob.size, 'bytes');
      } else {
        console.log('⚠️ No hay foto para enviar');
      }

      const response = await fetch(`${BACKEND_URL}/api/alumnos/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // NO incluir Content-Type: FormData lo establece automáticamente con el boundary
        },
        body: submitData
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('Error de autorización. Por favor, inicia sesión nuevamente.');
      }

      if (!response.ok) {
        // Intentar obtener el mensaje de error del servidor
        let errorMessage = `Error HTTP: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.mensaje || errorMessage;
        } catch (parseError) {
          // Si no se puede parsear el JSON, usar el mensaje genérico según el código de estado
          if (response.status === 400) {
            errorMessage = 'Error de validación en los datos enviados';
          } else if (response.status >= 500) {
            errorMessage = 'Error interno del servidor. Por favor, intenta más tarde.';
          }
        }
        throw new Error(errorMessage);
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

      // Validar que se haya capturado una foto
      if (!capturedPhotoBlob) {
        const confirmar = confirm('No se ha capturado ninguna foto. ¿Deseas continuar sin foto?');
        if (!confirmar) {
          return;
        }
      }

      // Deshabilitar el botón de envío para evitar doble envío
      const submitBtn = formAlumno.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creando...';

      try {
        const response = await createStudentWithPhoto(formData);

        if (response.ok) {
          alert('Alumno creado exitosamente');
          formAlumno.reset();
          stopPhotoCamera();
          
          // Limpiar la foto capturada
          capturedPhotoBlob = null;
          const photoPreview = document.getElementById('photoPreview');
          if (photoPreview) {
            photoPreview.style.display = 'none';
          }
          const photoVideo = document.getElementById('photoVideo');
          if (photoVideo) {
            photoVideo.style.display = '';
          }

          // Generar QR directamente en el frontend
          // Nota: Solo incluimos datos básicos, NO photoUrl (las URLs son muy largas)
          const alumno = response.alumno;
          const qrData = JSON.stringify({
            id: alumno.id,
            nombre: alumno.nombre,
            apellido: alumno.apellido,
            matricula: alumno.matricula,
            grupo: alumno.grupo
            // No incluimos photoUrl porque hace el QR demasiado grande
            // La foto se puede obtener del servidor usando el ID/matrícula
          });

          // Verificar que QRCode esté disponible
          if (typeof QRCode === 'undefined') {
            console.error('❌ QRCode library no está cargada');
            document.getElementById('mensaje').textContent = '❌ Error: Librería QRCode no disponible.';
            document.getElementById('mensaje').style.color = 'red';
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
          }

          // Generar QR usando qrcodejs (solo almacenamos la foto, el QR se genera dinámicamente)
          try {
            // Crear un contenedor temporal para generar el QR con qrcodejs
            const qrContainer = document.createElement('div');
            qrContainer.style.position = 'absolute';
            qrContainer.style.left = '-9999px';
            qrContainer.style.width = '300px';
            qrContainer.style.height = '300px';
            document.body.appendChild(qrContainer);

            // Limpiar cualquier contenido anterior
            qrContainer.innerHTML = '';

            // Generar QR usando qrcodejs (el constructor crea el QR en el elemento)
            new QRCode(qrContainer, {
              text: qrData,
              width: 300,
              height: 300,
              colorDark: '#000000',
              colorLight: '#FFFFFF',
              correctLevel: QRCode.CorrectLevel.H
            });

            // Esperar un momento para que el QR se genere
            setTimeout(() => {
              // Obtener el canvas generado por qrcodejs
              const canvas = qrContainer.querySelector('canvas');
              if (canvas) {
                // Convertir canvas a data URL para mostrar y descargar
                const qrDataUrl = canvas.toDataURL('image/png');
                
                document.getElementById('qrImagen').src = qrDataUrl;
                document.getElementById('qrImagen').hidden = false;
                document.getElementById('descargarQR').href = qrDataUrl;
                document.getElementById('descargarQR').hidden = false;
                document.getElementById('generarNuevoQR').hidden = false;

                document.getElementById('mensaje').textContent = '✅ QR generado con éxito.';
                document.getElementById('mensaje').style.color = 'green';
              } else {
                throw new Error('No se pudo generar el canvas del QR');
              }

              // Limpiar el contenedor temporal
              document.body.removeChild(qrContainer);
              
              submitBtn.disabled = false;
              submitBtn.textContent = originalText;
            }, 100);
          } catch (error) {
            console.error('Error generando QR:', error);
            document.getElementById('mensaje').textContent = '❌ Error generando QR: ' + (error.message || 'Error desconocido');
            document.getElementById('mensaje').style.color = 'red';
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        } else {
          alert(response.mensaje || 'Error al crear el alumno');
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      } catch (error) {
        console.error('Error:', error);
        
        // Mostrar el mensaje de error del servidor si existe
        // Los errores 400 (validación) tienen mensajes descriptivos del servidor
        // Los errores de conexión mostrarán el mensaje genérico
        let errorMessage = error.message || 'Error desconocido';
        
        // Si el mensaje no parece ser un error de conexión, mostrarlo directamente
        if (!errorMessage.includes('Failed to fetch') && 
            !errorMessage.includes('NetworkError') && 
            !errorMessage.includes('Network request failed')) {
          // Es un error del servidor con mensaje descriptivo
          alert(errorMessage);
        } else {
          // Es un error de conexión real
          alert('Error de conexión con el servidor. Por favor, verifica tu conexión a internet.');
        }
        
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // ===== FUNCIONES PARA GESTIÓN DE MATERIAS =====
  
  // Días de la semana
  const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Lunes' },
    { value: 2, label: 'Martes' },
    { value: 3, label: 'Miércoles' },
    { value: 4, label: 'Jueves' },
    { value: 5, label: 'Viernes' },
    { value: 6, label: 'Sábado' }
  ];

  // Cargar lista de maestros para el select
  async function loadTeachersForSubjects() {
    try {
      const headers = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      } else {
        console.error('No hay token de autenticación');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/teachers/list`, {
        method: 'GET',
        headers
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error de autorización:', errorData.mensaje || 'Token inválido');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        const select = document.getElementById('materiaMaestro');
        if (select) {
          select.innerHTML = '<option value="">Selecciona un maestro</option>';
          
          data.data.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = teacher.name;
            select.appendChild(option);
          });
        }
      }
    } catch (error) {
      console.error('Error cargando maestros:', error);
      // No mostrar alerta para evitar múltiples mensajes
    }
  }

  // Cargar lista de materias
  async function loadSubjectsList() {
    try {
      const headers = {};
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.error('No hay token de autenticación');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/subjects/list`, {
        method: 'GET',
        headers
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error de autorización:', errorData.mensaje || 'Token inválido');
        // No mostrar alerta aquí, solo log
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        renderSubjectsList(data.data);
      } else {
        console.error('Error obteniendo lista de materias:', data.mensaje);
        // No mostrar alerta, solo log
      }
    } catch (error) {
      console.error('Error cargando lista de materias:', error);
      // No mostrar alerta aquí para evitar múltiples mensajes
    }
  }

  // Renderizar lista de materias
  function renderSubjectsList(subjects) {
    const subjectsList = document.getElementById('subjectsList');
    subjectsList.innerHTML = '';

    if (subjects.length === 0) {
      subjectsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No hay materias registradas</p>';
      return;
    }

    subjects.forEach(subject => {
      const subjectCard = document.createElement('div');
      subjectCard.className = 'subject-card';

      const schedulesHtml = subject.schedules && subject.schedules.length > 0
        ? subject.schedules.map(schedule => {
            const day = DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek);
            return `<div class="schedule-item">${day ? day.label : 'N/A'} ${schedule.startTime} - ${schedule.endTime}${schedule.classroom ? ` (${schedule.classroom})` : ''}</div>`;
          }).join('')
        : '<div class="schedule-item">Sin horarios asignados</div>';

      subjectCard.innerHTML = `
        <div class="subject-card-header">
          <h3>${subject.name}</h3>
          ${subject.code ? `<span class="subject-code">${subject.code}</span>` : ''}
        </div>
        <div class="subject-card-body">
          <div class="subject-info">
            <p><strong>Maestro:</strong> ${subject.teacher.name}</p>
            ${subject.description ? `<p><strong>Descripción:</strong> ${subject.description}</p>` : ''}
          </div>
          <div class="subject-schedules">
            <strong>Horarios:</strong>
            ${schedulesHtml}
          </div>
        </div>
        <div class="subject-card-actions">
          <button class="btn btn-small" onclick="editSubject('${subject.id}')">Editar</button>
          <button class="btn btn-small btn-danger" onclick="deleteSubject('${subject.id}')">Eliminar</button>
        </div>
      `;

      subjectsList.appendChild(subjectCard);
    });
  }

  // Agregar horario al formulario
  function addScheduleRow() {
    const container = document.getElementById('horariosContainer');
    const scheduleRow = document.createElement('div');
    scheduleRow.className = 'schedule-row';
    
    scheduleRow.innerHTML = `
      <select class="schedule-day" required>
        <option value="">Día</option>
        ${DAYS_OF_WEEK.map(day => `<option value="${day.value}">${day.label}</option>`).join('')}
      </select>
      <input type="time" class="schedule-start" required placeholder="Inicio">
      <input type="time" class="schedule-end" required placeholder="Fin">
      <input type="text" class="schedule-classroom" placeholder="Aula (opcional)">
      <button type="button" class="btn-remove-schedule" onclick="removeScheduleRow(this)">×</button>
    `;

    container.appendChild(scheduleRow);
  }

  // Eliminar fila de horario
  function removeScheduleRow(button) {
    button.parentElement.remove();
  }

  // Crear o actualizar materia
  async function saveSubject(event) {
    event.preventDefault();

    const token = getAuthToken();
    if (!token) {
      alert('Error de autenticación. Por favor, inicia sesión nuevamente.');
      handleLogout();
      return;
    }

    const form = event.target;
    const formData = new FormData(form);
    const subjectId = document.getElementById('materiaId').value;

    // Recopilar horarios
    const scheduleRows = document.querySelectorAll('.schedule-row');
    const schedules = [];
    
    scheduleRows.forEach(row => {
      const dayOfWeek = parseInt(row.querySelector('.schedule-day').value);
      const startTime = row.querySelector('.schedule-start').value;
      const endTime = row.querySelector('.schedule-end').value;
      const classroom = row.querySelector('.schedule-classroom').value;

      if (dayOfWeek !== undefined && startTime && endTime) {
        schedules.push({
          dayOfWeek,
          startTime,
          endTime,
          classroom: classroom || null
        });
      }
    });

    const subjectData = {
      name: formData.get('name'),
      code: formData.get('code') || null,
      description: formData.get('description') || null,
      teacherId: formData.get('teacherId'),
      schedules: schedules
    };

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const url = subjectId 
        ? `${BACKEND_URL}/api/subjects/${subjectId}`
        : `${BACKEND_URL}/api/subjects/create`;
      
      const method = subjectId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(subjectData)
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        alert('Error de autorización. Por favor, inicia sesión nuevamente.');
        handleLogout();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        alert(subjectId ? 'Materia actualizada exitosamente' : 'Materia creada exitosamente');
        form.reset();
        document.getElementById('horariosContainer').innerHTML = '';
        document.getElementById('materiaId').value = '';
        document.getElementById('formTitle').textContent = 'Crear Nueva Materia';
        document.getElementById('btnCancelarMateria').style.display = 'none';
        loadSubjectsList();
      } else {
        alert(data.mensaje || 'Error al guardar la materia');
      }
    } catch (error) {
      console.error('Error guardando materia:', error);
      alert(error.message || 'Error de conexión con el servidor');
    }
  }

  // Editar materia
  async function editSubject(subjectId) {
    const token = getAuthToken();
    if (!token) {
      alert('Error de autenticación. Por favor, inicia sesión nuevamente.');
      handleLogout();
      return;
    }

    try {
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${BACKEND_URL}/api/subjects/${subjectId}`, {
        method: 'GET',
        headers
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        alert('Error de autorización. Por favor, inicia sesión nuevamente.');
        handleLogout();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        const subject = data.data;
        
        // Llenar formulario
        document.getElementById('materiaId').value = subject.id;
        document.getElementById('materiaNombre').value = subject.name;
        document.getElementById('materiaCodigo').value = subject.code || '';
        document.getElementById('materiaDescripcion').value = subject.description || '';
        document.getElementById('materiaMaestro').value = subject.teacherId;
        
        // Limpiar y agregar horarios
        const container = document.getElementById('horariosContainer');
        container.innerHTML = '';
        
        if (subject.schedules && subject.schedules.length > 0) {
          subject.schedules.forEach(schedule => {
            const scheduleRow = document.createElement('div');
            scheduleRow.className = 'schedule-row';
            
            scheduleRow.innerHTML = `
              <select class="schedule-day" required>
                <option value="">Día</option>
                ${DAYS_OF_WEEK.map(day => 
                  `<option value="${day.value}" ${day.value === schedule.dayOfWeek ? 'selected' : ''}>${day.label}</option>`
                ).join('')}
              </select>
              <input type="time" class="schedule-start" value="${schedule.startTime}" required>
              <input type="time" class="schedule-end" value="${schedule.endTime}" required>
              <input type="text" class="schedule-classroom" value="${schedule.classroom || ''}" placeholder="Aula (opcional)">
              <button type="button" class="btn-remove-schedule" onclick="removeScheduleRow(this)">×</button>
            `;
            
            container.appendChild(scheduleRow);
          });
        }

        document.getElementById('formTitle').textContent = 'Editar Materia';
        document.getElementById('btnCancelarMateria').style.display = 'block';
        
        // Scroll al formulario
        const formContainer = document.querySelector('.subjects-form-container');
        if (formContainer) {
          formContainer.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (error) {
      console.error('Error cargando materia:', error);
      alert(error.message || 'Error al cargar la materia');
    }
  }

  // Eliminar materia
  async function deleteSubject(subjectId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta materia? Esta acción no se puede deshacer.')) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      alert('Error de autenticación. Por favor, inicia sesión nuevamente.');
      handleLogout();
      return;
    }

    try {
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${BACKEND_URL}/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers
      });

      if (response.status === 401 || response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        alert('Error de autorización. Por favor, inicia sesión nuevamente.');
        handleLogout();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.mensaje || `Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        alert('Materia eliminada exitosamente');
        loadSubjectsList();
      } else {
        alert(data.mensaje || 'Error al eliminar la materia');
      }
    } catch (error) {
      console.error('Error eliminando materia:', error);
      alert(error.message || 'Error de conexión con el servidor');
    }
  }

  // Cancelar edición
  function cancelEdit() {
    document.getElementById('formMateria').reset();
    document.getElementById('horariosContainer').innerHTML = '';
    document.getElementById('materiaId').value = '';
    document.getElementById('formTitle').textContent = 'Crear Nueva Materia';
    document.getElementById('btnCancelarMateria').style.display = 'none';
  }

  // Hacer funciones globales
  window.editSubject = editSubject;
  window.deleteSubject = deleteSubject;
  window.removeScheduleRow = removeScheduleRow;

  // Event listeners para materias
  const formMateria = document.getElementById('formMateria');
  if (formMateria) {
    formMateria.addEventListener('submit', saveSubject);
  }

  const btnAgregarHorario = document.getElementById('btnAgregarHorario');
  if (btnAgregarHorario) {
    btnAgregarHorario.addEventListener('click', addScheduleRow);
  }

  const btnCancelarMateria = document.getElementById('btnCancelarMateria');
  if (btnCancelarMateria) {
    btnCancelarMateria.addEventListener('click', cancelEdit);
  }

  // FIN del IIFE
})();
