import { db } from './data.js';
import { Alert } from './utils/ui.js';

export const auth = {
    login: async (username, password) => {
        // Optimized: Fetch only the specific user
        let user = await db.getUserByUsername(username);

        // FALLBACK: If user not found in DB (e.g. seeding failed due to schema), use hardcoded values for TYM
        if (!user) {
            if (username === 'admin_tym' && password === '123') {
                user = {
                    id: 'tym-admin-id',
                    username: 'admin_tym',
                    password: '123',
                    role: 'admin',
                    name: 'Administrador TYM',
                    organization: 'TYM',
                    isActive: true
                };
            } else if (username === 'aux_tym_1' && password === '123') {
                user = {
                    id: 'tym-aux-1',
                    username: 'aux_tym_1',
                    password: '123',
                    role: 'auxiliar',
                    name: 'AUXILIAR TYM 1',
                    organization: 'TYM',
                    isActive: true
                };
            }
        }

        // Simple plain text password check (legacy)
        if (user && user.password === password) {
            if (user.isActive === false) {
                Alert.error("Tu cuenta ha sido desactivada. Por favor, contacta al administrador.");
                return null;
            }
            // Ensure organization is set
            if (!user.organization) {
                user.organization = db.isTymAccount(user.username) ? 'TYM' : 'TAT';
            } else if (db.isTymAccount(user.username) && user.organization !== 'TYM') {
                user.organization = 'TYM';
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
