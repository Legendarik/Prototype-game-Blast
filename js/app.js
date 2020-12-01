//Loading resources
resources.load([
  "img/sprite_blocks.png",
  "img/field.png",
  "img/panel_score.png",
  "img/button_mix.png",
  "img/button_new_game.png",
  "img/progress_bar.png",
  "img/progress_bar_full.png",
  "img/button_pause.png",
]);
resources.onReady(init);

// Field object
let field = {
  x: 30, //field's position X
  y: 150, //field's position Y
  columns: 5, // Number of tile columns
  rows: 5, // Number of tile rows
  numberColors: 5, //Number of colors 1-5
  dTileWidth: 58, // Visual width of a tile
  dTileHeight: 64, // Visual height of a tile
  sTileWidth: 58, // Width of a tile on sprite
  sTileHeight: 64, // Height of a tile on sprite
  offsetX: 30, //Offset tiles from left and right
  offsetY: 30, //Offset tiles from top and bot
  tiles: [], // The two-dimensional tile array
  mixTiles: 3, //Number of mix tiles
};

// Get the canvas and context
let canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d");
field.width = field.offsetY + field.columns * field.dTileWidth;
field.height = field.offsetX + field.rows * field.dTileHeight;
canvas.width = field.width + 600;
canvas.height = field.height + 200;
document.body.appendChild(canvas);
document.body.style.margin = "0";
canvas.style.display = "block";
canvas.style.margin = "auto";

// Timing and frames per second
let lastTime = 0;
let timecount = 0;
let animationTime = 0;
let animationTotalTime = 0.4;
let timeForLevel = 45;
let gameOverTime = { levelOne: timeForLevel };

// Clusters and moves that were found
let clusters = []; // { row, column }
let movesForWin = 20; //number of moves for win game
let countMoves = { levelOne: 0 }; //count moves
let moves = []; //
let countBurnTiles = 2; //count tiles for remove

// Score
let score = 0;
let winScore = 6000;

//Count for mix tiles
let countmix = field.mixTiles;

// Game states
let gameover = false;
let youwin = false;
let pause = false;
let gamestates = { ready: 0, resolve: 1 };
let gamestate = gamestates.ready;

//Game Fild
let fieldBg;

// Buttons
let buttons = [
  {
    x: field.x + field.width + 290,
    y: field.y + field.height - 30,
    width: 200,
    height: 60,
    text: "Новая игра",
  },
  {
    x: canvas.width - 120,
    y: 0,
    width: 80,
    height: 80,
    text: "",
  },
  {
    x: field.width + field.x + 100,
    y: field.y + field.height - 30,
    width: 150,
    height: 60,
    text: `Перемешать: ${countmix}`,
  },
];

// Initialize the game
function init() {
  // Initialize the two-dimensional tile array
  for (let i = 0; i < field.rows; i++) {
    field.tiles[i] = [];
    for (let j = 0; j < field.columns; j++) {
      field.tiles[i][j] = [];
    }
  }
  lastTime = Date.now();

  // New game
  newGame();
}

// Start a new game
function newGame() {
  //Add mouse event
  canvas.addEventListener("click", removeSelectedClusters);
  // canvas.addEventListener("click", selectedButton);

  // Reset score
  score = 0;

  //Reset time for game
  gameOverTime.levelOne = timeForLevel;

  //Reset moves for game
  countMoves.levelOne = movesForWin;

  // Reset game states
  gameover = false;
  youwin = false;
  pause = false;

  //Reset count for mix tiles
  countmix = field.mixTiles;
  buttons[2].text = `Перемешать: ${countmix}`;

  // Enter main loop
  createField();

  main();
}

// Main loop
function main() {
  let now = Date.now();
  let dt = (now - lastTime) / 1000.0;
  lastTime = now;
  update(dt);
  if (!pause && !gameover && !youwin) {
    canvas.addEventListener("click", selectedButton);
    canvas.removeEventListener("click", pauseOff);
    timecount += dt;
  }
  if (gameOverTime.levelOne == 0) {
    gameover = !gameover;
    gameOverTime.levelOne = timeForLevel;
  }

  // Render the game
  render();

  // Request animation frames
  window.requestAnimationFrame(main);
}
function update(dt) {
  if (gamestate == 1) {
    animationTime += dt;
    if (animationTime > animationTotalTime) {
      animationTime = 0;
      shiftTiles();
      gamestate = gamestates.ready;
    }
  }

  if (timecount > 1) {
    timecount = 0;
    gameOverTime.levelOne--;
    findmoves();
  }
}

