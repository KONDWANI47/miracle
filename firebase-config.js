// Firebase Configuration for MIRACLE ECD
// Real-time database integration for cross-device registration access

// IMPORTANT: Replace the firebaseConfig below with your actual Firebase project credentials
// Get these from: https://console.firebase.google.com/ → Your Project → Project Settings → General → Your Apps

// Firebase configuration - UPDATED WITH REAL CREDENTIALS
const firebaseConfig = {
    apiKey: "AIzaSyB1iHXoHTN-65gk8X0AGWQ0uYiwpZnVfJo",
    authDomain: "miracle-ecd.firebaseapp.com",
    projectId: "miracle-ecd",
    storageBucket: "miracle-ecd.firebasestorage.app",
    messagingSenderId: "642350429737",
    appId: "1:642350429737:web:9c1eb31d89fb569b124e38",
    measurementId: "G-HBW50KWZDT"
};

// Initialize Firebase
let firebase;
let db;
let auth;
let storage;

// Load Firebase SDK dynamically
async function loadFirebase() {
    try {
        // Check if Firebase is already loaded from HTML
        if (window.firebase) {
            console.log('Firebase already loaded from HTML');
            firebase = window.firebase;
            
            // Initialize Firebase if not already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
                console.log('Firebase initialized with config:', firebaseConfig);
            }
            
            db = firebase.firestore();
            auth = firebase.auth();
            storage = firebase.storage();
            
            console.log('Firebase services initialized successfully');
            return true;
        }

        // If Firebase is not loaded, load it dynamically
        console.log('Loading Firebase SDKs dynamically...');
        
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = () => reject(new Error(`Failed to load ${src}`));
                document.head.appendChild(script);
            });
        };

        // Load Firebase SDKs in order
        await loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js');
        await loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js');

        // Initialize Firebase
        firebase = window.firebase;
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        storage = firebase.storage();
        
        console.log('Firebase services initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to load Firebase:', error);
        return false;
    }
}

class FirebaseManager {
    constructor() {
        this.collectionName = 'registrations';
        this.adminCollection = 'admin_users';
        this.notificationsCollection = 'notifications';
        this.blogPostsCollection = 'blog_posts';
        this.testimonialsCollection = 'testimonials';
        this.galleryCollection = 'gallery';
        this.userUploadsCollection = 'user_uploads';
        this.announcementsCollection = 'announcements';
        this.heroAnnouncementsCollection = 'hero_announcements';
        this.studentsCollection = 'students';
        this.paymentsCollection = 'payments';
        this.paymentSettingsCollection = 'payment_settings';
        this.isInitialized = false;
        this.realTimeListeners = new Map();
    }

    async initialize() {
        if (this.isInitialized) return true;
        
        try {
            const success = await loadFirebase();
            if (success) {
                this.isInitialized = true;
                console.log('Firebase manager initialized successfully');
                return true;
            } else {
                console.error('Failed to initialize Firebase');
                return false;
            }
        } catch (error) {
            console.error('Firebase manager initialization error:', error);
            return false;
        }
    }

    // Save registration to Firebase
    async saveRegistration(registrationData) {
        try {
            if (!this.isInitialized) {
                console.log('Initializing Firebase manager...');
                await this.initialize();
            }

            console.log('Saving registration to Firebase:', registrationData);

            const registration = {
                ...registrationData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending',
                paymentStatus: 'unpaid',
                id: null // Will be set after save
            };

            console.log('Registration object to save:', registration);

            const docRef = await db.collection(this.collectionName).add(registration);
            console.log('Document created with ID:', docRef.id);
            
            // Update with the document ID
            await docRef.update({ id: docRef.id });
            console.log('Document updated with ID');

            console.log('Registration saved to Firebase successfully:', docRef.id);
            
            // Send notification
            try {
                await this.sendNotification(registrationData, docRef.id);
                console.log('Notification sent successfully');
            } catch (notificationError) {
                console.error('Notification error:', notificationError);
            }
            
            return {
                success: true,
                id: docRef.id,
                data: registration
            };
        } catch (error) {
            console.error('Firebase save error:', error);
            console.error('Error details:', error.message, error.code, error.stack);
            throw error;
        }
    }

    // Get all registrations (for admin)
    async getAllRegistrations() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const snapshot = await db.collection(this.collectionName)
                .orderBy('timestamp', 'desc')
                .get();

            const registrations = [];
            snapshot.forEach(doc => {
                registrations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return registrations;
        } catch (error) {
            console.error('Firebase fetch error:', error);
            throw error;
        }
    }

