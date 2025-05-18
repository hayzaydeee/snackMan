let upPressed = false;
let downPressed = false;
let leftPressed = false;
let rightPressed = false;

let gameOver = false; // game state
let gamePaused = false; // track pause state

let currentLevel = 1;
let pointsCollected = 0;
let totalPoints = 0;

// Add this near the top of your script with other global variables
let currentMusic = null;
const musicTracks = [
  'gamer.mp3',
  'cookies.mp3',
  'forTheDay.mp3',
  'askQuestions.mp3',
];

let musicMuted = false; // Add to global variables

const main = document.querySelector("main");

function generateRandomMaze(level) {
  // Calculate enemy count - increases every 2 levels
  const enemyCount = Math.ceil(level / 2);
  
  let baseLayout;
  
  switch ((level - 1) % 3) {
    case 0: // Layout 1 (original)
      baseLayout = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 2, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 1, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ];
      break;
    case 1: // Layout 2
      baseLayout = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 2, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 0, 1, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 1, 0, 1, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 1, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ];
      break;
    case 2: // Layout 3
      baseLayout = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 2, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 1, 0, 1, 1, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      ];
      break;
  }

  // Clone the base layout to avoid modifying the original
  let newMaze = JSON.parse(JSON.stringify(baseLayout));
  
  // Find player position
  let playerRow = -1;
  let playerCol = -1;
  for (let i = 0; i < newMaze.length; i++) {
    for (let j = 0; j < newMaze[i].length; j++) {
      if (newMaze[i][j] === 2) {
        playerRow = i;
        playerCol = j;
        break;
      }
    }
    if (playerRow !== -1) break;
  }
  
  // Count total points in the maze
  totalPoints = 0;
  for (let i = 0; i < newMaze.length; i++) {
    for (let j = 0; j < newMaze[i].length; j++) {
      if (newMaze[i][j] === 0) {
        totalPoints++;
      }
    }
  }
  
  // Count available free spaces that are not too close to the player
  const freeSpaces = [];
  for (let i = 0; i < newMaze.length; i++) {
    for (let j = 0; j < newMaze[i].length; j++) {
      if (newMaze[i][j] === 0) {
        // Calculate distance from player
        const distance = Math.abs(i - playerRow) + Math.abs(j - playerCol);
        
        // Only add to free spaces if it's more than 2 spaces away from player
        if (distance > 2) {
          freeSpaces.push({row: i, col: j});
        }
      }
    }
  }
  
  // Placing enemies randomly in free spaces
  for (let i = 0; i < enemyCount; i++) {
    if (freeSpaces.length > 0) {
      // Pick a random free space
      const randomIndex = Math.floor(Math.random() * freeSpaces.length);
      const position = freeSpaces[randomIndex];
      
      // Place enemy at this position
      newMaze[position.row][position.col] = 3;
      
      // Remove this position from available free spaces
      freeSpaces.splice(randomIndex, 1);
      
      // Decrease the total points counter since this space is now an enemy
      totalPoints--;
    }
  }
  
  // Log the correct values to help debug
  console.log(`Level ${level}: Total points ${totalPoints}, Enemy count ${enemyCount}`);
  
  return newMaze;
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
    playPromise.catch(error => {
      console.log("Autoplay prevented. User must interact with the document first.");
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
  const muteButton = document.getElementById('muteButton');
  if (muteButton) {
    muteButton.textContent = musicMuted ? '🔇' : '🔊';
  }
}

// mute button creation
function createMuteButton() {
  const muteButton = document.createElement('button');
  muteButton.id = 'muteButton';
  muteButton.textContent = '🔊';
  muteButton.style.position = 'absolute';
  muteButton.style.top = '10px';
  muteButton.style.left = '10px';
  muteButton.style.zIndex = '100';
  muteButton.style.fontSize = '24px';
  muteButton.style.padding = '5px 10px';
  muteButton.style.backgroundColor = 'rgba(0,0,0,0.5)';
  muteButton.style.border = '1px solid white';
  muteButton.style.borderRadius = '5px';
  muteButton.style.cursor = 'pointer';
  
  muteButton.addEventListener('click', toggleMute);
  
  document.body.appendChild(muteButton);
}

// pause button creation
function createPauseButton() {
  const pauseButton = document.createElement('button');
  pauseButton.id = 'pauseButton';
  pauseButton.textContent = '⏸️';
  pauseButton.style.position = 'absolute';
  pauseButton.style.top = '10px';
  pauseButton.style.left = '70px'; // Position it next to the mute button
  pauseButton.style.zIndex = '100';
  pauseButton.style.fontSize = '24px';
  pauseButton.style.padding = '5px 10px';
  pauseButton.style.backgroundColor = 'rgba(0,0,0,0.5)';
  pauseButton.style.border = '1px solid white';
  pauseButton.style.borderRadius = '5px';
  pauseButton.style.cursor = 'pointer';
  pauseButton.style.display = 'none'; // Initially hidden until game starts
  
  pauseButton.addEventListener('click', togglePause);
  
  document.body.appendChild(pauseButton);
}

// Function to toggle pause state
function togglePause() {
  gamePaused = !gamePaused;
  
  // Update button appearance
  const pauseButton = document.getElementById('pauseButton');
  if (pauseButton) {
    pauseButton.textContent = gamePaused ? '▶️' : '⏸️';
  }
  
  // Show/hide pause overlay
  let pauseOverlay = document.getElementById('pauseOverlay');
  if (gamePaused) {
    if (!pauseOverlay) {
      pauseOverlay = document.createElement('div');
      pauseOverlay.id = 'pauseOverlay';
      pauseOverlay.style.position = 'absolute';
      pauseOverlay.style.top = '0';
      pauseOverlay.style.left = '0';
      pauseOverlay.style.width = '100%';
      pauseOverlay.style.height = '100%';
      pauseOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      pauseOverlay.style.display = 'flex';
      pauseOverlay.style.justifyContent = 'center';
      pauseOverlay.style.alignItems = 'center';
      pauseOverlay.style.zIndex = '90';
      
      const pauseText = document.createElement('h2');
      pauseText.textContent = 'GAME PAUSED';
      pauseText.style.fontSize = '2em';
      pauseText.style.color = 'white';
      pauseOverlay.appendChild(pauseText);
      
      main.appendChild(pauseOverlay);
    } else {
      pauseOverlay.style.display = 'flex';
    }
  } else if (pauseOverlay) {
    pauseOverlay.style.display = 'none';
  }
}

createMuteButton();
createPauseButton();

// Update the initial maze generation
let maze = generateRandomMaze(currentLevel);

// Set up the main container for proper element positioning
main.style.position = 'relative';
main.style.width = '80vh';  
main.style.height = '80vh'; 

//Populates the maze in the HTML
for (let i = 0; i < maze.length; i++) {
  for (let j = 0; j < maze[0].length; j++) {
    let block = document.createElement("div");
    block.classList.add("block");
    
    // Position each block absolutely within the grid
    block.style.position = "absolute";
    block.style.top = (i * (main.clientHeight / maze.length)) + "px";
    block.style.left = (j * (main.clientWidth / maze[0].length)) + "px";
    block.style.width = (main.clientWidth / maze[0].length) + "px";
    block.style.height = (main.clientHeight / maze.length) + "px";
    
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
        const pointSize = Math.min(main.clientHeight, main.clientWidth) / maze.length * 0.3;
        block.style.height = pointSize + "px";
        block.style.width = pointSize + "px";
        block.style.borderRadius = "50%";
        block.style.margin = "auto";
        block.style.top = (i * (main.clientHeight / maze.length) + (main.clientHeight / maze.length - pointSize) / 2) + "px";
        block.style.left = (j * (main.clientWidth / maze[0].length) + (main.clientWidth / maze[0].length - pointSize) / 2) + "px";
    }
    
    main.appendChild(block);
  }
}

