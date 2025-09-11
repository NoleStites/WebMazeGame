import { generatePrimMaze } from './prim.js';
import { adjustTime } from './clock.js';
import { getDailyMazeConfig, submitPlayerScore, listenForLeaderboard, auth, getCurrentUser, getCurrentUserUid, database } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

let pageContent = document.getElementById("page");

// This function resolves once the initial Firebase Auth state is known.
function awaitAuthReady() {
  return new Promise(resolve => {
    // onAuthStateChanged fires immediately with the current state
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe(); // Unsubscribe immediately after the first event
      resolve(user); // Resolve the Promise with the user object
    });
  });
}

// Let's create an async function for your game's main initialization
async function checkAuthentication() {
    // console.log("Starting game initialization...");

    // 1. Initial State: Hide main content, show loading indicator
    if (pageContent) pageContent.style.display = 'none';   

    let mazeConfig = null; // Initialize to null

    try {
        // 2. Wait for the initial authentication state to be definitively known
        const user = await awaitAuthReady(); // This pauses execution until auth state is confirmed

        // 3. Perform the authentication check
        if (user && !user.isAnonymous) {
            // User is permanently authenticated - proceed with game initialization!
            // console.log("Authenticated permanent user detected:", user.uid);

            // Safely get the current user details using your getter functions
            const currentUserUid = getCurrentUserUid();
            const currentFirebaseUser = getCurrentUser();

            // Get display name (from Auth object or your user_profiles node)
            let currentUserName = currentFirebaseUser.displayName;
            if (!currentUserName) {
                // Fallback: If displayName isn't on the Auth object (e.g., Email/Password signup)
                // you would fetch it from your 'user_profiles' node here.
                // For this example, let's use a temporary fallback.
                // console.warn("Display name not directly on Auth user. Fetching from user_profiles or using fallback.");
                // You'd need an async function like: currentUserName = await getUserDisplayNameFromDb(currentUserUid);
                currentUserName = "Player " + currentUserUid.substring(0, 4); // Example fallback
            }

            // 4. Authentication Passed: Hide loading, show page content
            if (pageContent) pageContent.style.display = 'flex'; // Show your page content (e.g., maze)

            initializeGame();
        } else {
            // User is not signed in OR is signed in anonymously - Redirect!
            console.warn("User not authenticated for Daily Maze (or is anonymous). Redirecting to login page...");
            // 4. Authentication Failed: Redirect (content remains hidden)
            window.location.href = "/pages/login.html"; // Adjust to your actual login page path
        }
    }
    catch (error) {
        // Catch any errors during authentication or page setup
        console.error("An error occurred during daily maze page initialization:", error);
        // Handle gracefully, e.g., redirect to login or an error page
        window.location.href = "/pages/login.html";
    }
}




