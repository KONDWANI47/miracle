const express = require("express")
const mysql = require("mysql2/promise")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const multer = require("multer")
const sharp = require("sharp")
const nodemailer = require("nodemailer")
const stripe = require("stripe")
const helmet = require("helmet")
const cors = require("cors")
const rateLimit = require("express-rate-limit")
const { body, validationResult } = require("express-validator")
const compression = require("compression")
const morgan = require("morgan")
const winston = require("winston")
const cron = require("cron")
const path = require("path")
const fs = require("fs").promises
const session = require("express-session")
const RedisStore = require("connect-redis").default
const redis = require("redis")
const Joi = require("joi")

require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 3000

// Initialize Stripe
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY)

// Initialize Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
})

// Logger configuration
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "miracle-ecd" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
})

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "miracle_ecd",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
}

const pool = mysql.createPool(dbConfig)

// Email transporter
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://maps.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.stripe.com"],
        frameSrc: ["https://js.stripe.com"],
      },
    },
  }),
)

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://miracleecd.com",
    credentials: true,
  }),
)

app.use(compression())
app.use(morgan("combined", { stream: { write: (message) => logger.info(message.trim()) } }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})
app.use(limiter)

// Stricter rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: "Too many API requests, please try again later." },
})

// Session configuration
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || "miracle-ecd-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))
app.use(express.static("public"))

// View engine setup
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, "public/uploads")
    try {
      await fs.mkdir(uploadPath, { recursive: true })
      cb(null, uploadPath)
    } catch (error) {
      cb(error)
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"), false)
    }
  },
})

// Validation schemas
const registrationSchema = Joi.object({
  parentName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^[+]?[0-9\s\-()]{10,}$/)
    .required(),
  address: Joi.string().min(10).max(500).required(),
  childName: Joi.string().min(2).max(100).required(),
  childAge: Joi.number().integer().min(0).max(12).required(),
  startDate: Joi.date().min("now").required(),
  program: Joi.string().valid("Early Childhood Care", "Foundation Program", "Primary Preparation").required(),
  message: Joi.string().max(1000).allow(""),
})

const announcementSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  content: Joi.string().min(10).max(2000).required(),
  type: Joi.string().valid("info", "urgent", "event", "notice").required(),
  expiryDate: Joi.date().min("now").allow(null),
})

// Middleware functions
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Access token required" })
  }

  jwt.verify(token, process.env.JWT_SECRET || "fallback-secret", (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" })
    }
    req.user = user
    next()
  })
}

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details.map((d) => d.message),
      })
    }
    next()
  }
}

// Utility functions
const generateSitemap = async () => {
  const baseUrl = process.env.BASE_URL || "https://miracleecd.com"
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/programs</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/admissions</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/gallery</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`

  await fs.writeFile(path.join(__dirname, "public/sitemap.xml"), sitemap)
}

const generateRobotsTxt = async () => {
  const baseUrl = process.env.BASE_URL || "https://miracleecd.com"
  const robots = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/admin/
Disallow: /uploads/temp/

Sitemap: ${baseUrl}/sitemap.xml`

  await fs.writeFile(path.join(__dirname, "public/robots.txt"), robots)
}

// Routes

// SEO Routes
app.get("/sitemap.xml", (req, res) => {
  res.sendFile(path.join(__dirname, "public/sitemap.xml"))
})

app.get("/robots.txt", (req, res) => {
  res.sendFile(path.join(__dirname, "public/robots.txt"))
})

// Main website routes
app.get("/", async (req, res) => {
  try {
    const [announcements] = await pool.execute(
      "SELECT * FROM announcements WHERE is_active = 1 AND (expiry_date IS NULL OR expiry_date > NOW()) ORDER BY created_date DESC LIMIT 5",
    )

    const [gallery] = await pool.execute(
      "SELECT * FROM gallery WHERE is_active = 1 ORDER BY display_order ASC, created_date DESC LIMIT 6",
    )

    const [programs] = await pool.execute(
      'SELECT setting_name, setting_value FROM payment_settings WHERE setting_name LIKE "%monthly%"',
    )

    res.render("index", {
      title: "MIRACLE ECD - Early Childhood Development Centre | Lilongwe, Malawi",
      description:
        "MIRACLE ECD provides quality early childhood development programs in Lilongwe, Malawi. Nurturing young minds with professional care, education, and development services.",
      keywords: "early childhood development, daycare, preschool, Lilongwe, Malawi, child care, education",
      announcements,
      gallery,
      programs,
      canonicalUrl: req.protocol + "://" + req.get("host") + req.originalUrl,
    })
  } catch (error) {
    logger.error("Error loading homepage:", error)
    res.status(500).render("error", {
      title: "Error - MIRACLE ECD",
      error: "Unable to load page content",
    })
  }
})

