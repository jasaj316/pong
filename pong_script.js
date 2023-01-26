// get numbers
const leftNum = document.getElementById("left-num");
const rightNum = document.getElementById("right-num");
// canvas instantiation
const canvas = document.getElementById("canvas");
const canvas2d = canvas.getContext("2d");
let canvasOrigin = { x: canvas.width / 2, y: canvas.height / 2 };
// delta time vars
let lastTime = performance.now();
let timeElapsed;
let elapsedCounter = 0

// drawing vars
let cols = ["#2f3a1c", "#fff"]; // black, white

//score
let score = [0, 0];
//gameplay vars
let upKey = false;
let downKey = false;
let AI = { delay: 0, dir: "u" };
let maxMovePos = canvas.height / 2.56;
let moveInc = maxMovePos / 20;
let originComparison;
let lastPaddle = null;
let heightPrediction = 0;
let randomizePrediction = Math.pow(Math.random() + 0.5, 0.2);

const Paddles = [{
  size: { x: 32, y: maxMovePos / 2 },
  offset: { x: 0, y: 0 },
  worldPos: function () {
    return { x: this.size.x + this.offset.x, y: canvasOrigin.y + this.offset.y };
  },
  init: function () {
    this.offset.y = 0;
  }
},
{
  size: { x: 32, y: maxMovePos / 2 },
  offset: { x: 0, y: 0 },
  worldPos: function () {
    return { x: canvas.width - this.size.x + this.offset.x, y: canvasOrigin.y + this.offset.y };
  },
  init: function () {
    this.offset.y = 0;
  }
}]

const Ball = {
  size: 32,
  offset: { x: 0, y: 0 },
  vector: { x: 0, y: 0 },
  speed: 4,
  radians: 0,
  degrees: 0,
  worldPos: function () {
    return { x: canvasOrigin.x + this.offset.x, y: canvasOrigin.y + this.offset.y }
  },
  init: function () {
    // init random radians, to ball vector
    let acceptable = false;
    while (!acceptable) {
      this.radians = Math.random();
      if ((this.radians > 0.1 && this.radians < 0.4) || (this.radians > 0.6 && this.radians < 0.9))
        acceptable = false;
      else
        acceptable = true;
    }

    this.radians = this.radians * 2 * Math.PI - Math.PI;
    // height prediction for AI
    heightPrediction = -(Math.tan(Ball.radians) * (canvasOrigin.x - Paddles[0].size.x));
    this.vector.x = Math.cos(this.radians);
    this.vector.y = Math.sin(this.radians);
    //init position
    this.offset.x = 0;
    this.offset.y = 0;
    this.speed = 4;
  }
};

function paddleMovement(paddle, dir) {
  if (dir == "u") {
    //move up if greater than max position
    if (Paddles[paddle].offset.y > -maxMovePos + moveInc) {
      Paddles[paddle].offset.y -= moveInc;
    }
    else {
      Paddles[paddle].offset.y = -maxMovePos;
    }
  }
  else if (dir === "d") {
    //move down if less than max position
    if (Paddles[paddle].offset.y < maxMovePos - moveInc) {
      Paddles[paddle].offset.y += moveInc;
    } else {
      Paddles[paddle].offset.y = maxMovePos;
    }
  }
}

function playerInput() {
  if (upKey && !downKey) {
    paddleMovement(1, "u");
  }
  else if (downKey && !upKey) {
    paddleMovement(1, "d");
  }
}

function aiInput() {
  // if moving left and 2/3 (* random value) of the way left

  if (Ball.vector.x <= 0 && Ball.offset.x < randomizePrediction * (canvasOrigin.x * 1 / 3)) {
    // if AI can make a decision
    if (AI.delay <= 0) {
      // ball above paddle
      if (heightPrediction < Paddles[0].offset.y - Paddles[0].size.y / 2.5) {
        AI.dir = "u";
      }
      // ball under paddle
      else if (heightPrediction > Paddles[0].offset.y + Paddles[0].size.y / 2.5) {
        AI.dir = "d";
      }
      // ball in front of paddle
      else {
        AI.dir = "";
      }
      //set delay to 6 * (random value (prediction ^ 0.5)) + (delay from high angles (0-2))
      AI.delay = 6 * Math.pow(randomizePrediction, 0.5) + ((1 - Math.abs(Ball.vector.x)) * 6.8)
    }
    else {
      paddleMovement(0, AI.dir);
      AI.delay -= 1;
    }
  }
}

function ballMovement() {
  Ball.speed += 0.02;
  Ball.offset.x += Ball.vector.x * Ball.speed;
  Ball.offset.y += Ball.vector.y * Ball.speed;
}

function calculateCollision(curPaddle) {
  // alternate collision between paddles
  if (lastPaddle != curPaddle) {
    originComparison = curPaddle === 1 ?
      (Ball.offset.y - Paddles[1].offset.y) * 0.4
      : (Ball.offset.y - Paddles[0].offset.y) * -0.4;
    // convert vectors to radians
    Ball.radians = Math.atan2(Ball.vector.y, Ball.vector.x);
    // convert radians to degrees to add angle
    Ball.degrees = Ball.radians * 180 / Math.PI;
    //add angle from paddle
    Ball.degrees += originComparison
    //clamp output to keep a shallow angle
    if (Ball.degrees < 135 && Ball.degrees > 90) { Ball.degrees = 135 } // low angle to the right -> 135
    else if (Ball.degrees < 90 && Ball.degrees > 45) { Ball.degrees = 45 } // low angle to the left -> 45
    else if (Ball.degrees > -135 && Ball.degrees < -90) { Ball.degrees = -135 } // high angle to the right -> -135
    else if (Ball.degrees > -90 && Ball.degrees < -45) { Ball.degrees = -45 } // high angle to the left -> -45
    // convert back to radians and then to vectors
    Ball.radians = Ball.degrees * Math.PI / 180;
    Ball.vector.x = Math.cos(Ball.radians);
    curPaddle == 0 ? Ball.vector.x = Math.abs(Ball.vector.x) : Ball.vector.x = -Math.abs(Ball.vector.x);
    Ball.vector.y = Math.sin(Ball.radians);
    // prevent double calculations on same paddle
    lastPaddle = curPaddle;

  }
}

