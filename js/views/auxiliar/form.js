import { db } from '../../data.js';
import { Alert } from '../../utils/ui.js';

export const renderForm = (container, state, render) => {
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

                <div id="productSection" class="input-group" style="position: relative;">
                    <label class="input-label">Producto</label>
                    <input type="text" id="productSearch" class="input-field" placeholder="Escribe para buscar..." autocomplete="off">
                    <ul id="searchResults" class="search-results-dropdown" style="display:none; position:absolute; top:100%; left:0; right:0; background:white; border:1px solid #ddd; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.1); z-index:10; max-height:200px; overflow-y:auto; list-style:none; padding:0; margin:4px 0 0 0;"></ul>
                </div>

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

                <div class="input-group">
                    <label class="input-label">Valor Total</label>
                    <div id="computedTotalDisplay" style="font-size: 24px; font-weight: 700; color: var(--accent-color);">$ <span id="totalValue">0</span></div>
                    <input type="text" inputmode="numeric" id="manualTotalInput" class="input-field hidden" placeholder="Ingrese el valor total">
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
                    <label class="input-label">Evidencia</label>
                    <label for="evidence" class="btn btn-secondary w-full" style="justify-content: flex-start;">
                        <span class="material-icons-round">camera_alt</span>
                        <span id="evidenceText">Tomar Foto</span>
                    </label>
                    <input type="file" id="evidence" accept="image/*" capture="environment" class="hidden">
                    <img id="evidencePreview" src="" alt="Preview" style="max-width: 100%; margin-top: 10px; display: none; border-radius: 8px;">
                </div>

                <button type="submit" class="btn btn-primary mt-md"><span class="material-icons-round">save</span> Guardar</button>
                <button type="button" id="cancelBtn" class="btn btn-secondary mt-sm">Cancelar</button>
            </form>
        </div>
    `;

    const productInput = document.getElementById('productSearch');
    const searchResults = document.getElementById('searchResults');
    const totalSpan = document.getElementById('totalValue');
    const manualTotalInput = document.getElementById('manualTotalInput');
    const evidenceInput = document.getElementById('evidence');
    const reasonSelect = document.getElementById('reasonSelect');
    const manualReasonGroup = document.getElementById('manualReasonGroup');
    const manualReasonInput = document.getElementById('manualReasonInput');
    const typeOptions = document.querySelectorAll('.type-option');

    let selectedProduct = null;
    let currentType = 'partial';
    let capturedPhoto = null;

    const REASONS_PARTIAL = ["Producto vencido", "Producto averiado", "Error de despacho", "Rechazo del cliente", "Sin dinero", "Otro"];
    const REASONS_TOTAL = ["Negocio cerrado", "Sin dinero", "Fuera de ruta", "Otro"];

    const updateUIForType = (type) => {
        currentType = type;
        const isPartial = type === 'partial';
        typeOptions.forEach(opt => opt.classList.toggle('active', opt.dataset.value === type));

        document.getElementById('productSection').classList.toggle('hidden', !isPartial);
        document.getElementById('qtyPriceSection').classList.toggle('hidden', !isPartial);
        document.getElementById('computedTotalDisplay').classList.toggle('hidden', !isPartial);
        manualTotalInput.classList.toggle('hidden', isPartial);

        productInput.required = isPartial;
        manualTotalInput.required = !isPartial;

        // Reset manual reason
        manualReasonGroup.classList.add('hidden');
        manualReasonInput.value = '';
        manualReasonInput.required = false;

        reasonSelect.innerHTML = '<option value="">Seleccionar...</option>';
        (isPartial ? REASONS_PARTIAL : REASONS_TOTAL).forEach(r => {
            const opt = document.createElement('option'); opt.value = r; opt.textContent = r; reasonSelect.appendChild(opt);
        });
    };

    updateUIForType('partial');

    typeOptions.forEach(opt => opt.addEventListener('click', () => updateUIForType(opt.dataset.value)));

    reasonSelect.addEventListener('change', (e) => {
        const isOtro = e.target.value === 'Otro';
        manualReasonGroup.classList.toggle('hidden', !isOtro);
        manualReasonInput.required = isOtro;
        if (!isOtro) manualReasonInput.value = '';
    });

    const calculate = () => {
        if (currentType === 'partial' && selectedProduct) {
            totalSpan.textContent = (parseInt(document.getElementById('qty').value || 1) * selectedProduct.price).toLocaleString();
        }
    };

    productInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (!query) { searchResults.style.display = 'none'; return; }
        clearTimeout(window.searchDebounce);
        window.searchDebounce = setTimeout(async () => {
            const results = await db.searchProducts(query);
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
            selectedProduct = { code: li.dataset.code, name: li.dataset.name, price: parseInt(li.dataset.price) };
            productInput.value = `${selectedProduct.code} - ${selectedProduct.name}`;
            document.getElementById('price').value = `$ ${selectedProduct.price.toLocaleString()}`;
            searchResults.style.display = 'none';
            calculate();
        }
    };

    document.getElementById('qty').oninput = calculate;
    manualTotalInput.oninput = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        e.target.value = val ? new Intl.NumberFormat('es-CO').format(val) : '';
    };

    evidenceInput.onchange = (e) => {
        if (e.target.files.length) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                capturedPhoto = ev.target.result;
                document.getElementById('evidenceText').textContent = "Foto OK ✓";
                document.getElementById('evidencePreview').src = capturedPhoto;
                document.getElementById('evidencePreview').style.display = 'block';
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    document.getElementById('returnForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = {
            routeId: state.currentRouteId,
            invoice: fd.get('invoice'),
            sheet: fd.get('sheet'),
            reason: fd.get('reason'),
            evidence: capturedPhoto,
            timestamp: new Date().toISOString()
        };

        if (data.reason === 'Otro') {
            data.reason = manualReasonInput.value.trim();
        }

        if (currentType === 'partial') {
            if (!selectedProduct) return Alert.error("Selecciona un producto");
            data.productCode = selectedProduct.code;
            data.productName = selectedProduct.name;
            data.quantity = parseInt(document.getElementById('qty').value);
            data.total = selectedProduct.price * data.quantity;
        } else {
            data.productName = "DEVOLUCIÓN TOTAL";
            data.quantity = 1;
            data.total = parseInt(manualTotalInput.value.replace(/\D/g, '')) || 0;
        }

        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true; btn.innerHTML = 'Guardando...';

        // Optimized for SPEED: Skip remote duplicate check
        /*
        const dup = await db.checkDuplicate(data.invoice, data.sheet, state.currentRouteId);
        if (dup && !(await Alert.confirm(`⚠️ Posible duplicado (Doc: ${data.invoice}). ¿Continuar?`, 'Confirmar'))) {
            btn.disabled = false; btn.innerHTML = 'Guardar'; return;
        }
        */

        if (await db.addReturn(data)) {
            Alert.success("Registrado correctamente");
            // Small delay to ensure logic clears before render, though not strictly needed with optimistic UI
            setTimeout(() => { state.view = 'dashboard'; render(); }, 100);
        } else {
            Alert.error("Error al guardar");
            btn.disabled = false; btn.innerHTML = 'Guardar';
        }
    };

    document.getElementById('backBtn').onclick = document.getElementById('cancelBtn').onclick = () => {
        state.view = 'dashboard'; render();
    };
};
