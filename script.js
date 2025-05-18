const main = document.querySelector("main");

// key navigation
let upPressed = false;
let downPressed = false;
let leftPressed = false;
let rightPressed = false;

let gameOver = false; // game state
let gamePaused = false; // track pause state

let currentLevel = 1; // level state
let pointsCollected = 0; // points collected by player
let totalPoints = 0; // availible points in the maze

// game music
let currentMusic = null;
const musicTracks = [
  "gamer.mp3",
  "cookies.mp3",
  "forTheDay.mp3",
  "askQuestions.mp3",
];

let musicMuted = false; // Add to global variables


function generateRandomMaze(level) {
  // Calculate enemy count - increases every 2 levels
  const enemyCount = Math.ceil(level / 2);
  
  // Determine maze size based on level and enemy count
  // Start with 10x10, increase by 2 every 5 levels, cap at 20x20
  let mazeSize = Math.min(10 + 2 * Math.floor((level - 1) / 5), 20);
  
  // Create empty maze with walls around the perimeter
  let newMaze = Array(mazeSize).fill().map((_, rowIndex) => 
    Array(mazeSize).fill().map((_, colIndex) => 
      // Place walls on the perimeter
      rowIndex === 0 || colIndex === 0 || 
      rowIndex === mazeSize - 1 || colIndex === mazeSize - 1 ? 1 : 0
    )
  );
  
  // Place player in top-left corner (but not on the wall)
  newMaze[1][1] = 2;
  let playerRow = 1;
  let playerCol = 1;
  
  // Create inner walls using a modified recursive division algorithm
  addInnerWalls(newMaze, 1, 1, mazeSize - 2, mazeSize - 2, level);
  
  // Ensure all cells are reachable using flood fill
  ensureAllCellsReachable(newMaze, playerRow, playerCol);
  
  // Count total points in the maze
  totalPoints = 0;
  for (let i = 0; i < newMaze.length; i++) {
    for (let j = 0; j < newMaze[i].length; j++) {
      if (newMaze[i][j] === 0) {
        totalPoints++;
      }
    }
  }
  
  // Find available spaces that are not too close to the player
  const freeSpaces = [];
  for (let i = 0; i < newMaze.length; i++) {
    for (let j = 0; j < newMaze[i].length; j++) {
      if (newMaze[i][j] === 0) {
        // Calculate Manhattan distance from player
        const distance = Math.abs(i - playerRow) + Math.abs(j - playerCol);
        
        // Only add if it's at least 3 spaces away from player
        if (distance > 3) {
          freeSpaces.push({ row: i, col: j });
        }
      }
    }
  }
  
  // Place enemies randomly in free spaces
  for (let i = 0; i < enemyCount; i++) {
    if (freeSpaces.length > 0) {
      const randomIndex = Math.floor(Math.random() * freeSpaces.length);
      const position = freeSpaces[randomIndex];
      
      newMaze[position.row][position.col] = 3;
      freeSpaces.splice(randomIndex, 1);
      totalPoints--;
    }
  }
  
  console.log(`Level ${level}: Maze size ${mazeSize}x${mazeSize}, Total points ${totalPoints}, Enemy count ${enemyCount}`);
  
  return newMaze;
}

// Ensuring all cells in the maze are reachable
function ensureAllCellsReachable(maze, playerRow, playerCol) {
  const height = maze.length;
  const width = maze[0].length;
  
  // Create a visited map
  const visited = Array(height).fill().map(() => Array(width).fill(false));
  
  // Perform flood fill from player position
  floodFill(maze, visited, playerRow, playerCol);
  
  // Find unreachable cells and connect them
  const unreachableCells = [];
  for (let i = 1; i < height - 1; i++) {
    for (let j = 1; j < width - 1; j++) {
      // Only check non-wall cells that weren't visited
      if (maze[i][j] !== 1 && !visited[i][j]) {
        unreachableCells.push({ row: i, col: j });
      }
    }
  }
  
  // Connect each unreachable cell to the reachable part of the maze
  unreachableCells.forEach(cell => {
    connectToReachableArea(maze, visited, cell.row, cell.col);
  });
  
  // Perform a second flood fill to ensure all non-wall cells are now reachable
  const secondVisited = Array(height).fill().map(() => Array(width).fill(false));
  floodFill(maze, secondVisited, playerRow, playerCol);
  
  // If there are still unreachable cells, try again more aggressively
  let stillUnreachable = false;
  for (let i = 1; i < height - 1; i++) {
    for (let j = 1; j < width - 1; j++) {
      if (maze[i][j] !== 1 && !secondVisited[i][j]) {
        stillUnreachable = true;
        // Create a direct path to this cell by removing walls
        createDirectPath(maze, playerRow, playerCol, i, j);
      }
    }
  }
}

// Flood fill algorithm to mark reachable cells
function floodFill(maze, visited, row, col) {
  // Check boundaries and if cell is already visited or is a wall
  if (row < 0 || col < 0 || 
      row >= maze.length || col >= maze[0].length || 
      visited[row][col] || maze[row][col] === 1) {
    return;
  }
  
  // Mark as visited
  visited[row][col] = true;
  
  // Explore in all four directions recursively
  floodFill(maze, visited, row + 1, col); // Down
  floodFill(maze, visited, row - 1, col); // Up
  floodFill(maze, visited, row, col + 1); // Right
  floodFill(maze, visited, row, col - 1); // Left
}