// Render the game
function render() {
  // Draw the frame
  drawFrame();

  //Draw score
  drawScore();

  //Draw text "time" for countdown
  drawTime();

  //Draw resolve moves for game
  drawCountMoves();

  //Draw text "progress" for progressbar
  ctx.fillStyle = "#ffffff";
  ctx.font = "24px Marvin";
  drawCenterText("Прогресс", 0, 25, canvas.width);

  //Draw countdown
  drawCountdown();
  // Draw buttons
  drawButtons();

  // Render tiles
  renderTiles();

  // Game Over overlay
  if (youwin) {
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Marvin";
    drawCenterText("Поздравляем!", 0, canvas.height / 2 - 30, canvas.width);
    drawCenterText("Вы выиграли!", 0, canvas.height / 2, canvas.width);
    drawCenterText("Сыграем ещё?", 0, canvas.height / 2 + 30, canvas.width);

    canvas.removeEventListener("click", selectedButton);
    canvas.addEventListener("click", newGameWhenHameOver);
  } else if (gameover) {
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Marvin";
    drawCenterText("Игра окончена", 0, canvas.height / 2 - 30, canvas.width);
    drawCenterText(`Очки: ${score}`, 0, canvas.height / 2, canvas.width);
    drawCenterText("Сыграем ещё?", 0, canvas.height / 2 + 30, canvas.width);

    canvas.removeEventListener("click", selectedButton);
    canvas.addEventListener("click", newGameWhenHameOver);
  } else if (pause) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Marvin";
    drawCenterText("ПАУЗА", 0, canvas.height / 2, canvas.width);
  }
}

// Draw a frame with a border
function drawFrame() {
  //Draw canvas background
  ctx.fillStyle = "#a1a1a1";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw field background
  fieldBg = ctx.drawImage(
    resources.get("img/field.png"),
    field.x,
    field.y,
    field.width,
    field.height
  );

  //Draw panel score
  panelScore = ctx.drawImage(
    resources.get("img/panel_score.png"),
    field.width + field.x + 150,
    field.y,
    300,
    300
  );

  //Drow progress bar
  progressBar = ctx.drawImage(
    resources.get("img/progress_bar.png"),
    canvas.width / 2 - 200,
    -15,
    400,
    100
  );

  drawProgressLine();
}

// Draw progress line
function drawProgressLine() {
  progressLine = ctx.drawImage(
    resources.get("img/progress_bar_full.png"),
    0,
    0,
    (1260 * score) / winScore,
    104,
    canvas.width / 2 - 186,
    40.5,
    (366 * score) / winScore,
    28
  );
}

//Draw score
function drawScore() {
  ctx.fillStyle = "#fff";
  ctx.font = "24px Marvin";
  drawCenterText("Очки:", field.x + field.width + 150, field.y + 220, 300);
  drawCenterText(score, field.x + field.width + 150, field.y + 255, 300);
}

//Draw countdown
function drawCountdown() {
  ctx.fillStyle = "#fff";
  ctx.font = "36px Marvin";
  drawCenterText(
    gameOverTime.levelOne,
    field.x + field.width + 150,
    field.y + 130,
    300
  );
}

function drawTime() {
  ctx.fillStyle = "#fff";
  ctx.font = "24px Marvin";
  drawCenterText("ВРЕМЯ:", field.x + field.width + 155, field.y + 30, 300);
}

function drawCountMoves() {
  countMoves.img = ctx.drawImage(
    resources.get("img/button_new_game.png"),
    field.x + 120,
    0,
    100,
    30
  );
  ctx.fillStyle = "#fff";
  ctx.font = "12px Marvin";
  drawCenterText(`ХОДОВ: ${countMoves.levelOne}`, field.x + 120, 20, 100);
}

// Draw buttons
function drawButtons() {
  //Draw button new game
  buttonNewGame = ctx.drawImage(
    resources.get("img/button_new_game.png"),
    buttons[0].x,
    buttons[0].y,
    buttons[0].width,
    buttons[0].height
  );

  //Draw button pause
  buttonPause = ctx.drawImage(
    resources.get("img/button_pause.png"),
    buttons[1].x,
    buttons[1].y,
    buttons[1].width,
    buttons[1].height
  );

  //Draw button mix
  buttonMix = ctx.drawImage(
    resources.get("img/button_mix.png"),
    buttons[2].x,
    buttons[2].y,
    buttons[2].width,
    buttons[2].height
  );

  for (let i = 0; i < buttons.length; i++) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Marvin";
    let textdim = ctx.measureText(buttons[i].text);
    ctx.fillText(
      buttons[i].text,
      buttons[i].x + (buttons[i].width - textdim.width) / 2,
      buttons[i].y + 35
    );
  }
}

