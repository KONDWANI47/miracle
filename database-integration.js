// Database Integration for MIRACLE ECD
// This file provides real database connectivity for cross-device data access

class DatabaseManager {
    constructor() {
        // Configure your database connection here
        this.apiUrl = 'https://your-database-api.com/api';
        this.apiKey = 'your-api-key';
    }

    // Save registration to database
    async saveRegistration(registrationData) {
        try {
            const response = await fetch(`${this.apiUrl}/registrations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    ...registrationData,
                    timestamp: new Date().toISOString(),
                    status: 'pending',
                    paymentStatus: 'unpaid'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save registration');
            }

            const result = await response.json();
            console.log('Registration saved to database:', result);
            return result;
        } catch (error) {
            console.error('Database save error:', error);
            // Fallback to localStorage
            this.saveToLocalStorage(registrationData);
            throw error;
        }
    }

    // Get all registrations (for admin)
    async getAllRegistrations() {
        try {
            const response = await fetch(`${this.apiUrl}/registrations`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch registrations');
            }

            const registrations = await response.json();
            return registrations;
        } catch (error) {
            console.error('Database fetch error:', error);
            // Fallback to localStorage
            return this.getFromLocalStorage();
        }
    }

    // Update registration status
    async updateRegistration(id, updates) {
        try {
            const response = await fetch(`${this.apiUrl}/registrations/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error('Failed to update registration');
            }

            return await response.json();
        } catch (error) {
            console.error('Database update error:', error);
            throw error;
        }
    }

    // Delete registration
    async deleteRegistration(id) {
        try {
            const response = await fetch(`${this.apiUrl}/registrations/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete registration');
            }

            return true;
        } catch (error) {
            console.error('Database delete error:', error);
            throw error;
        }
    }

    // Fallback methods for localStorage
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

// Initialize database manager
const dbManager = new DatabaseManager();

// Export for use in other files
window.dbManager = dbManager; 