// Form submission handling
document.addEventListener("DOMContentLoaded", () => {
  const registrationForm = document.getElementById("registrationForm")

  // Initialize database if it doesn't exist
  if (!localStorage.getItem("daycareRegistrations")) {
    localStorage.setItem("daycareRegistrations", JSON.stringify([]))
  }

  // Initialize gallery data if it doesn't exist
  if (!localStorage.getItem("galleryData")) {
    const defaultGallery = [
      {
        id: 1,
        title: "School Activities",
        description:
          "Our students engage in various educational activities that promote learning through play and interaction.",
        image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/School.jpg-4WJzB4CAbUushelk6rmlUifS71IS6N.jpeg",
        updatedDate: new Date().toISOString(),
      },
      {
        id: 2,
        title: "Student Projects",
        description:
          "Showcasing the creative and innovative projects our young learners create during their time with us.",
        image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/School.jpg-4WJzB4CAbUushelk6rmlUifS71IS6N.jpeg",
        updatedDate: new Date().toISOString(),
      },
      {
        id: 3,
        title: "Events & Celebrations",
        description: "Special moments from our school events, celebrations, and community gatherings.",
        image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/School.jpg-4WJzB4CAbUushelk6rmlUifS71IS6N.jpeg",
        updatedDate: new Date().toISOString(),
      },
    ]
    localStorage.setItem("galleryData", JSON.stringify(defaultGallery))
  }

  // Load gallery data on page load
  loadGalleryData()

  // Set default date to today and minimum date
  const startDateInput = document.getElementById("startDate")
  if (startDateInput) {
    const today = new Date()
    const formattedDate = today.toISOString().split("T")[0]
    startDateInput.value = formattedDate
    startDateInput.min = formattedDate
  }

  if (registrationForm) {
    registrationForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Get form data
      const formData = {
        id: Date.now(), // Unique ID for each registration
        parentName: document.getElementById("parentName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        childName: document.getElementById("childName").value.trim(),
        childAge: Number.parseInt(document.getElementById("childAge").value),
        startDate: document.getElementById("startDate").value,
        program: document.getElementById("program").value,
        message: document.getElementById("message").value.trim(),
        registrationDate: new Date().toISOString(),
        status: "Pending", // Registration status
      }

      // Validate form data
      if (validateForm(formData)) {
        // Check for duplicate registration
        if (isDuplicateRegistration(formData)) {
          showMessage("A registration with this email or phone number already exists.", "error")
          return
        }

        // Save to database
        saveRegistration(formData)

        // Format the message for WhatsApp
        const whatsappMessage = formatWhatsAppMessage(formData)

        // Create WhatsApp URL with the formatted message
        const whatsappUrl = `https://wa.me/265992260985?text=${encodeURIComponent(whatsappMessage)}`

        // Format email message
        const emailSubject = "New Registration - MIRACLE ECD"
        const emailBody = formatEmailMessage(formData)

        // Create email URL
        const emailUrl = `mailto:cupicsart@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

        // Show success message
        showMessage("Registration submitted successfully! Sending notifications...", "success")

        // Reset form
        registrationForm.reset()

        // Reset start date to today
        if (startDateInput) {
          const today = new Date()
          const formattedDate = today.toISOString().split("T")[0]
          startDateInput.value = formattedDate
        }

        // Open WhatsApp after a short delay
        setTimeout(() => {
          window.open(whatsappUrl, "_blank")
        }, 1000)

        // Open email after a slightly longer delay
        setTimeout(() => {
          window.open(emailUrl, "_blank")
        }, 2000)
      }
    })
  }

  // Load gallery data from localStorage
  function loadGalleryData() {
    try {
      const galleryData = JSON.parse(localStorage.getItem("galleryData")) || []
      const galleryContainer = document.getElementById("galleryContainer")

      if (galleryContainer && galleryData.length > 0) {
        galleryContainer.innerHTML = ""

        galleryData.forEach((item) => {
          const galleryCard = document.createElement("div")
          galleryCard.className = "gallery-card"
          galleryCard.innerHTML = `
            <div class="gallery-image">
              <img src="${item.image}" alt="${item.title}">
            </div>
            <div class="gallery-info">
              <h3>${item.title}</h3>
              <p>${item.description}</p>
            </div>
          `
          galleryContainer.appendChild(galleryCard)
        })
      }
    } catch (error) {
      console.error("Error loading gallery data:", error)
    }
  }

  // Save registration to database
  function saveRegistration(registration) {
    try {
      const registrations = JSON.parse(localStorage.getItem("daycareRegistrations")) || []
      registrations.push(registration)
      localStorage.setItem("daycareRegistrations", JSON.stringify(registrations))
    } catch (error) {
      console.error("Error saving registration:", error)
      showMessage("Error saving registration. Please try again.", "error")
    }
  }

  // Check for duplicate registration
  function isDuplicateRegistration(newRegistration) {
    try {
      const registrations = JSON.parse(localStorage.getItem("daycareRegistrations")) || []
      return registrations.some(
        (reg) => reg.email.toLowerCase() === newRegistration.email.toLowerCase() || reg.phone === newRegistration.phone,
      )
    } catch (error) {
      console.error("Error checking duplicates:", error)
      return false
    }
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
      `*Status:* ${data.status}\n\n` +
      `Please process this registration request.`
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
      `Status: ${data.status}\n\n` +
      `Please process this registration request.\n\n` +
      `Best regards,\n` +
      `MIRACLE ECD Registration System`
    )
  }

  // Form validation function
  function validateForm(data) {
    // Basic validation
    if (
      !data.parentName ||
      !data.email ||
      !data.phone ||
      !data.childName ||
      !data.childAge ||
      !data.startDate ||
      !data.program
    ) {
      showMessage("Please fill in all required fields.", "error")
      return false
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      showMessage("Please enter a valid email address.", "error")
      return false
    }

    // Phone validation - Allow various formats
    const phoneRegex = /^[+]?[0-9\s\-()]{10,}$/
    if (!phoneRegex.test(data.phone)) {
      showMessage("Please enter a valid phone number.", "error")
      return false
    }

    // Age validation
    if (isNaN(data.childAge) || data.childAge < 0 || data.childAge > 12) {
      showMessage("Child's age must be between 0 and 12 years.", "error")
      return false
    }

    // Start date validation
    const selectedDate = new Date(data.startDate)
    const today = new Date()
    // Reset time part for both dates to compare only dates
    selectedDate.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)

    if (selectedDate < today) {
      showMessage("Start date cannot be in the past.", "error")
      return false
    }

    return true
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

    // Style the message
    messageElement.style.position = "fixed"
    messageElement.style.top = "20px"
    messageElement.style.left = "50%"
    messageElement.style.transform = "translateX(-50%)"
    messageElement.style.padding = "1rem 2rem"
    messageElement.style.borderRadius = "5px"
    messageElement.style.zIndex = "1000"

    // Set background color based on message type
    messageElement.style.backgroundColor = type === "success" ? "#4CAF50" : "#f44336"
    messageElement.style.color = "white"

    // Add message to the page
    document.body.appendChild(messageElement)

    // Remove message after 5 seconds
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove()
      }
    }, 5000)
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
    // Show/hide button based on scroll position
    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add("visible")
      } else {
        backToTopButton.classList.remove("visible")
      }
    })

    // Smooth scroll to top when button is clicked
    backToTopButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      })
    })
  }

  // Hamburger Menu Functionality
  const hamburger = document.querySelector(".hamburger")
  const mainNav = document.querySelector(".main-nav")

  // Toggle menu when hamburger is clicked
  if (hamburger) {
    hamburger.addEventListener("click", function () {
      this.classList.toggle("active")
      mainNav.classList.toggle("active")

      // Show mobile search when menu is active
      const mobileSearch = document.querySelector(".mobile-search")
      if (!mobileSearch) {
        // Create mobile search if it doesn't exist
        const mobileSearchDiv = document.createElement("div")
        mobileSearchDiv.className = "mobile-search"
        mobileSearchDiv.innerHTML = `
          <form class="search-form">
            <input type="text" placeholder="Search...">
            <button type="submit"><i class="fas fa-search"></i></button>
          </form>
        `
        mainNav.insertBefore(mobileSearchDiv, mainNav.firstChild)
      }
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
        showMessage(`Searching for: ${searchTerm}`, "success")
        // Here you would implement actual search functionality
      }
    })
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
    ".about-card, .program-card, .contact-card, .academic-card, .facility-card",
  )
  animatedElements.forEach((element) => {
    element.style.opacity = "0"
    element.style.transform = "translateY(20px)"
    element.style.transition = "opacity 0.6s ease, transform 0.6s ease"
    observer.observe(element)
  })
})
