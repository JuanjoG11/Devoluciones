export const renderProductos = () => `
    <header style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px;">
        <div>
            <h1 style="color: var(--primary-color);">Gesti&oacute;n de Productos</h1>
            <p>Cat&aacute;logo de productos y control de precios</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
            <div style="width: 300px;">
                <input type="text" id="productSearch" class="input-field" placeholder="Buscar por nombre o c&oacute;digo..." style="height: 48px; border-radius: 12px;">
            </div>
            <button id="addNewProductBtn" class="btn btn-primary" style="height: 48px; padding: 0 20px; background: var(--success-color); border: none; font-weight: 700;">
                <span class="material-icons-round">add</span> NUEVO
            </button>
        </div>
    </header>
    <div class="card" style="padding: 0;">
        <div id="productTableContainer">
            <div style="padding: 60px; text-align: center; color: var(--text-light);">
                <span class="material-icons-round" style="font-size: 48px; opacity: 0.3;">search</span>
                <p>Ingresa al menos 2 caracteres para buscar.</p>
            </div>
        </div>
    </div>
`;
