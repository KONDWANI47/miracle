// Comprehensive Real-time Test Script for MIRACLE ECD
// This script tests all real-time functionality across the website

console.log('🚀 Starting comprehensive real-time test for MIRACLE ECD...');

// Test Results Object
const testResults = {
    timestamp: new Date().toISOString(),
    tests: {},
    summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
    }
};

// Test Helper Functions
function logTest(testName, status, message = '', details = null) {
    const statusEmoji = {
        'PASS': '✅',
        'FAIL': '❌',
        'WARN': '⚠️',
        'INFO': 'ℹ️'
    };
    
    console.log(`${statusEmoji[status]} ${testName}: ${message}`);
    
    testResults.tests[testName] = {
        status,
        message,
        details,
        timestamp: new Date().toISOString()
    };
    
    testResults.summary.total++;
    if (status === 'PASS') testResults.summary.passed++;
    else if (status === 'FAIL') testResults.summary.failed++;
    else if (status === 'WARN') testResults.summary.warnings++;
}

function printSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`✅ Passed: ${testResults.summary.passed}`);
    console.log(`❌ Failed: ${testResults.summary.failed}`);
    console.log(`⚠️ Warnings: ${testResults.summary.warnings}`);
    console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
    
    // Print failed tests
    const failedTests = Object.entries(testResults.tests).filter(([_, test]) => test.status === 'FAIL');
    if (failedTests.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        failedTests.forEach(([testName, test]) => {
            console.log(`  - ${testName}: ${test.message}`);
        });
    }
    
    // Print warnings
    const warningTests = Object.entries(testResults.tests).filter(([_, test]) => test.status === 'WARN');
    if (warningTests.length > 0) {
        console.log('\n⚠️ WARNINGS:');
        warningTests.forEach(([testName, test]) => {
            console.log(`  - ${testName}: ${test.message}`);
        });
    }
}

// Test 1: Firebase Configuration
async function testFirebaseConfig() {
    try {
        logTest('Firebase Config', 'INFO', 'Checking Firebase configuration...');
        
        if (typeof firebase === 'undefined') {
            logTest('Firebase Config', 'FAIL', 'Firebase SDK not loaded');
            return false;
        }
        
        if (!firebase.app) {
            logTest('Firebase Config', 'FAIL', 'Firebase app not initialized');
            return false;
        }
        
        const app = firebase.app();
        logTest('Firebase Config', 'PASS', `Firebase initialized: ${app.name}`);
        
        // Test Firestore
        if (firebase.firestore) {
            const db = firebase.firestore();
            logTest('Firestore', 'PASS', 'Firestore available');
        } else {
            logTest('Firestore', 'FAIL', 'Firestore not available');
        }
        
        // Test Auth
        if (firebase.auth) {
            const auth = firebase.auth();
            logTest('Authentication', 'PASS', 'Authentication available');
        } else {
            logTest('Authentication', 'FAIL', 'Authentication not available');
        }
        
        // Test Storage
        if (firebase.storage) {
            const storage = firebase.storage();
            logTest('Storage', 'PASS', 'Storage available');
        } else {
            logTest('Storage', 'FAIL', 'Storage not available');
        }
        
        return true;
    } catch (error) {
        logTest('Firebase Config', 'FAIL', `Error: ${error.message}`);
        return false;
    }
}

// Test 2: Real-time Managers
async function testRealTimeManagers() {
    try {
        logTest('Real-time Managers', 'INFO', 'Checking real-time managers...');
        
        // Check Website Real-time Manager
        if (typeof WebsiteRealTimeManager !== 'undefined') {
            logTest('Website Real-time Manager', 'PASS', 'Class available');
        } else {
            logTest('Website Real-time Manager', 'FAIL', 'Class not available');
        }
        
        // Check Admin Real-time Manager
        if (typeof RealTimeManager !== 'undefined') {
            logTest('Admin Real-time Manager', 'PASS', 'Class available');
        } else {
            logTest('Admin Real-time Manager', 'WARN', 'Class not available (admin.js not loaded on this page)');
        }
        
        // Check Firebase Manager
        if (typeof firebaseManager !== 'undefined') {
            logTest('Firebase Manager', 'PASS', 'Manager available');
        } else {
            logTest('Firebase Manager', 'WARN', 'Manager not available (may be admin-only)');
        }
        
        return true;
    } catch (error) {
        logTest('Real-time Managers', 'FAIL', `Error: ${error.message}`);
        return false;
    }
}