    // Get registration by ID
    async getRegistrationById(id) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const doc = await db.collection(this.collectionName).doc(id).get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            } else {
                throw new Error('Registration not found');
            }
        } catch (error) {
            console.error('Firebase get error:', error);
            throw error;
        }
    }

    // Update registration status
    async updateRegistration(id, updates) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            await db.collection(this.collectionName).doc(id).update({
                ...updates,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('Registration updated:', id);
            return true;
        } catch (error) {
            console.error('Firebase update error:', error);
            throw error;
        }
    }

    // Delete registration
    async deleteRegistration(id) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            await db.collection(this.collectionName).doc(id).delete();
            console.log('Registration deleted:', id);
            return true;
        } catch (error) {
            console.error('Firebase delete error:', error);
            throw error;
        }
    }

    // Send notification about new registration
    async sendNotification(registrationData, registrationId) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const notification = {
                type: 'new_registration',
                registrationId: registrationId,
                data: registrationData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                read: false,
                priority: 'high'
            };

            await db.collection(this.notificationsCollection).add(notification);
            console.log('Notification sent for registration:', registrationId);
        } catch (error) {
            console.error('Notification error:', error);
        }
    }

    // Get unread notifications
    async getUnreadNotifications() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const snapshot = await db.collection(this.notificationsCollection)
                .where('read', '==', false)
                .orderBy('timestamp', 'desc')
                .get();

            const notifications = [];
            snapshot.forEach(doc => {
                notifications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return notifications;
        } catch (error) {
            console.error('Get notifications error:', error);
            return [];
        }
    }

    // Mark notification as read
    async markNotificationAsRead(notificationId) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            await db.collection(this.notificationsCollection).doc(notificationId).update({
                read: true,
                readAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Mark notification read error:', error);
        }
    }

    // Blog Posts Management
    async saveBlogPost(blogData) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const blogPost = {
                ...blogData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                id: null
            };

            const docRef = await db.collection(this.blogPostsCollection).add(blogPost);
            await docRef.update({ id: docRef.id });

            return {
                success: true,
                id: docRef.id,
                data: blogPost
            };
        } catch (error) {
            console.error('Blog post save error:', error);
            throw error;
        }
    }

    async getAllBlogPosts() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const snapshot = await db.collection(this.blogPostsCollection)
                .orderBy('timestamp', 'desc')
                .get();

            const blogPosts = [];
            snapshot.forEach(doc => {
                blogPosts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return blogPosts;
        } catch (error) {
            console.error('Blog posts fetch error:', error);
            throw error;
        }
    }

    async updateBlogPost(id, updates) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            await db.collection(this.blogPostsCollection).doc(id).update({
                ...updates,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Blog post update error:', error);
            throw error;
        }
    }

    async deleteBlogPost(id) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            await db.collection(this.blogPostsCollection).doc(id).delete();
            return true;
        } catch (error) {
            console.error('Blog post delete error:', error);
            throw error;
        }
    }

    // Testimonials Management
    async saveTestimonial(testimonialData) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const testimonial = {
                ...testimonialData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending',
                id: null
            };

            const docRef = await db.collection(this.testimonialsCollection).add(testimonial);
            await docRef.update({ id: docRef.id });

            return {
                success: true,
                id: docRef.id,
                data: testimonial
            };
        } catch (error) {
            console.error('Testimonial save error:', error);
            throw error;
        }
    }

    async getAllTestimonials() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const snapshot = await db.collection(this.testimonialsCollection)
                .orderBy('timestamp', 'desc')
                .get();

            const testimonials = [];
            snapshot.forEach(doc => {
                testimonials.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return testimonials;
        } catch (error) {
            console.error('Testimonials fetch error:', error);
            throw error;
        }
    }

    async updateTestimonial(id, updates) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            await db.collection(this.testimonialsCollection).doc(id).update({
                ...updates,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Testimonial update error:', error);
            throw error;
        }
    }

    // Gallery Management
    async saveGalleryItem(galleryData) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const galleryItem = {
                ...galleryData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                id: null
            };

            const docRef = await db.collection(this.galleryCollection).add(galleryItem);
            await docRef.update({ id: docRef.id });

            return {
                success: true,
                id: docRef.id,
                data: galleryItem
            };
        } catch (error) {
            console.error('Gallery item save error:', error);
            throw error;
        }
    }

    async getAllGalleryItems() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const snapshot = await db.collection(this.galleryCollection)
                .orderBy('timestamp', 'desc')
                .get();

            const galleryItems = [];
            snapshot.forEach(doc => {
                galleryItems.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return galleryItems;
        } catch (error) {
            console.error('Gallery items fetch error:', error);
            throw error;
        }
    }

    // Students Management
    async saveStudent(studentData) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const student = {
                ...studentData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                id: null
            };

            const docRef = await db.collection(this.studentsCollection).add(student);
            await docRef.update({ id: docRef.id });

            return {
                success: true,
                id: docRef.id,
                data: student
            };
        } catch (error) {
            console.error('Student save error:', error);
            throw error;
        }
    }

    async getAllStudents() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const snapshot = await db.collection(this.studentsCollection)
                .orderBy('timestamp', 'desc')
                .get();

            const students = [];
            snapshot.forEach(doc => {
                students.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return students;
        } catch (error) {
            console.error('Students fetch error:', error);
            throw error;
        }
    }

    // Real-time listeners for all collections
    setupRealTimeListeners(callbacks) {
        if (!this.isInitialized) {
            this.initialize().then(() => {
                this.setupRealTimeListeners(callbacks);
            });
            return;
        }

        // Setup listeners for each collection
        const collections = [
            { name: 'registrations', callback: callbacks.onRegistrationsChange },
            { name: 'notifications', callback: callbacks.onNotificationsChange },
            { name: 'blog_posts', callback: callbacks.onBlogPostsChange },
            { name: 'testimonials', callback: callbacks.onTestimonialsChange },
            { name: 'gallery', callback: callbacks.onGalleryChange },
            { name: 'students', callback: callbacks.onStudentsChange },
            { name: 'announcements', callback: callbacks.onAnnouncementsChange },
            { name: 'hero_announcements', callback: callbacks.onHeroAnnouncementsChange },
            { name: 'user_uploads', callback: callbacks.onUserUploadsChange },
            { name: 'payments', callback: callbacks.onPaymentsChange }
        ];

        collections.forEach(({ name, callback }) => {
            if (callback) {
                const unsubscribe = db.collection(name)
                    .orderBy('timestamp', 'desc')
                    .onSnapshot((snapshot) => {
                        const items = [];
                        snapshot.forEach(doc => {
                            items.push({
                                id: doc.id,
                                ...doc.data()
                            });
                        });
                        callback(items);
                    }, (error) => {
                        console.error(`${name} listener error:`, error);
                    });

                this.realTimeListeners.set(name, unsubscribe);
            }
        });

        console.log('Real-time listeners setup complete');
    }

    // Cleanup all listeners
    cleanupListeners() {
        this.realTimeListeners.forEach((unsubscribe, name) => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
                console.log(`Cleaned up listener for ${name}`);
            }
        });
        this.realTimeListeners.clear();
    }

    // Real-time listener for registrations
    onRegistrationsChange(callback) {
        if (!this.isInitialized) {
            this.initialize().then(() => {
                this.setupRegistrationsListener(callback);
            });
        } else {
            this.setupRegistrationsListener(callback);
        }
    }

    setupRegistrationsListener(callback) {
        return db.collection(this.collectionName)
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                const registrations = [];
                snapshot.forEach(doc => {
                    registrations.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(registrations);
            });
    }

    // Real-time listener for notifications
    onNotificationsChange(callback) {
        if (!this.isInitialized) {
            this.initialize().then(() => {
                this.setupNotificationsListener(callback);
            });
        } else {
            this.setupNotificationsListener(callback);
        }
    }

    setupNotificationsListener(callback) {
        return db.collection(this.notificationsCollection)
            .where('read', '==', false)
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                const notifications = [];
                snapshot.forEach(doc => {
                    notifications.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(notifications);
            });
    }

    // Get statistics
    async getStatistics() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const registrations = await this.getAllRegistrations();
            
            const stats = {
                total: registrations.length,
                pending: registrations.filter(r => r.status === 'pending').length,
                approved: registrations.filter(r => r.status === 'approved').length,
                rejected: registrations.filter(r => r.status === 'rejected').length,
                paid: registrations.filter(r => r.paymentStatus === 'paid').length,
                unpaid: registrations.filter(r => r.paymentStatus === 'unpaid').length,
                thisMonth: registrations.filter(r => {
                    const regDate = r.timestamp ? r.timestamp.toDate() : new Date();
                    const now = new Date();
                    return regDate.getMonth() === now.getMonth() && 
                           regDate.getFullYear() === now.getFullYear();
                }).length
            };
            
            return stats;
        } catch (error) {
            console.error('Statistics error:', error);
            throw error;
        }
    }

    // Search registrations
    async searchRegistrations(query) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const registrations = await this.getAllRegistrations();
            
            return registrations.filter(reg => 
                reg.parent_name?.toLowerCase().includes(query.toLowerCase()) ||
                reg.email?.toLowerCase().includes(query.toLowerCase()) ||
                reg.phone?.includes(query) ||
                reg.child_name?.toLowerCase().includes(query.toLowerCase())
            );
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }

    // Payment Gateway Methods
    async savePayment(paymentData) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            console.log('Saving payment to Firebase:', paymentData);

            const payment = {
                ...paymentData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: paymentData.status || 'pending',
                id: null // Will be set after save
            };

            const docRef = await db.collection(this.paymentsCollection).add(payment);
            await docRef.update({ id: docRef.id });

            console.log('Payment saved to Firebase successfully:', docRef.id);
            
            // Update registration payment status if this is a registration payment
            if (payment.registrationId) {
                await this.updateRegistrationPaymentStatus(payment.registrationId, payment.status);
            }

            // Send payment notification
            await this.sendPaymentNotification(payment, docRef.id);
            
            return {
                success: true,
                id: docRef.id,
                data: payment
            };
        } catch (error) {
            console.error('Payment save error:', error);
            throw error;
        }
    }

    async getAllPayments() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const snapshot = await db.collection(this.paymentsCollection)
                .orderBy('timestamp', 'desc')
                .get();

            const payments = [];
            snapshot.forEach(doc => {
                payments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return payments;
        } catch (error) {
            console.error('Payments fetch error:', error);
            throw error;
        }
    }

    async getPaymentById(id) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const doc = await db.collection(this.paymentsCollection).doc(id).get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            } else {
                throw new Error('Payment not found');
            }
        } catch (error) {
            console.error('Payment fetch error:', error);
            throw error;
        }
    }

    async updatePayment(id, updates) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            await db.collection(this.paymentsCollection).doc(id).update({
                ...updates,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('Payment updated successfully:', id);
            
            // Update registration payment status if this is a registration payment
            const payment = await this.getPaymentById(id);
            if (payment.registrationId) {
                await this.updateRegistrationPaymentStatus(payment.registrationId, updates.status || payment.status);
            }

            return { success: true };
        } catch (error) {
            console.error('Payment update error:', error);
            throw error;
        }
    }

    async deletePayment(id) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            await db.collection(this.paymentsCollection).doc(id).delete();
            console.log('Payment deleted successfully:', id);
            return { success: true };
        } catch (error) {
            console.error('Payment delete error:', error);
            throw error;
        }
    }

    async updateRegistrationPaymentStatus(registrationId, paymentStatus) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const paymentStatusMap = {
                'completed': 'paid',
                'pending': 'unpaid',
                'failed': 'unpaid',
                'cancelled': 'unpaid'
            };

            const registrationStatus = paymentStatusMap[paymentStatus] || 'unpaid';

            await db.collection(this.collectionName).doc(registrationId).update({
                paymentStatus: registrationStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('Registration payment status updated:', registrationId, registrationStatus);
        } catch (error) {
            console.error('Registration payment status update error:', error);
            throw error;
        }
    }

    async sendPaymentNotification(payment, paymentId) {
        try {
            const notification = {
                type: 'payment',
                title: `Payment ${payment.status === 'completed' ? 'Completed' : 'Received'}`,
                message: `Payment of MWK ${payment.amount?.toLocaleString() || '0'} for ${payment.parentName || 'Registration'} has been ${payment.status === 'completed' ? 'completed' : 'received'}.`,
                data: {
                    paymentId: paymentId,
                    registrationId: payment.registrationId,
                    amount: payment.amount,
                    parentName: payment.parentName,
                    paymentMethod: payment.paymentMethod
                },
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                read: false
            };

            await db.collection(this.notificationsCollection).add(notification);
            console.log('Payment notification sent');
        } catch (error) {
            console.error('Payment notification error:', error);
        }
    }

    // Payment Settings Methods
    async getPaymentSettings() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const snapshot = await db.collection(this.paymentSettingsCollection).limit(1).get();
            
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data()
                };
            } else {
                // Return default settings
                return {
                    registrationFee: 5000,
                    earlyChildhoodCarePrice: 0,
                    foundationProgramPrice: 0,
                    primaryPreparationPrice: 0
                };
            }
        } catch (error) {
            console.error('Payment settings fetch error:', error);
            throw error;
        }
    }

    async updatePaymentSettings(settings) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const snapshot = await db.collection(this.paymentSettingsCollection).limit(1).get();
            
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                await doc.ref.update({
                    ...settings,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            } else {
                await db.collection(this.paymentSettingsCollection).add({
                    ...settings,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            console.log('Payment settings updated successfully');
            return { success: true };
        } catch (error) {
            console.error('Payment settings update error:', error);
            throw error;
        }
    }
}

// Initialize Firebase manager
const firebaseManager = new FirebaseManager();

// Export for use in other files
window.firebaseManager = firebaseManager;

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    firebaseManager.initialize().then(success => {
        if (success) {
            console.log('Firebase manager initialized successfully');
        } else {
            console.error('Failed to initialize Firebase manager');
        }
    });
}); 