// Connect an unreachable cell to the reachable area
function connectToReachableArea(maze, visited, row, col) {
  // Directions: up, right, down, left
  const directions = [
    { dRow: -1, dCol: 0 },
    { dRow: 0, dCol: 1 },
    { dRow: 1, dCol: 0 },
    { dRow: 0, dCol: -1 }
  ];
  
  // Shuffle directions to create more varied paths
  shuffle(directions);
  
  // Try each direction
  for (const dir of directions) {
    // Look for a reachable cell by moving in this direction
    let currentRow = row;
    let currentCol = col;
    let pathFound = false;
    
    // Look up to 5 cells in this direction
    for (let i = 0; i < 5; i++) {
      currentRow += dir.dRow;
      currentCol += dir.dCol;
      
      // Check if we're out of bounds
      if (currentRow < 0 || currentCol < 0 || 
          currentRow >= maze.length || currentCol >= maze[0].length) {
        break;
      }
      
      // If we found a reachable cell, create a path to it
      if (visited[currentRow][currentCol]) {
        pathFound = true;
        
        // Create a path by removing walls
        let pathRow = row;
        let pathCol = col;
        while (pathRow !== currentRow || pathCol !== currentCol) {
          // Move toward the reachable cell
          if (pathRow < currentRow) pathRow++;
          else if (pathRow > currentRow) pathRow--;
          if (pathCol < currentCol) pathCol++;
          else if (pathCol > currentCol) pathCol--;
          
          // Remove wall if present
          if (maze[pathRow][pathCol] === 1) {
            maze[pathRow][pathCol] = 0;
          }
        }
        break;
      }
    }
    
    if (pathFound) {
      break;
    }
  }
}

// Create a direct path between two points for unreachable cells
function createDirectPath(maze, startRow, startCol, endRow, endCol) {
  // Use simple line drawing to connect the points
  const dx = Math.abs(endCol - startCol);
  const dy = Math.abs(endRow - startRow);
  const sx = startCol < endCol ? 1 : -1;
  const sy = startRow < endRow ? 1 : -1;
  let err = dx - dy;
  
  while (startRow !== endRow || startCol !== endCol) {
    // Remove wall if present
    if (maze[startRow][startCol] === 1) {
      maze[startRow][startCol] = 0;
    }
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      startCol += sx;
    }
    if (e2 < dx) {
      err += dx;
      startRow += sy;
    }
  }
}

// Helper function to shuffle an array (for randomizing directions)
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Function to add inner walls using recursive division algorithm
function addInnerWalls(maze, startX, startY, width, height, complexity) {
  // Don't divide further if the area is too small
  if (width < 3 || height < 3) return;
  
  // Complexity affects wall density (higher level = fewer walls)
  const densityFactor = Math.max(0.3, 1 - (complexity * 0.02));
  if (Math.random() > densityFactor) return;
  
  // Choose a wall orientation
  let horizontal = Math.random() < 0.5;
  
  // If one dimension is more than twice the other, choose the longer one
  if (width > height * 2) {
    horizontal = false;
  } else if (height > width * 2) {
    horizontal = true;
  }
  
  if (horizontal) {
    // Create a horizontal wall
    const y = startY + Math.floor(Math.random() * (height - 1)) + 1;
    const passageX = startX + Math.floor(Math.random() * width);
    
    for (let x = startX; x < startX + width; x++) {
      // Leave a passage in the wall
      if (x !== passageX) {
        maze[y][x] = 1;
      }
    }
    
    // Recursively divide the areas above and below the wall
    addInnerWalls(maze, startX, startY, width, y - startY, complexity);
    addInnerWalls(maze, startX, y + 1, width, height - (y - startY + 1), complexity);
  } else {
    // Create a vertical wall
    const x = startX + Math.floor(Math.random() * (width - 1)) + 1;
    const passageY = startY + Math.floor(Math.random() * height);
    
    for (let y = startY; y < startY + height; y++) {
      if (y !== passageY) {
        maze[y][x] = 1;
      }
    }
    
    // Recursively divide the areas to the left and right of the wall
    addInnerWalls(maze, startX, startY, x - startX, height, complexity);
    addInnerWalls(maze, x + 1, startY, width - (x - startX + 1), height, complexity);
  }
}

// Function to load and play level-specific music
function playLevelMusic(level) {
  // Stop current music if playing
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
  }

  // Select music based on level (cycle through available tracks)
  const trackIndex = (level - 1) % musicTracks.length;

  // Create new audio element
  currentMusic = new Audio(musicTracks[trackIndex]);
  currentMusic.loop = true;
  currentMusic.volume = 0.5; // 50% volume
  currentMusic.muted = musicMuted; // Apply mute state

  // Play music
  const playPromise = currentMusic.play();

  // Handle autoplay restrictions in browsers
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      console.log(
        "Autoplay prevented. User must interact with the document first."
      );
    });
  }
}

// Function to stop music
function stopMusic() {
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
  }
}

// toggle mute
function toggleMute() {
  musicMuted = !musicMuted;

  if (currentMusic) {
    currentMusic.muted = musicMuted;
  }

  // Update mute button display
  const muteButton = document.getElementById("muteButton");
  if (muteButton) {
    muteButton.textContent = musicMuted ? "🔇" : "🔊";
  }
}

