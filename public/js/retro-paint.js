/**
 * RetroPaint - A simple MS Paint inspired drawing app
 * For retro desktop-style portfolio sites
 */

class RetroPaint {
  constructor(options = {}) {
    this.container = options.container || document.createElement("div")
    this.width = options.width || 600
    this.height = options.height || 400
    this.theme = options.theme || "cyan" // cyan, magenta, green, yellow

    this.canvas = null
    this.ctx = null
    this.toolbox = null
    this.colorPalette = null

    this.currentTool = "pencil"
    this.currentColor = "#ffffff"
    this.currentSize = 3
    this.isDrawing = false
    this.lastX = 0
    this.lastY = 0

    this.init()
  }

  init() {
    // Create container
    this.container.className = "retro-paint"
    this.container.style.display = "flex"
    this.container.style.flexDirection = "column"
    this.container.style.backgroundColor = "#222"
    this.container.style.padding = "10px"
    this.container.style.border = "2px solid"

    // Apply theme colors
    switch (this.theme) {
      case "cyan":
        this.container.style.borderColor = "#0ff"
        break
      case "magenta":
        this.container.style.borderColor = "#f0f"
        break
      case "green":
        this.container.style.borderColor = "#0f0"
        break
      case "yellow":
        this.container.style.borderColor = "#ff0"
        break
    }

    // Create toolbar
    this.createToolbar()

    // Create canvas
    this.createCanvas()

    // Create color palette
    this.createColorPalette()

    // Setup event listeners
    this.setupEventListeners()
  }

  createToolbar() {
    this.toolbox = document.createElement("div")
    this.toolbox.className = "retro-paint-toolbox"
    this.toolbox.style.display = "flex"
    this.toolbox.style.marginBottom = "10px"
    this.toolbox.style.gap = "5px"

    // Define tools
    const tools = [
      { id: "pencil", icon: "✏️", tooltip: "Pencil" },
      { id: "line", icon: "📏", tooltip: "Line" },
      { id: "rect", icon: "⬜", tooltip: "Rectangle" },
      { id: "circle", icon: "⭕", tooltip: "Circle" },
      { id: "eraser", icon: "🧽", tooltip: "Eraser" },
      { id: "fill", icon: "🪣", tooltip: "Fill" },
      { id: "text", icon: "T", tooltip: "Text" },
      { id: "clear", icon: "🗑️", tooltip: "Clear" },
    ]

    // Create tool buttons
    tools.forEach((tool) => {
      const button = document.createElement("button")
      button.className = `retro-paint-tool ${tool.id === this.currentTool ? "active" : ""}`
      button.dataset.tool = tool.id
      button.textContent = tool.icon
      button.title = tool.tooltip
      button.style.width = "40px"
      button.style.height = "40px"
      button.style.backgroundColor = "#333"
      button.style.border = "2px solid #666"
      button.style.fontSize = "20px"
      button.style.cursor = "pointer"
      button.style.display = "flex"
      button.style.alignItems = "center"
      button.style.justifyContent = "center"

      if (tool.id === this.currentTool) {
        button.style.backgroundColor = "#555"
        button.style.borderColor = "#888"
      }

      button.addEventListener("click", () => this.selectTool(tool.id))

      this.toolbox.appendChild(button)
    })

    // Add size selector
    const sizeSelector = document.createElement("div")
    sizeSelector.className = "retro-paint-size-selector"
    sizeSelector.style.display = "flex"
    sizeSelector.style.alignItems = "center"
    sizeSelector.style.marginLeft = "10px"

    const sizeLabel = document.createElement("span")
    sizeLabel.textContent = "Size:"
    sizeLabel.style.color = "#fff"
    sizeLabel.style.marginRight = "5px"
    sizeLabel.style.fontFamily = '"VT323", monospace'

    const sizeInput = document.createElement("input")
    sizeInput.type = "range"
    sizeInput.min = "1"
    sizeInput.max = "20"
    sizeInput.value = this.currentSize
    sizeInput.style.width = "100px"

    sizeInput.addEventListener("input", (e) => {
      this.currentSize = Number.parseInt(e.target.value)
    })

    sizeSelector.appendChild(sizeLabel)
    sizeSelector.appendChild(sizeInput)

    this.toolbox.appendChild(sizeSelector)

    // Add save button
    const saveButton = document.createElement("button")
    saveButton.className = "retro-paint-save"
    saveButton.textContent = "💾"
    saveButton.title = "Save"
    saveButton.style.width = "40px"
    saveButton.style.height = "40px"
    saveButton.style.backgroundColor = "#333"
    saveButton.style.border = "2px solid #666"
    saveButton.style.fontSize = "20px"
    saveButton.style.cursor = "pointer"
    saveButton.style.display = "flex"
    saveButton.style.alignItems = "center"
    saveButton.style.justifyContent = "center"
    saveButton.style.marginLeft = "auto"

    saveButton.addEventListener("click", () => this.saveImage())

    this.toolbox.appendChild(saveButton)

    this.container.appendChild(this.toolbox)
  }

