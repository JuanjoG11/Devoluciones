import { auth } from '../auth.js';
import { Alert } from '../utils/ui.js';

export const renderLogin = (container) => {
    container.innerHTML = `
        <div class="flex items-center justify-center anim-fade-in" style="height: 100vh; background: var(--grad-mesh); padding: 20px; position: relative; overflow: hidden;">
            <div style="position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(247, 148, 29, 0.15) 0%, transparent 70%);"></div>
            <div class="card glass-card text-center" style="width: 100%; max-width: 420px; position: relative; z-index: 10; padding: 48px 32px; border-radius: 32px; border: 1px solid var(--secondary-accent);">
                <div style="margin-bottom: 40px;">
                    <div style="width: 90px; height: 90px; background: white; border-radius: 30px; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; box-shadow: 0 15px 35px var(--secondary-glow); border: 2px solid var(--secondary-accent);">
                        <span class="material-icons-round" style="font-size: 52px; color: var(--primary-color);">local_shipping</span>
                    </div>
                    <h1 style="color: var(--primary-color); margin-top: 16px; font-size: 32px; letter-spacing: -1.5px; font-weight: 900;">TIENDAS & MARCAS</h1>
                    <p style="font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Sistema de Devoluciones Inteligente</p>
                </div>

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
                        <p>© 2026 TAT DISTRIBUCIONES - Logística</p>
                    </div>
                </form>
            </div>
        </div>
    `;

    const usernameInput = document.getElementById('username');
    const passwordGroup = document.getElementById('passwordGroup');
    const passwordInput = document.getElementById('password');

    // Dynamic UI for Admin
    usernameInput.addEventListener('input', (e) => {
        if (e.target.value.toLowerCase() === 'admin') {
            passwordGroup.classList.remove('hidden');
            passwordInput.setAttribute('required', 'true');
        } else {
            passwordGroup.classList.add('hidden');
            passwordInput.removeAttribute('required');
        }
    });

    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const passwordField = document.getElementById('password');
        // If password field is hidden (for auxiliar), use default '123'
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
};
