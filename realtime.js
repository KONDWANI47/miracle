// Real-time functionality for MIRACLE ECD website
class WebsiteRealTimeManager {
    constructor() {
        this.isInitialized = false;
        this.listeners = new Map();
        this.updateCallbacks = new Map();
        this.currentTestimonialIndex = 0;
        this.testimonials = [];
        this.blogPosts = [];
        this.announcements = [];
        this.heroAnnouncements = [];
        this.galleryItems = [];
    }

    async initialize() {
        if (this.isInitialized) return;
        
        try {
            if (typeof firebaseManager !== 'undefined') {
                await firebaseManager.initialize();
                this.isInitialized = true;
                console.log('Website real-time manager initialized');
                this.setupRealTimeListeners();
                this.initializeRealTimeIndicators();
            } else {
                console.warn('Firebase manager not available, real-time updates disabled');
            }
        } catch (error) {
            console.error('Failed to initialize website real-time manager:', error);
        }
    }

    setupRealTimeListeners() {
        if (!this.isInitialized) return;

        // Setup listeners for all data types
        const callbacks = {
            onTestimonialsChange: (testimonials) => this.updateTestimonials(testimonials),
            onBlogPostsChange: (blogPosts) => this.updateBlogPosts(blogPosts),
            onAnnouncementsChange: (announcements) => this.updateAnnouncements(announcements),
            onHeroAnnouncementsChange: (heroAnnouncements) => this.updateHeroAnnouncements(heroAnnouncements),
            onGalleryChange: (galleryItems) => this.updateGallery(galleryItems)
        };

        firebaseManager.setupRealTimeListeners(callbacks);
    }

    initializeRealTimeIndicators() {
        // Add real-time indicators to various sections
        this.addRealTimeIndicator('#testimonials', 'Live Testimonials');
        this.addRealTimeIndicator('#blog-section', 'Live Blog Posts');
        this.addRealTimeIndicator('#announcements', 'Live Announcements');
        this.addRealTimeIndicator('#gallery', 'Live Gallery');
        this.addRealTimeIndicator('#hero', 'Live Updates');
        
        // Also add indicators to any section with h2 headers
        this.addRealTimeIndicatorsToSections();
    }

    addRealTimeIndicator(selector, text) {
        const element = document.querySelector(selector);
        if (element) {
            const indicator = document.createElement('div');
            indicator.className = 'real-time-indicator';
            indicator.innerHTML = `<i class="fas fa-circle"></i> ${text}`;
            
            const header = element.querySelector('h2, .section-title, .section-header');
            if (header) {
                header.appendChild(indicator);
            } else {
                // If no header found, add to the element itself
                element.insertBefore(indicator, element.firstChild);
            }
        }
    }

