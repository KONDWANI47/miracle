// API Base URL - Update this to your server URL
const API_BASE_URL = 'http://localhost:3000/api';

// Real-time update system
class RealTimeManager {
    constructor() {
        this.listeners = new Map();
        this.isInitialized = false;
        this.updateCallbacks = new Map();
    }

    async initialize() {
        if (this.isInitialized) return;
        
        try {
            if (typeof firebaseManager !== 'undefined') {
                await firebaseManager.initialize();
                this.isInitialized = true;
                console.log('Real-time manager initialized');
                this.setupRealTimeListeners();
            } else {
                console.warn('Firebase manager not available, real-time updates disabled');
            }
        } catch (error) {
            console.error('Failed to initialize real-time manager:', error);
        }
    }

    setupRealTimeListeners() {
        if (!this.isInitialized) return;

        // Registrations real-time listener
        this.setupRegistrationsListener();
        
        // Notifications real-time listener
        this.setupNotificationsListener();
        
        // Analytics real-time updates
        this.setupAnalyticsListener();
        
        console.log('Real-time listeners setup complete');
    }

    setupRegistrationsListener() {
        if (!firebaseManager || !firebaseManager.db) return;

        const unsubscribe = firebaseManager.db.collection('registrations')
            .orderBy('timestamp', 'desc')
            .onSnapshot((snapshot) => {
                const registrations = [];
                snapshot.forEach(doc => {
                    registrations.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                console.log('Real-time registrations update:', registrations.length);
                this.updateRegistrations(registrations);
            }, (error) => {
                console.error('Registrations listener error:', error);
            });

        this.listeners.set('registrations', unsubscribe);
    }

    setupNotificationsListener() {
        if (!firebaseManager || !firebaseManager.db) return;

        const unsubscribe = firebaseManager.db.collection('notifications')
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
                
                console.log('Real-time notifications update:', notifications.length);
                this.updateNotifications(notifications);
            }, (error) => {
                console.error('Notifications listener error:', error);
            });

        this.listeners.set('notifications', unsubscribe);
    }

    setupAnalyticsListener() {
        if (!firebaseManager || !firebaseManager.db) return;

        // Listen to all collections that affect analytics
        const collections = ['registrations', 'payments', 'students'];
        
        collections.forEach(collection => {
            const unsubscribe = firebaseManager.db.collection(collection)
                .onSnapshot((snapshot) => {
                    // Trigger analytics refresh
                    this.refreshAnalytics();
                    
                    // Show real-time payment updates
                    if (collection === 'payments') {
                        this.handlePaymentUpdates(snapshot);
                    }
                }, (error) => {
                    console.error(`${collection} analytics listener error:`, error);
                });

            this.listeners.set(`analytics_${collection}`, unsubscribe);
        });
    }

    handlePaymentUpdates(snapshot) {
        const changes = snapshot.docChanges();
        changes.forEach(change => {
            if (change.type === 'added') {
                const payment = change.doc.data();
                this.showPaymentNotification(payment, 'New payment received');
            } else if (change.type === 'modified') {
                const payment = change.doc.data();
                if (payment.status === 'completed') {
                    this.showPaymentNotification(payment, 'Payment completed');
                }
            }
        });
    }

    showPaymentNotification(payment, message) {
        // Create payment notification toast
        const toast = document.createElement('div');
        toast.className = 'notification-toast payment-notification';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-credit-card"></i>
                <div class="toast-text">
                    <strong>${message}</strong>
                    <p>MWK ${payment.amount?.toLocaleString() || '0'} - ${payment.parentName || 'Payment'} - ${new Date().toLocaleTimeString()}</p>
                </div>
                <button class="toast-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    updateRegistrations(registrations) {
        // Update registrations table
        if (document.getElementById('registrationsTableBody')) {
            displayRegistrations(registrations);
        }
        
        // Update analytics
        this.refreshAnalytics();
        
        // Update recent registrations
        if (document.getElementById('recentRegistrations')) {
            updateRecentRegistrations(registrations);
        }
        
        // Show notification for new registrations
        this.checkForNewRegistrations(registrations);
    }

    updateNotifications(notifications) {
        // Update notification count in header
        const notificationCount = notifications.length;
        this.updateNotificationBadge(notificationCount);
        
        // Show notification toast for new notifications
        if (notificationCount > 0) {
            this.showNotificationToast(notifications[0]);
        }
    }

