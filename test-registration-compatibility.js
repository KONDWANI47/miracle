// Cross-Device Registration Form Compatibility Test
// Add this script to your index.html to test registration form compatibility

(function() {
    'use strict';
    
    console.log('🔍 Starting Cross-Device Registration Form Compatibility Test...');
    
    // Test results object
    const testResults = {
        deviceInfo: {},
        formElements: {},
        validation: {},
        localStorage: {},
        submission: {},
        responsive: {}
    };
    
    // Detect device and browser information
    function detectDeviceInfo() {
        const userAgent = navigator.userAgent;
        let browser = 'Unknown';
        let device = 'Desktop';
        let os = 'Unknown';
        
        // Browser detection
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            browser = 'Chrome';
        } else if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browser = 'Safari';
        } else if (userAgent.includes('Edg')) {
            browser = 'Edge';
        } else if (userAgent.includes('Opera')) {
            browser = 'Opera';
        }
        
        // Device detection
        if (/Android/i.test(userAgent)) {
            device = 'Android';
            os = 'Android';
        } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
            device = 'iOS';
            os = 'iOS';
        } else if (/Windows/i.test(userAgent)) {
            os = 'Windows';
        } else if (/Mac/i.test(userAgent)) {
            os = 'macOS';
        } else if (/Linux/i.test(userAgent)) {
            os = 'Linux';
        }
        
        testResults.deviceInfo = {
            browser,
            device,
            os,
            userAgent: userAgent.substring(0, 100) + '...',
            screenWidth: screen.width,
            screenHeight: screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1
        };
        
        console.log('📱 Device Info:', testResults.deviceInfo);
        return testResults.deviceInfo;
    }
    
    // Test form elements existence and accessibility
    function testFormElements() {
        const requiredElements = [
            'registrationForm',
            'parentName',
            'email',
            'phone',
            'childName',
            'childAge',
            'startDate',
            'program',
            'message'
        ];
        
        const results = {};
        
        requiredElements.forEach(elementId => {
            const element = document.getElementById(elementId);
            results[elementId] = {
                exists: !!element,
                accessible: element ? !element.disabled : false,
                visible: element ? element.offsetParent !== null : false,
                type: element ? element.type || element.tagName.toLowerCase() : 'N/A'
            };
        });
        
        testResults.formElements = results;
        console.log('📝 Form Elements Test:', results);
        return results;
    }
    
    // Test localStorage functionality
    function testLocalStorage() {
        const results = {
            available: false,
            writable: false,
            readable: false,
            deletable: false
        };
        
        try {
            // Test if localStorage is available
            if (typeof Storage !== 'undefined') {
                results.available = true;
                
                // Test writing
                localStorage.setItem('test_key', 'test_value');
                results.writable = true;
                
                // Test reading
                const readValue = localStorage.getItem('test_key');
                results.readable = readValue === 'test_value';
                
                // Test deleting
                localStorage.removeItem('test_key');
                const deletedValue = localStorage.getItem('test_key');
                results.deletable = deletedValue === null;
            }
        } catch (error) {
            console.error('localStorage test failed:', error);
        }
        
        testResults.localStorage = results;
        console.log('💾 localStorage Test:', results);
        return results;
    }
    
    // Test form validation
    function testFormValidation() {
        const results = {
            emailValidation: false,
            phoneValidation: false,
            ageValidation: false,
            dateValidation: false,
            programValidation: false
        };
        
        // Test email validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = 'test@example.com';
            results.emailValidation = emailInput.checkValidity();
            
            emailInput.value = 'invalid-email';
            results.emailValidation = results.emailValidation && !emailInput.checkValidity();
        }
        
        // Test phone validation
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.value = '+265992260985';
            results.phoneValidation = phoneInput.checkValidity();
        }
        
        // Test age validation
        const ageInput = document.getElementById('childAge');
        if (ageInput) {
            ageInput.value = '5';
            results.ageValidation = ageInput.checkValidity();
            
            ageInput.value = '15';
            results.ageValidation = results.ageValidation && !ageInput.checkValidity();
        }
        
        // Test date validation
        const dateInput = document.getElementById('startDate');
        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.value = tomorrow.toISOString().split('T')[0];
            results.dateValidation = dateInput.checkValidity();
        }
        
        // Test program validation
        const programSelect = document.getElementById('program');
        if (programSelect) {
            programSelect.value = 'Foundation Program';
            results.programValidation = programSelect.checkValidity();
        }
        
        testResults.validation = results;
        console.log('✅ Form Validation Test:', results);
        return results;
    }
    
    // Test form submission
    function testFormSubmission() {
        const results = {
            formExists: false,
            submitHandler: false,
            eventTriggered: false
        };
        
        const form = document.getElementById('registrationForm');
        if (form) {
            results.formExists = true;
            
            // Check if form has submit event listener
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            let eventTriggered = false;
            
            const originalOnSubmit = form.onsubmit;
            form.onsubmit = function(e) {
                eventTriggered = true;
                e.preventDefault();
                form.onsubmit = originalOnSubmit;
            };
            
            form.dispatchEvent(submitEvent);
            results.eventTriggered = eventTriggered;
            results.submitHandler = true;
        }
        
        testResults.submission = results;
        console.log('📤 Form Submission Test:', results);
        return results;
    }
    
    // Test responsive design
    function testResponsiveDesign() {
        const results = {
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            screen: {
                width: screen.width,
                height: screen.height
            },
            devicePixelRatio: window.devicePixelRatio || 1,
            touchSupport: 'ontouchstart' in window,
            orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown'
        };
        
        // Test if form is responsive
        const form = document.getElementById('registrationForm');
        if (form) {
            const formRect = form.getBoundingClientRect();
            results.formDimensions = {
                width: formRect.width,
                height: formRect.height,
                fitsViewport: formRect.width <= window.innerWidth
            };
        }
        
        testResults.responsive = results;
        console.log('📱 Responsive Design Test:', results);
        return results;
    }
    
    // Run all tests
    function runCompatibilityTests() {
        console.log('🚀 Running Cross-Device Compatibility Tests...');
        
        // Run all tests
        detectDeviceInfo();
        testFormElements();
        testLocalStorage();
        testFormValidation();
        testFormSubmission();
        testResponsiveDesign();
        
        // Generate summary
        const summary = generateTestSummary();
        console.log('📊 Test Summary:', summary);
        
        // Display results in page
        displayTestResults();
        
        return testResults;
    }
    
    // Generate test summary
    function generateTestSummary() {
        const summary = {
            overall: 'PASS',
            deviceInfo: testResults.deviceInfo.browser !== 'Unknown' ? 'PASS' : 'FAIL',
            formElements: Object.values(testResults.formElements).every(el => el.exists) ? 'PASS' : 'FAIL',
            localStorage: testResults.localStorage.available ? 'PASS' : 'FAIL',
            validation: Object.values(testResults.validation).every(v => v) ? 'PASS' : 'FAIL',
            submission: testResults.submission.formExists ? 'PASS' : 'FAIL',
            responsive: testResults.responsive.formDimensions ? 'PASS' : 'FAIL'
        };
        
        // Check overall status
        const allPassed = Object.values(summary).every(status => status === 'PASS');
        summary.overall = allPassed ? 'PASS' : 'FAIL';
        
        return summary;
    }
    
    // Display test results in page
    function displayTestResults() {
        // Create results container if it doesn't exist
        let resultsContainer = document.getElementById('compatibility-test-results');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'compatibility-test-results';
            resultsContainer.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                width: 300px;
                max-height: 400px;
                overflow-y: auto;
                background: white;
                border: 2px solid #007bff;
                border-radius: 8px;
                padding: 15px;
                font-family: monospace;
                font-size: 12px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            document.body.appendChild(resultsContainer);
        }
        
        const summary = generateTestSummary();
        
        resultsContainer.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #007bff;">🔍 Compatibility Test Results</h3>
            <div style="margin-bottom: 10px;">
                <strong>Browser:</strong> ${testResults.deviceInfo.browser}<br>
                <strong>Device:</strong> ${testResults.deviceInfo.device}<br>
                <strong>Viewport:</strong> ${testResults.responsive.viewport.width}x${testResults.responsive.viewport.height}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Overall:</strong> <span style="color: ${summary.overall === 'PASS' ? 'green' : 'red'};">${summary.overall}</span><br>
                <strong>Form Elements:</strong> <span style="color: ${summary.formElements === 'PASS' ? 'green' : 'red'};">${summary.formElements}</span><br>
                <strong>localStorage:</strong> <span style="color: ${summary.localStorage === 'PASS' ? 'green' : 'red'};">${summary.localStorage}</span><br>
                <strong>Validation:</strong> <span style="color: ${summary.validation === 'PASS' ? 'green' : 'red'};">${summary.validation}</span><br>
                <strong>Submission:</strong> <span style="color: ${summary.submission === 'PASS' ? 'green' : 'red'};">${summary.submission}</span>
            </div>
            <button onclick="this.parentElement.remove()" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Close</button>
        `;
    }
    
    // Auto-run tests when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runCompatibilityTests);
    } else {
        runCompatibilityTests();
    }
    
    // Expose test function globally for manual testing
    window.runRegistrationCompatibilityTests = runCompatibilityTests;
    window.getRegistrationTestResults = () => testResults;
    
    console.log('✅ Cross-Device Registration Form Compatibility Test loaded successfully!');
    console.log('💡 Run "runRegistrationCompatibilityTests()" in console to test manually');
    console.log('💡 Run "getRegistrationTestResults()" to get detailed results');
    
})(); 