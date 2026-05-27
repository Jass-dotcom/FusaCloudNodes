const STORAGE_KEY = 'fusacloudUsuarios';
const CURRENT_USER_KEY = 'fusacloudUsuarioActual';
const ADMIN_AUTH_PIN = '2580';
let selectedLoginRole = 'admin';

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initApp, 1200);
    setupLoginRoleButtons();
    setupSearch();
    setupCategoryInteractivity();
    setupResourceInteractivity();
    initEditor();
});

function initApp() {
    seedUsuarios();
    const usuarioActual = obtenerUsuarioActual();
    if (usuarioActual && validarSesion(usuarioActual)) {
        return;
    }
    mostrarPantalla('login');
}

function mostrarPantalla(nombrePantalla) {
    const pantallas = document.querySelectorAll('.pantalla');
    pantallas.forEach(pantalla => {
        pantalla.classList.remove('activa');
    });

    const pantallaBuscada = document.getElementById('pantalla-' + nombrePantalla);
    if (pantallaBuscada) {
        pantallaBuscada.classList.add('activa');
    }

    window.scrollTo(0, 0);
}

function validarSesion(usuarioId) {
    const usuarios = cargarUsuarios();
    const usuario = usuarios[usuarioId];
    if (!usuario) {
        localStorage.removeItem(CURRENT_USER_KEY);
        showTopBar(false);
        return false;
    }

    showTopBar(true, usuarioId);
    if (usuario.role === 'admin') {
        mostrarPantalla('admin');
        renderUsuariosAdmin();
    } else {
        mostrarPantalla('inicio');
    }

    document.getElementById('login-usuario').value = usuarioId;
    return true;
}

function showTopBar(show, userId = '') {
    const topBar = document.getElementById('top-bar');
    const userLabel = document.getElementById('top-bar-user');
    if (!topBar || !userLabel) return;

    topBar.classList.toggle('hidden', !show);
    userLabel.textContent = show ? `Usuario: ${userId}` : '';
    document.body.classList.toggle('with-top-bar', show);
}

function setupLoginRoleButtons() {
    setRole('admin');
}

function setRole(role) {
    selectedLoginRole = role;
    const adminButton = document.getElementById('rol-admin');
    const studentButton = document.getElementById('rol-student');
    const usuarioInput = document.getElementById('login-usuario');

    adminButton.classList.toggle('active', role === 'admin');
    studentButton.classList.toggle('active', role === 'student');
    usuarioInput.placeholder = role === 'admin' ? 'Usuario administrador' : 'Usuario institucional';
}

function loginUsuario() {
    const idUsuario = document.getElementById('login-usuario').value.trim().toUpperCase();
    const pin = document.getElementById('login-pin').value.trim();

    if (!idUsuario || !pin) {
        alert('Ingresa usuario y PIN.');
        return;
    }

    const usuarios = cargarUsuarios();
    const usuario = usuarios[idUsuario];

    if (!usuario) {
        alert('No existe esa cuenta. Un administrador debe crearla primero.');
        return;
    }

    if (usuario.pin !== pin) {
        alert('PIN incorrecto.');
        return;
    }

    if (selectedLoginRole === 'admin' && usuario.role !== 'admin') {
        alert('Esa cuenta no es de administrador. Cambia el tipo de usuario.');
        return;
    }

    if (selectedLoginRole === 'student' && !(usuario.role === 'student' || usuario.role === 'institutional')) {
        alert('Esa cuenta no es de estudiante institucional. Pide al administrador una cuenta válida.');
        return;
    }

    guardarUsuarioActual(idUsuario);
    showTopBar(true, idUsuario);
    document.getElementById('login-pin').value = '';

    if (usuario.role === 'admin') {
        mostrarPantalla('admin');
        renderUsuariosAdmin();
    } else {
        mostrarPantalla('inicio');
    }
}

function crearCuenta() {
    const role = document.getElementById('new-account-role').value;
    const idUsuario = document.getElementById('new-account-id').value.trim().toUpperCase();
    const pin = document.getElementById('new-account-pin').value.trim();

    if (!idUsuario || pin.length !== 4) {
        alert('Ingresa un usuario válido y un PIN de 4 dígitos.');
        return;
    }

    const usuarios = cargarUsuarios();
    if (usuarios[idUsuario]) {
        alert('Ese usuario ya existe. Elige otro nombre.');
        return;
    }

    if (role === 'admin') {
        const authPin = prompt('Ingresa el PIN de autorización para crear otro administrador.');
        if (authPin !== ADMIN_AUTH_PIN) {
            alert('PIN de autorización incorrecto.');
            return;
        }
    }

    const label = role === 'student'
        ? 'Estudiante'
        : role === 'institutional'
            ? 'Institucional'
            : 'Administrador';

    usuarios[idUsuario] = { pin, role, label };
    guardarUsuarios(usuarios);
    renderUsuariosAdmin();

    document.getElementById('new-account-id').value = '';
    document.getElementById('new-account-pin').value = '';

    alert(`Cuenta creada: ${idUsuario} (${label})`);
}

