import { db } from '../data.js';
import { auth } from '../auth.js';

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
            myReturns = await db.getRouteReturns(state.currentRouteId);
        }

        if (state.view === 'dashboard') {
            renderDashboard(myReturns, myRoute);
        } else if (state.view === 'form') {
            renderForm();
        }
    };

    const renderDashboard = (returns, currentRoute) => {
        const totalValue = returns.reduce((sum, r) => sum + r.total, 0);

        container.innerHTML = `
            <header class="app-header">
                <div style="color: white; overflow: hidden;">
                    <h3 style="color: white; margin: 0; font-size: 1.1rem;">${(user.name || 'Auxiliar').split(' ')[0]}</h3>
                    <small style="opacity: 0.8; display: block; white-space: nowrap;">${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</small>
                </div>
                <button id="logoutBtn" style="background:none; border:none; color:white;">
                    <span class="material-icons-round">logout</span>
                </button>
            </header>

            <div style="padding: 20px; padding-bottom: 80px;">
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
                    <div class="card" style="background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)); color: white; margin-bottom: 24px;">
                        <div class="flex justify-between items-center">
                            <div>
                                <small style="opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Valor en Devoluciones</small>
                                <h2 style="color: white; font-size: 32px; margin: 4px 0;">$ ${totalValue.toLocaleString()}</h2>
                            </div>
                            <div style="text-align: right; background: rgba(255,255,255,0.2); padding: 12px; border-radius: 12px; backdrop-filter: blur(4px);">
                                <div style="font-size: 24px; font-weight: 800; color: var(--accent-color);">${returns.length}</div>
                                <small style="color: white; font-weight: 600;">Items</small>
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
                                <div class="list-item">
                                    <div>
                                        <div style="font-weight: 600;">${r.name ? r.name.substring(0, 25) : 'Producto'}...</div>
                                        <small>${r.reason} • Cant: ${r.quantity}</small>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 600;">$ ${(r.total || 0).toLocaleString()}</div>
                                        ${r.evidence ? '<span class="material-icons-round" style="font-size: 16px; color: var(--accent-color);">photo_camera</span>' : ''}
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
                    userId: user.id, // ADDED THIS
                    username: user.username,
                    userName: user.name,
                    startTime: new Date().toLocaleTimeString(),
                    date: new Date().toISOString().split('T')[0]
                };
                const createdRoute = await db.addRoute(newRoute);
                if (createdRoute) {
                    state.routeStarted = true;
                    state.currentRouteId = createdRoute.id;
                    window.location.reload();
                } else {
                    alert("Error al iniciar ruta. Intente nuevamente.");
                }
            });
        } else {
            if (currentRoute && currentRoute.status !== 'completed') {
                const header = container.querySelector('.app-header');
                if (header) {
                    header.insertAdjacentHTML('beforeend', `
                            <button id="endRouteBtn" style="background: rgba(255,255,255,0.2); border: none; color: white; margin-right: 12px; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                                FINALIZAR
                            </button>
                        `);

                    document.getElementById('endRouteBtn').addEventListener('click', async () => {
                        if (confirm("¿Estás seguro de que deseas finalizar tu jornada laboral? No podrás registrar más devoluciones hoy.")) {
                            const now = new Date().toLocaleTimeString();
                            const success = await db.updateRoute(state.currentRouteId, { status: 'completed', endTime: now });
                            if (success) {
                                alert("Jornada finalizada correctamente.");
                                window.location.reload();
                            } else {
                                alert("Error al finalizar. Intente de nuevo.");
                            }
                        }
                    });
                }
            } else if (currentRoute && currentRoute.status === 'completed') {
                const header = container.querySelector('.app-header');
                if (header) {
                    header.insertAdjacentHTML('beforeend', `
                            <div style="background: var(--success-color); color: white; margin-right: 12px; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700;">
                                FINALIZADO
                            </div>
                        `);
                }
                const addBtn = document.getElementById('addReturnBtn');
                if (addBtn) addBtn.style.display = 'none';
            }

            const addBtn = document.getElementById('addReturnBtn');
            if (addBtn && (!currentRoute || currentRoute.status !== 'completed')) {
                addBtn.addEventListener('click', async () => {
                    state.view = 'form';
                    await render();
                });
            }
        }

        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.logout();
        });

        if (state.view === 'form') {
            // We need to defer setup to ensure DOM is ready? 
            // Note: in previous code render was async, here it is too.
            // But we are in renderDashboard which is sync called by render.
            // So we cannot await here.
            // Actually, renderDashboard puts HTML, then we attach listeners.
            // Wait, renderForm below puts HTML too.
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
                alert("Por favor selecciona un producto válido de la búsqueda");
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

            const success = await db.addReturn(returnData);

            if (success) {
                alert("Devolución registrada exitosamente");
                state.view = 'dashboard';
                await render();
            } else {
                alert("Error al guardar la devolución");
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
};
