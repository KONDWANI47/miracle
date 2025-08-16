// Firebase Configuration for MIRACLE ECD
// Real-time database integration for cross-device registration access

// IMPORTANT: Replace the firebaseConfig below with your actual Firebase project credentials
// Get these from: https://console.firebase.google.com/ → Your Project → Project Settings → General → Your Apps

// Firebase configuration - UPDATED WITH REAL CREDENTIALS
const firebaseConfig = {
    apiKey: "AIzaSyB1iHXoHTN-65gk8X0AGWQ0uYiwpZnVfJo",
    authDomain: "miracle-ecd.firebaseapp.com",
    projectId: "miracle-ecd",
    storageBucket: "miracle-ecd.appspot.com",
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
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        // Load Firebase core
        await loadScript('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
        
        // Load Firebase services
        await Promise.all([
            loadScript('https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js'),
            loadScript('https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js'),
            loadScript('https://www.gstatic.com/firebasejs/8.10.1/firebase-storage.js'),
            loadScript('https://www.gstatic.com/firebasejs/8.10.1/firebase-analytics.js')
        ]);
        
        console.log('Firebase SDKs loaded successfully');
        
        // Initialize Firebase
        firebase = window.firebase;
        firebase.initializeApp(firebaseConfig);
        
        // Initialize Firebase services
        db = firebase.firestore();
        auth = firebase.auth();
        storage = firebase.storage();
        
        console.log('Firebase services initialized successfully');
        return true;
    } catch (error) {
        console.error('Error loading Firebase:', error);
        return false;
    }
}

// Firebase Manager Class
class FirebaseManager {
    constructor() {
        this.isInitialized = false;
        this.user = null;
    }
    
    async initialize() {
        if (this.isInitialized) return true;
        
        try {
            const success = await loadFirebase();
            if (success) {
                this.isInitialized = true;
                console.log('Firebase Manager initialized');
                
                // Set up auth state listener
                firebase.auth().onAuthStateChanged((user) => {
                    if (user) {
                        this.user = user;
                        console.log('User is signed in:', user.email);
                    } else {
                        this.user = null;
                        console.log('User is signed out');
                    }
                });
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to initialize Firebase Manager:', error);
            return false;
        }
    }
    
    async signIn(email, password) {
        if (!this.isInitialized) await this.initialize();
        
        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            this.user = userCredential.user;
            console.log('User signed in successfully:', this.user.email);
            return true;
        } catch (error) {
            console.error('Sign in error:', error.code, error.message);
            return { error: error.message };
        }
    }
    
    async signOut() {
        if (!this.isInitialized) return false;
        
        try {
            await firebase.auth().signOut();
            this.user = null;
            console.log('User signed out successfully');
            return true;
        } catch (error) {
            console.error('Sign out error:', error);
            return false;
        }
    }
    
    async createRegistration(registrationData) {
        if (!this.isInitialized) await this.initialize();
        
        try {
            // Add timestamp
            registrationData.timestamp = firebase.firestore.FieldValue.serverTimestamp();
            
            // Add to Firestore
            const docRef = await db.collection('registrations').add(registrationData);
            console.log('Registration created with ID:', docRef.id);
            
            // Update with ID
            await docRef.update({ id: docRef.id });
            
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error creating registration:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getRegistrations() {
        if (!this.isInitialized) await this.initialize();
        
        try {
            const snapshot = await db.collection('registrations').orderBy('timestamp', 'desc').get();
            const registrations = [];
            
            snapshot.forEach((doc) => {
                registrations.push({ id: doc.id, ...doc.data() });
            });
            
            return registrations;
        } catch (error) {
            console.error('Error getting registrations:', error);
            return [];
        }
    }
    
    async updateRegistration(id, data) {
        if (!this.isInitialized) await this.initialize();
        
        try {
            // Add last updated timestamp
            data.lastUpdated = firebase.firestore.FieldValue.serverTimestamp();
            
            await db.collection('registrations').doc(id).update(data);
            console.log('Registration updated:', id);
            return true;
        } catch (error) {
            console.error('Error updating registration:', error);
            return false;
        }
    }
    
    async deleteRegistration(id) {
        if (!this.isInitialized) await this.initialize();
        
        try {
            await db.collection('registrations').doc(id).delete();
            console.log('Registration deleted:', id);
            return true;
        } catch (error) {
            console.error('Error deleting registration:', error);
            return false;
        }
    }
    
    async uploadFile(file, path) {
        if (!this.isInitialized) await this.initialize();
        
        try {
            const storageRef = storage.ref();
            const fileRef = storageRef.child(path);
            
            // Upload file
            const snapshot = await fileRef.put(file);
            console.log('File uploaded successfully');
            
            // Get download URL
            const downloadURL = await snapshot.ref.getDownloadURL();
            return { success: true, url: downloadURL };
        } catch (error) {
            console.error('Error uploading file:', error);
            return { success: false, error: error.message };
        }
    }
    
    get isAuthenticated() {
        return !!this.user;
    }
    
    get currentUser() {
        return this.user;
    }
    
    get firestore() {
        return db;
    }
}

// Create and export Firebase Manager instance
const firebaseManager = new FirebaseManager();

// Auto-initialize Firebase when script is loaded
document.addEventListener('DOMContentLoaded', () => {
    firebaseManager.initialize().then((success) => {
        if (success) {
            console.log('Firebase auto-initialized on page load');
        }
    });
});