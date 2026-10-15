export const renderConfig = () => `
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 24px;">
        <header style="margin-bottom: 32px;">
            <h1 style="color: var(--primary-color); margin: 0 0 8px 0;">Configuración Avanzada</h1>
            <p style="color: #64748b; margin: 0;">Mantenimiento y limpieza del sistema</p>
        </header>

        <!-- Storage Cleanup -->
        <div class="card" style="margin-bottom: 24px; padding: 24px;">
            <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 20px;">
                <span class="material-icons-round" style="font-size: 32px; color: var(--primary-color); flex-shrink: 0;">photo_library</span>
                <div>
                    <h3 style="margin: 0 0 4px 0; font-size: 16px;">Limpiar fotos antiguas</h3>
                    <p style="margin: 0; color: #64748b; font-size: 14px;">
                        Elimina las fotos de evidencia con más de 30 días de antigüedad del almacenamiento en la nube.
                        Los registros de devoluciones <strong>no se borran</strong>, solo las imágenes.
                    </p>
                </div>
            </div>

            <div id="cleanup-status" style="display: none; margin-bottom: 16px; padding: 12px 16px; border-radius: 8px; font-size: 14px;"></div>

            <button id="cleanup-evidences-btn" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px;">
                <span class="material-icons-round" style="font-size: 18px;">delete_sweep</span>
                Eliminar fotos antiguas
            </button>
        </div>

        <div class="card" style="text-align: center; color: var(--text-light); border: 1px dashed #e2e8f0; background: transparent; padding: 20px;">
            <p style="font-size: 13px; margin: 0;">Otras opciones de configuración (inventario, usuarios) próximamente.</p>
        </div>
    </div>
`;
