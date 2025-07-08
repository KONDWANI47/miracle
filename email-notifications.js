// Enhanced Email Notification System
// Sends registration data directly to admin email for cross-device access

class EmailNotificationSystem {
    constructor() {
        this.adminEmail = 'admin@miracleecd.com'; // Change to your email
        this.adminPhone = '+265123456789'; // Change to your phone
        this.schoolName = 'MIRACLE ECD';
    }

    // Send registration notification via email
    async sendRegistrationEmail(registrationData) {
        const subject = `New Registration - ${this.schoolName}`;
        const body = this.formatRegistrationEmail(registrationData);
        
        // Method 1: Mailto link (opens user's email client)
        const mailtoLink = `mailto:${this.adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Method 2: EmailJS (if configured)
        if (typeof emailjs !== 'undefined') {
            try {
                await emailjs.send('service_id', 'template_id', {
                    to_email: this.adminEmail,
                    subject: subject,
                    message: body
                });
                console.log('Email sent via EmailJS');
                return true;
            } catch (error) {
                console.error('EmailJS error:', error);
            }
        }
        
        // Method 3: Formspree or similar service
        try {
            const response = await fetch('https://formspree.io/f/your-form-id', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: this.adminEmail,
                    subject: subject,
                    message: body,
                    registration: registrationData
                })
            });
            
            if (response.ok) {
                console.log('Email sent via Formspree');
                return true;
            }
        } catch (error) {
            console.error('Formspree error:', error);
        }
        
        // Fallback: Open mailto link
        window.open(mailtoLink, '_blank');
        return false;
    }

    // Send WhatsApp notification
    async sendWhatsAppNotification(registrationData) {
        const message = this.formatWhatsAppMessage(registrationData);
        const whatsappLink = `https://wa.me/${this.adminPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappLink, '_blank');
    }

    // Format registration data for email
    formatRegistrationEmail(data) {
        return `
NEW REGISTRATION - ${this.schoolName}

📋 REGISTRATION DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👨‍👩‍👧‍👦 PARENT/GUARDIAN INFORMATION:
• Name: ${data.parentName || 'Not provided'}
• Email: ${data.email}
• Phone: ${data.phone}

👶 CHILD INFORMATION:
• Name: ${data.childName || 'Not provided'}
• Age: ${data.childAge} years old
• Program: ${data.program}
• Preferred Start Date: ${data.startDate}

📝 ADDITIONAL INFORMATION:
${data.message || 'No additional information provided'}

⏰ REGISTRATION TIMESTAMP:
${new Date().toLocaleString()}

💰 PAYMENT STATUS:
Registration Fee: MWK 5,000 (Unpaid)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 QUICK ACTIONS:
• View in Admin Panel: [Admin Panel Link]
• Contact Parent: ${data.phone}
• Send Email: ${data.email}

📞 CONTACT INFORMATION:
• School Phone: +265 123 456 789
• School Email: info@miracleecd.com
• School Address: Area 25, Sector 6, Lilongwe

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated notification from the MIRACLE ECD registration system.
Please respond to this registration within 24 hours.

Best regards,
MIRACLE ECD Registration System
        `.trim();
    }

    // Format registration data for WhatsApp
    formatWhatsAppMessage(data) {
        return `🚨 NEW REGISTRATION - MIRACLE ECD

👶 Child: ${data.childName || 'Not provided'} (${data.childAge} years)
👨‍👩‍👧‍👦 Parent: ${data.parentName || 'Not provided'}
📧 Email: ${data.email}
📱 Phone: ${data.phone}
📚 Program: ${data.program}
📅 Start Date: ${data.startDate}

💰 Registration Fee: MWK 5,000 (Unpaid)

⏰ Received: ${new Date().toLocaleString()}

Please check your email for full details and take action.

Best regards,
MIRACLE ECD System`;
    }

    // Send SMS notification (if SMS service is configured)
    async sendSMSNotification(registrationData) {
        const message = `New registration: ${data.childName} - ${data.program}. Check email for details.`;
        
        // Example with Twilio or similar service
        try {
            const response = await fetch('/api/send-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: this.adminPhone,
                    message: message
                })
            });
            
            if (response.ok) {
                console.log('SMS sent successfully');
                return true;
            }
        } catch (error) {
            console.error('SMS error:', error);
        }
        
        return false;
    }

    // Send all notifications
    async sendAllNotifications(registrationData) {
        console.log('Sending notifications for new registration...');
        
        // Send email notification
        await this.sendRegistrationEmail(registrationData);
        
        // Send WhatsApp notification
        await this.sendWhatsAppNotification(registrationData);
        
        // Send SMS notification (optional)
        // await this.sendSMSNotification(registrationData);
        
        console.log('All notifications sent successfully');
    }
}

// Initialize email notification system
const emailNotifier = new EmailNotificationSystem();

// Export for use in other files
window.emailNotifier = emailNotifier; 