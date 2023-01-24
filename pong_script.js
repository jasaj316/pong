// get numbers
const leftNum = document.getElementById("left-num");
const rightNum = document.getElementById("right-num");
// canvas instantiation
const canvas = document.getElementById("canvas");
const canvas2d = canvas.getContext("2d");
canvas2d.filter = `blur(0.5px)`;
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
let lastCollider = null;
let radians;

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
  speed: 6,
  worldPos: function () {
    return { x: canvasOrigin.x + this.offset.x, y: canvasOrigin.y + this.offset.y }
  },
  init: function () {
    // init random radians, to ball vector
    let acceptable = false;
    while (!acceptable) {
      radians = Math.random();
      if ((radians > 0.1 && radians < 0.4) || (radians > 0.6 && radians < 0.9))
        acceptable = false;
      else
        acceptable = true;
    }
    radians = radians * Math.PI * 2 - Math.PI;
    this.vector.x = Math.cos(radians);
    this.vector.y = Math.sin(radians);
    //init position
    this.offset.x = 0;
    this.offset.y = 0;
    this.speed = 6;
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
  //if moving toward AI
  if (Ball.vector.x <= 0.1 && Ball.offset.x < maxMovePos * (3 / 4)) {
    //if AI can make a decision
    if (AI.delay <= 0) {
      //if 
      if (Paddles[0].offset.y + Paddles[0].size.y / 2 < Ball.offset.y - Ball.size
        && Paddles[0].offset.y - Paddles[0].size.y / 2 > Ball.offset.y + Ball.size) {
      }
      else if (Paddles[0].offset.y > Ball.offset.y + Ball.size) {
        AI.dir = "u";
      }
      else if (Paddles[0].offset.y < Ball.offset.y - Ball.size) {
        AI.dir = "d";
      }
      else {
        AI.dir = "x";
      }
      AI.delay = Math.abs(Ball.vector.y * 10);
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

function calculateCollision(paddle) {
  //alternate collision between paddles
  if (lastCollider != paddle) {
    originComparison = paddle === 1 ?
      (Ball.offset.y - Paddles[1].offset.y) * 0.3
      : (Ball.offset.y - Paddles[0].offset.y) * -0.3;
    //convert vectors to radians
    radians = Math.atan2(Ball.vector.y, Ball.vector.x);
    //convert radians to degrees to add angle
    let degrees = radians * (180 / Math.PI);
    if (Math.abs(degrees) < 45) { degrees += originComparison }
    //convert back to radians and then to vectors
    radians = degrees / (180 / Math.PI);
    Ball.vector.x = Math.cos(radians);
    paddle == 0 ? Ball.vector.x = Math.abs(Ball.vector.x) : Ball.vector.x = -Math.abs(Ball.vector.x);
    Ball.vector.y = Math.sin(radians);
    //prevent double calculations on same paddle
    lastCollider = paddle;
  }
}

function scoreUpdate(pointFor = null) {
  //update score
  if (pointFor !== null) { score[pointFor]++ }
  leftNum.textContent = score[0] < 10 ? `0${score[0]}` : score[0];
  rightNum.textContent = score[1] < 10 ? `0${score[1]}` : score[1];
}

function endGame(pointFor) {
  //reset objects
  Paddles.forEach(paddle => {
    paddle.init();
  })
  Ball.init();
  lastCollider = null;
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
    //hitting top
    Ball.vector.y = -Ball.vector.y;
  }
  else if (Ball.offset.x <= -canvasOrigin.x * 1.4) {
    // miss on left
    endGame(1);
  }
  else if (Ball.offset.x >= canvasOrigin.x * 1.4) {
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
  thisTime = performance.now();
  timeElapsed = thisTime - lastTime;
  lastTime = thisTime;
  elapsedCounter += timeElapsed;

  if (elapsedCounter > 1000 / 80 /*fps*/) {
    // loop
    ballMovement();
    detectCollision();
    playerInput();
    aiInput();
    drawScreen();
    //
    elapsedCounter = 0;
  }
  requestAnimationFrame(update)
}

addEventListener("keydown", e => {
  switch (e.keyCode) {
    case 38: upKey = true; return;
    case 40: downKey = true; return;
  }
});
addEventListener("keyup", e => { //if neither key has been pressed, set the pressed key to true
  switch (e.keyCode) {
    case 38: upKey = false; return;
    case 40: downKey = false; return;
  }
});

Ball.init();
scoreUpdate();
update();
