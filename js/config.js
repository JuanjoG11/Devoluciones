/**
 * Application Configuration
 * Centralized configuration for production deployment
 */

export const CONFIG = {
    // Performance Settings
    PERFORMANCE: {
        // Default days to load in admin dashboard
        DEFAULT_DAYS_FILTER: 7,

        // Pagination limits
        DASHBOARD_RETURNS_LIMIT: 20,
        HISTORY_PAGE_SIZE: 50,
        ROUTES_LIMIT: 100,

        // Batch sync settings
        SYNC_BATCH_SIZE: 10,
        SYNC_RETRY_ATTEMPTS: 3,
        SYNC_RETRY_DELAY: 2000, // ms

        // Image compression
        MAX_IMAGE_WIDTH: 1200,
        MAX_IMAGE_HEIGHT: 1200,
        IMAGE_QUALITY: 0.7,
        MAX_IMAGE_SIZE_MB: 2,

        // Cache settings
        INVENTORY_SYNC_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
        AUTO_REFRESH_INTERVAL: 60000, // 1 minute
    },

    // Storage Management
    STORAGE: {
        // Minimum free space required (bytes)
        MIN_FREE_SPACE: 50 * 1024 * 1024, // 50MB

        // Cleanup thresholds
        CLEANUP_AFTER_DAYS: 30,
        MAX_PENDING_ITEMS: 100,
    },

    // Realtime/Broadcast Settings
    REALTIME: {
        // Debounce notifications (ms)
        NOTIFICATION_DEBOUNCE: 5000,

        // Max notifications to show
        MAX_NOTIFICATIONS: 5,
    },

    // Development/Production flags
    IS_PRODUCTION: window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1'),

    // Feature flags
    FEATURES: {
        ENABLE_ANALYTICS: true,
        ENABLE_REALTIME_ALERTS: true,
        ENABLE_AUTO_SYNC: true,
        ENABLE_IMAGE_COMPRESSION: true,
    }
};

// Helper to get date range for default filter
export const getDefaultDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - CONFIG.PERFORMANCE.DEFAULT_DAYS_FILTER);

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
};

// Storage monitoring helper
export const checkStorageSpace = async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
            const estimate = await navigator.storage.estimate();
            const available = estimate.quota - estimate.usage;
            const usagePercent = (estimate.usage / estimate.quota) * 100;

            return {
                available,
                usage: estimate.usage,
                quota: estimate.quota,
                usagePercent,
                isLow: available < CONFIG.STORAGE.MIN_FREE_SPACE
            };
        } catch (e) {
            console.warn('Storage estimate not available:', e);
        }
    }
    return null;
};