app.get("/about", (req, res) => {
  res.render("about", {
    title: "About Us - MIRACLE ECD | Professional Early Childhood Development",
    description:
      "Learn about MIRACLE ECD's mission, approach, and experienced team dedicated to providing quality early childhood development in Lilongwe, Malawi.",
    keywords: "about MIRACLE ECD, early childhood education, qualified staff, child development approach",
    canonicalUrl: req.protocol + "://" + req.get("host") + req.originalUrl,
  })
})

app.get("/programs", async (req, res) => {
  try {
    const [programs] = await pool.execute("SELECT * FROM payment_settings ORDER BY setting_value ASC")

    res.render("programs", {
      title: "Programs & Fees - MIRACLE ECD | Infant Care, Toddler & Preschool Programs",
      description:
        "Explore our comprehensive early childhood development programs: Early Childhood Care (0-5 years), Foundation Program (5-7 years), and Primary Preparation (7-12 years) with competitive fees.",
      keywords: "infant care, toddler program, preschool, early childhood programs, daycare fees, Lilongwe",
      programs,
      canonicalUrl: req.protocol + "://" + req.get("host") + req.originalUrl,
    })
  } catch (error) {
    logger.error("Error loading programs:", error)
    res.status(500).render("error", {
      title: "Error - MIRACLE ECD",
      error: "Unable to load programs",
    })
  }
})

app.get("/admissions", (req, res) => {
  res.render("admissions", {
    title: "Admissions - MIRACLE ECD | Enroll Your Child Today",
    description:
      "Start your child's educational journey at MIRACLE ECD. Learn about our admission process, requirements, and how to register for our early childhood development programs.",
    keywords: "admissions, enrollment, registration, early childhood education, Lilongwe daycare",
    canonicalUrl: req.protocol + "://" + req.get("host") + req.originalUrl,
  })
})

app.get("/gallery", async (req, res) => {
  try {
    const [gallery] = await pool.execute(
      "SELECT * FROM gallery WHERE is_active = 1 ORDER BY display_order ASC, created_date DESC",
    )

    const [userUploads] = await pool.execute(
      'SELECT * FROM user_uploads WHERE status = "approved" ORDER BY upload_date DESC LIMIT 12',
    )

    res.render("gallery", {
      title: "Gallery - MIRACLE ECD | Photos of Our Activities & Facilities",
      description:
        "View photos of our modern facilities, classroom activities, outdoor play areas, and happy children at MIRACLE ECD in Lilongwe, Malawi.",
      keywords: "gallery, photos, facilities, classroom activities, playground, children photos",
      gallery,
      userUploads,
      canonicalUrl: req.protocol + "://" + req.get("host") + req.originalUrl,
    })
  } catch (error) {
    logger.error("Error loading gallery:", error)
    res.status(500).render("error", {
      title: "Error - MIRACLE ECD",
      error: "Unable to load gallery",
    })
  }
})

app.get("/contact", (req, res) => {
  res.render("contact", {
    title: "Contact Us - MIRACLE ECD | Get in Touch",
    description:
      "Contact MIRACLE ECD for inquiries about our early childhood development programs. Located in Area 25, Sector 5, Lilongwe, Malawi. Call +265 992 260 985.",
    keywords: "contact, phone number, address, location, Area 25 Lilongwe, early childhood development center",
    canonicalUrl: req.protocol + "://" + req.get("host") + req.originalUrl,
  })
})

app.get("/admin", (req, res) => {
  res.render("admin", {
    title: "Admin Panel - MIRACLE ECD",
    description: "Administrative panel for MIRACLE ECD staff and management.",
    noIndex: true,
  })
})

// API Routes

// Registrations
app.get('/api/registrations', async (req, res) => {
  try {
    const [registrations] = await pool.execute("SELECT * FROM registrations")
    res.json(registrations)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch registrations' })
  }
})

app.post('/api/registrations', async (req, res) => {
  try {
    const { parentName, email, phone, address, childName, childAge, startDate, program, message } = req.body
    const [result] = await pool.execute(
      "INSERT INTO registrations (parent_name, email, phone, address, child_name, child_age, start_date, program, message, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Payment Required')",
      [parentName, email, phone, address, childName, childAge, startDate, program, message || null]
    )
    res.status(201).json({
      success: true,
      message: "Registration submitted successfully",
      registrationId: result.insertId
    })
  } catch (error) {
    logger.error("Registration error:", error)
    res.status(500).json({ error: "Registration failed. Please try again." })
  }
})