async function initializeGame() {
    try {
        // Verify that the user is logged in
        // auth.onAuthStateChanged(user => {
        //     if (user) {
        //         console.log("Auth state changed in another script: User is signed in!", user.uid);
        //     } else {
        //         console.log("Auth state changed in another script: User is signed out.");
        //     }
        // });

        // Await the result of the asynchronous function
        // The code here will pause until getDailyMazeConfig completes
        let todaysDate = "2025-9-10";
        const today = new Date();
        console.log(today.toLocaleDateString()); // Format: MM/DD/YYYY
        document.title = `Daily Maze – ${today.toLocaleDateString()}`;

        // === REQUIRED CONFIG OPTIONS: ===
        // mazeAlgorithm = "prim";      // The type of maze generation algorithm to use: "prim"
        // gameStartZoom = true;        // Determines whether to play the zoom animation at the start
        // animationStartScale = 0.5;   // The scale level to define the start of the animation (how zoomed out it is)
        // animationEndScale = 1;       // Adjust this to change the play zoom level (high => zoom in; smaller => zoom out)
        // startPosition = "center";    // Where the player starts in the maze: "center" or "topLeft"

        // canvasColor = "black";       // The color of the canvas itself (the area around the maze)
        // finishCellColor = "green";   // The color of the cell marking the end of the maze
        // wallColor = "black";         // The color of the walls of the maze
        // floorColor = "beige";        // The color of the passages within the maze
        // playerColor = "navy";        // The color of the player
        let mazeConfig = await getDailyMazeConfig(todaysDate);

        if (mazeConfig) {
            // console.log("Today's Maze Config:", mazeConfig);
            // Now you can use mazeConfig.seed, mazeConfig.width, mazeConfig.height
            // directly here or pass them to other functions
            generateMaze(todaysDate, mazeConfig.seed, mazeConfig.width, mazeConfig.height, mazeConfig.mazeAlgorithm, mazeConfig.playZoom, mazeConfig.zoomStartScale, mazeConfig.zoomEndScale, mazeConfig.startPosition, mazeConfig.canvasColor, mazeConfig.finishCellColor, mazeConfig.wallColor, mazeConfig.floorColor, mazeConfig.playerColor);
            loadLeaderboard(todaysDate); // Assuming you'd get the date from config or elsewhere
        } else {
            console.warn("No maze config found for today. Cannot start game.");
            // Handle the case where no maze config is available
            displayErrorMessage("Failed to load daily maze. Please try again later.");
            return; // Stop initialization if critical data is missing
        }
    } catch (error) {
        // Catch any errors that might occur during the async operation
        console.error("An error occurred during game initialization:", error);
        displayErrorMessage("An error occurred. Check console for details.");
        return;
    }

    // All code here will only execute AFTER the mazeConfig has been successfully fetched
    // (or if an error occurred and was handled).
    // This is where the rest of your game's setup logic would go.
    // console.log("Maze generated. Proceeding with game setup...");
    // setupInputListeners();
    // startGameLoop();
    // ... all other game initialization steps
}

// Call the initialization function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', checkAuthentication);


