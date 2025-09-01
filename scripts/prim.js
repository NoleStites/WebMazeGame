
// // Returns a random integer between 0 (inclusive) and maximum (exclusive)
// function randomInt(maximum) {
//     return Math.floor(Math.random() * maximum);
// }

// // Uses Prim's iterative randomized algorithm for maze generation
// // Given the size of a maze in cell units (including walls), this
// // function will return a 2D array (width x height) representing cells
// // 1: the cell is a wall
// // 0: the cell is a passage
// export function generatePrimMaze(width, height) {
//     // Step 1: Initialize maze to be all walls
//     let maze = [];
//     for (let x = 0; x < width; x++) {
//         let column = [];
//         for (let y = 0; y < height; y++) {
//             column.push(1); // 1 = wall; 0 = passage
//         }
//         maze.push(column);
//     }

//     // Step 2: Pick a cell, mark it as part of the maze. Add the walls of the cell to the wall list
//     let randX = randomInt(width);
//     let randY = randomInt(height);
//     maze[randX][randY] = 0; // mark as part of the maze (passage)

//     let walls = []; // List of coordinates (also lists [x,y])

//     // Determine walls
//     if (randX > 0) {
//         walls.push([randX-1, randY]); // left wall
//     }
//     if (randX < width-1) {
//         walls.push([randX+1, randY]); // right wall
//     }
//     if (randY > 0) {
//         walls.push([randX, randY-1]); // top wall
//     }
//     if (randY < height-1) {
//         walls.push([randX, randY+1]); // bottom wall
//     }

//     // Step 3: While there are walls in the list
//     while (walls.length > 0)
//     {
//         // Pick a random wall from the list
//         let wallIndex = randomInt(walls.length);

//         // // Get surrounding (4-adjacent) cells
//         // let surrounding = [];
//         // let x = walls[wallIndex][0];
//         // let y = walls[wallIndex][1]
//         // if (x > 0) {
//         //     surrounding.push([x-1, y]); // left wall
//         // }
//         // if (x < width-1) {
//         //     surrounding.push([x+1, y]); // right wall
//         // }
//         // if (y > 0) {
//         //     surrounding.push([x, y-1]); // top wall
//         // }
//         // if (y < height-1) {
//         //     surrounding.push([x, y+1]); // bottom wall
//         // }

//         // Get surrounding (8-adjacent) cells
//         let surrounding = [];
//         let x = walls[wallIndex][0];
//         let y = walls[wallIndex][1]
//         if (x > 0) {
//             surrounding.push([x-1, y]); // left wall
//             if (y > 0) {
//                 surrounding.push([x-1, y-1]); // top-left wall
//             }
//             if (y < height-1) {
//                 surrounding.push([x-1, y+1]); // bottom-left wall
//             }
//         }
//         if (x < width-1) {
//             surrounding.push([x+1, y]); // right wall
//             if (y > 0) {
//                 surrounding.push([x+1, y-1]); // top-left wall
//             }
//             if (y < height-1) {
//                 surrounding.push([x+1, y+1]); // bottom-left wall
//             }
//         }
//         if (y > 0) {
//             surrounding.push([x, y-1]); // top wall
//         }
//         if (y < height-1) {
//             surrounding.push([x, y+1]); // bottom wall
//         }
        
//         // Determine number of surrounding visited cells
//         let numSurrounding = 0;
//         for (let i = 0; i < surrounding.length; i++) {
//             numSurrounding += maze[surrounding[i][0]][surrounding[i][1]]; // 0 or 1 of cell
//         }

//         // If only one of the cells that the wall divides is visited
//         if (numSurrounding === surrounding.length-1) {
//             maze[x][y] = 0; // Mark wall as visited
//             for (let i = 0; i < surrounding.length; i++) { // Add surrounding walls to wall list
//                 if (surrounding[i][0] === x || surrounding[i][1] === y) {
//                     if (maze[surrounding[i][0]][surrounding[i][1]] === 1) {
//                         walls.push(surrounding[i]);
//                     }
//                 }
//             }
//         }

//         // Remove current wall from list
//         walls.splice(wallIndex, 1);
//     }

//     return maze;
// }

// Uses Prim's iterative randomized algorithm for maze generation
// Returns a 2D array indexed as maze[x][y]:
//  - outer array length === width
//  - inner array length === height
// 1: wall, 0: passage
export function generatePrimMaze(width, height) {
    // Make sure dimensions are odd so passages can be surrounded by walls
    if (width % 2 === 0) width++;
    if (height % 2 === 0) height++;

    // Edge guard: too small -> just walls
    if (width < 3 || height < 3) {
        return Array.from({ length: width }, () => Array(height).fill(1));
    }

    // Column-major: maze[x][y]
    const maze = Array.from({ length: width }, () => Array(height).fill(1));

    const inBounds = (x, y) =>
        x > 0 && y > 0 && x < width - 1 && y < height - 1;

    // Pick odd coordinates inside the border
    const randOdd = (max) => {
        const count = Math.floor((max - 1) / 2); // number of odd slots inside border
        const idx = Math.floor(Math.random() * count); // 0..count-1
        return idx * 2 + 1; // 1,3,5,...
    };

    const startX = randOdd(width);
    const startY = randOdd(height);
    maze[startX][startY] = 0;

    // Each wall entry: [nx, ny, fromX, fromY]
    const walls = [];

    const addWalls = (x, y) => {
        const dirs = [
        [ 2,  0],
        [-2,  0],
        [ 0,  2],
        [ 0, -2],
        ];
        for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (inBounds(nx, ny) && maze[nx][ny] === 1) {
            walls.push([nx, ny, x, y]);
        }
        }
    };

    addWalls(startX, startY);

    while (walls.length) {
        const i = Math.floor(Math.random() * walls.length);
        const [wx, wy, fx, fy] = walls[i];
        walls.splice(i, 1);

        if (maze[wx][wy] === 1) {
        maze[wx][wy] = 0;                              // carve new cell
        maze[(wx + fx) >> 1][(wy + fy) >> 1] = 0;      // carve wall between
        addWalls(wx, wy);
        }
    }

    return maze; // maze[x][y]; e.g., maze[12][8] exists for width=13, height=9
}