function normalizeUsuarios(usuarios) {
    let changed = false;

    Object.entries(usuarios).forEach(([id, value]) => {
        if (typeof value === 'string') {
            usuarios[id] = { pin: value, role: 'student', label: 'Estudiante' };
            changed = true;
        } else if (typeof value === 'object' && value !== null) {
            if (!value.role) {
                value.role = 'student';
                value.label = 'Estudiante';
                changed = true;
            }
        }
    });

    if (!usuarios['ADMIN-1']) {
        usuarios['ADMIN-1'] = { pin: '0000', role: 'admin', label: 'Administrador' };
        changed = true;
    }

    if (changed) {
        guardarUsuarios(usuarios);
    }

    return usuarios;
}

function cargarUsuarios() {
    const usuariosJson = localStorage.getItem(STORAGE_KEY);
    const usuarios = usuariosJson ? JSON.parse(usuariosJson) : {};
    return normalizeUsuarios(usuarios);
}

function guardarUsuarios(usuarios) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
}

function guardarUsuarioActual(idUsuario) {
    localStorage.setItem(CURRENT_USER_KEY, idUsuario);
}

function obtenerUsuarioActual() {
    return localStorage.getItem(CURRENT_USER_KEY) || '';
}

function seedUsuarios() {
    normalizeUsuarios(cargarUsuarios());
}

function renderUsuariosAdmin() {
    const usuarios = cargarUsuarios();
    const contenedor = document.getElementById('admin-user-list');
    if (!contenedor) return;

    contenedor.innerHTML = '';
    Object.entries(usuarios).sort().forEach(([id, datos]) => {
        const item = document.createElement('li');
        item.innerText = `${id} — ${datos.label || datos.role}`;
        contenedor.appendChild(item);
    });
}

function cerrarSesion() {
    const confirmar = confirm('¿Cerrar sesión?');
    if (!confirmar) {
        return;
    }

    localStorage.removeItem(CURRENT_USER_KEY);
    showTopBar(false);
    document.getElementById('login-usuario').value = '';
    document.getElementById('login-pin').value = '';
    mostrarPantalla('login');
}

function setupSearch() {
    const botonesBusqueda = document.querySelectorAll('.boton-busqueda');
    botonesBusqueda.forEach(button => {
        button.addEventListener('click', function() {
            const entrada = this.previousElementSibling;
            const consulta = entrada.value;
            if (consulta.trim()) {
                console.log('Buscando: ' + consulta);
                alert('Buscando: ' + consulta);
            }
        });
    });

    const entradasBusqueda = document.querySelectorAll('.entrada-busqueda');
    entradasBusqueda.forEach(entrada => {
        entrada.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const consulta = this.value;
                if (consulta.trim()) {
                    console.log('Buscando: ' + consulta);
                    alert('Buscando: ' + consulta);
                }
            }
        });
    });
}

function setupCategoryInteractivity() {
    const tarjetasCategorias = document.querySelectorAll('.tarjeta-categoria');
    tarjetasCategorias.forEach(tarjeta => {
        if (tarjeta.tagName.toLowerCase() === 'select') {
            return;
        }
        tarjeta.addEventListener('click', function() {
            const texto = this.querySelector('.texto-categoria')?.textContent || this.textContent;
            console.log('Seleccionado: ' + texto);
            alert('Abriendo: ' + texto);
        });
    });
}

function setupResourceInteractivity() {
    const tarjetasRecursos = document.querySelectorAll('.tarjeta-recurso');
    tarjetasRecursos.forEach(tarjeta => {
        tarjeta.addEventListener('click', function() {
            const texto = this.querySelector('.titulo-recurso')?.textContent || this.textContent;
            console.log('Seleccionado: ' + texto);
            alert('Abriendo: ' + texto);
        });
    });
}


function actualizarConfiguracion() {
    const usuarios = cargarUsuarios();
    const usuarioActual = obtenerUsuarioActual();
    
    const totalUsuarios = Object.keys(usuarios).length;
    const usuariosOnline = usuarioActual ? 1 : 0;
    
    const configTotalEl = document.getElementById('config-total-usuarios');
    const configOnlineEl = document.getElementById('config-usuarios-online');
    
    if (configTotalEl) configTotalEl.textContent = totalUsuarios;
    if (configOnlineEl) configOnlineEl.textContent = usuariosOnline;
}

