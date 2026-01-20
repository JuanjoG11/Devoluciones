import { formatPrice } from '../../utils/formatters.js';
import { Alert } from '../../utils/ui.js';
import { db } from '../../data.js';

export const renderResaleForm = (container, user, state, selectedItems, render) => {
    const total = selectedItems.reduce((sum, item) => sum + item.total, 0);

    container.innerHTML = `
        <header class="app-header">
            <button id="backToDashboard" style="background:none; border:none; color:white; cursor:pointer;">
                <span class="material-icons-round">arrow_back</span>
            </button>
            <h3 style="color: white; margin: 0; flex: 1; text-align: center;">Nueva Reventa</h3>
            <div style="width: 40px;"></div>
        </header>

        <div class="main-content" style="padding: 20px;">
            <div class="card" style="margin-bottom: 24px;">
                <h4 style="margin-top: 0; color: var(--primary-color);">Resumen de Selección</h4>
                <div style="max-height: 250px; overflow-y: auto; margin-bottom: 16px;">
                    ${selectedItems.map((item, index) => `
                        <div class="resale-item-row" data-index="${index}" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; gap: 12px;">
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.productName || item.name}</div>
                                <div style="font-size: 11px; color: #64748b;">Precio unit: ${formatPrice(item.total / item.quantity)}</div>
                            </div>
                            
                            <div style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 4px; border-radius: 12px;">
                                <button class="qty-btn" data-action="dec" data-index="${index}" style="width: 28px; height: 28px; border-radius: 8px; border: none; background: white; color: var(--primary-color); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                                    <span class="material-icons-round" style="font-size: 18px;">remove</span>
                                </button>
                                <span class="qty-val" style="font-weight: 800; min-width: 20px; text-align: center;">${item.quantity}</span>
                                <button class="qty-btn" data-action="inc" data-index="${index}" style="width: 28px; height: 28px; border-radius: 8px; border: none; background: white; color: var(--primary-color); display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                                    <span class="material-icons-round" style="font-size: 18px;">add</span>
                                </button>
                            </div>

                            <div style="font-weight: 700; font-size: 13px; color: var(--secondary-accent); min-width: 70px; text-align: right;">
                                ${formatPrice(item.total)}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 16px; border-top: 2px solid var(--primary-color); padding-top: 12px;">
                    <span>TOTAL REVENTA</span>
                    <span id="resaleTotalDisplay" style="color: var(--secondary-accent);">${formatPrice(total)}</span>
                </div>
            </div>

            <div class="card">
                <div class="form-group">
                    <label class="label">CÓDIGO DE CLIENTE</label>
                    <input type="text" id="customerCode" class="input-field" placeholder="Ej: 12345" autocomplete="off" inputmode="numeric">
                </div>
                <!-- Optional: extra details if user meant something by 'y la reventa' -->
                <div class="form-group">
                    <label class="label">NOTAS / REFERENCIA (Opcional)</label>
                    <textarea id="resaleNotes" class="input-field" style="height: 80px; resize: none;" placeholder="Detalles de la reventa..."></textarea>
                </div>

                <button id="confirmResale" class="btn btn-primary" style="width: 100%; margin-top: 20px; height: 54px; font-weight: 800;">
                    <span class="material-icons-round">check_circle</span>
                    PROCESAR REVENTA
                </button>
            </div>
        </div>
    `;

    // Local state for quantities
    const itemsState = selectedItems.map(i => ({
        ...i,
        resaleQuantity: i.quantity,
        unitPrice: i.total / i.quantity
    }));

    const updateTotal = () => {
        const newTotal = itemsState.reduce((sum, item) => sum + (item.resaleQuantity * item.unitPrice), 0);
        const totalEl = document.getElementById('resaleTotalDisplay');
        if (totalEl) totalEl.textContent = formatPrice(newTotal);
        return newTotal;
    };

    // Attach quantity listeners
    container.querySelectorAll('.qty-btn').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.index);
            const action = btn.dataset.action;
            const item = itemsState[idx];
            const row = btn.closest('.resale-item-row');

            if (action === 'inc' && item.resaleQuantity < item.quantity) {
                item.resaleQuantity++;
            } else if (action === 'dec' && item.resaleQuantity > 1) {
                item.resaleQuantity--;
            }

            // Update UI
            row.querySelector('.qty-val').textContent = item.resaleQuantity;
            row.querySelector('div:last-child').textContent = formatPrice(item.resaleQuantity * item.unitPrice);
            updateTotal();
        };
    });

    document.getElementById('backToDashboard').onclick = () => {
        state.view = 'dashboard';
        state.selectedItems = [];
        render();
    };

    document.getElementById('confirmResale').onclick = async () => {
        const customerCode = document.getElementById('customerCode').value.trim();
        const notes = document.getElementById('resaleNotes').value.trim();

        if (!customerCode) {
            Alert.error("Por favor ingresa el código del cliente.");
            return;
        }

        const confirmed = await Alert.confirm(`¿Confirmas la reventa de estos items al cliente ${customerCode}?`, "Confirmar Reventa");
        if (confirmed) {
            const resaleData = {
                routeId: state.currentRouteId,
                customerCode,
                notes,
                items: itemsState.map(i => ({
                    id: i.id,
                    quantity: i.resaleQuantity,
                    total: i.resaleQuantity * i.unitPrice
                })),
                total: updateTotal(),
                timestamp: new Date().toISOString()
            };

            const success = await db.processResale(resaleData);
            if (success) {
                Alert.success(`✅ Reventa de ${selectedItems.length} items procesada correctamente para el cliente ${customerCode}.`);
                state.view = 'dashboard';
                state.isSelectingForResale = false;
                state.selectedItems = [];
                setTimeout(render, 300);
            } else {
                Alert.error("Error al procesar la reventa.");
            }
        }
    };
};