// mute button creation
function createMuteButton() {
  const muteButton = document.createElement("button");
  muteButton.id = "muteButton";
  muteButton.textContent = "🔊";
  muteButton.style.position = "absolute";
  muteButton.style.top = "10px";
  muteButton.style.left = "10px";
  muteButton.style.zIndex = "100";
  muteButton.style.fontSize = "24px";
  muteButton.style.padding = "5px 10px";
  muteButton.style.backgroundColor = "rgba(0,0,0,0.5)";
  muteButton.style.border = "1px solid white";
  muteButton.style.borderRadius = "5px";
  muteButton.style.cursor = "pointer";

  muteButton.addEventListener("click", toggleMute);

  document.body.appendChild(muteButton);
}

// pause button creation
function createPauseButton() {
  const pauseButton = document.createElement("button");
  pauseButton.id = "pauseButton";
  pauseButton.textContent = "⏸️";
  pauseButton.style.position = "absolute";
  pauseButton.style.top = "10px";
  pauseButton.style.left = "70px"; // Position it next to the mute button
  pauseButton.style.zIndex = "100";
  pauseButton.style.fontSize = "24px";
  pauseButton.style.padding = "5px 10px";
  pauseButton.style.backgroundColor = "rgba(0,0,0,0.5)";
  pauseButton.style.border = "1px solid white";
  pauseButton.style.borderRadius = "5px";
  pauseButton.style.cursor = "pointer";
  pauseButton.style.display = "none"; // Initially hidden until game starts

  pauseButton.addEventListener("click", togglePause);

  document.body.appendChild(pauseButton);
}

// Function to toggle pause state
function togglePause() {
  gamePaused = !gamePaused;

  // Update button appearance
  const pauseButton = document.getElementById("pauseButton");
  if (pauseButton) {
    pauseButton.textContent = gamePaused ? "▶️" : "⏸️";
  }

  // Show/hide pause overlay
  let pauseOverlay = document.getElementById("pauseOverlay");
  if (gamePaused) {
    if (!pauseOverlay) {
      pauseOverlay = document.createElement("div");
      pauseOverlay.id = "pauseOverlay";
      pauseOverlay.style.position = "absolute";
      pauseOverlay.style.top = "0";
      pauseOverlay.style.left = "0";
      pauseOverlay.style.width = "100%";
      pauseOverlay.style.height = "100%";
      pauseOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
      pauseOverlay.style.display = "flex";
      pauseOverlay.style.justifyContent = "center";
      pauseOverlay.style.alignItems = "center";
      pauseOverlay.style.zIndex = "90";

      const pauseText = document.createElement("h2");
      pauseText.textContent = "GAME PAUSED";
      pauseText.style.fontSize = "2em";
      pauseText.style.color = "white";
      pauseOverlay.appendChild(pauseText);

      main.appendChild(pauseOverlay);
    } else {
      pauseOverlay.style.display = "flex";
    }
  } else if (pauseOverlay) {
    pauseOverlay.style.display = "none";
  }
}

// Call this function when the page loads
createMuteButton();
createPauseButton();

// Update the initial maze generation
let maze = generateRandomMaze(currentLevel);

// Set up the main container for proper element positioning
main.style.position = "relative";
main.style.width = "80vh";
main.style.height = "80vh";

//Populate the maze in the HTML
for (let i = 0; i < maze.length; i++) {
  for (let j = 0; j < maze[0].length; j++) {
    let block = document.createElement("div");
    block.classList.add("block");

    // Position each block absolutely within the grid
    block.style.position = "absolute";
    block.style.top = i * (main.clientHeight / maze.length) + "px";
    block.style.left = j * (main.clientWidth / maze[0].length) + "px";
    block.style.width = main.clientWidth / maze[0].length + "px";
    block.style.height = main.clientHeight / maze.length + "px";

    switch (maze[i][j]) {
      case 1:
        block.classList.add("wall");
        break;
      case 2:
        block.id = "player";
        let mouth = document.createElement("div");
        mouth.classList.add("mouth");
        block.appendChild(mouth);
        break;
      case 3:
        block.classList.add("enemy");
        break;
      default:
        block.classList.add("point");
        // Points should be smaller and centered in their cell
        const pointSize =
          (Math.min(main.clientHeight, main.clientWidth) / maze.length) * 0.3;
        block.style.height = pointSize + "px";
        block.style.width = pointSize + "px";
        block.style.borderRadius = "50%";
        block.style.margin = "auto";
        block.style.top =
          i * (main.clientHeight / maze.length) +
          (main.clientHeight / maze.length - pointSize) / 2 +
          "px";
        block.style.left =
          j * (main.clientWidth / maze[0].length) +
          (main.clientWidth / maze[0].length - pointSize) / 2 +
          "px";
    }

    main.appendChild(block);
  }
}

startButton = document.querySelector(".start");

