// main.js - Game integration

// Initialize Phaser game
function initGame() {
  // Check if game is already initialized
  if (window.gameInstance) return

  // Check if Phaser is loaded
  if (typeof Phaser === "undefined") {
    console.error("Phaser is not loaded")
    return
  }

  // Game configuration
  const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 400,
    parent: "game-canvas",
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, MainScene],
  }

  // Create game instance
  window.gameInstance = new Phaser.Game(config)

  // Update mission log when port is entered
  window.updateMissionLog = (text) => {
    const missionText = document.querySelector(".game-instructions p:nth-child(2)")
    if (missionText) {
      missionText.textContent = text
    }
  }
}

// Phaser game scenes
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" })
  }

  preload() {
    // Create loading text
    this.add
      .text(400, 200, "LOADING ASSETS...", {
        font: "16px monospace",
        fill: "#00ffcc",
        align: "center",
      })
      .setOrigin(0.5)

    // Load game assets
    this.load.image("ship", "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/ship.png")
    this.load.image("ocean", "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/ocean.png")
    this.load.image("port", "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/port.png")
    this.load.image("timeOrb", "https://cdn.glitch.global/09e9ba26-fd4e-41f2-88c1-651c3d32a01a/orb.png")
  }

  create() {
    this.scene.start("MainScene")
  }
}

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" })
  }

  create() {
    // Background
    this.ocean = this.add.tileSprite(400, 200, 800, 400, "ocean")

    // Ship
    this.ship = this.physics.add.image(400, 200, "ship").setScale(0.5)
    this.ship.setCollideWorldBounds(true)

    // Port
    this.port = this.physics.add.staticImage(700, 300, "port").setScale(0.7)
    this.physics.add.collider(this.ship, this.port, this.enterPort, null, this)

    // Time orbs
    this.timeOrbs = this.physics.add.group()
    this.spawnTimeOrbs()
    this.physics.add.overlap(this.ship, this.timeOrbs, this.collectTimeOrb, null, this)

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys()
    this.wKey = this.input.keyboard.addKey("W")

    // Time energy
    this.timeEnergy = 100
    this.timeText = this.add.text(10, 10, "Time Energy: 100", {
      font: "16px monospace",
      fill: "#00ffcc",
      stroke: "#000",
      strokeThickness: 4,
    })

    // Warp ability
    this.canWarp = true
    this.warpText = this.add.text(10, 30, "Warp: READY", {
      font: "16px monospace",
      fill: "#ff77aa",
      stroke: "#000",
      strokeThickness: 4,
    })

    // Mission text
    window.updateMissionLog("Navigate to the port to trade time energy and discover new missions.")
  }

  update() {
    // Ship movement
    const speed = 160
    let isMoving = false

    if (this.cursors.left.isDown) {
      this.ship.setVelocityX(-speed)
      isMoving = true
    } else if (this.cursors.right.isDown) {
      this.ship.setVelocityX(speed)
      isMoving = true
    } else {
      this.ship.setVelocityX(0)
    }

    if (this.cursors.up.isDown) {
      this.ship.setVelocityY(-speed)
      isMoving = true
    } else if (this.cursors.down.isDown) {
      this.ship.setVelocityY(speed)
      isMoving = true
    } else {
      this.ship.setVelocityY(0)
    }

    // Drain time energy when moving
    if (isMoving) {
      this.timeEnergy = Math.max(0, this.timeEnergy - 0.1)
      this.timeText.setText(`Time Energy: ${this.timeEnergy.toFixed(0)}`)
    }

    // Warp ability
    if (this.cursors.space.isDown && this.canWarp && this.timeEnergy >= 20) {
      this.warp()
    }

    // Refill time energy (cheat)
    if (this.wKey.isDown) {
      this.timeEnergy = 100
      this.timeText.setText(`Time Energy: ${this.timeEnergy.toFixed(0)}`)
      window.updateMissionLog("Time energy refilled! This is a developer cheat.")
    }

    // Update ocean background
    this.ocean.tilePositionX += 0.5
  }

  warp() {
    // Visual effect
    this.cameras.main.flash(500, 0, 255, 204)

    // Move ship forward
    const angle = Phaser.Math.DegToRad(this.ship.angle)
    this.ship.x += Math.cos(angle) * 200
    this.ship.y += Math.sin(angle) * 200

    // Use time energy
    this.timeEnergy -= 20
    this.timeText.setText(`Time Energy: ${this.timeEnergy.toFixed(0)}`)

    // Cooldown
    this.canWarp = false
    this.warpText.setText("Warp: COOLDOWN")
    this.warpText.setFill("#777777")

    setTimeout(() => {
      this.canWarp = true
      this.warpText.setText("Warp: READY")
      this.warpText.setFill("#ff77aa")
    }, 3000)

    window.updateMissionLog("Warp successful! Time-space continuum briefly disrupted.")
  }

  enterPort() {
    // Stop ship
    this.ship.setVelocity(0, 0)

    // Display port message
    const portMessage = this.add.text(200, 150, "PORT ENTERED\nTrade. Spy. Rest.", {
      font: "20px monospace",
      fill: "#ff77aa",
      backgroundColor: "#222",
      padding: { x: 20, y: 10 },
    })

    // Refill time energy
    this.timeEnergy = 100
    this.timeText.setText(`Time Energy: ${this.timeEnergy.toFixed(0)}`)

    // Update mission log
    window.updateMissionLog(
      "Port entered! You've traded artifacts for time energy. New mission: Collect 5 time orbs and return to port.",
    )

    // Remove port message after a few seconds
    setTimeout(() => {
      portMessage.destroy()
    }, 3000)
  }

  spawnTimeOrbs() {
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(50, 750)
      const y = Phaser.Math.Between(50, 350)

      const orb = this.timeOrbs.create(x, y, "timeOrb").setScale(0.3)
      orb.setTint(0x00ffcc)

      // Add glow effect
      this.tweens.add({
        targets: orb,
        alpha: 0.6,
        duration: 1000,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: -1,
      })
    }
  }

  collectTimeOrb(ship, orb) {
    orb.destroy()

    // Add time energy
    this.timeEnergy = Math.min(100, this.timeEnergy + 10)
    this.timeText.setText(`Time Energy: ${this.timeEnergy.toFixed(0)}`)

    // Visual effect
    this.cameras.main.flash(300, 0, 255, 204, false)

    // Update mission log
    window.updateMissionLog("Time orb collected! These artifacts contain pure chronological energy.")

    // Respawn orb after a delay
    setTimeout(() => {
      if (this.timeOrbs.countActive() < 5) {
        const x = Phaser.Math.Between(50, 750)
        const y = Phaser.Math.Between(50, 350)

        const orb = this.timeOrbs.create(x, y, "timeOrb").setScale(0.3)
        orb.setTint(0x00ffcc)

        // Add glow effect
        this.tweens.add({
          targets: orb,
          alpha: 0.6,
          duration: 1000,
          ease: "Sine.easeInOut",
          yoyo: true,
          repeat: -1,
        })
      }
    }, 5000)
  }
}
