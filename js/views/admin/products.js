export const renderProductos = () => `
    <header style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px;">
        <div>
            <h1 style="color: var(--primary-color);">Búsqueda de Productos</h1>
            <p>Consulta rápida de catálogo e inventario</p>
        </div>
        <div style="width: 350px;">
            <input type="text" id="productSearch" class="input-field" placeholder="Buscar por nombre o código..." style="height: 48px; border-radius: 12px;">
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
