// Google Sheets Integration for MIRACLE ECD
// Stores registration data in Google Sheets for cross-device admin access

class GoogleSheetsManager {
    constructor() {
        // Google Sheets API configuration
        this.sheetId = 'your-google-sheet-id'; // Replace with your sheet ID
        this.apiKey = 'your-google-api-key'; // Replace with your API key
        this.sheetName = 'Registrations';
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    }

    // Save registration to Google Sheets
    async saveRegistration(registrationData) {
        try {
            const rowData = this.formatRegistrationForSheet(registrationData);
            
            const response = await fetch(
                `${this.baseUrl}/${this.sheetId}/values/${this.sheetName}!A:Z:append?valueInputOption=USER_ENTERED&key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        values: [rowData]
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to save to Google Sheets');
            }

            const result = await response.json();
            console.log('Registration saved to Google Sheets:', result);
            
            // Send notification
            this.sendNotification(registrationData);
            
            return result;
        } catch (error) {
            console.error('Google Sheets error:', error);
            // Fallback to localStorage
            this.saveToLocalStorage(registrationData);
            throw error;
        }
    }

    // Get all registrations from Google Sheets
    async getAllRegistrations() {
        try {
            const response = await fetch(
                `${this.baseUrl}/${this.sheetId}/values/${this.sheetName}!A:Z?key=${this.apiKey}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch from Google Sheets');
            }

            const data = await response.json();
            const registrations = this.parseSheetData(data.values);
            return registrations;
        } catch (error) {
            console.error('Google Sheets fetch error:', error);
            // Fallback to localStorage
            return this.getFromLocalStorage();
        }
    }

    // Format registration data for Google Sheets
    formatRegistrationForSheet(data) {
        return [
            new Date().toISOString(), // Timestamp
            data.parentName || 'Not provided',
            data.email,
            data.phone,
            data.childName || 'Not provided',
            data.childAge,
            data.program,
            data.startDate,
            data.message || 'No additional information',
            'Unpaid', // Payment Status
            'Pending', // Registration Status
            'New' // Action Required
        ];
    }

    // Parse Google Sheets data back to registration objects
    parseSheetData(rows) {
        if (!rows || rows.length < 2) return [];
        
        const headers = rows[0];
        const registrations = [];
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const registration = {
                timestamp: row[0] || '',
                parentName: row[1] || '',
                email: row[2] || '',
                phone: row[3] || '',
                childName: row[4] || '',
                childAge: row[5] || '',
                program: row[6] || '',
                startDate: row[7] || '',
                message: row[8] || '',
                paymentStatus: row[9] || 'Unpaid',
                status: row[10] || 'Pending',
                actionRequired: row[11] || 'New'
            };
            registrations.push(registration);
        }
        
        return registrations;
    }

    // Send notification about new registration
    async sendNotification(registrationData) {
        const subject = `New Registration - MIRACLE ECD`;
        const message = `
New registration received:

Child: ${registrationData.childName || 'Not provided'}
Parent: ${registrationData.parentName || 'Not provided'}
Email: ${registrationData.email}
Phone: ${registrationData.phone}
Program: ${registrationData.program}

View in Google Sheets: https://docs.google.com/spreadsheets/d/${this.sheetId}
        `.trim();

        // Send email notification
        const mailtoLink = `mailto:admin@miracleecd.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.open(mailtoLink, '_blank');
    }

    // Update registration status in Google Sheets
    async updateRegistrationStatus(rowIndex, status, paymentStatus) {
        try {
            const range = `${this.sheetName}!K${rowIndex + 2}:L${rowIndex + 2}`;
            
            const response = await fetch(
                `${this.baseUrl}/${this.sheetId}/values/${range}?valueInputOption=USER_ENTERED&key=${this.apiKey}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        values: [[status, paymentStatus]]
                    })
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update Google Sheets');
            }

            return await response.json();
        } catch (error) {
            console.error('Google Sheets update error:', error);
            throw error;
        }
    }

    // Create Google Sheets setup instructions
    getSetupInstructions() {
        return `
📋 GOOGLE SHEETS SETUP INSTRUCTIONS:

1. Create a new Google Sheet
2. Name the first sheet "Registrations"
3. Add these headers in row 1:
   A: Timestamp | B: Parent Name | C: Email | D: Phone | E: Child Name | F: Child Age | G: Program | H: Start Date | I: Message | J: Payment Status | K: Status | L: Action Required

4. Get your Sheet ID from the URL:
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit

5. Enable Google Sheets API:
   - Go to Google Cloud Console
   - Create a new project
   - Enable Google Sheets API
   - Create API credentials (API Key)

6. Update the configuration in this file:
   - sheetId: 'your-sheet-id'
   - apiKey: 'your-api-key'

7. Share the sheet with your admin email for access

🔗 Google Sheets URL: https://docs.google.com/spreadsheets/d/${this.sheetId}
        `.trim();
    }

    // Fallback methods
    saveToLocalStorage(data) {
        const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
        registrations.push({
            ...data,
            id: Date.now(),
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('registrations', JSON.stringify(registrations));
    }

    getFromLocalStorage() {
        return JSON.parse(localStorage.getItem('registrations') || '[]');
    }
}

// Initialize Google Sheets manager
const sheetsManager = new GoogleSheetsManager();

// Export for use in other files
window.sheetsManager = sheetsManager; 