  createCanvas() {
    const canvasContainer = document.createElement("div")
    canvasContainer.className = "retro-paint-canvas-container"
    canvasContainer.style.position = "relative"
    canvasContainer.style.backgroundColor = "#000"
    canvasContainer.style.border = "1px solid #444"
    canvasContainer.style.flex = "1"
    canvasContainer.style.overflow = "hidden"

    this.canvas = document.createElement("canvas")
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.canvas.style.display = "block"
    this.canvas.style.width = "100%"
    this.canvas.style.height = "100%"
    this.canvas.style.cursor = "crosshair"

    this.ctx = this.canvas.getContext("2d")

    // Set initial canvas background to black
    this.ctx.fillStyle = "#000"
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    canvasContainer.appendChild(this.canvas)
    this.container.appendChild(canvasContainer)
  }

  createColorPalette() {
    this.colorPalette = document.createElement("div")
    this.colorPalette.className = "retro-paint-color-palette"
    this.colorPalette.style.display = "flex"
    this.colorPalette.style.marginTop = "10px"
    this.colorPalette.style.gap = "5px"
    this.colorPalette.style.flexWrap = "wrap"

    // Define colors
    const colors = [
      "#000000",
      "#ffffff",
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#00ffff",
      "#ff00ff",
      "#c0c0c0",
      "#808080",
      "#800000",
      "#808000",
      "#008000",
      "#800080",
      "#008080",
      "#000080",
      "#ff8080",
      "#80ff80",
      "#8080ff",
      "#ffff80",
      "#80ffff",
      "#ff80ff",
    ]

    // Create color swatches
    colors.forEach((color) => {
      const swatch = document.createElement("div")
      swatch.className = "retro-paint-color-swatch"
      swatch.dataset.color = color
      swatch.style.width = "30px"
      swatch.style.height = "30px"
      swatch.style.backgroundColor = color
      swatch.style.border = "2px solid #666"
      swatch.style.cursor = "pointer"

      if (color === this.currentColor) {
        swatch.style.border = "2px solid #fff"
      }

      swatch.addEventListener("click", () => this.selectColor(color))

      this.colorPalette.appendChild(swatch)
    })

    // Add custom color input
    const customColorContainer = document.createElement("div")
    customColorContainer.style.display = "flex"
    customColorContainer.style.alignItems = "center"
    customColorContainer.style.marginLeft = "10px"

    const customColorInput = document.createElement("input")
    customColorInput.type = "color"
    customColorInput.value = this.currentColor
    customColorInput.style.width = "30px"
    customColorInput.style.height = "30px"
    customColorInput.style.border = "none"
    customColorInput.style.padding = "0"
    customColorInput.style.background = "none"

    customColorInput.addEventListener("input", (e) => {
      this.selectColor(e.target.value)
    })

    customColorContainer.appendChild(customColorInput)
    this.colorPalette.appendChild(customColorContainer)

    this.container.appendChild(this.colorPalette)
  }

