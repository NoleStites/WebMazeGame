import { generatePrimMaze } from './prim.js';
import { adjustTime } from './clock.js';

var game = document.getElementById("gameCanvas");

// The game config options
var mazeConfig = {
    seed: null,
    width: null,
    height: null,
    mazeAlgorithm: null,
    playZoom: null,
    zoomStartScale: null,
    zoomEndScale: null,
    startPosition: null,
    canvasColor: null,
    finishCellColor: null,
    wallColor: null,
    floorColor: null,
    playerColor: null
}

var maze = null;
var gameStarted = null;
var gameFinished = null;
var timerRunning = null;
var timerID = null;
var startTime = null;
var ellapsedTime = null;
var pauseStart = null; // start of recent pause
var timePaused = 0; //  time spent paused
var cellSize = 20;
var playerSpeed = cellSize;
var playerSize = Math.floor(cellSize*0.7);
var scale;
var ctx;
var canvasWidth;
var canvasHeight;
var playerX;
var playerY;
var playerCell;
var wallOffsetX;
var wallOffsetY;
var drawFinishCell;
var currentGameIntervals = [];

document.getElementById("randomizeSeedButton").addEventListener("click", function() {
    let newSeed = Math.random()*2**32>>>0;
    document.getElementById("seed").value = newSeed;
});

document.getElementById("beginGameButton").addEventListener('click', function() {
    if (!validateInput()) {
        return;
    }

    let width = Number(document.getElementById("width").value);
    let height = Number(document.getElementById("height").value);
    let seed = Number(document.getElementById("seed").value);

    // Start the game
    initializeGame(seed, width, height);
});

document.addEventListener("keypress", function(e) {
    // Do nothing if the game is not in focus
    if (document.activeElement !== game) {
        return;
    }

    // Do nothing if the game hasnt started or is finished
    if (!gameStarted || gameFinished) {
        return;
    }

    // Check direction of movement based on the key pressed
    switch (e.key) {
        case 'w':
            movePlayer(0, playerSpeed);
            drawGame();
            break;
        case 'a':
            movePlayer(playerSpeed, 0);
            drawGame();
            break;
        case 's':
            movePlayer(0, -playerSpeed);
            drawGame();
            break;
        case 'd':
            movePlayer(-playerSpeed, 0);
            drawGame();
            break;

    }
});

// returns true if the user input is valid
// showError: bool to determine whether to announce error or not
function validateInput(showError=true) {
    let width = Number(document.getElementById("width").value);
    let height = Number(document.getElementById("height").value);

    // Enforce proper width and height values
    if (width % 2 == 0 || height % 2 == 0) {
        if (showError) {
            window.alert("Width and Height values must be odd.");
        }
        return false;
    }
    if (width < 7 || height < 7) {
        if (showError) {
            window.alert("Width and Height must be at least 7.");
        }
        return false;
    }

    return true;
}

function drawGame() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvasWidth/scale, canvasHeight/scale);

    // Fill in the background
    ctx.fillStyle = mazeConfig.canvasColor;
    ctx.fillRect(0, 0, canvasWidth/scale, canvasHeight/scale);

    // Create a circular clipping path
    // ctx.beginPath();
    // ctx.arc(canvasWidth/2/scale, canvasHeight/2/scale, 20, 0, Math.PI * 2, true);
    // ctx.clip();

    // Draw the maze
    for (let x = 0; x < mazeConfig.width; x++) {
        for (let y = 0; y < mazeConfig.height; y++) {
            if (maze[x][y] == 1) { // wall
                ctx.fillStyle = mazeConfig.wallColor;
            } else if (maze[x][y] == 0) { // Floor
                ctx.fillStyle = mazeConfig.floorColor;
            } else if (maze[x][y] == 2) { // Finish cell
                if (drawFinishCell) {
                    ctx.fillStyle = mazeConfig.finishCellColor;
                } else {
                    ctx.fillStyle = mazeConfig.floorColor;
                }
            }
            ctx.fillRect(x*cellSize+wallOffsetX, y*cellSize+wallOffsetY, cellSize, cellSize);
        }
    }

    // Draw the player
    ctx.fillStyle = mazeConfig.playerColor;
    ctx.fillRect(playerX, playerY, playerSize, playerSize);
}

