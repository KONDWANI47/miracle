// Real Payment Integration for MIRACLE ECD
// Integration with Airtel Money and TNM Mpamba APIs

class RealPaymentGateway {
    constructor() {
        // Use configuration from payment-config.js
        this.airtelMoneyConfig = window.PAYMENT_CONFIG?.airtelMoney || {
            apiKey: 'YOUR_AIRTEL_MONEY_API_KEY',
            merchantId: 'YOUR_MERCHANT_ID',
            environment: 'sandbox',
            baseUrl: 'https://openapiuat.airtel.africa'
        };
        
        this.tnmMpambaConfig = window.PAYMENT_CONFIG?.tnmMpamba || {
            apiKey: 'YOUR_TNM_MPAMBA_API_KEY',
            merchantId: 'YOUR_MERCHANT_ID',
            environment: 'sandbox',
            baseUrl: 'https://api.tnm.co.mw'
        };
        
        this.nationalBankConfig = window.PAYMENT_CONFIG?.nationalBank || {
            apiKey: 'YOUR_NATIONAL_BANK_API_KEY',
            merchantId: 'YOUR_MERCHANT_ID',
            environment: 'sandbox',
            baseUrl: 'https://api.nationalbank.co.mw'
        };
        
        this.standardBankConfig = window.PAYMENT_CONFIG?.standardBank || {
            apiKey: 'YOUR_STANDARD_BANK_API_KEY',
            merchantId: 'YOUR_MERCHANT_ID',
            environment: 'sandbox',
            baseUrl: 'https://api.standardbank.co.mw'
        };
        
        this.generalConfig = window.PAYMENT_CONFIG?.general || {
            enableRealPayments: true,
            enableSimulation: true,
            timeout: 30000
        };
    }

    // Initialize payment gateway
    async initialize() {
        try {
            console.log('Initializing real payment gateway...');
            
            // Test API connections
            await this.testConnections();
            
            console.log('Real payment gateway initialized successfully');
            return true;
        } catch (error) {
            console.error('Payment gateway initialization failed:', error);
            return false;
        }
    }

    // Test API connections
    async testConnections() {
        const tests = [
            { name: 'Airtel Money', test: () => this.testAirtelMoneyConnection() },
            { name: 'TNM Mpamba', test: () => this.testTnmMpambaConnection() },
            { name: 'National Bank', test: () => this.testNationalBankConnection() },
            { name: 'Standard Bank', test: () => this.testStandardBankConnection() }
        ];

        for (const test of tests) {
            try {
                await test.test();
                console.log(`✅ ${test.name} connection successful`);
            } catch (error) {
                console.warn(`⚠️ ${test.name} connection failed:`, error.message);
            }
        }
    }

    // Process real payment
    async processPayment(paymentData) {
        const { paymentMethod, amount, phoneNumber, password, reference } = paymentData;
        
        try {
            console.log(`Processing real payment: ${paymentMethod} - MWK ${amount}`);
            
            let result;
            
            switch (paymentMethod) {
                case 'airtel-money':
                    result = await this.processAirtelMoneyPayment(paymentData);
                    break;
                case 'tnm-mpamba':
                    result = await this.processTnmMpambaPayment(paymentData);
                    break;
                case 'national-bank':
                    result = await this.processNationalBankPayment(paymentData);
                    break;
                case 'standard-bank':
                    result = await this.processStandardBankPayment(paymentData);
                    break;
                case 'cash':
                    result = await this.processCashPayment(paymentData);
                    break;
                default:
                    throw new Error(`Unsupported payment method: ${paymentMethod}`);
            }
            
            console.log('Real payment processed successfully:', result);
            return result;
            
        } catch (error) {
            console.error('Real payment processing failed:', error);
            throw error;
        }
    }

