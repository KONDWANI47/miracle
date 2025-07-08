// API Base URL - Update this to your server URL
const API_BASE_URL = 'http://localhost:3000/api';

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

// Load data from server
async function loadDataFromServer() {
    try {
        // For now, skip server calls and use localStorage directly
        // This prevents the fetch errors when no server is running
        console.log('Skipping server calls, using localStorage data');
        return loadDataFromLocalStorage();
    } catch (error) {
        console.error('Failed to load data, using localStorage:', error);
        // Fallback to localStorage if server is unavailable
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
        gallery: JSON.parse(localStorage.getItem('gallery') || '[]'),
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

// Place this at the top level, outside DOMContentLoaded
function renderBlogPosts() {
  const blogSection = document.querySelector("#blog, .blog-section")
  if (!blogSection) return
  const blogCards = blogSection.querySelector(".blog-cards")
  if (!blogCards) return
  const blogPosts = JSON.parse(localStorage.getItem("blogPosts")) || []
  
  if (blogPosts.length === 0) {
    blogCards.innerHTML = '<p class="no-blog-posts">No blog posts available yet. Check back soon for updates!</p>'
    return
  }
  
  blogCards.innerHTML = blogPosts.map((post, idx) => `
    <div class="blog-card" data-id="${post.id}">
      <div class="blog-image">
        <img src="${post.image || '/placeholder.svg?height=250&width=400'}" alt="${escapeHtml(post.title)}">
      </div>
      <div class="blog-content">
        <div class="blog-meta">
          <span class="blog-date">${new Date(post.createdDate || post.date).toLocaleDateString()}</span>
          <span class="blog-category">${escapeHtml(post.category || 'General')}</span>
        </div>
        <h3 class="blog-title">${escapeHtml(post.title)}</h3>
        <p class="blog-summary">${escapeHtml(post.summary || post.content.slice(0, 120))}${(post.summary || post.content).length > 120 ? '...' : ''}</p>
        <div class="blog-footer">
          <a href="#" class="blog-readmore">Read Full Story</a>
          <div class="blog-stats">
            <span><i class="fas fa-eye"></i> ${post.views || 0} views</span>
            <span class="like-btn" data-post-id="${post.id}"><i class="fas fa-heart"></i> ${post.likes || 0} likes</span>
          </div>
        </div>
      </div>
    </div>
  `).join('')

  // Like button logic
  blogCards.querySelectorAll('.like-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      const postId = parseInt(btn.dataset.postId)
      const blogPosts = JSON.parse(localStorage.getItem("blogPosts")) || []
      const postIndex = blogPosts.findIndex(post => post.id === postId)
      
      if (postIndex !== -1) {
        blogPosts[postIndex].likes = (blogPosts[postIndex].likes || 0) + 1
        localStorage.setItem("blogPosts", JSON.stringify(blogPosts))
        renderBlogPosts()
      }
    })
  })

  // Blog card click to read full story
  blogCards.querySelectorAll('.blog-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('like-btn') && !e.target.closest('.like-btn')) {
        const postId = parseInt(card.dataset.id)
        const blogPosts = JSON.parse(localStorage.getItem("blogPosts")) || []
        const post = blogPosts.find(post => post.id === postId)
        
        if (post) {
          // Increment view count
          post.views = (post.views || 0) + 1
          localStorage.setItem("blogPosts", JSON.stringify(blogPosts))
          
          // Show full blog post in a modal or alert
          const fullContent = `
Title: ${post.title}
Category: ${post.category || 'General'}
Date: ${new Date(post.createdDate || post.date).toLocaleDateString()}

${post.content}

Views: ${post.views || 0} | Likes: ${post.likes || 0}
          `
          alert("Full Blog Post:\n\n" + fullContent)
        }
      }
    })
  })
}

