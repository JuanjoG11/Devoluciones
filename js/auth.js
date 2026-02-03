import { db } from './data.js';
import { Alert } from './utils/ui.js';

export const auth = {
    login: async (username, password) => {
        // Optimized: Fetch only the specific user
        let user = await db.getUserByUsername(username);

        // FALLBACK: If user not found in DB (e.g. seeding failed due to schema)
        // This should only happen during initial setup or database issues
        if (!user) {
            Alert.error("Usuario no encontrado. Por favor, contacta al administrador.");
            return null;
        }

        // Simple plain text password check (legacy)
        if (user && user.password === password) {
            if (user.isActive === false) {
                Alert.error(`Tu cuenta (${username}) ha sido DESACTIVADA por el administrador. No puedes ingresar a la aplicación. Por favor, contacta al administrador para reactivar tu cuenta.`);
                return null;
            }
            // Ensure organization is set
            if (!user.organization) {
                user.organization = db.isTymAccount(user.username) ? 'TYM' : 'TAT';
            } else if (db.isTymAccount(user.username) && user.organization !== 'TYM') {
                user.organization = 'TYM';
            }

            // SECURITY: Don't store password in localStorage
            const { password: _, ...userWithoutPassword } = user;
            localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
            return userWithoutPassword;
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
