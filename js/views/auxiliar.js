import { db } from '../data.js';
import { auth } from '../auth.js';

export const renderAuxiliarDashboard = (container, user) => {
    let state = {
        view: 'dashboard', // dashboard | form
        routeStarted: false,
        products: db.getInventory(),
        currentRouteId: null
    };

    // Check if route exists for today
    const checkRoute = () => {
        const today = new Date().toISOString().split('T')[0];
        const routes = db.getRoutes();
        const myRoute = routes.find(r => r.userId === user.username && r.date === today);
        if (myRoute) {
            state.routeStarted = true;
            state.currentRouteId = myRoute.id;
        }
    };
    checkRoute();

    const render = () => {
        if (state.view === 'dashboard') {
            renderDashboard();
        } else if (state.view === 'form') {
            renderForm();
        }
    };

    const renderDashboard = () => {
        const returns = db.getReturns().filter(r => r.routeId === state.currentRouteId);
        const totalValue = returns.reduce((sum, r) => sum + r.total, 0);

        container.innerHTML = `
            <header class="app-header">
                <div style="color: white;">
                    <h3 style="color: white; margin: 0;">Hola, ${(user.name || 'Auxiliar').split(' ')[0]}</h3>
                    <small style="opacity: 0.8;">${new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</small>
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
                                        <div style="font-weight: 600;">${r.productName.substring(0, 25)}...</div>
                                        <small>${r.reason} • Cant: ${r.quantity}</small>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-weight: 600;">$ ${r.total.toLocaleString()}</div>
                                        ${r.hasPhoto ? '<span class="material-icons-round" style="font-size: 16px; color: var(--accent-color);">photo_camera</span>' : ''}
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
            document.getElementById('startRouteBtn').addEventListener('click', () => {
                const newRoute = {
                    id: Date.now().toString(),
                    userId: user.username,
                    userName: user.name,
                    date: new Date().toISOString().split('T')[0],
                    startTime: new Date().toLocaleTimeString()
                };
                db.addRoute(newRoute);
                state.routeStarted = true;
                state.currentRouteId = newRoute.id;
                state.currentRouteId = newRoute.id;
                render();
            });
        } else {
            const myRoute = db.getRoutes().find(r => r.id === state.currentRouteId);
            if (myRoute && myRoute.status !== 'completed') {
                container.querySelector('.app-header').insertAdjacentHTML('beforeend', `
                    <button id="endRouteBtn" style="background: rgba(255,255,255,0.2); border: none; color: white; margin-right: 12px; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
                        FINALIZAR
                    </button>
                `);

                document.getElementById('endRouteBtn').addEventListener('click', () => {
                    if (confirm("¿Estás seguro de que deseas finalizar tu jornada laboral? No podrás registrar más devoluciones hoy.")) {
                        const now = new Date().toLocaleTimeString();
                        db.updateRoute(state.currentRouteId, { status: 'completed', endTime: now });
                        alert("Jornada finalizada correctamente.");
                        window.location.reload();
                    }
                });
            } else if (myRoute && myRoute.status === 'completed') {
                container.querySelector('.app-header').insertAdjacentHTML('beforeend', `
                    <div style="background: var(--success-color); color: white; margin-right: 12px; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700;">
                        FINALIZADO
                    </div>
                `);

                // Hide actions if completed
                const addBtn = document.getElementById('addReturnBtn');
                if (addBtn) addBtn.style.display = 'none';
            }

            // Only allow adding return if not completed
            const addBtn = document.getElementById('addReturnBtn');
            if (addBtn && (!myRoute || myRoute.status !== 'completed')) {
                addBtn.addEventListener('click', () => {
                    state.view = 'form';
                    render();
                });
            }
        }

        document.getElementById('logoutBtn').addEventListener('click', () => {
            auth.logout();
        });
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

                    <div class="input-group">
                        <label class="input-label">Producto (Buscar por nombre o código)</label>
                        <input type="text" id="productSearch" list="productList" class="input-field" placeholder="Escribe para buscar..." required autocomplete="off">
                        <datalist id="productList">
                            ${state.products.map(p => `<option value="${p.code} - ${p.name}" data-price="${p.price}"></option>`).join('')}
                        </datalist>
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
                    </div>

                    <button type="submit" class="btn btn-primary mt-md">
                        <span class="material-icons-round">save</span>
                        Guardar Devolución
                    </button>
                </form>
            </div>
        `;

        // Logic for Form
        const productInput = document.getElementById('productSearch');
        const priceInput = document.getElementById('price');
        const qtyInput = document.getElementById('qty');
        const totalSpan = document.getElementById('totalValue');
        const evidenceInput = document.getElementById('evidence');
        const evidenceText = document.getElementById('evidenceText');

        let selectedProduct = null;

        const calculate = () => {
            if (selectedProduct) {
                const qty = parseInt(qtyInput.value) || 0;
                const total = qty * selectedProduct.price;
                totalSpan.textContent = total.toLocaleString();
            }
        };

        productInput.addEventListener('input', (e) => {
            const val = e.target.value;
            // Try to find the product in the list based on the input string "CODE - NAME"
            // This is a bit tricky with datalist as it only gives the value.
            // We can search our products array.
            const code = val.split(' - ')[0];
            const found = state.products.find(p => p.code === code);

            if (found) {
                selectedProduct = found;
                priceInput.value = '$ ' + found.price.toLocaleString();
                calculate();
            } else {
                selectedProduct = null;
                priceInput.value = '';
                totalSpan.textContent = '0';
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
                };
                reader.readAsDataURL(file);
            }
        });

        document.getElementById('returnForm').addEventListener('submit', (e) => {
            e.preventDefault();
            if (!selectedProduct) {
                alert("Por favor selecciona un producto válido de la lista");
                return;
            }

            const formData = new FormData(e.target);

            const returnData = {
                id: Date.now().toString(),
                routeId: state.currentRouteId,
                invoice: formData.get('invoice'),
                sheet: formData.get('sheet'),
                productCode: selectedProduct.code,
                productName: selectedProduct.name,
                price: selectedProduct.price,
                quantity: parseInt(qtyInput.value),
                total: selectedProduct.price * parseInt(qtyInput.value),
                reason: formData.get('reason'),
                evidence: capturedPhoto, // Store full base64
                hasPhoto: !!capturedPhoto, // flag for icon
                timestamp: new Date().toISOString()
            };

            db.addReturn(returnData);
            alert("Devolución registrada exitosamente");
            state.view = 'dashboard';
            render();
        });

        document.getElementById('backBtn').addEventListener('click', () => {
            state.view = 'dashboard';
            render();
        });
    };

    render();
};
