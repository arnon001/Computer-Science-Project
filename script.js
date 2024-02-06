// Set canvas height to half of the window height
canvas.height = window.innerHeight * 0.5;
// Set canvas width based on the height to maintain a 7:6 aspect ratio
canvas.width = (canvas.height / 6) * 7;
// Add event listener for mouse clicks on the canvas, calling the player_click function
canvas.addEventListener("mousedown", player_click);
// Get 2D rendering context for the canvas
const c = document.getElementById("canvas").getContext("2d");
// Calculate the size of each pixel in the grid
let pixel_size = canvas.width / 7;
// Define the winning size (4 in a row)
const win_size = 4;
// Initialize move counter
let moves = 0;
// Flag to stop the AI in the middle of its turn
let mid_stop = false;
// Flag to track if the game has been won
let won = false;
// Variable to store the column of the previous move
let previous_move = 0;
// Initialize the game grid with zeros
let grid = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0]
]; 
// Array to store the history of moves for undo functionality
let past = [];

// Function to make a move for the player
function make_move(player, col) {
  // Check if the game is not won yet
  if (!won) {
    // If it's the first move, remove the "AI First" button
    if (moves === 0) {
      document.getElementById("button").remove();
    }
    // Find the first empty row in the selected column
    const index = grid[col].findIndex(y => !y);
    // If the column is not full, proceed
    if (index != -1) {
      // Check for a winning move
      const win = move_score(col, [...grid]);
      // Display the winner and set the game state if there's a winner
      if (win[1][0] && player === 1) {
        document.getElementById("win").innerHTML = "RED WINS";
        document.getElementById("win").setAttribute("style", "color:red;");
        won = true;
      } else if (win[1][1] && player === 2) {
        document.getElementById("win").innerHTML = "BLUE WINS";
        document.getElementById("win").setAttribute("style", "color:blue;");
        won = true;
      }
      // Update the grid with the player's move
      grid[col][index] = player;
      // Store the move in the history
      past.push([player, index, col]);
      // Increment the move counter
      moves++;
      // Draw the pixel on the canvas
      pixel(col, index, player);
      // Update the previous move column
      previous_move = col;
    }
  }
}

// Function to undo the last move
function undo() {
  if (past.length) {
    const last = past[past.length - 1];
    past.pop();
    grid[last[2]][last[1]] = 0;
    pixel(last[2], last[1], 0);
  }
}

// Function to draw the initial grid on the canvas
function grid_grid() {
  c.fillStyle = "gray";
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      // Draw a rectangle for each cell in the grid
      c.rect(i * pixel_size, j * pixel_size, pixel_size, pixel_size);
      c.stroke();
    }
  }
}

// Function to handle player clicks on the canvas
function player_click(e) {
  if (moves < 42) {
    mid_stop = true;
    // Calculate the clicked column based on the mouse position
    const col = ((e.x - canvas.offsetLeft) / pixel_size) | 0;
    // Make a move for the player
    make_move(1, col);
    // Call the AI function for the computer's move
    ai();
  }
}

// Function for the computer to make a random move
function computer_random() {
  if (moves < 42) {
    // Generate a random column
    const r = Math.floor(Math.random() * 7);
    // Find the first empty row in the selected column
    const index = grid[r].findIndex(y => !y);
    // If the column is not full, proceed
    index != -1 ? make_move(2, r) : computer_random();
  }
}

// Function to draw a pixel on the canvas based on the player's move
function pixel(x, y, p) {
  // Set the fill style based on the player (1: red, 2: blue, 0: white)
  if (p == 1) {
    c.fillStyle = "#ff5a66";
  } else if (p === 2) {
    c.fillStyle = "#5a66ff";
  } else {
    c.fillStyle = "white";
  }
  // Draw a filled rectangle for the pixel
  c.fillRect(x * pixel_size + 2, (5 - y) * pixel_size + 2, pixel_size - 4, pixel_size - 4);
}

// Function for the computer to make a move using AI logic
function ai() {
  // Check if the central column is available and not blocked
  if (!(grid[3][5]) && (!grid[3][4]) && !(mid_stop)) {
    make_move(2, 3);
  } else {
    // Get the scores for each potential move
    const move_scores = get_scores();
    // Iterate through the scores to find a winning move
    for (let m = 0; m < move_scores.length; m++) {
      if (move_scores[m] === true) {
        make_move(2, m);
        return;
      }
    }
    // If no winning move, find the column with the highest score
    let maxes = [];
    const max = Math.max(...move_scores);
    for (let m = 0; m < move_scores.length; m++) {
      if (move_scores[m] === max) {
        maxes.push(m);
      }
    }
    let index = 0;
    // Preferentially select the central column if available
    if (maxes.includes(3)) {
      index = 3;
    } else {
      index = maxes[~~(Math.random() * maxes.length)];
    }
    // Make the computer move
    make_move(2, index);
  }
}

