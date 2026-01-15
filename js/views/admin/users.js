export const renderAuxiliares = (users, routes, filterTerm) => {
    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(filterTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(filterTerm.toLowerCase())
    );

    const todayStr = new Date().toISOString().split('T')[0];

    return `
        <header style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px;">
            <div>
                <h1 style="color: var(--primary-color);">Gestión de Auxiliares</h1>
                <p>Control de acceso para personal operativo</p>
            </div>
            <div style="width: 300px;">
                <input type="text" id="auxiliarSearch" class="input-field" placeholder="Buscar auxiliar..." value="${filterTerm}" style="height: 44px; border-radius: 10px;">
            </div>
        </header>

        <div class="card" style="padding: 0;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f8fafc; color: var(--text-secondary); font-size: 12px; text-transform: uppercase;">
                    <tr>
                        <th style="padding: 16px; text-align: left;">Nombre</th>
                        <th style="padding: 16px; text-align: left;">Usuario</th>
                        <th style="padding: 16px; text-align: center;">Estado Hoy</th>
                        <th style="padding: 16px; text-align: center;">Estado Cuenta</th>
                        <th style="padding: 16px; text-align: center;">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(u => {
        const todayRoute = routes.find(r => (r.userId === u.id || r.username == u.username) && r.date === todayStr);
        const statusColor = todayRoute ? (todayRoute.status === 'completed' ? '#6366f1' : '#22c55e') : '#94a3b8';
        const statusText = todayRoute ? (todayRoute.status === 'completed' ? 'Finalizó' : 'En Ruta') : 'Inactivo';

        return `
                            <tr style="border-bottom: 1px solid #f1f5f9; opacity: ${u.isActive ? '1' : '0.6'}">
                                <td style="padding: 16px; font-weight: 500;">${u.name}</td>
                                <td style="padding: 16px;">${u.username}</td>
                                <td style="padding: 16px; text-align: center;">
                                    <div style="display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; font-weight: 600; color: ${statusColor};">
                                        <span style="width: 6px; height: 6px; border-radius: 50%; background: ${statusColor};"></span>
                                        ${statusText}
                                    </div>
                                </td>
                                <td style="padding: 16px; text-align: center;">
                                    <span style="background: ${u.isActive ? '#dcfce7' : '#fee2e2'}; color: ${u.isActive ? '#15803d' : '#991b1b'}; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 600;">
                                        ${u.isActive ? 'Activo' : 'Suspendido'}
                                    </span>
                                </td>
                                <td style="padding: 16px; text-align: center;">
                                    <button class="toggle-user-btn btn" data-user-id="${u.id}" data-active="${u.isActive}" style="background: none; border: 1px solid #ddd; color: ${u.isActive ? '#ef4444' : '#22c55e'}; height: 32px; padding: 0 10px; font-size: 12px;">
                                        ${u.isActive ? 'Desactivar' : 'Reactivar'}
                                    </button>
                                </td>
                            </tr>`;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;
};
