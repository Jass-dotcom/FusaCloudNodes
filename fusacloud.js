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
