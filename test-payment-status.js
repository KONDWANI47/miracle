// Quick Payment Gateway Status Test
console.log('🔍 Testing Payment Gateway Status...\n');

// Check if payment config is loaded
if (typeof PAYMENT_CONFIG !== 'undefined') {
    console.log('✅ Payment configuration loaded');
    
    // Check Airtel Money config
    const airtelConfig = PAYMENT_CONFIG.airtelMoney;
    if (airtelConfig.apiKey && airtelConfig.apiKey !== 'YOUR_AIRTEL_MONEY_API_KEY') {
        console.log('✅ Airtel Money: Configured with real API key');
        console.log(`   Environment: ${airtelConfig.environment}`);
    } else {
        console.log('❌ Airtel Money: Not configured (using placeholder)');
    }
    
    // Check TNM Mpamba config
    const tnmConfig = PAYMENT_CONFIG.tnmMpamba;
    if (tnmConfig.apiKey && tnmConfig.apiKey !== 'YOUR_TNM_MPAMBA_API_KEY') {
        console.log('✅ TNM Mpamba: Configured with real API key');
        console.log(`   Environment: ${tnmConfig.environment}`);
    } else {
        console.log('❌ TNM Mpamba: Not configured (using placeholder)');
    }
    
    // Check general settings
    console.log(`\n📊 General Settings:`);
    console.log(`   Real Payments Enabled: ${PAYMENT_CONFIG.general.enableRealPayments}`);
    console.log(`   Simulation Enabled: ${PAYMENT_CONFIG.general.enableSimulation}`);
    console.log(`   Environment: ${airtelConfig.environment}`);
    
} else {
    console.log('❌ Payment configuration not found');
}

// Check if real payment gateway is available
if (typeof realPaymentGateway !== 'undefined') {
    console.log('\n✅ Real Payment Gateway detected');
    
    // Test initialization
    realPaymentGateway.initialize().then(success => {
        if (success) {
            console.log('✅ Payment gateway initialized successfully');
        } else {
            console.log('❌ Payment gateway initialization failed');
        }
    }).catch(error => {
        console.log('❌ Payment gateway error:', error.message);
    });
    
} else {
    console.log('\n❌ Real Payment Gateway not found');
}

// Check if we're in production or sandbox
const isProduction = PAYMENT_CONFIG?.airtelMoney?.environment === 'production';
console.log(`\n🌍 Environment: ${isProduction ? 'PRODUCTION (Real Money)' : 'SANDBOX (Test Mode)'}`);

// Summary
console.log('\n📋 SUMMARY:');
if (isProduction && PAYMENT_CONFIG?.airtelMoney?.apiKey !== 'YOUR_AIRTEL_MONEY_API_KEY') {
    console.log('💰 REAL MONEY TRANSACTIONS: ENABLED');
    console.log('⚠️  WARNING: This will process actual money transfers!');
} else {
    console.log('🧪 SIMULATION MODE: ACTIVE');
    console.log('ℹ️  No real money will be transferred');
    console.log('ℹ️  To enable real payments:');
    console.log('   1. Get API keys from payment providers');
    console.log('   2. Update payment-config.js');
    console.log('   3. Set environment to "production"');
}

// Test a simulated payment
console.log('\n🧪 Testing simulated payment...');
const testPaymentData = {
    paymentMethod: 'airtel-money',
    amount: 1000,
    phoneNumber: '+265991234567',
    password: '1234',
    reference: `TEST-${Date.now()}`,
    description: 'Test payment'
};

if (typeof realPaymentGateway !== 'undefined') {
    realPaymentGateway.processPayment(testPaymentData)
        .then(result => {
            console.log('✅ Payment test completed');
            console.log('Result:', result);
            console.log(`Real Money: ${result.realPayment ? 'YES' : 'NO'}`);
            console.log(`Simulated: ${result.simulated ? 'YES' : 'NO'}`);
        })
        .catch(error => {
            console.log('❌ Payment test failed:', error.message);
        });
} else {
    console.log('❌ Cannot test payment - gateway not available');
} 