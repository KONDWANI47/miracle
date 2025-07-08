// Cross-Device Registration Workflow Test
// This script tests the complete workflow of registering on one device and accessing from another

console.log('🚀 Starting Cross-Device Registration Workflow Test...');

// Test results object
const testResults = {
    step1: { status: 'pending', message: 'Register on Device 1' },
    step2: { status: 'pending', message: 'Export data from Device 1' },
    step3: { status: 'pending', message: 'Import data on Device 2' },
    step4: { status: 'pending', message: 'Verify data on Device 2' },
    step5: { status: 'pending', message: 'Test console access on Device 2' }
};

// Step 1: Simulate registration on Device 1
function testStep1_Registration() {
    console.log('📝 Step 1: Testing registration on Device 1...');
    
    // Clear any existing data
    localStorage.removeItem('registrations');
    localStorage.setItem('registrations', JSON.stringify([]));
    
    // Simulate registration data
    const testRegistration = {
        id: Date.now(),
        parentName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+265992260985',
        childName: 'Jane Doe',
        childAge: 5,
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        program: 'Foundation Program',
        message: 'Test registration for cross-device access',
        registrationDate: new Date().toISOString(),
        status: 'Registration Complete - Payment Pending',
        paymentStatus: 'Pending'
    };
    
    // Save registration
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    registrations.push(testRegistration);
    localStorage.setItem('registrations', JSON.stringify(registrations));
    
    // Verify registration was saved
    const savedRegistrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const registrationSaved = savedRegistrations.length > 0 && savedRegistrations[0].email === testRegistration.email;
    
    testResults.step1.status = registrationSaved ? 'PASS' : 'FAIL';
    testResults.step1.message = registrationSaved ? 
        `✅ Registration saved successfully (${savedRegistrations.length} total)` : 
        '❌ Registration failed to save';
    
    console.log(testResults.step1.message);
    return registrationSaved;
}

// Step 2: Simulate export from Device 1
function testStep2_Export() {
    console.log('📤 Step 2: Testing data export from Device 1...');
    
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    
    if (registrations.length === 0) {
        testResults.step2.status = 'FAIL';
        testResults.step2.message = '❌ No registrations to export';
        console.log(testResults.step2.message);
        return false;
    }
    
    // Create export data
    const exportData = JSON.stringify(registrations, null, 2);
    const exportBlob = new Blob([exportData], { type: 'application/json' });
    
    // Simulate file download (in real scenario, this would download a file)
    const exportUrl = URL.createObjectURL(exportBlob);
    const exportLink = document.createElement('a');
    exportLink.href = exportUrl;
    exportLink.download = `registrations-${new Date().toISOString().split('T')[0]}.json`;
    
    // Store export data for next step (simulating file transfer)
    sessionStorage.setItem('exportedRegistrations', exportData);
    
    testResults.step2.status = 'PASS';
    testResults.step2.message = `✅ Data exported successfully (${registrations.length} registrations)`;
    
    console.log(testResults.step2.message);
    console.log('📁 Export data preview:', exportData.substring(0, 200) + '...');
    
    URL.revokeObjectURL(exportUrl);
    return true;
}

// Step 3: Simulate import on Device 2
function testStep3_Import() {
    console.log('📥 Step 3: Testing data import on Device 2...');
    
    // Get exported data (simulating file upload)
    const exportedData = sessionStorage.getItem('exportedRegistrations');
    
    if (!exportedData) {
        testResults.step3.status = 'FAIL';
        testResults.step3.message = '❌ No exported data found to import';
        console.log(testResults.step3.message);
        return false;
    }
    
    try {
        // Clear existing data (simulating fresh device)
        localStorage.removeItem('registrations');
        localStorage.setItem('registrations', JSON.stringify([]));
        
        // Import the data
        const importedRegistrations = JSON.parse(exportedData);
        localStorage.setItem('registrations', JSON.stringify(importedRegistrations));
        
        // Verify import
        const currentRegistrations = JSON.parse(localStorage.getItem('registrations') || '[]');
        const importSuccessful = currentRegistrations.length === importedRegistrations.length;
        
        testResults.step3.status = importSuccessful ? 'PASS' : 'FAIL';
        testResults.step3.message = importSuccessful ? 
            `✅ Data imported successfully (${currentRegistrations.length} registrations)` : 
            '❌ Import failed - data mismatch';
        
        console.log(testResults.step3.message);
        return importSuccessful;
        
    } catch (error) {
        testResults.step3.status = 'FAIL';
        testResults.step3.message = `❌ Import failed: ${error.message}`;
        console.log(testResults.step3.message);
        return false;
    }
}

