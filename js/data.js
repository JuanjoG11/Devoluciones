import { sb } from './supabase.js';

/**
 * Data Initialization
 * Loads initial users and products if the database is empty.
 * Caches products locally for offline search support.
 */
export const initializeData = async () => {
    if (localStorage.getItem('db_initialized')) {
        // Even if initialized, check if we need to sync inventory in the background
        if (navigator.onLine && !localStorage.getItem('inventory')) {
            syncInventory();
        }
        return;
    }

    try {
        // 1. Seed Users if empty
        const { count: userCount } = await sb.from('users').select('*', { count: 'exact', head: true });
        if (userCount === 0) {
            console.log("Seeding initial users...");
            await seedUsers();
        }

        // 2. Seed Products if empty
        const { count: productCount } = await sb.from('products').select('*', { count: 'exact', head: true });
        if (productCount === 0) {
            console.log("Seeding initial products...");
            const { RAW_INVENTORY_PARTS } = await import('./seed_data.js');
            const RAW_INVENTORY = RAW_INVENTORY_PARTS.join('');
            await seedProducts(RAW_INVENTORY);
        }

        // 3. Sync Local Cache for search performance
        if (navigator.onLine) {
            await syncInventory();
        }

        localStorage.setItem('db_initialized', 'true');
    } catch (e) {
        console.error("Error checking DB:", e);
    }
};

const syncInventory = async () => {
    try {
        console.log("Syncing local inventory cache...");
        const { data: allProducts, error } = await sb.from('products').select('code, name, price, search_string');
        if (error) throw error;
        if (allProducts) {
            localStorage.setItem('inventory', JSON.stringify(allProducts));
            console.log("Inventory cache updated.");
        }
    } catch (e) {
        console.error("Error syncing inventory:", e);
    }
};

const seedUsers = async () => {
    const users = [
        { username: 'admin', password: '123', role: 'admin', name: 'Administrador' },
        { username: '1193105349', password: '123', role: 'auxiliar', name: 'MICHAEL CONTRERAS HURTADO' },
        { username: '75071571', password: '123', role: 'auxiliar', name: 'LUIS ALFONSO RIOS GONZALEZ' },
        { username: '1088017580', password: '123', role: 'auxiliar', name: 'JOHN ANDRES CASTILLO GIRALDO' },
        { username: '1089097145', password: '123', role: 'auxiliar', name: 'MANUEL ALEJANDRO RAMIREZ OVALLE' },
        { username: '1088305468', password: '123', role: 'auxiliar', name: 'JULIAN DAVID RODRIGUEZ MONTOYA' },
        { username: '1058842716', password: '123', role: 'auxiliar', name: 'MAIKOL ESTIVEN CARDONA TORO' },
        { username: '1094956074', password: '123', role: 'auxiliar', name: 'YERFREY FLORES ARROYAVE' },
        { username: '18519387', password: '123', role: 'auxiliar', name: 'FIDEL HERNANDO GARCIA CORREA' },
        { username: '10030398', password: '123', role: 'auxiliar', name: 'JOHN RAUL GRAJALES CANO' },
        { username: '1004667097', password: '123', role: 'auxiliar', name: 'JUAN GUILLERMO FERNANDEZ GIRALDO' },
        { username: '18516953', password: '123', role: 'auxiliar', name: 'JOSE ARLEY MARIN HERRERA' },
        { username: '1055831421', password: '123', role: 'auxiliar', name: 'SAMUEL ANDRES ARIAS ARCILA' },
        { username: '1005048479', password: '123', role: 'auxiliar', name: 'NATALY MOLINA BECERRA' },
        { username: '80433929', password: '123', role: 'auxiliar', name: 'LINO LOPEZ SIMONS' },
        { username: '1060506540', password: '123', role: 'auxiliar', name: 'YENIFER ANDREA SOTO GARZON' },
        { username: '1060586518', password: '123', role: 'auxiliar', name: 'NELLY YURANNY SALDARRIAGA CAÑAS' }
    ];
    const { error } = await sb.from('users').insert(users);
    if (error) console.error("Error seeding users:", error);
};

const seedProducts = async (rawInventory) => {
    try {
        const products = parseInventory(rawInventory);
        console.log(`Seeding ${products.length} products...`);
        const chunkSize = 100;
        for (let i = 0; i < products.length; i += chunkSize) {
            const chunk = products.slice(i, i + chunkSize);
            const { error } = await sb.from('products').insert(chunk);
            if (error) console.error(`Error seeding chunk ${i}:`, error);
        }
    } catch (e) {
        console.error("Error processing inventory for seed:", e);
    }
};