    addRealTimeIndicatorsToSections() {
        // Add indicators to any section that might have real-time content
        const sections = document.querySelectorAll('section, .section, [id*="section"]');
        sections.forEach(section => {
            const header = section.querySelector('h2, h3');
            if (header && !section.querySelector('.real-time-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'real-time-indicator';
                indicator.innerHTML = `<i class="fas fa-circle"></i> Live Updates`;
                header.appendChild(indicator);
            }
        });
    }

    // Testimonials real-time updates
    updateTestimonials(testimonials) {
        this.testimonials = testimonials.filter(t => t.status === 'approved');
        this.renderTestimonials();
        this.showUpdateNotification('New testimonial received!');
    }

    renderTestimonials() {
        const track = document.getElementById('testimonialTrack');
        const indicators = document.getElementById('testimonialIndicators');
        
        if (!track || !indicators) return;

        if (this.testimonials.length === 0) {
            track.innerHTML = `
                <div class="testimonial-item">
                    <div class="testimonial-content">
                        <p>No testimonials available yet. Be the first to share your experience!</p>
                    </div>
                </div>
            `;
            indicators.innerHTML = '';
            return;
        }

        // Render testimonial items
        track.innerHTML = this.testimonials.map((testimonial, index) => `
            <div class="testimonial-item ${index === 0 ? 'active' : ''}" data-index="${index}">
                <div class="testimonial-content">
                    <div class="testimonial-rating">
                        ${this.generateStars(testimonial.rating || 5)}
                    </div>
                    <p>"${testimonial.content}"</p>
                    <div class="testimonial-author">
                        <strong>${testimonial.parentName}</strong>
                        <span>Parent of ${testimonial.childName}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Render indicators
        indicators.innerHTML = this.testimonials.map((_, index) => `
            <button class="indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></button>
        `).join('');

        // Setup carousel functionality
        this.setupTestimonialCarousel();
    }

    setupTestimonialCarousel() {
        const track = document.getElementById('testimonialTrack');
        const indicators = document.getElementById('testimonialIndicators');
        const prevBtn = document.getElementById('prevTestimonial');
        const nextBtn = document.getElementById('nextTestimonial');

        if (!track || !indicators) return;

        // Indicator clicks
        indicators.addEventListener('click', (e) => {
            if (e.target.classList.contains('indicator')) {
                const index = parseInt(e.target.dataset.index);
                this.showTestimonial(index);
            }
        });

        // Navigation buttons
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentTestimonialIndex = (this.currentTestimonialIndex - 1 + this.testimonials.length) % this.testimonials.length;
                this.showTestimonial(this.currentTestimonialIndex);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentTestimonialIndex = (this.currentTestimonialIndex + 1) % this.testimonials.length;
                this.showTestimonial(this.currentTestimonialIndex);
            });
        }

        // Auto-advance
        this.startTestimonialAutoAdvance();
    }

    showTestimonial(index) {
        const items = document.querySelectorAll('.testimonial-item');
        const indicators = document.querySelectorAll('.indicator');

        items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });

        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });

        this.currentTestimonialIndex = index;
    }

    startTestimonialAutoAdvance() {
        if (this.testimonials.length <= 1) return;

        setInterval(() => {
            this.currentTestimonialIndex = (this.currentTestimonialIndex + 1) % this.testimonials.length;
            this.showTestimonial(this.currentTestimonialIndex);
        }, 5000);
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        return `
            ${'<i class="fas fa-star"></i>'.repeat(fullStars)}
            ${hasHalfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
            ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
        `;
    }

    // Blog posts real-time updates
    updateBlogPosts(blogPosts) {
        this.blogPosts = blogPosts.filter(post => post.status !== 'draft');
        this.renderBlogPosts();
        this.showUpdateNotification('New blog post published!');
    }

    renderBlogPosts() {
        const container = document.getElementById('blogPostsContainer');
        if (!container) return;

        if (this.blogPosts.length === 0) {
            container.innerHTML = `
                <div class="no-posts">
                    <p>No blog posts available yet. Check back soon!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.blogPosts.slice(0, 6).map(post => `
            <article class="blog-post">
                <div class="blog-post-image">
                    ${post.image ? `<img src="${post.image}" alt="${post.title}">` : ''}
                </div>
                <div class="blog-post-content">
                    <div class="blog-post-meta">
                        <span class="blog-post-category">${post.category}</span>
                        <span class="blog-post-date">${this.formatDate(post.timestamp)}</span>
                    </div>
                    <h3 class="blog-post-title">${post.title}</h3>
                    <p class="blog-post-excerpt">${post.summary || post.content.substring(0, 150)}...</p>
                    <a href="#" class="read-more">Read More</a>
                </div>
            </article>
        `).join('');
    }

    // Announcements real-time updates
    updateAnnouncements(announcements) {
        this.announcements = announcements.filter(a => a.status !== 'expired');
        this.renderAnnouncements();
        this.showUpdateNotification('New announcement posted!');
    }

    renderAnnouncements() {
        const container = document.getElementById('announcementsContainer');
        if (!container) return;

        if (this.announcements.length === 0) {
            container.innerHTML = `
                <div class="no-announcements">
                    <p>No announcements at the moment.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.announcements.slice(0, 3).map(announcement => `
            <div class="announcement-item ${announcement.type}">
                <div class="announcement-icon">
                    <i class="fas fa-${this.getAnnouncementIcon(announcement.type)}"></i>
                </div>
                <div class="announcement-content">
                    <h4>${announcement.title}</h4>
                    <p>${announcement.content}</p>
                    <span class="announcement-date">${this.formatDate(announcement.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    // Hero announcements real-time updates
    updateHeroAnnouncements(heroAnnouncements) {
        this.heroAnnouncements = heroAnnouncements.filter(a => a.status !== 'expired');
        this.renderHeroAnnouncements();
        this.showUpdateNotification('New hero announcement!');
    }

    renderHeroAnnouncements() {
        const container = document.getElementById('hero-announcements');
        if (!container) return;

        if (this.heroAnnouncements.length === 0) {
            container.innerHTML = '';
            return;
        }

        // Show the most recent hero announcement
        const latest = this.heroAnnouncements[0];
        container.innerHTML = `
            <div class="hero-announcement ${latest.type}">
                <div class="hero-announcement-content">
                    <h3>${latest.title}</h3>
                    <p>${latest.content}</p>
                    <button class="hero-announcement-close" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Gallery real-time updates
    updateGallery(galleryItems) {
        this.galleryItems = galleryItems.filter(item => item.status === 'approved');
        this.renderGallery();
        this.showUpdateNotification('New gallery item added!');
    }

    renderGallery() {
        const container = document.getElementById('galleryContainer');
        if (!container) return;

        if (this.galleryItems.length === 0) {
            container.innerHTML = `
                <div class="no-gallery">
                    <p>No gallery items available yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.galleryItems.slice(0, 8).map(item => `
            <div class="gallery-item">
                <img src="${item.image}" alt="${item.title}" loading="lazy">
                <div class="gallery-overlay">
                    <h4>${item.title}</h4>
                    <p>${item.description}</p>
                </div>
            </div>
        `).join('');
    }

    // Utility functions
    formatDate(timestamp) {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getAnnouncementIcon(type) {
        const icons = {
            'info': 'info-circle',
            'urgent': 'exclamation-triangle',
            'event': 'calendar',
            'notice': 'bullhorn'
        };
        return icons[type] || 'info-circle';
    }

    showUpdateNotification(message) {
        // Ensure notification container exists
        let notificationContainer = document.getElementById('notificationContainer');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notificationContainer';
            notificationContainer.className = 'notification-container';
            document.body.appendChild(notificationContainer);
        }

        // Create notification toast
        const toast = document.createElement('div');
        toast.className = 'website-notification-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-sync-alt"></i>
                <div class="toast-text">
                    <strong>Live Update</strong>
                    <p>${message}</p>
                </div>
                <button class="toast-close">&times;</button>
            </div>
        `;
        
        notificationContainer.appendChild(toast);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    // Handle testimonial form submission
    async handleTestimonialSubmission(formData) {
        try {
            if (typeof firebaseManager !== 'undefined') {
                await firebaseManager.saveTestimonial(formData);
                this.showUpdateNotification('Thank you! Your testimonial has been submitted for review.');
                return true;
            } else {
                // Fallback to localStorage
                const testimonials = JSON.parse(localStorage.getItem('testimonials') || '[]');
                testimonials.push({
                    ...formData,
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    status: 'pending'
                });
                localStorage.setItem('testimonials', JSON.stringify(testimonials));
                this.showUpdateNotification('Thank you! Your testimonial has been submitted.');
                return true;
            }
        } catch (error) {
            console.error('Testimonial submission error:', error);
            this.showUpdateNotification('Sorry, there was an error submitting your testimonial.');
            return false;
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

// Initialize website real-time manager
const websiteRealTimeManager = new WebsiteRealTimeManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await websiteRealTimeManager.initialize();
    
    // Setup testimonial form
    const testimonialForm = document.getElementById('testimonialForm');
    if (testimonialForm) {
        testimonialForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(testimonialForm);
            const testimonialData = {
                parentName: formData.get('parentName'),
                childName: formData.get('childName'),
                parentEmail: formData.get('parentEmail'),
                rating: parseInt(formData.get('rating')),
                content: formData.get('content')
            };
            
            const success = await websiteRealTimeManager.handleTestimonialSubmission(testimonialData);
            if (success) {
                testimonialForm.reset();
            }
        });
    }
    
    // Setup unhandled rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        // Optionally show a user-friendly notification
        if (window.websiteRealTimeManager) {
            window.websiteRealTimeManager.showUpdateNotification('A connection error occurred. Please refresh the page.');
        }
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        websiteRealTimeManager.cleanup();
    });
});

// Export for use in other files
window.websiteRealTimeManager = websiteRealTimeManager; 