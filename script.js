let upPressed = false;
let downPressed = false;
let leftPressed = false;
let rightPressed = false;

let gameOver = false; // game state

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
  
  // Create different maze layouts based on level
  // We'll create 3 different layouts that cycle as levels increase
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
      
      // IMPORTANT FIX: Decrease the total points counter since this space is now an enemy
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

// Add a function to toggle mute
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

// Add this at the end of your script to create the mute button
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

// Call this function when the page loads
createMuteButton();

// Update the initial maze generation
let maze = generateRandomMaze(currentLevel);

// Set up the main container for proper element positioning
main.style.position = 'relative';
main.style.width = '80vh';  // Match the CSS width
main.style.height = '80vh'; // Match the CSS height

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

  const player = document.querySelector("#player");
  const playerMouth = player.querySelector(".mouth");
  let playerTop = 0;
  let playerLeft = 0;
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
  
  // Function to get a random direction for enemies
  function getRandomDirection() {
    const directions = ['up', 'down', 'left', 'right'];
    return directions[Math.floor(Math.random() * directions.length)];
  }
  
  // Move enemies on a separate interval (slightly slower than player)
  const enemyInterval = setInterval(function() {
    // Move each enemy
    enemies.forEach(enemy => {
      // Store the current position
      let newRow = enemy.row;
      let newCol = enemy.col;
      
      // Determine new position based on current direction
      switch (enemy.direction) {
        case 'up': 
          newRow--; 
          break;
        case 'down': 
          newRow++; 
          break;
        case 'left': 
          newCol--; 
          break;
        case 'right': 
          newCol++; 
          break;
      }
      
      // Check if new position is valid (not a wall)
      if (newRow >= 0 && newRow < maze.length && 
          newCol >= 0 && newCol < maze[0].length && 
          maze[newRow][newCol] !== 1 && maze[newRow][newCol] !== 3) {
        
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
          }, 1500); // Animation duration
          
          return; // Skip enemy movement for this frame
        }
        
        // Move enemy in maze array
        maze[enemy.row][enemy.col] = maze[enemy.row][enemy.col] === 3 ? 0 : maze[enemy.row][enemy.col];
        enemy.row = newRow;
        enemy.col = newCol;
        maze[enemy.row][enemy.col] = 3;
        
        // Update visual position for enemies
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
      } else {
        // Hit a wall or another enemy, change direction
        enemy.direction = getRandomDirection();
      }
    });
  }, 300); // Enemies move slightly slower than player
  
  const gameInterval = setInterval(function () {
    // Store previous position for collision detection
    let newRow = playerRow;
    let newCol = playerCol;

    // Determine movement direction based on key presses
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
    if (newRow >= 0 && newRow < maze.length && 
        newCol >= 0 && newCol < maze[0].length && 
        maze[newRow][newCol] !== 1) {
      
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
        }, 1500); // Animation duration
        
        return; // Skip movement for this frame
      }
      
      // If it's a point, collect it
      if (maze[newRow][newCol] === 0) {
        // Find the point element
        const blocks = document.querySelectorAll('.block');
        const pointIndex = newRow * maze[0].length + newCol;
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
              alert(`Level ${currentLevel-1} Complete! Moving to Level ${currentLevel}`);
              nextLevel(score, lives);
            }, 500);
          }
        }
      }
      
      // Move player in the maze array
      maze[playerRow][playerCol] = maze[playerRow][playerCol] === 2 ? 0 : maze[playerRow][playerCol];
      playerRow = newRow;
      playerCol = newCol;
      maze[playerRow][playerCol] = 2;
      
      // Update visual position (calculate pixel position based on grid)
      const blockSize = main.clientHeight / maze.length;

      // Give the main container position: relative to keep children within bounds
      main.style.position = 'relative';

      // Position player
      player.style.position = 'absolute';
      player.style.top = (playerRow * blockSize) + "px";
      player.style.left = (playerCol * blockSize) + "px";
      player.style.width = (blockSize * 0.85) + "px";
      player.style.height = (blockSize * 0.85) + "px";
      player.style.margin = "0";  // Remove any margin
      player.style.zIndex = "10"; // Make player appear above other elements
    } else {
      // Skip if game is already over
      if (gameOver) return;
      
      // Player hit a wall - show animation and end game
      player.classList.add("hit");
      gameOver = true;

      // Stop all game loops
      clearInterval(gameInterval);
      clearInterval(enemyInterval);

      // Stop music
      stopMusic();

      // Wait a moment to show the hit animation
      setTimeout(() => {
        // Ask to restart
        if (confirm("You hit a wall! Restart current level?")) {
          resetCurrentLevel();
        } else {
          // Player chose not to restart, save their score
          saveScore(score);
        }
      }, 500);
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
  
  // Function to get a random direction for enemies
  function getRandomDirection() {
    const directions = ['up', 'down', 'left', 'right'];
    return directions[Math.floor(Math.random() * directions.length)];
  }
  
  // Move enemies on a separate interval (slightly slower than player)
  const enemyInterval = setInterval(function() {
    // Move each enemy
    enemies.forEach(enemy => {
      // Store the current position
      let newRow = enemy.row;
      let newCol = enemy.col;
      
      // Determine new position based on current direction
      switch (enemy.direction) {
        case 'up': 
          newRow--; 
          break;
        case 'down': 
          newRow++; 
          break;
        case 'left': 
          newCol--; 
          break;
        case 'right': 
          newCol++; 
          break;
      }
      
      // Check if new position is valid (not a wall)
      if (newRow >= 0 && newRow < maze.length && 
          newCol >= 0 && newCol < maze[0].length && 
          maze[newRow][newCol] !== 1 && maze[newRow][newCol] !== 3) {
        
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
          }, 1500); // Animation duration
          
          return; // Skip enemy movement for this frame
        }
        
        // Move enemy in maze array
        maze[enemy.row][enemy.col] = maze[enemy.row][enemy.col] === 3 ? 0 : maze[enemy.row][enemy.col];
        enemy.row = newRow;
        enemy.col = newCol;
        maze[enemy.row][enemy.col] = 3;
        
        // Update visual position for enemies
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
      } else {
        // Hit a wall or another enemy, change direction
        enemy.direction = getRandomDirection();
      }
    });
  }, 300); // Enemies move slightly slower than player
  
  const gameInterval = setInterval(function () {
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
    if (newRow >= 0 && newRow < maze.length && 
        newCol >= 0 && newCol < maze[0].length && 
        maze[newRow][newCol] !== 1) {
      
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
        }, 1500); // Animation duration
        
        return; // Skip movement for this frame
      }
      
      // If it's a point, collect it
      if (maze[newRow][newCol] === 0) {
        // Find the point element
        const blocks = document.querySelectorAll('.block');
        const pointIndex = newRow * maze[0].length + newCol;
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
              alert(`Level ${currentLevel-1} Complete! Moving to Level ${currentLevel}`);
              nextLevel(score, lives);
            }, 500);
          }
        }
      }
      
      // Move player in the maze array
      maze[playerRow][playerCol] = maze[playerRow][playerCol] === 2 ? 0 : maze[playerRow][playerCol];
      playerRow = newRow;
      playerCol = newCol;
      maze[playerRow][playerCol] = 2;
      
      // Update visual position (calculate pixel position based on grid)
      const blockSize = main.clientHeight / maze.length;
      
      // Position player
      player.style.position = 'absolute';
      player.style.top = (playerRow * blockSize) + "px";
      player.style.left = (playerCol * blockSize) + "px";
      player.style.width = (blockSize * 0.85) + "px";
      player.style.height = (blockSize * 0.85) + "px";
      player.style.margin = "0";  // Remove any margin
      player.style.zIndex = "10"; // Make player appear above other elements
    } else {
      // WALL COLLISION - MODIFIED
      // Instead of ending the game, just add a simple visual feedback and do nothing

      // Optional: Add a small visual feedback (slight shake)
      player.classList.add("bump");
      setTimeout(() => {
        player.classList.remove("bump");
      }, 100);
      
      // IMPORTANT: Do NOT set gameOver flag or clear intervals!
      // Do NOT stop player movement and game progress
    }
  }, 200);

  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);
  addButtonControls();
}

