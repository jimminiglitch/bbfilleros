<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TOADER</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>
    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden; /* critical to remove scrollbars */
      background: black;
      color: #00FF00;
      font-family: 'Press Start 2P', monospace;
    }
    canvas {
      display: block;
      margin: 0 auto;
      max-width: 100%;
      max-height: 100%;
    }
    .score, .lives {
      font-size: 0.8rem;
      text-align: center;
      margin: 5px;
    }
  </style>
</head>
<body>
  <div class="score">Score: 0</div>
  <div class="lives">Lives: 3</div>
  <canvas id="game-canvas" width="800" height="600"></canvas>

  <audio id="background-music" loop src="your_music.mp3"></audio>
  <audio id="jump-sound" src="jump.wav"></audio>
  <audio id="hit-sound" src="hit.wav"></audio>

  <script src="toader.js"></script>
</body>
</html>
