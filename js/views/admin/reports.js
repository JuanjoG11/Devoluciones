import { db } from '../../data.js';

export const generatePrintReport = async (routes, id) => {
    const route = routes.find(r => r.id === id);
    const returns = await db.getRouteReturns(id);

    // FORCED ISOLATION: Always ensure printArea is a direct child of body and clear it
    let printArea = document.getElementById('printArea');
    if (printArea) printArea.remove();

    printArea = document.createElement('div');
    printArea.id = 'printArea';
    document.body.appendChild(printArea);

    // Split returns
    const partialReturns = returns.filter(r => r.productName !== 'DEVOLUCIÓN TOTAL');
    const totalReturns = returns.filter(r => r.productName === 'DEVOLUCIÓN TOTAL');

    // Calculate totals
    const partialTotalValue = partialReturns.reduce((sum, r) => sum + (r.total || 0), 0);
    const partialTotalItems = partialReturns.reduce((sum, r) => sum + (parseInt(r.quantity) || 0), 0);

    const totalTotalValue = totalReturns.reduce((sum, r) => sum + (r.total || 0), 0);
    const totalTotalItems = totalReturns.reduce((sum, r) => sum + (parseInt(r.quantity) || 0), 0);

    const today = new Date().toLocaleDateString('es-CO');

    let htmlContent = `
<div class="print-main-container">
    <div class="report-box" style="font-family: 'Inter', Arial, sans-serif; padding: 10px;">

        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid black; padding-bottom: 10px; margin-bottom: 12px;">
            <div style="width: 60px;">
                <img src="logo-tat.png" alt="TAT Logo" style="width: 100%; height: auto;">
            </div>
            <div style="text-align: center; flex: 1;">
                <h1 style="margin: 0; font-size: 14pt; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">CONCENTRADO DE DEVOLUCIONES</h1>
                <h2 style="margin: 4px 0 0; font-size: 11pt; font-weight: 700;">TAT DISTRIBUCIONES</h2>
                <p style="margin: 2px 0 0; font-size: 8pt; color: #333;">Control Operativo y Logístico</p>
            </div>
            <div style="text-align: right; width: 85px; font-size: 8pt;">
                <div style="font-weight: 700;">NIT</div>
                <div style="font-weight: 600; white-space: nowrap;">901568117-1</div>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border-bottom: 1.5px solid black;">
            <tr>
                <td style="padding: 8px 0; width: 60%; border: none;">
                    <div style="font-size: 7pt; font-weight: 800; text-transform: uppercase; color: #555; margin-bottom: 2px;">AUXILIAR / RUTA</div>
                    <div style="font-weight: 700; font-size: 9pt;">${route.userName.toUpperCase()}</div>
                </td>
                <td style="padding: 8px 0; width: 40%; text-align: right; border: none;">
                    <div style="font-size: 7pt; font-weight: 800; text-transform: uppercase; color: #555; margin-bottom: 2px;">FECHA</div>
                    <div style="font-weight: 700; font-size: 9pt;">${route.date || today}</div>
                </td>
            </tr>
        </table>
        `;

    if (partialReturns.length > 0) {
        htmlContent += `
        <div style="margin-bottom: 20px;">
            <h3 style="font-size: 10pt; font-weight: 800; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; text-transform: uppercase;">Devolución Parcial</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 0;">
                <thead>
                    <tr style="background: #f4f4f4;">
                        <th style="border: 1px solid black; padding: 6px 4px; text-align: left; font-size: 7pt; font-weight: 800; text-transform: uppercase; width: 12%;">FACTURA</th>
                        <th style="border: 1px solid black; padding: 6px 4px; text-align: left; font-size: 7pt; font-weight: 800; text-transform: uppercase; width: 10%;">PLANILLA</th>
                        <th style="border: 1px solid black; padding: 6px 4px; text-align: left; font-size: 7pt; font-weight: 800; text-transform: uppercase; width: 33%;">PRODUCTO</th>
                        <th style="border: 1px solid black; padding: 6px 4px; text-align: left; font-size: 7pt; font-weight: 800; text-transform: uppercase; width: 20%;">MOTIVO</th>
                        <th style="border: 1px solid black; padding: 6px 4px; text-align: center; font-size: 7pt; font-weight: 800; text-transform: uppercase; width: 5%;">CANT</th>
                        <th style="border: 1px solid black; padding: 6px 4px; text-align: right; font-size: 7pt; font-weight: 800; text-transform: uppercase; width: 20%;">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${partialReturns.map(r => `
                        <tr>
                            <td style="border: 1px solid black; padding: 6px 4px; font-size: 7pt; font-weight: 700;">${r.invoice}</td>
                            <td style="border: 1px solid black; padding: 6px 4px; font-size: 7pt;">${r.sheet || 'N/A'}</td>
                            <td style="border: 1px solid black; padding: 6px 4px; font-size: 7pt;">${(r.productName || r.name || 'N/A').toUpperCase()}</td>
                            <td style="border: 1px solid black; padding: 6px 4px; font-size: 7pt;">${r.reason || ''}</td>
                            <td style="border: 1px solid black; padding: 6px 4px; text-align: center; font-size: 7pt; font-weight: 700;">${r.quantity}</td>
                            <td style="border: 1px solid black; padding: 6px 4px; text-align: right; font-size: 7pt; font-weight: 700;">$ ${(r.total || 0).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                    <tr style="background-color: #f9f9f9; border-top: 2px solid black;">
                        <td colspan="4" style="border: 1px solid black; padding: 8px 6px; text-align: right; font-size: 8pt; font-weight: 800;">TOTAL PARCIAL:</td>
                        <td style="border: 1px solid black; padding: 8px 6px; text-align: center; font-size: 8pt; font-weight: 800;">${partialTotalItems}</td>
                        <td style="border: 1px solid black; padding: 8px 6px; text-align: right; font-size: 8pt; font-weight: 800;">$ ${partialTotalValue.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        `;
    }

    if (totalReturns.length > 0) {
        htmlContent += `
        <div style="margin-bottom: 20px;">
            <h3 style="font-size: 10pt; font-weight: 800; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; text-transform: uppercase;">Devolución Total</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 0;">
                <thead>
                    <tr style="background: #f4f4f4;">
                        <th style="border: 1px solid black; padding: 6px 4px; text-align: left; font-size: 7pt; font-weight: 800; text-transform: uppercase; width: 15%;">FACTURA</th>
                        <th style="border: 1px solid black; padding: 6px 4px; text-align: left; font-size: 7pt; font-weight: 800; text-transform: uppercase; width: 15%;">PLANILLA</th>
                        <th style="border: 1px solid black; padding: 6px 4px; text-align: left; font-size: 7pt; font-weight: 800; text-transform: uppercase; width: 45%;">MOTIVO</th>
                        <th style="border: 1px solid black; padding: 6px 4px; text-align: center; font-size: 7pt; font-weight: 800; text-transform: uppercase; width: 5%;">CANT</th>
                        <th style="border: 1px solid black; padding: 6px 4px; text-align: right; font-size: 7pt; font-weight: 800; text-transform: uppercase; width: 20%;">TOTAL</th>
                    </tr>
                </thead>
                <tbody>
                    ${totalReturns.map(r => `
                        <tr>
                            <td style="border: 1px solid black; padding: 6px 4px; font-size: 7pt; font-weight: 700;">${r.invoice}</td>
                            <td style="border: 1px solid black; padding: 6px 4px; font-size: 7pt;">${r.sheet || 'N/A'}</td>
                            <td style="border: 1px solid black; padding: 6px 4px; font-size: 7pt;">${r.reason ? r.reason.toUpperCase() : 'DEVOLUCIÓN TOTAL'}</td>
                            <td style="border: 1px solid black; padding: 6px 4px; text-align: center; font-size: 7pt; font-weight: 700;">${r.quantity}</td>
                            <td style="border: 1px solid black; padding: 6px 4px; text-align: right; font-size: 7pt; font-weight: 700;">$ ${(r.total || 0).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                    <tr style="background-color: #f9f9f9; border-top: 2px solid black;">
                        <td colspan="3" style="border: 1px solid black; padding: 8px 6px; text-align: right; font-size: 8pt; font-weight: 800;">TOTAL:</td>
                        <td style="border: 1px solid black; padding: 8px 6px; text-align: center; font-size: 8pt; font-weight: 800;">${totalTotalItems}</td>
                        <td style="border: 1px solid black; padding: 8px 6px; text-align: right; font-size: 8pt; font-weight: 800;">$ ${totalTotalValue.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        `;
    }

    htmlContent += `
        <div style="margin-top: 40px; display: flex; justify-content: space-between; padding: 0 40px 10px; page-break-inside: avoid;">
            <div style="text-align: center; width: 35%;">
                <div style="border-top: 1.5px solid black; margin-bottom: 6px;"></div>
                <div style="font-size: 8pt; font-weight: 700; text-transform: uppercase;">FIRMA AUXILIAR</div>
            </div>
            <div style="text-align: center; width: 35%;">
                <div style="border-top: 1.5px solid black; margin-bottom: 6px;"></div>
                <div style="font-size: 8pt; font-weight: 700; text-transform: uppercase;">FIRMA BODEGA</div>
            </div>
        </div>

        <div style="margin-top: 20px; border-top: 1px dashed #bbb; padding-top: 8px; text-align: center;">
            <p style="font-size: 8pt; color: #666; margin: 0; font-style: italic;">
                * Soporte oficial TAT DISTRIBUCIONES - Generado el ${new Date().toLocaleString('es-CO')}
            </p>
        </div>
    </div>
</div>
    `;

    printArea.innerHTML = htmlContent;
    setTimeout(() => {
        window.print();
        if (printArea) printArea.innerHTML = '';
    }, 150);
};

export const exportToCSV = (returns, routes) => {
    const today = new Date().toISOString().split('T')[0];
    const rows = [
        ['Fecha', 'Auxiliar', 'Factura', 'Planilla', 'Codigo', 'Producto', 'Cantidad', 'Motivo', 'Total', 'Foto']
    ];

    returns.forEach(r => {
        const route = routes.find(rt => rt.id === r.routeId);
        rows.push([
            r.timestamp ? new Date(r.timestamp).toLocaleDateString() : today,
            route ? route.userName : 'N/A',
            r.invoice,
            r.sheet || '',
            r.code || '',
            r.productName || '',
            r.quantity,
            r.reason,
            r.total,
            r.evidence || ''
        ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Devoluciones_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
