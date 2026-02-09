import { formatPrice, formatDateTime } from '../../utils/formatters.js';
import { Alert } from '../../utils/ui.js';

export const renderRefacturacion = (cache) => {
    let searchTerm = '';

    const renderTable = () => {
        const filtered = cache.resales.filter(r =>
            r.resaleCustomerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.auxiliarName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const container = document.getElementById('refacturacion-results');
        if (!container) return;

        if (filtered.length === 0) {
            container.innerHTML = `<tr><td colspan="7" style="padding: 40px; text-align: center; color: var(--text-light);">No se encontraron reventas.</td></tr>`;
            return;
        }

        container.innerHTML = filtered.map(r => `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 12px; font-weight: 700; color: var(--secondary-accent);">${r.resaleCustomerCode}</td>
                <td style="padding: 12px;">
                    <div style="font-weight: 600; font-size: 13px;">${r.productName} ${r.size ? `<span style="background: #e2e8f0; color: #475569; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700;">Talla ${r.size}</span>` : ''}</div>
                    <small style="color: var(--text-light);">Doc: ${r.invoice} • Cant: ${r.quantity}</small>
                </td>
                <td style="padding: 12px; font-weight: 600;">${r.auxiliarName}</td>
                <td style="padding: 12px; text-align: right; font-weight: 700;">${formatPrice(r.total)}</td>
                <td style="padding: 12px; font-size: 11px; color: var(--text-light); text-align: center;">
                    ${formatDateTime(r.resaleTimestamp || r.timestamp)}
                </td>
                <td style="padding: 12px; text-align: center;">
                    <span style="background: rgba(34, 197, 94, 0.1); color: var(--success-color); padding: 4px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; text-transform: uppercase;">Revendido</span>
                </td>
                <td style="padding: 12px; text-align: center;">
                    ${r.evidence ? `<button class="view-photo-btn" data-photo="${r.evidence}" style="background: rgba(0,174,239,0.1); border: none; color: var(--accent-color); padding: 6px; border-radius: 8px; cursor: pointer;"><span class="material-icons-round" style="font-size: 18px;">image</span></button>` : '-'}
                </td>
            </tr>
        `).join('');

        // Re-attach photo events
        container.querySelectorAll('.view-photo-btn').forEach(btn => {
            btn.onclick = () => {
                const photo = btn.dataset.photo;
                if (window.showPhotoModal) window.showPhotoModal(photo);
                else Alert.info("Imagen no disponible", "Ver Evidencia");
            };
        });
    };

    const searchInput = document.getElementById('refacturacionSearch');
    if (searchInput) {
        searchInput.oninput = (e) => {
            searchTerm = e.target.value;
            renderTable();
        };
    }

    // Initial render
    setTimeout(renderTable, 0);

    return `
        <div class="animate-fade-in">
            <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: var(--primary-color);">Refacturación</h1>
                    <p style="margin: 4px 0 0; color: var(--text-light); font-size: 13px;">Seguimiento de productos revendidos a nuevos clientes</p>
                </div>
            </header>

            <div class="card" style="padding: 0; overflow: hidden;">
                <div style="padding: 20px; border-bottom: 1px solid #f1f5f9; background: white; display: flex; gap: 16px; align-items: center;">
                    <div style="flex: 1; position: relative;">
                        <span class="material-icons-round" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-light); font-size: 20px;">search</span>
                        <input type="text" id="refacturacionSearch" placeholder="Buscar por cliente, producto, factura o auxiliar..." 
                               style="width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 10px 10px 40px; font-size: 13px; font-family: inherit; transition: all 0.2s;"
                               onfocus="this.style.borderColor='var(--accent-color)'; this.style.boxShadow='0 0 0 3px rgba(0,174,239,0.1)'"
                               onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'">
                    </div>
                </div>

                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                        <thead style="background: rgba(0,34,77,0.03); color: var(--text-secondary); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                            <tr>
                                <th style="padding: 12px; text-align: left;">Cliente</th>
                                <th style="padding: 12px; text-align: left;">Producto / Factura</th>
                                <th style="padding: 12px; text-align: left;">Auxiliar</th>
                                <th style="padding: 12px; text-align: right;">Total</th>
                                <th style="padding: 12px; text-align: center;">Fecha Reventa</th>
                                <th style="padding: 12px; text-align: center;">Estado</th>
                                <th style="padding: 12px; text-align: center;">Evidencia</th>
                            </tr>
                        </thead>
                        <tbody id="refacturacion-results">
                            <!-- Results will be injected here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
};