function startGame() {
  // Reset game over state at the beginning
  gameOver = false;

  startButton.style.display = "none";
  document.getElementById("pauseButton").style.display = "block"; // Show pause button

  // Reset pause state
  gamePaused = false;

  const player = document.querySelector("#player");
  const playerMouth = player.querySelector(".mouth");
  let score = 0;
  let lives = 3; // Initialize with 3 lives
  pointsCollected = 0; // Reset points collected

  // Show current level with an alert
  alert(`Level ${currentLevel} - Get Ready!`)

  // Play music for the current level
  playLevelMusic(currentLevel);

  // Update lives display
  updateLivesDisplay(lives);

  // Get initial player position in the maze array
  let playerRow, playerCol;
  for (let i = 0; i < maze.length; i++) {
    for (let j = 0; j < maze[i].length; j++) {
      if (maze[i][j] === 2) {
        playerRow = i;
        playerCol = j;
        break;
      }
    }
  }

  // Find and track all enemy positions
  const enemies = [];
  const enemyElements = document.querySelectorAll(".enemy");

  for (let i = 0; i < maze.length; i++) {
    for (let j = 0; j < maze[i].length; j++) {
      if (maze[i][j] === 3) {
        enemies.push({
          row: i,
          col: j,
          element: enemyElements[enemies.length],
          direction: getRandomDirection(), // Initial random direction
        });
      }
    }
  }

  // Function to get a random direction for enemies
  function getRandomDirection() {
    const directions = ["up", "down", "left", "right"];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  // Move enemies on a separate interval (slightly slower than player)
  const enemyInterval = setInterval(function () {
    // Skip update if game is paused
    if (gamePaused) return;

    // Move each enemy
    enemies.forEach((enemy) => {
      // Store the current position
      let newRow = enemy.row;
      let newCol = enemy.col;

      // Determine new position based on current direction
      switch (enemy.direction) {
        case "up":
          newRow--;
          break;
        case "down":
          newRow++;
          break;
        case "left":
          newCol--;
          break;
        case "right":
          newCol++;
          break;
      }

      // Check if new position is valid (not a wall)
      if (
        newRow >= 0 &&
        newRow < maze.length &&
        newCol >= 0 &&
        newCol < maze[0].length &&
        maze[newRow][newCol] !== 1 &&
        maze[newRow][newCol] !== 3
      ) {
        // Check if enemy caught player
        if (maze[newRow][newCol] === 2) {
          // Skip if game is already over or player is in hit animation
          if (gameOver || player.classList.contains("hit")) return;

          // Enemy caught player - show animation and remove a life
          player.classList.add("hit");
          lives--;

          // Update lives display
          updateLivesDisplay(lives);

          // Stop movement temporarily
          upPressed = false;
          downPressed = false;
          leftPressed = false;
          rightPressed = false;

          // Wait for the animation to complete
          setTimeout(() => {
            // Remove the hit class if the player element still exists
            if (player) player.classList.remove("hit");

            // If no lives left, end the game
            if (lives <= 0) {
              // Set game over flag
              gameOver = true;

              // Stop all game loops
              clearInterval(gameInterval);
              clearInterval(enemyInterval);

              // Stop music
              stopMusic();

              // Hide pause button
              document.getElementById("pauseButton").style.display = "none";

              setTimeout(() => {
                // Ask to restart
                if (
                  confirm("Game Over! All lives lost. Restart current level?")
                ) {
                  resetCurrentLevel();
                } else {
                  // Player chose not to restart, save their score
                  saveScore(score);
                }
              }, 500);
            }
          }, 1500); // Animation duration

          return; // Skip enemy movement for this frame
        }

        // Move enemy in maze array
        maze[enemy.row][enemy.col] =
          maze[enemy.row][enemy.col] === 3 ? 0 : maze[enemy.row][enemy.col];
        enemy.row = newRow;
        enemy.col = newCol;
        maze[enemy.row][enemy.col] = 3;

        // Update visual position for enemies
        const blockSize = main.clientHeight / maze.length;
        const enemyTop = enemy.row * blockSize;
        const enemyLeft = enemy.col * blockSize;
        enemy.element.style.position = "absolute";
        enemy.element.style.top = enemyTop + "px";
        enemy.element.style.left = enemyLeft + "px";
        enemy.element.style.width = blockSize * 0.9 + "px";
        enemy.element.style.height = blockSize * 0.9 + "px";
        enemy.element.style.margin = "0"; // Remove any margin
        enemy.element.style.zIndex = "5"; // Make enemies appear below player but above points
      } else {
        // Hit a wall or another enemy, change direction
        enemy.direction = getRandomDirection();
      }
    });
  }, 300); // Enemies move slightly slower than player

  const gameInterval = setInterval(function () {
    // Skip update if game is paused
    if (gamePaused) return;

    // Store previous position for collision detection
    let newRow = playerRow;
    let newCol = playerCol;

    if (downPressed) {
      newRow++;
      playerMouth.classList = "down";
    } else if (upPressed) {
      newRow--;
      playerMouth.classList = "up";
    } else if (leftPressed) {
      newCol--;
      playerMouth.classList = "left";
    } else if (rightPressed) {
      newCol++;
      playerMouth.classList = "right";
    }

    // Check if new position is valid (not a wall)
    if (maze?.[newRow]?.[newCol] !== 1) {
      // Check if player hit an enemy
      if (maze[newRow][newCol] === 3) {
        // Skip if game is already over
        if (gameOver) return;

        // Player hit an enemy - show animation and remove a life
        player.classList.add("hit");
        lives--;

        // Update lives display
        updateLivesDisplay(lives)

        // Stop movement temporarily
        upPressed = false
        downPressed = false
        leftPressed = false
        rightPressed = false

        // Wait for the animation to complete
        setTimeout(() => {
          // Remove the hit class
          player.classList.remove("hit");

          // If no lives left, end the game
          if (lives <= 0) {
            // Stop all game loops
            clearInterval(gameInterval);
            clearInterval(enemyInterval);

            // Stop music
            stopMusic();

            // Hide pause button
            document.getElementById("pauseButton").style.display = "none";

            setTimeout(() => {
              // Ask to restart
              if (
                confirm("Game Over! All lives lost. Restart current level?")
              ) {
                resetCurrentLevel();
              } else {
                // Player chose not to restart, save their score
                saveScore(score);
              }
            }, 500);
          }
        }, 1500); // Animation duration

        return; // Skip movement for this frame
      }

      // If it's a point, collect it
      if (maze[newRow][newCol] === 0) {
        // Find the point element
        const blocks = document.querySelectorAll(".block");
        const pointIndex = newRow * maze[0].length + newCol;
        const pointElement = blocks[pointIndex];

        // Remove point visual
        if (pointElement && pointElement.classList.contains("point")) {
          pointElement.classList.remove("point");
          pointElement.style.height = "0";
          pointElement.style.width = "0";

          // Update score
          score += 10;
          document.querySelector(".score p").textContent = score;

          // Mark as collected in maze array
          maze[newRow][newCol] = 4; // 4 means collected point

          // Track points collected and check if level complete
          pointsCollected++;
          if (pointsCollected >= totalPoints) {
            // Level complete!
            clearInterval(gameInterval);
            clearInterval(enemyInterval);

            // Increment level
            currentLevel++;

            // Show level complete message
            setTimeout(() => {
              alert(
                `Level ${
                  currentLevel - 1
                } Complete! Moving to Level ${currentLevel}`
              );
              nextLevel(score, lives);
            }, 500);
          }
        }
      }

      // Move player in the maze array
      maze[playerRow][playerCol] =maze[playerRow][playerCol] === 2 ? 0 : maze[playerRow][playerCol];
      playerRow = newRow;
      playerCol = newCol;
      maze[playerRow][playerCol] = 2;

      // Update visual position (calculate pixel position based on grid)
      const blockSize = main.clientHeight / maze.length;

      // Give the main container position: relative to keep children within bounds
      main.style.position = "relative";

      // Position player
      player.style.position = "absolute";
      player.style.top = playerRow * blockSize + "px";
      player.style.left = playerCol * blockSize + "px";
      player.style.width = blockSize * 0.85 + "px";
      player.style.height = blockSize * 0.85 + "px";
      player.style.margin = "0"; // Remove any margin
      player.style.zIndex = "10"; // Make player appear above other elements
    } else {

      // bump (slight shake) visual feedback for wall collision
      player.classList.add("bump");
      setTimeout(() => {
        player.classList.remove("bump");
      }, 100);

    }
  }, 200);

  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);
  addButtonControls();
}

