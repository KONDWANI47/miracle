# MIRACLE ECD Website

A comprehensive website for MIRACLE ECD (Early Childhood Development Center) with full-stack functionality including registration, payments, announcements, gallery, testimonials, and admin panel.

## Features

### Frontend Features
- **Responsive Design**: Works on all devices (desktop, tablet, mobile)
- **Registration System**: Online registration with payment integration
- **Payment Processing**: Multiple payment methods (Airtel Money, TNM Mpamba, Bank Transfer, Cash)
- **Gallery**: Photo gallery with user uploads
- **Announcements**: Real-time announcements and hero announcements
- **Testimonials**: Parent testimonials with approval system
- **Blog Posts**: Educational content and news
- **Contact Information**: Complete contact details and location
- **WhatsApp Integration**: Direct WhatsApp contact button

### Admin Panel Features
- **Dashboard**: Analytics and overview
- **Registration Management**: View, update, and delete registrations
- **Payment Management**: Track payments and manage payment settings
- **Announcement Management**: Create and manage announcements
- **Gallery Management**: Upload and manage gallery images
- **User Uploads**: Approve/reject user-submitted photos
- **Testimonial Management**: Approve/reject parent testimonials
- **Blog Post Management**: Create and manage blog posts
- **Student Database**: Comprehensive student records
- **Data Export**: Export data to CSV format

### Server Features
- **RESTful API**: Complete API for all data operations
- **Data Persistence**: JSON file-based storage
- **Cross-Device Sync**: Data accessible from any device/browser
- **Offline Support**: Fallback to localStorage when server is unavailable
- **CORS Support**: Cross-origin resource sharing enabled
- **Health Check**: Server status monitoring

## Setup Instructions

### Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Installation