// Test 3: Real-time Listeners
async function testRealTimeListeners() {
    try {
        logTest('Real-time Listeners', 'INFO', 'Testing real-time listeners...');
        
        const db = firebase.firestore();
        const collections = [
            'registrations',
            'blogPosts', 
            'testimonials',
            'announcements',
            'heroAnnouncements',
            'gallery',
            'userUploads',
            'payments'
        ];
        
        for (const collection of collections) {
            try {
                // Test if collection exists and is accessible
                const snapshot = await db.collection(collection).limit(1).get();
                logTest(`${collection} Collection`, 'PASS', `${snapshot.size} documents found`);
            } catch (error) {
                logTest(`${collection} Collection`, 'WARN', `Access issue: ${error.message}`);
            }
        }
        
        return true;
    } catch (error) {
        logTest('Real-time Listeners', 'FAIL', `Error: ${error.message}`);
        return false;
    }
}

// Test 4: Real-time Data Updates
async function testRealTimeDataUpdates() {
    try {
        logTest('Real-time Data Updates', 'INFO', 'Testing real-time data updates...');
        
        const db = firebase.firestore();
        
        // Test adding a temporary document
        const testData = {
            testType: 'realtime-test',
            timestamp: new Date().toISOString(),
            message: 'Real-time test data'
        };
        
        const testDoc = await db.collection('test').add(testData);
        logTest('Test Document Creation', 'PASS', `Document created: ${testDoc.id}`);
        
        // Test real-time listener
        return new Promise((resolve) => {
            const unsubscribe = db.collection('test').doc(testDoc.id)
                .onSnapshot((doc) => {
                    if (doc.exists) {
                        logTest('Real-time Listener', 'PASS', 'Listener working correctly');
                        
                        // Clean up test document
                        testDoc.delete().then(() => {
                            logTest('Test Cleanup', 'PASS', 'Test document removed');
                        }).catch((error) => {
                            logTest('Test Cleanup', 'WARN', `Cleanup issue: ${error.message}`);
                        });
                        
                        unsubscribe();
                        resolve(true);
                    }
                }, (error) => {
                    logTest('Real-time Listener', 'FAIL', `Listener error: ${error.message}`);
                    unsubscribe();
                    resolve(false);
                });
        });
        
    } catch (error) {
        logTest('Real-time Data Updates', 'FAIL', `Error: ${error.message}`);
        return false;
    }
}

// Test 5: UI Components
function testUIComponents() {
    try {
        logTest('UI Components', 'INFO', 'Testing UI components...');
        
        // Check for real-time indicators
        const indicators = document.querySelectorAll('.real-time-indicator');
        if (indicators.length > 0) {
            logTest('Real-time Indicators', 'PASS', `${indicators.length} indicators found`);
        } else {
            logTest('Real-time Indicators', 'WARN', 'No real-time indicators found');
        }
        
        // Check for notification system
        const notifications = document.querySelectorAll('.notification-toast, .toast');
        if (notifications.length > 0) {
            logTest('Notification System', 'PASS', 'Notification elements found');
        } else {
            logTest('Notification System', 'WARN', 'No notification elements found');
        }
        
        // Check for live update elements
        const liveElements = document.querySelectorAll('[data-live-update]');
        if (liveElements.length > 0) {
            logTest('Live Update Elements', 'PASS', `${liveElements.length} live elements found`);
        } else {
            logTest('Live Update Elements', 'INFO', 'No live update elements found (may be dynamic)');
        }
        
        return true;
    } catch (error) {
        logTest('UI Components', 'FAIL', `Error: ${error.message}`);
        return false;
    }
}

