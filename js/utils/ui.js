/* Custom UI Utilities */

export const Alert = {
    _getToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    },

    success(message) {
        this._showToast(message, 'success', 'check_circle');
    },

    error(message) {
        this._showToast(message, 'error', 'error_outline');
    },

    _showToast(message, type, icon) {
        const container = this._getToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="material-icons-round toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    },

    confirm(message, title = '¿Estás seguro?') {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-card">
                    <div class="modal-icon">
                        <span class="material-icons-round">help_outline</span>
                    </div>
                    <h2 class="modal-title">${title}</h2>
                    <p class="modal-body">${message}</p>
                    <div class="modal-actions">
                        <button class="btn-cancel" id="modal-cancel">Cancelar</button>
                        <button class="btn-confirm" id="modal-confirm">Confirmar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            document.getElementById('modal-cancel').onclick = () => {
                overlay.remove();
                resolve(false);
            };

            document.getElementById('modal-confirm').onclick = () => {
                overlay.remove();
                resolve(true);
            };
        });
    }
};