1. **Clone or download the project files**
   ```bash
   # If using git
   git clone <repository-url>
   cd MIR
   
   # Or simply download and extract the files to a folder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the website**
   - Main website: http://localhost:3000
   - Admin panel: http://localhost:3000/admin.html

### Development Mode

For development with auto-restart on file changes:
```bash
npm run dev
```

## File Structure

```
MIR/
├── index.html              # Main website
├── admin.html              # Admin panel
├── server.js               # Node.js server
├── package.json            # Dependencies and scripts
├── script.js               # Frontend JavaScript
├── admin.js                # Admin panel JavaScript
├── styles.css              # Main stylesheet
├── admin.css               # Admin panel styles
├── data/                   # Data storage directory
│   ├── registrations.json
│   ├── payments.json
│   ├── announcements.json
│   ├── hero-announcements.json
│   ├── gallery.json
│   ├── user-uploads.json
│   ├── payment-settings.json
│   ├── testimonials.json
│   ├── blog-posts.json
│   └── students.json
├── Images/                 # Image assets
│   ├── ana.png
│   ├── ana2.png
│   ├── ana3.png
│   ├── ground.png
│   ├── kids.jpg
│   ├── playing.jpg
│   └── kds 1.jpg
└── README.md               # This file
```

## API Endpoints

### Registrations
- `GET /api/registrations` - Get all registrations
- `POST /api/registrations` - Create new registration
- `PUT /api/registrations/:id` - Update registration
- `DELETE /api/registrations/:id` - Delete registration

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create new payment
- `DELETE /api/payments/:id` - Delete payment

### Announcements
- `GET /api/announcements` - Get all announcements
- `POST /api/announcements` - Create new announcement
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

### Hero Announcements
- `GET /api/hero-announcements` - Get hero announcements
- `POST /api/hero-announcements` - Create hero announcement
- `PUT /api/hero-announcements/:id` - Update hero announcement
- `DELETE /api/hero-announcements/:id` - Delete hero announcement

### Gallery
- `GET /api/gallery` - Get gallery items
- `POST /api/gallery` - Add gallery item
- `PUT /api/gallery/:id` - Update gallery item
- `DELETE /api/gallery/:id` - Delete gallery item

### User Uploads
- `GET /api/user-uploads` - Get user uploads
- `POST /api/user-uploads` - Add user upload
- `PUT /api/user-uploads/:id` - Update user upload
- `DELETE /api/user-uploads/:id` - Delete user upload

### Payment Settings
- `GET /api/payment-settings` - Get payment settings
- `PUT /api/payment-settings` - Update payment settings

### Testimonials
- `GET /api/testimonials` - Get testimonials
- `POST /api/testimonials` - Add testimonial
- `PUT /api/testimonials/:id` - Update testimonial
- `DELETE /api/testimonials/:id` - Delete testimonial

### Blog Posts
- `GET /api/blog-posts` - Get blog posts
- `POST /api/blog-posts` - Add blog post
- `PUT /api/blog-posts/:id` - Update blog post
- `DELETE /api/blog-posts/:id` - Delete blog post

### Students
- `GET /api/students` - Get students
- `POST /api/students` - Add student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Utility
- `GET /api/export` - Export all data
- `GET /api/health` - Server health check

## Configuration

### Server Configuration
The server runs on port 3000 by default. To change the port:

1. Set environment variable:
   ```bash
   export PORT=8080
   ```

2. Or modify server.js:
   ```javascript
   const PORT = process.env.PORT || 8080;
   ```

### API Base URL
To change the API base URL for different environments:

1. Update in script.js:
   ```javascript
   const API_BASE_URL = 'http://your-server-url:3000/api';
   ```

2. Update in admin.js:
   ```javascript
   const API_BASE_URL = 'http://your-server-url:3000/api';
   ```

## Data Management

### Data Storage
- All data is stored in JSON files in the `data/` directory
- Data is automatically backed up to localStorage for offline access
- Server provides centralized data access across all devices

### Data Export
- Use the export button in the admin panel to download all data as JSON
- Data can be imported by replacing the JSON files in the `data/` directory

### Backup and Restore
1. **Backup**: Copy the entire `data/` directory
2. **Restore**: Replace the `data/` directory with your backup

## Deployment

### Local Network Access
To make the website accessible on your local network:

1. Find your computer's IP address:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. Update the API_BASE_URL in script.js and admin.js:
   ```javascript
   const API_BASE_URL = 'http://YOUR_IP_ADDRESS:3000/api';
   ```

3. Access from other devices:
   - Main website: http://YOUR_IP_ADDRESS:3000
   - Admin panel: http://YOUR_IP_ADDRESS:3000/admin.html

### Production Deployment
For production deployment:

1. **Use a hosting service** (Heroku, Vercel, Netlify, etc.)
2. **Set up a domain name**
3. **Configure environment variables**
4. **Set up SSL certificate**
5. **Update API_BASE_URL to your production domain**

## Troubleshooting

### Common Issues

1. **Server won't start**
   - Check if Node.js is installed: `node --version`
   - Check if port 3000 is available
   - Try a different port

2. **Data not syncing**
   - Check server is running
   - Check browser console for errors
   - Verify API_BASE_URL is correct

3. **Images not loading**
   - Ensure image files are in the correct directory
   - Check file permissions
   - Verify file paths in the code

4. **Payment not working**
   - Check payment settings in admin panel
   - Verify phone numbers and account details
   - Test with small amounts first

### Error Logs
- Check browser console (F12) for frontend errors
- Check terminal/command prompt for server errors
- Server logs are displayed in the terminal where you started the server

## Support

For technical support or questions:
- Email: cupicsart@gmail.com
- WhatsApp: +265 992 260 985

## License

This project is licensed under the MIT License.

## Version History

- **v1.0.0**: Initial release with basic functionality
- **v1.1.0**: Added payment system and admin panel
- **v1.2.0**: Added testimonials and blog posts
- **v1.3.0**: Added server functionality for cross-device access
- **v1.4.0**: Enhanced admin panel with analytics and student database

---

**MIRACLE ECD** - Nurturing the future, one child at a time.