// Add a new function to handle level progression
function nextLevel(currentScore, currentLives) {
  // Reset the game but keep score and lives
  // Remove existing elements from main
  main.innerHTML = "";

  // Generate a new maze for the next level
  maze = generateRandomMaze(currentLevel);

  // Play music for the new level
  playLevelMusic(currentLevel);

  // Reset input states
  upPressed = false;
  downPressed = false;
  leftPressed = false;
  rightPressed = false;

  // Remove event listeners
  document.removeEventListener("keydown", keyDown);
  document.removeEventListener("keyup", keyDown);

  // Rebuild the maze
  rebuildMazeUI();

  // Update score display with current score
  document.querySelector(".score p").textContent = currentScore;

  // Start the game at the new level with current score and lives
  startGameWithState(currentScore, currentLives);
}

// Add this function to start game with existing score and lives
function startGameWithState(currentScore, currentLives) {
  // Reset game over state
  gameOver = false;

  const player = document.querySelector("#player");
  const playerMouth = player.querySelector(".mouth");
  let score = currentScore;
  let lives = currentLives;
  pointsCollected = 0;

  // Update lives display
  updateLivesDisplay(lives);

  // Show current level with an alert
  alert(`Level ${currentLevel} - Get Ready!`);

  // Play music for the current level
  playLevelMusic(currentLevel);

  // Get initial player position in the maze array
  let playerRow, playerCol;
  for (let i = 0; i < maze.length; i++) {
    for (let j = 0; j < maze[i].length; j++) {
      if (maze[i][j] === 2) {
        playerRow = i;
        playerCol = j;
        break;
      }
    }
  }

  // Find and track all enemy positions
  const enemies = [];
  const enemyElements = document.querySelectorAll(".enemy");

  for (let i = 0; i < maze.length; i++) {
    for (let j = 0; j < maze[i].length; j++) {
      if (maze[i][j] === 3) {
        enemies.push({
          row: i,
          col: j,
          element: enemyElements[enemies.length],
          direction: getRandomDirection(), // Initial random direction
        });
      }
    }
  }

  // Function to get a random direction for enemies
  function getRandomDirection() {
    const directions = ["up", "down", "left", "right"];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  // Move enemies on a separate interval (slightly slower than player)
  const enemyInterval = setInterval(function () {
    // Skip update if game is paused
    if (gamePaused) return;

    // Move each enemy
    enemies.forEach((enemy) => {
      // Store the current position
      let newRow = enemy.row;
      let newCol = enemy.col;

      // Determine new position based on current direction
      switch (enemy.direction) {
        case "up":
          newRow--;
          break;
        case "down":
          newRow++;
          break;
        case "left":
          newCol--;
          break;
        case "right":
          newCol++;
          break;
      }

      // Check if new position is valid (not a wall)
      if (
        newRow >= 0 &&
        newRow < maze.length &&
        newCol >= 0 &&
        newCol < maze[0].length &&
        maze[newRow][newCol] !== 1 &&
        maze[newRow][newCol] !== 3
      ) {
        // Check if enemy caught player
        if (maze[newRow][newCol] === 2) {
          // Skip if game is already over or player is in hit animation
          if (gameOver || player.classList.contains("hit")) return;

          // Enemy caught player - show animation and remove a life
          player.classList.add("hit");
          lives--;

          // Update lives display
          updateLivesDisplay(lives);

          // Stop movement temporarily
          upPressed = false;
          downPressed = false;
          leftPressed = false;
          rightPressed = false;

          // Wait for the animation to complete
          setTimeout(() => {
            // Remove the hit class if the player element still exists
            if (player) player.classList.remove("hit");

            // If no lives left, end the game
            if (lives <= 0) {
              // Set game over flag
              gameOver = true;

              // Stop all game loops
              clearInterval(gameInterval);
              clearInterval(enemyInterval);

              // Stop music
              stopMusic();

              // Hide pause button
              document.getElementById("pauseButton").style.display = "none";

              setTimeout(() => {
                // Ask to restart
                if (
                  confirm("Game Over! All lives lost. Restart current level?")
                ) {
                  resetCurrentLevel();
                } else {
                  // Player chose not to restart, save their score
                  saveScore(score);
                }
              }, 500);
            }
          }, 1500); // Animation duration

          return; // Skip enemy movement for this frame
        }

        // Move enemy in maze array
        maze[enemy.row][enemy.col] =
          maze[enemy.row][enemy.col] === 3 ? 0 : maze[enemy.row][enemy.col];
        enemy.row = newRow;
        enemy.col = newCol;
        maze[enemy.row][enemy.col] = 3;

        // Update visual position for enemies
        const blockSize = main.clientHeight / maze.length;
        const enemyTop = enemy.row * blockSize;
        const enemyLeft = enemy.col * blockSize;
        enemy.element.style.position = "absolute";
        enemy.element.style.top = enemyTop + "px";
        enemy.element.style.left = enemyLeft + "px";
        enemy.element.style.width = blockSize * 0.9 + "px";
        enemy.element.style.height = blockSize * 0.9 + "px";
        enemy.element.style.margin = "0"; // Remove any margin
        enemy.element.style.zIndex = "5"; // Make enemies appear below player but above points
      } else {
        // Hit a wall or another enemy, change direction
        enemy.direction = getRandomDirection();
      }
    });
  }, 300); // Enemies move slightly slower than player

  const gameInterval = setInterval(function () {
    // Skip update if game is paused
    if (gamePaused) return;

    // Store previous position for collision detection
    let newRow = playerRow;
    let newCol = playerCol;

    if (downPressed) {
      newRow++;
      playerMouth.classList = "down";
    } else if (upPressed) {
      newRow--;
      playerMouth.classList = "up";
    } else if (leftPressed) {
      newCol--;
      playerMouth.classList = "left";
    } else if (rightPressed) {
      newCol++;
      playerMouth.classList = "right";
    }

    // Check if new position is valid (not a wall)
    if (
      newRow >= 0 &&
      newRow < maze.length &&
      newCol >= 0 &&
      newCol < maze[0].length &&
      maze[newRow][newCol] !== 1
    ) {
      // Check if player hit an enemy
      if (maze[newRow][newCol] === 3) {
        // Skip if game is already over
        if (gameOver) return;

        // Player hit an enemy - show animation and remove a life
        player.classList.add("hit");
        lives--;

        // Update lives display
        updateLivesDisplay(lives);

        // Stop movement temporarily
        upPressed = false;
        downPressed = false;
        leftPressed = false;
        rightPressed = false;

        // Wait for the animation to complete
        setTimeout(() => {
          // Remove the hit class
          player.classList.remove("hit");

          // If no lives left, end the game
          if (lives <= 0) {
            // Stop all game loops
            clearInterval(gameInterval);
            clearInterval(enemyInterval);

            // Stop music
            stopMusic();

            // Hide pause button
            document.getElementById("pauseButton").style.display = "none";

            setTimeout(() => {
              // Ask to restart
              if (
                confirm("Game Over! All lives lost. Restart current level?")
              ) {
                resetCurrentLevel();
              } else {
                // Player chose not to restart, save their score
                saveScore(score);
              }
            }, 500);
          }
        }, 1500); // Animation duration

        return; // Skip movement for this frame
      }

      // If it's a point, collect it
      if (maze[newRow][newCol] === 0) {
        // Find the point element
        const blocks = document.querySelectorAll(".block");
        const pointIndex = newRow * maze[0].length + newCol;
        const pointElement = blocks[pointIndex];

        // Remove point visual
        if (pointElement && pointElement.classList.contains("point")) {
          pointElement.classList.remove("point");
          pointElement.style.height = "0";
          pointElement.style.width = "0";

          // Update score
          score += 10;
          document.querySelector(".score p").textContent = score;

          // Mark as collected in maze array
          maze[newRow][newCol] = 4; // 4 means collected point

          // Track points collected and check if level complete
          pointsCollected++;
          if (pointsCollected >= totalPoints) {
            // Level complete!
            clearInterval(gameInterval);
            clearInterval(enemyInterval);

            // Increment level
            currentLevel++;

            // Show level complete message
            setTimeout(() => {
              alert(
                `Level ${
                  currentLevel - 1
                } Complete! Moving to Level ${currentLevel}`
              );
              nextLevel(score, lives);
            }, 500);
          }
        }
      }

      // Move player in the maze array
      maze[playerRow][playerCol] = maze[playerRow][playerCol] === 2 ? 0 : maze[playerRow][playerCol];
      playerRow = newRow;
      playerCol = newCol;
      maze[playerRow][playerCol] = 2

      // Update visual position (calculate pixel position based on grid)
      const blockSize = main.clientHeight / maze.length;

      // Position player
      player.style.position = "absolute";
      player.style.top = playerRow * blockSize + "px";
      player.style.left = playerCol * blockSize + "px";
      player.style.width = blockSize * 0.85 + "px";
      player.style.height = blockSize * 0.85 + "px";
      player.style.margin = "0"; // Remove any margin
      player.style.zIndex = "10"; // Make player appear above other elements
    } else {

      // slight shake visual feedback for wall collision
      player.classList.add("bump");
      setTimeout(() => {
        player.classList.remove("bump");
      }, 100);
    }
  }, 200);

  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);
  addButtonControls();
}