    updateNotificationBadge(count) {
        // Create or update notification badge in header
        let badge = document.getElementById('notificationBadge');
        if (!badge) {
            const header = document.querySelector('.admin-header');
            if (header) {
                const badgeContainer = document.createElement('div');
                badgeContainer.className = 'notification-badge-container';
                badgeContainer.innerHTML = `
                    <button id="notificationBtn" class="admin-btn">
                        <i class="fas fa-bell"></i>
                        <span id="notificationBadge" class="notification-badge">${count}</span>
                    </button>
                `;
                header.querySelector('.admin-controls').appendChild(badgeContainer);
                badge = document.getElementById('notificationBadge');
            }
        }
        
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    showNotificationToast(notification) {
        // Create notification toast
        const toast = document.createElement('div');
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-bell"></i>
                <div class="toast-text">
                    <strong>New ${notification.type.replace('_', ' ')}</strong>
                    <p>${notification.data?.parent_name || 'New item'} - ${new Date().toLocaleTimeString()}</p>
                </div>
                <button class="toast-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    checkForNewRegistrations(registrations) {
        const lastKnownCount = parseInt(localStorage.getItem('lastRegistrationCount') || '0');
        const currentCount = registrations.length;
        
        if (currentCount > lastKnownCount) {
            const newRegistrations = registrations.slice(0, currentCount - lastKnownCount);
            this.showNewRegistrationsNotification(newRegistrations);
        }
        
        localStorage.setItem('lastRegistrationCount', currentCount.toString());
    }

    showNewRegistrationsNotification(newRegistrations) {
        const toast = document.createElement('div');
        toast.className = 'notification-toast success';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-user-plus"></i>
                <div class="toast-text">
                    <strong>${newRegistrations.length} New Registration${newRegistrations.length > 1 ? 's' : ''}</strong>
                    <p>${newRegistrations[0]?.parent_name || 'New registration'} - ${new Date().toLocaleTimeString()}</p>
                </div>
                <button class="toast-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);
        
        toast.querySelector('.toast-close').addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    refreshAnalytics() {
        // Refresh analytics data
        if (document.getElementById('analytics-section').classList.contains('active')) {
            loadAnalytics();
        }
    }

    cleanup() {
        // Cleanup all listeners
        this.listeners.forEach((unsubscribe, key) => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        });
        this.listeners.clear();
    }
}

// Initialize real-time manager
const realTimeManager = new RealTimeManager();

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Load data from Firebase and server
async function loadDataFromServer() {
    try {
        let registrations = [];
        let payments = [];
        
        // Try Firebase first for registrations and payments
        if (typeof firebaseManager !== 'undefined') {
            try {
                console.log('Loading data from Firebase...');
                registrations = await firebaseManager.getAllRegistrations();
                console.log('Registrations loaded from Firebase:', registrations.length);
                
                // For now, payments will be loaded from localStorage
                // You can extend Firebase to handle payments later
                payments = JSON.parse(localStorage.getItem('payments') || '[]');
            } catch (firebaseError) {
                console.error('Firebase load failed:', firebaseError);
                // Fallback to localStorage for registrations
                registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
                payments = JSON.parse(localStorage.getItem('payments') || '[]');
            }
        } else {
            // Firebase not available, use localStorage
            registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
            payments = JSON.parse(localStorage.getItem('payments') || '[]');
        }

        // Load other data from localStorage (these can be moved to Firebase later)
        const announcements = JSON.parse(localStorage.getItem('announcements') || '[]');
        const heroAnnouncements = JSON.parse(localStorage.getItem('heroAnnouncements') || '[]');
        const gallery = JSON.parse(localStorage.getItem('galleryData') || '[]');
        const userUploads = JSON.parse(localStorage.getItem('userUploads') || '[]');
        const paymentSettings = JSON.parse(localStorage.getItem('paymentSettings') || '{"registrationFee": 5000}');
        const testimonials = JSON.parse(localStorage.getItem('testimonials') || '[]');
        const blogPosts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
        const students = JSON.parse(localStorage.getItem('students') || '[]');

        // Store all data in localStorage as backup
        localStorage.setItem('registrations', JSON.stringify(registrations));
        localStorage.setItem('payments', JSON.stringify(payments));
        localStorage.setItem('announcements', JSON.stringify(announcements));
        localStorage.setItem('heroAnnouncements', JSON.stringify(heroAnnouncements));
        localStorage.setItem('galleryData', JSON.stringify(gallery));
        localStorage.setItem('userUploads', JSON.stringify(userUploads));
        localStorage.setItem('paymentSettings', JSON.stringify(paymentSettings));
        localStorage.setItem('testimonials', JSON.stringify(testimonials));
        localStorage.setItem('blogPosts', JSON.stringify(blogPosts));
        localStorage.setItem('students', JSON.stringify(students));

        return {
            registrations,
            payments,
            announcements,
            heroAnnouncements,
            gallery,
            userUploads,
            paymentSettings,
            testimonials,
            blogPosts,
            students
        };
    } catch (error) {
        console.error('Failed to load data, using localStorage:', error);
        // Fallback to localStorage if everything fails
        return loadDataFromLocalStorage();
    }
}

// Load data from localStorage (fallback)
function loadDataFromLocalStorage() {
    return {
        registrations: JSON.parse(localStorage.getItem('registrations') || '[]'),
        payments: JSON.parse(localStorage.getItem('payments') || '[]'),
        announcements: JSON.parse(localStorage.getItem('announcements') || '[]'),
        heroAnnouncements: JSON.parse(localStorage.getItem('heroAnnouncements') || '[]'),
        gallery: JSON.parse(localStorage.getItem('galleryData') || '[]'),
        userUploads: JSON.parse(localStorage.getItem('userUploads') || '[]'),
        paymentSettings: JSON.parse(localStorage.getItem('paymentSettings') || '{"registrationFee": 5000}'),
        testimonials: JSON.parse(localStorage.getItem('testimonials') || '[]'),
        blogPosts: JSON.parse(localStorage.getItem('blogPosts') || '[]'),
        students: JSON.parse(localStorage.getItem('students') || '[]')
    };
}

// Save data to server
async function saveDataToServer(dataType, data) {
    try {
        await apiCall(`/${dataType}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        // Also update localStorage as backup
        localStorage.setItem(dataType, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Failed to save ${dataType} to server:`, error);
        // Fallback to localStorage only
        localStorage.setItem(dataType, JSON.stringify(data));
        return false;
    }
}

// Update data on server
async function updateDataOnServer(dataType, id, data) {
    try {
        await apiCall(`/${dataType}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return true;
    } catch (error) {
        console.error(`Failed to update ${dataType} on server:`, error);
        return false;
    }
}

// Delete data from server
async function deleteDataFromServer(dataType, id) {
    try {
        await apiCall(`/${dataType}/${id}`, {
            method: 'DELETE'
        });
        return true;
    } catch (error) {
        console.error(`Failed to delete ${dataType} from server:`, error);
        return false;
    }
}

// Enhanced admin.js with all new features
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize real-time manager
  await realTimeManager.initialize();
  
  // Global variables for tracking current items
  let currentRegistrationId = null
  let currentAnnouncementId = null

  // DOM Elements
  const registrationsTableBody = document.getElementById("registrationsTableBody")
  const paymentsTableBody = document.getElementById("paymentsTableBody")
  const searchInput = document.getElementById("searchInput")
  const statusFilter = document.getElementById("statusFilter")
  const exportBtn = document.getElementById("exportBtn")
  const refreshBtn = document.getElementById("refreshBtn")
  const modal = document.getElementById("registrationModal")
  const announcementModal = document.getElementById("announcementModal")
  const closeModals = document.querySelectorAll(".close-modal")
  const registrationDetails = document.getElementById("registrationDetails")
  const statusUpdate = document.getElementById("statusUpdate")
  const updateStatusBtn = document.getElementById("updateStatusBtn")
  const deleteRegistrationBtn = document.getElementById("deleteRegistrationBtn")
  const passwordToggle = document.getElementById("passwordToggle")
  const passwordInput = document.getElementById("password")
  const rememberMeCheckbox = document.getElementById("rememberMe")

  // Announcement elements
  const announcementForm = document.getElementById("announcementForm")
  const announcementsContainer = document.getElementById("announcementsContainer")
  const editAnnouncementForm = document.getElementById("editAnnouncementForm")
  const deleteAnnouncementBtn = document.getElementById("deleteAnnouncementBtn")

  // Gallery elements
  const galleryUploadForm = document.getElementById("galleryUploadForm")
  const adminGalleryContainer = document.getElementById("adminGalleryContainer")

  // User uploads elements
  const userUploadsContainer = document.getElementById("userUploadsContainer")
  const uploadsStatusFilter = document.getElementById("uploadsStatusFilter")

  // Payment elements
  const paymentSettingsForm = document.getElementById("paymentSettingsForm")

  // Blog Post Management
  const blogPostForm = document.getElementById("blogPostForm")
  const adminBlogPostsContainer = document.getElementById("adminBlogPostsContainer")

  // Announcements Management
  const adminAnnouncementsContainer = document.getElementById("adminAnnouncementsContainer")
  const heroAnnouncementForm = document.getElementById("heroAnnouncementForm")
  const adminHeroAnnouncementsContainer = document.getElementById("adminHeroAnnouncementsContainer")

  // Plog Post Management
  const plogPostForm = document.getElementById("plogPostForm")
  const adminPlogPostsContainer = document.getElementById("adminPlogPostsContainer")

  // Initialize data from server
  loadDataFromServer().then(() => {
    initializeData()
    loadAnalytics()
    renderAdminBlogPosts()
    setDefaultBlogDateTime()
  }).catch(() => {
    // Fallback to localStorage if server fails
    initializeData()
    loadAnalytics()
    renderAdminBlogPosts()
    setDefaultBlogDateTime()
  })

  // Cleanup real-time listeners on page unload
  window.addEventListener('beforeunload', () => {
    realTimeManager.cleanup();
  });

  // Password toggle functionality
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener("click", function () {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
      passwordInput.setAttribute("type", type)

      const icon = this.querySelector("i")
      if (type === "password") {
        icon.classList.remove("fa-eye-slash")
        icon.classList.add("fa-eye")
      } else {
        icon.classList.remove("fa-eye")
        icon.classList.add("fa-eye-slash")
      }
    })
  }

  // Check for remembered login
  if (localStorage.getItem("rememberAdmin") === "true") {
    const savedEmail = localStorage.getItem("adminEmail")
    const savedPassword = localStorage.getItem("adminPassword")
    if (savedEmail && savedPassword) {
      document.getElementById("email").value = ""
      document.getElementById("password").value = ""
      rememberMeCheckbox.checked = false
    }
  }

  // Initialize data
  function initializeData() {
    if (!localStorage.getItem("daycareRegistrations")) {
      localStorage.setItem("daycareRegistrations", JSON.stringify([]))
    }
    if (!localStorage.getItem("announcements")) {
      localStorage.setItem("announcements", JSON.stringify([]))
    }
    if (!localStorage.getItem("galleryData")) {
      const defaultGallery = [
        {
          id: 1,
          title: "Our School Building",
          description:
            "Welcome to MIRACLE ECD! This is our main school building located in Area 25, Sector 6, Lilongwe. Our modern facility provides a safe, clean, and nurturing environment where children can learn, play, and grow. The building features well-equipped classrooms, a library, computer lab, and administrative offices. We take pride in maintaining high standards of cleanliness and safety to ensure the best learning experience for every child.",
          image: "ana.png",
          updatedDate: new Date().toISOString(),
        },
        {
          id: 2,
          title: "School Grounds & Play Area",
          description:
            "Our spacious school grounds span across a large area, providing children with plenty of space for outdoor activities, sports, and recreational play. The grounds include a playground with age-appropriate equipment, open spaces for running and games, and shaded areas for outdoor learning. We believe that outdoor play is essential for children's physical development, social skills, and overall well-being. Our grounds are regularly maintained and supervised to ensure safety.",
          image: "ground.png",
          updatedDate: new Date().toISOString(),
        },
        {
          id: 3,
          title: "Interactive Learning Sessions",
          description: "Our dedicated teachers engage students in interactive learning sessions that make education fun and engaging. We use modern teaching methods that combine traditional learning with hands-on activities, group discussions, and multimedia resources. Our curriculum is designed to develop critical thinking, creativity, and problem-solving skills. Children learn through exploration, experimentation, and collaboration with their peers.",
          image: "ana2.png",
          updatedDate: new Date().toISOString(),
        },
        {
          id: 4,
          title: "Learning Through Play",
          description: "At MIRACLE ECD, we understand that play is the natural way children learn. Our play-based learning approach allows children to develop essential skills while having fun. Through structured play activities, children learn cooperation, communication, creativity, and problem-solving. Our teachers carefully design play activities that align with educational objectives while keeping children engaged and excited about learning.",
          image: "playing.jpg",
          updatedDate: new Date().toISOString(),
        },
        {
          id: 5,
          title: "Early Childhood Development",
          description: "Our early childhood development program focuses on the holistic development of children aged 0-12 years. We provide age-appropriate activities that support cognitive, physical, social, and emotional development. Our experienced teachers create a warm, supportive environment where each child feels valued and encouraged to reach their full potential. We celebrate every milestone and achievement, no matter how small.",
          image: "kids.jpg",
          updatedDate: new Date().toISOString(),
        },
        {
          id: 6,
          title: "Extracurricular Activities",
          description: "Beyond academic learning, we offer a wide range of extracurricular activities including computer training, music, art, sports, and cultural activities. These activities help children discover their talents, build confidence, and develop well-rounded personalities. We also offer part-time classes for all grades, business plan development, NGO constitution documents, front office and hospitality training, and entrepreneurship consultations.",
          image: "ana3.png",
          updatedDate: new Date().toISOString(),
        },
        {
          id: 7,
          title: "Student Achievements & Projects",
          description: "We celebrate the creativity and achievements of our students through various projects and activities. Children work on individual and group projects that showcase their learning and creativity. From art projects to science experiments, from storytelling to mathematical challenges, every project helps children develop important skills and build confidence in their abilities. We display student work proudly throughout our school.",
          image: "kds 1.jpg",
          updatedDate: new Date().toISOString(),
        },
      ]
      localStorage.setItem("galleryData", JSON.stringify(defaultGallery))
    }
    if (!localStorage.getItem("userUploads")) {
      localStorage.setItem("userUploads", JSON.stringify([]))
    }
    if (!localStorage.getItem("payments")) {
      localStorage.setItem("payments", JSON.stringify([]))
    }
    if (!localStorage.getItem("paymentSettings")) {
      const defaultSettings = {
        registrationFee: 5000,
        earlyChildhoodCarePrice: 150,
        foundationProgramPrice: 120,
        primaryPreparationPrice: 100,
      }
      localStorage.setItem("paymentSettings", JSON.stringify(defaultSettings))
    }
    if (!localStorage.getItem("blogPosts")) {
      localStorage.setItem("blogPosts", JSON.stringify([]))
    }
    if (!localStorage.getItem("plogPosts")) {
      localStorage.setItem("plogPosts", JSON.stringify([]))
    }
    if (!localStorage.getItem("heroAnnouncements")) {
      localStorage.setItem("heroAnnouncements", JSON.stringify([]))
    }
  }

  // Load and display registrations
  async function loadRegistrations() {
    try {
      console.log('Loading registrations...');
      
      let registrations = [];
      
      // Try Firebase first
      if (typeof firebaseManager !== 'undefined') {
        try {
          console.log('Attempting to load from Firebase...');
          registrations = await firebaseManager.getAllRegistrations();
          console.log('Registrations loaded from Firebase:', registrations.length);
          console.log('Firebase registrations:', registrations);
        } catch (firebaseError) {
          console.error('Firebase load failed:', firebaseError);
          // Fallback to localStorage
          registrations = JSON.parse(localStorage.getItem("registrations")) || [];
          console.log('Using localStorage fallback:', registrations.length);
        }
      } else {
        console.log('Firebase manager not available, using localStorage');
        registrations = JSON.parse(localStorage.getItem("registrations")) || [];
      }

      displayRegistrations(registrations);
      console.log('Registrations displayed:', registrations.length);
    } catch (error) {
      console.error('Error loading registrations:', error);
      showMessage("Error loading registrations", "error");
    }
  }

  // Display registrations in table
  function displayRegistrations(registrations) {
    if (!registrationsTableBody) return

    registrationsTableBody.innerHTML = ""

    if (registrations.length === 0) {
      registrationsTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 2rem; color: #666;">
            No registrations found
          </td>
        </tr>
      `
      return
    }

    registrations.forEach((reg) => {
      const row = document.createElement("tr")
      row.innerHTML = `
        <td>${reg.id}</td>
        <td>${escapeHtml(reg.parent_name || reg.parentName || 'Not provided')}</td>
        <td>${escapeHtml(reg.child_name || reg.childName || 'Not provided')}</td>
        <td>${escapeHtml(reg.program)}</td>
        <td>${new Date(reg.start_date || reg.startDate).toLocaleDateString()}</td>
        <td>${new Date(reg.registration_date || reg.registrationDate).toLocaleString()}</td>
        <td><span class="status-badge status-${(reg.payment_status || reg.paymentStatus || "pending").toLowerCase()}">${reg.payment_status || reg.paymentStatus || "Pending"}</span></td>
        <td><span class="status-badge status-${(reg.registration_status || reg.status || 'pending').toLowerCase().replace(" ", "-")}">${reg.registration_status || reg.status || 'Pending'}</span></td>
        <td>
          <button class="admin-btn view-btn" data-id="${reg.id}">
            <i class="fas fa-eye"></i> View
          </button>
        </td>
      `
      registrationsTableBody.appendChild(row)
    })

    // Add event listeners to view buttons
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await showRegistrationDetails(btn.dataset.id);
        } catch (error) {
          console.error('Error showing registration details:', error);
          showMessage("Error loading registration details", "error");
        }
      });
    })
  }

  // Load and display payments
  function loadPayments() {
    try {
      const payments = JSON.parse(localStorage.getItem("payments")) || []
      displayPayments(payments)
    } catch (error) {
      console.error("Error loading payments:", error)
      showMessage("Error loading payments", "error")
    }
  }

  // Display payments in table
  function displayPayments(payments) {
    if (!paymentsTableBody) return

    paymentsTableBody.innerHTML = ""

    if (payments.length === 0) {
      paymentsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
            No payments found
          </td>
        </tr>
      `
      return
    }

    payments.forEach((payment) => {
      const row = document.createElement("tr")
      row.innerHTML = `
        <td>
          <input type="checkbox" class="payment-checkbox" value="${payment.id}" style="margin-right: 8px;">
          ${payment.id}
        </td>
        <td>${payment.registrationId || 'N/A'}</td>
        <td>${escapeHtml(payment.parentName)}</td>
        <td>MWK${payment.amount}</td>
        <td>${new Date(payment.paymentDate).toLocaleString()}</td>
        <td><span class="status-badge status-${payment.status.toLowerCase()}">${payment.status}</span></td>
        <td>
          <button class="admin-btn view-btn" onclick="viewPaymentDetails(${payment.id})" style="margin-right: 0.5rem;">
            <i class="fas fa-eye"></i> View
          </button>
          <button class="admin-btn delete-btn" onclick="confirmDeletePayment('${payment.id}', '${payment.reference || payment.id}', '${payment.amount}', '${payment.parentName}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </td>
      `
      paymentsTableBody.appendChild(row)
    })
    
    // Add bulk delete functionality
    addBulkDeleteFunctionality()
  }

  // Add bulk delete functionality for payments
  function addBulkDeleteFunctionality() {
    // Add select all checkbox to header if not exists
    const paymentsTable = document.getElementById("paymentsTable")
    if (paymentsTable) {
      const headerRow = paymentsTable.querySelector("thead tr")
      if (headerRow && !headerRow.querySelector(".select-all-checkbox")) {
        const firstHeaderCell = headerRow.querySelector("th")
        if (firstHeaderCell) {
          firstHeaderCell.innerHTML = `
            <input type="checkbox" class="select-all-checkbox" style="margin-right: 8px;">
            <span>ID</span>
          `
        }
      }
    }

    // Add bulk delete button if not exists
    const paymentsSection = document.getElementById("paymentsSection")
    if (paymentsSection && !paymentsSection.querySelector(".bulk-delete-btn")) {
      const bulkDeleteBtn = document.createElement("button")
      bulkDeleteBtn.className = "admin-btn delete-btn bulk-delete-btn"
      bulkDeleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Selected'
      bulkDeleteBtn.style.marginTop = "1rem"
      bulkDeleteBtn.onclick = bulkDeletePayments
      paymentsSection.appendChild(bulkDeleteBtn)
    }

    // Add event listeners
    const selectAllCheckbox = document.querySelector(".select-all-checkbox")
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener("change", function() {
        const checkboxes = document.querySelectorAll(".payment-checkbox")
        checkboxes.forEach(checkbox => {
          checkbox.checked = this.checked
        })
      })
    }
  }

  // Bulk delete payments
  function bulkDeletePayments() {
    const selectedCheckboxes = document.querySelectorAll(".payment-checkbox:checked")
    
    if (selectedCheckboxes.length === 0) {
      showMessage("Please select at least one payment to delete", "info")
      return
    }

    const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value)
    const confirmMessage = `Are you sure you want to delete ${selectedIds.length} payment record(s)?

This action will:
✓ Completely remove all selected payments
✓ Reset any linked registration payment statuses
✓ Clear all payment references
✓ Update analytics and reports
✓ Cannot be undone

Type "DELETE ALL" to confirm:`

    const userInput = prompt(confirmMessage)
    
    if (userInput === "DELETE ALL") {
      selectedIds.forEach(id => {
        deletePayment(id)
      })
      showMessage(`${selectedIds.length} payment record(s) completely removed from system`, "success")
    } else if (userInput !== null) {
      showMessage("Bulk deletion cancelled. Payment records remain intact.", "info")
    }
  }

  // Load and display announcements
  function loadAnnouncements() {
    try {
      const announcements = JSON.parse(localStorage.getItem("announcements")) || []
      displayAnnouncements(announcements)
    } catch (error) {
      console.error("Error loading announcements:", error)
      showMessage("Error loading announcements", "error")
    }
  }

  // Display announcements
  function displayAnnouncements(announcements) {
    if (!announcementsContainer) return

    announcementsContainer.innerHTML = ""

    if (announcements.length === 0) {
      announcementsContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #666;">
          No announcements found
        </div>
      `
      return
    }

    announcements.forEach((announcement) => {
      const announcementDiv = document.createElement("div")
      announcementDiv.className = `announcement-admin-item ${announcement.type}`
      announcementDiv.innerHTML = `
        <div class="announcement-admin-header">
          <h4 class="announcement-admin-title">${escapeHtml(announcement.title)}</h4>
          <div class="announcement-admin-actions">
            <button class="edit-announcement-btn" data-id="${announcement.id}">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="delete-announcement-btn" data-id="${announcement.id}">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        <div class="announcement-admin-content">${escapeHtml(announcement.content)}</div>
        <div class="announcement-admin-meta">
          <span class="announcement-type-badge ${announcement.type}">${announcement.type}</span>
          <span>Created: ${new Date(announcement.createdDate).toLocaleDateString()}</span>
          ${announcement.expiryDate ? `<span>Expires: ${new Date(announcement.expiryDate).toLocaleDateString()}</span>` : ""}
        </div>
      `
      announcementsContainer.appendChild(announcementDiv)
    })

    // Add event listeners
    document.querySelectorAll(".edit-announcement-btn").forEach((btn) => {
      btn.addEventListener("click", () => editAnnouncement(btn.dataset.id))
    })

    document.querySelectorAll(".delete-announcement-btn").forEach((btn) => {
      btn.addEventListener("click", () => deleteAnnouncement(btn.dataset.id))
    })
  }

  // Load and display gallery
  function loadGallery() {
    try {
      const galleryData = JSON.parse(localStorage.getItem("galleryData")) || []
      displayGallery(galleryData)
    } catch (error) {
      console.error("Error loading gallery:", error)
      showMessage("Error loading gallery", "error")
    }
  }

  // Display gallery
  function displayGallery(galleryData) {
    if (!adminGalleryContainer) return

    adminGalleryContainer.innerHTML = ""

    galleryData.forEach((item) => {
      const galleryCard = document.createElement("div")
      galleryCard.className = "gallery-card"
      galleryCard.innerHTML = `
        <div class="gallery-image">
          <img src="${item.image}" alt="${escapeHtml(item.title)}">
          <div class="gallery-overlay">
            <button class="edit-btn" data-id="${item.id}"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="gallery-info">
          <h3>${escapeHtml(item.title)}</h3>
          <p>Updated: ${new Date(item.updatedDate).toLocaleDateString()}</p>
          <div class="gallery-actions">
            <button class="upload-btn" data-id="${item.id}">
              <i class="fas fa-upload"></i> Replace Image
            </button>
          </div>
        </div>
      `
      adminGalleryContainer.appendChild(galleryCard)
    })

    // Add event listeners
    addGalleryEventListeners()
  }

  // Load and display user uploads
  function loadUserUploads() {
    try {
      const userUploads = JSON.parse(localStorage.getItem("userUploads")) || []
      displayUserUploads(userUploads)
    } catch (error) {
      console.error("Error loading user uploads:", error)
      showMessage("Error loading user uploads", "error")
    }
  }

  // Display user uploads
  function displayUserUploads(userUploads) {
    if (!userUploadsContainer) return

    const statusFilter = uploadsStatusFilter?.value || "all"
    const filteredUploads =
      statusFilter === "all" ? userUploads : userUploads.filter((upload) => upload.status === statusFilter)

    userUploadsContainer.innerHTML = ""

    if (filteredUploads.length === 0) {
      userUploadsContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #666;">
          No user uploads found
        </div>
      `
      return
    }

    filteredUploads.forEach((upload) => {
      const uploadCard = document.createElement("div")
      uploadCard.className = "user-upload-admin-card"
      uploadCard.innerHTML = `
        <div class="user-upload-admin-image">
          <img src="${upload.image}" alt="${escapeHtml(upload.title)}">
        </div>
        <div class="user-upload-admin-content">
          <div class="user-upload-admin-header">
            <div>
              <h4 class="user-upload-admin-title">${escapeHtml(upload.title)}</h4>
              <div class="user-upload-admin-meta">
                By: ${escapeHtml(upload.uploaderName)} (${escapeHtml(upload.uploaderEmail)})
              </div>
              <div class="user-upload-admin-meta">
                Uploaded: ${new Date(upload.uploadDate).toLocaleDateString()}
              </div>
            </div>
            <div class="user-upload-admin-actions">
              ${
                upload.status === "pending"
                  ? `
                <button class="approve-btn" data-id="${upload.id}">
                  <i class="fas fa-check"></i> Approve
                </button>
                <button class="reject-btn" data-id="${upload.id}">
                  <i class="fas fa-times"></i> Reject
                </button>
              `
                  : ""
              }
              <button class="delete-btn" data-id="${upload.id}">
                <i class="fas fa-trash"></i> Delete
              </button>
            </div>
          </div>
          <p>${escapeHtml(upload.description)}</p>
          <div class="user-upload-status ${upload.status}">${upload.status.toUpperCase()}</div>
        </div>
      `
      userUploadsContainer.appendChild(uploadCard)
    })

    // Add event listeners
    addUserUploadEventListeners()
  }

  // Load payment settings
  function loadPaymentSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem("paymentSettings")) || {}

      if (document.getElementById("registrationFeeAmount")) {
        document.getElementById("registrationFeeAmount").value = settings.registrationFee || 5000
      }
      if (document.getElementById("earlyChildhoodCarePrice")) {
        document.getElementById("earlyChildhoodCarePrice").value = settings.earlyChildhoodCarePrice || 150
      }
      if (document.getElementById("foundationProgramPrice")) {
        document.getElementById("foundationProgramPrice").value = settings.foundationProgramPrice || 120
      }
      if (document.getElementById("primaryPreparationPrice")) {
        document.getElementById("primaryPreparationPrice").value = settings.primaryPreparationPrice || 100
      }
    } catch (error) {
      console.error("Error loading payment settings:", error)
    }
  }

  // Show registration details in modal
  async function showRegistrationDetails(id) {
    try {
      console.log('Showing registration details for ID:', id);
      
      let registration = null;
      let registrations = [];
      
      // Try to get registration from Firebase first
      if (typeof firebaseManager !== 'undefined') {
        try {
          console.log('Attempting to get registration from Firebase...');
          registration = await firebaseManager.getRegistrationById(id);
          console.log('Registration found in Firebase:', registration);
        } catch (firebaseError) {
          console.error('Firebase get failed:', firebaseError);
          // Fallback to localStorage
          registrations = JSON.parse(localStorage.getItem("registrations")) || [];
          registration = registrations.find((reg) => reg.id === Number.parseInt(id) || reg.id === id);
        }
      } else {
        console.log('Firebase manager not available, using localStorage');
        registrations = JSON.parse(localStorage.getItem("registrations")) || [];
        registration = registrations.find((reg) => reg.id === Number.parseInt(id) || reg.id === id);
      }

      if (registration) {
        currentRegistrationId = registration.id
        if (statusUpdate) {
          statusUpdate.value = registration.registration_status || registration.status || 'pending'
        }

        // Get related payment information
        const payments = JSON.parse(localStorage.getItem("payments")) || []
        const relatedPayment = payments.find(payment => payment.registrationId === registration.id)

        if (registrationDetails) {
          registrationDetails.innerHTML = `
            <div class="registration-details-container">
              <div class="details-section">
                <h3><i class="fas fa-user"></i> Parent/Guardian Information</h3>
                <div class="details-grid">
                  <div class="detail-item">
                    <strong>Registration ID:</strong>
                    <span>${registration.id}</span>
                  </div>
                  <div class="detail-item">
                    <strong>Parent/Guardian Name:</strong>
                    <span>${escapeHtml(registration.parent_name || registration.parentName || "Not provided")}</span>
                  </div>
                  <div class="detail-item">
                    <strong>Email Address:</strong>
                    <span>${escapeHtml(registration.email)}</span>
                  </div>
                  <div class="detail-item">
                    <strong>Phone Number:</strong>
                    <span>${escapeHtml(registration.phone)}</span>
                  </div>
                </div>
              </div>

              <div class="details-section">
                <h3><i class="fas fa-child"></i> Child Information</h3>
                <div class="details-grid">
                  <div class="detail-item">
                    <strong>Child's Name:</strong>
                    <span>${escapeHtml(registration.child_name || registration.childName || "Not provided")}</span>
                  </div>
                  <div class="detail-item">
                    <strong>Child's Age:</strong>
                    <span>${registration.child_age || registration.childAge} years old</span>
                  </div>
                  <div class="detail-item">
                    <strong>Age Group:</strong>
                    <span>${getAgeGroup(registration.child_age || registration.childAge)}</span>
                  </div>
                </div>
              </div>

              <div class="details-section">
                <h3><i class="fas fa-graduation-cap"></i> Program Information</h3>
                <div class="details-grid">
                  <div class="detail-item">
                    <strong>Program Type:</strong>
                    <span>${escapeHtml(registration.program)}</span>
                  </div>
                  <div class="detail-item">
                    <strong>Preferred Start Date:</strong>
                    <span>${new Date(registration.start_date || registration.startDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div class="detail-item">
                    <strong>Registration Date:</strong>
                    <span>${new Date(registration.registration_date || registration.registrationDate).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
              </div>

              <div class="details-section">
                <h3><i class="fas fa-credit-card"></i> Payment Information</h3>
                <div class="details-grid">
                  <div class="detail-item">
                    <strong>Payment Status:</strong>
                    <span class="status-badge status-${(registration.payment_status || registration.paymentStatus || "pending").toLowerCase()}">${registration.payment_status || registration.paymentStatus || "Pending"}</span>
                  </div>
                  <div class="detail-item">
                    <strong>Registration Status:</strong>
                    <span class="status-badge status-${(registration.registration_status || registration.status || 'pending').toLowerCase().replace(" ", "-")}">${registration.registration_status || registration.status || 'Pending'}</span>
                  </div>
                  ${relatedPayment ? `
                    <div class="detail-item">
                      <strong>Payment Amount:</strong>
                      <span>MWK ${relatedPayment.amount?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                      <strong>Payment Method:</strong>
                      <span>${relatedPayment.paymentMethod || relatedPayment.method || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                      <strong>Payment Date:</strong>
                      <span>${relatedPayment.paymentDate ? new Date(relatedPayment.paymentDate).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                      <strong>Payment Reference:</strong>
                      <span>${relatedPayment.reference || relatedPayment.id || 'N/A'}</span>
                    </div>
                  ` : ''}
                </div>
              </div>

              <div class="details-section">
                <h3><i class="fas fa-comments"></i> Additional Information</h3>
                <div class="details-grid">
                  <div class="detail-item full-width">
                    <strong>Message/Notes:</strong>
                    <p class="message-content">${escapeHtml(registration.message) || "No additional information provided"}</p>
                  </div>
                </div>
              </div>

              <div class="details-section">
                <h3><i class="fas fa-clock"></i> Timeline Information</h3>
                <div class="details-grid">
                  <div class="detail-item">
                    <strong>Days Since Registration:</strong>
                    <span>${getDaysSince(new Date(registration.registration_date || registration.registrationDate))} days</span>
                  </div>
                  <div class="detail-item">
                    <strong>Days Until Start Date:</strong>
                    <span>${getDaysUntil(new Date(registration.start_date || registration.startDate))} days</span>
                  </div>
                  ${registration.lastUpdated ? `
                    <div class="detail-item">
                      <strong>Last Updated:</strong>
                      <span>${new Date(registration.lastUpdated).toLocaleString()}</span>
                    </div>
                  ` : ''}
                </div>
              </div>

              <div class="details-section">
                <h3><i class="fas fa-tools"></i> Quick Actions</h3>
                <div class="action-buttons">
                  <a href="https://wa.me/265992260985?text=${encodeURIComponent(formatWhatsAppMessage(registration))}" 
                     class="btn btn-success" target="_blank">
                    <i class="fab fa-whatsapp"></i> WhatsApp Contact
                  </a>
                  <a href="mailto:${registration.email}?subject=Registration Confirmation - MIRACLE ECD" 
                     class="btn btn-primary" target="_blank">
                    <i class="fas fa-envelope"></i> Send Email
                  </a>
                  <button class="btn btn-warning" onclick="exportRegistration(${registration.id})">
                    <i class="fas fa-download"></i> Export Details
                  </button>
                </div>
              </div>
            </div>
          `
        }

        if (modal) {
          modal.style.display = "block"
        }
      } else {
        showMessage("Registration not found", "error")
      }
    } catch (error) {
      console.error("Error showing registration details:", error)
      showMessage("Error loading registration details", "error")
    }
  }

  // Helper function to get age group
  function getAgeGroup(age) {
    if (age < 5) return "Early Childhood Care (0-5 years)"
    if (age < 7) return "Foundation Program (5-7 years)"
    if (age <= 12) return "Primary Preparation (7-12 years)"
    return "Age group not specified"
  }

  // Helper function to get days since registration
  function getDaysSince(date) {
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Helper function to get days until start date
  function getDaysUntil(date) {
    const now = new Date()
    const diffTime = date - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  // Export registration details
  function exportRegistration(id) {
    try {
      const registrations = JSON.parse(localStorage.getItem("registrations")) || []
      const registration = registrations.find((reg) => reg.id === Number.parseInt(id))
      
      if (registration) {
        const dataStr = JSON.stringify(registration, null, 2)
        const dataBlob = new Blob([dataStr], {type: 'application/json'})
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `registration-${registration.id}-${registration.parentName || 'unknown'}.json`
        link.click()
        URL.revokeObjectURL(url)
        showMessage("Registration details exported successfully", "success")
      }
    } catch (error) {
      console.error("Error exporting registration:", error)
      showMessage("Error exporting registration details", "error")
    }
  }

  // Update registration status
  async function updateRegistrationStatus(id, newStatus) {
    try {
      let updated = false;
      
      // Try Firebase first
      if (typeof firebaseManager !== 'undefined') {
        try {
          await firebaseManager.updateRegistration(id, { status: newStatus });
          console.log('Registration status updated in Firebase');
          updated = true;
        } catch (firebaseError) {
          console.error('Firebase update failed, using localStorage:', firebaseError);
        }
      }
      
      // Fallback to localStorage if Firebase fails or not available
      if (!updated) {
        const registrations = JSON.parse(localStorage.getItem("registrations")) || [];
        const index = registrations.findIndex((reg) => reg.id === id);

        if (index !== -1) {
          registrations[index].status = newStatus;
          registrations[index].lastUpdated = new Date().toISOString();
          localStorage.setItem("registrations", JSON.stringify(registrations));
        } else {
          showMessage("Registration not found", "error");
          return false;
        }
      }
      
      await loadRegistrations();
      showMessage("Status updated successfully", "success");
      return true;
    } catch (error) {
      console.error("Error updating status:", error);
      showMessage("Error updating status", "error");
      return false;
    }
  }

  // Delete registration
  async function deleteRegistration(id) {
    if (confirm("Are you sure you want to delete this registration? This action cannot be undone.")) {
      try {
        let deleted = false;
        
        // Try Firebase first
        if (typeof firebaseManager !== 'undefined') {
          try {
            await firebaseManager.deleteRegistration(id);
            console.log('Registration deleted from Firebase');
            deleted = true;
          } catch (firebaseError) {
            console.error('Firebase delete failed, using localStorage:', firebaseError);
          }
        }
        
        // Fallback to localStorage if Firebase fails or not available
        if (!deleted) {
          const registrations = JSON.parse(localStorage.getItem("registrations")) || [];
          const filteredRegistrations = registrations.filter((reg) => reg.id !== id);
          localStorage.setItem("registrations", JSON.stringify(filteredRegistrations));
        }
        
        await loadRegistrations();
        if (modal) {
          modal.style.display = "none";
        }
        showMessage("Registration deleted successfully", "success");
      } catch (error) {
        console.error("Error deleting registration:", error);
        showMessage("Error deleting registration", "error");
      }
    }
  }

  // Confirm payment deletion with detailed information
  function confirmDeletePayment(paymentId, reference, amount, parentName) {
    const confirmMessage = `Are you sure you want to completely delete this payment record?

Payment Details:
• Reference: ${reference}
• Amount: MWK ${amount}
• Parent: ${parentName}
• Payment ID: ${paymentId}

This action will:
✓ Remove the payment from all records
✓ Reset any linked registration payment statuses
✓ Clear all payment references
✓ Update analytics and reports
✓ Cannot be undone

Type "DELETE" to confirm:`

    const userInput = prompt(confirmMessage)
    
    if (userInput === "DELETE") {
      deletePayment(paymentId)
    } else if (userInput !== null) {
      showMessage("Deletion cancelled. Payment record remains intact.", "info")
    }
  }

  // Delete payment - Complete removal
  function deletePayment(paymentId) {
    try {
      // Get the payment to be deleted for reference
      const payments = JSON.parse(localStorage.getItem("payments")) || []
      const paymentToDelete = payments.find(payment => payment.id == paymentId)
      
      if (!paymentToDelete) {
        showMessage("Payment record not found", "error")
        return
      }

      // Remove from payments array
      const filteredPayments = payments.filter((payment) => payment.id != paymentId)
      localStorage.setItem("payments", JSON.stringify(filteredPayments))
      
      // Clean up any related registration records
      const registrations = JSON.parse(localStorage.getItem("registrations")) || []
      const updatedRegistrations = registrations.map(registration => {
        // If this registration was linked to the deleted payment, update its status
        if (registration.paymentReference === paymentToDelete.reference || 
            registration.paymentId === paymentId) {
          return {
            ...registration,
            paymentStatus: "Pending",
            paymentReference: null,
            paymentId: null,
            paymentDate: null
          }
        }
        return registration
      })
      localStorage.setItem("registrations", JSON.stringify(updatedRegistrations))
      
      // Clean up session storage if the deleted payment was pending
      const pendingPayment = JSON.parse(sessionStorage.getItem("pendingPayment") || "null")
      if (pendingPayment && pendingPayment.id == paymentId) {
        sessionStorage.removeItem("pendingPayment")
      }
      
      // Clean up any temporary payment data
      const tempPayments = JSON.parse(sessionStorage.getItem("tempPayments") || "[]")
      const filteredTempPayments = tempPayments.filter(payment => payment.id != paymentId)
      sessionStorage.setItem("tempPayments", JSON.stringify(filteredTempPayments))
      
      // Reload all related data
      loadPayments()
      loadRegistrations()
      loadAnalytics()
      
      // Log the deletion for audit purposes
      console.log(`Payment deleted: ${paymentToDelete.reference} - Amount: ${paymentToDelete.amount} - Date: ${paymentToDelete.paymentDate}`)
      
      showMessage(`Payment record ${paymentToDelete.reference} completely removed from system`, "success")
    } catch (error) {
      console.error("Error deleting payment:", error)
      showMessage("Error deleting payment record. Please try again.", "error")
    }
  }

  // Create announcement
  function createAnnouncement(announcementData) {
    try {
      const announcements = JSON.parse(localStorage.getItem("announcements")) || []
      const newAnnouncement = {
        id: Date.now(),
        ...announcementData,
        createdDate: new Date().toISOString(),
      }
      announcements.push(newAnnouncement)
      localStorage.setItem("announcements", JSON.stringify(announcements))
      loadAnnouncements()

      // Trigger update on main site
      window.dispatchEvent(new Event("announcementsUpdated"))

      showMessage("Announcement created successfully", "success")
    } catch (error) {
      console.error("Error creating announcement:", error)
      showMessage("Error creating announcement", "error")
    }
  }

  // Edit announcement
  function editAnnouncement(id) {
    try {
      const announcements = JSON.parse(localStorage.getItem("announcements")) || []
      const announcement = announcements.find((a) => a.id === Number.parseInt(id))

      if (announcement) {
        currentAnnouncementId = announcement.id

        document.getElementById("editAnnouncementTitle").value = announcement.title
        document.getElementById("editAnnouncementContent").value = announcement.content
        document.getElementById("editAnnouncementType").value = announcement.type
        document.getElementById("editAnnouncementExpiry").value = announcement.expiryDate
          ? announcement.expiryDate.split("T")[0]
          : ""

        announcementModal.style.display = "block"
      }
    } catch (error) {
      console.error("Error editing announcement:", error)
      showMessage("Error loading announcement", "error")
    }
  }

  // Update announcement
  function updateAnnouncement(id, announcementData) {
    try {
      const announcements = JSON.parse(localStorage.getItem("announcements")) || []
      const index = announcements.findIndex((a) => a.id === id)

      if (index !== -1) {
        announcements[index] = {
          ...announcements[index],
          ...announcementData,
          updatedDate: new Date().toISOString(),
        }
        localStorage.setItem("announcements", JSON.stringify(announcements))
        loadAnnouncements()

        // Trigger update on main site
        window.dispatchEvent(new Event("announcementsUpdated"))

        showMessage("Announcement updated successfully", "success")
      }
    } catch (error) {
      console.error("Error updating announcement:", error)
      showMessage("Error updating announcement", "error")
    }
  }

  // Delete announcement
  function deleteAnnouncement(id) {
    if (confirm("Are you sure you want to delete this announcement?")) {
      try {
        const announcements = JSON.parse(localStorage.getItem("announcements")) || []
        const filteredAnnouncements = announcements.filter((a) => a.id !== Number.parseInt(id))
        localStorage.setItem("announcements", JSON.stringify(filteredAnnouncements))
        loadAnnouncements()

        // Trigger update on main site
        window.dispatchEvent(new Event("announcementsUpdated"))

        showMessage("Announcement deleted successfully", "success")
      } catch (error) {
        console.error("Error deleting announcement:", error)
        showMessage("Error deleting announcement", "error")
      }
    }
  }

  // Edit hero announcement
  function editHeroAnnouncement(id) {
    try {
      const heroAnnouncements = JSON.parse(localStorage.getItem("heroAnnouncements")) || []
      const announcement = heroAnnouncements.find((a) => a.id === Number.parseInt(id))

      if (announcement) {
        currentAnnouncementId = announcement.id

        document.getElementById("editHeroAnnouncementTitle").value = announcement.title
        document.getElementById("editHeroAnnouncementContent").value = announcement.content
        document.getElementById("editHeroAnnouncementType").value = announcement.type
        document.getElementById("editHeroAnnouncementExpiry").value = announcement.expiryDate
          ? announcement.expiryDate.split("T")[0]
          : ""

        // Show hero announcement modal
        const heroAnnouncementModal = document.getElementById("heroAnnouncementModal")
        if (heroAnnouncementModal) {
          heroAnnouncementModal.style.display = "block"
        }
      }
    } catch (error) {
      console.error("Error editing hero announcement:", error)
      showMessage("Error loading hero announcement", "error")
    }
  }

  // Delete hero announcement
  function deleteHeroAnnouncement(id) {
    if (confirm("Are you sure you want to delete this hero announcement?")) {
      try {
        const heroAnnouncements = JSON.parse(localStorage.getItem("heroAnnouncements")) || []
        const filteredAnnouncements = heroAnnouncements.filter((a) => a.id !== Number.parseInt(id))
        localStorage.setItem("heroAnnouncements", JSON.stringify(filteredAnnouncements))
        renderAdminHeroAnnouncements()

        // Trigger update on main site
        window.dispatchEvent(new Event("heroAnnouncementsUpdated"))

        showMessage("Hero announcement deleted successfully", "success")
      } catch (error) {
        console.error("Error deleting hero announcement:", error)
        showMessage("Error deleting hero announcement", "error")
      }
    }
  }

  // Update hero announcement
  function updateHeroAnnouncement(id, announcementData) {
    try {
      const heroAnnouncements = JSON.parse(localStorage.getItem("heroAnnouncements")) || []
      const index = heroAnnouncements.findIndex((a) => a.id === id)

      if (index !== -1) {
        heroAnnouncements[index] = {
          ...heroAnnouncements[index],
          ...announcementData,
          updatedDate: new Date().toISOString(),
        }
        localStorage.setItem("heroAnnouncements", JSON.stringify(heroAnnouncements))
        renderAdminHeroAnnouncements()

        // Trigger update on main site
        window.dispatchEvent(new Event("heroAnnouncementsUpdated"))

        showMessage("Hero announcement updated successfully", "success")
      }
    } catch (error) {
      console.error("Error updating hero announcement:", error)
      showMessage("Error updating hero announcement", "error")
    }
  }

  // Add gallery event listeners
  function addGalleryEventListeners() {
    document.querySelectorAll(".gallery-card .edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const cardTitle = btn.closest(".gallery-card").querySelector("h3").textContent
        const newTitle = prompt(`Edit title for ${cardTitle}:`, cardTitle)
        if (newTitle && newTitle !== cardTitle) {
          updateGalleryItem(btn.dataset.id, { title: newTitle })
        }
      })
    })

    document.querySelectorAll(".gallery-card .delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const cardTitle = btn.closest(".gallery-card").querySelector("h3").textContent
        if (confirm(`Are you sure you want to delete ${cardTitle}?`)) {
          deleteGalleryItem(btn.dataset.id)
        }
      })
    })

    document.querySelectorAll(".gallery-card .upload-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const fileInput = document.createElement("input")
        fileInput.type = "file"
        fileInput.accept = "image/*"

        fileInput.onchange = (e) => {
          const file = e.target.files[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
              updateGalleryItem(btn.dataset.id, { image: e.target.result })
            }
            reader.readAsDataURL(file)
          }
        }

        fileInput.click()
      })
    })
  }

  // Update gallery item
  function updateGalleryItem(id, updates) {
    try {
      const galleryData = JSON.parse(localStorage.getItem("galleryData")) || []
      const index = galleryData.findIndex((item) => item.id === Number.parseInt(id))

      if (index !== -1) {
        galleryData[index] = {
          ...galleryData[index],
          ...updates,
          updatedDate: new Date().toISOString(),
        }
        localStorage.setItem("galleryData", JSON.stringify(galleryData))
        loadGallery()

        // Trigger update on main site
        window.dispatchEvent(new Event("galleryUpdated"))

        showMessage("Gallery item updated successfully", "success")
      }
    } catch (error) {
      console.error("Error updating gallery item:", error)
      showMessage("Error updating gallery item", "error")
    }
  }

  // Delete gallery item
  function deleteGalleryItem(id) {
    try {
      const galleryData = JSON.parse(localStorage.getItem("galleryData")) || []
      const filteredGallery = galleryData.filter((item) => item.id !== Number.parseInt(id))
      localStorage.setItem("galleryData", JSON.stringify(filteredGallery))
      loadGallery()

      // Trigger update on main site
      window.dispatchEvent(new Event("galleryUpdated"))

      showMessage("Gallery item deleted successfully", "success")
    } catch (error) {
      console.error("Error deleting gallery item:", error)
      showMessage("Error deleting gallery item", "error")
    }
  }

  // Add user upload event listeners
  function addUserUploadEventListeners() {
    document.querySelectorAll(".approve-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        updateUserUploadStatus(btn.dataset.id, "approved")
      })
    })

    document.querySelectorAll(".reject-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        updateUserUploadStatus(btn.dataset.id, "rejected")
      })
    })

    document.querySelectorAll(".user-upload-admin-card .delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this upload?")) {
          deleteUserUpload(btn.dataset.id)
        }
      })
    })
  }

  // Update user upload status
  function updateUserUploadStatus(id, status) {
    try {
      const userUploads = JSON.parse(localStorage.getItem("userUploads")) || []
      const index = userUploads.findIndex((upload) => upload.id === Number.parseInt(id))

      if (index !== -1) {
        userUploads[index].status = status
        userUploads[index].reviewDate = new Date().toISOString()
        localStorage.setItem("userUploads", JSON.stringify(userUploads))
        loadUserUploads()

        // Trigger update on main site
        window.dispatchEvent(new Event("userUploadsUpdated"))

        showMessage(`Upload ${status} successfully`, "success")
      }
    } catch (error) {
      console.error("Error updating upload status:", error)
      showMessage("Error updating upload status", "error")
    }
  }

  // Delete user upload
  function deleteUserUpload(id) {
    try {
      const userUploads = JSON.parse(localStorage.getItem("userUploads")) || []
      const filteredUploads = userUploads.filter((upload) => upload.id !== Number.parseInt(id))
      localStorage.setItem("userUploads", JSON.stringify(filteredUploads))
      loadUserUploads()

      // Trigger update on main site
      window.dispatchEvent(new Event("userUploadsUpdated"))

      showMessage("Upload deleted successfully", "success")
    } catch (error) {
      console.error("Error deleting upload:", error)
      showMessage("Error deleting upload", "error")
    }
  }

  // Export registrations to CSV
  function exportToCSV() {
    try {
      const registrations = JSON.parse(localStorage.getItem("daycareRegistrations")) || []

      if (registrations.length === 0) {
        showMessage("No registrations to export", "error")
        return
      }

      const headers = [
        "ID",
        "Parent Name",
        "Email",
        "Phone",
        "Child Name",
        "Child Age",
        "Program",
        "Start Date",
        "Registration Date",
        "Payment Status",
        "Status",
        "Message",
      ]

      const csvContent = [
        headers.join(","),
        ...registrations.map((reg) =>
          [
            reg.id,
            `"${reg.parentName.replace(/"/g, '""')}"`,
            `"${reg.email.replace(/"/g, '""')}"`,
            `"${reg.phone.replace(/"/g, '""')}"`,
            `"${reg.childName.replace(/"/g, '""')}"`,
            reg.childAge,
            `"${reg.program.replace(/"/g, '""')}"`,
            reg.startDate,
            reg.registrationDate,
            reg.paymentStatus || "Pending",
            reg.status,
            `"${(reg.message || "").replace(/"/g, '""')}"`,
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `miracle_ecd_registrations_${new Date().toISOString().split("T")[0]}.csv`
      link.click()

      showMessage("Data exported successfully", "success")
    } catch (error) {
      console.error("Error exporting data:", error)
      showMessage("Error exporting data", "error")
    }
  }

  // Filter registrations
  function filterRegistrations() {
    try {
      const searchTerm = searchInput ? searchInput.value.toLowerCase() : ""
      const statusValue = statusFilter ? statusFilter.value : "all"
      const registrations = JSON.parse(localStorage.getItem("daycareRegistrations")) || []

      const filtered = registrations.filter((reg) => {
        const matchesSearch =
          reg.parentName.toLowerCase().includes(searchTerm) ||
          reg.childName.toLowerCase().includes(searchTerm) ||
          reg.email.toLowerCase().includes(searchTerm) ||
          reg.phone.includes(searchTerm) ||
          reg.program.toLowerCase().includes(searchTerm)

        const matchesStatus = statusValue === "all" || reg.status === statusValue

        return matchesSearch && matchesStatus
      })

      displayRegistrations(filtered)
    } catch (error) {
      console.error("Error filtering registrations:", error)
      showMessage("Error filtering registrations", "error")
    }
  }

  // Escape HTML to prevent XSS
  function escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }
    return text ? text.replace(/[&<>"']/g, (m) => map[m]) : ""
  }

  // Show message
  function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll(".message")
    existingMessages.forEach((msg) => msg.remove())

    // Create message element
    const messageElement = document.createElement("div")
    messageElement.className = `message ${type}`
    messageElement.textContent = message

    // Add message to the page
    document.body.appendChild(messageElement)

    // Remove message after 3 seconds
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove()
      }
    }, 3000)
  }

  // Event Listeners
  if (searchInput) {
    searchInput.addEventListener("input", filterRegistrations)
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", filterRegistrations)
  }

  if (uploadsStatusFilter) {
    uploadsStatusFilter.addEventListener("change", loadUserUploads)
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", exportToCSV)
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      refreshBtn.disabled = true
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...'

      setTimeout(() => {
        loadRegistrations()
        loadAnnouncements()
        loadGallery()
        loadUserUploads()
        loadPayments()
        loadAnalytics()
        refreshBtn.disabled = false
        refreshBtn.innerHTML = '<i class="fas fa-sync"></i> Refresh'
        showMessage("Data refreshed successfully", "success")
      }, 1000)
    })
  }

  // Modal close events
  closeModals.forEach((closeBtn) => {
    closeBtn.addEventListener("click", () => {
      closeBtn.closest(".modal").style.display = "none"
    })
  })

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none"
    }
  })

  // Update status button
  if (updateStatusBtn) {
    updateStatusBtn.addEventListener("click", () => {
      if (currentRegistrationId && statusUpdate) {
        const newStatus = statusUpdate.value
        if (updateRegistrationStatus(currentRegistrationId, newStatus)) {
          modal.style.display = "none"
        }
      }
    })
  }

  // Delete registration button
  if (deleteRegistrationBtn) {
    deleteRegistrationBtn.addEventListener("click", () => {
      if (currentRegistrationId) {
        deleteRegistration(currentRegistrationId)
      }
    })
  }

  // Announcement form submission
  if (announcementForm) {
    announcementForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const title = document.getElementById("announcementTitle").value.trim()
      const content = document.getElementById("announcementContent").value.trim()
      const type = document.getElementById("announcementType").value
      const announcements = JSON.parse(localStorage.getItem("announcements")) || []
      const newAnnouncement = {
        id: Date.now(),
        title,
        content,
        type,
        createdDate: new Date().toISOString()
      }
      announcements.unshift(newAnnouncement)
      localStorage.setItem("announcements", JSON.stringify(announcements))
      announcementForm.reset()
      renderAdminAnnouncements()
    })
  }

  // Hero Announcement form submission
  if (heroAnnouncementForm) {
    heroAnnouncementForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const title = document.getElementById("heroAnnouncementTitle").value.trim()
      const content = document.getElementById("heroAnnouncementContent").value.trim()
      const type = document.getElementById("heroAnnouncementType").value
      const expiryDate = document.getElementById("heroAnnouncementExpiry").value || null
      
      const heroAnnouncements = JSON.parse(localStorage.getItem("heroAnnouncements")) || []
      const newHeroAnnouncement = {
        id: Date.now(),
        title,
        content,
        type,
        expiryDate,
        createdDate: new Date().toISOString()
      }
      heroAnnouncements.unshift(newHeroAnnouncement)
      localStorage.setItem("heroAnnouncements", JSON.stringify(heroAnnouncements))
      heroAnnouncementForm.reset()
      renderAdminHeroAnnouncements()
      
      // Trigger update on main site
      window.dispatchEvent(new Event("heroAnnouncementsUpdated"))
      
      showMessage("Hero announcement created successfully", "success")
    })
  }

  function renderAdminAnnouncements() {
    if (!adminAnnouncementsContainer) return
    const announcements = JSON.parse(localStorage.getItem("announcements")) || []
    if (announcements.length === 0) {
      adminAnnouncementsContainer.innerHTML = '<p>No announcements yet.</p>'
      return
    }
    adminAnnouncementsContainer.innerHTML = announcements.map(announcement => `
      <div class="admin-announcement-item ${announcement.type}">
        <h4>${escapeHtml(announcement.title)}</h4>
        <div class="admin-announcement-date">${new Date(announcement.createdDate).toLocaleDateString()}</div>
        <p>${escapeHtml(announcement.content)}</p>
      </div>
    `).join('')
  }

  function renderAdminHeroAnnouncements() {
    if (!adminHeroAnnouncementsContainer) return
    const heroAnnouncements = JSON.parse(localStorage.getItem("heroAnnouncements")) || []
    if (heroAnnouncements.length === 0) {
      adminHeroAnnouncementsContainer.innerHTML = '<p>No hero announcements yet.</p>'
      return
    }
    adminHeroAnnouncementsContainer.innerHTML = heroAnnouncements.map(announcement => `
      <div class="admin-announcement-item ${announcement.type}">
        <h4>${escapeHtml(announcement.title)}</h4>
        <div class="admin-announcement-date">${new Date(announcement.createdDate).toLocaleDateString()}</div>
        <p>${escapeHtml(announcement.content)}</p>
        ${announcement.expiryDate ? `<div class='admin-announcement-expiry'>Expires: ${new Date(announcement.expiryDate).toLocaleDateString()}</div>` : ''}
        <div class="announcement-admin-actions">
          <button class="edit-hero-announcement-btn" data-id="${announcement.id}"><i class="fas fa-edit"></i> Edit</button>
          <button class="delete-hero-announcement-btn" data-id="${announcement.id}"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
    `).join('')

    // Add event listeners for edit/delete
    document.querySelectorAll('.edit-hero-announcement-btn').forEach(btn => {
      btn.addEventListener('click', () => editHeroAnnouncement(btn.dataset.id))
    })
    document.querySelectorAll('.delete-hero-announcement-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteHeroAnnouncement(btn.dataset.id))
    })
  }

  // Edit announcement form submission
  if (editAnnouncementForm) {
    editAnnouncementForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const announcementData = {
        title: document.getElementById("editAnnouncementTitle").value.trim(),
        content: document.getElementById("editAnnouncementContent").value.trim(),
        type: document.getElementById("editAnnouncementType").value,
        expiryDate: document.getElementById("editAnnouncementExpiry").value || null,
      }

      if (currentAnnouncementId && announcementData.title && announcementData.content) {
        updateAnnouncement(currentAnnouncementId, announcementData)
        announcementModal.style.display = "none"
      } else {
        showMessage("Please fill in all required fields", "error")
      }
    })
  }

  // Delete announcement from modal
  if (deleteAnnouncementBtn) {
    deleteAnnouncementBtn.addEventListener("click", () => {
      if (currentAnnouncementId) {
        deleteAnnouncement(currentAnnouncementId)
        announcementModal.style.display = "none"
      }
    })
  }

  // Hero announcement edit form submission
  const editHeroAnnouncementForm = document.getElementById("editHeroAnnouncementForm")
  if (editHeroAnnouncementForm) {
    editHeroAnnouncementForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const announcementData = {
        title: document.getElementById("editHeroAnnouncementTitle").value.trim(),
        content: document.getElementById("editHeroAnnouncementContent").value.trim(),
        type: document.getElementById("editHeroAnnouncementType").value,
        expiryDate: document.getElementById("editHeroAnnouncementExpiry").value || null,
      }

      if (currentAnnouncementId && announcementData.title && announcementData.content) {
        updateHeroAnnouncement(currentAnnouncementId, announcementData)
        const heroAnnouncementModal = document.getElementById("heroAnnouncementModal")
        if (heroAnnouncementModal) {
          heroAnnouncementModal.style.display = "none"
        }
      } else {
        showMessage("Please fill in all required fields", "error")
      }
    })
  }

  // Delete hero announcement from modal
  const deleteHeroAnnouncementBtn = document.getElementById("deleteHeroAnnouncementBtn")
  if (deleteHeroAnnouncementBtn) {
    deleteHeroAnnouncementBtn.addEventListener("click", () => {
      if (currentAnnouncementId) {
        deleteHeroAnnouncement(currentAnnouncementId)
        const heroAnnouncementModal = document.getElementById("heroAnnouncementModal")
        if (heroAnnouncementModal) {
          heroAnnouncementModal.style.display = "none"
        }
      }
    })
  }

  // Gallery upload form submission
  if (galleryUploadForm) {
    galleryUploadForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const title = document.getElementById("galleryTitle").value.trim()
      const description = document.getElementById("galleryDescription").value.trim()
      const imageFile = document.getElementById("galleryImage").files[0]

      if (title && description && imageFile) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const galleryData = JSON.parse(localStorage.getItem("galleryData")) || []
          const newItem = {
            id: Date.now(),
            title,
            description,
            image: e.target.result,
            updatedDate: new Date().toISOString(),
          }

          galleryData.push(newItem)
          localStorage.setItem("galleryData", JSON.stringify(galleryData))
          loadGallery()

          // Trigger update on main site
          window.dispatchEvent(new Event("galleryUpdated"))

          galleryUploadForm.reset()
          showMessage("Image uploaded successfully", "success")
        }
        reader.readAsDataURL(imageFile)
      } else {
        showMessage("Please fill in all fields and select an image", "error")
      }
    })
  }

  // Payment settings form submission
  if (paymentSettingsForm) {
    paymentSettingsForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const settings = {
        registrationFee: Number.parseFloat(document.getElementById("registrationFeeAmount").value) || 5000,
        earlyChildhoodCarePrice: Number.parseFloat(document.getElementById("earlyChildhoodCarePrice").value) || 150,
        foundationProgramPrice: Number.parseFloat(document.getElementById("foundationProgramPrice").value) || 120,
        primaryPreparationPrice: Number.parseFloat(document.getElementById("primaryPreparationPrice").value) || 100,
      }

      localStorage.setItem("paymentSettings", JSON.stringify(settings))
      
      // Trigger update on main site
      window.dispatchEvent(new Event("paymentSettingsUpdated"))
      
      showMessage("Payment settings updated successfully", "success")
    })
  }

  // Admin login form
  const adminLoginForm = document.getElementById("adminLoginForm")
  const loginForm = document.getElementById("loginForm")
  const adminPanel = document.getElementById("adminPanel")
  const logoutBtn = document.getElementById("logoutBtn")

  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const email = document.getElementById("email").value.trim()
      const password = document.getElementById("password").value
      const rememberMe = document.getElementById("rememberMe").checked

      // Show loading state
      const loginBtn = adminLoginForm.querySelector('button[type="submit"]')
      const originalText = loginBtn.textContent
      loginBtn.textContent = "Logging in..."
      loginBtn.disabled = true

      try {
        let loginSuccess = false

        // Try Firebase authentication first
        if (typeof firebaseManager !== 'undefined') {
          try {
            console.log('Attempting Firebase login...')
            const loginResult = await firebaseManager.adminLogin(email, password)
            
            if (loginResult.success) {
              console.log('Firebase login successful:', loginResult)
              loginSuccess = true
            } else {
              console.error('Firebase login failed:', loginResult.error)
            }
          } catch (firebaseError) {
            console.error('Firebase login error:', firebaseError)
          }
        }

        // Fallback to default credentials if Firebase fails
        if (!loginSuccess) {
          console.log('Falling back to default credentials...')
          if (email === "cupicsart@gmail.com" && password === "889543701@") {
            loginSuccess = true
          }
        }

        if (loginSuccess) {
          // Save login state
          sessionStorage.setItem("adminLoggedIn", "true")

          if (rememberMe) {
            localStorage.setItem("rememberAdmin", "true")
            localStorage.setItem("adminEmail", email)
            // Don't store password in localStorage for security
          } else {
            localStorage.removeItem("rememberAdmin")
            localStorage.removeItem("adminEmail")
            localStorage.removeItem("adminPassword")
          }

          // Show admin panel
          loginForm.style.display = "none"
          adminPanel.style.display = "block"

          // Load initial data
          loadRegistrations()
          loadAnnouncements()
          renderAdminAnnouncements()
          renderAdminHeroAnnouncements()
          loadGallery()
          loadUserUploads()
          loadPayments()
          loadPaymentSettings()

          showMessage("Login successful", "success")
        } else {
          showMessage("Invalid email or password", "error")
        }
      } catch (error) {
        console.error('Login error:', error)
        showMessage("Login failed. Please try again.", "error")
      } finally {
        // Reset button state
        loginBtn.textContent = originalText
        loginBtn.disabled = false
      }
    })
  }

  // Logout functionality
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        // Try Firebase logout first
        if (typeof firebaseManager !== 'undefined') {
          try {
            await firebaseManager.adminLogout()
            console.log('Firebase logout successful')
          } catch (firebaseError) {
            console.error('Firebase logout error:', firebaseError)
          }
        }

        // Clear session and localStorage
        sessionStorage.removeItem("adminLoggedIn")
        if (!rememberMeCheckbox?.checked) {
          localStorage.removeItem("rememberAdmin")
          localStorage.removeItem("adminEmail")
          localStorage.removeItem("adminPassword")
        }

        loginForm.style.display = "flex"
        adminPanel.style.display = "none"
        showMessage("Logged out successfully", "success")
      } catch (error) {
        console.error('Logout error:', error)
        showMessage("Logout failed", "error")
      }
    })
  }

  // Check if already logged in
  if (sessionStorage.getItem("adminLoggedIn") === "true") {
    loginForm.style.display = "none"
    adminPanel.style.display = "block"

    // Load initial data
    loadRegistrations()
    loadAnnouncements()
    renderAdminAnnouncements()
    renderAdminHeroAnnouncements()
    loadGallery()
    loadUserUploads()
    loadPayments()
    loadPaymentSettings()
    loadAnalytics()
    
    // Check for new registrations and show notifications
    checkForNewRegistrations()
  } else {
    // Check if trying to access sensitive sections directly via URL
    const hash = window.location.hash.substring(1)
    const sensitiveSections = ["registrations", "payments", "analytics"]
    
    if (sensitiveSections.includes(hash)) {
      showMessage("Please log in to access this section", "error")
      // Redirect to login
      window.location.hash = ""
    }
  }

  // Check for new registrations and show notifications
  function checkForNewRegistrations() {
    const notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]')
    const unreadNotifications = notifications.filter(n => !n.read && n.type === 'registration')
    
    if (unreadNotifications.length > 0) {
      showAdminNotifications(unreadNotifications)
    }
  }

  // Show admin notifications
  function showAdminNotifications(notifications) {
    notifications.forEach(notification => {
      const notificationElement = document.createElement('div')
      notificationElement.className = 'admin-notification'
      notificationElement.innerHTML = `
        <div class="notification-header">
          <h3>🚨 New Registration!</h3>
          <button onclick="this.parentElement.parentElement.remove()" class="close-notification">×</button>
        </div>
        <div class="notification-content">
          <p><strong>${notification.data.parentName}</strong> registered <strong>${notification.data.childName}</strong> for <strong>${notification.data.program}</strong></p>
          <p>Phone: ${notification.data.phone} | Email: ${notification.data.email}</p>
          <div class="notification-actions">
            <a href="#registrations" class="btn btn-primary" onclick="loadRegistrations()">View Registration</a>
            <a href="https://wa.me/265992260985?text=${encodeURIComponent(formatWhatsAppMessage(notification.data))}" class="btn btn-success" target="_blank">WhatsApp</a>
          </div>
        </div>
      `
      
      document.body.appendChild(notificationElement)
      
      // Auto-remove after 30 seconds
      setTimeout(() => {
        if (notificationElement.parentNode) {
          notificationElement.remove()
        }
      }, 30000)
    })
    
    // Mark notifications as read
    const allNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]')
    allNotifications.forEach(n => {
      if (n.type === 'registration') {
        n.read = true
      }
    })
    localStorage.setItem('adminNotifications', JSON.stringify(allNotifications))
  }

  // Format WhatsApp message for admin notifications
  function formatWhatsAppMessage(data) {
    return (
      `*New Registration for MIRACLE ECD*\n\n` +
      `*Registration ID:* ${data.id}\n` +
      `*Parent/Guardian Name:* ${data.parentName}\n` +
      `*Email:* ${data.email}\n` +
      `*Phone:* ${data.phone}\n` +
      `*Child's Name:* ${data.childName}\n` +
      `*Child's Age:* ${data.childAge} years\n` +
      `*Preferred Start Date:* ${data.startDate}\n` +
      `*Program Type:* ${data.program}\n` +
      `*Additional Information:* ${data.message || "None"}\n` +
      `*Registration Date:* ${new Date(data.registrationDate).toLocaleString()}\n` +
      `*Payment Status:* PENDING\n\n` +
      `Please contact this family to arrange payment.`
    )
  }

  // Navigation functionality with security checks
  const navLinks = document.querySelectorAll(".nav-link")
  const adminSections = document.querySelectorAll(".admin-section")

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()

      // Check if user is logged in for sensitive sections
      const isLoggedIn = sessionStorage.getItem("adminLoggedIn") === "true"
      const sensitiveSections = ["registrations", "payments", "analytics"]
      
      if (sensitiveSections.includes(link.dataset.section) && !isLoggedIn) {
        showMessage("Please log in to access this section", "error")
        return
      }

      // Remove active class from all links and sections
      navLinks.forEach((l) => l.classList.remove("active"))
      adminSections.forEach((s) => s.classList.remove("active"))

      // Add active class to clicked link
      link.classList.add("active")

      // Show corresponding section
      const sectionId = link.dataset.section + "-section"
      const section = document.getElementById(sectionId)
      if (section) {
        section.classList.add("active")

        // Load data for the section
        switch (link.dataset.section) {
          case "analytics":
            if (isLoggedIn) {
              loadAnalytics()
            } else {
              section.innerHTML = '<div class="login-required"><h3>Login Required</h3><p>Please log in to view analytics.</p></div>'
            }
            break
          case "registrations":
            if (isLoggedIn) {
              loadRegistrations()
            } else {
              section.innerHTML = '<div class="login-required"><h3>Login Required</h3><p>Please log in to view registrations.</p></div>'
            }
            break
          case "blog-admin-section":
            renderAdminBlogPosts()
            break
          case "announcements-admin":
            loadAnnouncements()
            renderAdminAnnouncements()
            break
          case "hero-announcements-admin":
            renderAdminHeroAnnouncements()
            break
          case "gallery-admin":
            loadGallery()
            break
          case "user-uploads-admin":
            loadUserUploads()
            break
          case "payments":
            if (isLoggedIn) {
              loadPayments()
              loadPaymentSettings()
            } else {
              section.innerHTML = '<div class="login-required"><h3>Login Required</h3><p>Please log in to view payments.</p></div>'
            }
            break
          case "map":
            // Map will be initialized by map.js
            break
        }
      }
    })
  })

  // Mobile navigation toggle
  const adminHamburger = document.querySelector(".admin-hamburger")
  const adminNav = document.querySelector(".admin-nav")
  const adminNavBackdrop = document.querySelector(".admin-nav-backdrop")
  const adminControls = document.querySelector(".admin-controls")
  const adminHeaderTitle = document.querySelector(".admin-header h1")

  if (adminHamburger && adminNav) {
    // Add touch support for mobile devices
    const toggleMenu = () => {
      adminNav.classList.toggle("active")
      adminHamburger.classList.toggle("active")
      if (adminNavBackdrop) {
        if (adminNav.classList.contains("active")) {
          adminNavBackdrop.style.display = "block"
          if (window.innerWidth <= 768 && adminControls) adminControls.style.display = "none"
          if (window.innerWidth <= 768 && adminHeaderTitle) adminHeaderTitle.style.display = "none"
        } else {
          adminNavBackdrop.style.display = "none"
          if (window.innerWidth <= 768 && adminControls) adminControls.style.display = "flex"
          if (window.innerWidth <= 768 && adminHeaderTitle) adminHeaderTitle.style.display = "block"
        }
      }
      // Prevent body scroll when menu is open on mobile
      if (window.innerWidth <= 768) {
        if (adminNav.classList.contains("active")) {
          document.body.style.overflow = "hidden"
        } else {
          document.body.style.overflow = ""
        }
      }
    }

    // Click event
    adminHamburger.addEventListener("click", toggleMenu)
    
    // Touch events for better mobile support
    adminHamburger.addEventListener("touchstart", (e) => {
      e.preventDefault()
      toggleMenu()
    })

    // Close mobile menu when clicking on a nav link
    const navLinks = document.querySelectorAll(".admin-nav a")
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          adminNav.classList.remove("active")
          adminHamburger.classList.remove("active")
          if (adminNavBackdrop) adminNavBackdrop.style.display = "none"
          if (adminControls) adminControls.style.display = "flex"
          if (adminHeaderTitle) adminHeaderTitle.style.display = "block"
          document.body.style.overflow = ""
        }
      })
    })

    // Close mobile menu when clicking outside
    document.addEventListener("click", (event) => {
      const isClickInside = adminHamburger.contains(event.target) || adminNav.contains(event.target)
      if (adminNavBackdrop && event.target === adminNavBackdrop) {
        adminNav.classList.remove("active")
        adminHamburger.classList.remove("active")
        adminNavBackdrop.style.display = "none"
        if (adminControls) adminControls.style.display = "flex"
        if (adminHeaderTitle) adminHeaderTitle.style.display = "block"
        document.body.style.overflow = ""
        return
      }
      if (!isClickInside && adminNav.classList.contains("active")) {
        adminNav.classList.remove("active")
        adminHamburger.classList.remove("active")
        if (adminNavBackdrop) adminNavBackdrop.style.display = "none"
        if (adminControls) adminControls.style.display = "flex"
        if (adminHeaderTitle) adminHeaderTitle.style.display = "block"
        document.body.style.overflow = ""
      }
    })

    // Close mobile menu on window resize
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        adminNav.classList.remove("active")
        adminHamburger.classList.remove("active")
        if (adminNavBackdrop) adminNavBackdrop.style.display = "none"
        if (adminControls) adminControls.style.display = "flex"
        if (adminHeaderTitle) adminHeaderTitle.style.display = "block"
        document.body.style.overflow = ""
      }
    })

    // Add keyboard support for accessibility
    adminHamburger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        toggleMenu()
      }
    })
  }

  // Back to top button
  const backToTopBtn = document.getElementById("backToTop")
  if (backToTopBtn) {
    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        backToTopBtn.classList.add("visible")
      } else {
        backToTopBtn.classList.remove("visible")
      }
    })

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    })
  }

  // Global function for viewing payment details
  window.viewPaymentDetails = (paymentId) => {
    const payments = JSON.parse(localStorage.getItem("payments")) || []
    const payment = payments.find((p) => p.id === paymentId)

    if (payment) {
      alert(`Payment Details:
ID: ${payment.id}
Registration ID: ${payment.registrationId}
Parent: ${payment.parentName}
Amount: MWK${payment.amount}
Date: ${new Date(payment.paymentDate).toLocaleString()}
Status: ${payment.status}
Method: ${payment.paymentMethod || "Card"}`)
    }
  }

  // Blog post form submission
  if (blogPostForm) {
    blogPostForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const title = document.getElementById("blogTitle").value.trim()
      const category = document.getElementById("blogCategory").value
      const content = document.getElementById("blogContent").value.trim()
      const summary = document.getElementById("blogSummary").value.trim()
      const imageFile = document.getElementById("blogImage").files[0]
      const publicationDate = document.getElementById("blogDate").value
      const publicationTime = document.getElementById("blogTime").value

      if (!title || !category || !content || !publicationDate || !publicationTime) {
        showMessage("Please fill in all required fields", "error")
        return
      }

      if (content.length < 50) {
        showMessage("Blog content should be at least 50 characters long", "error")
        return
      }

      try {
        let imageData = null
        if (imageFile) {
          imageData = await toBase64(imageFile)
        }

        // Combine date and time into a single datetime
        const publicationDateTime = new Date(`${publicationDate}T${publicationTime}`).toISOString()
        
        const blogPost = {
          id: Date.now(),
          title,
          category,
          content,
          summary: summary || content.substring(0, 120) + (content.length > 120 ? '...' : ''),
          image: imageData || "/placeholder.svg?height=250&width=400",
          createdDate: publicationDateTime,
          likes: 0,
          comments: [],
          views: 0
        }

        const blogPosts = JSON.parse(localStorage.getItem("blogPosts")) || []
        blogPosts.unshift(blogPost) // Add to beginning of array
        localStorage.setItem("blogPosts", JSON.stringify(blogPosts))

        // Reset form
        blogPostForm.reset()
        document.getElementById("charCount").textContent = "0"
        showMessage("Blog post published successfully! It will appear on the main website.", "success")

        // Reload blog posts
        renderAdminBlogPosts()
        
        // Dispatch event to notify main page
        window.dispatchEvent(new CustomEvent('blogPostsUpdated'))
      } catch (error) {
        console.error("Error creating blog post:", error)
        showMessage("Error creating blog post", "error")
      }
    })

    // Character count for blog content
    const blogContent = document.getElementById("blogContent")
    const charCount = document.getElementById("charCount")
    if (blogContent && charCount) {
      blogContent.addEventListener("input", () => {
        charCount.textContent = blogContent.value.length
      })
    }

    // Preview button functionality
    const previewBtn = document.getElementById("previewBtn")
    if (previewBtn) {
      previewBtn.addEventListener("click", () => {
        const title = document.getElementById("blogTitle").value.trim()
        const category = document.getElementById("blogCategory").value
        const content = document.getElementById("blogContent").value.trim()
        const summary = document.getElementById("blogSummary").value.trim()

        if (!title || !category || !content) {
          showMessage("Please fill in all required fields to preview", "error")
          return
        }

        const previewContent = `
Title: ${title}
Category: ${category}
Summary: ${summary || content.substring(0, 120) + '...'}
Content: ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}
        `
        alert("Blog Post Preview:\n\n" + previewContent)
      })
    }
  }

  // Plog post form submission
  if (plogPostForm) {
    plogPostForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      const title = document.getElementById("plogTitle").value.trim()
      const content = document.getElementById("plogContent").value.trim()
      const imageInput = document.getElementById("plogImage")
      let imageUrl = ""
      if (imageInput && imageInput.files && imageInput.files[0]) {
        imageUrl = await toBase64(imageInput.files[0])
      }
      const plogPosts = JSON.parse(localStorage.getItem("plogPosts")) || []
      const newPost = {
        id: Date.now(),
        title,
        content,
        image: imageUrl,
        date: new Date().toISOString(),
        likes: 0,
        comments: []
      }
      plogPosts.unshift(newPost)
      localStorage.setItem("plogPosts", JSON.stringify(plogPosts))
      plogPostForm.reset()
      renderAdminPlogPosts()
      // Also update blogPosts for homepage
      const blogPosts = JSON.parse(localStorage.getItem("blogPosts")) || []
      blogPosts.unshift(newPost)
      localStorage.setItem("blogPosts", JSON.stringify(blogPosts))
    })
  }

  function renderAdminPlogPosts() {
    if (!adminPlogPostsContainer) return
    const plogPosts = JSON.parse(localStorage.getItem("plogPosts")) || []
    if (plogPosts.length === 0) {
      adminPlogPostsContainer.innerHTML = '<p>No plog posts yet.</p>'
      return
    }
    adminPlogPostsContainer.innerHTML = plogPosts.map(post => `
      <div class="admin-plog-post">
        ${post.image ? `<img src="${post.image}" alt="${escapeHtml(post.title)}" class="admin-plog-image">` : ''}
        <h4>${escapeHtml(post.title)}</h4>
        <div class="admin-plog-date">${new Date(post.createdDate).toLocaleDateString()}</div>
        <p>${escapeHtml(post.content).slice(0, 120)}${post.content.length > 120 ? '...' : ''}</p>
        <div class="admin-plog-post-actions">
          <button class="edit-plog-post-btn" data-id="${post.id}"><i class="fas fa-edit"></i> Edit</button>
          <button class="delete-plog-post-btn" data-id="${post.id}"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
    `).join('')

    // Add event listeners for edit/delete
    document.querySelectorAll('.edit-plog-post-btn').forEach(btn => {
      btn.addEventListener('click', () => editPlogPost(btn.dataset.id))
    })
    document.querySelectorAll('.delete-plog-post-btn').forEach(btn => {
      btn.addEventListener('click', () => deletePlogPost(btn.dataset.id))
    })
  }

  function renderAdminBlogPosts() {
    if (!adminBlogPostsContainer) return
    const blogPosts = JSON.parse(localStorage.getItem("blogPosts")) || []
    if (blogPosts.length === 0) {
      adminBlogPostsContainer.innerHTML = '<p class="no-posts">No blog posts yet. Create your first blog post using the form above!</p>'
      return
    }
    adminBlogPostsContainer.innerHTML = blogPosts.map(post => `
      <div class="admin-blog-post">
        <div class="admin-blog-post-header">
          <h4 class="admin-blog-post-title">${escapeHtml(post.title)}</h4>
          <div class="admin-blog-post-actions">
            <button class="edit-blog-post-btn" data-id="${post.id}"><i class="fas fa-edit"></i> Edit</button>
            <button class="delete-blog-post-btn" data-id="${post.id}"><i class="fas fa-trash"></i> Delete</button>
          </div>
        </div>
        <div class="admin-blog-post-meta">
          <span class="admin-blog-post-category">${escapeHtml(post.category || 'Uncategorized')}</span>
          <span class="admin-blog-post-date">${new Date(post.createdDate).toLocaleDateString()}</span>
        </div>
        <div class="admin-blog-post-content">
          ${escapeHtml(post.summary || post.content.substring(0, 150))}${post.content.length > 150 ? '...' : ''}
        </div>
        <div class="admin-blog-post-stats">
          <span><i class="fas fa-eye"></i> ${post.views || 0} views</span>
          <span><i class="fas fa-heart"></i> ${post.likes || 0} likes</span>
          <span><i class="fas fa-comment"></i> ${post.comments ? post.comments.length : 0} comments</span>
        </div>
      </div>
    `).join('')

    // Add event listeners for edit/delete
    document.querySelectorAll('.edit-blog-post-btn').forEach(btn => {
      btn.addEventListener('click', () => editBlogPost(btn.dataset.id))
    })
    document.querySelectorAll('.delete-blog-post-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteBlogPost(btn.dataset.id))
    })
  }

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  renderAdminPlogPosts()
  
  // Analytics Functions
  function loadAnalytics() {
    const registrations = JSON.parse(localStorage.getItem("daycareRegistrations")) || []
    const payments = JSON.parse(localStorage.getItem("payments")) || []
    const paymentSettings = JSON.parse(localStorage.getItem("paymentSettings")) || {}
    
    updateSummaryCards(registrations, payments, paymentSettings)
    updateAgeDistribution(registrations)
    updateGenderDistribution(registrations)
    updateProgramDistribution(registrations)
    updatePaymentStatus(registrations)
    updateFinancialSummary(registrations, payments, paymentSettings)
    updateRecentRegistrations(registrations)
  }

  function updateSummaryCards(registrations, payments, paymentSettings) {
    // Total students
    document.getElementById("totalStudents").textContent = registrations.length
    
    // Program counts
    const infantCount = registrations.filter(r => r.program === "Early Childhood Care (0-5 years)").length
    const toddlerCount = registrations.filter(r => r.program === "Foundation Program (5-7 years)").length
    const preschoolCount = registrations.filter(r => r.program === "Primary Preparation (7-12 years)").length
    
    document.getElementById("infantCount").textContent = infantCount
    document.getElementById("toddlerCount").textContent = toddlerCount
    document.getElementById("preschoolCount").textContent = preschoolCount
    
    // Total revenue - only count actual completed payments
    const totalRevenue = payments
      .filter(payment => payment.status === "completed" || payment.paymentStatus === "Paid")
      .reduce((sum, payment) => sum + (payment.amount || 0), 0)
    document.getElementById("totalRevenue").textContent = `MWK ${totalRevenue.toLocaleString()}`
    
    // Pending payments
    const pendingPayments = registrations.filter(r => r.paymentStatus === "Pending" || r.paymentStatus === "Payment Required").length
    document.getElementById("pendingPayments").textContent = pendingPayments
  }

  function updateAgeDistribution(registrations) {
    const ageChart = document.getElementById("ageChart")
    if (!ageChart) return
    
    const ageGroups = {
      "0-5 years": 0,
      "5-7 years": 0,
      "7-12 years": 0
    }
    
    registrations.forEach(reg => {
      const age = reg.childAge || 0
      if (age <= 5) ageGroups["0-5 years"]++
      else if (age <= 7) ageGroups["5-7 years"]++
      else if (age <= 12) ageGroups["7-12 years"]++
    })
    
    ageChart.innerHTML = Object.entries(ageGroups)
      .filter(([_, count]) => count > 0)
      .map(([age, count]) => `
        <div class="chart-item">
          <span class="chart-label">${age}</span>
          <span class="chart-value">${count} students</span>
        </div>
      `).join("")
  }

  function updateGenderDistribution(registrations) {
    const genderChart = document.getElementById("genderChart")
    if (!genderChart) return
    
    const genderCounts = {
      "Male": 0,
      "Female": 0,
      "Not Specified": 0
    }
    
    registrations.forEach(reg => {
      const gender = reg.childGender || "Not Specified"
      genderCounts[gender] = (genderCounts[gender] || 0) + 1
    })
    
    genderChart.innerHTML = Object.entries(genderCounts)
      .filter(([_, count]) => count > 0)
      .map(([gender, count]) => `
        <div class="chart-item">
          <span class="chart-label">${gender}</span>
          <span class="chart-value">${count} students</span>
        </div>
      `).join("")
  }

  function updateProgramDistribution(registrations) {
    const programChart = document.getElementById("programChart")
    if (!programChart) return
    
    const programCounts = {}
    registrations.forEach(reg => {
      const program = reg.program || "Unknown"
      programCounts[program] = (programCounts[program] || 0) + 1
    })
    
    programChart.innerHTML = Object.entries(programCounts)
      .map(([program, count]) => `
        <div class="chart-item">
          <span class="chart-label">${program}</span>
          <span class="chart-value">${count} students</span>
        </div>
      `).join("")
  }

  function updatePaymentStatus(registrations) {
    const paymentChart = document.getElementById("paymentChart")
    if (!paymentChart) return
    
    const statusCounts = {
      "Paid": 0,
      "Pending": 0,
      "Payment Required": 0
    }
    
    registrations.forEach(reg => {
      const status = reg.paymentStatus || "Pending"
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })
    
    paymentChart.innerHTML = Object.entries(statusCounts)
      .map(([status, count]) => `
        <div class="chart-item">
          <span class="chart-label">${status}</span>
          <span class="chart-value">${count} students</span>
        </div>
      `).join("")
  }

  function updateFinancialSummary(registrations, payments, paymentSettings) {
    // Total registration fees - only count actual completed payments
    const totalRegistrationFees = payments
      .filter(payment => payment.status === "completed" || payment.paymentStatus === "Paid")
      .reduce((sum, payment) => sum + (payment.amount || 0), 0)
    document.getElementById("totalRegistrationFees").textContent = `MWK ${totalRegistrationFees.toLocaleString()}`
    
    // Calculate monthly fees based on program - only for paid registrations
    let totalMonthlyFees = 0
    registrations
      .filter(reg => reg.paymentStatus === "Paid")
      .forEach(reg => {
        switch(reg.program) {
          case "Early Childhood Care (0-5 years)":
            totalMonthlyFees += paymentSettings.earlyChildhoodCarePrice || 150
            break
          case "Foundation Program (5-7 years)":
            totalMonthlyFees += paymentSettings.foundationProgramPrice || 120
            break
          case "Primary Preparation (7-12 years)":
            totalMonthlyFees += paymentSettings.primaryPreparationPrice || 100
            break
        }
      })
    document.getElementById("totalMonthlyFees").textContent = `MWK ${totalMonthlyFees.toLocaleString()}`
    
    // Outstanding balances (students with pending payments)
    const outstandingBalances = registrations
      .filter(reg => reg.paymentStatus === "Pending" || reg.paymentStatus === "Payment Required")
              .length * (paymentSettings.registrationFee || 5000)
    document.getElementById("outstandingBalances").textContent = `MWK ${outstandingBalances.toLocaleString()}`
    
    // Average monthly revenue (simple calculation) - only for paid registrations
    const paidRegistrations = registrations.filter(reg => reg.paymentStatus === "Paid").length
    const avgMonthlyRevenue = paidRegistrations > 0 ? totalRegistrationFees / paidRegistrations : 0
    document.getElementById("avgMonthlyRevenue").textContent = `MWK ${Math.round(avgMonthlyRevenue).toLocaleString()}`
  }

  function updateRecentRegistrations(registrations) {
    const recentContainer = document.getElementById("recentRegistrations")
    if (!recentContainer) return
    
    const recentRegistrations = registrations
      .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))
      .slice(0, 10)
    
    if (recentRegistrations.length === 0) {
      recentContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No registrations found</p>'
      return
    }
    
    recentContainer.innerHTML = recentRegistrations.map(reg => `
      <div class="recent-registration-item">
        <div class="recent-registration-info">
          <div class="recent-registration-name">${escapeHtml(reg.childName)}</div>
          <div class="recent-registration-details">
            Parent: ${escapeHtml(reg.parentName)} | Age: ${reg.childAge || 'N/A'} | Program: ${escapeHtml(reg.program)}
          </div>
        </div>
        <span class="recent-registration-status ${(reg.paymentStatus || 'pending').toLowerCase().replace(' ', '-')}">
          ${reg.paymentStatus || 'Pending'}
        </span>
      </div>
    `).join("")
  }

  // Database Management Functions
  let currentStudentId = null

  // Initialize database data
  if (!localStorage.getItem("studentDatabase")) {
    localStorage.setItem("studentDatabase", JSON.stringify([]))
  }

  // Database elements
  const addStudentBtn = document.getElementById("addStudentBtn")
  const studentModal = document.getElementById("studentModal")
  const studentForm = document.getElementById("studentForm")
  const studentModalTitle = document.getElementById("studentModalTitle")
  const cancelStudentBtn = document.getElementById("cancelStudentBtn")
  const databaseTableBody = document.getElementById("databaseTableBody")
  const studentSearchInput = document.getElementById("studentSearchInput")
  const classFilter = document.getElementById("classFilter")

  // Load database when page loads
  loadStudentDatabase()

  // Add student button event
  if (addStudentBtn) {
    addStudentBtn.addEventListener("click", () => {
      openStudentModal()
    })
  }

  // Student modal events
  if (studentModal) {
    const closeModal = studentModal.querySelector(".close-modal")
    if (closeModal) {
      closeModal.addEventListener("click", closeStudentModal)
    }
  }

  if (cancelStudentBtn) {
    cancelStudentBtn.addEventListener("click", closeStudentModal)
  }

  // Student form submission
  if (studentForm) {
    studentForm.addEventListener("submit", handleStudentSubmit)
  }

  // Search and filter events
  if (studentSearchInput) {
    studentSearchInput.addEventListener("input", filterStudents)
  }

  if (classFilter) {
    classFilter.addEventListener("change", filterStudents)
  }

  function loadStudentDatabase() {
    try {
      const students = JSON.parse(localStorage.getItem("studentDatabase")) || []
      displayStudents(students)
    } catch (error) {
      console.error("Error loading student database:", error)
      showMessage("Error loading student database", "error")
    }
  }

  function displayStudents(students) {
    if (!databaseTableBody) return

    databaseTableBody.innerHTML = ""

    if (students.length === 0) {
      databaseTableBody.innerHTML = `
        <tr>
          <td colspan="12" style="text-align: center; padding: 2rem; color: #666;">
            No students found. Click "Add New Student" to add the first student.
          </td>
        </tr>
      `
      return
    }

    students.forEach((student) => {
      const average = calculateAverage(student)
      const averageClass = getAverageClass(average)
      const gradeText = getGradeText(average)
      
      const row = document.createElement("tr")
      row.innerHTML = `
        <td>${student.id}</td>
        <td>${escapeHtml(student.firstName)}</td>
        <td>${escapeHtml(student.lastName)}</td>
        <td>${student.age}</td>
        <td>${escapeHtml(student.class)}</td>
        <td><span class="performance-score ${getPerformanceClass(student.mathematics)}">${student.mathematics || 'N/A'}</span></td>
        <td><span class="performance-score ${getPerformanceClass(student.english)}">${student.english || 'N/A'}</span></td>
        <td><span class="performance-score ${getPerformanceClass(student.science)}">${student.science || 'N/A'}</span></td>
        <td><span class="performance-score ${getPerformanceClass(student.socialStudies)}">${student.socialStudies || 'N/A'}</span></td>
        <td><span class="performance-score ${getPerformanceClass(student.artsCrafts)}">${student.artsCrafts || 'N/A'}</span></td>
        <td><span class="performance-score ${getPerformanceClass(student.physicalEducation)}">${student.physicalEducation || 'N/A'}</span></td>
        <td>
          <div class="average-container">
            <span class="average-score ${averageClass}">${average.toFixed(1)}</span>
            <div class="grade-text ${averageClass}">${gradeText}</div>
          </div>
        </td>
        <td>
          <button class="admin-btn view-btn" onclick="editStudent('${student.id}')" style="margin-right: 0.5rem;">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="admin-btn delete-btn" onclick="deleteStudent('${student.id}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </td>
      `
      databaseTableBody.appendChild(row)
    })
  }

  function calculateAverage(student) {
    const scores = [
      student.mathematics,
      student.english,
      student.science,
      student.socialStudies,
      student.artsCrafts,
      student.physicalEducation
    ].filter(score => score !== null && score !== undefined && score !== '')

    if (scores.length === 0) return 0
    return scores.reduce((sum, score) => sum + parseFloat(score), 0) / scores.length
  }

  function getPerformanceClass(score) {
    if (!score || score === 'N/A') return ''
    const numScore = parseFloat(score)
    if (numScore >= 90) return 'performance-excellent'
    if (numScore >= 80) return 'performance-good'
    if (numScore >= 70) return 'performance-average'
    return 'performance-poor'
  }

  function getAverageClass(average) {
    if (average >= 76) return 'average-distinction'
    if (average >= 65) return 'average-credit'
    if (average >= 50) return 'average-pass'
    return 'average-fail'
  }

  function getGradeText(average) {
    if (average >= 76) return 'Distinction'
    if (average >= 65) return 'Credit'
    if (average >= 50) return 'Pass'
    return 'Fail'
  }

  function openStudentModal(studentId = null) {
    currentStudentId = studentId
    
    if (studentId) {
      // Edit mode
      const students = JSON.parse(localStorage.getItem("studentDatabase")) || []
      const student = students.find(s => s.id === studentId)
      
      if (student) {
        studentModalTitle.textContent = "Edit Student"
        fillStudentForm(student)
      }
    } else {
      // Add mode
      studentModalTitle.textContent = "Add New Student"
      clearStudentForm()
    }
    
    studentModal.style.display = "block"
  }

  function closeStudentModal() {
    studentModal.style.display = "none"
    currentStudentId = null
    clearStudentForm()
  }

  function fillStudentForm(student) {
    document.getElementById("studentFirstName").value = student.firstName || ""
    document.getElementById("studentLastName").value = student.lastName || ""
    document.getElementById("studentAge").value = student.age || ""
    document.getElementById("studentClass").value = student.class || ""
    document.getElementById("studentMath").value = student.mathematics || ""
    document.getElementById("studentEnglish").value = student.english || ""
    document.getElementById("studentScience").value = student.science || ""
    document.getElementById("studentSocial").value = student.socialStudies || ""
    document.getElementById("studentArts").value = student.artsCrafts || ""
    document.getElementById("studentPE").value = student.physicalEducation || ""
  }

  function clearStudentForm() {
    studentForm.reset()
  }

  function handleStudentSubmit(e) {
    e.preventDefault()
    
    const formData = new FormData(studentForm)
    const studentData = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      age: parseInt(formData.get("age")),
      class: formData.get("class"),
      mathematics: formData.get("mathematics") ? parseFloat(formData.get("mathematics")) : null,
      english: formData.get("english") ? parseFloat(formData.get("english")) : null,
      science: formData.get("science") ? parseFloat(formData.get("science")) : null,
      socialStudies: formData.get("socialStudies") ? parseFloat(formData.get("socialStudies")) : null,
      artsCrafts: formData.get("artsCrafts") ? parseFloat(formData.get("artsCrafts")) : null,
      physicalEducation: formData.get("physicalEducation") ? parseFloat(formData.get("physicalEducation")) : null
    }

    if (currentStudentId) {
      // Update existing student
      updateStudent(currentStudentId, studentData)
    } else {
      // Add new student
      addStudent(studentData)
    }
  }

  function addStudent(studentData) {
    try {
      const students = JSON.parse(localStorage.getItem("studentDatabase")) || []
      const newStudent = {
        ...studentData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }
      
      students.push(newStudent)
      localStorage.setItem("studentDatabase", JSON.stringify(students))
      
      displayStudents(students)
      closeStudentModal()
      showMessage("Student added successfully!", "success")
    } catch (error) {
      console.error("Error adding student:", error)
      showMessage("Error adding student", "error")
    }
  }

  function updateStudent(studentId, studentData) {
    try {
      const students = JSON.parse(localStorage.getItem("studentDatabase")) || []
      const studentIndex = students.findIndex(s => s.id === studentId)
      
      if (studentIndex !== -1) {
        students[studentIndex] = {
          ...students[studentIndex],
          ...studentData,
          updatedAt: new Date().toISOString()
        }
        
        localStorage.setItem("studentDatabase", JSON.stringify(students))
        displayStudents(students)
        closeStudentModal()
        showMessage("Student updated successfully!", "success")
      } else {
        showMessage("Student not found", "error")
      }
    } catch (error) {
      console.error("Error updating student:", error)
      showMessage("Error updating student", "error")
    }
  }

  function deleteStudent(studentId) {
    if (confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      try {
        const students = JSON.parse(localStorage.getItem("studentDatabase")) || []
        const filteredStudents = students.filter(s => s.id !== studentId)
        
        localStorage.setItem("studentDatabase", JSON.stringify(filteredStudents))
        displayStudents(filteredStudents)
        showMessage("Student deleted successfully!", "success")
      } catch (error) {
        console.error("Error deleting student:", error)
        showMessage("Error deleting student", "error")
      }
    }
  }

  function filterStudents() {
    const searchTerm = studentSearchInput.value.toLowerCase()
    const selectedClass = classFilter.value
    const students = JSON.parse(localStorage.getItem("studentDatabase")) || []
    
    const filteredStudents = students.filter(student => {
      const matchesSearch = !searchTerm || 
        student.firstName.toLowerCase().includes(searchTerm) ||
        student.lastName.toLowerCase().includes(searchTerm) ||
        student.id.includes(searchTerm)
      
      const matchesClass = selectedClass === "all" || student.class === selectedClass
      
      return matchesSearch && matchesClass
    })
    
    displayStudents(filteredStudents)
  }

  // Global functions for onclick handlers
  window.editStudent = function(studentId) {
    openStudentModal(studentId)
  }

  window.deleteStudent = function(studentId) {
    deleteStudent(studentId)
  }

  window.deletePayment = function(paymentId) {
    deletePayment(paymentId)
  }

  // Set default date and time for blog post form
  function setDefaultBlogDateTime() {
    const blogDateInput = document.getElementById("blogDate")
    const blogTimeInput = document.getElementById("blogTime")
    
    if (blogDateInput && blogTimeInput) {
      const now = new Date()
      
      // Set default date to today
      const today = now.toISOString().split('T')[0]
      blogDateInput.value = today
      
      // Set default time to current time
      const currentTime = now.toTimeString().slice(0, 5)
      blogTimeInput.value = currentTime
    }
  }

  // View payment details
  function viewPaymentDetails(paymentId) {
    try {
      const payments = JSON.parse(localStorage.getItem("payments")) || []
      const payment = payments.find(p => p.id == paymentId)
      
      if (!payment) {
        showMessage("Payment record not found", "error")
        return
      }

      const detailsHTML = `
        <div class="payment-details">
          <h3>Payment Details</h3>
          <div class="detail-row">
            <strong>Payment ID:</strong> ${payment.id}
          </div>
          <div class="detail-row">
            <strong>Reference:</strong> ${payment.reference || 'N/A'}
          </div>
          <div class="detail-row">
            <strong>Registration ID:</strong> ${payment.registrationId || 'N/A'}
          </div>
          <div class="detail-row">
            <strong>Parent Name:</strong> ${escapeHtml(payment.parentName)}
          </div>
          <div class="detail-row">
            <strong>Amount:</strong> MWK ${payment.amount}
          </div>
          <div class="detail-row">
            <strong>Payment Method:</strong> ${payment.paymentMethod || 'N/A'}
          </div>
          <div class="detail-row">
            <strong>Status:</strong> <span class="status-badge status-${payment.status.toLowerCase()}">${payment.status}</span>
          </div>
          <div class="detail-row">
            <strong>Payment Date:</strong> ${new Date(payment.paymentDate).toLocaleString()}
          </div>
          ${payment.notes ? `<div class="detail-row"><strong>Notes:</strong> ${escapeHtml(payment.notes)}</div>` : ''}
          ${payment.transactionId ? `<div class="detail-row"><strong>Transaction ID:</strong> ${payment.transactionId}</div>` : ''}
        </div>
      `

      // Create modal for payment details
      const modal = document.createElement('div')
      modal.className = 'modal'
      modal.style.display = 'block'
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
          ${detailsHTML}
          <div class="modal-actions" style="margin-top: 20px;">
            <button class="admin-btn delete-btn" onclick="confirmDeletePayment('${payment.id}', '${payment.reference || payment.id}', '${payment.amount}', '${payment.parentName}'); this.parentElement.parentElement.parentElement.remove();">
              <i class="fas fa-trash"></i> Delete Payment
            </button>
          </div>
        </div>
      `

      document.body.appendChild(modal)

      // Close modal when clicking outside
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          modal.remove()
        }
      })

    } catch (error) {
      console.error("Error viewing payment details:", error)
      showMessage("Error loading payment details", "error")
    }
  }

  // Load and display testimonials in admin panel
  loadAdminTestimonials()
  
  // Add testimonials filter event listeners
  addTestimonialFilters()

  // Testimonials management functions
  function loadAdminTestimonials() {
    try {
      const testimonials = JSON.parse(localStorage.getItem("testimonials")) || []
      displayAdminTestimonials(testimonials)
      updateTestimonialStats(testimonials)
    } catch (error) {
      console.error("Error loading testimonials:", error)
      showMessage("Error loading testimonials", "error")
    }
  }

  function displayAdminTestimonials(testimonials) {
    const container = document.getElementById("adminTestimonialsContainer")
    if (!container) return

    if (testimonials.length === 0) {
      container.innerHTML = `
        <div class="no-testimonials">
          <h3>No Testimonials Found</h3>
          <p>No testimonials have been submitted yet.</p>
        </div>
      `
      return
    }

    container.innerHTML = testimonials.map(testimonial => `
      <div class="testimonial-admin-card ${testimonial.status}" data-id="${testimonial.id}">
        <div class="testimonial-admin-header">
          <div class="testimonial-admin-meta">
            <h4 class="testimonial-admin-title">${escapeHtml(testimonial.parentName)}</h4>
            <p class="testimonial-admin-subtitle">Parent of ${escapeHtml(testimonial.childName)}</p>
            <div class="testimonial-admin-rating">
              ${generateStars(testimonial.rating)}
              <span class="rating-text">${testimonial.rating}/5</span>
            </div>
          </div>
          <div class="testimonial-admin-status">
            <span class="status-badge status-${testimonial.status}">${testimonial.status}</span>
            <span class="testimonial-date">${new Date(testimonial.submittedDate).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="testimonial-admin-content">
          <p>${escapeHtml(testimonial.content)}</p>
        </div>
        <div class="testimonial-admin-footer">
          <div class="testimonial-admin-contact">
            <span><i class="fas fa-envelope"></i> ${escapeHtml(testimonial.parentEmail)}</span>
          </div>
          <div class="testimonial-admin-actions">
            ${testimonial.status === 'pending' ? `
              <button class="admin-btn approve-btn" onclick="approveTestimonial(${testimonial.id})">
                <i class="fas fa-check"></i> Approve
              </button>
              <button class="admin-btn reject-btn" onclick="rejectTestimonial(${testimonial.id})">
                <i class="fas fa-times"></i> Reject
              </button>
            ` : ''}
            <button class="admin-btn delete-btn" onclick="deleteTestimonial(${testimonial.id})">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `).join('')
  }

  function generateStars(rating) {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)
    
    let starsHTML = ''
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      starsHTML += '<i class="fas fa-star"></i>'
    }
    
    // Half star
    if (hasHalfStar) {
      starsHTML += '<i class="fas fa-star-half-alt"></i>'
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      starsHTML += '<i class="far fa-star"></i>'
    }
    
    return starsHTML
  }

  function updateTestimonialStats(testimonials) {
    const totalTestimonials = testimonials.length
    const pendingTestimonials = testimonials.filter(t => t.status === 'pending').length
    const approvedTestimonials = testimonials.filter(t => t.status === 'approved').length
    const averageRating = testimonials.length > 0 
      ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
      : '0.0'

    document.getElementById("totalTestimonials").textContent = totalTestimonials
    document.getElementById("pendingTestimonials").textContent = pendingTestimonials
    document.getElementById("approvedTestimonials").textContent = approvedTestimonials
    document.getElementById("averageRating").textContent = averageRating
  }

  function approveTestimonial(testimonialId) {
    if (confirm("Are you sure you want to approve this testimonial? It will be visible on the website.")) {
      try {
        const testimonials = JSON.parse(localStorage.getItem("testimonials")) || []
        const testimonial = testimonials.find(t => t.id === testimonialId)
        
        if (testimonial) {
          testimonial.status = 'approved'
          testimonial.approvedDate = new Date().toISOString()
          localStorage.setItem("testimonials", JSON.stringify(testimonials))
          
          loadAdminTestimonials()
          showMessage("Testimonial approved successfully", "success")
        }
      } catch (error) {
        console.error("Error approving testimonial:", error)
        showMessage("Error approving testimonial", "error")
      }
    }
  }

  function rejectTestimonial(testimonialId) {
    if (confirm("Are you sure you want to reject this testimonial? It will not be visible on the website.")) {
      try {
        const testimonials = JSON.parse(localStorage.getItem("testimonials")) || []
        const testimonial = testimonials.find(t => t.id === testimonialId)
        
        if (testimonial) {
          testimonial.status = 'rejected'
          testimonial.rejectedDate = new Date().toISOString()
          localStorage.setItem("testimonials", JSON.stringify(testimonials))
          
          loadAdminTestimonials()
          showMessage("Testimonial rejected successfully", "success")
        }
      } catch (error) {
        console.error("Error rejecting testimonial:", error)
        showMessage("Error rejecting testimonial", "error")
      }
    }
  }

  function deleteTestimonial(testimonialId) {
    if (confirm("Are you sure you want to delete this testimonial? This action cannot be undone.")) {
      try {
        const testimonials = JSON.parse(localStorage.getItem("testimonials")) || []
        const filteredTestimonials = testimonials.filter(t => t.id !== testimonialId)
        localStorage.setItem("testimonials", JSON.stringify(filteredTestimonials))
        
        loadAdminTestimonials()
        showMessage("Testimonial deleted successfully", "success")
      } catch (error) {
        console.error("Error deleting testimonial:", error)
        showMessage("Error deleting testimonial", "error")
      }
    }
  }

  function addTestimonialFilters() {
    const statusFilter = document.getElementById("testimonialStatusFilter")
    const ratingFilter = document.getElementById("testimonialRatingFilter")
    const searchInput = document.getElementById("testimonialSearchInput")

    if (statusFilter) {
      statusFilter.addEventListener("change", filterTestimonials)
    }
    if (ratingFilter) {
      ratingFilter.addEventListener("change", filterTestimonials)
    }
    if (searchInput) {
      searchInput.addEventListener("input", filterTestimonials)
    }
  }

  function filterTestimonials() {
    const statusFilter = document.getElementById("testimonialStatusFilter")?.value || "all"
    const ratingFilter = document.getElementById("testimonialRatingFilter")?.value || "all"
    const searchInput = document.getElementById("testimonialSearchInput")?.value || ""

    try {
      const testimonials = JSON.parse(localStorage.getItem("testimonials")) || []
      let filteredTestimonials = testimonials

      // Filter by status
      if (statusFilter !== "all") {
        filteredTestimonials = filteredTestimonials.filter(t => t.status === statusFilter)
      }

      // Filter by rating
      if (ratingFilter !== "all") {
        const rating = parseInt(ratingFilter)
        filteredTestimonials = filteredTestimonials.filter(t => t.rating === rating)
      }

      // Filter by search
      if (searchInput.trim()) {
        const searchTerm = searchInput.toLowerCase()
        filteredTestimonials = filteredTestimonials.filter(t => 
          t.parentName.toLowerCase().includes(searchTerm) ||
          t.childName.toLowerCase().includes(searchTerm) ||
          t.content.toLowerCase().includes(searchTerm) ||
          t.parentEmail.toLowerCase().includes(searchTerm)
        )
      }

      displayAdminTestimonials(filteredTestimonials)
    } catch (error) {
      console.error("Error filtering testimonials:", error)
    }
  }
})