// Add this function to update the lives display
function updateLivesDisplay(livesCount) {
  const livesContainer = document.querySelector('.lives ul');
  
  // Clear existing lives
  livesContainer.innerHTML = '';
  
  // Add life elements based on current count
  for (let i = 0; i < livesCount; i++) {
    const lifeElement = document.createElement('li');
    livesContainer.appendChild(lifeElement);
  }
  
  // Add empty spots for lost lives (maintaining layout)
  for (let i = livesCount; i < 3; i++) {
    const emptyLife = document.createElement('li');
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
  document.querySelector('.score p').textContent = "0";
  
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
  
  // Reset score for this level
  document.querySelector('.score p').textContent = "0";
  
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
  
  document.getElementById("ubttn").addEventListener("mousedown", function() {
    upPressed = true;
    downPressed = false;
    leftPressed = false;
    rightPressed = false;
  });
  
  document.getElementById("dbttn").addEventListener("mousedown", function() {
    upPressed = false;
    downPressed = true;
    leftPressed = false;
    rightPressed = false;
  });
  
  document.getElementById("lbttn").addEventListener("mousedown", function() {
    upPressed = false;
    downPressed = false;
    leftPressed = true;
    rightPressed = false;
  });
  
  document.getElementById("rbttn").addEventListener("mousedown", function() {
    upPressed = false;
    downPressed = false;
    leftPressed = false;
    rightPressed = true;
  });
  
  // Stop movement when mouse is released
  document.querySelectorAll(".controls button").forEach((button) => {
    button.addEventListener("mouseup", function() {
      upPressed = false;
      downPressed = false;
      leftPressed = false;
      rightPressed = false;
    });
    
    button.addEventListener("mouseleave", function() {
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
  let leaderboard = JSON.parse(localStorage.getItem('snackManLeaderboard')) || [];
  
  // Add new score
  leaderboard.push({name: playerName, score: score});
  
  // Sort by score (highest first)
  leaderboard.sort((a, b) => b.score - a.score);
  
  // Keep only top 5
  if (leaderboard.length > 5) {
    leaderboard = leaderboard.slice(0, 5);
  }
  
  // Save to local storage
  localStorage.setItem('snackManLeaderboard', JSON.stringify(leaderboard));
  
  // Update leaderboard display
  updateLeaderboard();
  
  // Reset game
  resetGame();
}

// Function to update the leaderboard display
function updateLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem('snackManLeaderboard')) || [];
  const leaderboardOl = document.querySelector('.leaderboard ol');
  
  // Clear existing leaderboard
  leaderboardOl.innerHTML = '';
  
  // Add scores to leaderboard
  leaderboard.forEach(entry => {
    const li = document.createElement('li');
    // Format the name and score with dots (like the original)
    const nameWithDots = entry.name.padEnd(10, '.'); // Add dots after name
    li.textContent = `${nameWithDots}${entry.score}`;
    leaderboardOl.appendChild(li);
  });
}

// Call this when the page loads to initialize the leaderboard
updateLeaderboard();
