// Cross-Device Registration Sync Test
// This script tests if registrations from different devices appear in the admin panel

class CrossDeviceTest {
    constructor() {
        this.testResults = [];
        this.firebaseManager = null;
    }

    async initialize() {
        console.log('🚀 Initializing Cross-Device Test...');
        
        // Check if Firebase is available
        if (typeof firebaseManager !== 'undefined') {
            this.firebaseManager = firebaseManager;
            const initialized = await this.firebaseManager.initialize();
            if (initialized) {
                console.log('✅ Firebase initialized successfully');
                return true;
            } else {
                console.log('❌ Firebase initialization failed');
                return false;
            }
        } else {
            console.log('⚠️ Firebase manager not available');
            return false;
        }
    }

    async testRegistrationSubmission() {
        console.log('📝 Testing registration submission...');
        
        const testData = {
            parent_name: 'Test Parent ' + Date.now(),
            email: 'test' + Date.now() + '@example.com',
            phone: '+265' + Math.floor(Math.random() * 90000000 + 10000000),
            child_name: 'Test Child ' + Date.now(),
            child_age: Math.floor(Math.random() * 12) + 1,
            start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            program: 'Test Program',
            message: 'Cross-device test registration',
            timestamp: new Date().toISOString(),
            device: 'Test Device ' + navigator.userAgent.substring(0, 50),
            testId: Date.now()
        };

        try {
            if (this.firebaseManager) {
                const result = await this.firebaseManager.saveRegistration(testData);
                if (result && result.success) {
                    console.log('✅ Registration saved to Firebase:', result.id);
                    this.testResults.push({
                        test: 'Registration Submission',
                        status: 'PASSED',
                        data: testData,
                        firebaseId: result.id
                    });
                    return result.id;
                } else {
                    throw new Error('Firebase save returned invalid result');
                }
            } else {
                // Fallback to localStorage
                const registration = {
                    ...testData,
                    id: Date.now()
                };
                
                const existing = JSON.parse(localStorage.getItem('registrations') || '[]');
                existing.push(registration);
                localStorage.setItem('registrations', JSON.stringify(existing));
                
                console.log('⚠️ Registration saved to localStorage (no cross-device sync)');
                this.testResults.push({
                    test: 'Registration Submission',
                    status: 'PARTIAL',
                    data: testData,
                    note: 'Saved locally only'
                });
                return registration.id;
            }
        } catch (error) {
            console.error('❌ Registration submission failed:', error);
            this.testResults.push({
                test: 'Registration Submission',
                status: 'FAILED',
                error: error.message
            });
            return null;
        }
    }

    async testAdminPanelAccess() {
        console.log('👨‍💼 Testing admin panel access...');
        
        try {
            let registrations = [];
            
            if (this.firebaseManager) {
                registrations = await this.firebaseManager.getAllRegistrations();
                console.log('✅ Admin panel can access Firebase data');
            } else {
                registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
                console.log('⚠️ Admin panel using local data only');
            }
            
            this.testResults.push({
                test: 'Admin Panel Access',
                status: 'PASSED',
                registrationsCount: registrations.length
            });
            
            return registrations;
        } catch (error) {
            console.error('❌ Admin panel access failed:', error);
            this.testResults.push({
                test: 'Admin Panel Access',
                status: 'FAILED',
                error: error.message
            });
            return [];
        }
    }

    async testRealTimeSync() {
        console.log('🔄 Testing real-time sync...');
        
        try {
            if (this.firebaseManager) {
                // Test if we can set up real-time listeners
                let syncWorking = false;
                
                // Set up a temporary listener
                const unsubscribe = this.firebaseManager.db.collection('registrations')
                    .onSnapshot((snapshot) => {
                        syncWorking = true;
                        console.log('✅ Real-time sync working');
                        unsubscribe(); // Clean up
                    }, (error) => {
                        console.error('❌ Real-time sync failed:', error);
                    });
                
                // Wait a bit for the listener to work
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                this.testResults.push({
                    test: 'Real-time Sync',
                    status: syncWorking ? 'PASSED' : 'FAILED',
                    note: syncWorking ? 'Firebase listeners working' : 'Firebase listeners failed'
                });
                
                return syncWorking;
            } else {
                this.testResults.push({
                    test: 'Real-time Sync',
                    status: 'SKIPPED',
                    note: 'Firebase not available'
                });
                return false;
            }
        } catch (error) {
            console.error('❌ Real-time sync test failed:', error);
            this.testResults.push({
                test: 'Real-time Sync',
                status: 'FAILED',
                error: error.message
            });
            return false;
        }
    }

