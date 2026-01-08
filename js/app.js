import { initializeData } from './data.js';
import { auth } from './auth.js';
import { renderLogin } from './views/login.js';
import { renderAuxiliarDashboard } from './views/auxiliar.js';
import { renderAdminDashboard } from './views/admin.js';

// Initialize DB
initializeData();

const app = document.getElementById('app');

const router = () => {
    const user = auth.getCurrentUser();

    if (!user) {
        renderLogin(app);
        return;
    }

    if (user.role === 'auxiliar') {
        app.classList.remove('admin-mode');
        renderAuxiliarDashboard(app, user);
    } else if (user.role === 'admin') {
        app.classList.add('admin-mode');
        renderAdminDashboard(app, user);
    }
};

// Global Event Bus for Navigation
window.addEventListener('navigate', () => {
    router();
});

// Initial Load
router();
