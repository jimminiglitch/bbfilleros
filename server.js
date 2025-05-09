const express = require("express")
const bodyParser = require("body-parser")
const path = require("path")
const fs = require("fs")

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(bodyParser.json())
app.use(express.static("public"))

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

// Contact form API
app.post("/contact", (req, res) => {
  const { name, email, message } = req.body

  // Validate input
  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "All fields are required" })
  }

  // In a real app, you would send an email or save to a database
  // For this example, we'll just save to a JSON file
  const contactData = {
    name,
    email,
    message,
    timestamp: new Date().toISOString(),
  }

  try {
    // Create contacts directory if it doesn't exist
    const contactsDir = path.join(__dirname, "contacts")
    if (!fs.existsSync(contactsDir)) {
      fs.mkdirSync(contactsDir)
    }

    // Save contact data to file
    const filename = `contact_${Date.now()}.json`
    fs.writeFileSync(path.join(contactsDir, filename), JSON.stringify(contactData, null, 2))

    res.json({ success: true, message: "Message sent successfully!" })
  } catch (error) {
    console.error("Error saving contact:", error)
    res.status(500).json({ success: false, message: "Failed to send message" })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