app.put('/api/registrations/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const [result] = await pool.execute("UPDATE registrations SET status = ? WHERE id = ?", [status, id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Registration not found' })
    }
    res.json({ success: true, message: "Status updated successfully" })
  } catch (error) {
    logger.error("Error updating registration status:", error)
    res.status(500).json({ error: "Failed to update status" })
  }
})

app.delete('/api/registrations/:id', async (req, res) => {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    const { id } = req.params

    // Delete related payments first
    await connection.execute("DELETE FROM payments WHERE registration_id = ?", [id])

    // Delete registration
    const [result] = await connection.execute("DELETE FROM registrations WHERE id = ?", [id])

    if (result.affectedRows === 0) {
      await connection.rollback()
      return res.status(404).json({ error: "Registration not found" })
    }

    await connection.commit()
    res.json({ success: true, message: "Registration deleted successfully" })
  } catch (error) {
    await connection.rollback()
    logger.error("Error deleting registration:", error)
    res.status(500).json({ error: "Failed to delete registration" })
  } finally {
    connection.release()
  }
})

// Payments
app.get('/api/payments', async (req, res) => {
  try {
    const [payments] = await pool.execute("SELECT * FROM payments")
    res.json(payments)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payments' })
  }
})

app.post('/api/payments', async (req, res) => {
  try {
    const { registrationId, amount, stripePaymentId, stripeChargeId } = req.body
    const [result] = await pool.execute(
      "INSERT INTO payments (registration_id, amount, status, stripe_payment_id, stripe_charge_id) VALUES (?, ?, 'Completed', ?, ?)",
      [registrationId, amount, 'Completed', stripePaymentId, stripeChargeId]
    )
    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      paymentId: result.insertId
    })
  } catch (error) {
    logger.error("Payment recording error:", error)
    res.status(500).json({ error: "Failed to record payment" })
  }
})

app.delete('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [result] = await pool.execute("DELETE FROM payments WHERE id = ?", [id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' })
    }
    res.json({ message: 'Payment deleted successfully' })
  } catch (error) {
    logger.error("Error deleting payment:", error)
    res.status(500).json({ error: 'Failed to delete payment' })
  }
})

// Announcements
app.get('/api/announcements', async (req, res) => {
  try {
    const [announcements] = await pool.execute("SELECT * FROM announcements WHERE is_active = 1 AND (expiry_date IS NULL OR expiry_date > NOW()) ORDER BY created_date DESC")
    res.json(announcements)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch announcements' })
  }
})

app.post('/api/announcements', async (req, res) => {
  try {
    const { title, content, type, expiryDate } = req.body
    const [result] = await pool.execute(
      "INSERT INTO announcements (title, content, type, expiry_date, created_by) VALUES (?, ?, ?, ?, ?)",
      [title, content, type, expiryDate || null, req.user.email]
    )
    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      id: result.insertId
    })
  } catch (error) {
    logger.error("Error creating announcement:", error)
    res.status(500).json({ error: 'Failed to create announcement' })
  }
})

app.put('/api/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, content, type, expiryDate } = req.body
    const [result] = await pool.execute(
      "UPDATE announcements SET title = ?, content = ?, type = ?, expiry_date = ?, updated_date = NOW() WHERE id = ?",
      [title, content, type, expiryDate || null, id]
    )
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Announcement not found' })
    }
    res.json({ success: true, message: "Announcement updated successfully" })
  } catch (error) {
    logger.error("Error updating announcement:", error)
    res.status(500).json({ error: 'Failed to update announcement' })
  }
})

app.delete('/api/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [result] = await pool.execute("DELETE FROM announcements WHERE id = ?", [id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Announcement not found' })
    }
    res.json({ success: true, message: 'Announcement deleted successfully' })
  } catch (error) {
    logger.error("Error deleting announcement:", error)
    res.status(500).json({ error: 'Failed to delete announcement' })
  }
})

// Gallery
app.get('/api/gallery', async (req, res) => {
  try {
    const [gallery] = await pool.execute("SELECT * FROM gallery WHERE is_active = 1 ORDER BY display_order ASC, created_date DESC")
    res.json(gallery)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gallery' })
  }
})

app.post('/api/gallery', async (req, res) => {
  try {
    const { title, description } = req.body
    const [result] = await pool.execute(
      "INSERT INTO gallery (title, description, image_url, uploaded_by) VALUES (?, ?, ?, ?)",
      [title, description, `/uploads/${req.file.filename}`, req.user.email]
    )
    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      id: result.insertId,
      imageUrl: `/uploads/${req.file.filename}`
    })
  } catch (error) {
    logger.error("Error uploading gallery image:", error)
    res.status(500).json({ error: 'Failed to upload image' })
  }
})