function actualizarAdminResumen() {
    const usuarios = cargarUsuarios();
    const usuarioActual = obtenerUsuarioActual();
    
    const totalUsuarios = Object.keys(usuarios).length;
    const usuariosOnline = usuarioActual ? 1 : 0;
    
    const adminTotalEl = document.getElementById('admin-total-usuarios');
    const adminOnlineEl = document.getElementById('admin-cuentas-en-linea');
    
    if (adminTotalEl) adminTotalEl.textContent = totalUsuarios;
    if (adminOnlineEl) adminOnlineEl.textContent = usuariosOnline;
}

function sincronizarContenidos() {
    alert('📥 Iniciando sincronización de contenidos...\n\nEsto se completará en segundo plano. Próxima sincronización: Mañana 2:00 AM');
}

function guardarCronograma() {
    alert('✅ Cronograma actualizado correctamente.');
}

// Baúl Escolar - Drag & Drop
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.currentTarget;
    dropZone.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.currentTarget;
    dropZone.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const dropZone = event.currentTarget;
    dropZone.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    handleFiles(files);
}

function handleFileSelect(event) {
    const files = event.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    if (files.length === 0) return;
    
    let fileList = '';
    for (let i = 0; i < files.length; i++) {
        fileList += `\n• ${files[i].name} (${(files[i].size / 1024 / 1024).toFixed(2)} MB)`;
    }
    
    alert(`✅ ${files.length} archivo(s) listo(s) para cargar:${fileList}\n\nGenerando enlaces...\n\nEnlaces generados en Archivos Cargados Recientemente.`);
}

// Actualizar pantallas especiales cuando se navega a ellas
const originalMostrarPantalla = mostrarPantalla;
window.mostrarPantalla = function(nombrePantalla) {
    originalMostrarPantalla(nombrePantalla);
    
    if (nombrePantalla === 'configuracion') {
        setTimeout(actualizarConfiguracion, 100);
    }
    if (nombrePantalla === 'admin') {
        setTimeout(actualizarAdminResumen, 100);
    }
};

// -------------------------
// when haces tus momos en vscode: el futuro es hoy oiste viego;
// but te terminan diciendo que no puedes usar librerias externas y tienes que hacer tu propio editor de codigo con un iframe y textarea, y basicamente codepen pero sin nada de lo bueno de codepen, solo el iframe y el textarea, y tienes que hacer todo el css tuyo, y basicamente es un proyecto de 2 semanas pero lo tienes que hacer en 2 dias, y no puedes usar ace editor ni monaco ni nada, solo textarea e iframe, y basicamente es como volver a los 90s pero sin la estetica de los 90s, es decir, con la estetica de los 2000s pero sin las fuentes bonitas ni los colores bonitos ni nada, solo el fondo blanco del textarea y el iframe al lado, y basicamente es como si hubieras hecho un editor de codigo en html puro en 2005, pero lo hiciste hoy en 2024, y te sientes orgulloso porque al menos funciona aunque se vea feo, pero sabes que si hubieras podido usar ace editor o monaco hubieras hecho algo mucho mejor, pero no puedes porque las instrucciones son claras: hazlo con textarea e iframe puro, sin librerias externas, sin frameworks, sin nada, solo HTML, CSS y JS puro, y basicamente es como si hubieras hecho un editor de codigo en html puro en 2005, pero lo hiciste hoy en 2024, y te sientes orgulloso porque al menos funciona aunque se vea feo.
// -------------------------
function initEditor() {
    const htmlEl = document.getElementById('editor-html');
    const cssEl = document.getElementById('editor-css');
    const jsEl = document.getElementById('editor-js');
    const runBtn = document.getElementById('editor-run');

    if (!htmlEl || !cssEl || !jsEl || !runBtn) return;

    const update = debounce(updatePreview, 400);

    htmlEl.addEventListener('input', update);
    cssEl.addEventListener('input', update);
    jsEl.addEventListener('input', update);
    runBtn.addEventListener('click', updatePreview);

   
    const editorSelect = document.getElementById('EditorCodigo');
    if (editorSelect) {
        editorSelect.addEventListener('change', function() {
            mostrarPantalla('editor');
        });
    }
}

function updatePreview() {
    const html = document.getElementById('editor-html')?.value || '';
    const css = document.getElementById('editor-css')?.value || '';
    const js = document.getElementById('editor-js')?.value || '';

    const iframe = document.getElementById('editor-preview');
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const full = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}<script>try{${js}}catch(e){console.error(e);}</script></body></html>`;

    doc.open();
    doc.write(full);
    doc.close();
}

function debounce(fn, wait) {
    let t;
    return function(...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}