startButton = document.querySelector(".start");

function startGame() {
  // Reset game over state at the beginning
  gameOver = false;
  
  startButton.style.display = "none";
  document.getElementById('pauseButton').style.display = "block"; // Show pause button
  
  // Reset pause state
  gamePaused = false;

  const player = document.querySelector("#player");
  const playerMouth = player.querySelector(".mouth");
  let score = 0;
  let lives = 3; // Initialize with 3 lives
  pointsCollected = 0; // Reset points collected
  
  // Show current level with an alert
  alert(`Level ${currentLevel} - Get Ready!`);
  
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
  const enemies = setupEnemies();
  
  // Create intervals using the shared functions
  enemyInterval = createEnemyInterval(enemies, player, lives);
  gameInterval = createGameInterval(playerRow, playerCol, player, playerMouth, score, lives);

  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);
  addButtonControls();
}

// Helper function to set up enemies
function setupEnemies() {
  const enemies = [];
  const enemyElements = document.querySelectorAll('.enemy');
  
  for (let i = 0; i < maze.length; i++) {
    for (let j = 0; j < maze[i].length; j++) {
      if (maze[i][j] === 3) {
        enemies.push({
          row: i,
          col: j,
          element: enemyElements[enemies.length],
          direction: getRandomDirection() // Initial random direction
        });
      }
    }
  }
  
  return enemies;
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
  document.removeEventListener("keyup", keyUp);
  
  // Rebuild the maze
  for (let i = 0; i < maze.length; i++) {
    for (let j = 0; j < maze[0].length; j++) {
      let block = document.createElement("div");
      block.classList.add("block");
      
      // Position each block absolutely within the grid
      block.style.position = "absolute";
      block.style.top = (i * (main.clientHeight / maze.length)) + "px";
      block.style.left = (j * (main.clientWidth / maze[0].length)) + "px";
      block.style.width = (main.clientWidth / maze[0].length) + "px";
      block.style.height = (main.clientHeight / maze.length) + "px";
      
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
          const pointSize = Math.min(main.clientHeight, main.clientWidth) / maze.length * 0.3;
          block.style.height = pointSize + "px";
          block.style.width = pointSize + "px";
          block.style.borderRadius = "50%";
          block.style.margin = "auto";
          block.style.top = (i * (main.clientHeight / maze.length) + (main.clientHeight / maze.length - pointSize) / 2) + "px";
          block.style.left = (j * (main.clientWidth / maze[0].length) + (main.clientWidth / maze[0].length - pointSize) / 2) + "px";
      }
      
      main.appendChild(block);
    }
  }
  
  // Update score display with current score
  document.querySelector('.score p').textContent = currentScore;
  
  // Start the game at the new level with current score and lives
  startGameWithState(currentScore, currentLives);
}

