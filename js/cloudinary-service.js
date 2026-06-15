// =============================================================
// CloudinaryService — Modular signed upload helper
// Reads credentials from window.APP_CONFIG (set by js/config.js)
// =============================================================

const CloudinaryService = (() => {

    // ----------------------------------------------------------
    // PRIVATE: SHA-1 hex digest via Web Crypto API
    // ----------------------------------------------------------
    async function _sha1(str) {
        const buffer = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ----------------------------------------------------------
    // PRIVATE: Sanitize into a valid Cloudinary public_id.
    // Allowed chars: alphanumeric, underscore, hyphen, period, slash.
    // ----------------------------------------------------------
    function _sanitizePublicId(raw) {
        return raw.trim().replace(/[^a-zA-Z0-9_\-\.\/]/g, '_');
    }

    // ----------------------------------------------------------
    // PUBLIC: Upload an image file to Cloudinary (signed upload).
    //
    //   @param {File}   file     — The File object to upload (must not be null)
    //   @param {string} label    — Used as the image public_id prefix (e.g. student email).
    //                             A timestamp is appended to guarantee uniqueness.
    //   @returns {Promise<string>} The secure_url of the uploaded image.
    // ----------------------------------------------------------
    async function uploadImage(file, label) {
        if (!file) throw new Error('No file provided to CloudinaryService.uploadImage().');

        const cfg = window.APP_CONFIG?.cloudinary;
        if (!cfg || !cfg.cloudName || !cfg.apiKey || !cfg.apiSecret) {
            throw new Error(
                'Cloudinary credentials are missing. Check js/config.js (APP_CONFIG.cloudinary).'
            );
        }

        const timestamp = Math.round(Date.now() / 1000);

        // Unique public_id: <sanitised-label>_<unix-timestamp>
        // This means every submission produces a new image even if the email repeats.
        const safeLabel = _sanitizePublicId(label || 'payment');
        const publicId  = `${safeLabel}_${timestamp}`;

        // Cloudinary signed-upload signature:
        // Sort params alphabetically, concatenate as key=value&... then append secret.
        // For params {public_id, timestamp}: public_id=X&timestamp=Y{secret}
        const sigStr   = `public_id=${publicId}&timestamp=${timestamp}${cfg.apiSecret}`;
        const signature = await _sha1(sigStr);

        const formData = new FormData();
        formData.append('file',       file);
        formData.append('api_key',    cfg.apiKey);
        formData.append('timestamp',  timestamp);
        formData.append('public_id',  publicId);
        formData.append('signature',  signature);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`;
        console.log('[CloudinaryService] Uploading →', uploadUrl);
        console.log('[CloudinaryService] public_id  :', publicId);

        const res = await fetch(uploadUrl, { method: 'POST', body: formData });

        if (!res.ok) {
            const errBody = await res.text();
            console.error('[CloudinaryService] Upload failed. Response:', errBody);
            throw new Error('Cloudinary upload failed: ' + errBody);
        }

        const data = await res.json();
        console.log('[CloudinaryService] ✓ secure_url:', data.secure_url);
        return data.secure_url;
    }

    return { uploadImage };
})();

window.CloudinaryService = CloudinaryService;
