export const renderProductos = () => `
    <header style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px;">
        <div>
            <h1 style="color: var(--primary-color); font-weight: 800; letter-spacing: -1px;">Gestión de Productos</h1>
            <p style="color: var(--text-light); font-weight: 500;">Catálogo maestro y control de precios en tiempo real</p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
            <div style="width: 320px; position: relative;">
                <span class="material-icons-round" style="position: absolute; left: 12px; top: 12px; color: var(--text-light); opacity: 0.5;">search</span>
                <input type="text" id="productSearch" class="input-field" placeholder="Nombre o código..." style="height: 48px; border-radius: 12px; padding-left: 44px; width: 100%;">
            </div>
            <button id="addNewProductBtn" class="btn btn-primary" style="height: 48px; padding: 0 24px; background: var(--success-color); border: none; font-weight: 800; border-radius: 12px; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);">
                <span class="material-icons-round" style="margin-right: 4px;">add</span>NUEVO
            </button>
        </div>
    </header>
    <div class="card" style="padding: 0; min-height: 400px; display: flex; flex-direction: column;">
        <div id="productTableContainer" style="flex: 1;">
            <div style="padding: 100px 20px; text-align: center; color: var(--text-light); opacity: 0.6;">
                <span class="material-icons-round" style="font-size: 80px; margin-bottom: 16px;">inventory_2</span>
                <p style="font-size: 18px; font-weight: 600;">Busca un producto para empezar</p>
                <p style="font-size: 14px;">Ingresa al menos 2 caracteres en el buscador</p>
            </div>
        </div>
    </div>
`;