const parseInventory = (text) => {
    return text.trim().split('\n').map(line => {
        const parts = line.split(/\t+| {2,}/);
        if (parts.length >= 3) {
            const code = parts[0].trim();
            const name = parts[1].trim();
            let priceStr = parts[2].replace('$', '').replaceAll('.', '').trim();
            let price = 0;
            if (priceStr !== '' && priceStr !== '-') {
                price = parseInt(priceStr);
            }
            return { code, name, price, search_string: `${code} ${name}`.toLowerCase() };
        }
        return null;
    }).filter(item => item !== null);
};

// Helper for broadcasting events
let _broadcastChannel = null;
const broadcastEvent = async (event, payload) => {
    try {
        if (!_broadcastChannel) {
            _broadcastChannel = sb.channel('devolucion-alerts');
            await new Promise((resolve) => {
                _broadcastChannel.subscribe((status) => {
                    if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR') resolve();
                });
            });
        }
        await _broadcastChannel.send({ type: 'broadcast', event, payload });
    } catch (e) {
        console.error("Broadcast failed:", e);
        // Force reset channel for next time if it failed
        if (_broadcastChannel) {
            sb.removeChannel(_broadcastChannel);
            _broadcastChannel = null;
        }
    }
};

/**
 * Data Access Object (DAO)
 */