// Render tiles
function renderTiles() {
  for (let i = 0; i < field.rows; i++) {
    for (let j = 0; j < field.columns; j++) {
      ctx.save();
      ctx.translate(field.tiles[i][j].pos[0], field.tiles[i][j].pos[1]);
      field.tiles[i][j].sprite.render(ctx);
      ctx.translate(-field.tiles[i][j].pos[0], -field.tiles[i][j].pos[1]);
    }
  }
}
// Draw text that is centered
function drawCenterText(text, x, y, width) {
  let textdim = ctx.measureText(text);
  ctx.fillText(text, x + (width - textdim.width) / 2, y);
}

// Create a random Field
function createField() {
  // Create a field with random tiles
  for (let i = 0; i < field.rows; i++) {
    for (let j = 0; j < field.columns; j++) {
      field.tiles[i][j].sprite = getRandomTile();
      field.tiles[i][j].pos = [
        field.x + field.offsetX / 2 + j * field.dTileWidth,
        field.y + field.offsetY / 2 + i * field.dTileHeight,
      ];
    }
  }
}

// Get a random tile
function getRandomTile() {
  let tile = {};
  let tileNumber = Math.floor(Math.random() * field.numberColors);
  switch (tileNumber) {
    case 0:
      tile = new Sprite(
        "img/sprite_blocks.png",
        [0, 0],
        [field.sTileWidth, field.sTileHeight],
        [field.dTileWidth, field.dTileHeight],
        "blue"
      );
      break;
    case 1:
      tile = new Sprite(
        "img/sprite_blocks.png",
        [field.sTileWidth, 0],
        [field.sTileWidth, field.sTileHeight],
        [field.dTileWidth, field.dTileHeight],
        "purple"
      );
      break;
    case 2:
      tile = new Sprite(
        "img/sprite_blocks.png",
        [field.sTileWidth * 2, 0],
        [field.sTileWidth, field.sTileHeight],
        [field.dTileWidth, field.dTileHeight],
        "red"
      );
      break;
    case 3:
      tile = new Sprite(
        "img/sprite_blocks.png",
        [field.sTileWidth * 3, 0],
        [field.sTileWidth, field.sTileHeight],
        [field.dTileWidth, field.dTileHeight],
        "yellow"
      );
      break;
    default:
      tile = new Sprite(
        "img/sprite_blocks.png",
        [field.sTileWidth * 4, 0],
        [field.sTileWidth, field.sTileHeight],
        [field.dTileWidth, field.dTileHeight],
        "green"
      );
      break;
  }
  return tile;
}

//Сhecking identical tiles
function checkEqualTiles(i, j) {
  if (field.tiles[i][j].sprite.color != 0) {
    clusters.push([i, j]);
    if (
      j != field.columns - 1 &&
      !checkDuplicates(i, j + 1) &&
      field.tiles[i][j].sprite.color === field.tiles[i][j + 1].sprite.color
    ) {
      checkEqualTiles(i, j + 1);
    }
    if (
      j != 0 &&
      !checkDuplicates(i, j - 1) &&
      field.tiles[i][j].sprite.color === field.tiles[i][j - 1].sprite.color
    ) {
      checkEqualTiles(i, j - 1);
    }
    if (
      i != field.rows - 1 &&
      !checkDuplicates(i + 1, j) &&
      field.tiles[i][j].sprite.color === field.tiles[i + 1][j].sprite.color
    ) {
      checkEqualTiles(i + 1, j);
    }
    if (
      i != 0 &&
      !checkDuplicates(i - 1, j) &&
      field.tiles[i][j].sprite.color === field.tiles[i - 1][j].sprite.color
    ) {
      checkEqualTiles(i - 1, j);
    }
  }
}

//Сhecking identical tiles
function checkDuplicates(i, j) {
  for (let k = 0; k < clusters.length; k++) {
    if (i === clusters[k][0] && j === clusters[k][1]) {
      return true;
    }
  }
  return false;
}