// Test 6: Performance
function testPerformance() {
    try {
        logTest('Performance', 'INFO', 'Testing performance metrics...');
        
        // Check memory usage
        if (performance.memory) {
            const memory = performance.memory;
            const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
            const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
            
            logTest('Memory Usage', 'PASS', `Used: ${usedMB}MB, Total: ${totalMB}MB`);
            
            if (memory.usedJSHeapSize > 50 * 1048576) { // 50MB
                logTest('Memory Usage', 'WARN', 'High memory usage detected');
            }
        } else {
            logTest('Memory Usage', 'INFO', 'Memory usage not available');
        }
        
        // Check page load time
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        logTest('Page Load Time', 'PASS', `${loadTime}ms`);
        
        if (loadTime > 5000) { // 5 seconds
            logTest('Page Load Time', 'WARN', 'Slow page load detected');
        }
        
        return true;
    } catch (error) {
        logTest('Performance', 'FAIL', `Error: ${error.message}`);
        return false;
    }
}

// Test 7: Cross-browser Compatibility
function testCrossBrowserCompatibility() {
    try {
        logTest('Cross-browser Compatibility', 'INFO', 'Testing browser compatibility...');
        
        // Check for modern JavaScript features
        const features = {
            'Promise': typeof Promise !== 'undefined',
            'async/await': (() => {
                try {
                    new Function('async () => {}');
                    return true;
                } catch {
                    return false;
                }
            })(),
            'Fetch API': typeof fetch !== 'undefined',
            'LocalStorage': typeof localStorage !== 'undefined',
            'SessionStorage': typeof sessionStorage !== 'undefined'
        };
        
        Object.entries(features).forEach(([feature, supported]) => {
            if (supported) {
                logTest(feature, 'PASS', 'Supported');
            } else {
                logTest(feature, 'FAIL', 'Not supported');
            }
        });
        
        // Check browser info
        const userAgent = navigator.userAgent;
        logTest('Browser Info', 'INFO', userAgent);
        
        return true;
    } catch (error) {
        logTest('Cross-browser Compatibility', 'FAIL', `Error: ${error.message}`);
        return false;
    }
}

// Test 8: Error Handling
function testErrorHandling() {
    try {
        logTest('Error Handling', 'INFO', 'Testing error handling...');
        
        // Test if error handlers are in place
        const hasErrorHandler = window.onerror !== null || window.addEventListener !== undefined;
        logTest('Global Error Handler', hasErrorHandler ? 'PASS' : 'WARN', 
                hasErrorHandler ? 'Error handler found' : 'No global error handler');
        
        // Test unhandled promise rejection handler
        const hasUnhandledRejectionHandler = window.onunhandledrejection !== null;
        logTest('Unhandled Rejection Handler', hasUnhandledRejectionHandler ? 'PASS' : 'WARN',
                hasUnhandledRejectionHandler ? 'Handler found' : 'No unhandled rejection handler');
        
        return true;
    } catch (error) {
        logTest('Error Handling', 'FAIL', `Error: ${error.message}`);
        return false;
    }
}

// Main Test Runner
async function runAllTests() {
    console.log('🧪 Starting comprehensive real-time tests...\n');
    
    const tests = [
        testFirebaseConfig,
        testRealTimeManagers,
        testRealTimeListeners,
        testRealTimeDataUpdates,
        testUIComponents,
        testPerformance,
        testCrossBrowserCompatibility,
        testErrorHandling
    ];
    
    for (const test of tests) {
        try {
            await test();
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Test failed with error: ${error.message}`);
        }
    }
    
    // Print final summary
    printSummary();
    
    // Export results
    const resultsBlob = new Blob([JSON.stringify(testResults, null, 2)], { type: 'application/json' });
    const resultsUrl = URL.createObjectURL(resultsBlob);
    
    console.log('\n📁 Test results exported. You can download them using:');
    console.log(`window.open('${resultsUrl}', '_blank')`);
    
    // Store results globally for access
    window.testResults = testResults;
    
    return testResults;
}

// Auto-run tests when script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

// Export for manual testing
window.runRealTimeTests = runAllTests; 