    // Airtel Money Payment Processing
    async processAirtelMoneyPayment(paymentData) {
        const { amount, phoneNumber, password, reference, description } = paymentData;
        
        try {
            // Step 1: Initiate payment request
            const initiateResponse = await fetch(`${this.airtelMoneyConfig.baseUrl}/merchant/v1/payments/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.airtelMoneyConfig.apiKey}`,
                    'X-Country': 'MW',
                    'X-Currency': 'MWK'
                },
                body: JSON.stringify({
                    reference: reference,
                    subscriber: {
                        country: 'MW',
                        currency: 'MWK',
                        msisdn: phoneNumber
                    },
                    transaction: {
                        amount: amount,
                        country: 'MW',
                        currency: 'MWK',
                        id: reference
                    }
                })
            });

            if (!initiateResponse.ok) {
                throw new Error(`Airtel Money initiation failed: ${initiateResponse.statusText}`);
            }

            const initiateData = await initiateResponse.json();
            console.log('Airtel Money payment initiated:', initiateData);

            // Step 2: Validate payment with PIN
            const validateResponse = await fetch(`${this.airtelMoneyConfig.baseUrl}/merchant/v1/payments/${reference}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.airtelMoneyConfig.apiKey}`,
                    'X-Country': 'MW',
                    'X-Currency': 'MWK'
                },
                body: JSON.stringify({
                    pin: password,
                    otp: paymentData.otp || null
                })
            });

            if (!validateResponse.ok) {
                throw new Error(`Airtel Money validation failed: ${validateResponse.statusText}`);
            }

            const validateData = await validateResponse.json();
            console.log('Airtel Money payment validated:', validateData);

            // Step 3: Complete payment
            const completeResponse = await fetch(`${this.airtelMoneyConfig.baseUrl}/merchant/v1/payments/${reference}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.airtelMoneyConfig.apiKey}`,
                    'X-Country': 'MW',
                    'X-Currency': 'MWK'
                }
            });

            if (!completeResponse.ok) {
                throw new Error(`Airtel Money completion failed: ${completeResponse.statusText}`);
            }

            const completeData = await completeResponse.json();
            console.log('Airtel Money payment completed:', completeData);

            return {
                success: true,
                transactionId: completeData.data.transaction.id,
                reference: reference,
                amount: amount,
                status: 'completed',
                paymentMethod: 'airtel-money',
                timestamp: new Date().toISOString(),
                response: completeData
            };

        } catch (error) {
            console.error('Airtel Money payment error:', error);
            throw new Error(`Airtel Money payment failed: ${error.message}`);
        }
    }

    // TNM Mpamba Payment Processing
    async processTnmMpambaPayment(paymentData) {
        const { amount, phoneNumber, password, reference, description } = paymentData;
        
        try {
            // Step 1: Initiate Mpamba payment
            const initiateResponse = await fetch(`${this.tnmMpambaConfig.baseUrl}/v1/payments/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.tnmMpambaConfig.apiKey}`,
                    'X-Merchant-ID': this.tnmMpambaConfig.merchantId
                },
                body: JSON.stringify({
                    merchantTransactionId: reference,
                    amount: amount,
                    currency: 'MWK',
                    msisdn: phoneNumber,
                    description: description,
                    callbackUrl: `${window.location.origin}/payment-callback`
                })
            });

            if (!initiateResponse.ok) {
                throw new Error(`TNM Mpamba initiation failed: ${initiateResponse.statusText}`);
            }

            const initiateData = await initiateResponse.json();
            console.log('TNM Mpamba payment initiated:', initiateData);

            // Step 2: Validate with PIN
            const validateResponse = await fetch(`${this.tnmMpambaConfig.baseUrl}/v1/payments/${reference}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.tnmMpambaConfig.apiKey}`,
                    'X-Merchant-ID': this.tnmMpambaConfig.merchantId
                },
                body: JSON.stringify({
                    pin: password,
                    otp: paymentData.otp || null
                })
            });

            if (!validateResponse.ok) {
                throw new Error(`TNM Mpamba validation failed: ${validateResponse.statusText}`);
            }

            const validateData = await validateResponse.json();
            console.log('TNM Mpamba payment validated:', validateData);

            return {
                success: true,
                transactionId: validateData.transactionId,
                reference: reference,
                amount: amount,
                status: 'completed',
                paymentMethod: 'tnm-mpamba',
                timestamp: new Date().toISOString(),
                response: validateData
            };

        } catch (error) {
            console.error('TNM Mpamba payment error:', error);
            throw new Error(`TNM Mpamba payment failed: ${error.message}`);
        }
    }

    // National Bank Payment Processing
    async processNationalBankPayment(paymentData) {
        const { amount, accountNumber, password, reference, description } = paymentData;
        
        try {
            // Step 1: Authenticate user
            const authResponse = await fetch(`${this.nationalBankConfig.baseUrl}/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.nationalBankConfig.apiKey
                },
                body: JSON.stringify({
                    accountNumber: accountNumber,
                    password: password
                })
            });

            if (!authResponse.ok) {
                throw new Error(`National Bank authentication failed: ${authResponse.statusText}`);
            }

            const authData = await authResponse.json();
            const authToken = authData.token;

            // Step 2: Process payment
            const paymentResponse = await fetch(`${this.nationalBankConfig.baseUrl}/v1/payments/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                    'X-API-Key': this.nationalBankConfig.apiKey
                },
                body: JSON.stringify({
                    reference: reference,
                    amount: amount,
                    currency: 'MWK',
                    description: description,
                    beneficiaryAccount: this.nationalBankConfig.merchantId,
                    beneficiaryName: 'MIRACLE ECD'
                })
            });

            if (!paymentResponse.ok) {
                throw new Error(`National Bank payment failed: ${paymentResponse.statusText}`);
            }

            const paymentData = await paymentResponse.json();
            console.log('National Bank payment completed:', paymentData);

            return {
                success: true,
                transactionId: paymentData.transactionId,
                reference: reference,
                amount: amount,
                status: 'completed',
                paymentMethod: 'national-bank',
                timestamp: new Date().toISOString(),
                response: paymentData
            };

        } catch (error) {
            console.error('National Bank payment error:', error);
            throw new Error(`National Bank payment failed: ${error.message}`);
        }
    }

    // Standard Bank Payment Processing
    async processStandardBankPayment(paymentData) {
        const { amount, accountNumber, password, reference, description } = paymentData;
        
        try {
            // Step 1: Authenticate user
            const authResponse = await fetch(`${this.standardBankConfig.baseUrl}/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.standardBankConfig.apiKey
                },
                body: JSON.stringify({
                    accountNumber: accountNumber,
                    password: password
                })
            });

            if (!authResponse.ok) {
                throw new Error(`Standard Bank authentication failed: ${authResponse.statusText}`);
            }

            const authData = await authResponse.json();
            const authToken = authData.token;

            // Step 2: Process payment
            const paymentResponse = await fetch(`${this.standardBankConfig.baseUrl}/v1/payments/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                    'X-API-Key': this.standardBankConfig.apiKey
                },
                body: JSON.stringify({
                    reference: reference,
                    amount: amount,
                    currency: 'MWK',
                    description: description,
                    beneficiaryAccount: this.standardBankConfig.merchantId,
                    beneficiaryName: 'MIRACLE ECD'
                })
            });

            if (!paymentResponse.ok) {
                throw new Error(`Standard Bank payment failed: ${paymentResponse.statusText}`);
            }

            const paymentData = await paymentResponse.json();
            console.log('Standard Bank payment completed:', paymentData);

            return {
                success: true,
                transactionId: paymentData.transactionId,
                reference: reference,
                amount: amount,
                status: 'completed',
                paymentMethod: 'standard-bank',
                timestamp: new Date().toISOString(),
                response: paymentData
            };

        } catch (error) {
            console.error('Standard Bank payment error:', error);
            throw new Error(`Standard Bank payment failed: ${error.message}`);
        }
    }

    // Cash Payment Processing (Manual verification)
    async processCashPayment(paymentData) {
        const { amount, reference, description } = paymentData;
        
        try {
            // For cash payments, we create a pending transaction
            // that needs manual verification by admin
            
            const cashPayment = {
                success: true,
                transactionId: `CASH-${Date.now()}`,
                reference: reference,
                amount: amount,
                status: 'pending_verification',
                paymentMethod: 'cash',
                timestamp: new Date().toISOString(),
                requiresManualVerification: true,
                instructions: 'Please bring cash payment to MIRACLE ECD office for verification'
            };

            console.log('Cash payment created (pending verification):', cashPayment);
            return cashPayment;

        } catch (error) {
            console.error('Cash payment error:', error);
            throw new Error(`Cash payment processing failed: ${error.message}`);
        }
    }

    // Test API connections
    async testAirtelMoneyConnection() {
        const response = await fetch(`${this.airtelMoneyConfig.baseUrl}/merchant/v1/payments/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.airtelMoneyConfig.apiKey}`,
                'X-Country': 'MW',
                'X-Currency': 'MWK'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Airtel Money API test failed: ${response.statusText}`);
        }
        
        return await response.json();
    }

    async testTnmMpambaConnection() {
        const response = await fetch(`${this.tnmMpambaConfig.baseUrl}/v1/health`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.tnmMpambaConfig.apiKey}`,
                'X-Merchant-ID': this.tnmMpambaConfig.merchantId
            }
        });
        
        if (!response.ok) {
            throw new Error(`TNM Mpamba API test failed: ${response.statusText}`);
        }
        
        return await response.json();
    }

    async testNationalBankConnection() {
        const response = await fetch(`${this.nationalBankConfig.baseUrl}/v1/health`, {
            method: 'GET',
            headers: {
                'X-API-Key': this.nationalBankConfig.apiKey
            }
        });
        
        if (!response.ok) {
            throw new Error(`National Bank API test failed: ${response.statusText}`);
        }
        
        return await response.json();
    }

    async testStandardBankConnection() {
        const response = await fetch(`${this.standardBankConfig.baseUrl}/v1/health`, {
            method: 'GET',
            headers: {
                'X-API-Key': this.standardBankConfig.apiKey
            }
        });
        
        if (!response.ok) {
            throw new Error(`Standard Bank API test failed: ${response.statusText}`);
        }
        
        return await response.json();
    }

    // Get payment status
    async getPaymentStatus(reference, paymentMethod) {
        try {
            let response;
            
            switch (paymentMethod) {
                case 'airtel-money':
                    response = await fetch(`${this.airtelMoneyConfig.baseUrl}/merchant/v1/payments/${reference}`, {
                        headers: {
                            'Authorization': `Bearer ${this.airtelMoneyConfig.apiKey}`,
                            'X-Country': 'MW',
                            'X-Currency': 'MWK'
                        }
                    });
                    break;
                case 'tnm-mpamba':
                    response = await fetch(`${this.tnmMpambaConfig.baseUrl}/v1/payments/${reference}/status`, {
                        headers: {
                            'Authorization': `Bearer ${this.tnmMpambaConfig.apiKey}`,
                            'X-Merchant-ID': this.tnmMpambaConfig.merchantId
                        }
                    });
                    break;
                default:
                    throw new Error(`Unsupported payment method for status check: ${paymentMethod}`);
            }
            
            if (!response.ok) {
                throw new Error(`Payment status check failed: ${response.statusText}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Payment status check error:', error);
            throw error;
        }
    }
}

// Initialize real payment gateway
const realPaymentGateway = new RealPaymentGateway();

// Export for use in other files
window.realPaymentGateway = realPaymentGateway;

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    realPaymentGateway.initialize().then(success => {
        if (success) {
            console.log('Real payment gateway ready for transactions');
        } else {
            console.warn('Real payment gateway initialization failed - using fallback');
        }
    });
}); 