//Checking available moves
function findmoves() {
  moves = [];
  for (let i = 0; i < field.rows; i++) {
    for (let j = 0; j < field.columns; j++) {
      clusters = [];
      checkEqualTiles(i, j);
      if (clusters.length >= 2) {
        moves.push(clusters);
      }
    }
  }
  if (moves.length == 0 && countmix == 0) {
    gameover = true;
  }
}

// Remove the clusters
function removeClusters() {
  if (clusters.length >= countBurnTiles) {
    for (let i = 0; i < clusters.length; i++) {
      field.tiles[clusters[i][0]][clusters[i][1]].sprite.size = [0, 0];
      field.tiles[clusters[i][0]][clusters[i][1]].sprite.color = 0;
    }
  }
}

//Shift tiles
function shiftTiles() {
  for (let i = field.rows - 1; i >= 0; i--) {
    for (let j = field.columns - 1; j >= 0; j--) {
      if (field.tiles[i][j].sprite.color == 0) {
        if (i == 0) {
          field.tiles[i][j].sprite = getRandomTile();
          continue;
        }

        for (let k = i - 1; k >= 0; k--) {
          if (field.tiles[k][j].sprite.color != 0) {
            swapTiles(i, j, k, j);
            break;
          } else if (k === 0) {
            field.tiles[i][j].sprite = getRandomTile();
            break;
          }
        }
      }
    }
  }
}

//Swap tiles for shifting
function swapTiles(y1, x1, y2, x2) {
  let tmpSprite = field.tiles[y1][x1].sprite;
  field.tiles[y1][x1].sprite = field.tiles[y2][x2].sprite;
  field.tiles[y2][x2].sprite = tmpSprite;
}

//Mix tiles
function mixTiles() {
  if (countmix > 0) {
    countmix--;
    buttons[2].text = `Перемешать: ${countmix}`;

    for (let i = 0; i < field.rows; i++) {
      for (let j = 0; j < field.columns; j++) {
        swapTiles(
          i,
          j,
          Math.floor(field.rows * Math.random()),
          Math.floor(field.columns * Math.random())
        );
      }
    }
  }
}

// Mouse events
function removeSelectedClusters(event) {
  let mouseX = event.offsetX;
  let mouseY = event.offsetY;
  gamestate = gamestates.resolve;
  for (let i = 0; i < field.rows; i++) {
    for (let j = 0; j < field.columns; j++) {
      if (!gameover && !youwin && !pause) {
        if (
          mouseX >= field.tiles[i][j].pos[0] &&
          mouseX < field.tiles[i][j].pos[0] + field.dTileWidth &&
          mouseY > field.tiles[i][j].pos[1] &&
          mouseY < field.tiles[i][j].pos[1] + field.dTileHeight
        ) {
          clusters = [];
          checkEqualTiles(i, j);
          if (clusters.length >= countBurnTiles) {
            score += 200 * (clusters.length - 1);
            countMoves.levelOne--;
          }
          if (countMoves.levelOne == 0 && score != winScore) {
            gameover = true;
          }
          if (score >= winScore) {
            youwin = true;
          }
          removeClusters();
        }
      }
    }
  }
}

function selectedButton(event) {
  let mouseX = event.offsetX;
  let mouseY = event.offsetY;
  for (let i = 0; i < buttons.length; i++) {
    if (
      mouseX >= buttons[i].x &&
      mouseX <= buttons[i].x + buttons[i].width &&
      mouseY >= buttons[i].y &&
      mouseY <= buttons[i].y + buttons[i].height
    ) {
      if (i == 0 && !pause) {
        newGame();
      } else if (i == 1) {
        pause = !pause;
        if (pause) {
          canvas.removeEventListener("click", selectedButton);
          canvas.addEventListener("click", pauseOff);
        }
      } else if (i == 2 && !pause) {
        mixTiles();
        drawButtons();
      }
    }
  }
}
function pauseOff(event) {
  let mouseX = event.offsetX;
  let mouseY = event.offsetY;
  if (
    mouseX >= 0 &&
    mouseX <= canvas.width &&
    mouseY >= 0 &&
    mouseY <= canvas.height
  ) {
    pause = !pause;
  }
}

function newGameWhenHameOver(event) {
  let textdim = ctx.measureText("Новая игра");
  if (
    event.offsetX >= (canvas.width - textdim.width) / 2 &&
    event.offsetX <= (canvas.width + textdim.width) / 2 &&
    event.offsetY >= canvas.height / 2 + 10 &&
    event.offsetY <= canvas.height / 2 + 30
  ) {
    newGame();
  }
}
