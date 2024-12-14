const game = document.getElementById("game");
const ctx = game.getContext("2d");

const gridSize = 20;
const cellSize = 20;
const startX = 5;
const startY = 5;
const offset = 2;
const apple = { x: 10, y: 10 };
const tail = [];
const snake = {
  x: startX,
  y: startY,
  velocityX: 1,
  velocityY: 0,
  length: 3,
};
const snakeColors = ["#63c74d", "#3e8948", "#265c42", "#193c3e"];
const gameOverImage = new Image();
gameOverImage.src = "img/gameOver.png";
let gamePaused = false;
let isGameOver = false;
let debouncePause = false;
let isGameStarted = false;

setInterval(loop, 1000 / 8);
document.addEventListener("keydown", handleMovement);
document.getElementById("pause").addEventListener("click", togglePause);
document.getElementById("restart").addEventListener("click", restartGame);

let score = 0;

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

game.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  touchStartX = touch.pageX;
  touchStartY = touch.pageY;
});

game.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchEndX = touch.pageX;
    touchEndY = touch.pageY;
  },
  { passive: false }
);

game.addEventListener("touchend", (e) => {
  e.preventDefault();

  if (isGameOver) {
    if (gameOverImage.complete) {
      restartGame();
    } else {
      gameOverImage.onload = restartGame;
    }
    return;
  }

  if (!isGameStarted) {
    isGameStarted = true;
    return;
  }

  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX > 0) {
      handleMovement({ key: "ArrowRight" });
    } else {
      handleMovement({ key: "ArrowLeft" });
    }
  } else {
    if (deltaY > 0) {
      handleMovement({ key: "ArrowDown" });
    } else {
      handleMovement({ key: "ArrowUp" });
    }
  }
});

document.body.addEventListener(
  "touchmove",
  function (e) {
    e.preventDefault();
  },
  { passive: false }
);

let highScore = localStorage.getItem("highScore") || 0;
highScore = parseInt(highScore, 10);

function updateHighScore() {
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
}

function updateScoreDisplay() {
  document.getElementById(
    "scoreboard"
  ).innerText = `Score : ${score} | Record : ${highScore}`;
}

function loop() {
  if (!isGameStarted) {
    drawStartMessage(); // Affiche le message tant que le jeu n'a pas commencé
    return;
  }

  // Dès que le jeu commence, cache le message de démarrage
  const startMessage = document.getElementById("start-message");
  if (startMessage.style.display !== "none") {
    startMessage.style.display = "none";
  }

  if (gamePaused || isGameOver) return;

  if (willCollideWithWall()) {
    gameOver();
    return;
  }

  snake.x += snake.velocityX;
  snake.y += snake.velocityY;

  ctx.fillStyle = "#181425";
  ctx.fillRect(0, 0, game.width, game.height);

  // Affichage de la pomme
  ctx.fillStyle = "#ff0044";
  ctx.fillRect(
    apple.x * cellSize + offset / 2,
    apple.y * cellSize + offset / 2,
    cellSize - offset,
    cellSize - offset
  );

  // Affichage du serpent
  for (let i = 0; i < tail.length; i++) {
    ctx.fillStyle =
      snakeColors[Math.min(tail.length - i - 1, snakeColors.length - 1)];
    ctx.fillRect(
      tail[i].x * cellSize + offset / 2,
      tail[i].y * cellSize + offset / 2,
      cellSize - offset,
      cellSize - offset
    );

    // Collision avec la queue
    if (tail[i].x === snake.x && tail[i].y === snake.y) {
      gameOver();
      return;
    }
  }

  // Mise à jour de la position du serpent
  tail.push({ x: snake.x, y: snake.y });

  while (tail.length > snake.length) {
    tail.shift();
  }

  // Collision avec la pomme
  if (snake.x === apple.x && snake.y === apple.y) {
    snake.length++;
    score++;
    placeApple();
  }

  // Mise à jour du score et du record
  updateHighScore();
  updateScoreDisplay();
}

function willCollideWithWall() {
  if (snake.velocityX === 1 && snake.x >= gridSize) return true;
  if (snake.velocityX === -1 && snake.x < 0) return true;
  if (snake.velocityY === 1 && snake.y >= gridSize) return true;
  if (snake.velocityY === -1 && snake.y < 0) return true;
  return false;
}

