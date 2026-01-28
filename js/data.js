import { sb, withTimeout } from './supabase.js';
import { TYM_PRODUCTS_LIST } from './data/tym_products.js';
import { CARNICOS_PRODUCTS_LIST } from './data/carnicos_products.js';
import { CONFIG, getDefaultDateRange } from './config.js';
import { compressImage } from './utils/imageCompression.js';

/**
 * Data Initialization
 * Loads initial users and products if the database is empty.
 * Caches products locally for offline search support.
 */


const _initOfflineDB = async () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AppDevolucionesOffline', 2);
        request.onupgradeneeded = (e) => {
            const idb = e.target.result;
            if (!idb.objectStoreNames.contains('pending_returns')) {
                idb.createObjectStore('pending_returns', { keyPath: 'id', autoIncrement: true });
            }
            if (!idb.objectStoreNames.contains('inventory')) {
                idb.createObjectStore('inventory', { keyPath: 'code' });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

const syncInventory = async () => {
    try {
        // console.log("Syncing local inventory cache...");
        const { data: allProducts, error } = await withTimeout(
            sb.from('products').select('code, name, price'),
            15000
        );
        if (error) throw error;
        if (allProducts) {
            const dbRef = await _initOfflineDB();
            const transaction = dbRef.transaction(['inventory'], 'readwrite');
            const store = transaction.objectStore('inventory');

            // Clear old cache and add new one
            store.clear();
            allProducts.forEach(p => {
                store.put({ ...p, search_string: `${p.code} ${p.name}`.toLowerCase() });
            });

            localStorage.setItem('inventory_last_sync', Date.now().toString());
            // console.log(`Inventory cache updated with ${allProducts.length} items.`);
            window.dispatchEvent(new CustomEvent('inventory-updated'));
        }
    } catch (e) {
        console.error("Error syncing inventory:", e);
    }
};

const TYM_AUX_LIST = [
    { username: '1002730727', name: 'JHON WILSON GIRALDO CARVAJAL' },
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
    { username: '1010159801', name: 'BRANDON ESTIVEN TORO GALVIS' },
    { username: '1004700767', name: 'DAVID ALEJANDRO RIVERA' },
    { username: '1022364037', name: 'RONALD ADOLFO ANGULO MACUASE' },
    { username: '1112763651', name: 'JULIAN DAVID CORTES' },
    { username: '1093220521', name: 'JUAN DIEGO FRANCO' }
].map(u => ({ ...u, password: '123', role: 'auxiliar', organization: 'TYM' }));

const TAT_AUX_LIST = [
    { username: '1193105349', name: 'MICHAEL CONTRERAS HURTADO' },
    { username: '75071571', name: 'LUIS ALFONSO RIOS GONZALEZ' },
    { username: '1088017580', name: 'JOHN ANDRES CASTILLO GIRALDO' },
    { username: '1089097145', name: 'MANUEL ALEJANDRO RAMIREZ OVALLE' },
    { username: '1088305468', name: 'JULIAN DAVID RODRIGUEZ MONTOYA' },
    { username: '1058842716', name: 'MAIKOL ESTIVEN CARDONA TORO' },
    { username: '1094956074', name: 'YERFREY FLORES ARROYAVE' },
    { username: '18519387', name: 'FIDEL HERNANDO GARCIA CORREA' },
    { username: '10030398', name: 'JOHN RAUL GRAJALES CANO' },
    { username: '1004667097', name: 'JUAN GUILLERMO FERNANDEZ GIRALDO' },
    { username: '18516953', name: 'JOSE ARLEY MARIN HERRERA' },
    { username: '1055831421', name: 'SAMUEL ANDRES ARIAS ARCILA' },
    { username: '1005048479', name: 'NATALY MOLINA BECERRA' },
    { username: '80433929', name: 'LINO LOPEZ SIMONS' },
    { username: '1060506540', name: 'YENIFER ANDREA SOTO GARZON' },
    { username: '1060586518', name: 'NELLY YURANNY SALDARRIAGA CAÑAS' },
    { username: '1078456086', name: 'NELWIS DEYVER CORDOBA MOSQUERA' },
    { username: '1085717552', name: 'DANIEL ANDRES OLAYA PEREZ' },
    { username: '1053849016', name: 'YHONY ALEXANDER LOPEZ LOPEZ' },
    { username: '1076350176', name: 'DANIELA CASTIBLANCO RAMIREZ' }
].map(u => ({ ...u, password: '123', role: 'auxiliar', organization: 'TAT' }));

/**
 * List of usernames (Cedulas) that belong to the Carnicos Team.
 * They only see meat products (ZENU/RANCHERA/RICA).
 */
const CARNICOS_USERNAMES = new Set([
    '1010159801', // BRANDON ESTIVEN TORO GALVIS
    '1088037094', // DANIEL FELIPE MURILLO GRANDA
    '1112776419', // JAMMES ALBERTO RAMIREZ NIETO
    '1098724347', // SEBASTIAN SALAZAR HENAO
    '1089601941', // FELIPE MONTES RIVERA
    '10033035'    // CESAR AUGUSTO CASTILLO LONDOÑO
]);

/**
 * Set of product codes that are considered "Meat Products".
 * Used to filter them out for regular TYM auxiliaries.
 */
const CARNICOS_CODES = new Set(CARNICOS_PRODUCTS_LIST.map(p => String(p.code).trim()));

const seedUsers = async () => {
    const users = [
        // TAT ADMIN & UTILS
        { username: 'admin', password: '123', role: 'admin', name: 'Administrador TAT', organization: 'TAT' },

        // TYM ADMIN
        { username: 'admin_tym', password: '123', role: 'admin', name: 'Administrador TYM', organization: 'TYM' },

        // AUXILIARIES FROM STATIC LISTS
        ...TAT_AUX_LIST,
        ...TYM_AUX_LIST
    ];
    // Use upsert to insert or update existing users
    try {
        await sb.from('users').upsert(users, { onConflict: 'username' });
    } catch (e) {
        console.warn("Seeding partial/failed (expected if schema is locked):", e.message);
    }
};

const seedProducts = async (rawInventory) => {
    try {
        const products = parseInventory(rawInventory);
        // console.log(`Seeding ${products.length} products...`);
        const chunkSize = 100;
        for (let i = 0; i < products.length; i += chunkSize) {
            const chunk = products.slice(i, i + chunkSize);
            const { error } = await sb.from('products').upsert(chunk, { onConflict: 'code' });
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
let _submissionLock = false;

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
        try {
            const { data, error } = await sb.from('users').select('*').order('name', { ascending: true });
            if (error) throw error;

            // 1. Map DB users and detect organization
            let dbUsers = data.map(u => ({
                ...u,
                isActive: u.is_active !== false,
                organization: this.isTymAccount(u.username) ? 'TYM' : (u.organization || 'TAT')
            }));

            const dbUsernames = new Set(dbUsers.map(u => String(u.username).trim()));

            TYM_AUX_LIST.forEach(staticUser => {
                const cleanUsername = String(staticUser.username).trim();
                if (!dbUsernames.has(cleanUsername)) {
                    dbUsers.push({
                        ...staticUser,
                        id: cleanUsername,
                        isActive: true
                    });
                }
            });

            TAT_AUX_LIST.forEach(staticUser => {
                const cleanUsername = String(staticUser.username).trim();
                if (!dbUsernames.has(cleanUsername)) {
                    dbUsers.push({
                        ...staticUser,
                        id: cleanUsername,
                        isActive: true
                    });
                }
            });

            // 3. Filter by organization if requested
            if (organization) {
                dbUsers = dbUsers.filter(u => u.organization === organization);
            }

            // Re-sort by name after merge
            return dbUsers.sort((a, b) => a.name.localeCompare(b.name));
        } catch (e) {
            console.error("Error fetching users:", e);
            // Absolute fallback: return static lists if DB fails completely
            if (organization === 'TYM') return TYM_AUX_LIST;
            if (organization === 'TAT') return TAT_AUX_LIST;
            return [...TAT_AUX_LIST, ...TYM_AUX_LIST];
        }
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

        // 1. Check DB first (most reliable status)
        const { data, error } = await sb.from('users').select('*').eq('username', cleanUsername).maybeSingle();
        if (error) { console.error("Login lookup error:", error); }

        const staticTym = TYM_AUX_LIST.find(u => String(u.username).trim() == cleanUsername);

        if (data) {
            // User exists in DB
            let user = { ...data, isActive: data.is_active !== false };

            // Auto-detect TYM if missing or if known
            if (!user.organization) {
                user.organization = this.isTymAccount(cleanUsername) ? 'TYM' : 'TAT';
            } else if (this.isTymAccount(cleanUsername) && user.organization !== 'TYM') {
                user.organization = 'TYM'; // Static list overrides DB for these specific users
            }
            return user;
        }

        // 2. Fallback to Static Lists (e.g. first login or seeding issues)
        if (staticTym) {
            return { ...staticTym, id: staticTym.username, isActive: true, organization: 'TYM' };
        }

        if (this.isTymAccount(cleanUsername)) {
            return {
                id: cleanUsername, username: cleanUsername, password: '123',
                role: (cleanUsername === 'admin_tym') ? 'admin' : 'auxiliar',
                name: (cleanUsername === 'admin_tym') ? 'Administrador TYM' : (staticTym ? staticTym.name : 'Auxiliar TYM'),
                organization: 'TYM', isActive: true
            };
        }

        return null;
    },

    async searchProducts(query, organization = 'TAT', username = null) {
        if (!query || query.length < 2) return [];
        const q = query.toLowerCase();

        // 0. CARNICOS TEAM RESTRICTION (Mutual Exclusion within TYM)
        if (organization === 'TYM') {
            const isCarnicoUser = username && CARNICOS_USERNAMES.has(String(username).trim());

            if (isCarnicoUser) {
                // TEAM CARNICOS: ONLY see meat products
                return CARNICOS_PRODUCTS_LIST.filter(p =>
                    String(p.name).toLowerCase().includes(q) || String(p.code).toLowerCase().includes(q)
                ).slice(0, 500);
            } else {
                // REGULAR TYM: See regular items, EXCLUDE meat products
                return TYM_PRODUCTS_LIST.filter(p =>
                    (String(p.name).toLowerCase().includes(q) || String(p.code).toLowerCase().includes(q)) &&
                    !CARNICOS_CODES.has(String(p.code).trim())
                ).slice(0, 500);
            }
        }

        // TAT: ONLY show products from database, EXCLUDING TYM products
        const tymCodes = new Set(TYM_PRODUCTS_LIST.map(p => String(p.code).trim()));
        let dbResults = [];

        // 1. FETCH FROM LOCAL CACHE FIRST (FASTEST)
        try {
            const dbRef = await _initOfflineDB();
            const localResults = await new Promise((resolve) => {
                const transaction = dbRef.transaction(['inventory'], 'readonly');
                const store = transaction.objectStore('inventory');
                const request = store.getAll();
                request.onsuccess = () => {
                    const all = request.result || [];
                    resolve(all.filter(p =>
                        (String(p.name).toLowerCase().includes(q) || String(p.code).toLowerCase().includes(q)) &&
                        !tymCodes.has(String(p.code).trim())
                    ));
                };
                request.onerror = () => resolve([]);
            });

            if (localResults.length > 0) {
                return localResults.slice(0, 500);
            }
        } catch (e) {
            console.warn("Local search failed, falling back to network", e);
        }

        // 2. FALLBACK TO NETWORK IF ONLINE AND NO LOCAL RESULTS
        if (navigator.onLine) {
            try {
                const { data, error } = await withTimeout(
                    sb.from('products')
                        .select('*')
                        .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
                        .limit(500),
                    8000
                );

                if (!error && data) {
                    return data.filter(p => !tymCodes.has(String(p.code).trim())).slice(0, 500);
                }
            } catch (e) {
                console.warn("Network search timed out or failed", e);
            }
        }

        return dbResults.slice(0, 500);
    },

    /**
     * Helper to identify if a username belongs to TYM
     */
    isTymAccount(username) {
        if (!username) return false;
        const clean = String(username).trim();

        // Check static list
        const isStaticTym = TYM_AUX_LIST.some(u => String(u.username).trim() === clean);

        return isStaticTym || clean === 'admin_tym' || clean.startsWith('aux_tym');
    },

    async getTodaysRoute(userId) {
        const today = new Date().toLocaleDateString('en-CA');
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

        if (!data && isUUID) {
            // Fallback: If UUID didn't work but we know the user's username/cedula
            // Try fetching by username as well
            const { data: user } = await sb.from('users').select('username').eq('id', normalizedUserId).maybeSingle();
            if (user && user.username) {
                const { data: routeByUsername } = await sb.from('routes')
                    .select('*')
                    .eq('date', new Date().toLocaleDateString('en-CA'))
                    .eq('username', String(user.username).trim())
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                if (routeByUsername) return this._mapRoute(routeByUsername);
            }
        }

        if (error) {
            console.error("[getTodaysRoute] Error fetching route:", error);
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
            evidence: r.evidence, timestamp: r.created_at,
            isResale: !!r.is_resale, resaleCustomerCode: r.resale_customer_code
        }));
    },

    _mapRoute(r) {
        return {
            id: r.id, userId: r.user_id, username: r.username, userName: r.user_name,
            date: r.date, startTime: r.start_time, endTime: r.end_time, status: r.status
        };
    },

    async getRoutes(organization = null, daysBack = null) {
        // Optimize for production: default to recent routes only
        const dateFilter = daysBack !== null ? daysBack : CONFIG.PERFORMANCE.DEFAULT_DAYS_FILTER;

        let query = sb.from('routes').select('*').order('date', { ascending: false });

        // Apply date filter for performance
        if (dateFilter > 0) {
            const { startDate } = getDefaultDateRange();
            query = query.gte('date', startDate);
        }

        query = query.limit(CONFIG.PERFORMANCE.ROUTES_LIMIT);

        const { data: routes, error } = await query;
        if (error) return [];

        return routes
            .filter(r => {
                if (!organization) return true;
                const rOrg = this.isTymAccount(r.username) ? 'TYM' : 'TAT';
                return rOrg === organization;
            })
            .map(r => this._mapRoute(r));
    },

    async getDashboardStats(date) {
        const { data, error } = await sb.rpc('get_dashboard_stats', { target_date: date });
        return (data && data.length > 0) ? data[0] : null;
    },

    async getReturns(limit = 100, offset = 0, organization = null) {
        // Improved query with join to guarantee accurate organization attribution
        // Using routes!inner ensures we only get returns linked to valid routes
        let query = sb.from('return_items')
            .select('*, routes!inner(username, user_name)')
            .order('created_at', { ascending: false });

        // Range fetching to handle filtering in JS while maintaining correct limit
        const fetchLimit = organization ? limit * 3 : limit;
        const { data, error } = await query.range(offset, offset + fetchLimit - 1);
        if (error) {
            console.error("Error fetching returns:", error);
            return [];
        }

        return data
            .filter(r => {
                if (!organization) return true;
                const rOrg = this.isTymAccount(r.routes?.username) ? 'TYM' : 'TAT';
                return rOrg === organization;
            })
            .slice(0, limit)
            .map(r => ({
                id: r.id, routeId: r.route_id, invoice: r.invoice, sheet: r.sheet,
                code: r.product_code, name: r.product_name, productName: r.product_name,
                quantity: r.quantity, total: r.total, reason: r.reason,
                evidence: r.evidence, timestamp: r.created_at,
                isResale: !!r.is_resale, resaleCustomerCode: r.resale_customer_code,
                auxiliarName: r.routes?.user_name
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
            const fallbackId = await this.getFallbackUserId();
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
        return _initOfflineDB();
    },

    async saveOfflineReturn(returnData) {
        try {
            // Compress image before saving to IndexedDB
            if (returnData.evidence && returnData.evidence.startsWith('data:image')) {
                returnData.evidence = await compressImage(returnData.evidence);
            }

            const dbRef = await _initOfflineDB();
            return new Promise((resolve, reject) => {
                const transaction = dbRef.transaction(['pending_returns'], 'readwrite');
                const store = transaction.objectStore('pending_returns');
                const request = store.add(returnData);
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(false);
            });
        } catch (e) {
            console.error('Error saving offline return:', e);
            return false;
        }
    },

    async getPendingReturns() {
        try {
            const dbRef = await _initOfflineDB();
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
            const dbRef = await _initOfflineDB();
            return new Promise((resolve) => {
                const transaction = dbRef.transaction(['pending_returns'], 'readwrite');
                const request = transaction.objectStore('pending_returns').delete(id);
                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            });
        } catch (e) { return false; }
    },

    async syncOfflineReturns() {
        if (this._syncing) return 0;
        this._syncing = true;
        try {
            const pending = await this.getPendingReturns();
            if (pending.length === 0) return 0;

            let syncedCount = 0;
            const batchSize = CONFIG.PERFORMANCE.SYNC_BATCH_SIZE;

            // Process in batches for better performance
            for (let i = 0; i < pending.length; i += batchSize) {
                const batch = pending.slice(i, i + batchSize);

                // Process batch items in parallel
                const results = await Promise.allSettled(
                    batch.map(async (item) => {
                        const tempId = item.id;
                        delete item.id;
                        const success = await this.addReturn(item, true);
                        return { success, tempId };
                    })
                );

                // Delete successfully synced items
                for (const result of results) {
                    if (result.status === 'fulfilled' && result.value.success) {
                        await this.deletePendingReturn(result.value.tempId);
                        syncedCount++;
                    }
                }

                // Small delay between batches to avoid overwhelming the server
                if (i + batchSize < pending.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            console.log(`Synced ${syncedCount} of ${pending.length} pending returns`);
            return syncedCount;
        } catch (e) {
            console.error('Sync error:', e);
            return 0;
        } finally {
            this._syncing = false;
        }
    },

    async checkDuplicate(invoice, sheet, routeId, productCode = null, ignoreLocal = false) {
        if (!invoice && !sheet) return null;

        const cleanInvoice = String(invoice || '').trim();
        const cleanSheet = String(sheet || '').trim();
        const cleanProductCode = String(productCode || '').trim();

        // 1. Check Offline Queue first
        if (!ignoreLocal) {
            const pending = await this.getPendingReturns();
            const localDuplicate = pending.find(p =>
                p.routeId === routeId &&
                String(p.invoice || '').trim() === cleanInvoice &&
                String(p.sheet || '').trim() === cleanSheet &&
                (cleanProductCode ? String(p.productCode || '').trim() === cleanProductCode : true)
            );
            if (localDuplicate) return localDuplicate;
        }

        // 2. Check Database
        // We use an exact match for invoice, sheet AND product_code if provided
        // This is much safer than the previous OR logic which was too aggressive.
        let query = sb.from('return_items')
            .select('*')
            .eq('route_id', routeId)
            .eq('invoice', cleanInvoice)
            .eq('sheet', cleanSheet);

        if (cleanProductCode) {
            query = query.eq('product_code', cleanProductCode);
        }

        const { data } = await query.limit(1);
        return (data && data.length > 0) ? data[0] : null;
    },

    async addReturn(returnData, skipOfflineQueue = false, isBatchPart = false) {
        // 1. FAST PATH: UI Call (save local, return instant, sync later)
        if (!skipOfflineQueue) {
            if (_submissionLock && !isBatchPart) {
                console.warn("[addReturn] Submission locked, skipping duplicate trigger.");
                return true;
            }
            if (!isBatchPart) _submissionLock = true;

            try {
                // Double Check for Duplicates (Local + Remote if online)
                const existing = await this.checkDuplicate(returnData.invoice, returnData.sheet, returnData.routeId, returnData.productCode);

                if (existing) {
                    console.log("[addReturn] Duplicate return detected, skipping.");
                    return true;
                }

                const saved = await this.saveOfflineReturn(returnData);
                if (saved) {
                    // Trigger sync in background but don't wait for it
                    this.syncOfflineReturns().catch(console.error);
                    return true;
                }
                return false;
            } catch (e) {
                console.error("Error in addReturn (local):", e);
                return false;
            } finally {
                // Release lock after 1 second to prevent mechanical bounce
                if (!isBatchPart) setTimeout(() => { _submissionLock = false; }, 1000);
            }
        }

        // 2. SYNC PATH: Background Worker (upload & insert)
        try {
            // DEEP DUPLICATE CHECK: During sync, ONLY check the remote DB (ignoreLocal: true)
            // to avoid flagging the item that is currently in the queue as a duplicate of itself.
            const existing = await this.checkDuplicate(returnData.invoice, returnData.sheet, returnData.routeId, returnData.productCode, true);
            if (existing) {
                console.log("Duplicate return found in DB during sync, marking as success to remove from queue.");
                return true;
            }

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

            if (error) {
                console.error("Error inserting return:", error);
                return false;
            }

            try {
                // Determine organization from route for targeted broadcast
                const { data: route } = await sb.from('routes').select('username').eq('id', returnData.routeId).single();
                const organization = (route && this.isTymAccount(route.username)) ? 'TYM' : 'TAT';

                await broadcastEvent('nueva-devolucion', { timestamp: new Date().toISOString() }, organization);
            } catch (e) { }
            return true;
        } catch (e) {
            console.error("Exception in addReturn (sync):", e);
            return false;
        }
    },

    async addReturnsBatch(returnsArray) {
        if (!returnsArray || returnsArray.length === 0) return true;

        if (_submissionLock) {
            console.warn("[addReturnsBatch] Submission locked.");
            return false;
        }
        _submissionLock = true;

        try {
            let allSaved = true;
            for (const item of returnsArray) {
                const saved = await this.addReturn(item, false, true);
                if (!saved) allSaved = false;
            }
            return allSaved;
        } catch (e) {
            console.error("Error in batch add:", e);
            return false;
        } finally {
            setTimeout(() => { _submissionLock = false; }, 1000);
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

    async processResale(resaleData) {
        try {
            console.log("[db.processResale] Processing resale:", resaleData);

            for (const resaleItem of resaleData.items) {
                // 1. Get current item details
                const { data: original, error: fetchError } = await sb.from('return_items').select('*').eq('id', resaleItem.id).single();
                if (fetchError || !original) continue;

                if (resaleItem.quantity >= original.quantity) {
                    // Full resale: update record
                    await sb.from('return_items')
                        .update({
                            is_resale: true,
                            resale_customer_code: resaleData.customerCode,
                            resale_timestamp: resaleData.timestamp
                        })
                        .eq('id', resaleItem.id);
                } else {
                    // Partial resale: 
                    // a) Update original (subtract)
                    const remainingQty = original.quantity - resaleItem.quantity;
                    const remainingTotal = original.total - resaleItem.total;

                    await sb.from('return_items')
                        .update({
                            quantity: remainingQty,
                            total: remainingTotal
                        })
                        .eq('id', resaleItem.id);

                    // b) Create new record for the resale portion
                    const newResaleRecord = {
                        ...original,
                        id: undefined, // Let DB generate new ID
                        created_at: undefined,
                        quantity: resaleItem.quantity,
                        total: resaleItem.total,
                        is_resale: true,
                        resale_customer_code: resaleData.customerCode,
                        resale_timestamp: resaleData.timestamp
                    };
                    delete newResaleRecord.id;
                    delete newResaleRecord.created_at;

                    await sb.from('return_items').insert(newResaleRecord);
                }
            }

            // 2. Notify Admin
            const { data: route } = await sb.from('routes').select('username').eq('id', resaleData.routeId).single();
            const organization = (route && this.isTymAccount(route.username)) ? 'TYM' : 'TAT';

            await broadcastEvent('nueva-reventa', {
                customerCode: resaleData.customerCode,
                itemsCount: resaleData.items.length,
                total: resaleData.total,
                organization
            }, organization);

            return true;
        } catch (e) {
            console.error("Error processing resale:", e);
            return false;
        }
    },

    async getResoldReturns(organization = null) {
        let query = sb.from('return_items')
            .select('*, routes!inner(username, user_name)')
            .eq('is_resale', true)
            .order('resale_timestamp', { ascending: false });

        const { data, error } = await query;
        if (error) return [];

        return data
            .filter(r => {
                if (!organization) return true;
                const rOrg = this.isTymAccount(r.routes?.username) ? 'TYM' : 'TAT';
                return rOrg === organization;
            })
            .map(r => ({
                id: r.id, routeId: r.route_id, invoice: r.invoice, sheet: r.sheet,
                code: r.product_code, name: r.product_name, productName: r.product_name,
                quantity: r.quantity, total: r.total, reason: r.reason,
                evidence: r.evidence, timestamp: r.created_at,
                isResale: true, resaleCustomerCode: r.resale_customer_code,
                resaleTimestamp: r.resale_timestamp,
                auxiliarName: r.routes?.user_name
            }));
    },

    async resetTestData(organization = null) {
        try {
            if (organization) {
                // Get all routes for this organization
                const routes = await this.getRoutes(organization);
                const routeIds = routes.map(r => r.id);

                if (routeIds.length > 0) {
                    // Delete returns and routes for this organization only
                    await sb.from('return_items').delete().in('route_id', routeIds);
                    await sb.from('routes').delete().in('id', routeIds);
                }

                // Clear offline data ONLY for this organization
                const dbRef = await _initOfflineDB();
                const transaction = dbRef.transaction(['pending_returns'], 'readwrite');
                const store = transaction.objectStore('pending_returns');

                // Get all pending returns
                const allPending = await new Promise((resolve) => {
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => resolve([]);
                });

                // Delete only pending returns that belong to this organization's routes
                for (const pending of allPending) {
                    if (routeIds.includes(pending.routeId)) {
                        store.delete(pending.id);
                    }
                }

                // Only clear activeRoute if it belongs to this organization
                const activeRouteStr = localStorage.getItem('activeRoute');
                if (activeRouteStr) {
                    try {
                        const activeRoute = JSON.parse(activeRouteStr);
                        if (routeIds.includes(activeRoute.id)) {
                            localStorage.removeItem('activeRoute');
                        }
                    } catch (e) {
                        // If parsing fails, remove it to be safe
                        localStorage.removeItem('activeRoute');
                    }
                }
            } else {
                // Delete all (admin override - should rarely be used)
                await sb.from('return_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                await sb.from('routes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

                // Clear all offline data
                localStorage.removeItem('activeRoute');
                const dbRef = await _initOfflineDB();
                const transaction = dbRef.transaction(['pending_returns'], 'readwrite');
                transaction.objectStore('pending_returns').clear();
            }

            return true;
        } catch (e) {
            console.error('Error resetting test data:', e);
            return false;
        }
    }
};

/**
 * Data Initialization
 * Loads initial users and products if the database is empty.
 * Caches products locally for offline search support.
 */
export const initializeData = async () => {
    try {
        // Cleanup old localStorage inventory to free space
        if (localStorage.getItem('inventory')) {
            localStorage.removeItem('inventory');
            // console.log("Old localStorage inventory removed.");
        }

        // 1. Always Sync Users (to ensure new ones are added)
        // console.log("Syncing users...");
        await seedUsers();

        const version = 'v10'; // Increment this to force a full re-sync
        const isFirstInit = !localStorage.getItem('db_initialized');
        const needsVersionSync = localStorage.getItem('inventory_version') !== version;

        if (!isFirstInit && !needsVersionSync) {
            // Background sync Inventory if online
            if (navigator.onLine) {
                syncInventory().catch(e => console.warn("Background inventory sync failed", e));
            }
            return;
        }

        localStorage.setItem('inventory_version', version);

        // 2. Seed Products if empty
        const { count: productCount } = await sb.from('products').select('*', { count: 'exact', head: true });
        if (isFirstInit || needsVersionSync) {
            // console.log("Seeding initial products...");
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
