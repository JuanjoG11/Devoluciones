import { auth } from '../auth.js';

export const renderLogin = (container) => {
    container.innerHTML = `
        <div class="flex items-center justify-center" style="height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 20px;">
            <div class="card glass-card text-center" style="width: 100%; max-width: 400px;">
                <div style="margin-bottom: 32px;">
                    <span class="material-icons-round" style="font-size: 48px; color: var(--accent-color);">local_shipping</span>
                    <h1 style="color: var(--primary-color); margin-top: 16px;">DevolucionesApp</h1>
                    <p>Ingresa para comenzar tu ruta</p>
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
                alert('Credenciales incorrectas');
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Error al intentar iniciar sesión. Revisa tu conexión.");
        }
    });
};