function scoreUpdate(pointFor = null) {
  // update score
  if (pointFor !== null) { score[pointFor]++ }
  leftNum.textContent = score[0] < 10 ? `0${score[0]}` : score[0];
  rightNum.textContent = score[1] < 10 ? `0${score[1]}` : score[1];
}

function endGame(pointFor) {
  // reset objects
  Paddles.forEach(paddle => {
    paddle.init();
  })
  Ball.init();
  lastPaddle = null;
  randomizePrediction = Math.pow(Math.random() + 0.5, 0.2);;
  scoreUpdate(pointFor);
}

function detectCollision() {
  if (Ball.worldPos().x + Ball.size / 2 >= Paddles[1].worldPos().x - Paddles[1].size.x / 2
    && Ball.worldPos().x - Ball.size / 2 <= Paddles[1].worldPos().x) {
    // ball is in the x coordinate of the front part of the right paddle
    if (Ball.worldPos().y - Ball.size / 2 <= Paddles[1].worldPos().y + Paddles[1].size.y / 2
      && Ball.worldPos().y + Ball.size / 2 >= Paddles[1].worldPos().y - Paddles[1].size.y / 2) {
      // ball is in the y coordinate of the right paddle
      calculateCollision(1);
      // calcuate height of impact for the AI
      heightPrediction = (Math.tan(Ball.radians) * (Ball.worldPos().x - Paddles[0].size.x)) + Ball.offset.y;
      // low chance of miss from paddle
      randomizePrediction = Math.pow(Math.random() + 0.5, 0.2);
      heightPrediction *= randomizePrediction;

    }
  }
  else if (Ball.worldPos().x - Ball.size / 2 <= Paddles[0].worldPos().x + Paddles[0].size.x / 2
    && Ball.worldPos().x + Ball.size / 2 >= Paddles[0].worldPos().x) {
    // ball is in the x coordinate of the front part of the left paddle
    if (Ball.worldPos().y - Ball.size / 2 <= Paddles[0].worldPos().y + Paddles[0].size.y / 2
      && Ball.worldPos().y + Ball.size / 2 >= Paddles[0].worldPos().y - Paddles[0].size.y / 2) {
      // ball is in the y coordinate of the left paddle
      calculateCollision(0);
    }
  }
  if (Ball.offset.y + Ball.size / 2 >= canvas.height / 2 || Ball.offset.y - Ball.size / 2 <= -canvas.height / 2) {
    // hitting top or bottom
    Ball.vector.y = -Ball.vector.y;
    // recalcuate radians, height of impact for the AI
    Ball.radians = Math.atan2(Ball.vector.y, Ball.vector.x);


    heightPrediction = -(Math.tan(Ball.radians) * (Ball.worldPos().x - Paddles[0].size.x)) + Ball.offset.y;
    // higher chance of miss from top or bottom
    randomizePrediction = Math.pow(Math.random() + 0.5, 0.5);
    heightPrediction *= randomizePrediction;
  }
  if (Ball.offset.x < canvasOrigin.x * -1.25) {
    // miss on left
    endGame(1);
  }
  else if (Ball.offset.x > canvasOrigin.x * 1.25) {
    // miss on right
    endGame(0);
  }
}

function drawScreen() {
  // Background
  canvas2d.fillStyle = cols[0];
  canvas2d.fillRect(0, 0, canvas.width, canvas.height);
  // Net
  canvas2d.strokeStyle = cols[1];
  canvas2d.lineWidth = Paddles[0].size.x / 2;
  canvas2d.beginPath();
  canvas2d.setLineDash([canvas.height / 30, canvas.height / 40]);
  canvas2d.moveTo(canvasOrigin.x + Paddles[0].size.x / 4, 15);
  canvas2d.lineTo(canvasOrigin.x + Paddles[0].size.x / 4, canvas.height)
  canvas2d.stroke();
  // Paddles
  canvas2d.fillStyle = cols[1];
  canvas2d.fillRect(Paddles[0].worldPos().x - Paddles[0].size.x / 2, Paddles[0].worldPos().y - Paddles[0].size.y / 2, Paddles[0].size.x, Paddles[0].size.y);
  canvas2d.fillRect(Paddles[1].worldPos().x - Paddles[1].size.x / 2, Paddles[1].worldPos().y - Paddles[1].size.y / 2, Paddles[1].size.x, Paddles[1].size.y);
  // Ball
  canvas2d.fillRect(Ball.worldPos().x - Ball.size / 2, Ball.worldPos().y - Ball.size / 2, Ball.size, Ball.size,);
}


function update() {
  ballMovement();
  detectCollision();
  playerInput();
  aiInput();
  drawScreen();
  requestAnimationFrame(update);
}

addEventListener("keydown", e => {
  switch (e.key) {
    case "ArrowUp": upKey = true; return;
    case "ArrowDown": downKey = true; return;
  }
});
addEventListener("keyup", e => { //if neither key has been pressed, set the pressed key to true
  switch (e.key) {
    case "ArrowUp": upKey = false; return;
    case "ArrowDown": downKey = false; return;
  }
});

Ball.init();
scoreUpdate();
update();
