class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    this.load.image('ship', 'assets/ship.png');
    this.load.image('ocean', 'assets/ocean.png');
    this.load.image('port', 'assets/port_tile.png');
    this.load.audio('warp', 'assets/sfx/warp.ogg');
    this.load.audio('sail', 'assets/sfx/sail.ogg');
    this.load.audio('portSound', 'assets/sfx/port.ogg');
  }

  create() {
    this.scene.start('MainScene');
  }
}

class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    this.add.tileSprite(400, 300, 800, 600, 'ocean');
    this.ship = this.physics.add.image(400, 300, 'ship').setScale(0.5);
    this.ship.setCollideWorldBounds(true);

    this.port = this.physics.add.staticImage(700, 500, 'port').setScale(0.7);
    this.physics.add.collider(this.ship, this.port, this.enterPort, null, this);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.timeEnergy = 100;
    this.timeText = this.add.text(10, 10, 'Time Energy: 100', { font: '16px monospace', fill: '#00ffcc' });
  }

  update() {
    let speed = 160;

    if (this.cursors.left.isDown) {
      this.ship.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.ship.setVelocityX(speed);
    } else {
      this.ship.setVelocityX(0);
    }

    if (this.cursors.up.isDown) {
      this.ship.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.ship.setVelocityY(speed);
    } else {
      this.ship.setVelocityY(0);
    }

    // Drain time energy
    if (this.ship.body.velocity.length() > 0) {
      this.timeEnergy = Math.max(0, this.timeEnergy - 0.1);
      this.timeText.setText(`Time Energy: ${this.timeEnergy.toFixed(0)}`);
    }
  }

  enterPort() {
    this.sound.play('portSound');
    this.add.text(200, 200, 'PORT ENTERED\nTrade. Spy. Rest.', {
      font: '20px monospace',
      fill: '#ff77aa',
      backgroundColor: '#222',
      padding: { x: 20, y: 10 }
    });
    this.ship.setVelocity(0, 0);
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, MainScene]
};

const game = new Phaser.Game(config);
