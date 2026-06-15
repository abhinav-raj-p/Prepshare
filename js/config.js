// Configuration file for MCA Ace Cloud Services

const CONFIG = {
    // -------------------------------------------------------------
    // CLOUDINARY CONFIGURATION
    // -------------------------------------------------------------
    // Replace 'your-cloud-name' with your actual Cloudinary Cloud Name
    cloudinary: {
        cloudName: "dcc3jab2m",
        apiKey: "483318379859266",
        apiSecret: "wUrSD4fvKf7S1F1mzFJrfhR3DA8",
        uploadPreset: "transactions",  // Preset set up by user
        folder: "transaction_id"        // Folder set up by user
    },

    // -------------------------------------------------------------
    // FIREBASE CONSOLE CONFIGURATION
    // -------------------------------------------------------------
    // Replace these placeholder values with your actual web app config from Firebase Console
    firebase: {
        apiKey: "AIzaSyANHstBblOSiJXZh_Gkep__X4HIHCv72AE",
        authDomain: "prepshare-e20ee.firebaseapp.com",
        projectId: "prepshare-e20ee",
        storageBucket: "prepshare-e20ee.firebasestorage.app",
        messagingSenderId: "1041021953848",
        appId: "1:1041021953848:web:0d81d4481f0fc038adc3cd"
    }
};

// Check if credentials are placeholders
const isConfigured = () => {
    return CONFIG.cloudinary.cloudName !== "your-cloud-name" && CONFIG.firebase.apiKey !== "YOUR_API_KEY";
};

// Export configuration
window.APP_CONFIG = CONFIG;
window.isConfigured = isConfigured;