export const db = {
    sb: sb,

    async getUsers() {
        const { data, error } = await sb.from('users').select('*').order('name', { ascending: true });
        if (error) { console.error(error); return []; }
        return data.map(u => ({ ...u, isActive: u.is_active !== false }));
    },

    async updateUserStatus(userId, isActive) {
        const { error } = await sb.from('users').update({ is_active: isActive }).eq('id', userId);
        return !error;
    },

    async getUserByUsername(username) {
        const { data, error } = await sb.from('users').select('*').eq('username', username).maybeSingle();
        if (error) { console.error(error); return null; }
        return data ? { ...data, isActive: data.is_active !== false } : null;
    },

    async searchProducts(query) {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase();

        if (!navigator.onLine) {
            try {
                const cached = localStorage.getItem('inventory');
                if (!cached) return [];
                const products = JSON.parse(cached);
                return products.filter(p =>
                    p.name.toLowerCase().includes(q) ||
                    p.code.toLowerCase().includes(q)
                ).slice(0, 15);
            } catch (e) { return []; }
        }

        const { data, error } = await sb.from('products')
            .select('*')
            .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
            .limit(15);
        return error ? [] : data;
    },

    async getTodaysRoute(userId) {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await sb.from('routes').select('*').eq('user_id', userId).eq('date', today).maybeSingle();
        return data ? this._mapRoute(data) : null;
    },

    async getRouteReturns(routeId) {
        const { data, error } = await sb.from('return_items').select('*').eq('route_id', routeId);
        if (error) return [];
        return data.map(r => ({
            id: r.id, routeId: r.route_id, invoice: r.invoice, sheet: r.sheet,
            code: r.product_code, name: r.product_name, productName: r.product_name,
            quantity: r.quantity, total: r.total, reason: r.reason,
            evidence: r.evidence, timestamp: r.created_at
        }));
    },

    _mapRoute(r) {
        return {
            id: r.id, userId: r.user_id, username: r.username, userName: r.user_name,
            date: r.date, startTime: r.start_time, endTime: r.end_time, status: r.status
        };
    },

    async getRoutes() {
        // Increased limit to support >50 auxiliaries per day
        const { data, error } = await sb.from('routes').select('*').order('date', { ascending: false }).limit(200);
        return error ? [] : data.map(r => this._mapRoute(r));
    },

    async getDashboardStats(date) {
        const { data, error } = await sb.rpc('get_dashboard_stats', { target_date: date });
        return (data && data.length > 0) ? data[0] : null;
    },

    async getReturns(limit = 50, offset = 0) {
        const { data, error } = await sb.from('return_items').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1);
        if (error) return [];
        return data.map(r => ({
            id: r.id, routeId: r.route_id, invoice: r.invoice, sheet: r.sheet,
            code: r.product_code, name: r.product_name, productName: r.product_name,
            quantity: r.quantity, total: r.total, reason: r.reason,
            evidence: r.evidence, timestamp: r.created_at
        }));
    },

    async addRoute(routeData) {
        const { data, error } = await sb.from('routes').insert([{
            user_id: routeData.userId, username: routeData.username, user_name: routeData.userName,
            start_time: routeData.startTime, date: routeData.date, status: 'active'
        }]).select().single();
        return error ? null : this._mapRoute(data);
    },

    async updateRoute(routeId, updates) {
        const dbUpdates = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.endTime) dbUpdates.end_time = updates.endTime;
        const { error } = await sb.from('routes').update(dbUpdates).eq('id', routeId);

        // Notify Admin if route is completed
        if (!error && updates.status === 'completed') {
            try {
                const { data: route } = await sb.from('routes').select('user_name').eq('id', routeId).single();
                await broadcastEvent('ruta-completada', { userName: route?.user_name || 'Alguien' });
            } catch (e) { console.error("Error sending realtime alert:", e); }
        }
        return !error;
    },

    async uploadPhoto(base64Data) {
        if (!base64Data) return null;
        try {
            const base64Parts = base64Data.split(',');
            const mime = base64Parts[0].match(/:(.*?);/)[1];
            const byteString = atob(base64Parts[1]);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
            const blob = new Blob([ab], { type: mime });
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
            const filePath = `returns/${fileName}`;
            const { error } = await sb.storage.from('evidences').upload(filePath, blob, { contentType: mime });
            if (error) throw error;
            const { data: { publicUrl } } = sb.storage.from('evidences').getPublicUrl(filePath);
            return publicUrl;
        } catch (e) { return null; }
    },

    async _initOfflineDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('AppDevolucionesOffline', 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('pending_returns')) {
                    db.createObjectStore('pending_returns', { keyPath: 'id', autoIncrement: true });
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async saveOfflineReturn(returnData) {
        try {
            const dbRef = await this._initOfflineDB();
            return new Promise((resolve, reject) => {
                const transaction = dbRef.transaction(['pending_returns'], 'readwrite');
                const store = transaction.objectStore('pending_returns');
                const request = store.add(returnData);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(false);
            });
        } catch (e) { return false; }
    },

    async getPendingReturns() {
        try {
            const dbRef = await this._initOfflineDB();
            return new Promise((resolve, reject) => {
                const transaction = dbRef.transaction(['pending_returns'], 'readonly');
                const request = transaction.objectStore('pending_returns').getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject([]);
            });
        } catch (e) { return []; }
    },

    async deletePendingReturn(id) {
        try {
            const dbRef = await this._initOfflineDB();
            return new Promise((resolve) => {
                const transaction = dbRef.transaction(['pending_returns'], 'readwrite');
                const request = transaction.objectStore('pending_returns').delete(id);
                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            });
        } catch (e) { return false; }
    },

    async syncOfflineReturns() {
        const pending = await this.getPendingReturns();
        if (pending.length === 0) return 0;
        let syncedCount = 0;
        for (const item of pending) {
            const tempId = item.id;
            delete item.id;
            const success = await this.addReturn(item, true);
            if (success) {
                await this.deletePendingReturn(tempId);
                syncedCount++;
            }
        }
        return syncedCount;
    },

    async checkDuplicate(invoice, sheet, routeId) {
        if (!invoice && !sheet) return null;
        const { data } = await sb.from('return_items').select('*').eq('route_id', routeId).or(`invoice.eq.${invoice},sheet.eq.${sheet}`).limit(1);
        return (data && data.length > 0) ? data[0] : null;
    },

    async addReturn(returnData, skipOfflineQueue = false) {
        try {
            if (!navigator.onLine && !skipOfflineQueue) return await this.saveOfflineReturn(returnData);
            let evidenceUrl = returnData.evidence;
            if (returnData.evidence && returnData.evidence.startsWith('data:image')) {
                const uploadedUrl = await this.uploadPhoto(returnData.evidence);
                if (uploadedUrl) evidenceUrl = uploadedUrl;
            }
            const { error } = await sb.from('return_items').insert([{
                route_id: returnData.routeId, invoice: returnData.invoice, sheet: returnData.sheet,
                product_code: returnData.productCode, product_name: returnData.productName,
                quantity: returnData.quantity, total: returnData.total, reason: returnData.reason,
                evidence: evidenceUrl
            }]);
            if (error) return skipOfflineQueue ? false : await this.saveOfflineReturn(returnData);

            try {
                await broadcastEvent('nueva-devolucion', { timestamp: new Date().toISOString() });
            } catch (e) { }
            return true;
        } catch (e) {
            return skipOfflineQueue ? false : await this.saveOfflineReturn(returnData);
        }
    },

    async deleteReturn(returnId, isPending = false) {
        try {
            if (isPending) {
                return await this.deletePendingReturn(returnId);
            }
            const { error } = await sb.from('return_items').delete().eq('id', returnId);
            return !error;
        } catch (e) { return false; }
    },

    async resetTestData() {
        try {
            await sb.from('return_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await sb.from('routes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            localStorage.removeItem('activeRoute');
            const dbRef = await this._initOfflineDB();
            const transaction = dbRef.transaction(['pending_returns'], 'readwrite');
            transaction.objectStore('pending_returns').clear();
            return true;
        } catch (e) { return false; }
    }
};
