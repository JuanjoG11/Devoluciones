import { auth } from '../auth.js';
import { Alert } from '../utils/ui.js';

export const renderLogin = (container) => {
    container.innerHTML = `
        <div id="pwa-install-banner" style="display:none;"></div>
        <div class="flex items-center justify-center anim-fade-in" style="height: 100vh; background: var(--grad-mesh); padding: 20px; position: relative; overflow: hidden;">
            <div style="position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(247, 148, 29, 0.15) 0%, transparent 70%);"></div>
            <div class="card glass-card text-center" style="width: 100%; max-width: 420px; position: relative; z-index: 10; padding: 48px 32px; border-radius: 32px; border: 1px solid var(--secondary-accent);">
                    <div style="width: 120px; height: 120px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden;">
                        <img src="logo-app.png" alt="Devoluciones App" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <h1 style="color: var(--primary-color); margin-top: 16px; font-size: 32px; letter-spacing: -1.5px; font-weight: 900;">DevolucionesApp</h1>
                    <p style="font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Sistema de Devoluciones Inteligente</p>


                <form id="loginForm">
                    <div class="input-group">
                        <label class="input-label">Identificación</label>
                        <input type="text" id="username" class="input-field" placeholder="Número de Cédula o Usuario" required autofocus />
                    </div>
                    
                    <div id="passwordGroup" class="input-group hidden">
                        <label class="input-label">Contraseña</label>
                        <input type="password" id="password" class="input-field" placeholder="••••" />
                    </div>
                    
                    <div id="loginError" class="hidden" style="color: var(--danger-color); margin-bottom: 16px; font-size: 14px; background: rgba(239, 68, 68, 0.1); padding: 10px; border-radius: 8px; border: 1px solid var(--danger-color);">
                        Error: Credenciales no válidas.
                    </div>

                    <button type="submit" class="btn btn-primary" style="height: 52px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
                        Ingresar al Sistema
                        <span class="material-icons-round">login</span>
                    </button>
                    
                    <div style="margin-top: 32px; font-size: 13px; color: var(--text-light); border-top: 1px solid #e2e8f0; padding-top: 16px;">
                        <p>© 2026 - Logística</p>
                    </div>
                </form>
            </div>
        </div>
    `;

    const usernameInput = document.getElementById('username');
    const passwordGroup = document.getElementById('passwordGroup');
    const passwordInput = document.getElementById('password');

    // Dynamic UI: Show password ONLY for admins (starts with 'admin')
    // Hide for numeric IDs (Auxiliaries)
    usernameInput.addEventListener('input', (e) => {
        const value = e.target.value.trim().toLowerCase();
        // Check if starts with 'admin' to support 'admin', 'admin_tym', etc.
        if (value.startsWith('admin')) {
            passwordGroup.classList.remove('hidden');
            passwordInput.setAttribute('required', 'true');
        } else {
            // Assume Auxiliary (Numeric ID) -> No password needed
            passwordGroup.classList.add('hidden');
            passwordInput.removeAttribute('required');
        }
    });

    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const passwordField = document.getElementById('password');

        // If password field is hidden (Auxiliary), use default '123'
        const password = (!passwordField.parentElement.classList.contains('hidden'))
            ? passwordField.value
            : '123';

        try {
            const user = await auth.login(username, password);
            if (user) {
                // Dispatch navigation event
                const event = new CustomEvent('navigate', { detail: { view: 'dashboard' } });
                window.dispatchEvent(event);
            } else {
                Alert.error('Credenciales incorrectas');
            }
        } catch (error) {
            console.error("Login error:", error);
            Alert.error("Error al intentar iniciar sesión. Revisa tu conexión.");
        }
    });

    // Add a simple "Restore/Refresh" button for troubleshooting (Sencillo way)
    const footerDiv = container.querySelector('form + div') || form.parentElement;
    const restoreBtn = document.createElement('button');
    restoreBtn.type = 'button';
    restoreBtn.innerHTML = '<span class="material-icons-round" style="font-size: 16px;">refresh</span> FORZAR ACTUALIZACIÓN (SI NO VES LOS CAMBIOS)';
    restoreBtn.style = 'background: none; border: 1px solid #ddd; color: #999; font-size: 10px; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin-top: 20px; display: inline-flex; align-items: center; gap: 4px; font-weight: 700;';
    restoreBtn.onclick = async () => {
        const confirmed = await Alert.confirm("¿Quieres actualizar la aplicación para descargar los nuevos cambios? (Tus datos y sesión se mantendrán)", "Actualizar Aplicación");
        if (confirmed) {
            try {
                // 1. Unregister all service workers (to force fetch new ones)
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) {
                        await registration.unregister();
                    }
                }

                // 2. Clear only asset caches, NOT user data
                if ('caches' in window) {
                    const keys = await caches.keys();
                    for (let key of keys) {
                        await caches.delete(key);
                    }
                }

                // 3. Clear only technical localStorage, PRESERVE session
                const user = localStorage.getItem('currentUser');
                localStorage.clear();
                if (user) localStorage.setItem('currentUser', user);

                // 4. Force reload
                window.location.reload(true);
            } catch (e) {
                window.location.reload(true);
            }
        }
    };
    form.appendChild(restoreBtn);

    // Try showing PWA banner
    if (window.showPwaBanner) {
        window.showPwaBanner();
        window.addEventListener('pwa-installable', () => window.showPwaBanner());
    }
};
