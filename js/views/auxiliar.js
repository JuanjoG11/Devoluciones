import { db } from '../data.js';
import { auth } from '../auth.js';
import { Alert } from '../utils/ui.js';

export const renderAuxiliarDashboard = async (container, user) => {
    // Removed: const products = await db.getInventory(); 
    // Optimization: Do NOT fetch inventory upfront.

    // Optimized: Fetch only THIS user's route for today
    const myRoute = await db.getTodaysRoute(user.id);

    let state = {
        view: 'dashboard', // dashboard | form
        routeStarted: !!myRoute,
        products: [], // Will load async on search
        currentRouteId: myRoute ? myRoute.id : null
    };

    const render = async () => {
        let myReturns = [];
        if (state.currentRouteId) {
            const serverReturns = await db.getRouteReturns(state.currentRouteId);
            const pendingReturns = await db.getPendingReturns();

            // Map pending returns for display
            const mappedPending = pendingReturns
                .filter(r => r.routeId === state.currentRouteId)
                .map(r => ({ ...r, pending: true }));

            myReturns = [...mappedPending, ...serverReturns];
        }

        if (state.view === 'dashboard') {
            await renderDashboard(myReturns, myRoute);
        } else if (state.view === 'form') {
            renderForm();
        }
    };

    // --- SYNC & NETWORK LOGIC ---
    const updateSyncUI = async () => {
        const syncStatus = document.getElementById('syncStatus');
        const offlineBanner = document.getElementById('offlineBanner');
        const pending = await db.getPendingReturns();

        if (!navigator.onLine) {
            if (syncStatus) syncStatus.innerHTML = '<span class="material-icons-round" style="font-size: 12px; color: #ffa500;">cloud_off</span> Offline';
            if (offlineBanner) offlineBanner.style.display = 'block';
        } else if (pending.length > 0) {
            if (syncStatus) syncStatus.innerHTML = `<span class="material-icons-round" style="font-size: 12px; color: #ffa500;">sync</span> Pendiente (${pending.length})`;
            if (offlineBanner) offlineBanner.style.display = 'none';
        } else {
            if (syncStatus) syncStatus.innerHTML = '<span class="material-icons-round" style="font-size: 12px; color: #4caf50;">cloud_done</span> Sincronizado';
            if (offlineBanner) offlineBanner.style.display = 'none';
        }
    };

    const triggerSync = async () => {
        if (navigator.onLine) {
            const count = await db.syncOfflineReturns();
            if (count > 0) {
                console.log(`Synced ${count} items`);
                await render(); // Refresh to show synced items properly
            }
        }
        await updateSyncUI();
    };

    window.addEventListener('online', triggerSync);
    window.addEventListener('offline', updateSyncUI);

    // Initial sync trigger
    setTimeout(triggerSync, 1000);

    const renderDashboard = (returns, currentRoute) => {
        const totalValue = returns.reduce((sum, r) => sum + r.total, 0);

        container.innerHTML = `
            <header class="app-header">
                <div style="flex: 1; min-width: 0;">
                    <h3 style="color: white; margin: 0; font-size: 1.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${(user.name || 'Auxiliar').split(' ')[0]}
                    </h3>
                    <div id="syncStatus" style="font-size: 10px; opacity: 0.8; display: flex; align-items: center; gap: 4px;">
                        <span class="material-icons-round" style="font-size: 12px;">cloud_done</span>
                        Sincronizado
                    </div>
                </div>
                <div class="header-actions">
                    ${currentRoute && currentRoute.status !== 'completed' ? `
                        <button id="endRouteBtn" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 700; white-space: nowrap;">
                            FINALIZAR
                        </button>
                    ` : ''}
                    ${currentRoute && currentRoute.status === 'completed' ? `
                        <div style="background: var(--success-color); color: white; padding: 6px 12px; border-radius: 6px; font-size: 10px; font-weight: 800; white-space: nowrap;">
                            FINALIZADO
                        </div>
                    ` : ''}
                    <button id="logoutBtn" onclick="window.handleLogout()" style="background:none; border:none; color:white; padding: 4px; display: flex; align-items: center; cursor: pointer;">
                        <span class="material-icons-round">logout</span>
                    </button>
                </div>
            </header>

            <div class="main-content" style="padding: 16px 12px; padding-bottom: 100px;">
                ${!state.routeStarted ? `
                    <div class="card text-center" style="margin-top: 40px;">
                        <span class="material-icons-round" style="font-size: 64px; color: var(--primary-light); opacity: 0.5;">commute</span>
                        <h2 class="mt-md">Iniciar Ruta</h2>
                        <p class="mb-md">Debes iniciar tu ruta para poder registrar devoluciones.</p>
                        <button id="startRouteBtn" class="btn btn-primary">
                            <span class="material-icons-round">play_arrow</span>
                            COMENZAR JORNADA
                        </button>
                    </div>
                ` : `
                    <div id="offlineBanner" class="card" style="display: none; background: #fff3cd; color: #856404; padding: 10px; margin-bottom: 16px; font-size: 13px; border: 1px solid #ffeeba;">
                        <span class="material-icons-round" style="font-size: 16px; vertical-align: middle;">offline_bolt</span>
                        Sin conexión. Guardando de forma local.
                    </div>

                    <div class="card" style="background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)); color: white; margin-bottom: 24px; padding: 20px 16px;">
                        <div class="flex justify-between items-center" style="gap: 12px;">
                            <div style="flex: 1; min-width: 0;">
                                <small style="opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px;">Valor en Devoluciones</small>
                                <h2 style="color: white; font-size: 26px; margin: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">$ ${totalValue.toLocaleString()}</h2>
                            </div>
                            <div style="text-align: right; background: rgba(255,255,255,0.15); padding: 8px 12px; border-radius: 12px; backdrop-filter: blur(4px); flex-shrink: 0;">
                                <div style="font-size: 20px; font-weight: 800; color: var(--accent-color); line-height: 1;">${returns.length}</div>
                                <small style="color: white; font-weight: 600; font-size: 10px;">Items</small>
                            </div>
                        </div>
                    </div>

                    ${returns.length === 0 ? `
                        <div class="text-center" style="margin-top: 60px; opacity: 0.6;">
                            <span class="material-icons-round" style="font-size: 48px;">inventory_2</span>
                            <p>No tienes devoluciones registradas</p>
                        </div>
                    ` : `
                        <div class="flex flex-col gap-sm">
                            ${returns.map(r => `
                                <div class="list-item" style="padding: 12px;">
                                    <div style="flex: 1; min-width: 0; padding-right: 8px;">
                                        <div style="font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${r.productName || r.name || 'Producto'}</div>
                                        <small style="font-size: 11px;">${r.reason} • Cant: ${r.quantity}</small>
                                    </div>
                                    <div style="text-align: right; flex-shrink: 0;">
                                        <div style="font-weight: 600; font-size: 14px;">$ ${(r.total || 0).toLocaleString()}</div>
                                        <div style="display: flex; justify-content: flex-end; gap: 4px; margin-top: 4px;">
                                            ${r.pending ? '<span class="material-icons-round" style="font-size: 14px; color: #ffa500;" title="Pendiente de sincronizar">sync_problem</span>' : ''}
                                            ${r.evidence ? '<span class="material-icons-round" style="font-size: 14px; color: var(--accent-color);">photo_camera</span>' : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                    
                    <button id="addReturnBtn" class="fab">
                        <span class="material-icons-round">add</span>
                    </button>
                `}
            </div>
        `;

        if (!state.routeStarted) {
            document.getElementById('startRouteBtn').addEventListener('click', async () => {
                const newRoute = {
                    userId: user.id,
                    username: user.username,
                    userName: user.name,
                    startTime: new Date().toLocaleTimeString(),
                    date: new Date().toISOString().split('T')[0]
                };
                const createdRoute = await db.addRoute(newRoute);
                if (createdRoute) {
                    state.routeStarted = true;
                    state.currentRouteId = createdRoute.id;
                    Alert.success("Ruta iniciada. ¡Buen camino!");
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    Alert.error("Error al iniciar ruta.");
                }
            });
        } else {
            updateSyncUI(); // Update UI after render
            const endBtn = document.getElementById('endRouteBtn');
            if (endBtn) {
                endBtn.addEventListener('click', async () => {
                    const confirmed = await Alert.confirm("¿Estás seguro de que deseas finalizar tu jornada laboral? No podrás registrar más devoluciones hoy.", "Finalizar Jornada");
                    if (confirmed) {
                        const now = new Date().toLocaleTimeString();
                        const success = await db.updateRoute(state.currentRouteId, { status: 'completed', endTime: now });
                        if (success) {
                            Alert.success("Jornada finalizada correctamente.");
                            setTimeout(() => window.location.reload(), 1500);
                        } else {
                            Alert.error("Error al finalizar. Intente de nuevo.");
                        }
                    }
                });
            }

            if (currentRoute && currentRoute.status === 'completed') {
                const addBtn = document.getElementById('addReturnBtn');
                if (addBtn) addBtn.style.display = 'none';
            } else {
                const addBtn = document.getElementById('addReturnBtn');
                if (addBtn) {
                    addBtn.addEventListener('click', async () => {
                        state.view = 'form';
                        await render();
                    });
                }
            }
        }
    };

    const renderForm = () => {
        container.innerHTML = `
            <header class="app-header">
                <button id="backBtn" style="background:none; border:none; color:white; margin-right: 16px;">
                    <span class="material-icons-round">arrow_back</span>
                </button>
                <h3>Nueva Devolución</h3>
                <div style="width: 24px;"></div>
            </header>

            <div style="padding: 20px;">
                <form id="returnForm" class="card">
                    <div class="input-group">
                        <label class="input-label">Factura</label>
                        <input type="text" name="invoice" class="input-field" placeholder="12345" required>
                    </div>

                    <div class="input-group">
                        <label class="input-label">Planilla</label>
                        <input type="text" name="sheet" class="input-field" placeholder="001" required>
                    </div>

                    <div class="input-group" style="position: relative;">
                        <label class="input-label">Producto (Buscar por nombre o código)</label>
                        <input type="text" id="productSearch" class="input-field" placeholder="Escribe para buscar..." required autocomplete="off">
                        <!-- Custom Search Results Dropdown instead of Datalist -->
                        <ul id="searchResults" style="
                            display: none;
                            position: absolute;
                            top: 100%;
                            left: 0;
                            right: 0;
                            background: white;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                            z-index: 10;
                            max-height: 200px;
                            overflow-y: auto;
                            list-style: none;
                            padding: 0;
                            margin: 4px 0 0 0;
                        "></ul>
                    </div>

                    <div class="flex gap-md">
                        <div class="input-group w-full">
                            <label class="input-label">Cantidad</label>
                            <input type="number" id="qty" class="input-field" min="1" value="1" required>
                        </div>
                        <div class="input-group w-full">
                            <label class="input-label">Precio Unit.</label>
                            <input type="text" id="price" class="input-field" readonly style="background-color: #f1f5f9;">
                        </div>
                    </div>

                    <div class="input-group">
                        <label class="input-label">Valor Total</label>
                        <div style="font-size: 24px; font-weight: 700; color: var(--accent-color); margin-top: 4px;">
                            $ <span id="totalValue">0</span>
                        </div>
                    </div>

                    <div class="input-group">
                        <label class="input-label">Razón</label>
                        <select name="reason" class="input-field" required>
                            <option value="">Seleccionar...</option>
                            <option value="Producto vencido">Producto vencido</option>
                            <option value="Producto averiado">Producto averiado</option>
                            <option value="Error de despacho">Error de despacho</option>
                            <option value="Rechazo del cliente">Rechazo del cliente</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>

                    <div class="input-group">
                        <label class="input-label">Evidencia</label>
                        <label for="evidence" class="btn btn-secondary w-full" style="justify-content: flex-start;">
                            <span class="material-icons-round">camera_alt</span>
                            <span id="evidenceText">Tomar Foto</span>
                        </label>
                        <input type="file" id="evidence" accept="image/*" capture="environment" class="hidden">
                        <img id="evidencePreview" src="" alt="Preview" style="max-width: 100%; margin-top: 10px; display: none;">
                    </div>

                    <button type="submit" class="btn btn-primary mt-md">
                        <span class="material-icons-round">save</span>
                        Guardar Devolución
                    </button>
                    <button type="button" id="cancelBtn" class="btn btn-secondary mt-sm">
                        <span class="material-icons-round">cancel</span>
                        Cancelar
                    </button>
                </form>
            </div>
        `;

        // Logic for Form
        const productInput = document.getElementById('productSearch');
        const searchResults = document.getElementById('searchResults');
        const priceInput = document.getElementById('price');
        const qtyInput = document.getElementById('qty');
        const totalSpan = document.getElementById('totalValue');
        const evidenceInput = document.getElementById('evidence');
        const evidenceText = document.getElementById('evidenceText');
        const evidencePreview = document.getElementById('evidencePreview');

        let selectedProduct = null;
        let debounceTimer;

        const calculate = () => {
            if (selectedProduct) {
                const qty = parseInt(qtyInput.value) || 0;
                const total = qty * selectedProduct.price;
                totalSpan.textContent = total.toLocaleString();
            }
        };

        // Async Search with Debounce
        productInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();

            // Allow manual clearing
            if (query === '') {
                searchResults.style.display = 'none';
                selectedProduct = null;
                calculate();
                return;
            }

            debounceTimer = setTimeout(async () => {
                searchResults.innerHTML = '<li style="padding: 12px; color: #666;">Buscando...</li>';
                searchResults.style.display = 'block';
                const results = await db.searchProducts(query);
                renderSearchResults(results);
            }, 300); // 300ms debounce
        });

        const renderSearchResults = (results) => {
            searchResults.innerHTML = '';
            if (results.length === 0) {
                searchResults.innerHTML = '<li style="padding: 12px; color: #666;">No se encontraron productos</li>';
                searchResults.style.display = 'block';
                return;
            }

            results.forEach(p => {
                const li = document.createElement('li');
                li.style.cssText = 'padding: 12px; border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.2s;';
                li.innerHTML = `
                    <div style="font-weight: 600; color: var(--primary-color);">${p.code} - ${p.name}</div>
                    <div style="font-size: 12px; color: #666;">$ ${p.price.toLocaleString()}</div>
                `;
                li.addEventListener('mouseover', () => { li.style.background = '#f1f5f9'; });
                li.addEventListener('mouseout', () => { li.style.background = 'white'; });
                li.addEventListener('click', () => {
                    selectProduct(p);
                });
                searchResults.appendChild(li);
            });
            searchResults.style.display = 'block';
        };

        const selectProduct = (p) => {
            selectedProduct = p;
            productInput.value = `${p.code} - ${p.name}`;
            priceInput.value = '$ ' + p.price.toLocaleString();
            searchResults.style.display = 'none';
            calculate();
        };

        // Hide search if clicked outside
        document.addEventListener('click', (e) => {
            if (e.target !== productInput && e.target !== searchResults) {
                searchResults.style.display = 'none';
            }
        });

        qtyInput.addEventListener('input', calculate);

        let capturedPhoto = null;

        evidenceInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (event) => {
                    capturedPhoto = event.target.result; // Base64 string
                    evidenceText.textContent = "Foto Capturada ✓";
                    evidenceText.style.color = "var(--success-color)";
                    evidenceText.parentElement.style.borderColor = "var(--success-color)";
                    evidencePreview.src = capturedPhoto;
                    evidencePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('returnForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedProduct) {
                Alert.error("Por favor selecciona un producto válido");
                return;
            }

            const formData = new FormData(e.target);
            const invoice = formData.get('invoice');
            const sheet = formData.get('sheet');
            const quantity = qtyInput.value;
            const reason = formData.get('reason');
            const total = selectedProduct.price * parseInt(quantity);

            const returnData = {
                routeId: state.currentRouteId,
                invoice,
                sheet,
                productCode: selectedProduct.code,
                productName: selectedProduct.name,
                price: selectedProduct.price,
                quantity: parseInt(quantity),
                total,
                reason,
                evidence: capturedPhoto,
                hasPhoto: !!capturedPhoto,
                timestamp: new Date().toISOString()
            };

            const result = await db.addReturn(returnData);

            if (result === true) {
                if (!navigator.onLine) {
                    Alert.success("Guardado localmente. Sincronizando...");
                } else {
                    Alert.success("Devolución registrada exitosamente");
                }
                state.view = 'dashboard';
                setTimeout(() => render(), 800);
            } else {
                Alert.error("Error al guardar la devolución");
            }
        });

        document.getElementById('backBtn').addEventListener('click', async () => {
            state.view = 'dashboard';
            await render();
        });

        document.getElementById('cancelBtn').addEventListener('click', async () => {
            state.view = 'dashboard';
            await render();
        });
    };

    await render();

    window.handleLogout = async () => {
        const confirmed = await Alert.confirm('¿Deseas cerrar la sesión activa?');
        if (confirmed) auth.logout();
    };

    // Clean up
    const originalOnDispose = window.onDisposeAuxiliar;
    window.onDisposeAuxiliar = () => {
        if (originalOnDispose) originalOnDispose();
        delete window.handleLogout;
    };
};