  setupEventListeners() {
    // Mouse events for drawing
    this.canvas.addEventListener("mousedown", (e) => this.startDrawing(e))
    this.canvas.addEventListener("mousemove", (e) => this.draw(e))
    this.canvas.addEventListener("mouseup", () => this.stopDrawing())
    this.canvas.addEventListener("mouseout", () => this.stopDrawing())

    // Touch events for mobile
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault()
      this.startDrawing(this.getTouchPos(e))
    })

    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault()
      this.draw(this.getTouchPos(e))
    })

    this.canvas.addEventListener("touchend", () => this.stopDrawing())
  }

  getTouchPos(e) {
    const rect = this.canvas.getBoundingClientRect()
    const touch = e.touches[0]

    return {
      clientX: touch.clientX,
      clientY: touch.clientY,
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
    }
  }

  selectTool(toolId) {
    this.currentTool = toolId

    // Update tool buttons
    const toolButtons = this.toolbox.querySelectorAll(".retro-paint-tool")
    toolButtons.forEach((button) => {
      if (button.dataset.tool === toolId) {
        button.style.backgroundColor = "#555"
        button.style.borderColor = "#888"
      } else {
        button.style.backgroundColor = "#333"
        button.style.borderColor = "#666"
      }
    })

    // Handle special tools
    if (toolId === "clear") {
      this.clearCanvas()
      this.selectTool("pencil") // Switch back to pencil after clearing
    }
  }

  selectColor(color) {
    this.currentColor = color

    // Update color swatches
    const swatches = this.colorPalette.querySelectorAll(".retro-paint-color-swatch")
    swatches.forEach((swatch) => {
      if (swatch.dataset.color === color) {
        swatch.style.border = "2px solid #fff"
      } else {
        swatch.style.border = "2px solid #666"
      }
    })
  }

  startDrawing(e) {
    this.isDrawing = true

    // Get canvas-relative coordinates
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height

    this.lastX = (e.offsetX || e.clientX - rect.left) * scaleX
    this.lastY = (e.offsetY || e.clientY - rect.top) * scaleY

    // Handle different tools
    if (this.currentTool === "fill") {
      this.fillArea(this.lastX, this.lastY)
    } else if (this.currentTool === "text") {
      this.addText(this.lastX, this.lastY)
    }
  }

  draw(e) {
    if (!this.isDrawing) return

    // Get canvas-relative coordinates
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height

    const currentX = (e.offsetX || e.clientX - rect.left) * scaleX
    const currentY = (e.offsetY || e.clientY - rect.top) * scaleY

    // Handle different tools
    switch (this.currentTool) {
      case "pencil":
        this.drawPencil(currentX, currentY)
        break
      case "line":
        this.drawLine(currentX, currentY)
        break
      case "rect":
        this.drawRect(currentX, currentY)
        break
      case "circle":
        this.drawCircle(currentX, currentY)
        break
      case "eraser":
        this.erase(currentX, currentY)
        break
    }

    this.lastX = currentX
    this.lastY = currentY
  }

  stopDrawing() {
    this.isDrawing = false
  }

  drawPencil(x, y) {
    this.ctx.beginPath()
    this.ctx.moveTo(this.lastX, this.lastY)
    this.ctx.lineTo(x, y)
    this.ctx.strokeStyle = this.currentColor
    this.ctx.lineWidth = this.currentSize
    this.ctx.lineCap = "round"
    this.ctx.stroke()
  }

  drawLine(x, y) {
    // Redraw canvas to show only the final line
    this.redrawCanvas()

    this.ctx.beginPath()
    this.ctx.moveTo(this.lastX, this.lastY)
    this.ctx.lineTo(x, y)
    this.ctx.strokeStyle = this.currentColor
    this.ctx.lineWidth = this.currentSize
    this.ctx.lineCap = "round"
    this.ctx.stroke()
  }

  drawRect(x, y) {
    // Redraw canvas to show only the final rectangle
    this.redrawCanvas()

    const width = x - this.lastX
    const height = y - this.lastY

    this.ctx.beginPath()
    this.ctx.rect(this.lastX, this.lastY, width, height)
    this.ctx.strokeStyle = this.currentColor
    this.ctx.lineWidth = this.currentSize
    this.ctx.stroke()
  }

  drawCircle(x, y) {
    // Redraw canvas to show only the final circle
    this.redrawCanvas()

    const radius = Math.sqrt(Math.pow(x - this.lastX, 2) + Math.pow(y - this.lastY, 2))

    this.ctx.beginPath()
    this.ctx.arc(this.lastX, this.lastY, radius, 0, Math.PI * 2)
    this.ctx.strokeStyle = this.currentColor
    this.ctx.lineWidth = this.currentSize
    this.ctx.stroke()
  }

  erase(x, y) {
    this.ctx.beginPath()
    this.ctx.moveTo(this.lastX, this.lastY)
    this.ctx.lineTo(x, y)
    this.ctx.strokeStyle = "#000"
    this.ctx.lineWidth = this.currentSize * 2
    this.ctx.lineCap = "round"
    this.ctx.stroke()
  }

  fillArea(x, y) {
    // Simple flood fill algorithm
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const data = imageData.data
    const width = this.canvas.width
    const height = this.canvas.height

    // Get target color (color at click position)
    const targetColor = this.getPixelColor(imageData, Math.floor(x), Math.floor(y))

    // Convert current color to RGBA
    const fillColor = this.hexToRgba(this.currentColor)

    // Don't fill if target color is the same as fill color
    if (this.colorsEqual(targetColor, fillColor)) return

    // Stack for flood fill
    const stack = [{ x: Math.floor(x), y: Math.floor(y) }]
    const visited = new Set()

    while (stack.length > 0) {
      const pixel = stack.pop()
      const px = pixel.x
      const py = pixel.y

      // Skip if out of bounds or already visited
      if (px < 0 || px >= width || py < 0 || py >= height || visited.has(`${px},${py}`)) {
        continue
      }

      // Check if pixel matches target color
      const currentColor = this.getPixelColor(imageData, px, py)
      if (!this.colorsEqual(currentColor, targetColor)) {
        continue
      }

      // Set pixel color
      this.setPixelColor(imageData, px, py, fillColor)
      visited.add(`${px},${py}`)

      // Add adjacent pixels to stack
      stack.push({ x: px + 1, y: py })
      stack.push({ x: px - 1, y: py })
      stack.push({ x: px, y: py + 1 })
      stack.push({ x: px, y: py - 1 })
    }

    // Update canvas
    this.ctx.putImageData(imageData, 0, 0)
  }

  getPixelColor(imageData, x, y) {
    const index = (y * imageData.width + x) * 4
    return {
      r: imageData.data[index],
      g: imageData.data[index + 1],
      b: imageData.data[index + 2],
      a: imageData.data[index + 3],
    }
  }

  setPixelColor(imageData, x, y, color) {
    const index = (y * imageData.width + x) * 4
    imageData.data[index] = color.r
    imageData.data[index + 1] = color.g
    imageData.data[index + 2] = color.b
    imageData.data[index + 3] = color.a
  }

  colorsEqual(color1, color2) {
    return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b && color1.a === color2.a
  }

  hexToRgba(hex) {
    // Remove # if present
    hex = hex.replace("#", "")

    // Parse hex values
    const r = Number.parseInt(hex.substring(0, 2), 16)
    const g = Number.parseInt(hex.substring(2, 4), 16)
    const b = Number.parseInt(hex.substring(4, 6), 16)

    return { r, g, b, a: 255 }
  }

  addText(x, y) {
    const text = prompt("Enter text:")
    if (!text) return

    this.ctx.font = `${this.currentSize * 5}px 'VT323', monospace`
    this.ctx.fillStyle = this.currentColor
    this.ctx.fillText(text, x, y)
  }

  clearCanvas() {
    this.ctx.fillStyle = "#000"
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  redrawCanvas() {
    // Store current canvas state
    if (!this.canvasState) {
      this.canvasState = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    }

    // Restore canvas state
    this.ctx.putImageData(this.canvasState, 0, 0)
  }

  saveImage() {
    // Create temporary link
    const link = document.createElement("a")
    link.download = "retro-paint.png"
    link.href = this.canvas.toDataURL("image/png")
    link.click()
  }
}

// Create a function to open Paint in a window
function openPaintWindow(options = {}) {
  if (!window.retroWindows) {
    console.error("RetroWindows not loaded")
    return
  }

  const container = document.createElement("div")

  const win = window.retroWindows.createWindow({
    title: "Retro Paint",
    content: container,
    width: 650,
    height: 550,
    theme: options.theme || "magenta",
  })

  // Initialize paint after window is created
  setTimeout(() => {
    new RetroPaint({
      container: container,
      width: options.width || 600,
      height: options.height || 400,
      theme: options.theme || "magenta",
    })
  }, 100)

  return win
}

// Export to global scope
window.RetroPaint = RetroPaint
window.openPaintWindow = openPaintWindow
