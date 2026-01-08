import { db } from './data.js';

export const auth = {
    login: async (username, password) => {
        // Optimized: Fetch only the specific user
        const user = await db.getUserByUsername(username);

        // Simple plain text password check (legacy)
        if (user && user.password === password) {
            if (user.isActive === false) {
                alert("Tu cuenta ha sido desactivada. Por favor, contacta al administrador.");
                return null;
            }
            localStorage.setItem('currentUser', JSON.stringify(user));
            return user;
        }
        return null;
    },

    logout: () => {
        localStorage.removeItem('currentUser');
        window.location.reload();
    },

    getCurrentUser: () => {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },

    requireRole: (role) => {
        const user = auth.getCurrentUser();
        if (!user || user.role !== role) {
            return false;
        }
        return true;
    }
};
