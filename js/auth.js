/**
 * Auth.js - Sistema de Autenticación Multi-Usuario (v5.9.3)
 * Gestión de usuarios, roles y permisos con auditoría
 */

const Auth = {
    _currentUser: null,
    _sessionToken: null,

    /**
     * Roles disponibles con permisos
     */
    _roles: {
        'admin': {
            nombre: 'Administrador',
            permisos: ['crear_finca', 'editar_finca', 'eliminar_finca', 'crear_pesada', 'editar_pesada', 'eliminar_pesada', 'crear_usuario', 'editar_usuario', 'eliminar_usuario', 'ver_reportes', 'exportar_datos', 'ver_auditoria']
        },
        'gerente': {
            nombre: 'Gerente',
            permisos: ['crear_pesada', 'editar_pesada', 'eliminar_pesada', 'crear_zona', 'editar_zona', 'ver_reportes', 'exportar_datos']
        },
        'operario': {
            nombre: 'Operario',
            permisos: ['crear_pesada', 'editar_pesada_propia', 'ver_reportes_limitados']
        },
        'lector': {
            nombre: 'Lector',
            permisos: ['ver_reportes_limitados']
        }
    },

    /**
     * Inicializar autenticación (cargar usuario de sesión)
     */
    async init() {
        const token = sessionStorage.getItem('auth_token');
        const userData = localStorage.getItem('auth_user_data');

        if (token && userData) {
            try {
                this._sessionToken = token;
                this._currentUser = JSON.parse(userData);
                console.log(`[Auth] Sesión restaurada: ${this._currentUser.nombre}`);
                return true;
            } catch (error) {
                console.warn('[Auth] Error restaurando sesión:', error);
                await this.logout();
                return false;
            }
        }
        return false;
    },

    /**
     * Registrar nuevo usuario
     */
    async register(nombre, email, password, rol = 'operario') {
        try {
            if (!nombre || !email || !password) {
                throw new Error('Datos incompletos');
            }

            // Crear hash simple (en producción usar bcrypt)
            const passwordHash = this._hashPassword(password);

            const usuario = {
                id: Date.now().toString(),
                nombre,
                email,
                passwordHash,
                rol,
                creadoEn: new Date().toISOString(),
                activo: true,
                ultimoAcceso: null,
                metadata: {
                    intentosFallidos: 0,
                    bloqueado: false
                }
            };

            // Guardar en IndexedDB (usuario database)
            await db.add('usuarios', usuario);

            // Registrar en auditoría
            await this._auditLog('USUARIO_CREADO', `Nuevo usuario: ${email}`, null);

            console.log('[Auth] ✅ Usuario registrado:', email);
            return usuario;
        } catch (error) {
            console.error('[Auth] Error en registro:', error);
            throw error;
        }
    },

    /**
     * Iniciar sesión
     */
    async login(email, password) {
        try {
            // Buscar usuario
            const usuarios = await db.getAll('usuarios') || [];
            const usuario = usuarios.find(u => u.email === email);

            if (!usuario) {
                await this._auditLog('LOGIN_FALLIDO', `Email no encontrado: ${email}`, null);
                throw new Error('Usuario o contraseña incorrectos');
            }

            // Validar contraseña
            if (!this._validatePassword(password, usuario.passwordHash)) {
                usuario.metadata.intentosFallidos++;
                if (usuario.metadata.intentosFallidos >= 5) {
                    usuario.metadata.bloqueado = true;
                    await db.put('usuarios', usuario);
                    await this._auditLog('USUARIO_BLOQUEADO', `Demasiados intentos fallidos: ${email}`, null);
                    throw new Error('Usuario bloqueado por seguridad');
                }
                await db.put('usuarios', usuario);
                await this._auditLog('LOGIN_FALLIDO', `Contraseña incorrecta: ${email}`, null);
                throw new Error('Usuario o contraseña incorrectos');
            }

            if (usuario.metadata.bloqueado) {
                throw new Error('Usuario bloqueado por seguridad');
            }

            if (!usuario.activo) {
                throw new Error('Usuario inactivo');
            }

            // Generar token de sesión
            this._sessionToken = this._generateToken();
            this._currentUser = {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                loginTime: new Date().toISOString()
            };

            // Actualizar último acceso
            usuario.ultimoAcceso = new Date().toISOString();
            usuario.metadata.intentosFallidos = 0;
            await db.put('usuarios', usuario);

            // Guardar en almacenamiento
            sessionStorage.setItem('auth_token', this._sessionToken);
            localStorage.setItem('auth_user_data', JSON.stringify(this._currentUser));

            await this._auditLog('LOGIN_EXITOSO', `Usuario: ${email}`, usuario.id);

            console.log('[Auth] ✅ Sesión iniciada:', email);
            return this._currentUser;
        } catch (error) {
            console.error('[Auth] Error en login:', error);
            throw error;
        }
    },

    /**
     * Cerrar sesión
     */
    async logout() {
        const email = this._currentUser?.email;

        this._currentUser = null;
        this._sessionToken = null;

        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user_data');

        await this._auditLog('LOGOUT', `Usuario: ${email}`, null);

        console.log('[Auth] Sesión cerrada:', email);
    },

    /**
     * Obtener usuario actual
     */
    getCurrentUser() {
        return this._currentUser;
    },

    /**
     * Verificar permiso
     */
    hasPermission(permiso) {
        if (!this._currentUser) return false;

        const rolData = this._roles[this._currentUser.rol];
        if (!rolData) return false;

        return rolData.permisos.includes(permiso);
    },

    /**
     * Verificar si es admin
     */
    isAdmin() {
        return this._currentUser?.rol === 'admin';
    },

    /**
     * Cambiar contraseña
     */
    async changePassword(emailUsuario, passwordAntigua, passwordNueva) {
        try {
            const usuario = await db.getAll('usuarios').then(u => u.find(x => x.email === emailUsuario));

            if (!usuario) {
                throw new Error('Usuario no encontrado');
            }

            if (!this._validatePassword(passwordAntigua, usuario.passwordHash)) {
                throw new Error('Contraseña antigua incorrecta');
            }

            usuario.passwordHash = this._hashPassword(passwordNueva);
            await db.put('usuarios', usuario);

            await this._auditLog('PASSWORD_CHANGED', `Usuario: ${emailUsuario}`, usuario.id);

            console.log('[Auth] Contraseña cambiada para:', emailUsuario);
            return true;
        } catch (error) {
            console.error('[Auth] Error cambiando contraseña:', error);
            throw error;
        }
    },

    /**
     * Cambiar rol de usuario (solo admin)
     */
    async changeUserRole(usuarioId, nuevoRol) {
        if (!this.isAdmin()) {
            throw new Error('Solo administradores pueden cambiar roles');
        }

        try {
            const usuario = await db.get('usuarios', usuarioId);
            if (!usuario) throw new Error('Usuario no encontrado');

            const rolAnterior = usuario.rol;
            usuario.rol = nuevoRol;

            await db.put('usuarios', usuario);
            await this._auditLog('ROL_CAMBIADO', `${usuario.email}: ${rolAnterior} → ${nuevoRol}`, usuario.id);

            return usuario;
        } catch (error) {
            console.error('[Auth] Error cambiando rol:', error);
            throw error;
        }
    },

    /**
     * Listar usuarios (solo admin)
     */
    async listUsers() {
        if (!this.isAdmin()) {
            throw new Error('Permiso denegado');
        }

        try {
            const usuarios = await db.getAll('usuarios') || [];
            return usuarios.map(u => ({
                id: u.id,
                nombre: u.nombre,
                email: u.email,
                rol: u.rol,
                activo: u.activo,
                ultimoAcceso: u.ultimoAcceso,
                creadoEn: u.creadoEn
            }));
        } catch (error) {
            console.error('[Auth] Error listando usuarios:', error);
            throw error;
        }
    },

    /**
     * Obtener auditoría (solo admin)
     */
    async getAuditLog(limite = 100) {
        if (!this.isAdmin()) {
            throw new Error('Permiso denegado');
        }

        try {
            const logs = await db.getAll('auditlog') || [];
            return logs.slice(-limite).reverse();
        } catch (error) {
            console.error('[Auth] Error obteniendo auditoría:', error);
            return [];
        }
    },

    /**
     * Registrar en auditoría (privado)
     */
    async _auditLog(evento, descripcion, usuarioId) {
        try {
            const log = {
                timestamp: new Date().toISOString(),
                evento,
                descripcion,
                usuarioId: usuarioId || this._currentUser?.id,
                ipAddress: await this._getClientIp(),
                userAgent: navigator.userAgent
            };

            await db.add('auditlog', log);
        } catch (error) {
            console.warn('[Auth] Error registrando auditoría:', error);
        }
    },

    /**
     * Hash simple de contraseña (usar bcrypt en producción)
     */
    _hashPassword(password) {
        // NOTA: En producción usar biblioteca como bcryptjs
        return btoa(password + 'salt_pesadas_corcho_v5');
    },

    /**
     * Validar contraseña
     */
    _validatePassword(password, hash) {
        return this._hashPassword(password) === hash;
    },

    /**
     * Generar token de sesión
     */
    _generateToken() {
        return Math.random().toString(36).substr(2) + Date.now().toString(36);
    },

    /**
     * Obtener IP del cliente (simulada)
     */
    async _getClientIp() {
        // En app web no es posible obtener IP real sin backend
        return 'local';
    },

    /**
     * Verificar sesión válida
     */
    isAuthenticated() {
        return this._currentUser && this._sessionToken;
    }
};

window.Auth = Auth;