// Creates the HTML element for a leaderboard entry given the number, name, and time of that entry
function makeLeaderboardEntry(number, name, time_ms, isCurrentPlayer) {
    let entry = document.createElement("li");
    entry.classList.add("leaderboardEntry");
    if (isCurrentPlayer) {
        entry.classList.add("currentPlayerEntry");
    }

    let entryNumber = document.createElement("div");
    entryNumber.classList.add("entryNumber");
    entryNumber.innerText = number + '.';

    let nameTimeContainer = document.createElement("div");
    nameTimeContainer.classList.add("nameTimeContainer");

    let entryName = document.createElement("div");
    entryName.classList.add("entryName");
    entryName.innerText = name;

    let timeDiv = document.createElement("div");
    let seconds = Math.floor(time_ms / 1000);
    let ms = Math.floor(time_ms - seconds*1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    timeDiv.innerText = `(${hours}:${minutes}:${seconds}:${ms})`;

    nameTimeContainer.appendChild(entryName);
    nameTimeContainer.appendChild(timeDiv);
    entry.appendChild(entryNumber);
    entry.appendChild(nameTimeContainer);
    
    return entry;
}

function loadLeaderboard(dateString) {
    // console.log(`Loading leaderboard for ${dateString}...`);
    // Your actual leaderboard loading code (e.g., calling listenForLeaderboard)
    // Example usage
    const today = "2025-9-10";
    document.getElementById("leaderboardTitle").innerText = `Leaderboard --- ${today}`;

    let leaderboardElement = document.getElementById("leaderboardEntryList");
    // console.log(`Listening for top 5 scores on ${today}...`);
    const unsubscribeLeaderboard = listenForLeaderboard(today, 5, (leaderboard) => {
        // console.log(`--- Leaderboard for ${today} (Top 5) ---`);
        leaderboardElement.innerHTML = "";
        if (leaderboard.length === 0) {
                leaderboardElement.appendChild(makeLeaderboardEntry('---', '---', 0));
        } else {
            leaderboard.forEach((entry, index) => {
                // console.log(`${index + 1}. ${entry.name} (${entry.time_ms / 1000}s)`);
                // console.log(`Current: ${currentUserUid}\nEntry: ${entry.playerId}`);
                leaderboardElement.appendChild(makeLeaderboardEntry(index + 1, entry.name, entry.time_ms, entry.playerId === getCurrentUserUid()));
            });
        }
        // console.log("---------------------------------------");
    });

    // To stop listening later (e.g., when the user leaves the page):
    // unsubscribeLeaderboard();
}

function displayErrorMessage(message) {
    console.log(`Displaying error message: ${message}`);
    // Your UI code to show an error
}

// function setupInputListeners() { console.log("Setting up input listeners."); }

// function startGameLoop() { console.log("Starting game loop."); }

// Don't forget to actually call your async initialization function to start your game!
// initializeGame();
























function generateMaze(todaysDate, gameSeed, mazeWidth, mazeHeight, mazeAlgorithm, gameStartZoom, animationStartScale, animationEndScale, startPosition, canvasColor, finishCellColor, wallColor, floorColor, playerColor) {

// let gameStartZoom = true; // determines whether to play the zoom animation at that start
// let animationStartScale = 0.5; // The scale level to define the start of the animation (how zoomed out it is)
// let animationEndScale = 1; // Adjust this to change the play zoom level (high => zoom in; smaller => zoom out)
// let startPosition = "center"; // "center" or "topLeft"
// let mazeAlgorithm = "prim";
// // Styles
// let canvasColor = "purple";
// let finishCellColor = "green";
// let wallColor = "black";
// let floorColor = "beige";
// let playerColor = "navy";

// Global vars
// var gameSeed = (Math.random()*2**32)>>>0;
// var gameSeed = config.seed;
var gameStarted = false; // Whether or not the game has finished the inital zoom and started
var gameFinished = false;
var timerRunning = false;

// Page refresh logic (when user clicks refresh, but before refresh)
window.onbeforeunload = function(event) {
    // Perform actions here, such as saving data or displaying a confirmation.
    // For example, to prompt the user before refreshing:
    // const message = "Are you sure you want to leave or refresh this page?";
    // event.returnValue = message; // Standard for most browsers
    // return message; // For older browsers (e.g., Firefox)
};

// window.addEventListener("load", generateGame);
let gameButton = document.getElementById("beginGameButton")
gameButton.addEventListener('click', function() {
    // Deactivate button
    gameButton.disabled = true;

    // Start the game
    generateGame();
});

// Stop/start timer when game has lost or gained focus
let game = document.getElementById("gameCanvas");
let timerDisplay = document.getElementById("timerDisplay");
let timerID = null;
let startTime = null;
let ellapsedTime = null;

// keep track of time spent in game pause to subject when continuing
let pauseStart = null; // start of recent pause
let timePaused = 0; //  time spent paused

game.addEventListener("blur", function() { // 'blur' == losing focus
    stopTimer();
});
game.addEventListener("focus", function() { // 'blur' == losing focus
    startTimer();
});

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
    }
}

function stopTimer() {
    if (timerRunning && gameStarted && !gameFinished) {
        timerRunning = false;
        pauseStart = Date.now();
        clearInterval(timerID);
    }
}

