// Game state tracking
let score = 0;              // Total clicks
let gameStarted = false;    // Game active flag
let startTime = null;       // Game start timestamp
let gameTimer = null;       // End game timer
let updateTimer = null;     // UI update timer
let clickTimestamps = [];   // Records click times for graph

// DOM elements
const targetButton = document.getElementById("targetButton");
const scoreBoard = document.getElementById("scoreBoard");

// Graph canvas setup
const canvas = document.createElement("canvas");
canvas.id = "clickGraph";
canvas.width = 600;
canvas.height = 300;
canvas.style.border = "1px solid #fff";
canvas.style.marginTop = "20px";

// Randomly position target button
function moveTarget() {
  const maxX = window.innerWidth - targetButton.offsetWidth;
  const maxY = window.innerHeight - targetButton.offsetHeight;
  
  targetButton.style.left = Math.floor(Math.random() * maxX) + "px";
  targetButton.style.top = Math.floor(Math.random() * maxY) + "px";
}

// Update UI with remaining time and score
function updateRemainingTime() {
  if (!gameStarted) return;
  const remaining = Math.max(60 - (Date.now() - startTime) / 1000, 0).toFixed(1);
  scoreBoard.innerHTML = `Time remaining: ${remaining} sec<br>Score: ${score}`;
}

// Finalize game and display results
function endGame() {
  clearInterval(updateTimer);
  targetButton.disabled = true;
  
  const averageSpeed = (score / 60).toFixed(2);
  scoreBoard.innerHTML = `Time's up!<br>Score: ${score}<br>Average Speed: ${averageSpeed} clicks/sec`;
  
  targetButton.style.display = "none";
  document.body.appendChild(canvas);
  drawGraph();
}

// Process target clicks
function handleClick(event) {
  event.stopPropagation();
  
  // First click starts the game
  if (!gameStarted) {
    gameStarted = true;
    startTime = Date.now();
    gameTimer = setTimeout(endGame, 60000);
    updateTimer = setInterval(updateRemainingTime, 100);
  }
  
  score++;
  targetButton.textContent = score;
  clickTimestamps.push((Date.now() - startTime) / 1000);
  updateRemainingTime();
  moveTarget();
}

// Process click data for visualization
function computeClicksPerSecond() {
  // Group clicks into 1-second bins
  const bins = new Array(60).fill(0);
  clickTimestamps.forEach(time => {
    if (time < 60) bins[Math.floor(time)]++;
  });
  
  // Weighted moving average to smooth out the graph
  return bins.map((val, i, arr) => {
    const prev = i > 0 ? arr[i-1] : val;
    const next = i < 59 ? arr[i+1] : val;
    return parseFloat(((prev + val*2 + next) / 4).toFixed(1));
  });
}

// Render performance graph
function drawGraph() {
  const ctx = canvas.getContext("2d");
  const bins = computeClicksPerSecond();
  const padding = 40;
  const maxClicks = Math.max(...bins, 3);
  
  const w = canvas.width - 2 * padding;
  const h = canvas.height - 2 * padding;
  
  // Draw axes
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.stroke();
  
  // Add axis labels
  ctx.fillStyle = "#fff";
  ctx.font = "14px Arial";
  ctx.fillText("Time (sec)", canvas.width / 2 - 30, canvas.height - 10);
  ctx.fillText(maxClicks.toFixed(1), padding - 30, padding + 5);
  
  ctx.save();
  ctx.translate(25, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Clicks/sec", 0, 0);
  ctx.restore();
  
  // Draw performance curve with quadratic smoothing
  ctx.strokeStyle = "#00FF00";
  ctx.beginPath();
  bins.forEach((val, i) => {
    const x = padding + (i / 59) * w;
    const y = canvas.height - padding - (val / maxClicks) * h;
    
    if (i === 0) ctx.moveTo(x, y);
    else {
      const prevX = padding + ((i - 1) / 59) * w;
      const prevY = canvas.height - padding - (bins[i-1] / maxClicks) * h;
      ctx.quadraticCurveTo(prevX, prevY, (prevX + x)/2, (prevY + y)/2);
    }
  });
  ctx.stroke();
}


window.addEventListener("load", moveTarget);
