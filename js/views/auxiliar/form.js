import { db } from '../../data.js';
import { Alert } from '../../utils/ui.js';

export const renderForm = (container, user, state, render) => {
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
                <div style="display: flex; gap: 12px; margin-bottom: 20px; background: #f1f5f9; padding: 4px; border-radius: 12px;">
                    <label style="flex: 1; text-align: center; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;" class="type-option active" data-value="partial">
                        <input type="radio" name="returnType" value="partial" checked class="hidden"> Parcial
                    </label>
                    <label style="flex: 1; text-align: center; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; color: var(--text-secondary);" class="type-option" data-value="total">
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

                <!-- Multi-Product Section (Only for Partial) -->
                <div id="multiProductSection" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 12px; font-size: 14px; color: var(--text-secondary); border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Productos a Devolver</h4>
                    
                    <div id="productSelectionGroup">
                        <div class="input-group" style="position: relative; margin-bottom: 12px;">
                            <label class="input-label">Buscar Producto</label>
                            <input type="text" id="productSearch" class="input-field" placeholder="Escribe para buscar..." autocomplete="off">
                            <ul id="searchResults" class="search-results-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; background:white; border:1px solid #ddd; border-radius:8px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); z-index:100; max-height:200px; overflow-y:auto; list-style:none; padding:0; margin:4px 0 0 0;"></ul>
                        </div>

                        <div class="flex gap-md" style="margin-bottom: 12px;">
                            <div class="input-group w-full">
                                <label class="input-label">Cantidad</label>
                                <input type="number" id="qty" class="input-field" min="1" value="1">
                            </div>
                            <div class="input-group w-full">
                                <label class="input-label">Precio Unit.</label>
                                <input type="text" id="price" class="input-field" readonly style="background-color: #f1f5f9;">
                            </div>
                        </div>

                        <button type="button" id="addProductBtn" class="btn btn-secondary" style="width: 100%; background: var(--primary-color); color: white; border: none;">
                            <span class="material-icons-round">add</span> Agregar Producto
                        </button>
                    </div>

                    <div id="addedProductsList" style="margin-top: 16px;">
                        <!-- List of items will appear here -->
                        <div style="text-align: center; color: var(--text-light); padding: 12px; font-size: 13px;">No se han agregado productos</div>
                    </div>
                </div>

                <div id="totalReturnSection" class="hidden">
                    <div class="input-group">
                        <label class="input-label">Valor Total Devolución</label>
                        <input type="text" inputmode="numeric" id="manualTotalInput" class="input-field" placeholder="Ingrese el valor total">
                    </div>
                </div>

                <div class="input-group" id="totalDisplaySection">
                    <label class="input-label">Resumen de Valor</label>
                    <div style="font-size: 28px; font-weight: 800; color: var(--accent-color);">$ <span id="totalValue">0</span></div>
                </div>

                <div class="input-group">
                    <label class="input-label">Razón</label>
                    <select name="reason" id="reasonSelect" class="input-field" required></select>
                </div>

                <div id="manualReasonGroup" class="input-group hidden">
                    <label class="input-label">Especifique el motivo</label>
                    <input type="text" id="manualReasonInput" class="input-field" placeholder="Escriba la razón..." autocomplete="off">
                </div>

                <div class="input-group">
                    <label class="input-label">Evidencia <span style="color: #ef4444; font-weight: 800;">(OBLIGATORIO)</span></label>
                    <div style="display: flex; gap: 8px;">
                        <label for="evidenceCamera" class="btn btn-secondary" style="flex: 1; justify-content: center; border: 2px dashed #cbd5e1; background: #f8fafc;">
                            <span class="material-icons-round">camera_alt</span>
                            <span>Foto</span>
                        </label>
                        <label for="evidenceGallery" class="btn btn-secondary" style="flex: 1; justify-content: center; border: 2px dashed #cbd5e1; background: #f8fafc;">
                            <span class="material-icons-round">photo_library</span>
                            <span>Galería</span>
                        </label>
                    </div>
                    <input type="file" id="evidenceCamera" accept="image/*" capture="environment" class="hidden">
                    <input type="file" id="evidenceGallery" accept="image/*" class="hidden">
                    <div id="evidenceStatus" style="margin-top: 8px; padding: 8px; border-radius: 6px; background: #f1f5f9; display: none; font-size: 14px; font-weight: 600; color: var(--success-color); text-align: center;">
                        <span class="material-icons-round" style="font-size: 16px; vertical-align: middle;">check_circle</span>
                        Evidencia lista
                    </div>
                    <img id="evidencePreview" src="" alt="Preview" style="max-width: 100%; margin-top: 10px; display: none; border-radius: 8px; box-shadow: var(--shadow-premium);">
                </div>

                <button type="submit" id="submitBtn" class="btn btn-primary mt-md" style="height: 56px; font-size: 18px;"><span class="material-icons-round">save</span> Guardar Registro</button>
                <button type="button" id="cancelBtn" class="btn btn-secondary mt-sm">Cancelar</button>
            </form>
        </div>
    `;

    // Elements
    const form = document.getElementById('returnForm');
    const productInput = document.getElementById('productSearch');
    const searchResults = document.getElementById('searchResults');
    const qtyInput = document.getElementById('qty');
    const priceInput = document.getElementById('price');
    const addProductBtn = document.getElementById('addProductBtn');
    const addedProductsList = document.getElementById('addedProductsList');
    const totalSpan = document.getElementById('totalValue');
    const manualTotalInput = document.getElementById('manualTotalInput');
    const multiProductSection = document.getElementById('multiProductSection');
    const totalReturnSection = document.getElementById('totalReturnSection');
    const evidenceCameraInput = document.getElementById('evidenceCamera');
    const evidenceGalleryInput = document.getElementById('evidenceGallery');
    const evidenceStatus = document.getElementById('evidenceStatus');
    const evidencePreview = document.getElementById('evidencePreview');
    const reasonSelect = document.getElementById('reasonSelect');
    const manualReasonGroup = document.getElementById('manualReasonGroup');
    const manualReasonInput = document.getElementById('manualReasonInput');
    const typeOptions = document.querySelectorAll('.type-option');
    const submitBtn = document.getElementById('submitBtn');

    // State for multiple products
    let selectedProducts = [];
    let tempSelectedProduct = null;
    let currentType = 'partial';
    let capturedPhoto = null;

    // --- Auto-save Persistence Logic ---
    const STORAGE_KEY = `return_draft_${user.id}`;

    const saveState = () => {
        const draft = {
            invoice: form.invoice.value,
            sheet: form.sheet.value,
            selectedProducts,
            currentType,
            reason: reasonSelect.value,
            manualReason: manualReasonInput.value
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    };

    const loadState = () => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        try {
            const draft = JSON.parse(saved);
            form.invoice.value = draft.invoice || '';
            form.sheet.value = draft.sheet || '';
            selectedProducts = draft.selectedProducts || [];
            currentType = draft.currentType || 'partial';

            updateUIForType(currentType);

            if (draft.reason) {
                reasonSelect.value = draft.reason;
                reasonSelect.dispatchEvent(new Event('change'));
            }
            if (draft.manualReason) manualReasonInput.value = draft.manualReason;

            renderProductsList();
            updateTotal();
        } catch (e) { console.error("Error loading draft", e); }
    };

    const clearState = () => sessionStorage.removeItem(STORAGE_KEY);

    const REASONS_PARTIAL = ["Producto averiado", "Error de despacho", "Rechazo del cliente", "Sin dinero", "Error de facturación", "Error de vendedor", "Faltante", "Otro"];
    const REASONS_TOTAL = ["Negocio cerrado", "Sin dinero", "Fuera de ruta", "Error de facturación", "Error de vendedor", "Faltante", "Otro"];

    const updateUIForType = (type) => {
        currentType = type;
        const isPartial = type === 'partial';
        typeOptions.forEach(opt => opt.classList.toggle('active', opt.dataset.value === type));

        multiProductSection.classList.toggle('hidden', !isPartial);
        totalReturnSection.classList.toggle('hidden', isPartial);
        manualTotalInput.required = !isPartial;

        // Reset inputs but preserve business identity
        tempSelectedProduct = null;
        productInput.value = '';
        priceInput.value = '';
        qtyInput.value = '1';

        renderProductsList();
        updateTotal();

        reasonSelect.innerHTML = '<option value="">Seleccionar...</option>';
        (isPartial ? REASONS_PARTIAL : REASONS_TOTAL).forEach(r => {
            const opt = document.createElement('option'); opt.value = r; opt.textContent = r; reasonSelect.appendChild(opt);
        });

        saveState();
    };

    const renderProductsList = () => {
        if (selectedProducts.length === 0) {
            addedProductsList.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 12px; font-size: 13px;">No se han agregado productos</div>';
            return;
        }

        addedProductsList.innerHTML = selectedProducts.map((p, index) => `
            <div style="display: flex; align-items: center; gap: 12px; padding: 10px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 14px;">${p.name}</div>
                    <div style="font-size: 12px; color: var(--text-light);">${p.quantity} x $ ${p.price.toLocaleString()} = <b>$ ${p.total.toLocaleString()}</b></div>
                </div>
                <button type="button" class="remove-product" data-index="${index}" style="background: #fee2e2; border: none; color: #ef4444; padding: 6px; border-radius: 6px; cursor: pointer;">
                    <span class="material-icons-round" style="font-size: 18px;">delete</span>
                </button>
            </div>
        `).join('');

        document.querySelectorAll('.remove-product').forEach(btn => {
            btn.onclick = () => {
                selectedProducts.splice(parseInt(btn.dataset.index), 1);
                renderProductsList();
                updateTotal();
                saveState();
            };
        });
    };

    const updateTotal = () => {
        if (currentType === 'partial') {
            const total = selectedProducts.reduce((sum, p) => sum + p.total, 0);
            totalSpan.textContent = total.toLocaleString();
        } else {
            const val = parseInt(manualTotalInput.value.replace(/\D/g, '')) || 0;
            totalSpan.textContent = val.toLocaleString();
        }
    };

    // Initial Setup
    updateUIForType('partial');
    loadState(); // Restore draft if exists

    // Listeners for auto-save
    form.invoice.oninput = form.sheet.oninput = saveState;
    manualTotalInput.oninput = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        e.target.value = val ? new Intl.NumberFormat('es-CO').format(val) : '';
        updateTotal();
        saveState();
    };

    typeOptions.forEach(opt => opt.addEventListener('click', () => updateUIForType(opt.dataset.value)));

    reasonSelect.addEventListener('change', (e) => {
        const isOtro = e.target.value === 'Otro';
        manualReasonGroup.classList.toggle('hidden', !isOtro);
        manualReasonInput.required = isOtro;
        if (!isOtro) manualReasonInput.value = '';
        saveState();
    });

    manualReasonInput.oninput = saveState;

    productInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (!query) { searchResults.style.display = 'none'; return; }
        clearTimeout(window.searchDebounce);
        window.searchDebounce = setTimeout(async () => {
            const org = user.organization || 'TAT';
            const results = await db.searchProducts(query, org, user.username);
            searchResults.innerHTML = results.map(p => `
                <li style="padding: 12px; border-bottom: 1px solid #eee; cursor: pointer;" data-code="${p.code}" data-name="${p.name}" data-price="${p.price}">
                    <div style="font-weight: 600;">${p.code} - ${p.name}</div>
                    <div style="font-size: 12px; color: #666;">$ ${p.price.toLocaleString()}</div>
                </li>
            `).join('') || '<li style="padding: 12px;">Sin resultados</li>';
            searchResults.style.display = 'block';
        }, 300);
    });

    searchResults.onclick = (e) => {
        const li = e.target.closest('li');
        if (li && li.dataset.code) {
            tempSelectedProduct = { code: li.dataset.code, name: li.dataset.name, price: parseInt(li.dataset.price) };
            productInput.value = `${tempSelectedProduct.code} - ${tempSelectedProduct.name}`;
            priceInput.value = `$ ${tempSelectedProduct.price.toLocaleString()}`;
            searchResults.style.display = 'none';
        }
    };

    addProductBtn.onclick = () => {
        if (!tempSelectedProduct) return Alert.error("Seleccione un producto");
        const qty = parseInt(qtyInput.value) || 0;
        if (qty <= 0) return Alert.error("Ingrese una cantidad válida");

        selectedProducts.push({
            ...tempSelectedProduct,
            quantity: qty,
            total: tempSelectedProduct.price * qty
        });

        // Reset selectors
        productInput.value = '';
        priceInput.value = '';
        qtyInput.value = '1';
        tempSelectedProduct = null;

        renderProductsList();
        updateTotal();
        saveState();
    };

    const handleEvidenceChange = (e) => {
        if (e.target.files.length) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                capturedPhoto = ev.target.result;
                evidenceStatus.style.display = 'block';
                evidencePreview.src = capturedPhoto;
                evidencePreview.style.display = 'block';
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    evidenceCameraInput.onchange = handleEvidenceChange;
    evidenceGalleryInput.onchange = handleEvidenceChange;

    form.onsubmit = async (e) => {
        e.preventDefault();
        if (submitBtn.disabled) return;

        const fd = new FormData(form);
        const invoice = fd.get('invoice').trim();
        const sheet = fd.get('sheet').trim();
        let reason = fd.get('reason');
        if (reason === 'Otro') reason = manualReasonInput.value.trim();

        // Validation
        if (!invoice || !sheet) return Alert.error("Factura y Planilla son obligatorias");
        if (!reason) return Alert.error("Seleccione una razón");
        if (!capturedPhoto) return Alert.error("La evidencia fotográfica es obligatoria");

        const submissions = [];
        const timestamp = new Date().toISOString();

        if (currentType === 'partial') {
            if (selectedProducts.length === 0) return Alert.error("Agregue al menos un producto");

            selectedProducts.forEach(p => {
                submissions.push({
                    routeId: state.currentRouteId,
                    invoice, sheet, reason,
                    evidence: capturedPhoto,
                    timestamp,
                    productCode: p.code,
                    productName: p.name,
                    quantity: p.quantity,
                    total: p.total,
                    submissionId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)
                });
            });
        } else {
            const totalValue = parseInt(manualTotalInput.value.replace(/\D/g, '')) || 0;
            if (totalValue <= 0) return Alert.error("Ingrese un valor total válido");

            submissions.push({
                routeId: state.currentRouteId,
                invoice, sheet, reason,
                evidence: capturedPhoto,
                timestamp,
                productName: "DEVOLUCIÓN TOTAL",
                quantity: 1,
                total: totalValue,
                submissionId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)
            });
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-icons-round spinning">sync</span> Guardando...';

        const success = await db.addReturnsBatch(submissions);

        if (success) {
            clearState();
            Alert.success("Devoluciones registradas");
            setTimeout(() => {
                state.view = 'dashboard';
                render();
            }, 500);
        } else {
            Alert.error("Error al guardar algunos registros");
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="material-icons-round">save</span> Guardar Registro';
        }
    };

    document.getElementById('backBtn').onclick = document.getElementById('cancelBtn').onclick = () => {
        state.view = 'dashboard'; render();
    };
};