// Moves the player based on the amount in the x and y direction
// changeX, changeY: number of pixels to move in respective direction
function movePlayer(changeX, changeY) {
    // Check for collisions before drawing
    if (changeX < 0) { // moving right
        if (playerCell[0] < mazeConfig.width-1) { // check cell to right
            if (maze[playerCell[0]+1][playerCell[1]] !== 1) { // not a wall
                wallOffsetX += changeX;
                playerCell[0] += 1;
            }
        }
    }
    if (changeX > 0) { // moving left
        if (playerCell[0] > 0) { // check cell to right
            if (maze[playerCell[0]-1][playerCell[1]] !== 1) { // not a wall
                wallOffsetX += changeX;
                playerCell[0] -= 1;
            }
        }
    }
    if (changeY < 0) { // moving down
        if (playerCell[1] < mazeConfig.height-1) { // check cell below
            if (maze[playerCell[0]][playerCell[1]+1] !== 1) { // not a wall
                wallOffsetY += changeY;
                playerCell[1] += 1;
            }
        }
    }
    if (changeY > 0) { // moving up
        if (playerCell[1] > 0) { // check cell above
            if (maze[playerCell[0]][playerCell[1]-1] !== 1) { // not a wall
                wallOffsetY += changeY;
                playerCell[1] -= 1;
            }
        }
    }
    // console.log(playerCell);

    checkForVictory();
}

function updateTimeDisplay() {
    // let timeString = ellapsedTime.toTimeString();
    // let timeString = ellapsedTime.toLocaleTimeString('es-ES', {hour:"2-digit", minute:"2-digit", second:"2-digit", timeZone:"+00"});
    // timerDisplay.innerText = timeString + `.${ms}`;

    let totalSeconds = Math.floor(ellapsedTime / 1000);

    let h = Math.floor(totalSeconds / 3600);
    // let h = ellapsedTime.getHours();
    let m = ellapsedTime.getMinutes();
    let s = ellapsedTime.getSeconds();
    let ms = ellapsedTime.getMilliseconds();
    adjustTime(h, m, s, ms);
}

// Clear all intervals from the previous game
function clearIntervals() {
    // Clear intervals
    if (currentGameIntervals) {
        currentGameIntervals.forEach(clearInterval);
    }
    currentGameIntervals = [];  
}

function startTimer() {
    if (!timerRunning && gameStarted && !gameFinished) {
        timerRunning = true;
        if (pauseStart !== null) { // Dont calculate pause time if first time starting timer
            timePaused += Date.now() - pauseStart;
        } else {
            startTime = Date.now();
        }

        timerID = setInterval(function() {
            let deltaTime = Date.now() - startTime - timePaused;
            ellapsedTime = new Date();
            ellapsedTime.setTime(deltaTime);
            updateTimeDisplay();
        }, 50);
        currentGameIntervals.push(timerID);
    }
}

function stopTimer() {
    if (timerRunning && gameStarted && !gameFinished) {
        timerRunning = false;
        pauseStart = Date.now();
        clearInterval(timerID);
    }
}

// Compares the player's position to the finish cell location
// and applies winning procedures if they match
function checkForVictory() {
    if (maze[playerCell[0]][playerCell[1]] !== 2) { // No victory
        return;
    }
    
    // document.removeEventListener("keypress", checkUserMovement);
    stopTimer();
    gameFinished = true;
    let deltaTime = Date.now() - startTime - timePaused;

    let solveTime = new Date();
    solveTime.setTime(deltaTime);
    let totalSeconds = Math.floor(deltaTime / 1000);

    let h = Math.floor(totalSeconds / 3600);
    let m = solveTime.getMinutes();
    let s = solveTime.getSeconds();
    let ms = solveTime.getMilliseconds();
    adjustTime(h, m, s, ms); // Display the final time

    // console.log(solveTime.toTimeString());
    // console.log(`Solve Time: ${h}:${m}:${s}:${ms}`);
}   


