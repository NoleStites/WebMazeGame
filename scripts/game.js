// TODO (unordered)
// - Timer starts when game is in focus and stops when out of focus
//      - Dont allow focus until the zoom animation is complete
// - Start the player in the center of the maze
//      - In the Prim algorithm, instead of choosing a random tile to start, choose center
//      - Adjust wall offsets accordingly
// - Determine coordinate of maze end
//      - Render the end tile after the zoom animation is complete

import { generatePrimMaze } from './prim.js';

// window.addEventListener("load", generateGame);
let gameButton = document.getElementById("beginGameButton")
gameButton.addEventListener('click', function() {
    // Deactivate button
    gameButton.disabled = true;

    // Start the game
    generateGame();
});

// Runs all game logic when the page loads
function generateGame() {
    let gameStartZoom = false; // determines whether to play the zoom animation at that start
    let gameCanvas = document.getElementById("gameCanvas");
    let canvasWidth = gameCanvas.width;
    let canvasHeight = gameCanvas.height;

    // Styles
    let backgroundColor = "black";
    let wallColor = "black";
    let floorColor = "beige";
    let playerColor = "navy";

    // Check browser compatability with canvas
    let ctx;

    let animationStartScale = 0.5; // The scale level to define the start of thr animation (how zoomed out it is)
    let animationEndScale = 1; // Adjust this to change the play zoom level (high => zoom in; smaller => zoom out)
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

    // Generate and display the maze (use odd-numbered dimensions to keep it looking nice)
    let mazeWidth = 19;
    let mazeHeight = 17;
    let cellSize = 20;

    // NOTE: any maze-generation algorithm is expected to return a 
    // 2D array [width][height] of 0s (floor) and 1s (walls)
    let maze = generatePrimMaze(mazeWidth, mazeHeight);

    let wallOffsetX = canvasWidth/2/scale - (1.5*cellSize);
    let wallOffsetY = canvasHeight/2/scale - (1.5*cellSize);

    // Place player on game canvas
    let playerSize = Math.floor(cellSize/2);
    let playerSpeed = cellSize; // pixels per second
    // -- center player in the top-left corner of the maze
    let playerX = canvasWidth/2/scale - Math.floor(playerSize/2);
    let playerY = canvasHeight/2/scale - Math.floor(playerSize/2);
    let playerCell = [1, 1]; // Coordinate of the player
    ctx.fillStyle = playerColor;
    ctx.fillRect(playerX, playerY, playerSize, playerSize);

    drawGame();

    // Rescale zoom
    function zoomIn() {
        const intervalId = setInterval(function() {
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset the scale before changing it (or else it scales the scale)

            scale = parseFloat(scale.toFixed(2));
            ctx.scale(scale, scale); // Increase the size of each unit in the canvas (zooming in)

            wallOffsetX = canvasWidth/2/scale - (1.5*cellSize);
            wallOffsetY = canvasHeight/2/scale - (1.5*cellSize);
            playerX = canvasWidth/2/scale - Math.floor(playerSize/2);
            playerY = canvasHeight/2/scale - Math.floor(playerSize/2);
            ctx.fillStyle = playerColor;
            ctx.fillRect(playerX, playerY, playerSize, playerSize);

            drawGame();

            scale += 0.1;
            if (scale >= animationEndScale) {
                clearInterval(intervalId); // Stop the interval after 3 ticks
                allowMovement();
            }
        }, 25);
    }

    function allowMovement() {
        // Game loop
        document.addEventListener("keypress", function(e) {
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
        });
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

    if (gameStartZoom) {
        pauseBeforeAnimation(zoomIn);
    } else {
        allowMovement();
    }

    function drawGame() {
        // Clear the canvas
        ctx.clearRect(0, 0, canvasWidth/scale, canvasHeight/scale);

        // Fill in the background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvasWidth/scale, canvasHeight/scale);

        // Create a circular clipping path
        // ctx.beginPath();
        // ctx.arc(canvasWidth/2/scale, canvasHeight/2/scale, 20, 0, Math.PI * 2, true);
        // ctx.clip();

        // Draw the maze
        for (let x = 0; x < mazeWidth; x++) {
            for (let y = 0; y < mazeHeight; y++) {
                if (maze[x][y]) { // wall
                    ctx.fillStyle = wallColor;
                } else {
                    ctx.fillStyle = floorColor;
                }
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
                if (maze[playerCell[0]+1][playerCell[1]] === 0) {
                    wallOffsetX += changeX;
                    playerCell[0] += 1;
                }
            }
        }
        if (changeX > 0) { // moving left
            if (playerCell[0] > 0) { // check cell to right
                if (maze[playerCell[0]-1][playerCell[1]] === 0) {
                    wallOffsetX += changeX;
                    playerCell[0] -= 1;
                }
            }
        }
        if (changeY < 0) { // moving down
            if (playerCell[1] < mazeHeight-1) { // check cell below
                if (maze[playerCell[0]][playerCell[1]+1] === 0) {
                    wallOffsetY += changeY;
                    playerCell[1] += 1;
                }
            }
        }
        if (changeY > 0) { // moving up
            if (playerCell[1] > 0) { // check cell above
                if (maze[playerCell[0]][playerCell[1]-1] === 0) {
                    wallOffsetY += changeY;
                    playerCell[1] -= 1;
                }
            }
        }
    }

}