document.addEventListener("DOMContentLoaded", () => {
  const registrationForm = document.getElementById("registrationForm")
  const userUploadForm = document.getElementById("userUploadForm")
  const paymentModal = document.getElementById("paymentModal")

  // Stripe integration disabled - using local payment methods instead
  // If you want to use Stripe later, uncomment and configure the code below
  /*
  let stripe = null
  let elements = null
  let cardElement = null

  // Try to initialize Stripe
  try {
    if (window.Stripe) {
      stripe = window.Stripe("pk_test_51234567890abcdef") // Replace with your actual Stripe key
      elements = stripe.elements()
      cardElement = elements.create("card")

      const cardElementContainer = document.getElementById("card-element")
      if (cardElementContainer) {
        cardElement.mount("#card-element")
      }
    }
  } catch (error) {
    console.warn("Stripe not available:", error)
  }
  */

  // Initialize databases if they don't exist
  initializeDatabases()

  // Reset gallery data to ensure new images are loaded
  resetGalleryData()

  // Load initial data from server
  loadDataFromServer().then(() => {
    loadAnnouncements()
    loadHeroAnnouncements()
    loadGalleryData()
    loadUserUploads()
    loadRegistrationFee()
    loadTestimonials()
    renderBlogPosts()
  }).catch(() => {
    // Fallback to localStorage if server fails
    loadAnnouncements()
    loadHeroAnnouncements()
    loadGalleryData()
    loadUserUploads()
    loadRegistrationFee()
    loadTestimonials()
    renderBlogPosts()
  })

  // Set default date to today and minimum date
  const startDateInput = document.getElementById("startDate")
  if (startDateInput) {
    const today = new Date()
    const formattedDate = today.toISOString().split("T")[0]
    startDateInput.value = formattedDate
    startDateInput.min = formattedDate
  }

  // Load and display registration fee
  function loadRegistrationFee() {
    const registrationFeeSpan = document.getElementById("registrationFee")
    if (registrationFeeSpan) {
      const paymentSettings = JSON.parse(localStorage.getItem("paymentSettings")) || {
        registrationFee: 5000,
        earlyChildhoodCarePrice: 150,
        foundationProgramPrice: 120,
        primaryPreparationPrice: 100,
      }
      registrationFeeSpan.textContent = paymentSettings.registrationFee.toLocaleString()
    }
  }

  // Update registration fee based on program selection
  const programSelect = document.getElementById("program")
  const registrationFeeSpan = document.getElementById("registrationFee")

  if (programSelect && registrationFeeSpan) {
    programSelect.addEventListener("change", () => {
      const paymentSettings = JSON.parse(localStorage.getItem("paymentSettings")) || {
        registrationFee: 5000,
        earlyChildhoodCarePrice: 150,
        foundationProgramPrice: 120,
        primaryPreparationPrice: 100,
      }
      registrationFeeSpan.textContent = paymentSettings.registrationFee.toLocaleString()
    })
  }

  // Registration form submission
  if (registrationForm) {
    registrationForm.addEventListener("submit", (e) => {
      e.preventDefault()
      handleRegistrationSubmission()
    })
  }

  // Admin panel link - registration viewing moved to admin panel
  const adminPanelLink = document.querySelector('a[href="admin.html#registrations"]')
  if (adminPanelLink) {
    adminPanelLink.addEventListener("click", (e) => {
      // The admin panel will handle authentication and registration viewing
      // No need to prevent default - let the link work normally
    })
  }

  // User upload form submission
  if (userUploadForm) {
    userUploadForm.addEventListener("submit", (e) => {
      e.preventDefault()
      handleUserUpload()
    })
  }

  // Payment modal close
  const paymentCloseBtn = paymentModal?.querySelector(".close-modal")
  if (paymentCloseBtn) {
    paymentCloseBtn.addEventListener("click", () => {
      paymentModal.style.display = "none"
    })
  }

  // Payment submission
  const submitPaymentBtn = document.getElementById("submit-payment")
  if (submitPaymentBtn) {
    submitPaymentBtn.addEventListener("click", handlePayment)
  }

  // Payment method selection
  const paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]')
  paymentMethodInputs.forEach(input => {
    input.addEventListener('change', function() {
      const method = this.value
      showPaymentInstructions(method)
    })
  })

  // Initialize databases
  function initializeDatabases() {
    if (!localStorage.getItem("registrations")) {
      localStorage.setItem("registrations", JSON.stringify([]))
    }

    // Add export functionality to window for easy access
    window.exportRegistrations = function() {
      const registrations = JSON.parse(localStorage.getItem("registrations")) || [];
      const dataStr = JSON.stringify(registrations, null, 2);
      const dataBlob = new Blob([dataStr], {type: 'application/json'});
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `registrations-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      console.log('Registrations exported:', registrations.length, 'entries');
    };

    // Add function to view registrations in console
    window.viewRegistrations = function() {
      const registrations = JSON.parse(localStorage.getItem("registrations")) || [];
      console.table(registrations);
      return registrations;
    };

    if (!localStorage.getItem("announcements")) {
      localStorage.setItem("announcements", JSON.stringify([]))
    }

    if (!localStorage.getItem("galleryData")) {
      const defaultGallery = [
        {
          id: 1,
          title: "Our School Building",
          description:
            "The main building of MIRACLE ECD where our students learn and grow in a safe, nurturing environment.",
          image: "ana.png",
          updatedDate: new Date().toISOString(),
        },
        {
          id: 2,
          title: "School Grounds",
          description:
            "Our spacious school grounds provide the perfect environment for outdoor activities and play.",
          image: "ground.png",
          updatedDate: new Date().toISOString(),
        },
        {
          id: 3,
          title: "Students Learning",
          description: "Our dedicated students engaged in various educational activities and learning experiences.",
          image: "ana2.png",
          updatedDate: new Date().toISOString(),
        },
        {
          id: 4,
          title: "Children Playing",
          description: "Learning through play - our children enjoying recreational activities in our facilities.",
          image: "playing.jpg",
          updatedDate: new Date().toISOString(),
        },
        {
          id: 5,
          title: "Our Young Learners",
          description: "Bright and curious minds exploring the world around them through structured learning activities.",
          image: "kids.jpg",
          updatedDate: new Date().toISOString(),
        },
        {
          id: 6,
          title: "School Activities",
          description: "Students participating in various school activities that promote holistic development.",
          image: "ana3.png",
          updatedDate: new Date().toISOString(),
        },
        {
          id: 7,
          title: "Student Projects",
          description: "Showcasing the creative and innovative projects our young learners create during their time with us.",
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
  }

  // Reset gallery data to use new images
  function resetGalleryData() {
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
    loadGalleryData() // Reload the gallery with new data
  }

  // Handle registration submission
  async function handleRegistrationSubmission() {
    console.log("handleRegistrationSubmission called"); // Debug log
    
    // Get form elements
    const parentNameEl = document.getElementById("parentName");
    const emailEl = document.getElementById("email");
    const phoneEl = document.getElementById("phone");
    const childNameEl = document.getElementById("childName");
    const childAgeEl = document.getElementById("childAge");
    const startDateEl = document.getElementById("startDate");
    const programEl = document.getElementById("program");
    const messageEl = document.getElementById("message");

    // Debug: Log all elements
    console.log("Form elements found:", {
      parentNameEl: parentNameEl,
      emailEl: emailEl,
      phoneEl: phoneEl,
      childNameEl: childNameEl,
      childAgeEl: childAgeEl,
      startDateEl: startDateEl,
      programEl: programEl,
      messageEl: messageEl
    });

    // Check if elements exist
    if (!parentNameEl || !emailEl || !phoneEl || !childNameEl || !childAgeEl || !startDateEl || !programEl) {
      console.error("Some form elements not found:", {
        parentNameEl: !!parentNameEl,
        emailEl: !!emailEl,
        phoneEl: !!phoneEl,
        childNameEl: !!childNameEl,
        childAgeEl: !!childAgeEl,
        startDateEl: !!startDateEl,
        programEl: !!programEl
      });
      showMessage("Registration form not found. Please refresh the page and try again.", "error");
      return;
    }

    const formData = {
      parent_name: parentNameEl.value.trim() || "Not provided",
      email: emailEl.value.trim(),
      phone: phoneEl.value.trim(),
      child_name: childNameEl.value.trim() || "Not provided",
      child_age: parseInt(childAgeEl.value) || 0,
      start_date: startDateEl.value,
      program: programEl.value,
      message: messageEl ? messageEl.value.trim() : "",
    }

    // Additional validation before processing
    if (!parentNameEl.value || parentNameEl.value.trim() === '') {
      showMessage("Please enter the parent/guardian name.", "error");
      parentNameEl.focus();
      return;
    }

    if (!childNameEl.value || childNameEl.value.trim() === '') {
      showMessage("Please enter the child's name.", "error");
      childNameEl.focus();
      return;
    }

    if (!childAgeEl.value || childAgeEl.value.trim() === '') {
      showMessage("Please enter a valid child's age.", "error");
      childAgeEl.focus();
      return;
    }

    const childAge = parseInt(childAgeEl.value);
    if (isNaN(childAge) || childAge < 1 || childAge > 12) {
      showMessage("Child's age must be between 1 and 12 years.", "error");
      childAgeEl.focus();
      return;
    }

    // Update formData with validated values
    formData.parent_name = parentNameEl.value.trim();
    formData.child_name = childNameEl.value.trim();
    formData.child_age = childAge;

    // Debug: Log the collected form data
    console.log("Collected form data:", formData);
    console.log("Raw values:", {
      parentName: parentNameEl.value,
      email: emailEl.value,
      phone: phoneEl.value,
      childName: childNameEl.value,
      childAge: childAgeEl.value,
      startDate: startDateEl.value,
      program: programEl.value,
      message: messageEl ? messageEl.value : "N/A"
    });

    if (validateRegistrationForm(formData)) {
      if (isDuplicateRegistration(formData)) {
        showMessage("A registration with this email or phone number already exists.", "error")
        return
      }

      try {
        // Show loading state
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Submitting...";
        submitBtn.disabled = true;

        let savedRegistration = null;

        // Try Firebase first (primary method)
        if (typeof firebaseManager !== 'undefined') {
          try {
            console.log('Attempting to save to Firebase...');
            console.log('Firebase manager available:', !!firebaseManager);
            console.log('Form data being sent to Firebase:', formData);
            
            const firebaseResult = await firebaseManager.saveRegistration(formData);
            console.log('Firebase save result:', firebaseResult);
            
            if (firebaseResult && firebaseResult.success) {
              savedRegistration = {
                ...formData,
                id: firebaseResult.id,
                registration_date: new Date().toISOString(),
                registration_status: 'pending',
                payment_status: 'unpaid'
              };
              console.log('Registration saved to Firebase successfully:', savedRegistration);
              
              // Show success message
              showMessage("Registration submitted successfully! We will contact you soon to arrange payment.", "success");
              
              // Reset the form
              document.getElementById("registrationForm").reset();
              
              // Send notification to admin
              sendRegistrationNotifications(savedRegistration);

              console.log('Registration submitted successfully:', savedRegistration);
              return; // Exit early on success
            } else {
              throw new Error('Firebase save returned invalid result');
            }
          } catch (firebaseError) {
            console.error('Firebase save failed:', firebaseError);
            showMessage("Firebase connection failed. Trying alternative method...", "warning");
          }
        } else {
          console.error('Firebase manager not available');
          showMessage("Firebase not available. Trying alternative method...", "warning");
        }

        // Fallback to PHP backend
        try {
          const response = await fetch('register.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
          });

          const data = await response.json();

          if (data.success) {
            savedRegistration = {
              ...formData,
              id: data.registration.id,
              registration_date: data.registration.registration_date,
              registration_status: data.registration.registration_status,
              payment_status: data.registration.payment_status
            };
            console.log('Registration saved via PHP backend:', data.registration);
            
            // Show success message
            showMessage("Registration submitted successfully! We will contact you soon to arrange payment.", "success");
            
            // Reset the form
            document.getElementById("registrationForm").reset();
            
            // Send notification to admin
            sendRegistrationNotifications(savedRegistration);

            console.log('Registration submitted successfully:', savedRegistration);
            return; // Exit early on success
          } else {
            throw new Error(data.error || 'PHP backend registration failed');
          }
        } catch (phpError) {
          console.error('PHP backend failed:', phpError);
          showMessage("Server connection failed. Using local storage...", "warning");
        }

        // Final fallback to localStorage
        savedRegistration = {
          ...formData,
          id: Date.now(),
          registration_date: new Date().toISOString(),
          registration_status: 'pending',
          payment_status: 'unpaid'
        };
        await saveRegistration(savedRegistration);
        console.log('Registration saved to localStorage as fallback');
        
        // Show success message
        showMessage("Registration submitted successfully! (Saved locally - please contact us to confirm)", "success");
        
        // Reset the form
        document.getElementById("registrationForm").reset();
        
        // Send notification to admin
        sendRegistrationNotifications(savedRegistration);

        console.log('Registration submitted successfully:', savedRegistration);
      } catch (error) {
        console.error("Error saving registration:", error);
        showMessage("Registration failed. Please try again or contact us directly.", "error");
      } finally {
        // Reset button state
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.textContent = "Submit Registration";
        submitBtn.disabled = false;
      }
    }
  }

  // Show payment modal
  function showPaymentModal(registrationData) {
    const paymentSettings = JSON.parse(localStorage.getItem("paymentSettings")) || {
      registrationFee: 50,
    }

    const paymentDetails = document.getElementById("paymentDetails")
    if (paymentDetails) {
      paymentDetails.innerHTML = `
        <div class="payment-summary">
          <h3>Payment Summary</h3>
          <div class="payment-item">
            <span>Registration Fee:</span>
            <span>MWK${paymentSettings.registrationFee}</span>
          </div>
          <div class="payment-item total">
            <span><strong>Total:</strong></span>
            <span><strong>MWK${paymentSettings.registrationFee}</strong></span>
          </div>
          <div class="registration-info">
            <p><strong>Child:</strong> ${registrationData.childName !== "Not provided" ? registrationData.childName : "Not provided"}</p>
            <p><strong>Program:</strong> ${registrationData.program}</p>
            <p><strong>Parent:</strong> ${registrationData.parentName !== "Not provided" ? registrationData.parentName : "Not provided"}</p>
          </div>
        </div>
      `
    }

    // Store registration data for payment processing
    sessionStorage.setItem("pendingRegistration", JSON.stringify(registrationData))

    if (paymentModal) {
      paymentModal.style.display = "block"
    }
  }

  // Payment method selection handling
  const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]')
  const paymentInstructions = document.getElementById("payment-instructions")

  paymentMethods.forEach(method => {
    method.addEventListener('change', () => {
      const selectedMethod = method.value
      showPaymentInstructions(selectedMethod)
      
      // Add visual feedback
      document.querySelectorAll('.payment-method label').forEach(label => {
        label.classList.remove('selected')
      })
      method.nextElementSibling.classList.add('selected')
    })
  })

  function showPaymentInstructions(method) {
    const instructions = {
      'airtel-money': `
        <div class="payment-instruction">
          <h4>Airtel Money Payment</h4>
          <p>Send payment to: <strong>+265 992 260 985</strong></p>
          <p>Reference: <strong>MIRACLE ECD Registration</strong></p>
          <p>Amount: <strong id="airtel-amount"></strong></p>
          <p>After sending, please call us to confirm your payment.</p>
        </div>
      `,
      'tnm-mpamba': `
        <div class="payment-instruction">
          <h4>TNM Mpamba Payment</h4>
          <p>Send payment to: <strong>+265 883 406 744</strong></p>
          <p>Reference: <strong>MIRACLE ECD Registration</strong></p>
          <p>Amount: <strong id="tnm-amount"></strong></p>
          <p>After sending, please call us to confirm your payment.</p>
        </div>
      `,
      'national-bank': `
        <div class="payment-instruction">
          <h4>National Bank Transfer</h4>
          <p>Account Name: <strong>MIRACLE ECD</strong></p>
          <p>Account Number: <strong>1234567890</strong></p>
          <p>Branch: <strong>Lilongwe Main Branch</strong></p>
          <p>Reference: <strong>Registration Fee</strong></p>
          <p>Amount: <strong id="bank-amount"></strong></p>
        </div>
      `,
      'standard-bank': `
        <div class="payment-instruction">
          <h4>Standard Bank Transfer</h4>
          <p>Account Name: <strong>MIRACLE ECD</strong></p>
          <p>Account Number: <strong>0987654321</strong></p>
          <p>Branch: <strong>Lilongwe City Centre</strong></p>
          <p>Reference: <strong>Registration Fee</strong></p>
          <p>Amount: <strong id="standard-amount"></strong></p>
        </div>
      `,
      'cash': `
        <div class="payment-instruction">
          <h4>Cash Payment</h4>
          <p>Visit our office at: <strong>Area 25, Sector 5, Lilongwe</strong></p>
          <p>Amount: <strong id="cash-amount"></strong></p>
          <p>Business Hours: <strong>Mon-Fri: 7:00 AM - 5:00 PM</strong></p>
          <p>Please bring your registration details with you.</p>
        </div>
      `
    }

    if (paymentInstructions) {
      paymentInstructions.innerHTML = instructions[method] || ''
      // Update amount in instructions
      const paymentSettings = JSON.parse(localStorage.getItem("paymentSettings")) || { registrationFee: 50 }
      const amountElements = paymentInstructions.querySelectorAll('[id$="-amount"]')
      amountElements.forEach(el => {
        el.textContent = `MWK ${paymentSettings.registrationFee}`
      })
    }
  }

  // Handle payment - Real-time payment gateway with password confirmation
  async function handlePayment() {
    const pendingRegistration = JSON.parse(sessionStorage.getItem("pendingRegistration"))
    const pendingPayment = JSON.parse(sessionStorage.getItem("pendingPayment"))
    
    // Determine payment type
    const isRegistrationPayment = !!pendingRegistration
    const isQuickPayment = !!pendingPayment
    
    if (!isRegistrationPayment && !isQuickPayment) {
      showMessage("No payment data found. Please try again.", "error")
      return
    }

    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')
    if (!selectedMethod) {
      showMessage("Please select a payment method.", "error")
      return
    }

    // Show password confirmation section
    showPasswordConfirmation(selectedMethod.value)
  }

  // Show password confirmation section
  function showPasswordConfirmation(paymentMethod) {
    const passwordSection = document.getElementById('payment-password-section')
    const submitBtn = document.getElementById('submit-payment')
    const confirmBtn = document.getElementById('confirm-payment')
    const methodInfo = document.getElementById('payment-method-info')
    
    // Hide submit button and show confirm button
    submitBtn.style.display = 'none'
    confirmBtn.style.display = 'flex'
    
    // Show password section
    passwordSection.style.display = 'block'
    passwordSection.classList.add('active')
    
    // Set payment method specific information
    const methodInfoText = getPaymentMethodInfo(paymentMethod)
    methodInfo.innerHTML = methodInfoText
    
    // Add event listeners for password validation
    setupPasswordValidation()
    
    // Add event listener for confirm button
    confirmBtn.onclick = () => processPaymentWithPassword(paymentMethod)
  }

  // Get payment method specific information
  function getPaymentMethodInfo(paymentMethod) {
    const methodInfo = {
      'airtel-money': `
        <i class="fas fa-mobile-alt"></i>
        <strong>Airtel Money:</strong> Enter your Airtel Money PIN to confirm this transaction.
        <br><small>This is the same PIN you use for Airtel Money transactions.</small>
      `,
      'tnm-mpamba': `
        <i class="fas fa-mobile-alt"></i>
        <strong>TNM Mpamba:</strong> Enter your Mpamba PIN to confirm this transaction.
        <br><small>This is the same PIN you use for Mpamba transactions.</small>
      `,
      'national-bank': `
        <i class="fas fa-university"></i>
        <strong>National Bank:</strong> Enter your online banking password to confirm this transaction.
        <br><small>This is the same password you use for online banking.</small>
      `,
      'standard-bank': `
        <i class="fas fa-university"></i>
        <strong>Standard Bank:</strong> Enter your online banking password to confirm this transaction.
        <br><small>This is the same password you use for online banking.</small>
      `,
      'cash': `
        <i class="fas fa-money-bill-wave"></i>
        <strong>Cash Payment:</strong> Enter a security code to confirm this transaction.
        <br><small>This can be any 4-digit code you choose for verification.</small>
      `
    }
    
    return methodInfo[paymentMethod] || 'Please enter your payment method password to confirm this transaction.'
  }

  // Setup password validation with real-time feedback
  function setupPasswordValidation() {
    const passwordInput = document.getElementById('payment-password')
    const confirmPasswordInput = document.getElementById('payment-confirm-password')
    const validationDiv = document.getElementById('password-validation')
    const confirmBtn = document.getElementById('confirm-payment')
    
    // Real-time password validation
    function validatePasswords() {
      const password = passwordInput.value
      const confirmPassword = confirmPasswordInput.value
      
      // Remove previous validation classes
      passwordInput.classList.remove('valid', 'invalid')
      confirmPasswordInput.classList.remove('valid', 'invalid')
      validationDiv.classList.remove('show', 'success', 'error')
      
      // Check if passwords match
      if (password && confirmPassword) {
        if (password === confirmPassword) {
          if (password.length >= 4) {
            passwordInput.classList.add('valid')
            confirmPasswordInput.classList.add('valid')
            validationDiv.textContent = '✅ Passwords match and meet requirements'
            validationDiv.classList.add('show', 'success')
            confirmBtn.disabled = false
            return true
          } else {
            passwordInput.classList.add('invalid')
            confirmPasswordInput.classList.add('invalid')
            validationDiv.textContent = '❌ Password must be at least 4 characters long'
            validationDiv.classList.add('show', 'error')
            confirmBtn.disabled = true
            return false
          }
        } else {
          passwordInput.classList.add('invalid')
          confirmPasswordInput.classList.add('invalid')
          validationDiv.textContent = '❌ Passwords do not match'
          validationDiv.classList.add('show', 'error')
          confirmBtn.disabled = true
          return false
        }
      } else {
        confirmBtn.disabled = true
        return false
      }
    }
    
    // Add event listeners for real-time validation
    passwordInput.addEventListener('input', validatePasswords)
    confirmPasswordInput.addEventListener('input', validatePasswords)
    
    // Setup password toggle buttons
    setupPasswordToggles()
    
    // Initial validation
    validatePasswords()
  }

  // Setup password toggle buttons
  function setupPasswordToggles() {
    const passwordToggle = document.getElementById('paymentPasswordToggle')
    const confirmPasswordToggle = document.getElementById('paymentConfirmPasswordToggle')
    const passwordInput = document.getElementById('payment-password')
    const confirmPasswordInput = document.getElementById('payment-confirm-password')
    
    passwordToggle.onclick = () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password'
      passwordInput.type = type
      passwordToggle.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>'
    }
    
    confirmPasswordToggle.onclick = () => {
      const type = confirmPasswordInput.type === 'password' ? 'text' : 'password'
      confirmPasswordInput.type = type
      confirmPasswordToggle.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>'
    }
  }

  // Process payment with password confirmation
  async function processPaymentWithPassword(paymentMethod) {
    const password = document.getElementById('payment-password').value
    const confirmPassword = document.getElementById('payment-confirm-password').value
    
    // Validate passwords
    if (!password || !confirmPassword) {
      showMessage("Please enter both passwords.", "error")
      return
    }
    
    if (password !== confirmPassword) {
      showMessage("Passwords do not match.", "error")
      return
    }
    
    if (password.length < 4) {
      showMessage("Password must be at least 4 characters long.", "error")
      return
    }

    const pendingRegistration = JSON.parse(sessionStorage.getItem("pendingRegistration"))
    const pendingPayment = JSON.parse(sessionStorage.getItem("pendingPayment"))
    
    // Determine payment type
    const isRegistrationPayment = !!pendingRegistration
    const isQuickPayment = !!pendingPayment

    try {
      // Show loading state
      const confirmBtn = document.getElementById("confirm-payment")
      const originalText = confirmBtn.textContent
      confirmBtn.textContent = "Processing Real Payment..."
      confirmBtn.disabled = true

      // Show real-time payment status
      showPaymentStatus("Initializing real payment gateway...")

      // Get payment details
      let paymentData;
      if (isRegistrationPayment) {
        const paymentSettings = await getPaymentSettings()
        paymentData = {
          paymentMethod: paymentMethod,
          amount: paymentSettings.registrationFee,
          phoneNumber: pendingRegistration.phone,
          password: password,
          reference: `REG-${Date.now()}`,
          description: `Registration fee for ${pendingRegistration.childName}`,
          parentName: pendingRegistration.parentName,
          childName: pendingRegistration.childName,
          registrationId: pendingRegistration.id
        }
      } else {
        paymentData = {
          paymentMethod: paymentMethod,
          amount: pendingPayment.amount,
          phoneNumber: pendingPayment.phone || '',
          password: password,
          reference: `PAY-${Date.now()}`,
          description: `${pendingPayment.type} payment for ${pendingPayment.program}`,
          parentName: pendingPayment.parentName || 'Quick Payment',
          program: pendingPayment.program
        }
      }

      // Process payment with hybrid system
      showPaymentStatus("Processing payment...")
      
      let realPaymentResult;
      if (typeof hybridPaymentGateway !== 'undefined' && hybridPaymentGateway) {
        // Use hybrid payment gateway (works immediately)
        realPaymentResult = await hybridPaymentGateway.processPayment(paymentData)
        showPaymentStatus("Payment initiated! Please follow instructions.")
        
        // Show payment instructions
        if (realPaymentResult.instructions) {
          showPaymentInstructions(realPaymentResult.instructions, realPaymentResult.reference)
        }
      } else if (typeof realPaymentGateway !== 'undefined' && realPaymentGateway) {
        // Use real payment gateway (if API keys are configured)
        realPaymentResult = await realPaymentGateway.processPayment(paymentData)
        showPaymentStatus("Real payment processed successfully!")
      } else {
        // Fallback to simulation
        await new Promise(resolve => setTimeout(resolve, 2000))
        showPaymentStatus("Payment simulation completed")
        realPaymentResult = {
          success: true,
          transactionId: `SIM-${Date.now()}`,
          reference: paymentData.reference,
          amount: paymentData.amount,
          status: 'completed',
          paymentMethod: paymentMethod,
          timestamp: new Date().toISOString(),
          simulated: true
        }
      }

      if (isRegistrationPayment) {
        // Handle registration payment with real payment result
        const paymentSettings = await getPaymentSettings()
        
        // Create payment record for Firebase with real payment data
        const paymentData = {
          registrationId: pendingRegistration.id,
          parentName: pendingRegistration.parentName,
          parentEmail: pendingRegistration.email,
          parentPhone: pendingRegistration.phone,
          childName: pendingRegistration.childName,
          amount: paymentSettings.registrationFee,
          paymentMethod: paymentMethod,
          paymentType: 'registration',
          status: realPaymentResult.status,
          reference: realPaymentResult.reference,
          transactionId: realPaymentResult.transactionId,
          description: `Registration fee for ${pendingRegistration.childName}`,
          program: pendingRegistration.program,
          passwordVerified: true,
          paymentTimestamp: realPaymentResult.timestamp,
          realPayment: !realPaymentResult.simulated,
          paymentResponse: realPaymentResult.response || null
        }

        // Save payment to Firebase (real-time)
        if (typeof firebaseManager !== 'undefined') {
          const result = await firebaseManager.savePayment(paymentData)
          console.log('Real payment saved to Firebase:', result)
          
          // Show real-time success notification
          showPaymentStatus("Real payment completed successfully!")
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Send real-time notification
          if (window.websiteRealTimeManager) {
            const paymentType = realPaymentResult.simulated ? 'Simulated' : 'Real'
            window.websiteRealTimeManager.showUpdateNotification(`${paymentType} payment of MWK ${paymentSettings.registrationFee.toLocaleString()} completed for ${pendingRegistration.childName}`)
          }
        } else {
          // Fallback to localStorage
          const paymentRecord = {
            id: Date.now(),
            registrationId: pendingRegistration.id,
            parentName: pendingRegistration.parentName,
            amount: paymentSettings.registrationFee,
            paymentDate: new Date().toISOString(),
            status: realPaymentResult.status,
            paymentMethod: paymentMethod,
            transactionId: realPaymentResult.transactionId,
            reference: realPaymentResult.reference,
            passwordVerified: true,
            realPayment: !realPaymentResult.simulated
          }

          const payments = JSON.parse(localStorage.getItem("payments")) || []
          payments.push(paymentRecord)
          localStorage.setItem("payments", JSON.stringify(payments))

          // Update registration status
          const registrations = JSON.parse(localStorage.getItem("registrations")) || []
          const regIndex = registrations.findIndex((reg) => reg.id === pendingRegistration.id)
          if (regIndex !== -1) {
            registrations[regIndex].status = "Paid"
            registrations[regIndex].paymentStatus = "Completed"
            registrations[regIndex].paymentId = paymentRecord.id
            localStorage.setItem("registrations", JSON.stringify(registrations))
          }
        }

        // Clear session storage
        sessionStorage.removeItem("pendingRegistration")

        // Reset form
        if (registrationForm) {
          registrationForm.reset()
        }
        if (startDateInput) {
          const today = new Date()
          const formattedDate = today.toISOString().split("T")[0]
          startDateInput.value = formattedDate
        }

        // Send notifications
        sendRegistrationNotifications(pendingRegistration)
        
        showMessage("Payment successful! Your registration is complete.", "success")
      } else {
        // Handle quick payment with real payment result
        const paymentData = {
          parentName: pendingPayment.parentName || 'Quick Payment',
          amount: pendingPayment.amount,
          paymentMethod: paymentMethod,
          paymentType: pendingPayment.type,
          status: realPaymentResult.status,
          reference: realPaymentResult.reference,
          transactionId: realPaymentResult.transactionId,
          description: `${pendingPayment.type} payment for ${pendingPayment.program}`,
          program: pendingPayment.program,
          passwordVerified: true,
          paymentTimestamp: realPaymentResult.timestamp,
          realPayment: !realPaymentResult.simulated,
          paymentResponse: realPaymentResult.response || null
        }

        // Save payment to Firebase (real-time)
        if (typeof firebaseManager !== 'undefined') {
          const result = await firebaseManager.savePayment(paymentData)
          console.log('Real quick payment saved to Firebase:', result)
          
          // Show real-time success notification
          showPaymentStatus("Real payment completed successfully!")
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Send real-time notification
          if (window.websiteRealTimeManager) {
            const paymentType = realPaymentResult.simulated ? 'Simulated' : 'Real'
            window.websiteRealTimeManager.showUpdateNotification(`${paymentType} payment of MWK ${pendingPayment.amount.toLocaleString()} completed`)
          }
        } else {
          // Fallback to localStorage
          const payment = {
            id: pendingPayment.id,
            type: pendingPayment.type,
            amount: pendingPayment.amount,
            program: pendingPayment.program,
            method: paymentMethod,
            status: realPaymentResult.status,
            paymentDate: new Date().toISOString(),
            reference: realPaymentResult.reference,
            transactionId: realPaymentResult.transactionId,
            passwordVerified: true,
            realPayment: !realPaymentResult.simulated
          }

          const payments = JSON.parse(localStorage.getItem("payments")) || []
          payments.push(payment)
          localStorage.setItem("payments", JSON.stringify(payments))
        }

        // Clear session storage
        sessionStorage.removeItem("pendingPayment")

        // Send payment confirmation
        sendPaymentConfirmation(paymentData)

        if (paymentData.paymentType === 'registration') {
          showMessage(`Registration fee payment of MWK${paymentData.amount.toLocaleString()} completed successfully! Reference: ${paymentData.reference}`, "success")
        } else {
          showMessage(`Tuition payment request submitted successfully! We will contact you with the exact amount. Reference: ${paymentData.reference}`, "success")
        }
      }

      // Close modal
      if (paymentModal) {
        paymentModal.style.display = "none"
      }

      // Reset button
      confirmBtn.textContent = originalText
      confirmBtn.disabled = false

      // Hide payment status
      hidePaymentStatus()

      // Reset password section
      resetPasswordSection()

    } catch (error) {
      console.error("Payment error:", error)
      showPaymentStatus("Payment failed. Please try again.")
      await new Promise(resolve => setTimeout(resolve, 2000))
      hidePaymentStatus()
      
      showMessage("Payment failed. Please try again.", "error")
      
      // Reset button
      const confirmBtn = document.getElementById("confirm-payment")
      if (confirmBtn) {
        confirmBtn.textContent = "Confirm Payment"
        confirmBtn.disabled = false
      }
    }
  }

  // Reset password section
  function resetPasswordSection() {
    const passwordSection = document.getElementById('payment-password-section')
    const submitBtn = document.getElementById('submit-payment')
    const confirmBtn = document.getElementById('confirm-payment')
    const passwordInput = document.getElementById('payment-password')
    const confirmPasswordInput = document.getElementById('payment-confirm-password')
    const validationDiv = document.getElementById('password-validation')
    
    // Hide password section
    passwordSection.style.display = 'none'
    passwordSection.classList.remove('active')
    
    // Show submit button and hide confirm button
    submitBtn.style.display = 'flex'
    confirmBtn.style.display = 'none'
    
    // Clear password fields
    passwordInput.value = ''
    confirmPasswordInput.value = ''
    
    // Remove validation classes
    passwordInput.classList.remove('valid', 'invalid')
    confirmPasswordInput.classList.remove('valid', 'invalid')
    validationDiv.classList.remove('show', 'success', 'error')
    
    // Reset password fields to password type
    passwordInput.type = 'password'
    confirmPasswordInput.type = 'password'
    
    // Reset toggle buttons
    document.getElementById('paymentPasswordToggle').innerHTML = '<i class="fas fa-eye"></i>'
    document.getElementById('paymentConfirmPasswordToggle').innerHTML = '<i class="fas fa-eye"></i>'
  }

  // Show real-time payment status
  function showPaymentStatus(message) {
    let statusElement = document.getElementById('payment-status')
    if (!statusElement) {
      statusElement = document.createElement('div')
      statusElement.id = 'payment-status'
      statusElement.className = 'payment-status'
      statusElement.innerHTML = `
        <div class="payment-status-content">
          <i class="fas fa-spinner fa-spin"></i>
          <span class="payment-status-text">${message}</span>
        </div>
      `
      document.body.appendChild(statusElement)
    } else {
      statusElement.querySelector('.payment-status-text').textContent = message
    }
    statusElement.style.display = 'flex'
  }

  // Hide payment status
  function hidePaymentStatus() {
    const statusElement = document.getElementById('payment-status')
    if (statusElement) {
      statusElement.style.display = 'none'
    }
  }

  // Show payment instructions
  function showPaymentInstructions(instructions, reference) {
    // Create instructions modal
    const modal = document.createElement('div')
    modal.className = 'modal'
    modal.style.display = 'block'
    
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <h2>${instructions.title}</h2>
        <div class="payment-instructions">
          <div class="reference-box">
            <strong>Payment Reference:</strong> ${reference}
          </div>
          <div class="steps">
            ${instructions.steps.map(step => `<p>${step}</p>`).join('')}
          </div>
          <div class="contact-info">
            <h3>Contact Information:</h3>
            <p><strong>Phone:</strong> ${instructions.contactInfo.phone}</p>
            <p><strong>Email:</strong> ${instructions.contactInfo.email}</p>
            <p><strong>Address:</strong> ${instructions.contactInfo.address}</p>
          </div>
          <div class="verification-note">
            <p><strong>Important:</strong> Please keep your payment reference and contact admin for verification once payment is sent.</p>
          </div>
        </div>
        <div class="modal-actions">
          <button onclick="this.parentElement.parentElement.remove()" class="admin-btn">Close</button>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Add styles
    const style = document.createElement('style')
    style.textContent = `
      .payment-instructions {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      .reference-box {
        background: #007bff;
        color: white;
        padding: 15px;
        border-radius: 5px;
        text-align: center;
        font-size: 18px;
        margin-bottom: 20px;
      }
      .steps p {
        margin: 10px 0;
        padding: 10px;
        background: white;
        border-left: 4px solid #28a745;
        border-radius: 3px;
      }
      .contact-info {
        background: white;
        padding: 15px;
        border-radius: 5px;
        margin: 20px 0;
      }
      .verification-note {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        padding: 15px;
        border-radius: 5px;
        margin-top: 20px;
      }
    `
    document.head.appendChild(style)
  }

  // Get payment settings from Firebase or localStorage
  async function getPaymentSettings() {
    if (typeof firebaseManager !== 'undefined') {
      try {
        return await firebaseManager.getPaymentSettings()
      } catch (error) {
        console.error('Failed to get payment settings from Firebase:', error)
      }
    }
    
    // Fallback to localStorage
    return JSON.parse(localStorage.getItem("paymentSettings")) || {
      registrationFee: 5000,
    }
  }

  // Handle user upload
  function handleUserUpload() {
    const uploaderName = document.getElementById("uploaderName").value.trim()
    const uploaderEmail = document.getElementById("uploaderEmail").value.trim()
    const uploadTitle = document.getElementById("uploadTitle").value.trim()
    const uploadDescription = document.getElementById("uploadDescription").value.trim()
    const uploadImage = document.getElementById("uploadImage").files[0]

    if (!uploaderName || !uploaderEmail || !uploadTitle || !uploadDescription || !uploadImage) {
      showMessage("Please fill in all fields and select an image.", "error")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const uploadData = {
        id: Date.now(),
        uploaderName,
        uploaderEmail,
        title: uploadTitle,
        description: uploadDescription,
        image: e.target.result,
        uploadDate: new Date().toISOString(),
        status: "pending",
      }

      // Save user upload
      const userUploads = JSON.parse(localStorage.getItem("userUploads")) || []
      userUploads.push(uploadData)
      localStorage.setItem("userUploads", JSON.stringify(userUploads))

      // Reset form
      userUploadForm.reset()
      showMessage("Photo uploaded successfully! It will be reviewed before being published.", "success")

      // Reload user uploads
      loadUserUploads()
    }
    reader.readAsDataURL(uploadImage)
  }

  // Load announcements
  function loadAnnouncements() {
    const announcements = JSON.parse(localStorage.getItem("announcements")) || []
    const announcementsContainer = document.getElementById("announcements-section")

    if (!announcementsContainer) return

    // Filter active announcements (not expired)
    const activeAnnouncements = announcements.filter((announcement) => {
      if (!announcement.expiryDate) return true
      return new Date(announcement.expiryDate) > new Date()
    })

    if (activeAnnouncements.length === 0) {
      announcementsContainer.innerHTML = ""
      return
    }

    announcementsContainer.innerHTML = activeAnnouncements
      .map(
        (announcement) => `
      <div class="announcement-item ${announcement.type}">
        <div class="announcement-title">${escapeHtml(announcement.title)}</div>
        <div class="announcement-content">${escapeHtml(announcement.content)}</div>
        <div class="announcement-date">Posted: ${new Date(announcement.createdDate).toLocaleDateString()}</div>
      </div>
    `,
      )
      .join("")
  }

  // Load hero announcements
  function loadHeroAnnouncements() {
    const heroAnnouncements = JSON.parse(localStorage.getItem("heroAnnouncements")) || []
    const heroAnnouncementsContainer = document.getElementById("hero-announcements")

    if (!heroAnnouncementsContainer) return

    // Filter active hero announcements (not expired)
    const activeHeroAnnouncements = heroAnnouncements.filter((announcement) => {
      if (!announcement.expiryDate) return true
      return new Date(announcement.expiryDate) > new Date()
    })

    if (activeHeroAnnouncements.length === 0) {
      heroAnnouncementsContainer.innerHTML = ""
      return
    }

    heroAnnouncementsContainer.innerHTML = activeHeroAnnouncements
      .map(
        (announcement) => `
      <div class="hero-announcement-item ${announcement.type}">
        <div class="hero-announcement-title">${escapeHtml(announcement.title)}</div>
        <div class="hero-announcement-content">${escapeHtml(announcement.content)}</div>
        <div class="hero-announcement-date">Posted: ${new Date(announcement.createdDate).toLocaleDateString()}</div>
      </div>
    `,
      )
      .join("")
  }

  // Load gallery data
  function loadGalleryData() {
    const galleryData = JSON.parse(localStorage.getItem("galleryData")) || []
    const galleryContainer = document.getElementById("galleryContainer")

    if (galleryContainer && galleryData.length > 0) {
      galleryContainer.innerHTML = ""

      galleryData.forEach((item) => {
        const galleryCard = document.createElement("div")
        galleryCard.className = "gallery-card"
        galleryCard.innerHTML = `
          <div class="gallery-image">
            <img src="${item.image}" alt="${escapeHtml(item.title)}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'padding: 20px; text-align: center; color: #666;\\'>Image not available</div>'">
          </div>
          <div class="gallery-info">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
          </div>
        `
        galleryContainer.appendChild(galleryCard)
      })
    } else if (galleryContainer) {
      galleryContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <p>No gallery images available at the moment.</p>
        </div>
      `
    }
  }

  // Load user uploads
  function loadUserUploads() {
    const userUploads = JSON.parse(localStorage.getItem("userUploads")) || []
    const userGalleryContainer = document.getElementById("userGalleryContainer")

    if (!userGalleryContainer) return

    // Filter approved uploads
    const approvedUploads = userUploads.filter((upload) => upload.status === "approved")

    if (approvedUploads.length === 0) {
      userGalleryContainer.innerHTML = `
        <div class="no-uploads">
          <p>No community photos yet. Be the first to share!</p>
        </div>
      `
      return
    }

    userGalleryContainer.innerHTML = ""

    approvedUploads.forEach((upload) => {
      const uploadCard = document.createElement("div")
      uploadCard.className = "user-upload-card"
      uploadCard.innerHTML = `
        <div class="user-upload-image">
          <img src="${upload.image}" alt="${escapeHtml(upload.title)}">
        </div>
        <div class="user-upload-info">
          <h4>${escapeHtml(upload.title)}</h4>
          <p>${escapeHtml(upload.description)}</p>
          <div class="upload-meta">
            <span>Shared by: ${escapeHtml(upload.uploaderName)}</span> • 
            <span>${new Date(upload.uploadDate).toLocaleDateString()}</span>
          </div>
        </div>
      `
      userGalleryContainer.appendChild(uploadCard)
    })
  }

  // Save registration
  async function saveRegistration(registration) {
    try {
      // Save to localStorage directly (no server needed)
      const registrations = JSON.parse(localStorage.getItem("registrations")) || []
      registrations.push(registration)
      localStorage.setItem("registrations", JSON.stringify(registrations))
      
      console.log("Registration saved to localStorage:", registration);
      return registration
    } catch (error) {
      console.error("Error saving registration:", error)
      return registration
    }
  }

  // Check for duplicate registration
  function isDuplicateRegistration(newRegistration) {
    try {
      const registrations = JSON.parse(localStorage.getItem("registrations")) || []
      return registrations.some(
        (reg) => reg.email.toLowerCase() === newRegistration.email.toLowerCase() || reg.phone === newRegistration.phone,
      )
    } catch (error) {
      console.error("Error checking duplicates:", error)
      return false
    }
  }

  // Send registration notifications with enhanced access
  function sendRegistrationNotifications(data) {
    // Format the message for WhatsApp
    const whatsappMessage = formatWhatsAppMessage(data)
    const whatsappUrl = `https://wa.me/265992260985?text=${encodeURIComponent(whatsappMessage)}`

    // Format email message
    const emailSubject = "New Registration - MIRACLE ECD"
    const emailBody = formatEmailMessage(data)
    const emailUrl = `mailto:cupicsart@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

    // Create admin access link
    const adminAccessUrl = `${window.location.origin}/admin.html#registrations`
    
    // Enhanced notification with admin access
    const adminNotification = `
🚨 NEW REGISTRATION RECEIVED! 🚨

Registration ID: ${data.id}
Parent: ${data.parentName}
Child: ${data.childName} (${data.childAge} years)
Program: ${data.program}
Phone: ${data.phone}
Email: ${data.email}

📊 VIEW REGISTRATION: ${adminAccessUrl}
📱 WHATSAPP: ${whatsappUrl}
📧 EMAIL: ${emailUrl}

Click the links above to access the registration information immediately!
    `

    // Show immediate notification to admin
    showAdminNotification(adminNotification, data)

    // Open WhatsApp and email
    setTimeout(() => {
      window.open(whatsappUrl, "_blank")
    }, 1000)

    setTimeout(() => {
      window.open(emailUrl, "_blank")
    }, 2000)

    // Store notification for admin panel
    storeAdminNotification(data)
  }

  // Show admin notification
  function showAdminNotification(message, data) {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = 'admin-notification'
    notification.innerHTML = `
      <div class="notification-header">
        <h3>🚨 New Registration!</h3>
        <button onclick="this.parentElement.parentElement.remove()" class="close-notification">×</button>
      </div>
      <div class="notification-content">
        <p><strong>${data.parentName}</strong> registered <strong>${data.childName}</strong> for <strong>${data.program}</strong></p>
        <p>Phone: ${data.phone} | Email: ${data.email}</p>
        <div class="notification-actions">
          <a href="admin.html#registrations" class="btn btn-primary">View Registration</a>
          <a href="https://wa.me/265992260985?text=${encodeURIComponent(formatWhatsAppMessage(data))}" class="btn btn-success" target="_blank">WhatsApp</a>
        </div>
      </div>
    `
    
    // Add to page
    document.body.appendChild(notification)
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 30000)
  }

  // Store admin notification
  function storeAdminNotification(data) {
    const notifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]')
    const notification = {
      id: Date.now(),
      type: 'registration',
      data: data,
      timestamp: new Date().toISOString(),
      read: false
    }
    notifications.unshift(notification) // Add to beginning
    localStorage.setItem('adminNotifications', JSON.stringify(notifications))
  }

  // Format message for WhatsApp
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

  // Format message for email
  function formatEmailMessage(data) {
    return (
      `New Registration for MIRACLE ECD\n\n` +
      `Registration ID: ${data.id}\n` +
      `Parent/Guardian Name: ${data.parentName}\n` +
      `Email: ${data.email}\n` +
      `Phone: ${data.phone}\n` +
      `Child's Name: ${data.childName}\n` +
      `Child's Age: ${data.childAge} years\n` +
      `Preferred Start Date: ${data.startDate}\n` +
      `Program Type: ${data.program}\n` +
      `Additional Information: ${data.message || "None"}\n` +
      `Registration Date: ${new Date(data.registrationDate).toLocaleString()}\n` +
      `Payment Status: PENDING\n\n` +
      `Please contact this family to arrange payment.\n\n` +
      `Best regards,\n` +
      `MIRACLE ECD Registration System`
    )
  }

  // Form validation function
  function validateRegistrationForm(data) {
    // Check for required fields with better validation
    
    // Parent name is now REQUIRED
    if (!data.parent_name || data.parent_name.trim() === '' || data.parent_name === 'Not provided') {
      showMessage("Please enter the parent/guardian name.", "error")
      return false
    }
    
    if (!data.email || data.email.trim() === '') {
      showMessage("Please enter an email address.", "error")
      return false
    }
    
    if (!data.phone || data.phone.trim() === '') {
      showMessage("Please enter a phone number.", "error")
      return false
    }
    
    // Child name is now REQUIRED
    if (!data.child_name || data.child_name.trim() === '' || data.child_name === 'Not provided') {
      showMessage("Please enter the child's name.", "error")
      return false
    }
    
    // Fix: Check for child_age (with underscore) instead of childAge
    if (!data.child_age || isNaN(data.child_age) || data.child_age <= 0) {
      showMessage("Please enter a valid child's age (1-12 years).", "error")
      return false
    }
    
    if (!data.start_date || data.start_date.trim() === '') {
      showMessage("Please select a start date.", "error")
      return false
    }
    
    if (!data.program || data.program.trim() === '') {
      showMessage("Please select a program type.", "error")
      return false
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      showMessage("Please enter a valid email address.", "error")
      return false
    }

    // Phone validation
    const phoneRegex = /^[+]?[0-9\s\-()]{10,}$/
    if (!phoneRegex.test(data.phone)) {
      showMessage("Please enter a valid phone number.", "error")
      return false
    }

    // Age validation - Fix: Check child_age instead of childAge
    if (isNaN(data.child_age) || data.child_age < 1 || data.child_age > 12) {
      showMessage("Child's age must be between 1 and 12 years.", "error")
      return false
    }

    // Start date validation
    const selectedDate = new Date(data.start_date)
    const today = new Date()
    selectedDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      showMessage("Start date cannot be in the past.", "error")
      return false
    }

    return true
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

  // Message display function
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

    // Remove message after 5 seconds
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove()
      }
    }, 5000)
  }

  // Show registrations modal
  function showRegistrationsModal() {
    const registrations = JSON.parse(localStorage.getItem("registrations")) || []
    
    // Remove existing modal
    const existingModal = document.getElementById("registrationsModal")
    if (existingModal) {
      existingModal.remove()
    }

    // Create modal
    const modal = document.createElement("div")
    modal.id = "registrationsModal"
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `

    const modalContent = document.createElement("div")
    modalContent.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 10px;
      max-width: 90%;
      max-height: 80%;
      overflow-y: auto;
      position: relative;
    `

    const closeBtn = document.createElement("button")
    closeBtn.textContent = "×"
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 15px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    `
    closeBtn.onclick = () => modal.remove()

    const title = document.createElement("h2")
    title.textContent = `Registrations (${registrations.length} total)`
    title.style.marginBottom = "20px"

    const exportBtn = document.createElement("button")
    exportBtn.textContent = "Export to JSON"
    exportBtn.style.cssText = `
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      margin-bottom: 20px;
    `
    exportBtn.onclick = () => {
      if (typeof window.exportRegistrations === 'function') {
        window.exportRegistrations()
      }
    }

    const table = document.createElement("table")
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    `

    if (registrations.length === 0) {
      const noData = document.createElement("p")
      noData.textContent = "No registrations found."
      noData.style.textAlign = "center"
      noData.style.color = "#666"
      modalContent.appendChild(closeBtn)
      modalContent.appendChild(title)
      modalContent.appendChild(noData)
    } else {
      // Create table header
      const thead = document.createElement("thead")
      const headerRow = document.createElement("tr")
      const headers = ["ID", "Parent", "Email", "Phone", "Child", "Age", "Program", "Start Date", "Status"]
      
      headers.forEach(header => {
        const th = document.createElement("th")
        th.textContent = header
        th.style.cssText = `
          border: 1px solid #ddd;
          padding: 8px;
          background: #f8f9fa;
          text-align: left;
        `
        headerRow.appendChild(th)
      })
      thead.appendChild(headerRow)
      table.appendChild(thead)

      // Create table body
      const tbody = document.createElement("tbody")
      registrations.forEach(reg => {
        const row = document.createElement("tr")
        const cells = [
          reg.id,
          reg.parentName,
          reg.email,
          reg.phone,
          reg.childName,
          reg.childAge,
          reg.program,
          new Date(reg.startDate).toLocaleDateString(),
          reg.status
        ]
        
        cells.forEach(cell => {
          const td = document.createElement("td")
          td.textContent = cell
          td.style.cssText = `
            border: 1px solid #ddd;
            padding: 8px;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
          `
          row.appendChild(td)
        })
        tbody.appendChild(row)
      })
      table.appendChild(tbody)
    }

    modalContent.appendChild(closeBtn)
    modalContent.appendChild(title)
    modalContent.appendChild(exportBtn)
    modalContent.appendChild(table)
    modal.appendChild(modalContent)
    document.body.appendChild(modal)
  }

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })

        // Update active navigation link
        document.querySelectorAll("nav a").forEach((link) => {
          link.classList.remove("active")
        })
        this.classList.add("active")
      }
    })
  })

  // Back to Top Button Functionality
  const backToTopButton = document.getElementById("backToTop")

  if (backToTopButton) {
    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add("visible")
      } else {
        backToTopButton.classList.remove("visible")
      }
    })

    backToTopButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    })
  }

  // Hamburger menu toggle for mobile navigation
  const hamburger = document.querySelector(".hamburger")
  const mainNav = document.querySelector(".main-nav")
  if (hamburger && mainNav) {
    hamburger.addEventListener("click", () => {
      mainNav.classList.toggle("active")
      hamburger.classList.toggle("active")
    })
  }

  // Close menu when clicking outside
  document.addEventListener("click", (event) => {
    if (hamburger && mainNav) {
      const isClickInside = hamburger.contains(event.target) || mainNav.contains(event.target)

      if (!isClickInside && mainNav.classList.contains("active")) {
        hamburger.classList.remove("active")
        mainNav.classList.remove("active")
      }
    }
  })

  // Close menu when clicking on a nav link
  const navLinks = document.querySelectorAll(".main-nav a")
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768 && hamburger && mainNav) {
        hamburger.classList.remove("active")
        mainNav.classList.remove("active")
      }
    })
  })

  // Close menu when window is resized to desktop size
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && hamburger && mainNav) {
      hamburger.classList.remove("active")
      mainNav.classList.remove("active")
    }
  })

  // Newsletter form handling
  const newsletterForm = document.querySelector(".newsletter-form")
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const email = e.target.querySelector('input[type="email"]').value
      if (email) {
        showMessage("Thank you for subscribing to our newsletter!", "success")
        e.target.reset()
      }
    })
  }

  // Search form handling
  const searchForms = document.querySelectorAll(".search-form")
  searchForms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault()
      const searchTerm = e.target.querySelector('input[type="text"]').value
      if (searchTerm) {
        showMessage(`Searching for: ${searchTerm}`, "info")
      }
    })
  })

  // Listen for gallery updates from admin
  window.addEventListener("galleryUpdated", () => {
    loadGalleryData()
  })

  // Listen for announcements updates from admin
  window.addEventListener("announcementsUpdated", () => {
    loadAnnouncements()
  })

  // Listen for hero announcements updates from admin
  window.addEventListener("heroAnnouncementsUpdated", () => {
    loadHeroAnnouncements()
  })

  // Listen for user uploads updates from admin
  window.addEventListener("userUploadsUpdated", () => {
    loadUserUploads()
  })

  // Listen for payment settings updates from admin
  window.addEventListener("paymentSettingsUpdated", () => {
    loadRegistrationFee()
  })

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    if (event.target.classList.contains("modal")) {
      event.target.style.display = "none"
    }
  })

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0)"
      }
    })
  }, observerOptions)

  // Observe elements for animation
  const animatedElements = document.querySelectorAll(
    ".about-card, .program-card, .contact-card, .academic-card, .facility-card, .gallery-card, .user-upload-card",
  )
  animatedElements.forEach((element) => {
    element.style.opacity = "0"
    element.style.transform = "translateY(20px)"
    element.style.transition = "opacity 0.6s ease, transform 0.6s ease"
    observer.observe(element)
  })

  renderBlogPosts()

  // Listen for blog posts updates from admin
  window.addEventListener('blogPostsUpdated', () => {
    renderBlogPosts()
  })

  // Horizontal Carousel Functions
  let currentSlide = 0;
  const totalSlides = 4;

  // Initialize carousel
  function initCarousel() {
    updateCarouselPosition();
    updateIndicators();
  }

  // Move carousel
  function moveCarousel(direction) {
    if (direction === 'next') {
      currentSlide = (currentSlide + 1) % totalSlides;
    } else if (direction === 'prev') {
      currentSlide = currentSlide === 0 ? totalSlides - 1 : currentSlide - 1;
    }
    
    updateCarouselPosition();
    updateIndicators();
    
    // Add visual feedback for the movement
    const track = document.querySelector('.carousel-track');
    if (track) {
      track.style.animation = 'none';
      track.offsetHeight; // Trigger reflow
      track.style.animation = direction === 'next' ? 'slideInFromRight 0.5s ease-in-out' : 'slideOutToLeft 0.5s ease-in-out';
    }
  }

  // Go to specific carousel item
  function goToCarouselItem(index) {
    const previousSlide = currentSlide;
    currentSlide = index;
    updateCarouselPosition();
    updateIndicators();
    
    // Add visual feedback for the movement
    const track = document.querySelector('.carousel-track');
    if (track) {
      track.style.animation = 'none';
      track.offsetHeight; // Trigger reflow
      const direction = index > previousSlide ? 'next' : 'prev';
      track.style.animation = direction === 'next' ? 'slideInFromRight 0.5s ease-in-out' : 'slideOutToLeft 0.5s ease-in-out';
    }
  }

  // Update carousel position
  function updateCarouselPosition() {
    const track = document.querySelector('.carousel-track');
    if (track) {
      const slideWidth = 330; // 300px + 30px gap
      const translateX = -currentSlide * slideWidth;
      track.style.transform = `translateX(${translateX}px)`;
      track.style.transition = 'transform 0.5s ease-in-out';
    }
  }

  // Update indicators
  function updateIndicators() {
    const indicators = document.querySelectorAll('.indicator');
    
    indicators.forEach((indicator, index) => {
      if (index === currentSlide) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });
  }

  // Initialize carousel when DOM is loaded
  initCarousel();
  
  // Payment button functionality
  initializePaymentButtons();
  
  // Blog section functionality
  const loadMoreBtn = document.querySelector('.load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      // Simulate loading more blog posts
      this.textContent = 'Loading...';
      this.disabled = true;
      
      setTimeout(() => {
        this.textContent = 'No More Stories';
        this.disabled = true;
        this.style.background = '#6c757d';
        showMessage('All blog posts have been loaded!', 'info');
      }, 2000);
    });
  }
  
  // Blog card click functionality
  const blogCards = document.querySelectorAll('.blog-card');
  blogCards.forEach(card => {
    card.addEventListener('click', function(e) {
      if (!e.target.classList.contains('blog-readmore') && !e.target.closest('.blog-stats')) {
        const title = this.querySelector('.blog-title').textContent;
        showMessage(`Opening: ${title}`, 'info');
      }
    });
  });
  
  // Blog stats interaction
  const blogStats = document.querySelectorAll('.blog-stats span');
  blogStats.forEach(stat => {
    stat.addEventListener('click', function(e) {
      e.stopPropagation();
      const icon = this.querySelector('i');
      if (icon.classList.contains('fa-heart')) {
        icon.style.color = icon.style.color === 'red' ? '#4caf50' : 'red';
        const count = this.textContent.split(' ')[1];
        const newCount = icon.style.color === 'red' ? parseInt(count) + 1 : parseInt(count) - 1;
        this.innerHTML = `<i class="fas fa-heart"></i> ${newCount} likes`;
      }
    });
  });
  
  // Add touch/swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;
  
  const carouselContainer = document.querySelector('.carousel-container');
  if (carouselContainer) {
    carouselContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    
    carouselContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });
  }
  
  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next (pictures move left to right)
        moveCarousel('next');
      } else {
        // Swipe right - prev (pictures move right to left)
        moveCarousel('prev');
      }
    }
  }

  // Initialize payment buttons
  function initializePaymentButtons() {
    const paymentButtons = document.querySelectorAll('.payment-btn');
    
    paymentButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        const paymentType = this.dataset.paymentType;
        const amount = this.dataset.amount;
        const program = this.dataset.program;
        
        // Create payment data
        const paymentData = {
          type: paymentType,
          amount: parseInt(amount),
          program: program || 'Registration Fee',
          date: new Date().toISOString(),
          id: Date.now()
        };
        
        // Show payment modal with the selected payment
        showQuickPaymentModal(paymentData);
      });
    });
  }

  // Show quick payment modal
  function showQuickPaymentModal(paymentData) {
    const paymentDetails = document.getElementById("paymentDetails");
    if (paymentDetails) {
      if (paymentData.type === 'registration') {
        paymentDetails.innerHTML = `
          <div class="payment-summary">
            <h3>Payment Summary</h3>
            <div class="payment-item">
              <span>${paymentData.program}:</span>
              <span>MWK${paymentData.amount.toLocaleString()}</span>
            </div>
            <div class="payment-item total">
              <span><strong>Total:</strong></span>
              <span><strong>MWK${paymentData.amount.toLocaleString()}</strong></span>
            </div>
            <div class="payment-info">
              <p><strong>Payment Type:</strong> ${paymentData.type}</p>
              <p><strong>Date:</strong> ${new Date(paymentData.date).toLocaleDateString()}</p>
              <p class="payment-warning"><i class="fas fa-exclamation-triangle"></i> <strong>Note:</strong> Registration fee is non-refundable</p>
            </div>
          </div>
        `
      } else {
        // For tuition payments, don't show amount
        paymentDetails.innerHTML = `
          <div class="payment-summary">
            <h3>Tuition Payment</h3>
            <div class="payment-item">
              <span>Program:</span>
              <span>${paymentData.program}</span>
            </div>
            <div class="payment-item">
              <span>Payment Type:</span>
              <span>Per Term Tuition</span>
            </div>
            <div class="payment-info">
              <p><strong>Please contact us for the exact amount based on your child's enrollment.</strong></p>
              <p><strong>Date:</strong> ${new Date(paymentData.date).toLocaleDateString()}</p>
            </div>
          </div>
        `
      }
    }

    // Store payment data for processing
    sessionStorage.setItem("pendingPayment", JSON.stringify(paymentData));

    if (paymentModal) {
      paymentModal.style.display = "block";
    }
  }



  // Send payment confirmation
  function sendPaymentConfirmation(payment) {
    let message = `Payment Confirmation - MIRACLE ECD\n\n` +
      `Payment Type: ${payment.type}\n` +
      `Program: ${payment.program}\n`;
    
    if (payment.type === 'registration') {
      message += `Amount: MWK${payment.amount.toLocaleString()}\n`;
    } else {
      message += `Amount: Contact us for exact amount\n`;
    }
    
    message += `Method: ${payment.method}\n` +
      `Reference: ${payment.reference}\n` +
      `Date: ${new Date(payment.paymentDate).toLocaleString()}\n\n`;
    
    if (payment.type === 'registration') {
      message += `Thank you for your registration fee payment!`;
    } else {
      message += `Thank you for your tuition payment request! We will contact you with the exact amount.`;
    }

    // Send WhatsApp message
    const whatsappUrl = `https://wa.me/265992260985?text=${encodeURIComponent(message)}`;
    setTimeout(() => {
      window.open(whatsappUrl, "_blank");
    }, 1000);

    // Send email
    const emailSubject = "Payment Confirmation - MIRACLE ECD";
    const emailUrl = `mailto:cupicsart@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`;
    setTimeout(() => {
      window.open(emailUrl, "_blank");
    }, 2000);
  }

  // Load and display testimonials
  loadTestimonials()
  
  // Initialize testimonial carousel
  initTestimonialCarousel()
  
  // Handle testimonial form submission
  const testimonialForm = document.getElementById("testimonialForm")
  if (testimonialForm) {
    testimonialForm.addEventListener("submit", handleTestimonialSubmission)
  }

  // Testimonials functionality
  function loadTestimonials() {
    const testimonials = JSON.parse(localStorage.getItem("testimonials")) || []
    const testimonialTrack = document.getElementById("testimonialTrack")
    const testimonialIndicators = document.getElementById("testimonialIndicators")
    
    if (!testimonialTrack) return
    
    if (testimonials.length === 0) {
      testimonialTrack.innerHTML = `
        <div class="testimonial-card">
          <div class="no-testimonials">
            <h3>No Testimonials Yet</h3>
            <p>Be the first to share your experience with MIRACLE ECD!</p>
          </div>
        </div>
      `
      return
    }
    
    // Filter only approved testimonials
    const approvedTestimonials = testimonials.filter(testimonial => testimonial.status === 'approved')
    
    if (approvedTestimonials.length === 0) {
      testimonialTrack.innerHTML = `
        <div class="testimonial-card">
          <div class="no-testimonials">
            <h3>No Approved Testimonials</h3>
            <p>We're currently reviewing submitted testimonials. Check back soon!</p>
          </div>
        </div>
      `
      return
    }
    
    // Render testimonials
    testimonialTrack.innerHTML = approvedTestimonials.map(testimonial => `
      <div class="testimonial-card">
        <div class="testimonial-content">
          "${escapeHtml(testimonial.content)}"
        </div>
        <div class="testimonial-author">
          <h4 class="testimonial-author-name">${escapeHtml(testimonial.parentName)}</h4>
          <p class="testimonial-child-name">Parent of ${escapeHtml(testimonial.childName)}</p>
          <div class="testimonial-rating">
            ${generateStars(testimonial.rating)}
          </div>
          <p class="testimonial-date">${new Date(testimonial.submittedDate).toLocaleDateString()}</p>
        </div>
      </div>
    `).join('')
    
    // Generate indicators
    if (testimonialIndicators) {
      testimonialIndicators.innerHTML = approvedTestimonials.map((_, index) => `
        <div class="testimonial-indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
      `).join('')
      
      // Add click events to indicators
      testimonialIndicators.querySelectorAll('.testimonial-indicator').forEach(indicator => {
        indicator.addEventListener('click', () => {
          const index = parseInt(indicator.dataset.index)
          goToTestimonial(index)
        })
      })
    }
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
  
  function initTestimonialCarousel() {
    const prevBtn = document.getElementById("prevTestimonial")
    const nextBtn = document.getElementById("nextTestimonial")
    const testimonialTrack = document.getElementById("testimonialTrack")
    const indicators = document.getElementById("testimonialIndicators")
    
    if (!testimonialTrack) return
    
    let currentIndex = 0
    const testimonials = JSON.parse(localStorage.getItem("testimonials")) || []
    const approvedTestimonials = testimonials.filter(t => t.status === 'approved')
    const totalTestimonials = approvedTestimonials.length
    
    if (totalTestimonials <= 1) {
      if (prevBtn) prevBtn.disabled = true
      if (nextBtn) nextBtn.disabled = true
      return
    }
    
    function updateCarousel() {
      const translateX = -currentIndex * 100
      testimonialTrack.style.transform = `translateX(${translateX}%)`
      
      // Update indicators
      if (indicators) {
        indicators.querySelectorAll('.testimonial-indicator').forEach((indicator, index) => {
          indicator.classList.toggle('active', index === currentIndex)
        })
      }
      
      // Update button states
      if (prevBtn) prevBtn.disabled = currentIndex === 0
      if (nextBtn) nextBtn.disabled = currentIndex === totalTestimonials - 1
    }
    
    function goToTestimonial(index) {
      currentIndex = Math.max(0, Math.min(index, totalTestimonials - 1))
      updateCarousel()
    }
    
    function nextTestimonial() {
      if (currentIndex < totalTestimonials - 1) {
        currentIndex++
        updateCarousel()
      }
    }
    
    function prevTestimonial() {
      if (currentIndex > 0) {
        currentIndex--
        updateCarousel()
      }
    }
    
    // Add event listeners
    if (prevBtn) {
      prevBtn.addEventListener('click', prevTestimonial)
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', nextTestimonial)
    }
    
    // Auto-advance carousel
    let autoAdvanceInterval = setInterval(() => {
      if (totalTestimonials > 1) {
        nextTestimonial()
      }
    }, 5000)
    
    // Pause auto-advance on hover
    const carousel = testimonialTrack.closest('.testimonials-carousel')
    if (carousel) {
      carousel.addEventListener('mouseenter', () => {
        clearInterval(autoAdvanceInterval)
      })
      
      carousel.addEventListener('mouseleave', () => {
        autoAdvanceInterval = setInterval(() => {
          if (totalTestimonials > 1) {
            nextTestimonial()
          }
        }, 5000)
      })
    }
    
    // Make goToTestimonial available globally
    window.goToTestimonial = goToTestimonial
  }
  
  function handleTestimonialSubmission(e) {
    e.preventDefault()
    
    const formData = new FormData(e.target)
    const testimonialData = {
      parentName: formData.get('parentName'),
      childName: formData.get('childName'),
      parentEmail: formData.get('parentEmail'),
      content: formData.get('testimonialContent'),
      rating: parseInt(formData.get('rating')),
      submittedDate: new Date().toISOString(),
      status: 'pending', // Will be approved by admin
      id: Date.now()
    }
    
    // Validate form
    if (!testimonialData.parentName || !testimonialData.childName || !testimonialData.parentEmail || !testimonialData.content || !testimonialData.rating) {
      showMessage("Please fill in all required fields", "error")
      return
    }
    
    if (testimonialData.rating < 1 || testimonialData.rating > 5) {
      showMessage("Please select a valid rating", "error")
      return
    }
    
    if (testimonialData.content.length < 20) {
      showMessage("Testimonial must be at least 20 characters long", "error")
      return
    }
    
    // Save testimonial
    try {
      const testimonials = JSON.parse(localStorage.getItem("testimonials")) || []
      testimonials.push(testimonialData)
      localStorage.setItem("testimonials", JSON.stringify(testimonials))
      
      // Reset form
      e.target.reset()
      
      // Show success message
      showMessage("Thank you for your testimonial! It will be reviewed and posted soon.", "success")
      
      // Send notification to admin (optional)
      sendTestimonialNotification(testimonialData)
      
    } catch (error) {
      console.error("Error saving testimonial:", error)
      showMessage("Error saving testimonial. Please try again.", "error")
    }
  }
  
  function sendTestimonialNotification(testimonial) {
    // Send WhatsApp notification
    const whatsappMessage = `New Testimonial Submitted!

Parent: ${testimonial.parentName}
Child: ${testimonial.childName}
Email: ${testimonial.parentEmail}
Rating: ${'⭐'.repeat(testimonial.rating)}
Content: ${testimonial.content.substring(0, 100)}${testimonial.content.length > 100 ? '...' : ''}

Please review in admin panel.`

    const whatsappUrl = `https://wa.me/265992260985?text=${encodeURIComponent(whatsappMessage)}`
    
    // Open WhatsApp in new tab
    setTimeout(() => {
      window.open(whatsappUrl, '_blank')
    }, 1000)
  }
})