// Update this function to handle dynamic maze sizes when rebuilding the UI
function rebuildMazeUI() {
  // Clear the main container
  main.innerHTML = "";
  
  const mazeHeight = maze.length;
  const mazeWidth = maze[0].length;
  
  // Calculate cell size based on the main container dimensions and maze size
  const cellHeight = main.clientHeight / mazeHeight;
  const cellWidth = main.clientWidth / mazeWidth;
  
  for (let i = 0; i < mazeHeight; i++) {
    for (let j = 0; j < mazeWidth; j++) {
      let block = document.createElement("div");
      block.classList.add("block");
      
      // Position each block absolutely within the grid
      block.style.position = "absolute";
      block.style.top = i * cellHeight + "px";
      block.style.left = j * cellWidth + "px";
      block.style.width = cellWidth + "px";
      block.style.height = cellHeight + "px";
      
      switch (maze[i][j]) {
        case 1:
          block.classList.add("wall");
          break;
        case 2:
          block.id = "player";
          let mouth = document.createElement("div");
          mouth.classList.add("mouth");
          block.appendChild(mouth);
          break;
        case 3:
          block.classList.add("enemy");
          break;
        default:
          block.classList.add("point");
          // Points should be smaller and centered in their cell
          const pointSize = Math.min(cellHeight, cellWidth) * 0.3;
          block.style.height = pointSize + "px";
          block.style.width = pointSize + "px";
          block.style.borderRadius = "50%";
          block.style.margin = "auto";
          block.style.top = i * cellHeight + (cellHeight - pointSize) / 2 + "px";
          block.style.left = j * cellWidth + (cellWidth - pointSize) / 2 + "px";
      }
      
      main.appendChild(block);
    }
  }
}

