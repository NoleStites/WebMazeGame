// TODO: implement a light radius feature using clipping
// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Compositing
//  This will allow the area around the player to be seen but everything else to be blacked out, making it more exciting

import { generatePrimMaze } from './prim.js';

window.addEventListener("load", generateGame);

// Runs all game logic when the page loads
function generateGame() {
    let gameCanvas = document.getElementById("gameCanvas");

    // Check browser compatability with canvas
    let ctx;
    let scale = 2;
    if (gameCanvas.getContext) {
        ctx = gameCanvas.getContext("2d");
        ctx.scale(scale, scale); // Increase the size of each unit in the canvas (zooming in)
    }
    else {
        alert("Your browser does not support this game, sorry!");
    }

    // Generate and display the maze (use odd-numbered dimensions to keep it looking nice)
    let mazeWidth = 11;
    let mazeHeight = 9;
    let cellSize = 20;
    let maze = generatePrimMaze(mazeWidth, mazeHeight);
    let wallOffsetX = 500/2/scale - (1.5*cellSize);
    let wallOffsetY = 500/2/scale - (1.5*cellSize);
    drawMaze();

    // Place player on game canvas
    let playerSize = Math.floor(cellSize/2);
    let playerSpeed = cellSize; // pixels per second
    // -- center player in the top-left corner of the maze
    let playerX = 500/2/scale - Math.floor(playerSize/2);
    let playerY = 500/2/scale - Math.floor(playerSize/2);
    let playerCell = [1, 1]; // Coordinate of the player
    ctx.fillStyle = "navy";
    ctx.fillRect(playerX, playerY, playerSize, playerSize);

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
                break;
            case 'a':
                movePlayer(playerSpeed, 0);
                break;
            case 's':
                movePlayer(0, -playerSpeed);
                break;
            case 'd':
                movePlayer(-playerSpeed, 0);
                break;

        }
    });

    // Given a maze formatted as a 2D list of 0's (passage) and 1's (wall),
    // Displays the maze on the canvas
    function drawMaze() {
        for (let x = 0; x < mazeWidth; x++) {
            for (let y = 0; y < mazeHeight; y++) {
                if (maze[x][y]) { // wall
                    ctx.fillStyle = "black";
                    // ctx.strokeStyle = "rgb(0 0 0 / 50%)";
                } else {
                    ctx.fillStyle = "beige";
                    // ctx.strokeStyle = "rgb(0 255 0 / 50%)";
                }
                ctx.fillRect(x*cellSize+wallOffsetX, y*cellSize+wallOffsetY, cellSize, cellSize);
                // ctx.strokeRect(x*cellSize, y*cellSize, cellSize, cellSize);
            }
        }
    }

    // Moves the player based on the amount in the x and y direction
    // changeX, changeY: number of pixels to move in respective direction
    function movePlayer(changeX, changeY) {
        // Clear the canvas
        ctx.clearRect(0, 0, 500, 500);

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

        // Redraw the maze
        drawMaze();

        // Redraw the player
        ctx.fillStyle = "navy";
        ctx.fillRect(playerX, playerY, playerSize, playerSize);
    }

}