function initializeGame(seed, width, height) {
    try {
        // === REQUIRED CONFIG OPTIONS: ===
        // mazeAlgorithm = "prim";      // The type of maze generation algorithm to use: "prim"
        // playZoom = true;        // Determines whether to play the zoom animation at the start
        // zoomStartScale = 0.5;   // The scale level to define the start of the animation (how zoomed out it is)
        // zoomEndScale = 1;       // Adjust this to change the play zoom level (high => zoom in; smaller => zoom out)
        // startPosition = "center";    // Where the player starts in the maze: "center" or "topLeft"

        // canvasColor = "black";       // The color of the canvas itself (the area around the maze)
        // finishCellColor = "green";   // The color of the cell marking the end of the maze
        // wallColor = "black";         // The color of the walls of the maze
        // floorColor = "beige";        // The color of the passages within the maze
        // playerColor = "navy";        // The color of the player
        // let mazeConfig = await getDailyMazeConfig(todaysDate);
        mazeConfig = {
            seed: seed,
            width: width, // 4x + 3
            height: height, // 4x + 3
            mazeAlgorithm: "prim",
            playZoom: true,
            zoomStartScale: 0.1,
            zoomEndScale: 1.5,
            startPosition: "center",
            canvasColor: "black",
            finishCellColor: "green",
            wallColor: "black",
            floorColor: "beige",
            playerColor: "navy"
        };

        if (mazeConfig) {
            // console.log("Today's Maze Config:", mazeConfig);
            // Now you can use mazeConfig.seed, mazeConfig.width, mazeConfig.height
            // directly here or pass them to other functions
            // generateMaze(mazeConfig.seed, mazeConfig.width, mazeConfig.height, mazeConfig.mazeAlgorithm, mazeConfig.playZoom, mazeConfig.zoomStartScale, mazeConfig.zoomEndScale, mazeConfig.startPosition, mazeConfig.canvasColor, mazeConfig.finishCellColor, mazeConfig.wallColor, mazeConfig.floorColor, mazeConfig.playerColor);
            generateMaze();
        } else {
            console.warn("No maze config found for today. Cannot start game.");
            // Handle the case where no maze config is available
            displayErrorMessage("Failed to load daily maze. Please try again later.");
            return; // Stop initialization if critical data is missing
        }
    } catch (error) {
        // Catch any errors that might occur during the async operation
        console.error("An error occurred during game initialization:", error);
        return;
    }
}