// Add this function to update the lives display
function updateLivesDisplay(livesCount) {
  const livesContainer = document.querySelector(".lives ul");

  // Clear existing lives
  livesContainer.innerHTML = "";

  // Add life elements based on current count
  for (let i = 0; i < livesCount; i++) {
    const lifeElement = document.createElement("li");
    livesContainer.appendChild(lifeElement);
  }

  // Add empty spots for lost lives (maintaining layout)
  for (let i = livesCount; i < 3; i++) {
    const emptyLife = document.createElement("li");
    emptyLife.style.backgroundColor = "transparent";
    emptyLife.style.border = "2px dashed yellow";
    livesContainer.appendChild(emptyLife);
  }
}

function resetGame() {
  // Stop current music
  stopMusic();

  // Reset gameOver flag
  gameOver = false;

  // Reset level
  currentLevel = 1;

  // Remove existing elements from main
  main.innerHTML = "";

  // Reset the maze with randomized enemy positions
  maze = generateRandomMaze(currentLevel);

  // Reset score
  document.querySelector(".score p").textContent = "0";

  // Reset input states
  upPressed = false;
  downPressed = false;
  leftPressed = false;
  rightPressed = false;

  // Reset lives display to full
  updateLivesDisplay(3);

  // Remove event listeners
  document.removeEventListener("keydown", keyDown);
  document.removeEventListener("keyup", keyUp);

  // Rebuild the maze
  rebuildMazeUI();

  // Show start button again
  startButton.style.display = "flex";
}