app.put('/api/gallery/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, description } = req.body
    const [result] = await pool.execute(
      "UPDATE gallery SET title = ?, description = ?, updated_date = NOW() WHERE id = ?",
      [title, description, id]
    )
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Gallery item not found' })
    }
    res.json({ success: true, message: 'Gallery item updated successfully' })
  } catch (error) {
    logger.error("Error updating gallery item:", error)
    res.status(500).json({ error: 'Failed to update gallery item' })
  }
})

app.delete('/api/gallery/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [result] = await pool.execute("DELETE FROM gallery WHERE id = ?", [id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Gallery item not found' })
    }
    res.json({ success: true, message: 'Gallery item deleted successfully' })
  } catch (error) {
    logger.error("Error deleting gallery item:", error)
    res.status(500).json({ error: 'Failed to delete gallery item' })
  }
})

// User Uploads
app.get('/api/user-uploads', async (req, res) => {
  try {
    const [uploads] = await pool.execute("SELECT * FROM user_uploads")
    res.json(uploads)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user uploads' })
  }
})

app.post('/api/user-uploads', async (req, res) => {
  try {
    const { uploaderName, uploaderEmail, title, description } = req.body
    const [result] = await pool.execute(
      "INSERT INTO user_uploads (uploader_name, uploader_email, title, description, image_url) VALUES (?, ?, ?, ?, ?)",
      [uploaderName, uploaderEmail, title, description, `/uploads/${req.file.filename}`]
    )
    res.status(201).json({
      success: true,
      message: "Photo uploaded successfully! It will be reviewed before being published.",
      id: result.insertId,
      imageUrl: `/uploads/${req.file.filename}`
    })
  } catch (error) {
    logger.error("Error uploading user photo:", error)
    res.status(500).json({ error: 'Failed to upload photo' })
  }
})

app.put('/api/user-uploads/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const [result] = await pool.execute("UPDATE user_uploads SET status = ?, review_date = NOW(), reviewed_by = ? WHERE id = ?", [status, req.user.email, id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User upload not found' })
    }
    res.json({ success: true, message: `Upload ${status} successfully` })
  } catch (error) {
    logger.error("Error updating upload status:", error)
    res.status(500).json({ error: 'Failed to update status' })
  }
})

app.delete('/api/user-uploads/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [result] = await pool.execute("DELETE FROM user_uploads WHERE id = ?", [id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User upload not found' })
    }
    res.json({ message: 'User upload deleted successfully' })
  } catch (error) {
    logger.error("Error deleting user upload:", error)
    res.status(500).json({ error: 'Failed to delete user upload' })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error("Unhandled error:", error)

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Maximum size is 5MB." })
    }
  }

  res.status(500).json({
    error: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).render("404", {
    title: "404 - Page Not Found | MIRACLE ECD",
    description: "The page you are looking for could not be found.",
    canonicalUrl: req.protocol + "://" + req.get("host") + req.originalUrl,
  })
})

// Scheduled tasks
const cleanupExpiredAnnouncements = new cron.CronJob("0 0 * * *", async () => {
  try {
    await pool.execute("UPDATE announcements SET is_active = 0 WHERE expiry_date < NOW() AND is_active = 1")
    logger.info("Expired announcements cleaned up")
  } catch (error) {
    logger.error("Cleanup task failed:", error)
  }
})

const generateSitemapDaily = new cron.CronJob("0 2 * * *", async () => {
  try {
    await generateSitemap()
    await generateRobotsTxt()
    logger.info("Sitemap and robots.txt generated")
  } catch (error) {
    logger.error("Sitemap generation failed:", error)
  }
})

// Start scheduled tasks
cleanupExpiredAnnouncements.start()
generateSitemapDaily.start()

// Initialize server
const startServer = async () => {
  try {
    // Test database connection
    await pool.execute("SELECT 1")
    logger.info("Database connected successfully")

    // Generate initial SEO files
    await generateSitemap()
    await generateRobotsTxt()

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      console.log(`🚀 MIRACLE ECD Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    logger.error("Server startup failed:", error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully")

  cleanupExpiredAnnouncements.stop()
  generateSitemapDaily.stop()

  await pool.end()
  await redisClient.quit()

  process.exit(0)
})

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully")

  cleanupExpiredAnnouncements.stop()
  generateSitemapDaily.stop()

  await pool.end()
  await redisClient.quit()

  process.exit(0)
})

startServer()

module.exports = app