// function generateMaze(seed, width, height, mazeAlgorithm, playZoom, zoomStartScale, zoomEndScale, startPosition, canvasColor, finishCellColor, wallColor, floorColor, playerColor) {
function generateMaze() {

adjustTime(0,0,0,0); // Reset timer
gameStarted = false; // Whether or not the game has finished the inital zoom and started
gameFinished = false;
timerRunning = false;

// Stop/start timer when game has lost or gained focus
timerID = null;
startTime = null;
ellapsedTime = null;

// keep track of time spent in game pause to subject when continuing
pauseStart = null; // start of recent pause
timePaused = 0; //  time spent paused

game.removeEventListener("blur", stopTimer) // 'blur' == losing focus
game.removeEventListener("focus", startTimer) // 'blur' == losing focus
game.addEventListener("blur", stopTimer) // 'blur' == losing focus
game.addEventListener("focus", startTimer) // 'blur' == losing focus

generateGame();

// Runs all game logic when the page loads
function generateGame() {
    clearIntervals(); // Reset game state

    let gameCanvas = document.getElementById("gameCanvas");
    canvasWidth = gameCanvas.width;
    canvasHeight = gameCanvas.height;

    gameCanvas.style.backgroundColor = mazeConfig.canvasColor;

    // Check browser compatability with canvas
    if (mazeConfig.playZoom) {
        scale = mazeConfig.zoomStartScale;
    } else {
        scale = mazeConfig.zoomEndScale;
    }
    if (gameCanvas.getContext) {
        ctx = gameCanvas.getContext("2d");
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset the scale before changing it (or else it scales the scale)
        ctx.scale(scale, scale); // Increase the size of each unit in the canvas (zooming in)
    }
    else {
        alert("Your browser does not support this game, sorry!");
    }

    // NOTE: any maze-generation algorithm is expected to return a 
    // 2D array [width][height] of 0s (floor) and 1s (walls) and 2 (finish cell)
    if (mazeConfig.mazeAlgorithm === "prim") {
        maze = generatePrimMaze(mazeConfig.seed, mazeConfig.width, mazeConfig.height, mazeConfig.startPosition);
    }
    else {
        maze = generatePrimMaze(mazeConfig.seed, mazeConfig.width, mazeConfig.height, mazeConfig.startPosition);
    }
    
    drawFinishCell = !mazeConfig.playZoom; // Only draw finish when zoom animation is complete

    // Determine how much to offset the walls from the top-left corner
    [wallOffsetX, wallOffsetY] = calculateWallOffset(mazeConfig.startPosition);

    // Place player on game canvas
    playerX = canvasWidth/2/scale - Math.floor(playerSize/2);
    playerY = canvasHeight/2/scale - Math.floor(playerSize/2);

    if (mazeConfig.startPosition == "topLeft") {
        playerCell = [1,1]
    }
    else if (mazeConfig.startPosition == "center") {
        playerCell = [Math.floor(mazeConfig.width/2), Math.floor(mazeConfig.height/2)];
    }
    else { // Default top-left
        playerCell = [1,1];
    }
    drawGame();

    // Apply zoom animation if there is one
    if (mazeConfig.playZoom) {
        pauseBeforeAnimation(zoomIn);
    } else {
        gameStarted = true;
        if (game.activeElement) {
            startTimer();
        }
        // allowMovement();
    }

    // Calculates the amount of units to offset the maze from the to-left corner to have
    // the player positioned properly
    //  startPosition: "center" or "topLeft"
    function calculateWallOffset(startPosition) {
        let wallOffsetX, wallOffsetY;
        if (startPosition == "topLeft") {
            wallOffsetX = canvasWidth/2/scale - (1.5*cellSize);
            wallOffsetY = canvasHeight/2/scale - (1.5*cellSize);
        }
        else if (startPosition == "center") {
            wallOffsetX = canvasWidth/2/scale - Math.floor(0.5*mazeConfig.width*cellSize);
            wallOffsetY = canvasHeight/2/scale - Math.floor(0.5*mazeConfig.height*cellSize);
        }
        else { // Default top-left
            wallOffsetX = canvasWidth/2/scale - (1.5*cellSize);
            wallOffsetY = canvasHeight/2/scale - (1.5*cellSize);
        }
        return [wallOffsetX, wallOffsetY];
    }

    // Rescale zoom
    function zoomIn() {
        const intervalId = setInterval(function() {
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset the scale before changing it (or else it scales the scale)

            scale = parseFloat(scale.toFixed(2));
            ctx.scale(scale, scale); // Increase the size of each unit in the canvas (zooming in)

            wallOffsetX = canvasWidth/2/scale - (1.5*cellSize);
            wallOffsetY = canvasHeight/2/scale - (1.5*cellSize);
            [wallOffsetX, wallOffsetY] = calculateWallOffset(mazeConfig.startPosition);
            playerX = canvasWidth/2/scale - Math.floor(playerSize/2);
            playerY = canvasHeight/2/scale - Math.floor(playerSize/2);
            ctx.fillStyle = mazeConfig.playerColor;
            ctx.fillRect(playerX, playerY, playerSize, playerSize);

            drawGame();

            scale += 0.1;

            // End-of-zoom/start-of-game logic
            if (scale >= mazeConfig.zoomEndScale) {
                clearInterval(intervalId); // Stop the interval after 3 ticks
                drawFinishCell = true;
                drawGame(); // To render the finish cell at start
                gameStarted = true;
                if (game === document.activeElement) {
                    startTimer();
                }
                // allowMovement();
            }
        }, 25);
        currentGameIntervals.push(intervalId);
    }

    // Shows the zoomed-out maze for a certain amount of time before zooming in
    function pauseBeforeAnimation(callback) {
        let counter = 0;
        const intervalId = setInterval(function() {
            counter++;
            if (counter >= 1) {
                clearInterval(intervalId); // Stop the interval after 3 ticks
                callback();
            }
        }, 1000);
        currentGameIntervals.push(intervalId);
    }

}

} // END generateMaze


// Run once when page loads
if (validateInput()) {
    let width = Number(document.getElementById("width").value);
    let height = Number(document.getElementById("height").value);
    let seed = Number(document.getElementById("seed").value);

    // Start the game
    initializeGame(seed, width, height);
}