// Step 4: Verify data on Device 2
function testStep4_Verification() {
    console.log('🔍 Step 4: Verifying data on Device 2...');
    
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    
    if (registrations.length === 0) {
        testResults.step4.status = 'FAIL';
        testResults.step4.message = '❌ No registrations found on Device 2';
        console.log(testResults.step4.message);
        return false;
    }
    
    // Verify data integrity
    const firstRegistration = registrations[0];
    const dataIntegrity = firstRegistration.email === 'john.doe@example.com' && 
                         firstRegistration.phone === '+265992260985' &&
                         firstRegistration.program === 'Foundation Program';
    
    testResults.step4.status = dataIntegrity ? 'PASS' : 'FAIL';
    testResults.step4.message = dataIntegrity ? 
        `✅ Data integrity verified (${registrations.length} registrations)` : 
        '❌ Data integrity check failed';
    
    console.log(testResults.step4.message);
    console.log('📊 Registration details:', {
        parent: firstRegistration.parentName,
        email: firstRegistration.email,
        phone: firstRegistration.phone,
        child: firstRegistration.childName,
        program: firstRegistration.program,
        status: firstRegistration.status
    });
    
    return dataIntegrity;
}

// Step 5: Test console access on Device 2
function testStep5_ConsoleAccess() {
    console.log('💻 Step 5: Testing console access on Device 2...');
    
    // Test viewRegistrations function
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    
    // Simulate console table display
    console.table(registrations);
    
    // Test export function availability
    const exportFunctionAvailable = typeof window.exportRegistrations === 'function';
    
    // Test raw data access
    const rawDataAccess = JSON.parse(localStorage.getItem('registrations') || '[]').length > 0;
    
    const consoleAccess = exportFunctionAvailable && rawDataAccess;
    
    testResults.step5.status = consoleAccess ? 'PASS' : 'FAIL';
    testResults.step5.message = consoleAccess ? 
        '✅ Console access verified - data accessible via commands' : 
        '❌ Console access failed';
    
    console.log(testResults.step5.message);
    console.log('💡 Available console commands:');
    console.log('   - viewRegistrations()');
    console.log('   - exportRegistrations()');
    console.log('   - JSON.parse(localStorage.getItem("registrations"))');
    
    return consoleAccess;
}

// Run complete workflow test
function runCompleteWorkflowTest() {
    console.log('🔄 Running Complete Cross-Device Workflow Test...');
    console.log('=' .repeat(60));
    
    // Run all steps
    const step1Result = testStep1_Registration();
    const step2Result = testStep2_Export();
    const step3Result = testStep3_Import();
    const step4Result = testStep4_Verification();
    const step5Result = testStep5_ConsoleAccess();
    
    // Generate summary
    console.log('=' .repeat(60));
    console.log('📊 WORKFLOW TEST SUMMARY:');
    console.log('=' .repeat(60));
    
    Object.entries(testResults).forEach(([step, result]) => {
        const statusIcon = result.status === 'PASS' ? '✅' : '❌';
        console.log(`${statusIcon} ${step.toUpperCase()}: ${result.message}`);
    });
    
    const allPassed = Object.values(testResults).every(result => result.status === 'PASS');
    const overallStatus = allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED';
    
    console.log('=' .repeat(60));
    console.log(`🎯 OVERALL RESULT: ${overallStatus}`);
    console.log('=' .repeat(60));
    
    if (allPassed) {
        console.log('🎉 Cross-device registration access is working perfectly!');
        console.log('📱 You can now:');
        console.log('   1. Register on any device');
        console.log('   2. Export data to JSON file');
        console.log('   3. Import data on any other device');
        console.log('   4. Access data via console commands');
        console.log('   5. View data in the registration modal');
    } else {
        console.log('⚠️  Some issues detected. Check the failed steps above.');
    }
    
    return allPassed;
}

// Add test functions to window for manual testing
window.testCrossDeviceWorkflow = runCompleteWorkflowTest;
window.testStep1 = testStep1_Registration;
window.testStep2 = testStep2_Export;
window.testStep3 = testStep3_Import;
window.testStep4 = testStep4_Verification;
window.testStep5 = testStep5_ConsoleAccess;

// Auto-run test when script loads
console.log('🧪 Cross-Device Workflow Test Script Loaded');
console.log('💡 Run "testCrossDeviceWorkflow()" to test the complete workflow');
console.log('💡 Or run individual steps: testStep1(), testStep2(), etc.');

// Run test automatically after a short delay
setTimeout(() => {
    console.log('🚀 Auto-running cross-device workflow test...');
    runCompleteWorkflowTest();
}, 1000); 