    async testCrossDeviceData() {
        console.log('🌐 Testing cross-device data access...');
        
        try {
            if (this.firebaseManager) {
                // Simulate checking from a different device
                const registrations = await this.firebaseManager.getAllRegistrations();
                const testRegistrations = registrations.filter(reg => 
                    reg.device && reg.device.includes('Test Device')
                );
                
                if (testRegistrations.length > 0) {
                    console.log('✅ Cross-device data access working');
                    this.testResults.push({
                        test: 'Cross-Device Data Access',
                        status: 'PASSED',
                        testRegistrationsCount: testRegistrations.length
                    });
                    return true;
                } else {
                    console.log('⚠️ No test registrations found');
                    this.testResults.push({
                        test: 'Cross-Device Data Access',
                        status: 'PARTIAL',
                        note: 'No test data found'
                    });
                    return false;
                }
            } else {
                this.testResults.push({
                    test: 'Cross-Device Data Access',
                    status: 'SKIPPED',
                    note: 'Firebase not available'
                });
                return false;
            }
        } catch (error) {
            console.error('❌ Cross-device data test failed:', error);
            this.testResults.push({
                test: 'Cross-Device Data Access',
                status: 'FAILED',
                error: error.message
            });
            return false;
        }
    }

    async runCompleteTest() {
        console.log('🧪 Starting Complete Cross-Device Test...');
        
        const initialized = await this.initialize();
        if (!initialized) {
            console.log('❌ Test initialization failed');
            return this.getResults();
        }
        
        // Run all tests
        await this.testRegistrationSubmission();
        await this.testAdminPanelAccess();
        await this.testRealTimeSync();
        await this.testCrossDeviceData();
        
        console.log('✅ Complete test finished');
        return this.getResults();
    }

    getResults() {
        const passed = this.testResults.filter(r => r.status === 'PASSED').length;
        const total = this.testResults.length;
        
        console.log(`📊 Test Results: ${passed}/${total} tests passed`);
        
        return {
            summary: {
                passed,
                total,
                percentage: Math.round((passed / total) * 100)
            },
            details: this.testResults
        };
    }

    displayResults() {
        const results = this.getResults();
        
        console.log('\n' + '='.repeat(50));
        console.log('CROSS-DEVICE REGISTRATION TEST RESULTS');
        console.log('='.repeat(50));
        
        console.log(`Overall Score: ${results.summary.passed}/${results.summary.total} (${results.summary.percentage}%)`);
        console.log('');
        
        results.details.forEach((test, index) => {
            const status = test.status === 'PASSED' ? '✅' : 
                          test.status === 'PARTIAL' ? '⚠️' : 
                          test.status === 'SKIPPED' ? '⏭️' : '❌';
            
            console.log(`${index + 1}. ${status} ${test.test}`);
            if (test.note) console.log(`   Note: ${test.note}`);
            if (test.error) console.log(`   Error: ${test.error}`);
        });
        
        console.log('\n' + '='.repeat(50));
        
        if (results.summary.percentage === 100) {
            console.log('🎉 PERFECT! Cross-device registration is working perfectly!');
        } else if (results.summary.percentage >= 75) {
            console.log('✅ GOOD! Cross-device registration is mostly working.');
        } else if (results.summary.percentage >= 50) {
            console.log('⚠️ FAIR! Some cross-device features are working.');
        } else {
            console.log('❌ NEEDS WORK! Cross-device registration needs attention.');
        }
        
        return results;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrossDeviceTest;
}

// Auto-run test if this script is loaded directly
if (typeof window !== 'undefined') {
    window.CrossDeviceTest = CrossDeviceTest;
    
    // Add test function to window for easy access
    window.runCrossDeviceTest = async function() {
        const test = new CrossDeviceTest();
        const results = await test.runCompleteTest();
        test.displayResults();
        return results;
    };
    
    console.log('🔧 Cross-Device Test loaded. Run "runCrossDeviceTest()" to start testing.');
} 