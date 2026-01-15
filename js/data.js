import { sb } from './supabase.js';
import { TYM_PRODUCTS_LIST } from './data/tym_products.js';

/**
 * Data Initialization
 * Loads initial users and products if the database is empty.
 * Caches products locally for offline search support.
 */
export const initializeData = async () => {
    try {
        // 1. Always Sync Users (to ensure new ones are added)
        console.log("Syncing users...");
        await seedUsers();

        if (localStorage.getItem('db_initialized')) {
            // Even if initialized, check if we need to sync inventory in the background
            if (navigator.onLine && !localStorage.getItem('inventory')) {
                syncInventory();
            }
            return;
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

const TYM_AUX_LIST = [
    { username: '1002730727', name: 'JHON WILSON GIRALDO CARVAJAL' },
    { username: '1076350176', name: 'DANIELA CASTIBLANCO RAMIREZ' },
    { username: '9976558', name: 'EDWIN FELIPE RINCON RAMIREZ' },
    { username: '1087990176', name: 'ESTIVEN GUTIERREZ SALAZAR' },
    { username: '10138323', name: 'ROVINSON TORRES RIVERA' },
    { username: '9910933', name: 'ARBEY DE JESUS LARGO LARGO' },
    { username: '1060652216', name: 'CRISTIAN CAMILO OSPINA PARRA' },
    { username: '1058821245', name: 'VICTOR ALFONSO PULGARIN MEJIA' },
    { username: '1112227774', name: 'CHRISTIAN DAVID CAICEDO MONTAÑO' },
    { username: '1112226698', name: 'JOSE ALEXANDER CONSTAIN PERLAZA' },
    { username: '18524020', name: 'EDWIN MAURICIO GOMEZ GALINDO' },
    { username: '1053866136', name: 'ADRIAN FELIPE MARTINEZ ORTEGON' },
    { username: '1088253407', name: 'CARLOS ANDRES PINEDA CANO' },
    { username: '1004520985', name: 'FEDERICO MOLANO ZAPATA' },
    { username: '1112778308', name: 'LUIS CARLOS CADAVID RESTREPO' },
    { username: '1089933391', name: 'BRAHIAN STIVEN VALENCIA IGLESIAS' },
    { username: '1088249115', name: 'JOHN EDWAR ZAPATA ACEVEDO' },
    { username: '1004671619', name: 'BRANDON STEVEN GIL BAEZ' },
    { username: '1004778577', name: 'JUAN MANUEL DELGADO NARVAEZ' },
    { username: '1116818471', name: 'GABRIEL ALEJANDRO GAMEZ VALERO' },
    { username: '1007783801', name: 'YEISON DAVID RENDON SOTO' },
    { username: '1088334475', name: 'SEBASTIAN VILLADA VELASQUEZ' },
    { username: '1127384755', name: 'CAMILO ANDRES CONTRERAS RIVAS' },
    { username: '1114151107', name: 'ANDRES FELIPE VILLA OSORIO' },
    { username: '1087995995', name: 'JHONATAN RENDON RINCON' },
    { username: '1089602261', name: 'JUAN JOSE NOREÑA OSORIO' },
    { username: '18494949', name: 'NELSON ZULUAGA ACEVEDO' },
    { username: '18519474', name: 'OSCAR MAURICIO RESTREPO MORENO' },
    { username: '18517128', name: 'JHON FREDY MORENO' },
    { username: '1088331177', name: 'MICHAEL STEVEN HENAO RODRIGUEZ' },
    { username: '1002718622', name: 'JUAN CAMILO COCOMA OROZCO' },
    { username: '10033035', name: 'CESAR AUGUSTO CASTILLO LONDOÑO' },
    { username: '1112776419', name: 'JAMMES ALBERTO RAMIREZ NIETO' },
    { username: '1098724347', name: 'SEBASTIAN SALAZAR HENAO' },
    { username: '1088037094', name: 'DANIEL FELIPE MURILLO GRANDA' },
    { username: '1128904709', name: 'BRAHIAN ECHEVERRY ALVAREZ' },
    { username: '1088348091', name: 'JEISON STIVEN LAVADO MARIN' },
    { username: '1089601941', name: 'FELIPE MONTES RIVERA' },
    { username: '1010159801', name: 'BRANDON ESTIVEN TORO GALVIS' }
].map(u => ({ ...u, password: '123', role: 'auxiliar', organization: 'TYM' }));

const seedUsers = async () => {
    const users = [
        // TAT ADMIN & UTILS
        { username: 'admin', password: '123', role: 'admin', name: 'Administrador TAT', organization: 'TAT' },

        // TYM ADMIN
        { username: 'admin_tym', password: '123', role: 'admin', name: 'Administrador TYM', organization: 'TYM' },

        // TAT AUXILIARIES
        { username: '1193105349', password: '123', role: 'auxiliar', name: 'MICHAEL CONTRERAS HURTADO', organization: 'TAT' },
        { username: '75071571', password: '123', role: 'auxiliar', name: 'LUIS ALFONSO RIOS GONZALEZ', organization: 'TAT' },
        { username: '1088017580', password: '123', role: 'auxiliar', name: 'JOHN ANDRES CASTILLO GIRALDO', organization: 'TAT' },
        { username: '1089097145', password: '123', role: 'auxiliar', name: 'MANUEL ALEJANDRO RAMIREZ OVALLE', organization: 'TAT' },
        { username: '1088305468', password: '123', role: 'auxiliar', name: 'JULIAN DAVID RODRIGUEZ MONTOYA', organization: 'TAT' },
        { username: '1058842716', password: '123', role: 'auxiliar', name: 'MAIKOL ESTIVEN CARDONA TORO', organization: 'TAT' },
        { username: '1094956074', password: '123', role: 'auxiliar', name: 'YERFREY FLORES ARROYAVE', organization: 'TAT' },
        { username: '18519387', password: '123', role: 'auxiliar', name: 'FIDEL HERNANDO GARCIA CORREA', organization: 'TAT' },
        { username: '10030398', password: '123', role: 'auxiliar', name: 'JOHN RAUL GRAJALES CANO', organization: 'TAT' },
        { username: '1004667097', password: '123', role: 'auxiliar', name: 'JUAN GUILLERMO FERNANDEZ GIRALDO', organization: 'TAT' },
        { username: '18516953', password: '123', role: 'auxiliar', name: 'JOSE ARLEY MARIN HERRERA', organization: 'TAT' },
        { username: '1055831421', password: '123', role: 'auxiliar', name: 'SAMUEL ANDRES ARIAS ARCILA', organization: 'TAT' },
        { username: '1005048479', password: '123', role: 'auxiliar', name: 'NATALY MOLINA BECERRA', organization: 'TAT' },
        { username: '80433929', password: '123', role: 'auxiliar', name: 'LINO LOPEZ SIMONS', organization: 'TAT' },
        { username: '1060506540', password: '123', role: 'auxiliar', name: 'YENIFER ANDREA SOTO GARZON', organization: 'TAT' },
        { username: '1060586518', password: '123', role: 'auxiliar', name: 'NELLY YURANNY SALDARRIAGA CAÑAS', organization: 'TAT' },
        // '1076350176' MOVED TO TYM
        { username: '1078456086', password: '123', role: 'auxiliar', name: 'NELWIS DEYVER CORDOBA MOSQUERA', organization: 'TAT' },
        { username: '1085717552', password: '123', role: 'auxiliar', name: 'DANIEL ANDRES OLAYA PEREZ', organization: 'TAT' },

        // TYM AUXILIARIES (Added via TYM_AUX_LIST)
        ...TYM_AUX_LIST
    ];
    // Use upsert to insert or update existing users
    // Silently try to seed. If it fails (e.g. schema missing 'organization'), we ignore it
    // because we have fallbacks in the getters.
    try {
        await sb.from('users').upsert(users, { onConflict: 'username' });
    } catch (e) {
        console.warn("Seeding partial/failed (expected if schema is locked):", e.message);
    }
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
const broadcastEvent = async (event, payload, organization = null) => {
    try {
        if (!_broadcastChannel) {
            _broadcastChannel = sb.channel('devolucion-alerts');
            await new Promise((resolve) => {
                _broadcastChannel.subscribe((status) => {
                    if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR') resolve();
                });
            });
        }
        await _broadcastChannel.send({ type: 'broadcast', event, payload: { ...payload, organization } });
    } catch (e) {
        console.error("Broadcast failed:", e);
        // Force reset channel for next time if it failed
        if (_broadcastChannel) {
            sb.removeChannel(_broadcastChannel);
            _broadcastChannel = null;
        }
    }
};

// Fallback ID cache
let _cachedFallbackUserId = null;

/**
 * Data Access Object (DAO)
 */
export const db = {
    sb: sb,

    async getFallbackUserId() {
        if (_cachedFallbackUserId) return _cachedFallbackUserId;
        try {
            // Target 'admin' specifically as a reliable existing user
            const { data } = await sb.from('users').select('id').eq('username', 'admin').maybeSingle();
            if (data) _cachedFallbackUserId = data.id;
            else {
                // Try any user if admin not found
                const { data: anyUser } = await sb.from('users').select('id').limit(1).maybeSingle();
                if (anyUser) _cachedFallbackUserId = anyUser.id;
            }
        } catch (e) { console.error("Error fetching fallback ID", e); }
        return _cachedFallbackUserId;
    },

    async getUsers(organization = null) {
        let dbUsers = [];
        try {
            const { data, error } = await sb.from('users').select('*').order('name', { ascending: true });
            if (!error && data) dbUsers = data;
        } catch (e) { console.error("Error fetching users:", e); }

        if (organization === 'TYM') {
            const mergedMap = new Map();

            // 1. Add all static users first (Default Active)
            TYM_AUX_LIST.forEach(staticUser => {
                mergedMap.set(String(staticUser.username), {
                    ...staticUser,
                    id: staticUser.username, // UI uses Cedula as ID
                    isActive: true, // Default
                    organization: 'TYM'
                });
            });

            // 2. Overlay DB users (to get updated isActive status)
            dbUsers.forEach(dbUser => {
                const cleanUsername = String(dbUser.username).trim();
                if (mergedMap.has(cleanUsername)) {
                    // Update the existing static entry with DB state
                    const existing = mergedMap.get(cleanUsername);
                    mergedMap.set(cleanUsername, {
                        ...existing,
                        isActive: dbUser.is_active !== false, // Respect DB status
                    });
                }
            });

            return Array.from(mergedMap.values());
        }

        // Standard TAT Logic (DB Only)
        let finalUsers = dbUsers;
        try {
            // Fetch Global Users (TAT + others in DB)
            const { data, error } = await sb.from('users').select('*').order('name', { ascending: true });

            if (!error && data) {
                // Pre-calculate known TYM usernames for identification
                const tymUsernames = new Set(TYM_AUX_LIST.map(u => String(u.username).trim()));

                finalUsers = data.map(u => {
                    const cleanUsername = String(u.username).trim();
                    let org = u.organization;

                    // FORCE TYM organization if user is in the known TYM list, 
                    // regardless of what the DB says (fixes "leaked" users in TAT view)
                    if (tymUsernames.has(cleanUsername)) {
                        org = 'TYM';
                    } else if (!org) {
                        org = 'TAT'; // Default to TAT only if not identified as TYM
                    }

                    return {
                        ...u,
                        isActive: u.is_active !== false,
                        organization: org
                    };
                });
            }
        } catch (e) {
            console.error("Error fetching users:", e);
        }

        // Filter for TAT (or others if schema supported it)
        if (organization) {
            finalUsers = finalUsers.filter(u => u.organization === organization);
        }

        return finalUsers;
    },

    async updateUserStatus(userId, isActive) {
        // Check if it's a static user ID (Cedula/Numeric)
        const isStaticUser = /^\d+$/.test(String(userId));

        if (isStaticUser) {
            // Find in DB by username (Cedula)
            const { data: existing } = await sb.from('users').select('id').eq('username', userId).maybeSingle();

            if (existing) {
                const { error } = await sb.from('users').update({ is_active: isActive }).eq('id', existing.id);
                return !error;
            } else {
                // Not in DB yet, create it
                const staticUser = TYM_AUX_LIST.find(u => u.username == userId);
                if (staticUser) {
                    const { error } = await sb.from('users').insert({
                        username: userId,
                        name: staticUser.name,
                        role: 'auxiliar',
                        organization: 'TYM',
                        is_active: isActive,
                        password: '123' // Default
                    });
                    return !error;
                }
            }
        }

        const { error } = await sb.from('users').update({ is_active: isActive }).eq('id', userId);
        return !error;
    },

    async getUserByUsername(username) {
        if (!username) return null;
        const cleanUsername = String(username).trim();

        // 1. FAST PATH: Check Static Lists (Instant Login for TYM)
        const tymUser = TYM_AUX_LIST.find(u => u.username == cleanUsername);
        if (tymUser) {
            return { ...tymUser, id: tymUser.username, isActive: true };
        }
        if (cleanUsername === 'admin_tym') {
            return {
                id: 'tym-admin-id', username: 'admin_tym', password: '123',
                role: 'admin', name: 'Administrador TYM', organization: 'TYM', isActive: true
            };
        }

        // 2. DB PATH: For TAT users or unknown users
        const { data, error } = await sb.from('users').select('*').eq('username', cleanUsername).maybeSingle();
        if (error) { console.error(error); return null; }

        // Enhance with Organization details for DB users (TAT defaults)
        let user = data ? { ...data, isActive: data.is_active !== false } : null;
        if (user && !user.organization) {
            user.organization = 'TAT';
        }

        return user;
    },

    async searchProducts(query, organization = 'TAT') {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase();

        // 1. ISOLATE TYM PRODUCTS
        // Since we don't have a DB column yet, we serve MOCK products for TYM
        if (organization === 'TYM') {
            const TYM_PRODUCTS = TYM_PRODUCTS_LIST;
            return TYM_PRODUCTS.filter(p =>
                String(p.name).toLowerCase().includes(q) || String(p.code).toLowerCase().includes(q)
            ).slice(0, 50);
        }

        // 2. NORMAL FLOW (TAT)
        // Only return results if they are NOT meant for TYM (implies legacy products are TAT)

        if (!navigator.onLine) {
            try {
                const cached = localStorage.getItem('inventory');
                if (!cached) return [];
                const products = JSON.parse(cached);
                return products.filter(p => {
                    if (p.organization && p.organization !== 'TAT') return false; // Safety check
                    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
                }).slice(0, 15);
            } catch (e) { return []; }
        }

        let dbQuery = sb.from('products')
            .select('*')
            .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
            .limit(15);

        const { data, error } = await dbQuery;
        return error ? [] : data;
    },

    async getTodaysRoute(userId) {
        const today = new Date().toISOString().split('T')[0];
        // Normalize userId to string for consistent comparison
        const normalizedUserId = String(userId).trim();
        console.log("[getTodaysRoute] Fetching route for userId:", normalizedUserId, "date:", today);

        let query = sb.from('routes').select('*').eq('date', today);

        // STICT CHECK: UUID Pattern
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalizedUserId);

        if (!isUUID) {
            // For TYM/Auxiliaries (Cedula as ID)
            // ABSOLUTELY DO NOT query 'user_id' column here, as it is UUID type.
            console.log("[getTodaysRoute] Querying by username (cedula):", normalizedUserId);
            query = query.eq('username', normalizedUserId);
        } else {
            // For TAT/Legacy users with real DB IDs
            console.log("[getTodaysRoute] Querying by user_id (UUID):", normalizedUserId);
            query = query.eq('user_id', normalizedUserId);
        }

        // Order by created_at descending to get the most recent route first
        // Use limit(1) + single() instead of maybeSingle() to handle multiple rows
        query = query.order('created_at', { ascending: false }).limit(1);

        const { data, error } = await query.maybeSingle();
        if (error) {
            console.error("[getTodaysRoute] Error fetching route:", error);
            console.error("[getTodaysRoute] Error details:", JSON.stringify(error, null, 2));
        } else {
            console.log("[getTodaysRoute] Query result:", data);
        }

        return data ? this._mapRoute(data) : null;
    },

    // Placeholder for TYM Products (User will provide list)
    // format: { code, name, price, organization: 'TYM' }
    async getTymProducts() {
        return TYM_PRODUCTS_LIST;
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

    async getRoutes(organization = null) {
        // Increased limit to support >50 auxiliaries per day
        let query = sb.from('routes').select('*').order('date', { ascending: false }).limit(200);

        const { data: routes, error } = await query;
        if (error) return [];

        // Manually filter by user organization if needed
        // This is robust against missing schema relations, provided we have cached users
        if (organization) {
            // Fetch users of that org and filter
            const orgUsers = await this.getUsers(organization);

            // FILTER BY USERNAME:
            // Because we might be using Proxy IDs for TYM users (FK bypass),
            // we cannot rely on 'user_id' matching the mock user's ID.
            // We MUST rely on 'username' (Cedula) which is persisted correctly.
            const orgUsernames = new Set(orgUsers.map(u => u.username));

            return routes
                .filter(r => orgUsernames.has(r.username))
                .map(r => this._mapRoute(r));
        }

        return routes.map(r => this._mapRoute(r));
    },

    async getDashboardStats(date) {
        const { data, error } = await sb.rpc('get_dashboard_stats', { target_date: date });
        return (data && data.length > 0) ? data[0] : null;
    },

    async getReturns(limit = 50, offset = 0, organization = null) {
        // If organization is specified, we need to filter by routes belonging to that org
        let routeIds = null;
        if (organization) {
            const routes = await this.getRoutes(organization);
            routeIds = routes.map(r => r.id);
            if (routeIds.length === 0) return []; // No routes = no returns
        }

        let query = sb.from('return_items').select('*').order('created_at', { ascending: false });

        if (routeIds) {
            query = query.in('route_id', routeIds);
        }

        const { data, error } = await query.range(offset, offset + limit - 1);

        if (error) return [];
        return data.map(r => ({
            id: r.id, routeId: r.route_id, invoice: r.invoice, sheet: r.sheet,
            code: r.product_code, name: r.product_name, productName: r.product_name,
            quantity: r.quantity, total: r.total, reason: r.reason,
            evidence: r.evidence, timestamp: r.created_at
        }));
    },

    async addRoute(routeData) {
        console.log("Adding route...", routeData);

        // Ensure username is a string for consistent querying
        const username = String(routeData.username || routeData.userId).trim();
        console.log("[addRoute] Normalized username:", username);

        // Helper to attempt insert
        const doInsert = async (userIdToUse) => {
            try {
                return await sb.from('routes').insert([{
                    user_id: userIdToUse,
                    username: username, // Use normalized username
                    user_name: routeData.userName,
                    start_time: routeData.startTime,
                    date: routeData.date,
                    status: 'active'
                }]).select().single();
            } catch (err) {
                console.error("Insert exception:", err);
                return { error: err };
            }
        };

        let result;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(routeData.userId);

        if (isUUID) {
            // 1. Normal Insert (TAT Users with real DB IDs)
            result = await doInsert(routeData.userId);
        } else {
            // 2. TYM/Auxiliary Checks (Numeric ID / Cedula) -> REQUIRE Fallback immediately
            // Don't even try the main ID, it will fail FK.
            console.log("Non-UUID User ID detected, using Fallback...");
            result = { error: 'Require Fallback' };
        }

        // 3. Fallback Mechanism
        if (result.error) {
            console.warn("Route creation failed (likely FK), attempting Proxy ID...", result.error);

            const fallbackId = await this.getFallbackUserId();
            console.log("Fallback ID:", fallbackId);

            if (fallbackId) {
                result = await doInsert(fallbackId);
            }
        }

        if (result.error) console.error("Final Route Error:", result.error);
        return result.error ? null : this._mapRoute(result.data);
    },

    async updateRoute(routeId, updates) {
        const dbUpdates = {};
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.endTime) dbUpdates.end_time = updates.endTime;
        const { error } = await sb.from('routes').update(dbUpdates).eq('id', routeId);

        // Notify Admin if route is completed
        if (!error && updates.status === 'completed') {
            try {
                const { data: route } = await sb.from('routes').select('user_name, username').eq('id', routeId).single();

                // Determine organization
                const tymUsernames = new Set(TYM_AUX_LIST.map(u => String(u.username).trim()));
                const organization = tymUsernames.has(String(route?.username).trim()) ? 'TYM' : 'TAT';

                await broadcastEvent('ruta-completada', { userName: route?.user_name || 'Alguien' }, organization);
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
        // 1. FAST PATH: UI Call (save local, return instant, sync later)
        if (!skipOfflineQueue) {
            try {
                await this.saveOfflineReturn(returnData);
                this.syncOfflineReturns(); // Background trigger (fire & forget)
                return true;
            } catch (e) { return false; }
        }

        // 2. SYNC PATH: Background Worker (upload & insert)
        try {
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

            if (error) return false; // Keep in queue if failed

            try {
                // Determine organization from route
                const { data: route } = await sb.from('routes').select('username').eq('id', returnData.routeId).single();
                const tymUsernames = new Set(TYM_AUX_LIST.map(u => String(u.username).trim()));
                const organization = tymUsernames.has(String(route?.username).trim()) ? 'TYM' : 'TAT';

                await broadcastEvent('nueva-devolucion', { timestamp: new Date().toISOString() }, organization);
            } catch (e) { }
            return true;
        } catch (e) {
            return false;
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

    async resetTestData(organization = null) {
        try {
            if (organization) {
                // Get all routes for this organization
                const routes = await this.getRoutes(organization);
                const routeIds = routes.map(r => r.id);

                if (routeIds.length > 0) {
                    await sb.from('return_items').delete().in('route_id', routeIds);
                    await sb.from('routes').delete().in('id', routeIds);
                }
            } else {
                // Delete all (admin override)
                await sb.from('return_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                await sb.from('routes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            }

            localStorage.removeItem('activeRoute');
            const dbRef = await this._initOfflineDB();
            const transaction = dbRef.transaction(['pending_returns'], 'readwrite');
            transaction.objectStore('pending_returns').clear();
            return true;
        } catch (e) { return false; }
    }
};