// Create a new function to reset only the current level
function resetCurrentLevel() {
  // Stop current music
  stopMusic();

  // Reset gameOver flag
  gameOver = false;

  // Remove existing elements from main
  main.innerHTML = "";

  // Reset the maze with randomized enemy positions for the CURRENT level
  maze = generateRandomMaze(currentLevel);

  // Reset input states
  upPressed = false;
  downPressed = false;
  leftPressed = false;
  rightPressed = false;

  // Reset lives display to full
  updateLivesDisplay(3);

  // Remove event listeners
  document.removeEventListener("keydown", keyDown);
  document.removeEventListener("keyup", keyDown);

  // Rebuild the maze
  rebuildMazeUI();

  // Reset score for this level
  document.querySelector(".score p").textContent = "0";

  // Show start button again
  startButton.style.display = "flex";
}

startButton.addEventListener("click", startGame);

//Player movement
function keyUp(event) {
  if (event.key === "ArrowUp") {
    upPressed = false;
  } else if (event.key === "ArrowDown") {
    downPressed = false;
  } else if (event.key === "ArrowLeft") {
    leftPressed = false;
  } else if (event.key === "ArrowRight") {
    rightPressed = false;
  }
}

function keyDown(event) {
  if (event.key === "ArrowUp") {
    upPressed = true;
  } else if (event.key === "ArrowDown") {
    downPressed = true;
  } else if (event.key === "ArrowLeft") {
    leftPressed = true;
  } else if (event.key === "ArrowRight") {
    rightPressed = true;
  } else if (event.key === "p" || event.key === "P") {
    // Toggle pause when P key is pressed (only when game is in progress)
    if (
      !gameOver &&
      document.getElementById("pauseButton").style.display !== "none"
    ) {
      togglePause();
    }
  }
}

function buttonMove(event) {
  // Reset all directions first
  upPressed = false;
  downPressed = false;
  leftPressed = false;
  rightPressed = false;

  // Check which button was clicked and set the corresponding direction
  if (event.target.id === "ubttn") {
    upPressed = true;
  } else if (event.target.id === "dbttn") {
    downPressed = true;
  } else if (event.target.id === "lbttn") {
    leftPressed = true;
  } else if (event.target.id === "rbttn") {
    rightPressed = true;
  }
}

//  event listeners for to each button
function addButtonControls() {
  document.getElementById("ubttn").removeEventListener("mousedown", buttonMove);
  document.getElementById("dbttn").removeEventListener("mousedown", buttonMove);
  document.getElementById("lbttn").removeEventListener("mousedown", buttonMove);
  document.getElementById("rbttn").removeEventListener("mousedown", buttonMove);

  document.getElementById("ubttn").addEventListener("mousedown", function () {
    upPressed = true;
    downPressed = false;
    leftPressed = false;
    rightPressed = false;
  });

  document.getElementById("dbttn").addEventListener("mousedown", function () {
    upPressed = false;
    downPressed = true;
    leftPressed = false;
    rightPressed = false;
  });

  document.getElementById("lbttn").addEventListener("mousedown", function () {
    upPressed = false;
    downPressed = false;
    leftPressed = true;
    rightPressed = false;
  });

  document.getElementById("rbttn").addEventListener("mousedown", function () {
    upPressed = false;
    downPressed = false;
    leftPressed = false;
    rightPressed = true;
  });

  // Stop movement when mouse is released
  document.querySelectorAll(".controls button").forEach((button) => {
    button.addEventListener("mouseup", function () {
      upPressed = false;
      downPressed = false;
      leftPressed = false;
      rightPressed = false;
    });

    button.addEventListener("mouseleave", function () {
      upPressed = false;
      downPressed = false;
      leftPressed = false;
      rightPressed = false;
    });
  });
}

// Add a function to save score and update leaderboard
function saveScore(score) {
  // Only save if score is greater than 0
  if (score <= 0) {
    resetGame();
    return;
  }

  // Ask for player name
  const playerName = prompt("Enter your name for the leaderboard:", "Player");

  if (!playerName) {
    resetGame();
    return;
  }

  // Get existing scores from local storage
  let leaderboard =
    JSON.parse(localStorage.getItem("snackManLeaderboard")) || [];

  // Add new score
  leaderboard.push({ name: playerName, score: score });

  // Sort by score (highest first)
  leaderboard.sort((a, b) => b.score - a.score);

  // Keep only top 5
  if (leaderboard.length > 5) {
    leaderboard = leaderboard.slice(0, 5);
  }

  // Save to local storage
  localStorage.setItem("snackManLeaderboard", JSON.stringify(leaderboard));

  // Update leaderboard display
  updateLeaderboard();

  // Reset game
  resetGame();
}

// Function to update the leaderboard display
function updateLeaderboard() {
  const leaderboard =
    JSON.parse(localStorage.getItem("snackManLeaderboard")) || [];
  const leaderboardOl = document.querySelector(".leaderboard ol");

  // Clear existing leaderboard
  leaderboardOl.innerHTML = "";

  // Add scores to leaderboard
  leaderboard.forEach((entry) => {
    const li = document.createElement("li");
    // Format the name and score with dots (like the original)
    const nameWithDots = entry.name.padEnd(10, "."); // Add dots after name
    li.textContent = `${nameWithDots}${entry.score}`;
    leaderboardOl.appendChild(li);
  });
}

// Call this when the page loads to initialize the leaderboard
updateLeaderboard();
