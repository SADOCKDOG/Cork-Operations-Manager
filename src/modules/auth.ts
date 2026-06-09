import { db } from './db';

export interface User {
    id: string;
    nombre: string;
    email: string;
    rol: string;
    loginTime?: string;
}

const ROLES: Record<string, { nombre: string; permisos: string[] }> = {
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
};

class AuthManager {
    private _currentUser: User | null = null;
    private _sessionToken: string | null = null;

    async init() {
        const token = sessionStorage.getItem('auth_token');
        const userData = localStorage.getItem('auth_user_data');

        if (token && userData) {
            try {
                this._sessionToken = token;
                this._currentUser = JSON.parse(userData);
                console.log(`[Auth] Sesión restaurada: ${this._currentUser?.nombre}`);
                return true;
            } catch (error) {
                console.warn('[Auth] Error restaurando sesión:', error);
                await this.logout();
                return false;
            }
        }
        return false;
    }

    async register(nombre: string, email: string, password: string, rol = 'operario') {
        if (!nombre || !email || !password) throw new Error('Datos incompletos');
        const passwordHash = this._hashPassword(password);
        const usuario = {
            id: crypto.randomUUID(),
            nombre,
            email,
            passwordHash,
            rol,
            creadoEn: new Date().toISOString(),
            activo: true,
            ultimoAcceso: null,
            metadata: { intentosFallidos: 0, bloqueado: false }
        };
        await db.add('usuarios', usuario);
        await this._auditLog('USUARIO_CREADO', `Nuevo usuario: ${email}`, null);
        return usuario;
    }

    async login(email: string, password: string) {
        const usuarios = await db.getAll('usuarios') || [];
        const usuario = usuarios.find((u: any) => u.email === email);
        if (!usuario) {
            await this._auditLog('LOGIN_FALLIDO', `Email no encontrado: ${email}`, null);
            throw new Error('Usuario o contraseña incorrectos');
        }
        if (!this._validatePassword(password, usuario.passwordHash)) {
            usuario.metadata.intentosFallidos++;
            if (usuario.metadata.intentosFallidos >= 5) {
                usuario.metadata.bloqueado = true;
                await db.put('usuarios', usuario);
                throw new Error('Usuario bloqueado por seguridad');
            }
            await db.put('usuarios', usuario);
            throw new Error('Usuario o contraseña incorrectos');
        }
        if (usuario.metadata.bloqueado) throw new Error('Usuario bloqueado por seguridad');
        if (!usuario.activo) throw new Error('Usuario inactivo');

        this._sessionToken = this._generateToken();
        this._currentUser = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            loginTime: new Date().toISOString()
        };
        usuario.ultimoAcceso = new Date().toISOString();
        usuario.metadata.intentosFallidos = 0;
        await db.put('usuarios', usuario);
        sessionStorage.setItem('auth_token', this._sessionToken);
        localStorage.setItem('auth_user_data', JSON.stringify(this._currentUser));
        await this._auditLog('LOGIN_EXITOSO', `Usuario: ${email}`, usuario.id);
        return this._currentUser;
    }

    async logout() {
        const email = this._currentUser?.email;
        this._currentUser = null;
        this._sessionToken = null;
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user_data');
        await this._auditLog('LOGOUT', `Usuario: ${email}`, null);
    }

    getCurrentUser() { return this._currentUser; }

    hasPermission(permiso: string) {
        if (!this._currentUser) return false;
        const rolData = ROLES[this._currentUser.rol];
        return rolData?.permisos.includes(permiso) || false;
    }

    isAdmin() { return this._currentUser?.rol === 'admin'; }

    private _hashPassword(password: string) { return btoa(password + 'salt_pesadas_corcho_v5'); }
    private _validatePassword(password: string, hash: string) { return this._hashPassword(password) === hash; }
    private _generateToken() { return Math.random().toString(36).substr(2) + Date.now().toString(36); }

    private async _auditLog(evento: string, descripcion: string, usuarioId: string | null) {
        try {
            const log = {
                timestamp: new Date().toISOString(),
                evento,
                descripcion,
                usuarioId: usuarioId || this._currentUser?.id,
                userAgent: navigator.userAgent
            };
            await db.add('auditlog', log);
        } catch (error) { console.warn('[Auth] Error auditoría:', error); }
    }
}

export const Auth = new AuthManager();
export default Auth;
