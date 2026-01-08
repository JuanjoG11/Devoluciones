import { db } from './data.js';

export const auth = {
    login: (username, password) => {
        const users = db.getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
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
        if (!user) return false;
        if (role && user.role !== role) return false;
        return true;
    }
};
