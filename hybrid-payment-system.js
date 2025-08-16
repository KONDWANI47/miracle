// Hybrid Payment System for MIRACLE ECD
// Works immediately while API keys are being obtained

class HybridPaymentGateway {
    constructor() {
        this.paymentMethods = {
            'airtel-money': {
                name: 'Airtel Money',
                instructions: 'Send money to +265 992 260 985 and enter reference',
                manualVerification: true
            },
            'tnm-mpamba': {
                name: 'TNM Mpamba', 
                instructions: 'Send money to +265 992 260 985 and enter reference',
                manualVerification: true
            },
            'national-bank': {
                name: 'National Bank',
                instructions: 'Transfer to Account: 1234567890, Reference: [PAYMENT_REF]',
                manualVerification: true
            },
            'standard-bank': {
                name: 'Standard Bank',
                instructions: 'Transfer to Account: 0987654321, Reference: [PAYMENT_REF]',
                manualVerification: true
            },
            'cash': {
                name: 'Cash Payment',
                instructions: 'Bring cash to MIRACLE ECD office with payment reference',
                manualVerification: true
            }
        };
        
        this.pendingPayments = new Map();
        this.verificationCodes = new Map();
    }

    // Process payment with manual verification
    async processPayment(paymentData) {
        const { paymentMethod, amount, phoneNumber, password, reference, description } = paymentData;
        
        try {
            console.log(`Processing hybrid payment: ${paymentMethod} - MWK ${amount}`);
            
            // Generate verification code
            const verificationCode = this.generateVerificationCode();
            this.verificationCodes.set(reference, verificationCode);
            
            // Create pending payment record
            const pendingPayment = {
                id: reference,
                paymentMethod: paymentMethod,
                amount: amount,
                phoneNumber: phoneNumber,
                description: description,
                status: 'pending_verification',
                verificationCode: verificationCode,
                timestamp: new Date().toISOString(),
                instructions: this.getPaymentInstructions(paymentMethod, reference, verificationCode)
            };
            
            this.pendingPayments.set(reference, pendingPayment);
            
            // Return immediate response
            return {
                success: true,
                transactionId: `HYBRID-${Date.now()}`,
                reference: reference,
                amount: amount,
                status: 'pending_verification',
                paymentMethod: paymentMethod,
                timestamp: new Date().toISOString(),
                hybrid: true,
                verificationCode: verificationCode,
                instructions: pendingPayment.instructions,
                message: 'Payment initiated. Please complete the transfer and contact admin for verification.'
            };
            
        } catch (error) {
            console.error('Hybrid payment error:', error);
            throw new Error(`Hybrid payment failed: ${error.message}`);
        }
    }

    // Get payment instructions
    getPaymentInstructions(paymentMethod, reference, verificationCode) {
        const method = this.paymentMethods[paymentMethod];
        if (!method) return 'Payment method not supported';
        
        let instructions = method.instructions;
        
        // Replace placeholders
        instructions = instructions.replace('[PAYMENT_REF]', reference);
        instructions = instructions.replace('[VERIFICATION_CODE]', verificationCode);
        
        return {
            title: `${method.name} Payment Instructions`,
            steps: [
                `1. ${instructions}`,
                `2. Keep your payment reference: ${reference}`,
                `3. Contact admin with reference for verification`,
                `4. Admin will verify and complete your registration`
            ],
            contactInfo: {
                phone: '+265 992 260 985',
                email: 'cupicsart@gmail.com',
                address: 'Area 25, Sector 5, Lilongwe, Malawi'
            }
        };
    }

    // Verify payment manually (admin function)
    async verifyPayment(reference, verificationCode, adminNotes = '') {
        const pendingPayment = this.pendingPayments.get(reference);
        
        if (!pendingPayment) {
            throw new Error('Payment reference not found');
        }
        
        if (pendingPayment.verificationCode !== verificationCode) {
            throw new Error('Invalid verification code');
        }
        
        // Update payment status
        pendingPayment.status = 'verified';
        pendingPayment.verifiedAt = new Date().toISOString();
        pendingPayment.adminNotes = adminNotes;
        
        return {
            success: true,
            transactionId: pendingPayment.id,
            reference: reference,
            amount: pendingPayment.amount,
            status: 'completed',
            paymentMethod: pendingPayment.paymentMethod,
            timestamp: pendingPayment.timestamp,
            verifiedAt: pendingPayment.verifiedAt,
            hybrid: true,
            adminNotes: adminNotes
        };
    }

    // Get pending payments (admin function)
    getPendingPayments() {
        return Array.from(this.pendingPayments.values())
            .filter(payment => payment.status === 'pending_verification');
    }

    // Get payment status
    getPaymentStatus(reference) {
        const payment = this.pendingPayments.get(reference);
        return payment || null;
    }

    // Generate verification code
    generateVerificationCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Initialize gateway
    async initialize() {
        console.log('Hybrid payment gateway initialized');
        return true;
    }

    // Test connections (simulated)
    async testConnections() {
        console.log('Testing hybrid payment connections...');
        
        const tests = [
            { name: 'Airtel Money', status: 'Manual verification required' },
            { name: 'TNM Mpamba', status: 'Manual verification required' },
            { name: 'National Bank', status: 'Manual verification required' },
            { name: 'Standard Bank', status: 'Manual verification required' },
            { name: 'Cash Payment', status: 'Manual verification required' }
        ];

        for (const test of tests) {
            console.log(`✅ ${test.name}: ${test.status}`);
        }
        
        return true;
    }
}

// Initialize hybrid payment gateway
const hybridPaymentGateway = new HybridPaymentGateway();

// Export for use in other files
window.hybridPaymentGateway = hybridPaymentGateway;

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    hybridPaymentGateway.initialize().then(success => {
        if (success) {
            console.log('Hybrid payment gateway ready for immediate use');
        }
    });
}); 