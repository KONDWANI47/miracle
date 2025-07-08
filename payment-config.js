// Payment Configuration for MIRACLE ECD
// IMPORTANT: Replace these with your actual API keys and credentials

const PAYMENT_CONFIG = {
    // Airtel Money Configuration
    airtelMoney: {
        apiKey: 'YOUR_AIRTEL_MONEY_API_KEY', // Get from Airtel Money Developer Portal
        merchantId: 'YOUR_AIRTEL_MERCHANT_ID', // Your Airtel Money merchant ID
        environment: 'sandbox', // Change to 'production' for live payments
        baseUrl: 'https://openapiuat.airtel.africa', // Sandbox URL
        // productionUrl: 'https://openapi.airtel.africa' // Production URL
    },

    // TNM Mpamba Configuration
    tnmMpamba: {
        apiKey: 'YOUR_TNM_MPAMBA_API_KEY', // Get from TNM Developer Portal
        merchantId: 'YOUR_TNM_MERCHANT_ID', // Your TNM merchant ID
        environment: 'sandbox', // Change to 'production' for live payments
        baseUrl: 'https://api.tnm.co.mw', // Sandbox URL
        // productionUrl: 'https://api.tnm.co.mw' // Production URL
    },

    // National Bank Configuration
    nationalBank: {
        apiKey: 'YOUR_NATIONAL_BANK_API_KEY', // Get from National Bank
        merchantId: 'YOUR_NATIONAL_BANK_MERCHANT_ID', // Your National Bank merchant ID
        environment: 'sandbox', // Change to 'production' for live payments
        baseUrl: 'https://api.nationalbank.co.mw', // Sandbox URL
        // productionUrl: 'https://api.nationalbank.co.mw' // Production URL
    },

    // Standard Bank Configuration
    standardBank: {
        apiKey: 'YOUR_STANDARD_BANK_API_KEY', // Get from Standard Bank
        merchantId: 'YOUR_STANDARD_BANK_MERCHANT_ID', // Your Standard Bank merchant ID
        environment: 'sandbox', // Change to 'production' for live payments
        baseUrl: 'https://api.standardbank.co.mw', // Sandbox URL
        // productionUrl: 'https://api.standardbank.co.mw' // Production URL
    },

    // General Payment Settings
    general: {
        currency: 'MWK',
        country: 'MW',
        defaultAmount: 5000, // Default registration fee
        enableRealPayments: true, // Set to false to disable real payments
        enableSimulation: true, // Set to false to disable simulation fallback
        requirePasswordConfirmation: true,
        minPasswordLength: 4,
        maxRetries: 3,
        timeout: 30000, // 30 seconds
    },

    // Security Settings
    security: {
        enableSSL: true,
        requireHTTPS: true,
        validatePhoneNumbers: true,
        validateAmounts: true,
        logPaymentAttempts: true,
        encryptSensitiveData: true,
    },

    // Notification Settings
    notifications: {
        sendSMS: true,
        sendEmail: true,
        sendWhatsApp: true,
        adminNotifications: true,
        userNotifications: true,
    }
};

// Payment Method Instructions
const PAYMENT_INSTRUCTIONS = {
    'airtel-money': {
        title: 'Airtel Money Payment',
        description: 'Pay using your Airtel Money account',
        instructions: [
            'Enter your Airtel Money PIN',
            'Ensure you have sufficient balance',
            'You will receive an SMS confirmation',
            'Payment will be processed immediately'
        ],
        requirements: [
            'Valid Airtel Money account',
            'Sufficient balance',
            'Airtel Money PIN'
        ]
    },
    'tnm-mpamba': {
        title: 'TNM Mpamba Payment',
        description: 'Pay using your TNM Mpamba account',
        instructions: [
            'Enter your Mpamba PIN',
            'Ensure you have sufficient balance',
            'You will receive an SMS confirmation',
            'Payment will be processed immediately'
        ],
        requirements: [
            'Valid TNM Mpamba account',
            'Sufficient balance',
            'Mpamba PIN'
        ]
    },
    'national-bank': {
        title: 'National Bank Online Payment',
        description: 'Pay using your National Bank online banking',
        instructions: [
            'Enter your online banking password',
            'Ensure you have sufficient balance',
            'You will receive an email confirmation',
            'Payment will be processed immediately'
        ],
        requirements: [
            'National Bank account',
            'Online banking access',
            'Online banking password'
        ]
    },
    'standard-bank': {
        title: 'Standard Bank Online Payment',
        description: 'Pay using your Standard Bank online banking',
        instructions: [
            'Enter your online banking password',
            'Ensure you have sufficient balance',
            'You will receive an email confirmation',
            'Payment will be processed immediately'
        ],
        requirements: [
            'Standard Bank account',
            'Online banking access',
            'Online banking password'
        ]
    },
    'cash': {
        title: 'Cash Payment',
        description: 'Pay in cash at our office',
        instructions: [
            'Enter a security code of your choice',
            'Bring cash payment to our office',
            'Present your payment reference',
            'Payment will be verified manually'
        ],
        requirements: [
            'Cash payment',
            'Payment reference number',
            'Security code'
        ]
    }
};

// Error Messages
const PAYMENT_ERRORS = {
    'insufficient_balance': 'Insufficient balance in your account',
    'invalid_pin': 'Invalid PIN or password',
    'network_error': 'Network error. Please try again',
    'timeout': 'Payment timeout. Please try again',
    'invalid_phone': 'Invalid phone number',
    'invalid_amount': 'Invalid payment amount',
    'account_locked': 'Account is locked. Contact your bank',
    'daily_limit': 'Daily payment limit exceeded',
    'transaction_failed': 'Transaction failed. Please try again',
    'system_error': 'System error. Please contact support'
};

// Success Messages
const PAYMENT_SUCCESS = {
    'airtel-money': 'Airtel Money payment completed successfully!',
    'tnm-mpamba': 'TNM Mpamba payment completed successfully!',
    'national-bank': 'National Bank payment completed successfully!',
    'standard-bank': 'Standard Bank payment completed successfully!',
    'cash': 'Cash payment recorded successfully! Please bring payment to our office.'
};

// Export configuration
window.PAYMENT_CONFIG = PAYMENT_CONFIG;
window.PAYMENT_INSTRUCTIONS = PAYMENT_INSTRUCTIONS;
window.PAYMENT_ERRORS = PAYMENT_ERRORS;
window.PAYMENT_SUCCESS = PAYMENT_SUCCESS;

// Configuration validation
function validatePaymentConfig() {
    const requiredFields = [
        'airtelMoney.apiKey',
        'airtelMoney.merchantId',
        'tnmMpamba.apiKey',
        'tnmMpamba.merchantId',
        'nationalBank.apiKey',
        'nationalBank.merchantId',
        'standardBank.apiKey',
        'standardBank.merchantId'
    ];

    const missingFields = [];
    
    requiredFields.forEach(field => {
        const keys = field.split('.');
        let value = PAYMENT_CONFIG;
        
        for (const key of keys) {
            value = value[key];
            if (!value) break;
        }
        
        if (!value || value === 'YOUR_API_KEY' || value === 'YOUR_MERCHANT_ID') {
            missingFields.push(field);
        }
    });

    if (missingFields.length > 0) {
        console.warn('⚠️ Payment configuration incomplete. Missing:', missingFields);
        console.warn('⚠️ Real payments will be disabled. Using simulation mode.');
        return false;
    }

    console.log('✅ Payment configuration validated successfully');
    return true;
}

// Auto-validate on load
document.addEventListener('DOMContentLoaded', () => {
    validatePaymentConfig();
}); 