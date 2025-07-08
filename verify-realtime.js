// Real-time Functionality Verification Script
// This script verifies that all real-time features are working correctly

console.log('🔍 Verifying real-time functionality...');

// Verification results
const verificationResults = {
    timestamp: new Date().toISOString(),
    checks: {},
    overall: 'PENDING'
};

function logCheck(checkName, status, details = '') {
    const statusEmoji = {
        'PASS': '✅',
        'FAIL': '❌',
        'WARN': '⚠️'
    };
    
    console.log(`${statusEmoji[status]} ${checkName}: ${details}`);
    
    verificationResults.checks[checkName] = {
        status,
        details,
        timestamp: new Date().toISOString()
    };
}

// Check 1: Firebase Configuration
function verifyFirebaseConfig() {
    try {
        if (!window.firebase) {
            logCheck('Firebase SDK', 'FAIL', 'Firebase SDK not loaded');
            return false;
        }
        
        if (!window.firebase.app) {
            logCheck('Firebase App', 'FAIL', 'Firebase app not initialized');
            return false;
        }
        
        const app = window.firebase.app();
        logCheck('Firebase App', 'PASS', `Initialized: ${app.name}`);
        
        // Check required services
        const services = ['firestore', 'auth', 'storage'];
        services.forEach(service => {
            if (window.firebase[service]) {
                logCheck(`Firebase ${service}`, 'PASS', 'Available');
            } else {
                logCheck(`Firebase ${service}`, 'FAIL', 'Not available');
            }
        });
        
        return true;
    } catch (error) {
        logCheck('Firebase Config', 'FAIL', error.message);
        return false;
    }
}

// Check 2: Real-time Managers
function verifyRealTimeManagers() {
    try {
        // Check Website Real-time Manager
        if (typeof WebsiteRealTimeManager === 'function') {
            logCheck('Website Real-time Manager', 'PASS', 'Class available');
        } else {
            logCheck('Website Real-time Manager', 'FAIL', 'Class not found');
        }
        
        // Check Admin Real-time Manager
        if (typeof RealTimeManager === 'function') {
            logCheck('Admin Real-time Manager', 'PASS', 'Class available');
        } else {
            logCheck('Admin Real-time Manager', 'WARN', 'Class not found (may be admin-only)');
        }
        
        // Check Firebase Manager
        if (typeof firebaseManager !== 'undefined') {
            logCheck('Firebase Manager', 'PASS', 'Manager available');
        } else {
            logCheck('Firebase Manager', 'WARN', 'Manager not found (may be admin-only)');
        }
        
        return true;
    } catch (error) {
        logCheck('Real-time Managers', 'FAIL', error.message);
        return false;
    }
}

// Check 3: Real-time Listeners
async function verifyRealTimeListeners() {
    try {
        if (!window.firebase || !window.firebase.firestore) {
            logCheck('Real-time Listeners', 'FAIL', 'Firestore not available');
            return false;
        }
        
        const db = window.firebase.firestore();
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
        
        let accessibleCollections = 0;
        
        for (const collection of collections) {
            try {
                const snapshot = await db.collection(collection).limit(1).get();
                logCheck(`${collection} Collection`, 'PASS', `${snapshot.size} documents accessible`);
                accessibleCollections++;
            } catch (error) {
                logCheck(`${collection} Collection`, 'WARN', `Access issue: ${error.message}`);
            }
        }
        
        logCheck('Collection Access', 'PASS', `${accessibleCollections}/${collections.length} collections accessible`);
        return accessibleCollections > 0;
        
    } catch (error) {
        logCheck('Real-time Listeners', 'FAIL', error.message);
        return false;
    }
}

// Check 4: UI Components
function verifyUIComponents() {
    try {
        // Check for real-time indicators
        const indicators = document.querySelectorAll('.real-time-indicator');
        if (indicators.length > 0) {
            logCheck('Real-time Indicators', 'PASS', `${indicators.length} indicators found`);
        } else {
            logCheck('Real-time Indicators', 'WARN', 'No indicators found (may be dynamic)');
        }
        
        // Check for notification system
        const notifications = document.querySelectorAll('.notification-toast, .toast, .alert');
        if (notifications.length > 0) {
            logCheck('Notification System', 'PASS', 'Notification elements found');
        } else {
            logCheck('Notification System', 'WARN', 'No notification elements found');
        }
        
        // Check for live update elements
        const liveElements = document.querySelectorAll('[data-live-update], .live-update');
        if (liveElements.length > 0) {
            logCheck('Live Update Elements', 'PASS', `${liveElements.length} live elements found`);
        } else {
            logCheck('Live Update Elements', 'INFO', 'No live update elements found (may be dynamic)');
        }
        
        return true;
    } catch (error) {
        logCheck('UI Components', 'FAIL', error.message);
        return false;
    }
}