// Function to get scores for each potential move
function get_scores() {
  let move_scores = [];
  for (let c = 0; c < 7; c++) {
    let curr_score = move_score(c, [...grid]);
    const i = (grid[c]).findIndex(y => !y);
    // If the column is full, assign a score of 0
    if (i === -1) {
      move_scores.push(0);
      continue;
    }
    // Create a temporary grid to simulate the move
    let temp_grid = [];
    grid.forEach(v => {
      temp_grid.push([...v]);
    });
    // Simulate the move for the computer
    temp_grid[c][i] = 2;
    // Get the scores after the move
    const above = move_score(c, temp_grid);
    // If the move blocks the opponent's winning move, assign a score of 0
    if (((above[1][0] && !(curr_score[1][1])) || (above[1][1] && !(curr_score[1][0])))) {
      move_scores.push(0);
    } else {
      // Assign the move score based on the current score
      if (curr_score[1][1]) {
        move_scores.push(true);
      } else if (curr_score[1][0]) {
        move_scores.push(true);
      } else {
        move_scores.push(curr_score[0]);
      }
    }
  }
  return move_scores;
}

// Function to calculate the score for a move based on the formula
function move_score(c, g) {
  let wins = [false, false];
  let score = 0;
  let cscore = [0, 0];
  const index = (g[c]).findIndex(y => !y);
  // If the column is full, return a score of 0
  if (index === -1) {
    return [0, wins];
  }
  // Define directions for checking the winning condition
  const dirs = [
    [0, 1, 0],
    [0, -1, 0],
    [1, 0, 1],
    [-1, 0, 1],
    [-1, -1, 2],
    [1, 1, 2],
    [-1, 1, 3],
    [1, -1, 3]
  ];
  // Iterate through directions to calculate scores
  for (let d = 0; d < dirs.length; d++) {
    // If the direction changes, update the total score
    if (d > 0 && dirs[d][2] !== dirs[d - 1][2]) {
      score += score_formula(...cscore);
      cscore = [0, 0];
    }
    // Skip if the move goes out of bounds
    if (out_bounds(c + dirs[d][0], 0) || out_bounds(index + dirs[d][1], 1)) {
      continue;
    }
    let coords = [c + dirs[d][0], index + dirs[d][1]];
    const p = g[coords[0]][coords[1]];
    let current = p;
    // Skip if the cell is empty
    if (!p) {
      continue;
    }
    // Iterate in the current direction until a different player's piece is encountered
    while (!(out_bounds(coords[0], 0)) && !(out_bounds(coords[1], 1))) {
      current = g[coords[0]][coords[1]];
      if (current !== p) {
        break;
      }
      cscore[p - 1]++;
      coords[0] += dirs[d][0];
      coords[1] += dirs[d][1];
    }
    // Check for a winning condition
    if (cscore[0] >= (win_size - 1)) {
      wins[0] = true;
    } else if (cscore[1] >= (win_size - 1)) {
      wins[1] = true;
    }
  }
  // Update the total score with the final calculated score
  score += score_formula(...cscore);
  return [score, wins];
}

// Function to calculate the score based on a formula
function score_formula(x, y) {
  return Math.pow(x + y, 3);
}

// Function to check if the move is out of bounds
function out_bounds(n, di) {
  if (di === 0 && (n > 6 || n < 0)) return true;
  else if (di === 1 && (n > 5 || n < 0)) return true;
  return false;
}

// Event listener for window resize to adjust the canvas and redraw the grid and moves
window.onresize = function () {
  canvas.height = window.innerHeight * 0.5;
  canvas.width = (canvas.height / 6) * 7;
  pixel_size = canvas.width / 7;
  c.clearRect(0, 0, canvas.width, canvas.height);
  grid_grid();
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      if (grid[x][y] === 1) {
        pixel(x, y, 1);
      } else if (grid[x][y] === 2) {
        pixel(x, y, 2)
      }
    }
  }
}

// Draw the initial grid on the canvas
grid_grid();
