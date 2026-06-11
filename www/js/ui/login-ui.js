import { Auth } from '../auth.js';
import { Utils } from '../core/utils.js';

export const LoginUI = {
    initLogin() {
        const btnLogin = document.getElementById('btn-google-login');
        if (btnLogin) {
            btnLogin.addEventListener('click', async () => {
                try {
                    btnLogin.disabled = true;
                    btnLogin.innerHTML = 'Conectando con Google...';
                    
                    const user = await Auth.signInWithGoogle();
                    
                    Utils.toast(`Bienvenido, ${user.nombre}`);
                    LoginUI.hideLoginShowApp();
                    
                    // Dispatch event so app can re-render if needed
                    window.dispatchEvent(new CustomEvent('auth_changed'));
                } catch (error) {
                    console.error('Error en Login UI:', error);
                    Utils.toastError(error.message || 'Error al iniciar sesión');
                    btnLogin.disabled = false;
                    btnLogin.innerHTML = 'Ingresar con Google';
                }
            });
        }
    },

    showLoginHideApp() {
        document.getElementById('login-container').style.display = 'block';
        document.getElementById('app-content').style.display = 'none';
        
        // Hide navigation if it exists
        const nav = document.querySelector('.bottom-nav');
        if (nav) nav.style.display = 'none';
        
        // Hide header elements
        const headerInfo = document.getElementById('finca-header-info');
        if (headerInfo) headerInfo.style.display = 'none';
    },

    hideLoginShowApp() {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-content').style.display = 'block';
        
        const nav = document.querySelector('.bottom-nav');
        if (nav) nav.style.display = ''; // Vacío para que herede 'grid' del CSS
        
        const headerInfo = document.getElementById('finca-header-info');
        if (headerInfo) headerInfo.style.display = 'flex';
    }
};