// start game with existing score and lives
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
  const enemies = setupEnemies();
  
  // Create intervals using the shared functions
  enemyInterval = createEnemyInterval(enemies, player, lives);
  gameInterval = createGameInterval(playerRow, playerCol, player, playerMouth, score, lives);

  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);
  addButtonControls();
}

// Helper function to handle player-enemy collision
function handlePlayerEnemyCollision(player, lives) {
  // Skip if game is already over or player is in hit animation
  if (gameOver || player.classList.contains("hit")) return;
  
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
    if (player) player.classList.remove("hit");
    
    // If no lives left, end the game
    if (lives <= 0) {
      handleGameOver();
    }
  }, 1500); // Animation duration
}

// Helper function to update enemy position
function updateEnemyPosition(enemy) {
  const blockSize = main.clientHeight / maze.length;
  const enemyTop = enemy.row * blockSize;
  const enemyLeft = enemy.col * blockSize;
  enemy.element.style.position = 'absolute';
  enemy.element.style.top = enemyTop + 'px';
  enemy.element.style.left = enemyLeft + 'px';
  enemy.element.style.width = (blockSize * 0.9) + "px";
  enemy.element.style.height = (blockSize * 0.9) + "px";
  enemy.element.style.margin = "0"; // Remove any margin
  enemy.element.style.zIndex = "5"; // Make enemies appear below player but above points
}

// Helper function to update player position
function updatePlayerPosition(player, row, col) {
  const blockSize = main.clientHeight / maze.length;
  player.style.position = 'absolute';
  player.style.top = (row * blockSize) + "px";
  player.style.left = (col * blockSize) + "px";
  player.style.width = (blockSize * 0.85) + "px";
  player.style.height = (blockSize * 0.85) + "px";
  player.style.margin = "0";  // Remove any margin
  player.style.zIndex = "10"; // Make player appear above other elements
}

// Helper function to collect point
function collectPoint(row, col, score) {
  // Find the point element
  const blocks = document.querySelectorAll('.block');
  const pointIndex = row * maze[0].length + col;
  const pointElement = blocks[pointIndex];
  
  // Remove point visual
  if (pointElement && pointElement.classList.contains('point')) {
    pointElement.classList.remove('point');
    pointElement.style.height = "0";
    pointElement.style.width = "0";
    
    // Update score
    score += 10;
    document.querySelector('.score p').textContent = score;
    
    // Mark as collected in maze array
    maze[row][col] = 4; // 4 means collected point
    
    // Track points collected and check if level complete
    pointsCollected++;
    if (pointsCollected >= totalPoints) {
      handleLevelComplete(score, lives);
    }
  }
}

// Helper function to handle game over
function handleGameOver() {
  // Set game over flag
  gameOver = true;
  
  // Stop all game loops
  clearInterval(gameInterval);
  clearInterval(enemyInterval);
  
  // Stop music
  stopMusic();
  
  // Hide pause button
  document.getElementById('pauseButton').style.display = "none";
  
  setTimeout(() => {
    // Ask to restart
    if (confirm("Game Over! All lives lost. Restart current level?")) {
      resetCurrentLevel();
    } else {
      // Player chose not to restart, save their score
      saveScore(score);
    }
  }, 500);
}

// Helper function to handle level completion
function handleLevelComplete(score, lives) {
  // Level complete!
  clearInterval(gameInterval);
  clearInterval(enemyInterval);
  
  // Increment level
  currentLevel++;
  
  // Show level complete message
  setTimeout(() => {
    alert(`Level ${currentLevel-1} Complete! Moving to Level ${currentLevel}`);
    nextLevel(score, lives);
  }, 500);
}
