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
                        <button id="endRouteBtn" style="background: var(--secondary-accent); border: none; color: white; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 900; box-shadow: 0 4px 12px var(--secondary-glow); text-transform: uppercase; letter-spacing: 0.5px;">
                            FINALIZAR RUTA
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

                    <div class="card" style="background: var(--grad-electric); color: white; margin-bottom: 32px; padding: 32px 24px; border: none; box-shadow: var(--shadow-blue); position: relative; overflow: hidden; border-bottom: 6px solid var(--secondary-accent); border-radius: 28px;">
                        <div style="position: absolute; right: -20px; top: -20px; opacity: 0.1;"><span class="material-icons-round" style="font-size: 120px;">payments</span></div>
                        <div class="flex justify-between items-center" style="gap: 16px; position: relative; z-index: 1;">
                            <div style="flex: 1; min-width: 0;">
                                <small style="opacity: 0.9; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 800; font-size: 10px;">VALOR DEVOLUCIONES</small>
                                <h2 style="color: white; font-size: 32px; margin: 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 900; letter-spacing: -1.5px;">$ ${totalValue.toLocaleString()}</h2>
                            </div>
                            <div style="text-align: right; background: var(--grad-lava); padding: 12px 16px; border-radius: 20px; box-shadow: var(--shadow-orange); flex-shrink: 0; min-width: 70px;">
                                <div style="font-size: 24px; font-weight: 900; color: white; line-height: 1;">${returns.length}</div>
                                <small style="color: rgba(255,255,255,0.9); font-weight: 800; font-size: 10px; text-transform: uppercase;">Items</small>
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
                    startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
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
                        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
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
                    <!-- Type Toggle -->
                    <div style="display: flex; gap: 12px; margin-bottom: 20px; background: #f1f5f9; padding: 4px; border-radius: 12px;">
                        <label style="flex: 1; text-align: center; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: 0.2s;" class="type-option active" data-value="partial">
                            <input type="radio" name="returnType" value="partial" checked class="hidden"> Parcial
                        </label>
                        <label style="flex: 1; text-align: center; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: 0.2s; color: var(--text-secondary);" class="type-option" data-value="total">
                            <input type="radio" name="returnType" value="total" class="hidden"> Total
                        </label>
                    </div>

                    <div class="input-group">
                        <label class="input-label">Factura</label>
                        <input type="text" name="invoice" class="input-field" placeholder="12345" required>
                    </div>

                    <div class="input-group">
                        <label class="input-label">Planilla</label>
                        <input type="text" name="sheet" class="input-field" placeholder="001" required>
                    </div>

                    <!-- Partial: Product Search -->
                    <div id="productSection" class="input-group" style="position: relative;">
                        <label class="input-label">Producto (Buscar por nombre o código)</label>
                        <input type="text" id="productSearch" class="input-field" placeholder="Escribe para buscar..." autocomplete="off">
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

                    <!-- Partial: Quantity & Price -->
                    <div id="qtyPriceSection" class="flex gap-md">
                        <div class="input-group w-full">
                            <label class="input-label">Cantidad</label>
                            <input type="number" id="qty" class="input-field" min="1" value="1">
                        </div>
                        <div class="input-group w-full">
                            <label class="input-label">Precio Unit.</label>
                            <input type="text" id="price" class="input-field" readonly style="background-color: #f1f5f9;">
                        </div>
                    </div>

                    <!-- Computed Total (Partial) vs Manual Total (Total) -->
                    <div class="input-group">
                        <label class="input-label">Valor Total</label>
                        <div id="computedTotalDisplay" style="font-size: 24px; font-weight: 700; color: var(--accent-color); margin-top: 4px;">
                            $ <span id="totalValue">0</span>
                        </div>
                        <!-- Manual Total Input for 'Total' type -->
                        <input type="text" inputmode="numeric" id="manualTotalInput" class="input-field hidden" placeholder="Ingrese el valor total">
                    </div>

                    <div class="input-group">
                        <label class="input-label">Razón</label>
                        <select name="reason" id="reasonSelect" class="input-field" required>
                            <!-- Options populated via JS -->
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
        const computedTotalDisplay = document.getElementById('computedTotalDisplay');
        const manualTotalInput = document.getElementById('manualTotalInput');
        const evidenceInput = document.getElementById('evidence');
        const evidenceText = document.getElementById('evidenceText');
        const evidencePreview = document.getElementById('evidencePreview');
        const reasonSelect = document.getElementById('reasonSelect');
        const typeOptions = document.querySelectorAll('.type-option');
        const productSection = document.getElementById('productSection');
        const qtyPriceSection = document.getElementById('qtyPriceSection');

        let selectedProduct = null;
        let debounceTimer;
        let currentType = 'partial';

        const REASONS_PARTIAL = [
            "Producto vencido", "Producto averiado", "Error de despacho", "Rechazo del cliente", "Otro"
        ];
        const REASONS_TOTAL = [
            "Negocio cerrado", "Sin dinero", "Fuera de ruta"
        ];

        const updateUIForType = (type) => {
            currentType = type;
            const isPartial = type === 'partial';

            // Toggle active style
            typeOptions.forEach(opt => {
                const isActive = opt.dataset.value === type;
                opt.classList.toggle('active', isActive);
                opt.style.background = isActive ? 'white' : 'transparent';
                opt.style.color = isActive ? 'var(--primary-color)' : 'var(--text-secondary)';
                opt.style.boxShadow = isActive ? '0 2px 5px rgba(0,0,0,0.05)' : 'none';
            });

            // Visibility
            if (isPartial) {
                productSection.classList.remove('hidden');
                qtyPriceSection.classList.remove('hidden');
                computedTotalDisplay.classList.remove('hidden');
                manualTotalInput.classList.add('hidden');
                productInput.setAttribute('required', 'true');
                manualTotalInput.removeAttribute('required');
            } else {
                productSection.classList.add('hidden');
                qtyPriceSection.classList.add('hidden');
                computedTotalDisplay.classList.add('hidden');
                manualTotalInput.classList.remove('hidden');
                productInput.removeAttribute('required');
                manualTotalInput.setAttribute('required', 'true');
            }

            // Update Reasons
            reasonSelect.innerHTML = '<option value="">Seleccionar...</option>';
            const reasons = isPartial ? REASONS_PARTIAL : REASONS_TOTAL;
            reasons.forEach(r => {
                const opt = document.createElement('option');
                opt.value = r;
                opt.textContent = r;
                reasonSelect.appendChild(opt);
            });
        };

        // Initialize UI
        updateUIForType('partial');

        // Toggle Listeners
        typeOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                const radio = opt.querySelector('input');
                radio.checked = true;
                updateUIForType(opt.dataset.value);
            });
        });

        const calculate = () => {
            if (currentType === 'partial' && selectedProduct) {
                const qty = parseInt(qtyInput.value) || 0;
                const total = qty * selectedProduct.price;
                totalSpan.textContent = total.toLocaleString();
            }
        };

        // Async Search with Debounce
        productInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();

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
            }, 300);
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

        // Format Manual Total Input with dots
        manualTotalInput.addEventListener('input', (e) => {
            // Remove non-numeric characters
            let value = e.target.value.replace(/\D/g, '');
            if (value) {
                // Add dots every 3 digits
                e.target.value = new Intl.NumberFormat('es-CO').format(value);
            } else {
                e.target.value = '';
            }
        });

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
                    capturedPhoto = event.target.result;
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
            const formData = new FormData(e.target);
            const invoice = formData.get('invoice');
            const sheet = formData.get('sheet');
            const reason = formData.get('reason');
            let total, quantity, productCode, productName, price;

            if (currentType === 'partial') {
                if (!selectedProduct) {
                    Alert.error("Por favor selecciona un producto válido");
                    return;
                }
                quantity = parseInt(qtyInput.value);
                price = selectedProduct.price;
                total = price * quantity;
                productCode = selectedProduct.code;
                productName = selectedProduct.name;
            } else {
                // Total Return
                // Sanitize input: remove dots/commas before parsing
                const rawValue = manualTotalInput.value.replace(/\D/g, '');
                total = parseInt(rawValue) || 0;
                quantity = 1; // Default
                price = total;
                productCode = ""; // Empty code
                productName = "DEVOLUCIÓN TOTAL"; // Placeholder name
            }

            const returnData = {
                routeId: state.currentRouteId,
                invoice,
                sheet,
                productCode,
                productName,
                price: price,
                quantity: quantity,
                total,
                reason,
                evidence: capturedPhoto,
                hasPhoto: !!capturedPhoto,
                timestamp: new Date().toISOString()
            };

            // ✅ Check for duplicates
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner" style="width:20px; height:20px; border-width:2px; margin:0 auto;"></div>';

            const duplicate = await db.checkDuplicate(invoice, sheet, state.currentRouteId);

            if (duplicate) {
                const duplicateInfo = [];
                if (duplicate.invoice === invoice) duplicateInfo.push(`• Factura: ${duplicate.invoice}`);
                if (duplicate.sheet === sheet) duplicateInfo.push(`• Planilla: ${duplicate.sheet}`);

                const timeAgo = new Date(duplicate.created_at);
                const minutesAgo = Math.floor((Date.now() - timeAgo.getTime()) / 60000);
                const timeText = minutesAgo < 1 ? 'hace menos de 1 minuto' :
                    minutesAgo === 1 ? 'hace 1 minuto' :
                        `hace ${minutesAgo} minutos`;

                const confirmed = await Alert.confirm(
                    `⚠️ Ya existe una devolución con:\n${duplicateInfo.join('\n')}\n\nRegistrada ${timeText}\n\n¿Estás seguro de continuar?`,
                    '⚠️ Posible Duplicado'
                );

                if (!confirmed) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    return;
                }

                console.warn('⚠️ Usuario confirmó guardar duplicado');
            }

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
