import { CONFIG } from '../config.js';

/**
 * Image Compression Utility
 * Compresses images before storing in IndexedDB to save space
 */

/**
 * Compress a base64 image
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<string>} Compressed base64 image
 */
export const compressImage = async (base64Image) => {
    if (!CONFIG.FEATURES.ENABLE_IMAGE_COMPRESSION) {
        return base64Image;
    }

    return new Promise((resolve, reject) => {
        try {
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions maintaining aspect ratio
                let width = img.width;
                let height = img.height;

                const maxWidth = CONFIG.PERFORMANCE.MAX_IMAGE_WIDTH;
                const maxHeight = CONFIG.PERFORMANCE.MAX_IMAGE_HEIGHT;

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.floor(width * ratio);
                    height = Math.floor(height * ratio);
                }

                // Create canvas and compress
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to compressed base64
                const compressed = canvas.toDataURL('image/jpeg', CONFIG.PERFORMANCE.IMAGE_QUALITY);

                // Check if compression actually reduced size
                if (compressed.length < base64Image.length) {
                    resolve(compressed);
                } else {
                    // Original was smaller, keep it
                    resolve(base64Image);
                }
            };

            img.onerror = () => {
                console.error('Error loading image for compression');
                resolve(base64Image); // Return original on error
            };

            img.src = base64Image;
        } catch (e) {
            console.error('Image compression error:', e);
            resolve(base64Image); // Return original on error
        }
    });
};

/**
 * Get image size in MB
 * @param {string} base64Image - Base64 encoded image
 * @returns {number} Size in MB
 */
export const getImageSizeMB = (base64Image) => {
    const base64Length = base64Image.length - (base64Image.indexOf(',') + 1);
    const padding = (base64Image.charAt(base64Image.length - 2) === '=') ? 2 :
        (base64Image.charAt(base64Image.length - 1) === '=') ? 1 : 0;
    const sizeBytes = (base64Length * 0.75) - padding;
    return sizeBytes / (1024 * 1024);
};

/**
 * Validate image size
 * @param {string} base64Image - Base64 encoded image
 * @returns {boolean} True if within size limit
 */
export const isImageSizeValid = (base64Image) => {
    const sizeMB = getImageSizeMB(base64Image);
    return sizeMB <= CONFIG.PERFORMANCE.MAX_IMAGE_SIZE_MB;
};
