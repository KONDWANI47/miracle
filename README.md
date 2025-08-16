# 🏫 MIRACLE ECD - Early Childhood Development Centre

## 📋 Overview

MIRACLE ECD is a comprehensive early childhood development center website with advanced registration system, admin panel, and real-time data management. Built with modern web technologies and Firebase integration for cross-device data access.

## ✨ Features

### 🎯 Core Features
- **📝 Online Registration System** - Easy-to-use registration form with validation
- **🔐 Secure Admin Panel** - Protected admin interface with authentication
- **📊 Real-time Data Management** - Firebase integration for cross-device access
- **📱 Responsive Design** - Mobile-first design that works on all devices
- **💰 Payment Integration** - Multiple payment methods (Airtel Money, TNM Mpamba, Bank transfers)
- **📧 Email Notifications** - Instant alerts for new registrations
- **📱 WhatsApp Integration** - Quick notifications via WhatsApp

### 🛠️ Technical Features
- **🔥 Firebase Integration** - Real-time database and authentication
- **📊 Data Analytics** - Registration statistics and insights
- **🔒 Security** - Admin authentication and data protection
- **📤 Export/Import** - Data export to CSV/JSON formats
- **🔄 Real-time Updates** - Live data synchronization
- **📱 Cross-device Access** - Access from any device with internet

## 🚀 Quick Start

### Prerequisites
- Python 3.x (for local development server)
- Modern web browser
- Firebase account (for production)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KONDWANI47/miracle.git
   cd miracle
   ```

2. **Start local server:**
   ```bash
   python -m http.server 8000
   ```

3. **Open in browser:**
   ```
   http://localhost:8000
   ```

### Firebase Setup (Production)

1. **Follow the Firebase Setup Guide:**
   ```
   FIREBASE-SETUP-GUIDE.md
   ```

2. **Update Firebase configuration:**
   - Edit `firebase-config.js`
   - Replace with your Firebase project credentials

3. **Test Firebase integration:**
   ```
   http://localhost:8000/firebase-test.html
   ```

## 📁 Project Structure

```
miracle/
├── index.html                 # Main website
├── admin.html                 # Admin panel
├── script.js                  # Main JavaScript
├── admin.js                   # Admin panel JavaScript
├── firebase-config.js         # Firebase configuration
├── styles.css                 # Main stylesheet
├── admin.css                  # Admin panel styles
├── FIREBASE-SETUP-GUIDE.md    # Firebase setup instructions
├── DEPLOYMENT-GUIDE.md        # Deployment guide
├── firebase-test.html         # Firebase integration test
├── registration-test.html     # Registration system test
├── deployment-test.html       # Deployment options test
├── google-sheets-integration.js    # Google Sheets integration
├── email-notifications.js     # Email notification system
├── database-integration.js    # Database integration
├── register.php              # PHP backend (optional)
├── config.php                # PHP configuration
├── admin-api.php             # Admin API
├── data base/                # Database schema
│   └── schema.sql
├── images/                   # Website images
└── README.md                 # This file
```

## 🔧 Configuration

### Firebase Configuration
```javascript
// firebase-config.js
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### Admin Credentials
- **Email:** `admin@miracleecd.com`
- **Password:** Set during Firebase setup

## 📱 Admin Access

### Method 1: Admin Panel
- **URL:** `http://localhost:8000/admin.html`
- **Features:** View, update, delete registrations

### Method 2: Firebase Console
- **URL:** `https://console.firebase.google.com/project/your-project-id`
- **Features:** Real-time data, analytics, user management

### Method 3: Real-time Notifications
- **Email:** Instant notifications for new registrations
- **WhatsApp:** Quick alerts to your phone

## 🧪 Testing

### Test Pages
- **Firebase Integration:** `http://localhost:8000/firebase-test.html`
- **Registration System:** `http://localhost:8000/registration-test.html`
- **Deployment Options:** `http://localhost:8000/deployment-test.html`

### Test Commands
```javascript
// Check Firebase connection
console.log('Firebase initialized:', !!firebase);

// Test registration
// Fill out form and submit

// Check admin panel
// Login with admin credentials
```

## 🚀 Deployment

### GitHub Pages
1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to repository Settings
   - Pages > Source: Deploy from branch
   - Branch: main
   - Save

3. **Live URL:**
   ```
   https://kondwani47.github.io/miracle/
   ```

### Other Hosting Options
- **Netlify** - Drag and drop deployment
- **Vercel** - Git-based deployment
- **Firebase Hosting** - Integrated with Firebase services

## 📊 Features Overview

### Registration System
- ✅ Form validation
- ✅ Data storage (Firebase + localStorage)
- ✅ Email notifications
- ✅ WhatsApp alerts
- ✅ Payment integration
- ✅ Admin notifications

### Admin Panel
- ✅ Secure authentication
- ✅ Registration management
- ✅ Payment tracking
- ✅ Analytics dashboard
- ✅ Export functionality
- ✅ Real-time updates

### Data Management
- ✅ Firebase Firestore
- ✅ Real-time synchronization
- ✅ Cross-device access
- ✅ Data backup
- ✅ Export/Import

## 🔒 Security

### Admin Authentication
- Firebase Authentication
- Secure login/logout
- Session management
- Role-based access

### Data Protection
- Firestore security rules
- HTTPS encryption
- Input validation
- XSS protection

## 📞 Support

### Contact Information
- **Phone:** +265 992 260 985
- **Email:** cupicsart@gmail.com
- **WhatsApp:** +265 992 260 985
- **Address:** Area 25, Sector 6, Lilongwe, Malawi

### Business Hours
- **Monday - Friday:** 7:00 AM - 5:00 PM
- **Saturday:** 8:00 AM - 12:00 PM
- **Sunday:** Closed

## 🎯 Programs Offered

### Early Childhood Development
- **Infant Care** (0-5 years)
- **Toddler Program** (5-7 years)
- **Preschool** (7-12 years)

### Extra Curricular Activities
- Computer Basic Training
- Part-time Classes (all grades)
- Business Plan Development
- NGO Constitution Documents
- Front Office & Hospitality Training
- Early Childhood Development Orientation
- Entrepreneurship Consultations

## 📈 Analytics & Reports

### Registration Analytics
- Total registrations
- Age distribution
- Program popularity
- Payment status
- Geographic distribution

### Financial Reports
- Payment tracking
- Revenue analytics
- Outstanding payments
- Payment method analysis

## 🔄 Updates & Maintenance

### Regular Updates
- Security patches
- Feature enhancements
- Bug fixes
- Performance improvements

### Backup Strategy
- Automated Firebase backups
- Local data backup
- Export functionality
- Disaster recovery

## 📄 License

This project is proprietary software for MIRACLE ECD. All rights reserved.

## 🤝 Contributing

For internal development and maintenance only. Contact the development team for contributions.

---

**Built with ❤️ for MIRACLE ECD**

*Nurturing Young Minds, Building Bright Futures*