function gameOver() {
  isGameOver = true;
  gamePaused = true;
  updatePauseButton();

  ctx.fillStyle = "#181425";
  ctx.fillRect(0, 0, game.width, game.height);

  const imgWidth = game.width * 0.8;
  const imgHeight = imgWidth * (gameOverImage.height / gameOverImage.width);
  const imgX = game.width / 2 - imgWidth / 2;
  const imgY = 20;

  gameOverImage.onload = () => {
    ctx.drawImage(gameOverImage, imgX, imgY, imgWidth, imgHeight);
    drawMessage("restart");
  };
  if (gameOverImage.complete) {
    ctx.drawImage(gameOverImage, imgX, imgY, imgWidth, imgHeight);
    drawMessage("restart");
  }

  document.removeEventListener("keydown", handleRestart);
  game.removeEventListener("click", handleRestart);
  game.removeEventListener("touchstart", handleRestart);
  game.removeEventListener("touchend", handleRestart);

  document.addEventListener("keydown", handleRestart);
  game.addEventListener("click", handleRestart);
  game.addEventListener("touchstart", handleRestart);
  game.addEventListener("touchend", handleRestart);
}

function drawMessage(type) {
  const startMessage = document.getElementById("start-message");
  const restartMessage = document.getElementById("restart-message");

  if (type === "start") {
    startMessage.style.display = "block";
    restartMessage.style.display = "none";
  } else if (type === "restart") {
    startMessage.style.display = "none";
    restartMessage.style.display = "block";
  } else {
    startMessage.style.display = "none";
    restartMessage.style.display = "none";
  }
}

function drawStartMessage() {
  drawMessage("start");
}

function handleRestart(e) {
  if (e.key === " " || e.type === "click") {
    restartGame();
    document.removeEventListener("keydown", handleRestart);
    game.removeEventListener("click", handleRestart);
  }
}

function restartGame() {
  isGameOver = false;
  gamePaused = false;

  score = 0;
  snake.x = startX;
  snake.y = startY;
  snake.velocityX = 1;
  snake.velocityY = 0;
  snake.length = 3;
  tail.splice(0, tail.length);
  placeApple();

  updateScoreDisplay();
  drawStartMessage();
  drawMessage(null);
}

function placeApple() {
  const freeCells = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let isOccupied = tail.some(
        (segment) => segment.x === i && segment.y === j
      );
      if (!isOccupied) {
        freeCells.push({ x: i, y: j });
      }
    }
  }
  const index = Math.floor(Math.random() * freeCells.length);
  apple.x = freeCells[index].x;
  apple.y = freeCells[index].y;
}

function handleMovement(e) {
  if (e.key === " " || e.key === "Pause") {
    if (!isGameStarted) {
      isGameStarted = true;
    } else {
      togglePause();
    }
    return;
  }

  if (gamePaused || isGameOver || !isGameStarted) return;

  switch (e.key) {
    case "ArrowDown":
    case "s":
      if (snake.velocityY === -1) return;
      snake.velocityY = 1;
      snake.velocityX = 0;
      break;
    case "ArrowUp":
    case "z":
      if (snake.velocityY === 1) return;
      snake.velocityY = -1;
      snake.velocityX = 0;
      break;
    case "ArrowLeft":
    case "q":
      if (snake.velocityX === 1) return;
      snake.velocityX = -1;
      snake.velocityY = 0;
      break;
    case "ArrowRight":
    case "d":
      if (snake.velocityX === -1) return;
      snake.velocityX = 1;
      snake.velocityY = 0;
  }
}

function togglePause() {
  if (debouncePause) return;

  debouncePause = true;
  gamePaused = !gamePaused;
  updatePauseButton();

  setTimeout(() => {
    debouncePause = false;
  }, 300);
}

function updatePauseButton() {
  const pauseButton = document.getElementById("pause");
  if (gamePaused) {
    pauseButton.classList.remove("playing");
    pauseButton.classList.add("paused");
  } else {
    pauseButton.classList.remove("paused");
    pauseButton.classList.add("playing");
  }
}

updatePauseButton();
