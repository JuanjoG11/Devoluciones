export const renderConfig = () => `
    <div style="max-width: 600px; margin: 0 auto; padding-top: 40px;">
        <header style="margin-bottom: 32px; text-align: left;">
            <h1 style="color: var(--primary-color);">Configuración Avanzada</h1>
            <p>Mantenimiento y limpieza del sistema</p>
        </header>
        
        <div class="card" style="padding: 32px; border-left: 4px solid #ef4444;">
            <div style="display: flex; gap: 24px; align-items: flex-start;">
                <div style="background: #fee2e2; color: #ef4444; padding: 16px; border-radius: 12px;">
                    <span class="material-icons-round" style="font-size: 32px;">delete_forever</span>
                </div>
                <div>
                    <h3 style="margin: 0 0 8px; color: #991b1b;">Reiniciar Base de Datos</h3>
                    <p style="margin: 0 0 24px; color: #666; font-size: 14px; line-height: 1.5;">
                        Esta acción eliminará **todas las devoluciones y rutas registradas** hasta el momento. 
                        Úsala únicamente para limpiar datos de prueba antes de iniciar la operación oficial.
                    </p>
                    <button id="resetDataBtn" class="btn" style="background: #ef4444; color: white; height: 48px; padding: 0 24px; font-weight: 600; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                        <span class="material-icons-round">warning</span> Limpiar Todos los Datos
                    </button>
                </div>
            </div>
        </div>
        
        <div class="card" style="margin-top: 24px; text-align: center; color: var(--text-light); border: 1px dashed #e2e8f0; background: transparent;">
            <p style="font-size: 13px; margin: 0;">Otras opciones de configuración (inventario, usuarios) próximamente.</p>
        </div>
    </div>
`;