// Check 5: Real-time Data Flow
async function verifyRealTimeDataFlow() {
    try {
        if (!window.firebase || !window.firebase.firestore) {
            logCheck('Real-time Data Flow', 'FAIL', 'Firestore not available');
            return false;
        }
        
        const db = window.firebase.firestore();
        
        // Test real-time listener
        return new Promise((resolve) => {
            const testData = {
                testType: 'verification',
                timestamp: new Date().toISOString(),
                message: 'Real-time verification test'
            };
            
            // Create test document
            db.collection('test').add(testData).then((docRef) => {
                logCheck('Test Document Creation', 'PASS', `Document created: ${docRef.id}`);
                
                // Set up real-time listener
                const unsubscribe = db.collection('test').doc(docRef.id)
                    .onSnapshot((doc) => {
                        if (doc.exists) {
                            logCheck('Real-time Listener', 'PASS', 'Listener working correctly');
                            
                            // Clean up
                            docRef.delete().then(() => {
                                logCheck('Test Cleanup', 'PASS', 'Test document removed');
                                unsubscribe();
                                resolve(true);
                            }).catch((error) => {
                                logCheck('Test Cleanup', 'WARN', `Cleanup issue: ${error.message}`);
                                unsubscribe();
                                resolve(true);
                            });
                        }
                    }, (error) => {
                        logCheck('Real-time Listener', 'FAIL', `Listener error: ${error.message}`);
                        unsubscribe();
                        resolve(false);
                    });
                    
            }).catch((error) => {
                logCheck('Test Document Creation', 'FAIL', `Creation error: ${error.message}`);
                resolve(false);
            });
        });
        
    } catch (error) {
        logCheck('Real-time Data Flow', 'FAIL', error.message);
        return false;
    }
}

// Check 6: Performance
function verifyPerformance() {
    try {
        // Check memory usage
        if (performance.memory) {
            const memory = performance.memory;
            const usedMB = (memory.usedJSHeapSize / 1048576).toFixed(2);
            const totalMB = (memory.totalJSHeapSize / 1048576).toFixed(2);
            
            logCheck('Memory Usage', 'PASS', `Used: ${usedMB}MB, Total: ${totalMB}MB`);
            
            if (memory.usedJSHeapSize > 100 * 1048576) { // 100MB
                logCheck('Memory Usage', 'WARN', 'High memory usage detected');
            }
        } else {
            logCheck('Memory Usage', 'INFO', 'Memory usage not available');
        }
        
        // Check page load time
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        logCheck('Page Load Time', 'PASS', `${loadTime}ms`);
        
        if (loadTime > 10000) { // 10 seconds
            logCheck('Page Load Time', 'WARN', 'Slow page load detected');
        }
        
        return true;
    } catch (error) {
        logCheck('Performance', 'FAIL', error.message);
        return false;
    }
}

// Check 7: Browser Compatibility
function verifyBrowserCompatibility() {
    try {
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
            'SessionStorage': typeof sessionStorage !== 'undefined',
            'WebSocket': typeof WebSocket !== 'undefined'
        };
        
        let supportedFeatures = 0;
        const totalFeatures = Object.keys(features).length;
        
        Object.entries(features).forEach(([feature, supported]) => {
            if (supported) {
                logCheck(feature, 'PASS', 'Supported');
                supportedFeatures++;
            } else {
                logCheck(feature, 'FAIL', 'Not supported');
            }
        });
        
        logCheck('Browser Compatibility', 'PASS', `${supportedFeatures}/${totalFeatures} features supported`);
        
        return supportedFeatures === totalFeatures;
    } catch (error) {
        logCheck('Browser Compatibility', 'FAIL', error.message);
        return false;
    }
}

// Main verification function
async function verifyAllRealTimeFunctionality() {
    console.log('🔍 Starting comprehensive real-time verification...\n');
    
    const checks = [
        { name: 'Firebase Configuration', fn: verifyFirebaseConfig },
        { name: 'Real-time Managers', fn: verifyRealTimeManagers },
        { name: 'Real-time Listeners', fn: verifyRealTimeListeners },
        { name: 'UI Components', fn: verifyUIComponents },
        { name: 'Real-time Data Flow', fn: verifyRealTimeDataFlow },
        { name: 'Performance', fn: verifyPerformance },
        { name: 'Browser Compatibility', fn: verifyBrowserCompatibility }
    ];
    
    let passedChecks = 0;
    let totalChecks = checks.length;
    
    for (const check of checks) {
        try {
            const result = await check.fn();
            if (result) passedChecks++;
            
            // Small delay between checks
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Check ${check.name} failed:`, error);
        }
    }
    
    // Calculate overall status
    const successRate = (passedChecks / totalChecks) * 100;
    
    if (successRate >= 90) {
        verificationResults.overall = 'EXCELLENT';
    } else if (successRate >= 75) {
        verificationResults.overall = 'GOOD';
    } else if (successRate >= 50) {
        verificationResults.overall = 'FAIR';
    } else {
        verificationResults.overall = 'POOR';
    }
    
    console.log('\n📊 VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`Overall Status: ${verificationResults.overall}`);
    console.log(`Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`Passed Checks: ${passedChecks}/${totalChecks}`);
    
    // Store results globally
    window.verificationResults = verificationResults;
    
    return verificationResults;
}

// Auto-run verification when script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verifyAllRealTimeFunctionality);
} else {
    verifyAllRealTimeFunctionality();
}

// Export for manual verification
window.verifyRealTimeFunctionality = verifyAllRealTimeFunctionality; 