export const initProductos = (user, db, formatPrice, Alert) => {
    const prodSearch = document.getElementById('productSearch');
    const addNewBtn = document.getElementById('addNewProductBtn');
    const container = document.getElementById('productTableContainer');

    if (!prodSearch || !addNewBtn || !container) return;

    let debounceTimer;

    const showProductModal = async (product = null) => {
        return new Promise((resolve) => {
            const isEdit = !!product;
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:10000; display:flex; align-items:center; justify-content:center;';
            overlay.innerHTML = `
                <div class="modal-card" style="background:white; padding:32px; border-radius:24px; width:100%; max-width:400px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.2);">
                    <div style="background: var(--primary-light); color: var(--primary-color); width:56px; height:56px; border-radius:18px; display:flex; align-items:center; justify-content:center; margin-bottom:20px;">
                        <span class="material-icons-round" style="font-size:32px;">${isEdit ? 'edit' : 'add_shopping_cart'}</span>
                    </div>
                    <h2 style="font-size:24px; font-weight:800; margin-bottom:8px;">${isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                    <p style="color:var(--text-light); font-size:14px; margin-bottom:24px;">Complete los datos del producto para el catálogo maestro.</p>
                    
                    <div style="text-align: left;">
                        <label style="font-size: 11px; font-weight:700; color: var(--text-secondary); margin-bottom:6px; display: block; text-transform:uppercase; letter-spacing:0.5px;">Código de Producto</label>
                        <input type="text" id="modal-code" class="input-field" value="${product?.code || ''}" ${isEdit ? 'readonly' : ''} placeholder="Ej: 102030" style="width: 100%; box-sizing: border-box; margin-bottom: 20px; height:48px; border-radius:12px; border:2px solid #e2e8f0; font-weight:600;">
                        
                        <label style="font-size: 11px; font-weight:700; color: var(--text-secondary); margin-bottom:6px; display: block; text-transform:uppercase; letter-spacing:0.5px;">Nombre del Producto</label>
                        <input type="text" id="modal-name" class="input-field" value="${product?.name || ''}" placeholder="Ej: GUAYO FUTSAL AZUL" style="width: 100%; box-sizing: border-box; margin-bottom: 20px; height:48px; border-radius:12px; border:2px solid #e2e8f0; font-weight:600;">
                        
                        <label style="font-size: 11px; font-weight:700; color: var(--text-secondary); margin-bottom:6px; display: block; text-transform:uppercase; letter-spacing:0.5px;">Precio Unitario ($)</label>
                        <input type="number" id="modal-price" class="input-field" value="${product?.price || ''}" placeholder="Ej: 45000" style="width: 100%; box-sizing: border-box; height:48px; border-radius:12px; border:2px solid #e2e8f0; font-weight:600;">
                    </div>

                    <div style="display:flex; gap:12px; margin-top:32px;">
                        <button id="modal-cancel" style="flex:1; padding:14px; border:none; background:#f1f5f9; color:#64748b; border-radius:14px; font-weight:700; cursor:pointer; transition:all 0.2s;">Cancelar</button>
                        <button id="modal-confirm" style="flex:1; padding:14px; border:none; background:var(--primary-color); color:white; border-radius:14px; font-weight:700; cursor:pointer; box-shadow: 0 4px 12px rgba(0, 112, 243, 0.2); transition:all 0.2s;">${isEdit ? 'Actualizar' : 'Guardar Producto'}</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            document.getElementById('modal-cancel').onclick = () => { overlay.remove(); resolve(null); };
            document.getElementById('modal-confirm').onclick = () => {
                const code = document.getElementById('modal-code').value.trim();
                const name = document.getElementById('modal-name').value.trim();
                const price = parseInt(document.getElementById('modal-price').value);

                if (!code || !name || isNaN(price)) {
                    Alert.error("Todos los campos son obligatorios");
                    return;
                }

                overlay.remove();
                resolve({ code, name, price });
            };
        });
    };

    const refreshTable = async (query) => {
        if (!query || query.length < 2) {
            container.innerHTML = `
                <div style="padding: 100px 20px; text-align: center; color: var(--text-light); opacity: 0.6;">
                    <span class="material-icons-round" style="font-size: 80px; margin-bottom: 16px;">inventory_2</span>
                    <p style="font-size: 18px; font-weight: 600;">Busca un producto para empezar</p>
                    <p style="font-size: 14px;">Ingresa al menos 2 caracteres en el buscador</p>
                </div>`;
            return;
        }

        container.innerHTML = `<div style="padding: 100px 0;"><div class="spinner" style="margin: 0 auto;"></div></div>`;

        const org = user.organization || 'TAT';
        const results = await db.searchProducts(query, org, user.username);

        if (results.length === 0) {
            container.innerHTML = `<div style="padding: 100px 20px; text-align: center; color: var(--text-light);"><span class="material-icons-round" style="font-size: 48px; opacity: 0.2; display: block; margin-bottom: 12px;">help_outline</span>No se encontraron productos con "${query}"</div>`;
            return;
        }

        container.innerHTML = `
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                    <thead style="background: #f8fafc; color: var(--text-secondary); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #f1f5f9;">
                        <tr>
                            <th style="padding: 20px 16px; text-align: left; font-weight: 800;">CÓDIGO</th>
                            <th style="padding: 20px 16px; text-align: left; font-weight: 800;">NOMBRE DEL PRODUCTO</th>
                            <th style="padding: 20px 16px; text-align: right; font-weight: 800;">PRECIO UNITARIO</th>
                            <th style="padding: 20px 16px; text-align: center; width: 150px; font-weight: 800;">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(p => `
                            <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                                <td style="padding: 16px; font-weight: 800; font-size: 13px; color: var(--primary-color);">${p.code}</td>
                                <td style="padding: 16px; font-size: 14px; font-weight: 600; color: #1e293b;">${p.name}</td>
                                <td style="padding: 16px; text-align: right; font-weight: 800; font-size: 15px; color: var(--accent-color);">${formatPrice(p.price)}</td>
                                <td style="padding: 16px;">
                                    <div style="display: flex; gap: 8px; justify-content: center;">
                                        <button class="edit-prod-btn action-btn-new" data-code="${p.code}" data-name="${p.name}" data-price="${p.price}" title="Editar">
                                            <span class="material-icons-round">edit</span>
                                        </button>
                                        <button class="delete-prod-btn action-btn-new delete" data-code="${p.code}" title="Eliminar">
                                            <span class="material-icons-round">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <style>
                .action-btn-new {
                    background: #f1f5f9;
                    color: #64748b;
                    border: none;
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .action-btn-new:hover {
                    background: var(--primary-light);
                    color: var(--primary-color);
                    transform: translateY(-2px);
                }
                .action-btn-new.delete:hover {
                    background: #fee2e2;
                    color: #ef4444;
                }
                .action-btn-new span { font-size: 20px; }
            </style>
        `;

        // Bind buttons
        container.querySelectorAll('.edit-prod-btn').forEach(btn => {
            btn.onclick = async () => {
                const result = await showProductModal({
                    code: btn.dataset.code,
                    name: btn.dataset.name,
                    price: btn.dataset.price
                });

                if (result) {
                    if (await db.updateProduct(result.code, {
                        name: result.name,
                        price: result.price,
                        search_string: `${result.code} ${result.name}`.toLowerCase()
                    })) {
                        Alert.success("Producto actualizado");
                        refreshTable(prodSearch.value.trim());
                    } else {
                        Alert.error("Error al actualizar el producto");
                    }
                }
            };
        });

        container.querySelectorAll('.delete-prod-btn').forEach(btn => {
            btn.onclick = async () => {
                const code = btn.dataset.code;
                if (await Alert.confirm(`¿Seguro que deseas eliminar el producto ${code}? Esta acción lo ocultará de todos los dispositivos.`, "Eliminar Producto")) {
                    if (await db.deleteProduct(code)) {
                        Alert.success("Producto eliminado");
                        refreshTable(prodSearch.value.trim());
                    } else {
                        Alert.error("No se pudo eliminar el producto.");
                    }
                }
            };
        });
    };

    prodSearch.oninput = (e) => {
        const query = e.target.value.trim();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => refreshTable(query), 400);
    };

    addNewBtn.onclick = async () => {
        const result = await showProductModal();
        if (!result) return;

        const productData = {
            code: result.code,
            name: result.name,
            price: result.price,
            organization: user.organization || 'TAT',
            search_string: `${result.code} ${result.name}`.toLowerCase()
        };

        if (await db.addProduct(productData)) {
            Alert.success("Producto agregado correctamente");
            prodSearch.value = result.code;
            refreshTable(result.code);
        } else {
            Alert.error("No se pudo agregar el producto. ¿Quizás el código ya existe?");
        }
    };

    prodSearch.focus();
};
