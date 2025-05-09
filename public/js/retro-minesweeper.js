/**
 * RetroMinesweeper - A simple Minesweeper game
 * For retro desktop-style portfolio sites
 */

class RetroMinesweeper {
  constructor(options = {}) {
    this.container = options.container || document.createElement("div")
    this.width = options.width || 10
    this.height = options.height || 10
    this.mines = options.mines || 15
    this.theme = options.theme || "cyan" // cyan, magenta, green, yellow

    this.grid = []
    this.revealed = 0
    this.flagged = []
    this.gameOver = false
    this.gameWon = false
    this.firstClick = true

    this.init()
  }

  init() {
    // Create game container
    this.container.className = "retro-minesweeper"
    this.container.style.display = "flex"
    this.container.style.flexDirection = "column"
    this.container.style.alignItems = "center"
    this.container.style.padding = "10px"

    // Create header
    const header = document.createElement("div")
    header.className = "retro-minesweeper-header"
    header.style.display = "flex"
    header.style.justifyContent = "space-between"
    header.style.width = "100%"
    header.style.marginBottom = "10px"

    // Create mine counter
    this.mineCounter = document.createElement("div")
    this.mineCounter.className = "retro-minesweeper-counter"
    this.mineCounter.style.fontFamily = '"VT323", monospace'
    this.mineCounter.style.fontSize = "20px"
    this.mineCounter.style.padding = "5px 10px"
    this.mineCounter.style.border = "2px solid"
    this.mineCounter.style.backgroundColor = "#000"

    // Create face button
    this.faceButton = document.createElement("button")
    this.faceButton.className = "retro-minesweeper-face"
    this.faceButton.style.fontFamily = '"VT323", monospace'
    this.faceButton.style.fontSize = "20px"
    this.faceButton.style.width = "40px"
    this.faceButton.style.height = "40px"
    this.faceButton.style.border = "2px solid"
    this.faceButton.style.backgroundColor = "#000"
    this.faceButton.style.cursor = "pointer"
    this.faceButton.textContent = "😊"
    this.faceButton.addEventListener("click", () => this.resetGame())

    // Create timer
    this.timer = document.createElement("div")
    this.timer.className = "retro-minesweeper-counter"
    this.timer.style.fontFamily = '"VT323", monospace'
    this.timer.style.fontSize = "20px"
    this.timer.style.padding = "5px 10px"
    this.timer.style.border = "2px solid"
    this.timer.style.backgroundColor = "#000"

    // Apply theme colors
    switch (this.theme) {
      case "cyan":
        this.mineCounter.style.borderColor = "#0ff"
        this.mineCounter.style.color = "#0ff"
        this.faceButton.style.borderColor = "#0ff"
        this.faceButton.style.color = "#0ff"
        this.timer.style.borderColor = "#0ff"
        this.timer.style.color = "#0ff"
        break
      case "magenta":
        this.mineCounter.style.borderColor = "#f0f"
        this.mineCounter.style.color = "#f0f"
        this.faceButton.style.borderColor = "#f0f"
        this.faceButton.style.color = "#f0f"
        this.timer.style.borderColor = "#f0f"
        this.timer.style.color = "#f0f"
        break
      case "green":
        this.mineCounter.style.borderColor = "#0f0"
        this.mineCounter.style.color = "#0f0"
        this.faceButton.style.borderColor = "#0f0"
        this.faceButton.style.color = "#0f0"
        this.timer.style.borderColor = "#0f0"
        this.timer.style.color = "#0f0"
        break
      case "yellow":
        this.mineCounter.style.borderColor = "#ff0"
        this.mineCounter.style.color = "#ff0"
        this.faceButton.style.borderColor = "#ff0"
        this.faceButton.style.color = "#ff0"
        this.timer.style.borderColor = "#ff0"
        this.timer.style.color = "#ff0"
        break
    }

    // Add elements to header
    header.appendChild(this.mineCounter)
    header.appendChild(this.faceButton)
    header.appendChild(this.timer)

    // Create game board
    this.board = document.createElement("div")
    this.board.className = "retro-minesweeper-board"
    this.board.style.display = "grid"
    this.board.style.gridTemplateColumns = `repeat(${this.width}, 30px)`
    this.board.style.gridTemplateRows = `repeat(${this.height}, 30px)`
    this.board.style.gap = "2px"
    this.board.style.backgroundColor = "#222"
    this.board.style.padding = "5px"
    this.board.style.border = "2px solid"

    // Apply theme colors to board
    switch (this.theme) {
      case "cyan":
        this.board.style.borderColor = "#0ff"
        break
      case "magenta":
        this.board.style.borderColor = "#f0f"
        break
      case "green":
        this.board.style.borderColor = "#0f0"
        break
      case "yellow":
        this.board.style.borderColor = "#ff0"
        break
    }

    // Add elements to container
    this.container.appendChild(header)
    this.container.appendChild(this.board)

    // Initialize game
    this.resetGame()
  }

