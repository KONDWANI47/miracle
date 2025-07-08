# PHP Backend Setup Guide - MIRACLE ECD

This guide will help you set up the PHP backend for the MIRACLE ECD registration system.

## 📋 Prerequisites

- **PHP 7.4+** with the following extensions:
  - PDO (PHP Data Objects)
  - PDO_MySQL
  - JSON
  - Mail (for email notifications)
- **MySQL 5.7+** or **MariaDB 10.2+**
- **Web Server** (Apache/Nginx) or PHP built-in server
- **Composer** (optional, for dependency management)

## 🚀 Quick Setup

### 1. Database Setup

1. **Create MySQL Database:**
   ```sql
   CREATE DATABASE miracle_ecd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'miracle_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON miracle_ecd.* TO 'miracle_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **Update Configuration:**
   Edit `config.php` and update the database credentials:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'miracle_ecd');
   define('DB_USER', 'miracle_user');
   define('DB_PASS', 'your_password');
   ```

### 2. File Structure

Ensure your project has the following structure:
```
MIRACLE_ECD/
├── index.html              # Main website
├── admin.html              # Admin panel
├── register.php            # Registration API
├── admin-api.php           # Admin API
├── config.php              # Configuration
├── script.js               # Frontend JavaScript
├── admin.js                # Admin JavaScript
├── styles.css              # Main styles
├── admin.css               # Admin styles
├── logs/                   # Log directory (auto-created)
└── uploads/                # Upload directory (if needed)
```

### 3. Server Setup

#### Option A: PHP Built-in Server (Development)
```bash
# Navigate to your project directory
cd /path/to/MIRACLE_ECD

# Start PHP server
php -S localhost:8000

# Access your site at http://localhost:8000
```

#### Option B: Apache/Nginx (Production)

**Apache Configuration:**
```apache
<VirtualHost *:80>
    ServerName miracleecd.local
    DocumentRoot /path/to/MIRACLE_ECD
    
    <Directory /path/to/MIRACLE_ECD>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/miracleecd_error.log
    CustomLog ${APACHE_LOG_DIR}/miracleecd_access.log combined
</VirtualHost>
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name miracleecd.local;
    root /path/to/MIRACLE_ECD;
    index index.html index.php;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## 🔧 Configuration

### 1. Email Configuration

Update email settings in `config.php`:
```php
define('ADMIN_EMAIL', 'admin@miracleecd.com');
define('ADMIN_PHONE', '+265992260985');
define('SITE_NAME', 'MIRACLE ECD');
define('SITE_URL', 'http://your-domain.com');
```

### 2. Security Settings

For production, update security settings:
```php
define('DEBUG_MODE', false);  // Set to false in production
define('JWT_SECRET', 'your-very-secure-secret-key-here');
```

### 3. Payment Configuration

Update payment methods and amounts:
```php
define('PAYMENT_METHODS', [
    'airtel_money' => 'Airtel Money',
    'tnm_mpamba' => 'TNM Mpamba',
    'bank_transfer' => 'Bank Transfer',
    'cash' => 'Cash Payment'
]);
```

## 🧪 Testing

### 1. Test Database Connection

Visit: `http://localhost:8000/test-php-backend.html`

Click "Test Database Connection" to verify:
- Database connectivity
- Table creation
- API functionality

### 2. Test Registration

1. Fill out the test registration form
2. Submit and verify:
   - Data is saved to database
   - Email notification is sent
   - Admin notification is created

### 3. Test Admin API

Use the test page to verify:
- Registration retrieval
- Dashboard statistics
- Notification system

## 📊 Database Schema

The system creates the following tables:

### `registrations`
- `id` - Primary key
- `parent_name` - Parent/guardian name
- `email` - Email address
- `phone` - Phone number
- `child_name` - Child's name
- `child_age` - Child's age
- `program` - Selected program
- `start_date` - Preferred start date
- `message` - Additional information
- `payment_status` - Payment status
- `registration_status` - Registration status
- `registration_date` - Registration timestamp
- `last_updated` - Last update timestamp

### `payments`
- `id` - Primary key
- `registration_id` - Foreign key to registrations
- `parent_name` - Parent name
- `amount` - Payment amount
- `payment_method` - Payment method used
- `payment_date` - Payment timestamp
- `reference` - Payment reference
- `status` - Payment status
- `transaction_id` - Transaction ID
- `notes` - Additional notes

### `notifications`
- `id` - Primary key
- `type` - Notification type
- `title` - Notification title
- `message` - Notification message
- `data` - JSON data
- `is_read` - Read status
- `created_at` - Creation timestamp

## 🔒 Security Considerations

### 1. Input Validation
- All user inputs are sanitized
- Email addresses are validated
- Phone numbers are checked for format
- Age validation (0-12 years)

### 2. SQL Injection Prevention
- Uses PDO prepared statements
- Parameterized queries
- Input sanitization

### 3. XSS Prevention
- HTML entities encoding
- Output sanitization
- Content Security Policy headers

### 4. Authentication
- Simple token-based authentication for admin API
- Session management for admin panel
- Password hashing for admin accounts

## 📧 Email Configuration

### 1. Local Development
For local testing, you can use:
- **Mailtrap** for email testing
- **Gmail SMTP** for real emails
- **Local mail server** (Postfix, etc.)

### 2. Production Setup
Configure your server's mail settings:
```bash
# Install and configure Postfix
sudo apt-get install postfix

# Or use external SMTP service
# Update php.ini with SMTP settings
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials in `config.php`
   - Verify MySQL service is running
   - Check database permissions

2. **Email Not Sending**
   - Check mail server configuration
   - Verify `mail()` function is enabled
   - Check server logs for errors

3. **Permission Errors**
   - Ensure `logs/` directory is writable
   - Check file permissions (755 for directories, 644 for files)

4. **CORS Issues**
   - Update `Access-Control-Allow-Origin` headers
   - Configure web server CORS settings

### Debug Mode

Enable debug mode in `config.php`:
```php
define('DEBUG_MODE', true);
```

This will show detailed error messages and log all activities.

## 📈 Monitoring

### 1. Log Files
Check `logs/activity.log` for system activities:
```bash
tail -f logs/activity.log
```

### 2. Database Monitoring
Monitor database performance:
```sql
-- Check table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'miracle_ecd';
```

### 3. Error Logs
Check web server error logs:
```bash
# Apache
tail -f /var/log/apache2/error.log

# Nginx
tail -f /var/log/nginx/error.log
```

## 🔄 Backup

### 1. Database Backup
```bash
# Create backup
mysqldump -u miracle_user -p miracle_ecd > backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u miracle_user -p miracle_ecd < backup_20240101.sql
```

### 2. File Backup
```bash
# Backup entire project
tar -czf miracle_ecd_backup_$(date +%Y%m%d).tar.gz /path/to/MIRACLE_ECD
```

## 🚀 Deployment Checklist

- [ ] Database created and configured
- [ ] Email settings updated
- [ ] Security settings configured
- [ ] File permissions set correctly
- [ ] SSL certificate installed (production)
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Error logging enabled
- [ ] Performance optimized
- [ ] Security tested

## 📞 Support

For issues or questions:
- Check the logs in `logs/activity.log`
- Review error messages in browser console
- Test with the provided test page
- Contact system administrator

---

**Note:** This PHP backend provides a robust foundation for the MIRACLE ECD registration system. Make sure to test thoroughly before deploying to production. 