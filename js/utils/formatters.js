/**
 * Shared Formatter Utilities
 */

export const formatPrice = (value) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value || 0).replace('COP', '$').trim();
};

export const formatNumber = (value) => {
    return new Intl.NumberFormat('es-CO').format(value || 0);
};

export const formatTime12h = (timeStr) => {
    if (!timeStr) return '—';
    if (timeStr.toLowerCase().match(/[ap]\.?\s*m\.?/)) return timeStr;
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
        let hour = parseInt(parts[0]);
        const minute = parts[1];
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12;
        hour = hour ? hour : 12;
        return `${hour}:${minute}${parts[2] ? ':' + parts[2].split(' ')[0] : ''} ${ampm}`;
    }
    return timeStr;
};

export const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

export const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return `${formatDate(dateStr)} ${date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })}`;
};

/**
 * Gets the current date or provided date in YYYY-MM-DD local format
 * Consistently uses 'en-CA' locale which provides the desired ISO format locally.
 */
export const getLocalDateISO = (date = new Date()) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