  resetGame() {
    // Reset game state
    this.grid = []
    this.revealed = 0
    this.flagged = []
    this.gameOver = false
    this.gameWon = false
    this.firstClick = true
    this.faceButton.textContent = "😊"

    // Clear board
    this.board.innerHTML = ""

    // Initialize grid
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = []
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = {
          x,
          y,
          mine: false,
          revealed: false,
          flagged: false,
          adjacentMines: 0,
        }

        // Create cell element
        const cell = document.createElement("div")
        cell.className = "retro-minesweeper-cell"
        cell.dataset.x = x
        cell.dataset.y = y
        cell.style.width = "30px"
        cell.style.height = "30px"
        cell.style.backgroundColor = "#444"
        cell.style.display = "flex"
        cell.style.alignItems = "center"
        cell.style.justifyContent = "center"
        cell.style.fontFamily = '"VT323", monospace'
        cell.style.fontSize = "20px"
        cell.style.fontWeight = "bold"
        cell.style.cursor = "pointer"
        cell.style.userSelect = "none"
        cell.style.boxShadow = "inset 2px 2px 0 rgba(255,255,255,0.2), inset -2px -2px 0 rgba(0,0,0,0.2)"

        // Add event listeners
        cell.addEventListener("click", () => this.revealCell(x, y))
        cell.addEventListener("contextmenu", (e) => {
          e.preventDefault()
          this.toggleFlag(x, y)
        })

        this.board.appendChild(cell)
      }
    }

    // Update counters
    this.updateMineCounter()
    this.resetTimer()
  }

  placeMines(firstX, firstY) {
    // Place mines randomly, avoiding the first clicked cell
    let minesPlaced = 0
    while (minesPlaced < this.mines) {
      const x = Math.floor(Math.random() * this.width)
      const y = Math.floor(Math.random() * this.height)

      // Skip if this is the first clicked cell or already has a mine
      if ((x === firstX && y === firstY) || this.grid[y][x].mine) {
        continue
      }

      this.grid[y][x].mine = true
      minesPlaced++
    }

    // Calculate adjacent mines for each cell
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x].mine) continue

        // Count adjacent mines
        let count = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue

            const nx = x + dx
            const ny = y + dy

            if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && this.grid[ny][nx].mine) {
              count++
            }
          }
        }

        this.grid[y][x].adjacentMines = count
      }
    }
  }

  revealCell(x, y) {
    // Ignore if game is over or cell is flagged
    if (this.gameOver || this.grid[y][x].flagged) return

    // Handle first click
    if (this.firstClick) {
      this.firstClick = false
      this.placeMines(x, y)
      this.startTimer()
    }

    // Get cell
    const cell = this.grid[y][x]

    // Ignore if already revealed
    if (cell.revealed) return

    // Reveal cell
    cell.revealed = true
    this.revealed++

    // Update cell appearance
    const cellElement = this.board.querySelector(`[data-x="${x}"][data-y="${y}"]`)
    cellElement.style.backgroundColor = "#222"
    cellElement.style.boxShadow = "none"

    // Check if mine
    if (cell.mine) {
      // Game over
      cellElement.textContent = "💣"
      cellElement.style.backgroundColor = "#f00"
      this.gameOver = true
      this.faceButton.textContent = "😵"
      this.stopTimer()
      this.revealAllMines()
      return
    }

    // Show adjacent mines count
    if (cell.adjacentMines > 0) {
      cellElement.textContent = cell.adjacentMines

      // Color based on count
      switch (cell.adjacentMines) {
        case 1:
          cellElement.style.color = "#0ff"
          break
        case 2:
          cellElement.style.color = "#0f0"
          break
        case 3:
          cellElement.style.color = "#f00"
          break
        case 4:
          cellElement.style.color = "#00f"
          break
        case 5:
          cellElement.style.color = "#800000"
          break
        case 6:
          cellElement.style.color = "#008080"
          break
        case 7:
          cellElement.style.color = "#000"
          break
        case 8:
          cellElement.style.color = "#808080"
          break
      }
    } else {
      // Auto-reveal adjacent cells if no adjacent mines
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue

          const nx = x + dx
          const ny = y + dy

          if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && !this.grid[ny][nx].revealed) {
            this.revealCell(nx, ny)
          }
        }
      }
    }

    // Check for win
    this.checkWin()
  }

  toggleFlag(x, y) {
    // Ignore if game is over or cell is revealed
    if (this.gameOver || this.grid[y][x].revealed) return

    // Toggle flag
    this.grid[y][x].flagged = !this.grid[y][x].flagged

    // Update cell appearance
    const cellElement = this.board.querySelector(`[data-x="${x}"][data-y="${y}"]`)
    cellElement.textContent = this.grid[y][x].flagged ? "🚩" : ""

    // Update flagged array
    if (this.grid[y][x].flagged) {
      this.flagged.push({ x, y })
    } else {
      this.flagged = this.flagged.filter((pos) => pos.x !== x || pos.y !== y)
    }

    // Update mine counter
    this.updateMineCounter()
  }

  revealAllMines() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x]

        if (cell.mine && !cell.revealed) {
          const cellElement = this.board.querySelector(`[data-x="${x}"][data-y="${y}"]`)
          cellElement.textContent = "💣"
          cellElement.style.backgroundColor = "#222"
          cellElement.style.boxShadow = "none"
        }
      }
    }
  }

  checkWin() {
    // Win if all non-mine cells are revealed
    if (this.revealed === this.width * this.height - this.mines) {
      this.gameOver = true
      this.gameWon = true
      this.faceButton.textContent = "😎"
      this.stopTimer()

      // Flag all mines
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.grid[y][x].mine && !this.grid[y][x].flagged) {
            this.toggleFlag(x, y)
          }
        }
      }
    }
  }

  updateMineCounter() {
    this.mineCounter.textContent = String(this.mines - this.flagged.length).padStart(3, "0")
  }

  startTimer() {
    this.timerValue = 0
    this.timer.textContent = "000"

    this.timerInterval = setInterval(() => {
      this.timerValue++
      this.timer.textContent = String(this.timerValue).padStart(3, "0")

      // Cap at 999
      if (this.timerValue >= 999) {
        this.stopTimer()
      }
    }, 1000)
  }

  resetTimer() {
    this.stopTimer()
    this.timerValue = 0
    this.timer.textContent = "000"
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }
}

// Create a function to open Minesweeper in a window
function openMinesweeperWindow(options = {}) {
  if (!window.retroWindows) {
    console.error("RetroWindows not loaded")
    return
  }

  const container = document.createElement("div")

  const win = window.retroWindows.createWindow({
    title: "Minesweeper",
    content: container,
    width: 400,
    height: 450,
    theme: options.theme || "green",
    resizable: false,
  })

  // Initialize game after window is created
  setTimeout(() => {
    new RetroMinesweeper({
      container: container,
      width: options.width || 10,
      height: options.height || 10,
      mines: options.mines || 15,
      theme: options.theme || "green",
    })
  }, 100)

  return win
}

// Export to global scope
window.RetroMinesweeper = RetroMinesweeper
window.openMinesweeperWindow = openMinesweeperWindow
