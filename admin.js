document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const registrationsTableBody = document.getElementById("registrationsTableBody")
  const appealsTableBody = document.getElementById("appealsTableBody")
  const searchInput = document.getElementById("searchInput")
  const statusFilter = document.getElementById("statusFilter")
  const exportBtn = document.getElementById("exportBtn")
  const refreshBtn = document.getElementById("refreshBtn")
  const modal = document.getElementById("registrationModal")
  const appealModal = document.getElementById("appealModal")
  const closeModals = document.querySelectorAll(".close-modal")
  const registrationDetails = document.getElementById("registrationDetails")
  const appealDetails = document.getElementById("appealDetails")
  const statusUpdate = document.getElementById("statusUpdate")
  const appealStatusUpdate = document.getElementById("appealStatusUpdate")
  const updateStatusBtn = document.getElementById("updateStatusBtn")
  const updateAppealStatusBtn = document.getElementById("updateAppealStatusBtn")
  const deleteRegistrationBtn = document.getElementById("deleteRegistrationBtn")
  const deleteAppealBtn = document.getElementById("deleteAppealBtn")
  const passwordToggle = document.getElementById("passwordToggle")
  const passwordInput = document.getElementById("password")
  const rememberMeCheckbox = document.getElementById("rememberMe")

  let currentRegistrationId = null
  let currentAppealId = null

  // Initialize appeals data if it doesn't exist
  if (!localStorage.getItem("daycareAppeals")) {
    localStorage.setItem("daycareAppeals", JSON.stringify([]))
  }

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
      document.getElementById("email").value = savedEmail
      document.getElementById("password").value = savedPassword
      rememberMeCheckbox.checked = true
    }
  }

  // Load and display registrations
  function loadRegistrations() {
    try {
      const registrations = JSON.parse(localStorage.getItem("daycareRegistrations")) || []
      displayRegistrations(registrations)
    } catch (error) {
      console.error("Error loading registrations:", error)
      showMessage("Error loading registrations", "error")
    }
  }

  // Load and display appeals
  function loadAppeals() {
    try {
      const appeals = JSON.parse(localStorage.getItem("daycareAppeals")) || []
      displayAppeals(appeals)
    } catch (error) {
      console.error("Error loading appeals:", error)
      showMessage("Error loading appeals", "error")
    }
  }

  // Display registrations in table
  function displayRegistrations(registrations) {
    if (!registrationsTableBody) return

    registrationsTableBody.innerHTML = ""

    if (registrations.length === 0) {
      registrationsTableBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 2rem; color: #666;">
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
        <td>${escapeHtml(reg.parentName)}</td>
        <td>${escapeHtml(reg.childName)}</td>
        <td>${escapeHtml(reg.program)}</td>
        <td>${new Date(reg.startDate).toLocaleDateString()}</td>
        <td>${new Date(reg.registrationDate).toLocaleString()}</td>
        <td><span class="status-badge status-${reg.status.toLowerCase()}">${reg.status}</span></td>
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
      btn.addEventListener("click", () => showRegistrationDetails(btn.dataset.id))
    })
  }

  // Display appeals in table
  function displayAppeals(appeals) {
    if (!appealsTableBody) return

    appealsTableBody.innerHTML = ""

    if (appeals.length === 0) {
      appealsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
            No appeals found
          </td>
        </tr>
      `
      return
    }

    appeals.forEach((appeal) => {
      const row = document.createElement("tr")
      row.innerHTML = `
        <td>${appeal.id}</td>
        <td>${escapeHtml(appeal.parentName)}</td>
        <td>${escapeHtml(appeal.childName)}</td>
        <td>${escapeHtml(appeal.reason.substring(0, 50))}...</td>
        <td>${new Date(appeal.submissionDate).toLocaleString()}</td>
        <td><span class="status-badge status-${appeal.status.toLowerCase().replace(" ", "-")}">${appeal.status}</span></td>
        <td>
          <button class="admin-btn view-btn" data-id="${appeal.id}" onclick="showAppealDetails(${appeal.id})">
            <i class="fas fa-eye"></i> View
          </button>
        </td>
      `
      appealsTableBody.appendChild(row)
    })
  }

  // Show registration details in modal
  function showRegistrationDetails(id) {
    try {
      const registrations = JSON.parse(localStorage.getItem("daycareRegistrations")) || []
      const registration = registrations.find((reg) => reg.id === Number.parseInt(id))

      if (registration) {
        currentRegistrationId = registration.id
        if (statusUpdate) {
          statusUpdate.value = registration.status
        }

        if (registrationDetails) {
          registrationDetails.innerHTML = `
            <div class="details-grid">
              <div class="detail-item">
                <strong>Registration ID:</strong>
                <span>${registration.id}</span>
              </div>
              <div class="detail-item">
                <strong>Parent/Guardian Name:</strong>
                <span>${escapeHtml(registration.parentName)}</span>
              </div>
              <div class="detail-item">
                <strong>Email:</strong>
                <span>${escapeHtml(registration.email)}</span>
              </div>
              <div class="detail-item">
                <strong>Phone:</strong>
                <span>${escapeHtml(registration.phone)}</span>
              </div>
              <div class="detail-item">
                <strong>Child's Name:</strong>
                <span>${escapeHtml(registration.childName)}</span>
              </div>
              <div class="detail-item">
                <strong>Child's Age:</strong>
                <span>${registration.childAge} years</span>
              </div>
              <div class="detail-item">
                <strong>Program Type:</strong>
                <span>${escapeHtml(registration.program)}</span>
              </div>
              <div class="detail-item">
                <strong>Start Date:</strong>
                <span>${new Date(registration.startDate).toLocaleDateString()}</span>
              </div>
              <div class="detail-item">
                <strong>Registration Date:</strong>
                <span>${new Date(registration.registrationDate).toLocaleString()}</span>
              </div>
              <div class="detail-item">
                <strong>Status:</strong>
                <span class="status-badge status-${registration.status.toLowerCase()}">${registration.status}</span>
              </div>
              <div class="detail-item full-width">
                <strong>Additional Information:</strong>
                <p>${escapeHtml(registration.message) || "None"}</p>
              </div>
            </div>
          `
        }

        if (modal) {
          modal.style.display = "block"
        }
      }
    } catch (error) {
      console.error("Error showing registration details:", error)
      showMessage("Error loading registration details", "error")
    }
  }

  // Show appeal details in modal
  window.showAppealDetails = (id) => {
    try {
      const appeals = JSON.parse(localStorage.getItem("daycareAppeals")) || []
      const appeal = appeals.find((app) => app.id === Number.parseInt(id))

      if (appeal) {
        currentAppealId = appeal.id
        if (appealStatusUpdate) {
          appealStatusUpdate.value = appeal.status
        }

        if (appealDetails) {
          appealDetails.innerHTML = `
            <div class="details-grid">
              <div class="detail-item">
                <strong>Appeal ID:</strong>
                <span>${appeal.id}</span>
              </div>
              <div class="detail-item">
                <strong>Parent Name:</strong>
                <span>${escapeHtml(appeal.parentName)}</span>
              </div>
              <div class="detail-item">
                <strong>Child Name:</strong>
                <span>${escapeHtml(appeal.childName)}</span>
              </div>
              <div class="detail-item">
                <strong>Email:</strong>
                <span>${escapeHtml(appeal.email)}</span>
              </div>
              <div class="detail-item">
                <strong>Phone:</strong>
                <span>${escapeHtml(appeal.phone)}</span>
              </div>
              <div class="detail-item">
                <strong>Submission Date:</strong>
                <span>${new Date(appeal.submissionDate).toLocaleString()}</span>
              </div>
              <div class="detail-item">
                <strong>Status:</strong>
                <span class="status-badge status-${appeal.status.toLowerCase().replace(" ", "-")}">${appeal.status}</span>
              </div>
              <div class="detail-item full-width">
                <strong>Appeal Reason:</strong>
                <p>${escapeHtml(appeal.reason)}</p>
              </div>
            </div>
          `
        }

        if (appealModal) {
          appealModal.style.display = "block"
        }
      }
    } catch (error) {
      console.error("Error showing appeal details:", error)
      showMessage("Error loading appeal details", "error")
    }
  }

  // Update registration status
  function updateRegistrationStatus(id, newStatus) {
    try {
      const registrations = JSON.parse(localStorage.getItem("daycareRegistrations")) || []
      const index = registrations.findIndex((reg) => reg.id === id)

      if (index !== -1) {
        registrations[index].status = newStatus
        registrations[index].lastUpdated = new Date().toISOString()
        localStorage.setItem("daycareRegistrations", JSON.stringify(registrations))
        loadRegistrations()
        showMessage("Status updated successfully", "success")
        return true
      }
      return false
    } catch (error) {
      console.error("Error updating status:", error)
      showMessage("Error updating status", "error")
      return false
    }
  }

  // Update appeal status
  function updateAppealStatus(id, newStatus) {
    try {
      const appeals = JSON.parse(localStorage.getItem("daycareAppeals")) || []
      const index = appeals.findIndex((app) => app.id === id)

      if (index !== -1) {
        appeals[index].status = newStatus
        appeals[index].lastUpdated = new Date().toISOString()
        localStorage.setItem("daycareAppeals", JSON.stringify(appeals))
        loadAppeals()
        showMessage("Appeal status updated successfully", "success")
        return true
      }
      return false
    } catch (error) {
      console.error("Error updating appeal status:", error)
      showMessage("Error updating appeal status", "error")
      return false
    }
  }

  // Delete registration
  function deleteRegistration(id) {
    if (confirm("Are you sure you want to delete this registration? This action cannot be undone.")) {
      try {
        const registrations = JSON.parse(localStorage.getItem("daycareRegistrations")) || []
        const filteredRegistrations = registrations.filter((reg) => reg.id !== id)
        localStorage.setItem("daycareRegistrations", JSON.stringify(filteredRegistrations))
        loadRegistrations()
        if (modal) {
          modal.style.display = "none"
        }
        showMessage("Registration deleted successfully", "success")
      } catch (error) {
        console.error("Error deleting registration:", error)
        showMessage("Error deleting registration", "error")
      }
    }
  }

  // Delete appeal
  function deleteAppeal(id) {
    if (confirm("Are you sure you want to delete this appeal? This action cannot be undone.")) {
      try {
        const appeals = JSON.parse(localStorage.getItem("daycareAppeals")) || []
        const filteredAppeals = appeals.filter((app) => app.id !== id)
        localStorage.setItem("daycareAppeals", JSON.stringify(filteredAppeals))
        loadAppeals()
        if (appealModal) {
          appealModal.style.display = "none"
        }
        showMessage("Appeal deleted successfully", "success")
      } catch (error) {
        console.error("Error deleting appeal:", error)
        showMessage("Error deleting appeal", "error")
      }
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

  if (exportBtn) {
    exportBtn.addEventListener("click", exportToCSV)
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      refreshBtn.disabled = true
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...'

      setTimeout(() => {
        loadRegistrations()
        loadAppeals()
        refreshBtn.disabled = false
        refreshBtn.innerHTML = '<i class="fas fa-sync"></i> Refresh'
        showMessage("Data refreshed successfully", "success")
      }, 1000)
    })
  }

  // Close modal event listeners
  closeModals.forEach((closeBtn) => {
    closeBtn.addEventListener("click", () => {
      if (modal) modal.style.display = "none"
      if (appealModal) appealModal.style.display = "none"
    })
  })

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none"
    }
    if (e.target === appealModal) {
      appealModal.style.display = "none"
    }
  })

  if (updateStatusBtn) {
    updateStatusBtn.addEventListener("click", () => {
      if (currentRegistrationId && statusUpdate) {
        updateRegistrationStatus(currentRegistrationId, statusUpdate.value)
        if (modal) {
          modal.style.display = "none"
        }
      }
    })
  }

  if (updateAppealStatusBtn) {
    updateAppealStatusBtn.addEventListener("click", () => {
      if (currentAppealId && appealStatusUpdate) {
        updateAppealStatus(currentAppealId, appealStatusUpdate.value)
        if (appealModal) {
          appealModal.style.display = "none"
        }
      }
    })
  }

  if (deleteRegistrationBtn) {
    deleteRegistrationBtn.addEventListener("click", () => {
      if (currentRegistrationId) {
        deleteRegistration(currentRegistrationId)
      }
    })
  }

  if (deleteAppealBtn) {
    deleteAppealBtn.addEventListener("click", () => {
      if (currentAppealId) {
        deleteAppeal(currentAppealId)
      }
    })
  }

  // Login functionality
  const loginForm = document.getElementById("adminLoginForm")
  const loginMessage = document.getElementById("loginMessage")
  const loginContainer = document.getElementById("loginForm")
  const adminPanel = document.getElementById("adminPanel")
  const logoutBtn = document.getElementById("logoutBtn")

  // Check if user is already logged in
  if (localStorage.getItem("isLoggedIn") === "true") {
    showAdminPanel()
  }

  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const email = document.getElementById("email").value
      const password = document.getElementById("password").value
      const rememberMe = document.getElementById("rememberMe").checked

      // Check credentials
      if (email === "cupicsart@gmail.com" && password === "cupicsart@98ART") {
        // Store login state
        localStorage.setItem("isLoggedIn", "true")

        // Handle remember me
        if (rememberMe) {
          localStorage.setItem("rememberAdmin", "true")
          localStorage.setItem("adminEmail", email)
          localStorage.setItem("adminPassword", password)
        } else {
          localStorage.removeItem("rememberAdmin")
          localStorage.removeItem("adminEmail")
          localStorage.removeItem("adminPassword")
        }

        showAdminPanel()
      } else {
        showMessage("Invalid email or password", "error")
      }
    })
  }

  // Logout functionality
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("isLoggedIn")
      hideAdminPanel()
      if (loginForm) loginForm.reset()
    })
  }

  function showAdminPanel() {
    if (loginContainer) loginContainer.style.display = "none"
    if (adminPanel) adminPanel.style.display = "block"
    loadRegistrations()
    loadAppeals()
  }

  function hideAdminPanel() {
    if (loginContainer) loginContainer.style.display = "flex"
    if (adminPanel) adminPanel.style.display = "none"
  }

  // Admin Navigation
  const adminHamburger = document.querySelector(".admin-hamburger")
  const adminNav = document.querySelector(".admin-nav")
  const adminNavLinks = document.querySelectorAll(".nav-link")
  const adminSections = document.querySelectorAll(".admin-section")

  // Toggle navigation menu
  if (adminHamburger) {
    adminHamburger.addEventListener("click", function () {
      this.classList.toggle("active")
      adminNav.classList.toggle("active")
    })
  }

  // Handle navigation link clicks
  adminNavLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()

      // Remove active class from all links and sections
      adminNavLinks.forEach((l) => l.classList.remove("active"))
      adminSections.forEach((s) => s.classList.remove("active"))

      // Add active class to clicked link
      this.classList.add("active")

      // Show corresponding section
      const sectionId = this.dataset.section + "-section"
      const targetSection = document.getElementById(sectionId)
      if (targetSection) {
        targetSection.classList.add("active")
      }

      // Close menu on mobile after clicking a link
      if (window.innerWidth <= 768) {
        adminHamburger.classList.remove("active")
        adminNav.classList.remove("active")
      }
    })
  })

  // Appeal form handling
  const appealForm = document.getElementById("appealForm")
  if (appealForm) {
    appealForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const appealData = {
        id: Date.now(),
        parentName: document.getElementById("appealParentName").value.trim(),
        childName: document.getElementById("appealChildName").value.trim(),
        email: document.getElementById("appealEmail").value.trim(),
        phone: document.getElementById("appealPhone").value.trim(),
        reason: document.getElementById("appealReason").value.trim(),
        submissionDate: new Date().toISOString(),
        status: "Pending",
      }

      // Save appeal
      const appeals = JSON.parse(localStorage.getItem("daycareAppeals")) || []
      appeals.push(appealData)
      localStorage.setItem("daycareAppeals", JSON.stringify(appeals))

      // Reset form and reload appeals
      appealForm.reset()
      loadAppeals()
      showMessage("Appeal submitted successfully", "success")
    })
  }

  // Gallery management
  const galleryUploadForm = document.getElementById("galleryUploadForm")
  if (galleryUploadForm) {
    galleryUploadForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const title = document.getElementById("galleryTitle").value.trim()
      const description = document.getElementById("galleryDescription").value.trim()
      const imageFile = document.getElementById("galleryImage").files[0]

      if (imageFile) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const galleryData = JSON.parse(localStorage.getItem("galleryData")) || []
          const newItem = {
            id: Date.now(),
            title: title,
            description: description,
            image: e.target.result,
            updatedDate: new Date().toISOString(),
          }

          galleryData.push(newItem)
          localStorage.setItem("galleryData", JSON.stringify(galleryData))

          // Reset form
          galleryUploadForm.reset()
          showMessage("Image uploaded successfully", "success")

          // Reload gallery in main site
          window.dispatchEvent(new Event("galleryUpdated"))
        }
        reader.readAsDataURL(imageFile)
      }
    })
  }

  // Gallery card management
  const galleryCards = document.querySelectorAll(".gallery-card")
  galleryCards.forEach((card) => {
    const editBtn = card.querySelector(".edit-btn")
    const deleteBtn = card.querySelector(".delete-btn")
    const uploadBtn = card.querySelector(".upload-btn")

    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        const cardTitle = card.querySelector("h3").textContent
        const newTitle = prompt(`Edit title for ${cardTitle}:`, cardTitle)
        if (newTitle && newTitle !== cardTitle) {
          card.querySelector("h3").textContent = newTitle
          showMessage(`Title updated to: ${newTitle}`, "success")
        }
      })
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        const cardTitle = card.querySelector("h3").textContent
        if (confirm(`Are you sure you want to delete ${cardTitle}?`)) {
          card.remove()
          showMessage(`${cardTitle} deleted successfully`, "success")
        }
      })
    }

    if (uploadBtn) {
      uploadBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        const fileInput = document.createElement("input")
        fileInput.type = "file"
        fileInput.accept = "image/*"

        fileInput.onchange = (e) => {
          const file = e.target.files[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
              const img = card.querySelector("img")
              img.src = e.target.result
              const dateElement = card.querySelector("p")
              dateElement.textContent = `Updated: ${new Date().toLocaleDateString()}`
              showMessage("Image updated successfully", "success")
            }
            reader.readAsDataURL(file)
          }
        }

        fileInput.click()
      })
    }
  })

  // Close menu when clicking outside
  document.addEventListener("click", (event) => {
    if (
      adminHamburger &&
      adminNav &&
      !event.target.closest(".admin-navigation") &&
      adminNav.classList.contains("active")
    ) {
      adminHamburger.classList.remove("active")
      adminNav.classList.remove("active")
    }
  })

  // Close menu on window resize if open
  window.addEventListener("resize", () => {
    if (adminHamburger && adminNav && window.innerWidth > 768 && adminNav.classList.contains("active")) {
      adminHamburger.classList.remove("active")
      adminNav.classList.remove("active")
    }
  })

  // Back to top functionality
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

  // Initial load
  loadRegistrations()
  loadAppeals()
})
