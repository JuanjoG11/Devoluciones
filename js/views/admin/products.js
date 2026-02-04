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

    const refreshTable = async (query) => {
        if (query.length < 2) {
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
                    <thead style="background: rgba(0,0,0,0.02); color: var(--text-secondary); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f1f5f9;">
                        <tr>
                            <th style="padding: 16px; text-align: left;">CÓDIGO</th>
                            <th style="padding: 16px; text-align: left;">NOMBRE DEL PRODUCTO</th>
                            <th style="padding: 16px; text-align: right;">PRECIO UNITARIO</th>
                            <th style="padding: 16px; text-align: center; width: 150px;">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${results.map(p => `
                            <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;">
                                <td style="padding: 16px; font-weight: 800; font-size: 13px; color: var(--primary-color);">${p.code}</td>
                                <td style="padding: 16px; font-size: 14px; font-weight: 500;">${p.name}</td>
                                <td style="padding: 16px; text-align: right; font-weight: 800; font-size: 15px; color: var(--accent-color);">${formatPrice(p.price)}</td>
                                <td style="padding: 16px;">
                                    <div style="display: flex; gap: 8px; justify-content: center;">
                                        <button class="edit-prod-btn action-btn" data-code="${p.code}" data-name="${p.name}" data-price="${p.price}" style="background: rgba(59, 130, 246, 0.1); color: #2563eb; border: none; padding: 10px; border-radius: 10px; cursor: pointer;">
                                            <span class="material-icons-round" style="font-size: 20px;">edit</span>
                                        </button>
                                        <button class="delete-prod-btn action-btn" data-code="${p.code}" style="background: rgba(239, 68, 68, 0.1); color: #dc2626; border: none; padding: 10px; border-radius: 10px; cursor: pointer;">
                                            <span class="material-icons-round" style="font-size: 20px;">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Re-bind buttons
        container.querySelectorAll('.edit-prod-btn').forEach(btn => {
            btn.onclick = async () => {
                const code = btn.dataset.code;
                const oldName = btn.dataset.name;
                const oldPrice = btn.dataset.price;

                const result = await new Promise((resolve) => {
                    const overlay = document.createElement('div');
                    overlay.className = 'modal-overlay';
                    overlay.style = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:10000; display:flex; align-items:center; justify-content:center;';
                    overlay.innerHTML = `
                        <div class="modal-card" style="background:white; padding:32px; border-radius:24px; width:100%; max-width:400px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.2);">
                            <div style="background: var(--primary-light); color: var(--primary-color); width:56px; height:56px; border-radius:18px; display:flex; align-items:center; justify-content:center; margin-bottom:20px;">
                                <span class="material-icons-round" style="font-size:32px;">edit</span>
                            </div>
                            <h2 style="font-size:24px; font-weight:800; margin-bottom:8px;">Editar Producto</h2>
                            <p style="color:var(--text-light); font-size:14px; margin-bottom:24px;">Código: <strong style="color:var(--primary-color);">${code}</strong></p>
                            
                            <div style="text-align: left;">
                                <label style="font-size: 12px; font-weight:700; color: var(--text-secondary); margin-bottom:8px; display: block; text-transform:uppercase;">Nombre</label>
                                <input type="text" id="edit-name" class="input-field" value="${oldName}" style="width: 100%; box-sizing: border-box; margin-bottom: 20px; height:48px;">
                                
                                <label style="font-size: 12px; font-weight:700; color: var(--text-secondary); margin-bottom:8px; display: block; text-transform:uppercase;">Precio ($)</label>
                                <input type="number" id="edit-price" class="input-field" value="${oldPrice}" style="width: 100%; box-sizing: border-box; height:48px;">
                            </div>

                            <div style="display:flex; gap:12px; margin-top:32px;">
                                <button id="edit-cancel" style="flex:1; padding:12px; border:1px solid #e2e8f0; background:white; border-radius:12px; font-weight:700; cursor:pointer; color:var(--text-secondary);">Cancelar</button>
                                <button id="edit-confirm" style="flex:1; padding:12px; border:none; background:var(--primary-color); color:white; border-radius:12px; font-weight:700; cursor:pointer;">Guardar</button>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(overlay);

                    document.getElementById('edit-cancel').onclick = () => { overlay.remove(); resolve(null); };
                    document.getElementById('edit-confirm').onclick = () => {
                        const name = document.getElementById('edit-name').value.trim();
                        const price = parseInt(document.getElementById('edit-price').value);
                        overlay.remove();
                        if (name && !isNaN(price)) resolve({ name, price });
                        else resolve(null);
                    };
                });

                if (result) {
                    if (await db.updateProduct(code, {
                        name: result.name,
                        price: result.price,
                        search_string: `${code} ${result.name}`.toLowerCase()
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
                if (await Alert.confirm(`¿Seguro que deseas eliminar el producto ${code}? Esta acción no se puede deshacer.`, "Eliminar Producto")) {
                    if (await db.deleteProduct(code)) {
                        Alert.success("Producto eliminado");
                        refreshTable(prodSearch.value.trim());
                    } else {
                        Alert.error("No se pudo eliminar el producto. Quizás tiene devoluciones vinculadas.");
                    }
                }
            };
        });
    };

    prodSearch.oninput = (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => refreshTable(e.target.value.trim()), 400);
    };

    addNewBtn.onclick = async () => {
        const code = await Alert.prompt("Código del nuevo producto:", "Nuevo Producto");
        if (!code) return;
        const name = await Alert.prompt("Nombre del producto:", "Nuevo Producto");
        if (!name) return;
        const priceStr = await Alert.prompt("Precio del producto ($):", "Nuevo Producto");
        if (!priceStr) return;

        const price = parseInt(priceStr.replace(/\D/g, ''));
        if (isNaN(price)) return Alert.error("Precio inválido");

        const productData = {
            code: code.trim(),
            name: name.trim(),
            price: price,
            organization: user.organization || 'TAT',
            search_string: `${code} ${name}`.toLowerCase()
        };

        if (await db.addProduct(productData)) {
            Alert.success("Producto agregado correctamente");
            prodSearch.value = code; // Search for the new product
            refreshTable(code);
        } else {
            Alert.error("No se pudo agregar el producto. ¿Quizás el código ya existe?");
        }
    };

    prodSearch.focus();
};