// Runs all game logic when the page loads
async function generateGame() {
    // Safely get the current user details using your getter functions
    const currentUserUid = getCurrentUserUid(); // This gets the UID string
    const currentFirebaseUser = getCurrentUser(); // This gets the full User object

    // --- IMPORTANT: Get the playerName (string) correctly ---
    let playerName = "Unknown Player"; // Default fallback

    // Option 1: Try to get display name directly from the Firebase Auth User object
    if (currentFirebaseUser && currentFirebaseUser.displayName) {
        playerName = currentFirebaseUser.displayName;
    } else {
        // Option 2: If displayName is null (common for Email/Password),
        // fetch it from your Realtime Database 'user_profiles' node.
        // This requires an asynchronous call, so use 'await'.
        try {
            // You'll need a function to fetch the display name from your DB
            // Let's assume you have (or will create) a function like this:
            // async function getUserDisplayNameFromDb(uid) { /* ... fetch from user_profiles/${uid}/displayName ... */ }
            const userProfileRef = ref(database, `user_profiles/${currentUserUid}/displayName`); // Assuming 'database' is imported/available
            const snapshot = await get(userProfileRef);
            if (snapshot.exists()) {
                playerName = snapshot.val();
            } else {
                console.warn(`Display name not found in DB for UID: ${currentUserUid}`);
            }
        } catch (dbError) {
            console.error("Error fetching display name from DB:", dbError);
        }
    }
    // --- End of playerName retrieval ---

    let gameCanvas = document.getElementById("gameCanvas");
    let canvasWidth = gameCanvas.width;
    let canvasHeight = gameCanvas.height;

    gameCanvas.style.backgroundColor = canvasColor;

    // Check browser compatability with canvas
    let ctx;

    let scale;

    if (gameStartZoom) {
        scale = animationStartScale;
    } else {
        scale = animationEndScale;
    }
    if (gameCanvas.getContext) {
        ctx = gameCanvas.getContext("2d");
        ctx.scale(scale, scale); // Increase the size of each unit in the canvas (zooming in)
    }
    else {
        alert("Your browser does not support this game, sorry!");
    }

    // Generate and display the maze (NOTE: must use odd-numbered dimensions!)
    //      - maze dimension needs follow the formula 4x + 3 (avoids double-thick outer edges and thus no finish cell)
    // let mazeWidth = 7;
    // let mazeHeight = 7;
    // let mazeWidth = config.width;
    // let mazeHeight = config.height;
    let cellSize = 20;

    // NOTE: any maze-generation algorithm is expected to return a 
    // 2D array [width][height] of 0s (floor) and 1s (walls) and 2 (finish cell)
    let maze;
    if (mazeAlgorithm === "prim") {
        maze = generatePrimMaze(gameSeed, mazeWidth, mazeHeight, startPosition);
    }
    else {
        maze = generatePrimMaze(gameSeed, mazeWidth, mazeHeight, startPosition);
    }
    
    let drawFinishCell = !gameStartZoom; // Only draw finish when zoom animation is complete

    // Determine how much to offset the walls from the top-left corner
    let [wallOffsetX, wallOffsetY] = calculateWallOffset(startPosition);

    // Place player on game canvas
    let playerSize = Math.floor(cellSize/2);
    let playerSpeed = cellSize; // pixels per second
    // -- center player in the top-left corner of the maze
    let playerX = canvasWidth/2/scale - Math.floor(playerSize/2);
    let playerY = canvasHeight/2/scale - Math.floor(playerSize/2);

    let playerCell; // Coordinate of the player
    if (startPosition == "topLeft") {
        playerCell = [1,1]
    }
    else if (startPosition == "center") {
        playerCell = [Math.floor(mazeWidth/2), Math.floor(mazeHeight/2)];
    }
    else { // Default top-left
        playerCell = [1,1];
    }
    ctx.fillStyle = playerColor;
    ctx.fillRect(playerX, playerY, playerSize, playerSize);

    drawGame();

    // Apply zoom animation if there is one
    if (gameStartZoom) {
        pauseBeforeAnimation(zoomIn);
    } else {
        gameStarted = true;
        if (game.activeElement) {
            startTimer();
        }
        allowMovement();
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
            wallOffsetX = canvasWidth/2/scale - Math.floor(0.5*mazeWidth*cellSize);
            wallOffsetY = canvasHeight/2/scale - Math.floor(0.5*mazeHeight*cellSize);
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
            [wallOffsetX, wallOffsetY] = calculateWallOffset(startPosition);
            playerX = canvasWidth/2/scale - Math.floor(playerSize/2);
            playerY = canvasHeight/2/scale - Math.floor(playerSize/2);
            ctx.fillStyle = playerColor;
            ctx.fillRect(playerX, playerY, playerSize, playerSize);

            drawGame();

            scale += 0.1;

            // End-of-zoom/start-of-game logic
            if (scale >= animationEndScale) {
                clearInterval(intervalId); // Stop the interval after 3 ticks
                drawFinishCell = true;
                drawGame(); // To render the finish cell at start
                gameStarted = true;
                if (game === document.activeElement) {
                    startTimer();
                }
                allowMovement();
            }
        }, 25);
    }

    function checkUserMovement(e) {
        // Do nothing if the game is not in focus
        if (document.activeElement !== gameCanvas) {
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
    }

    function allowMovement() {
        // Game loop
        document.addEventListener("keypress", checkUserMovement);
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
    }

    function drawGame() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvasWidth/scale, canvasHeight/scale);

        // Fill in the background
        ctx.fillStyle = canvasColor;
        ctx.fillRect(0, 0, canvasWidth/scale, canvasHeight/scale);

        // Create a circular clipping path
        // ctx.beginPath();
        // ctx.arc(canvasWidth/2/scale, canvasHeight/2/scale, 20, 0, Math.PI * 2, true);
        // ctx.clip();

        // Draw the maze
        for (let x = 0; x < mazeWidth; x++) {
            for (let y = 0; y < mazeHeight; y++) {
                if (maze[x][y] == 1) { // wall
                    ctx.fillStyle = wallColor;
                } else if (maze[x][y] == 0) { // Floor
                    ctx.fillStyle = floorColor;
                } else if (maze[x][y] == 2) { // Finish cell
                    if (drawFinishCell) {
                        ctx.fillStyle = finishCellColor;
                    } else {
                        ctx.fillStyle = floorColor;
                    }
                }
                // if ((x == Math.floor(mazeWidth/2)) && y == Math.floor(mazeHeight/2)) { // Center tile of maze different color
                //     ctx.fillStyle = "red";
                // }
                ctx.fillRect(x*cellSize+wallOffsetX, y*cellSize+wallOffsetY, cellSize, cellSize);
            }
        }

        // Draw the player
        ctx.fillStyle = playerColor;
        ctx.fillRect(playerX, playerY, playerSize, playerSize);
    }

    // Moves the player based on the amount in the x and y direction
    // changeX, changeY: number of pixels to move in respective direction
    function movePlayer(changeX, changeY) {
        // Check for collisions before drawing
        if (changeX < 0) { // moving right
            if (playerCell[0] < mazeWidth-1) { // check cell to right
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
            if (playerCell[1] < mazeHeight-1) { // check cell below
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

        checkForVictory();
    }

    // Compares the player's position to the finish cell location
    // and applies winning procedures if they match
    function checkForVictory() {
        if (maze[playerCell[0]][playerCell[1]] !== 2) { // No victory
            return;
        }
        
        document.removeEventListener("keypress", checkUserMovement);
        stopTimer();
        gameFinished = true;
        let deltaTime = Date.now() - startTime - timePaused;

        // Submit the player score
        // const generateTestPlayerId = () => `player_${Math.random().toString(36).substring(2, 11)}`;
        submitPlayerScore(todaysDate, currentUserUid, playerName, deltaTime);

        let solveTime = new Date();
        solveTime.setTime(deltaTime);
        let totalSeconds = Math.floor(deltaTime / 1000);
    
        let h = Math.floor(totalSeconds / 3600);
        let m = solveTime.getMinutes();
        let s = solveTime.getSeconds();
        let ms = solveTime.getMilliseconds();
        adjustTime(h, m, s, ms); // Display the final time

        // console.log(solveTime.toTimeString());
        console.log(`Solve Time: ${h}:${m}:${s}:${ms}`);
    }   

}

} // END generateMaze