// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize admin panel
    const adminPanel = new AdminPanelManager();
    adminPanel.initialize();
});

// Admin Panel Manager
class AdminPanelManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentSection = 'analytics';
    }
    
    async initialize() {
        // Check if user is already logged in
        const token = localStorage.getItem('adminToken');
        const email = localStorage.getItem('adminEmail');
        
        if (token && email) {
            try {
                // Verify token with Firebase
                if (typeof firebase !== 'undefined') {
                    // Try to sign in with stored credentials
                    const rememberMe = localStorage.getItem('rememberMe') === 'true';
                    
                    if (rememberMe) {
                        const password = localStorage.getItem('adminPassword');
                        
                        if (password) {
                            try {
                                await firebase.auth().signInWithEmailAndPassword(email, password);
                                this.isAuthenticated = true;
                                this.showAdminPanel();
                                return;
                            } catch (error) {
                                console.error('Firebase auth error:', error);
                            }
                        }
                    }
                }
                
                // Verify token with API
                try {
                    const response = await fetch(`admin-api.php?action=verify_token`, {
                        headers: {
                            'Authorization': 'Bearer ' + token
                        }
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        this.isAuthenticated = true;
                        this.showAdminPanel();
                        return;
                    }
                } catch (error) {
                    console.error('Error verifying token:', error);
                }
            } catch (error) {
                console.error('Error during authentication check:', error);
            }
        }
        
        // Show login form
        this.showLoginForm();
    }
    
    showLoginForm() {
        document.getElementById('loginForm').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
        
        // Set up login form
        this.setupLoginForm();
    }
    
    showAdminPanel() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        
        // Set up admin panel
        this.setupAdminPanel();
    }
    
    setupLoginForm() {
        const form = document.getElementById('adminLoginForm');
        const passwordToggle = document.getElementById('passwordToggle');
        const passwordInput = document.getElementById('password');
        const rememberMeCheckbox = document.getElementById('rememberMe');
        const loginMessage = document.getElementById('loginMessage');
        
        // Remember me
        const rememberedEmail = localStorage.getItem('adminEmail');
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        
        if (rememberedEmail && rememberMe) {
            document.getElementById('email').value = rememberedEmail;
            rememberMeCheckbox.checked = true;
        }
        
        // Password toggle
        passwordToggle.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle icon
            const icon = passwordToggle.querySelector('i');
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });
        
        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = passwordInput.value;
            const rememberMe = rememberMeCheckbox.checked;
            
            loginMessage.textContent = 'Logging in...';
            loginMessage.className = 'message info';
            
            try {
                // Hardcoded admin credentials for demo purposes
                if (email === 'cupicsart@gmail.com' && password === '889543701@98') {
                    // Store credentials if remember me is checked
                    localStorage.setItem('adminEmail', email);
                    localStorage.setItem('rememberMe', rememberMe);
                    
                    if (rememberMe) {
                        localStorage.setItem('adminPassword', password);
                    } else {
                        localStorage.removeItem('adminPassword');
                    }
                    
                    // Generate token for API authentication
                    const token = this.generateToken(email);
                    localStorage.setItem('adminToken', token);
                    
                    this.isAuthenticated = true;
                    this.showAdminPanel();
                    return;
                }
                
                // Try Firebase authentication
                if (typeof firebase !== 'undefined') {
                    try {
                        await firebase.auth().signInWithEmailAndPassword(email, password);
                        
                        // Store credentials if remember me is checked
                        localStorage.setItem('adminEmail', email);
                        localStorage.setItem('rememberMe', rememberMe);
                        
                        if (rememberMe) {
                            localStorage.setItem('adminPassword', password);
                        } else {
                            localStorage.removeItem('adminPassword');
                        }
                        
                        // Generate token for API authentication
                        const token = this.generateToken(email);
                        localStorage.setItem('adminToken', token);
                        
                        this.isAuthenticated = true;
                        this.showAdminPanel();
                        return;
                    } catch (firebaseError) {
                        console.error('Firebase login error:', firebaseError);
                    }
                }
                
                // Fallback to API authentication
                try {
                    const response = await fetch(`admin-api.php?action=login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, password })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        // Store credentials if remember me is checked
                        localStorage.setItem('adminEmail', email);
                        localStorage.setItem('rememberMe', rememberMe);
                        
                        if (rememberMe) {
                            localStorage.setItem('adminPassword', password);
                        } else {
                            localStorage.removeItem('adminPassword');
                        }
                        
                        // Store token
                        localStorage.setItem('adminToken', result.token || this.generateToken(email));
                        
                        this.isAuthenticated = true;
                        this.showAdminPanel();
                    } else {
                        throw new Error(result.error || 'Invalid credentials');
                    }
                } catch (apiError) {
                    console.error('API login error:', apiError);
                    throw new Error('Login failed: ' + apiError.message);
                }
            } catch (error) {
                console.error('Login error:', error);
                loginMessage.textContent = error.message || 'Login failed';
                loginMessage.className = 'message error';
            }
        });
    }
    
    setupAdminPanel() {
        // Set up navigation
        this.setupNavigation();
        
        // Set up logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });
        
        // Set up refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshData();
        });
        
        // Set up export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });
        
        // Load initial data
        this.loadData();
    }
    
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.admin-section');
        const hamburger = document.querySelector('.admin-hamburger');
        const nav = document.querySelector('.admin-nav');
        const backdrop = document.querySelector('.admin-nav-backdrop');
        
        // Mobile navigation toggle
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
            backdrop.classList.toggle('active');
        });
        
        // Hide navigation when clicking outside
        backdrop.addEventListener('click', () => {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
            backdrop.classList.remove('active');
        });
        
        // Navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const section = link.dataset.section;
                
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                // Update active section
                sections.forEach(s => s.classList.remove('active'));
                document.getElementById(`${section}-section`).classList.add('active');
                
                // Update current section
                this.currentSection = section;
                
                // Close mobile navigation
                hamburger.classList.remove('active');
                nav.classList.remove('active');
                backdrop.classList.remove('active');
                
                // Load section data
                this.loadSectionData(section);
            });
        });
    }
    
    async loadData() {
        try {
            // Load registrations
            await this.loadRegistrations();
            
            // Load analytics
            await this.loadAnalytics();
            
            // Load section data
            await this.loadSectionData(this.currentSection);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load data');
        }
    }
    
    async loadSectionData(section) {
        switch (section) {
            case 'analytics':
                await this.loadAnalytics();
                break;
            case 'registrations':
                await this.loadRegistrations();
                break;
            case 'database':
                await this.loadDatabase();
                break;
            case 'blog-admin-section':
                await this.loadBlogPosts();
                break;
            case 'testimonials-admin':
                await this.loadTestimonials();
                break;
            case 'hero-announcements-admin':
                await this.loadHeroAnnouncements();
                break;
            case 'gallery-admin':
                await this.loadGallery();
                break;
            case 'user-uploads-admin':
                await this.loadUserUploads();
                break;
            case 'payments':
                await this.loadPayments();
                break;
            case 'map':
                this.initializeMap();
                break;
        }
    }
    
    async loadRegistrations() {
        try {
            const registrationsSection = document.getElementById('registrations-section');
            const registrationsTable = document.getElementById('registrationsTableBody');
            
            if (!registrationsTable) {
                // Create table if it doesn't exist
                const tableContainer = document.createElement('div');
                tableContainer.className = 'table-container';
                tableContainer.innerHTML = `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Parent Name</th>
                                <th>Child Name</th>
                                <th>Age</th>
                                <th>Program</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="registrationsTableBody">
                            <tr>
                                <td colspan="7" class="loading-cell">Loading registrations...</td>
                            </tr>
                        </tbody>
                    </table>
                `;
                
                registrationsSection.appendChild(tableContainer);
            }
            
            let registrations = [];
            
            // Try to get from Firebase first
            if (typeof firebase !== 'undefined') {
                try {
                    const db = firebase.firestore();
                    const snapshot = await db.collection('registrations').orderBy('timestamp', 'desc').get();
                    
                    snapshot.forEach((doc) => {
                        registrations.push({ id: doc.id, ...doc.data() });
                    });
                    
                    console.log('Registrations loaded from Firebase:', registrations.length);
                } catch (error) {
                    console.warn('Failed to load registrations from Firebase:', error);
                }
            }
            
            // If no registrations from Firebase, try API
            if (registrations.length === 0) {
                try {
                    const response = await fetch(`admin-api.php?action=get_registrations`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('adminToken')
                        }
                    });
                    
                    const result = await response.json();
                    
                    if (result.success && result.registrations) {
                        registrations = result.registrations;
                        console.log('Registrations loaded from API:', registrations.length);
                    }
                } catch (error) {
                    console.error('Failed to load registrations from API:', error);
                }
            }
            
            // If still no registrations, try localStorage
            if (registrations.length === 0) {
                try {
                    const storedRegistrations = localStorage.getItem('registrations');
                    
                    if (storedRegistrations) {
                        registrations = JSON.parse(storedRegistrations);
                        console.log('Registrations loaded from localStorage:', registrations.length);
                    }
                } catch (error) {
                    console.warn('Failed to load registrations from localStorage:', error);
                }
            }
            
            // If still no registrations, use sample data
            if (registrations.length === 0) {
                registrations = [
                    {
                        id: 1,
                        parent_name: 'John Doe',
                        email: 'john.doe@example.com',
                        phone: '+265991234567',
                        child_name: 'Jane Doe',
                        child_age: 4,
                        program: 'Early Childhood Care (0-5 years)',
                        status: 'Paid',
                        payment_status: 'Completed',
                        registration_date: '2025-08-10'
                    },
                    {
                        id: 2,
                        parent_name: 'Mary Smith',
                        email: 'mary.smith@example.com',
                        phone: '+265992345678',
                        child_name: 'James Smith',
                        child_age: 6,
                        program: 'Foundation Program (5-7 years)',
                        status: 'Pending',
                        payment_status: 'Pending',
                        registration_date: '2025-08-11'
                    },
                    {
                        id: 3,
                        parent_name: 'Robert Johnson',
                        email: 'robert.j@example.com',
                        phone: '+265993456789',
                        child_name: 'Sarah Johnson',
                        child_age: 8,
                        program: 'Primary Preparation (7-12 years)',
                        status: 'Payment Required',
                        payment_status: 'Pending',
                        registration_date: '2025-08-12'
                    }
                ];
                console.log('Using sample registration data');
            }
            
            // Update registrations table
            this.updateRegistrationsTable(registrations);
            
            return registrations;
        } catch (error) {
            console.error('Error loading registrations:', error);
            return [];
        }
    }
    
    updateRegistrationsTable(registrations) {
        const tableBody = document.getElementById('registrationsTableBody');
        if (!tableBody) return;
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        if (registrations.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `<td colspan="7" class="empty-table">No registrations found</td>`;
            tableBody.appendChild(emptyRow);
            return;
        }
        
        // Add new rows
        registrations.forEach((registration) => {
            const row = document.createElement('tr');
            
            // Format date
            const regDate = registration.timestamp ? 
                new Date(registration.timestamp.seconds * 1000) : 
                new Date(registration.registration_date || registration.created_at || new Date());
                
            const formattedDate = regDate.toLocaleDateString();
            
            // Status class
            const statusClass = this.getStatusClass(registration.status || 'Pending');
            
            row.innerHTML = `
                <td>${registration.parent_name || registration.parentName || ''}</td>
                <td>${registration.child_name || registration.childName || ''}</td>
                <td>${registration.child_age || registration.childAge || ''}</td>
                <td>${registration.program || ''}</td>
                <td>${formattedDate}</td>
                <td><span class="status-badge ${statusClass}">${registration.status || 'Pending'}</span></td>
                <td>
                    <button class="action-btn view-btn" data-id="${registration.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" data-id="${registration.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${registration.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners
        this.addRegistrationEventListeners();
    }
    
    addRegistrationEventListeners() {
        // View registration details
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                await this.viewRegistration(id);
            });
        });
        
        // Edit registration
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                await this.editRegistration(id);
            });
        });
        
        // Delete registration
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                await this.deleteRegistration(id);
            });
        });
    }
    
    async loadAnalytics() {
        try {
            // Get registrations
            const registrations = await this.loadRegistrations();
            
            // Update analytics
            this.updateAnalytics(registrations);
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }
    
    updateAnalytics(registrations) {
        if (!registrations || registrations.length === 0) return;
        
        // Count totals
        const totalStudents = registrations.length;
        
        // Count by program
        const infantCount = registrations.filter(r => 
            (r.program && r.program.includes('Early Childhood')) || 
            (r.child_age && r.child_age < 5)
        ).length;
        
        const toddlerCount = registrations.filter(r => 
            (r.program && r.program.includes('Foundation')) || 
            (r.child_age && r.child_age >= 5 && r.child_age < 7)
        ).length;
        
        const preschoolCount = registrations.filter(r => 
            (r.program && r.program.includes('Primary')) || 
            (r.child_age && r.child_age >= 7)
        ).length;
        
        // Count payments
        const paidRegistrations = registrations.filter(r => 
            r.payment_status === 'Completed' || r.status === 'Paid'
        );
        
        const pendingPayments = registrations.filter(r => 
            r.payment_status === 'Pending' || r.status === 'Payment Required'
        ).length;
        
        // Calculate revenue (assuming 50 per registration)
        const totalRevenue = paidRegistrations.length * 50;
        
        // Update UI
        document.getElementById('totalStudents').textContent = totalStudents;
        document.getElementById('infantCount').textContent = infantCount;
        document.getElementById('toddlerCount').textContent = toddlerCount;
        document.getElementById('preschoolCount').textContent = preschoolCount;
        document.getElementById('pendingPayments').textContent = pendingPayments;
        document.getElementById('totalRevenue').textContent = `MWK ${totalRevenue}`;
        
        // Update charts
        this.updateAgeChart(registrations);
        this.updateGenderChart(registrations);
        this.updateProgramChart(registrations);
        this.updatePaymentChart(registrations);
    }
    
    updateAgeChart(registrations) {
        const ageChartElement = document.getElementById('ageChart');
        if (!ageChartElement) return;
        
        // Count ages
        const ageGroups = {
            '0-2': 0,
            '3-4': 0,
            '5-6': 0,
            '7-8': 0,
            '9-12': 0
        };
        
        registrations.forEach(reg => {
            const age = reg.child_age || reg.childAge || 0;
            
            if (age <= 2) ageGroups['0-2']++;
            else if (age <= 4) ageGroups['3-4']++;
            else if (age <= 6) ageGroups['5-6']++;
            else if (age <= 8) ageGroups['7-8']++;
            else ageGroups['9-12']++;
        });
        
        // Create simple bar chart
        ageChartElement.innerHTML = '';
        
        Object.entries(ageGroups).forEach(([range, count]) => {
            const percentage = registrations.length > 0 ? (count / registrations.length) * 100 : 0;
            
            const barContainer = document.createElement('div');
            barContainer.className = 'chart-bar-container';
            
            const label = document.createElement('div');
            label.className = 'chart-label';
            label.textContent = range;
            
            const barWrapper = document.createElement('div');
            barWrapper.className = 'chart-bar-wrapper';
            
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.width = `${percentage}%`;
            
            const value = document.createElement('div');
            value.className = 'chart-value';
            value.textContent = count;
            
            barWrapper.appendChild(bar);
            barContainer.appendChild(label);
            barContainer.appendChild(barWrapper);
            barContainer.appendChild(value);
            
            ageChartElement.appendChild(barContainer);
        });
    }
    
    updateGenderChart(registrations) {
        const genderChartElement = document.getElementById('genderChart');
        if (!genderChartElement) return;
        
        // Count genders
        const genderCounts = {
            male: 0,
            female: 0,
            other: 0
        };
        
        registrations.forEach(reg => {
            const gender = (reg.child_gender || reg.childGender || '').toLowerCase();
            
            if (gender === 'male') genderCounts.male++;
            else if (gender === 'female') genderCounts.female++;
            else genderCounts.other++;
        });
        
        // Create simple pie chart
        const total = registrations.length;
        
        genderChartElement.innerHTML = `
            <div class="pie-chart-container">
                <div class="pie-chart" style="--male: ${genderCounts.male}; --female: ${genderCounts.female}; --other: ${genderCounts.other}; --total: ${total};">
                </div>
                <div class="pie-legend">
                    <div class="legend-item">
                        <span class="legend-color male"></span>
                        <span class="legend-label">Male</span>
                        <span class="legend-value">${genderCounts.male} (${Math.round(genderCounts.male / total * 100) || 0}%)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color female"></span>
                        <span class="legend-label">Female</span>
                        <span class="legend-value">${genderCounts.female} (${Math.round(genderCounts.female / total * 100) || 0}%)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color other"></span>
                        <span class="legend-label">Other/Not Specified</span>
                        <span class="legend-value">${genderCounts.other} (${Math.round(genderCounts.other / total * 100) || 0}%)</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    updateProgramChart(registrations) {
        const programChartElement = document.getElementById('programChart');
        if (!programChartElement) return;
        
        // Count programs
        const programCounts = {
            'Early Childhood Care': 0,
            'Foundation Program': 0,
            'Primary Preparation': 0
        };
        
        registrations.forEach(reg => {
            const program = reg.program || '';
            
            if (program.includes('Early Childhood')) programCounts['Early Childhood Care']++;
            else if (program.includes('Foundation')) programCounts['Foundation Program']++;
            else if (program.includes('Primary')) programCounts['Primary Preparation']++;
        });
        
        // Create simple bar chart
        programChartElement.innerHTML = '';
        
        Object.entries(programCounts).forEach(([program, count]) => {
            const percentage = registrations.length > 0 ? (count / registrations.length) * 100 : 0;
            
            const barContainer = document.createElement('div');
            barContainer.className = 'chart-bar-container';
            
            const label = document.createElement('div');
            label.className = 'chart-label';
            label.textContent = program;
            
            const barWrapper = document.createElement('div');
            barWrapper.className = 'chart-bar-wrapper';
            
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.width = `${percentage}%`;
            
            const value = document.createElement('div');
            value.className = 'chart-value';
            value.textContent = count;
            
            barWrapper.appendChild(bar);
            barContainer.appendChild(label);
            barContainer.appendChild(barWrapper);
            barContainer.appendChild(value);
            
            programChartElement.appendChild(barContainer);
        });
    }
    
    updatePaymentChart(registrations) {
        const paymentChartElement = document.getElementById('paymentChart');
        if (!paymentChartElement) return;
        
        // Count payment statuses
        const paymentCounts = {
            'Completed': 0,
            'Pending': 0,
            'Failed': 0,
            'Refunded': 0
        };
        
        registrations.forEach(reg => {
            const status = reg.payment_status || reg.paymentStatus || 'Pending';
            
            if (paymentCounts.hasOwnProperty(status)) {
                paymentCounts[status]++;
            } else if (status === 'Paid') {
                paymentCounts['Completed']++;
            }
        });
        
        // Create simple pie chart
        const total = registrations.length;
        
        paymentChartElement.innerHTML = `
            <div class="pie-chart-container">
                <div class="payment-pie-chart" style="--completed: ${paymentCounts.Completed}; --pending: ${paymentCounts.Pending}; --failed: ${paymentCounts.Failed}; --refunded: ${paymentCounts.Refunded}; --total: ${total};">
                </div>
                <div class="pie-legend">
                    <div class="legend-item">
                        <span class="legend-color completed"></span>
                        <span class="legend-label">Completed</span>
                        <span class="legend-value">${paymentCounts.Completed} (${Math.round(paymentCounts.Completed / total * 100) || 0}%)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color pending"></span>
                        <span class="legend-label">Pending</span>
                        <span class="legend-value">${paymentCounts.Pending} (${Math.round(paymentCounts.Pending / total * 100) || 0}%)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color failed"></span>
                        <span class="legend-label">Failed</span>
                        <span class="legend-value">${paymentCounts.Failed} (${Math.round(paymentCounts.Failed / total * 100) || 0}%)</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-color refunded"></span>
                        <span class="legend-label">Refunded</span>
                        <span class="legend-value">${paymentCounts.Refunded} (${Math.round(paymentCounts.Refunded / total * 100) || 0}%)</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    getStatusClass(status) {
        switch (status) {
            case 'Pending': return 'status-pending';
            case 'Payment Required': return 'status-payment';
            case 'Paid': return 'status-paid';
            case 'Approved': return 'status-approved';
            case 'Rejected': return 'status-rejected';
            case 'Completed': return 'status-completed';
            default: return 'status-pending';
        }
    }
    
    generateToken(email) {
        // Simple token generation for demo purposes
        const timestamp = new Date().getTime();
        const random = Math.random().toString(36).substring(2, 15);
        return btoa(`${email}:${timestamp}:${random}`);
    }
    
    logout() {
        // Clear authentication state
        this.isAuthenticated = false;
        
        // Sign out from Firebase if available
        if (typeof firebase !== 'undefined') {
            firebase.auth().signOut().catch(error => {
                console.error('Firebase sign out error:', error);
            });
        }
        
        // Clear stored credentials
        localStorage.removeItem('adminToken');
        
        if (localStorage.getItem('rememberMe') !== 'true') {
            localStorage.removeItem('adminEmail');
            localStorage.removeItem('adminPassword');
        }
        
        // Show login form
        this.showLoginForm();
    }
    
    refreshData() {
        this.loadData();
    }
    
    exportData() {
        // Export registrations data
        this.exportRegistrations();
    }
    
    async exportRegistrations() {
        try {
            // Get registrations
            const registrations = await this.loadRegistrations();
            
            if (registrations.length === 0) {
                alert('No registrations to export');
                return;
            }
            
            // Convert to CSV
            const headers = ['ID', 'Parent Name', 'Email', 'Phone', 'Child Name', 'Age', 'Program', 'Registration Date', 'Status'];
            const csvContent = [
                headers.join(','),
                ...registrations.map(reg => {
                    const regDate = reg.timestamp ? 
                        new Date(reg.timestamp.seconds * 1000) : 
                        new Date(reg.registration_date || reg.created_at || new Date());
                        
                    const formattedDate = regDate.toLocaleDateString();
                    
                    return [
                        reg.id,
                        `"${reg.parent_name || reg.parentName || ''}"`,
                        `"${reg.email || ''}"`,
                        `"${reg.phone || ''}"`,
                        `"${reg.child_name || reg.childName || ''}"`,
                        reg.child_age || reg.childAge || '',
                        `"${reg.program || ''}"`,
                        `"${formattedDate}"`,
                        `"${reg.status || 'Pending'}"`
                    ].join(',');
                })
            ].join('\n');
            
            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `registrations_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting registrations:', error);
            alert('Failed to export registrations');
        }
    }
    
    // Placeholder methods for other sections
    async loadDatabase() {
        console.log('Loading database...');
        // Implementation would go here
    }
    
    async loadBlogPosts() {
        console.log('Loading blog posts...');
        // Implementation would go here
    }
    
    async loadTestimonials() {
        console.log('Loading testimonials...');
        // Implementation would go here
    }
    
    async loadHeroAnnouncements() {
        console.log('Loading hero announcements...');
        
        const announcementsContainer = document.getElementById('announcementsContainer');
        if (!announcementsContainer) return;
        
        // Clear loading message
        announcementsContainer.innerHTML = '';
        
        // Sample announcements data
        const announcements = [
            {
                id: 1,
                title: 'New School Year Registration Open',
                content: 'Registration for the new school year is now open. Limited spaces available. Apply early to secure your child\'s spot!',
                type: 'info',
                expiry_date: '2025-12-31',
                is_active: true,
                created_date: '2025-07-15',
                camera_tracking: true
            },
            {
                id: 2,
                title: 'Parent-Teacher Meeting',
                content: 'Join us for our quarterly parent-teacher meeting on Saturday, September 15th at 10:00 AM. We will discuss your child\'s progress and upcoming activities.',
                type: 'event',
                expiry_date: '2025-09-15',
                is_active: true,
                created_date: '2025-08-01',
                camera_tracking: false
            },
            {
                id: 3,
                title: 'Holiday Schedule',
                content: 'The school will be closed for Independence Day celebrations from July 5th to July 7th. Classes will resume on July 8th.',
                type: 'notice',
                expiry_date: '2025-07-08',
                is_active: false,
                created_date: '2025-06-20',
                camera_tracking: true
            },
            {
                id: 4,
                title: 'New Playground Equipment',
                content: 'We are excited to announce that we have installed new playground equipment. Children will be able to enjoy the new facilities starting next week.',
                type: 'info',
                expiry_date: '2025-09-30',
                is_active: true,
                created_date: '2025-08-05',
                camera_tracking: false
            },
            {
                id: 5,
                title: 'COVID-19 Safety Measures',
                content: 'We continue to implement strict COVID-19 safety measures. Please ensure your child wears a mask and follows hygiene protocols.',
                type: 'urgent',
                expiry_date: '2025-12-31',
                is_active: true,
                created_date: '2025-07-25',
                camera_tracking: true
            }
        ];
        
        // Create announcement cards
        announcements.forEach(announcement => {
            const card = document.createElement('div');
            card.className = `announcement-card ${announcement.is_active ? 'active' : 'inactive'} ${announcement.type}`;
            card.dataset.id = announcement.id;
            
            // Format date
            const expiryDate = new Date(announcement.expiry_date);
            const formattedExpiryDate = expiryDate.toLocaleDateString();
            
            const createdDate = new Date(announcement.created_date);
            const formattedCreatedDate = createdDate.toLocaleDateString();
            
            // Check if expired
            const isExpired = new Date() > expiryDate;
            const statusClass = announcement.is_active ? (isExpired ? 'expired' : 'active') : 'inactive';
            
            card.innerHTML = `
                <div class="announcement-header">
                    <h3>${announcement.title}</h3>
                    <span class="announcement-type ${announcement.type}">${announcement.type}</span>
                </div>
                <div class="announcement-content">
                    <p>${announcement.content}</p>
                </div>
                <div class="announcement-meta">
                    <div class="meta-item">
                        <span class="meta-label">Created:</span>
                        <span class="meta-value">${formattedCreatedDate}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Expires:</span>
                        <span class="meta-value">${formattedExpiryDate}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Status:</span>
                        <span class="meta-value status-badge ${statusClass}">
                            ${isExpired ? 'Expired' : (announcement.is_active ? 'Active' : 'Inactive')}
                        </span>
                    </div>
                </div>
                <div class="announcement-features">
                    <div class="feature-item">
                        <span class="feature-label">Camera Tracking:</span>
                        <label class="switch">
                            <input type="checkbox" class="camera-tracking-toggle" ${announcement.camera_tracking ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>
                <div class="announcement-actions">
                    <button class="action-btn edit-announcement-btn" data-id="${announcement.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete-announcement-btn" data-id="${announcement.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button class="action-btn toggle-status-btn" data-id="${announcement.id}" data-active="${announcement.is_active}">
                        <i class="fas ${announcement.is_active ? 'fa-eye-slash' : 'fa-eye'}"></i> 
                        ${announcement.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            `;
            
            announcementsContainer.appendChild(card);
        });
        
        // Add event listeners
        this.addAnnouncementEventListeners();
    }
    
    addAnnouncementEventListeners() {
        // Edit announcement
        document.querySelectorAll('.edit-announcement-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.editAnnouncement(id);
            });
        });
        
        // Delete announcement
        document.querySelectorAll('.delete-announcement-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                this.deleteAnnouncement(id);
            });
        });
        
        // Toggle announcement status
        document.querySelectorAll('.toggle-status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const isActive = e.currentTarget.dataset.active === 'true';
                this.toggleAnnouncementStatus(id, !isActive);
                
                // Update button text and icon
                e.currentTarget.innerHTML = `
                    <i class="fas ${!isActive ? 'fa-eye-slash' : 'fa-eye'}"></i> 
                    ${!isActive ? 'Deactivate' : 'Activate'}
                `;
                e.currentTarget.dataset.active = !isActive;
                
                // Update card class
                const card = document.querySelector(`.announcement-card[data-id="${id}"]`);
                if (card) {
                    if (isActive) {
                        card.classList.remove('active');
                        card.classList.add('inactive');
                    } else {
                        card.classList.remove('inactive');
                        card.classList.add('active');
                    }
                }
            });
        });
        
        // Toggle camera tracking
        document.querySelectorAll('.camera-tracking-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const id = e.currentTarget.closest('.announcement-card').dataset.id;
                const isTracking = e.currentTarget.checked;
                this.toggleCameraTracking(id, isTracking);
            });
        });
        
        // Add new announcement button
        const addAnnouncementBtn = document.getElementById('addAnnouncementBtn');
        if (addAnnouncementBtn) {
            addAnnouncementBtn.addEventListener('click', () => {
                this.addNewAnnouncement();
            });
        }
    }
    
    editAnnouncement(id) {
        console.log('Editing announcement:', id);
        alert(`Editing announcement ${id}`);
        // Implementation would go here
    }
    
    deleteAnnouncement(id) {
        console.log('Deleting announcement:', id);
        if (confirm(`Are you sure you want to delete announcement ${id}?`)) {
            // Remove the announcement card from the DOM
            const card = document.querySelector(`.announcement-card[data-id="${id}"]`);
            if (card) {
                card.remove();
            }
            alert(`Announcement ${id} deleted`);
        }
    }
    
    toggleAnnouncementStatus(id, isActive) {
        console.log('Toggling announcement status:', id, isActive);
        // Implementation would go here
    }
    
    toggleCameraTracking(id, isTracking) {
        console.log('Toggling camera tracking for announcement:', id, isTracking);
        alert(`Camera tracking ${isTracking ? 'enabled' : 'disabled'} for announcement ${id}`);
        // Implementation would go here
    }
    
    addNewAnnouncement() {
        console.log('Adding new announcement');
        
        // Create modal for adding new announcement
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Add New Announcement</h2>
                <form id="newAnnouncementForm">
                    <div class="form-group">
                        <label for="announcementTitle">Title:</label>
                        <input type="text" id="announcementTitle" name="title" required>
                    </div>
                    <div class="form-group">
                        <label for="announcementContent">Content:</label>
                        <textarea id="announcementContent" name="content" rows="4" required></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="announcementType">Type:</label>
                            <select id="announcementType" name="type">
                                <option value="info">Info</option>
                                <option value="event">Event</option>
                                <option value="notice">Notice</option>
                                <option value="urgent">Urgent</option>
                                <option value="news">News</option>
                                <option value="alert">Alert</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="announcementExpiry">Expiry Date:</label>
                            <input type="date" id="announcementExpiry" name="expiry_date" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-container">
                            <input type="checkbox" id="announcementActive" name="is_active" checked>
                            <span class="checkmark"></span>
                            Active
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-container">
                            <input type="checkbox" id="cameraTracking" name="camera_tracking">
                            <span class="checkmark"></span>
                            Enable Camera Tracking
                        </label>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">Add Announcement</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set default expiry date to 30 days from now
        const expiryInput = document.getElementById('announcementExpiry');
        const defaultExpiry = new Date();
        defaultExpiry.setDate(defaultExpiry.getDate() + 30);
        expiryInput.valueAsDate = defaultExpiry;
        
        // Close modal on X click
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Close modal on cancel
        const cancelBtn = modal.querySelector('.cancel-btn');
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Handle form submission
        const form = document.getElementById('newAnnouncementForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const newAnnouncement = {
                id: Date.now(), // Generate a unique ID
                title: formData.get('title'),
                content: formData.get('content'),
                type: formData.get('type'),
                expiry_date: formData.get('expiry_date'),
                is_active: formData.get('is_active') === 'on',
                created_date: new Date().toISOString().split('T')[0],
                camera_tracking: formData.get('camera_tracking') === 'on'
            };
            
            // Add the new announcement to the container
            const announcementsContainer = document.getElementById('announcementsContainer');
            if (announcementsContainer) {
                const card = document.createElement('div');
                card.className = `announcement-card ${newAnnouncement.is_active ? 'active' : 'inactive'} ${newAnnouncement.type}`;
                card.dataset.id = newAnnouncement.id;
                
                // Format dates
                const expiryDate = new Date(newAnnouncement.expiry_date);
                const formattedExpiryDate = expiryDate.toLocaleDateString();
                
                const createdDate = new Date(newAnnouncement.created_date);
                const formattedCreatedDate = createdDate.toLocaleDateString();
                
                card.innerHTML = `
                    <div class="announcement-header">
                        <h3>${newAnnouncement.title}</h3>
                        <span class="announcement-type ${newAnnouncement.type}">${newAnnouncement.type}</span>
                    </div>
                    <div class="announcement-content">
                        <p>${newAnnouncement.content}</p>
                    </div>
                    <div class="announcement-meta">
                        <div class="meta-item">
                            <span class="meta-label">Created:</span>
                            <span class="meta-value">${formattedCreatedDate}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Expires:</span>
                            <span class="meta-value">${formattedExpiryDate}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Status:</span>
                            <span class="meta-value status-badge active">
                                ${newAnnouncement.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                    <div class="announcement-features">
                        <div class="feature-item">
                            <span class="feature-label">Camera Tracking:</span>
                            <label class="switch">
                                <input type="checkbox" class="camera-tracking-toggle" ${newAnnouncement.camera_tracking ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                    <div class="announcement-actions">
                        <button class="action-btn edit-announcement-btn" data-id="${newAnnouncement.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-announcement-btn" data-id="${newAnnouncement.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                        <button class="action-btn toggle-status-btn" data-id="${newAnnouncement.id}" data-active="${newAnnouncement.is_active}">
                            <i class="fas ${newAnnouncement.is_active ? 'fa-eye-slash' : 'fa-eye'}"></i> 
                            ${newAnnouncement.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                `;
                
                announcementsContainer.prepend(card);
                
                // Add event listeners to the new card
                const editBtn = card.querySelector('.edit-announcement-btn');
                editBtn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.editAnnouncement(id);
                });
                
                const deleteBtn = card.querySelector('.delete-announcement-btn');
                deleteBtn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    this.deleteAnnouncement(id);
                });
                
                const toggleBtn = card.querySelector('.toggle-status-btn');
                toggleBtn.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    const isActive = e.currentTarget.dataset.active === 'true';
                    this.toggleAnnouncementStatus(id, !isActive);
                    
                    // Update button text and icon
                    e.currentTarget.innerHTML = `
                        <i class="fas ${!isActive ? 'fa-eye-slash' : 'fa-eye'}"></i> 
                        ${!isActive ? 'Deactivate' : 'Activate'}
                    `;
                    e.currentTarget.dataset.active = !isActive;
                    
                    // Update card class
                    if (isActive) {
                        card.classList.remove('active');
                        card.classList.add('inactive');
                    } else {
                        card.classList.remove('inactive');
                        card.classList.add('active');
                    }
                });
                
                const trackingToggle = card.querySelector('.camera-tracking-toggle');
                trackingToggle.addEventListener('change', (e) => {
                    const id = e.currentTarget.closest('.announcement-card').dataset.id;
                    const isTracking = e.currentTarget.checked;
                    this.toggleCameraTracking(id, isTracking);
                });
            }
            
            // Close the modal
            document.body.removeChild(modal);
            
            // Show success message
            alert('Announcement added successfully!');
        });
    }
    
    async loadGallery() {
        console.log('Loading gallery...');
        // Implementation would go here
    }
    
    async loadUserUploads() {
        console.log('Loading user uploads...');
        // Implementation would go here
    }
    
    async loadPayments() {
        console.log('Loading payments...');
        // Implementation would go here
    }
    
    initializeMap() {
        console.log('Initializing map...');
        // Implementation would go here
    }
    
    async viewRegistration(id) {
        console.log('Viewing registration:', id);
        alert(`Viewing registration ${id}`);
        // Implementation would go here
    }
    
    async editRegistration(id) {
        console.log('Editing registration:', id);
        alert(`Editing registration ${id}`);
        // Implementation would go here
    }
    
    async deleteRegistration(id) {
        console.log('Deleting registration:', id);
        if (confirm(`Are you sure you want to delete registration ${id}?`)) {
            alert(`Registration ${id} deleted`);
            // Implementation would go here
        }
    }
}