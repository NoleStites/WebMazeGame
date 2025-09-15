import { splitmix32 } from "./splitMix32.js";

// Uses Prim's iterative randomized algorithm for maze generation
// Returns a 2D array indexed as maze[x][y]:
//  - outer array length === width
//  - inner array length === height
// 1: wall, 0: passage, 2: finish cell
// startPosition: "center" or "topLeft"
export function generatePrimMaze(seed, width, height, startPosition) {
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


    // Our random number generator
    const prng = splitmix32(seed);

    // Pick odd coordinates inside the border
    const randOdd = (max) => {
        const count = Math.floor((max - 1) / 2); // number of odd slots inside border
        const idx = Math.floor(prng() * count); // 0..count-1
        return idx * 2 + 1; // 1,3,5,...
    };

    let startX, startY;
    // startX = randOdd(width);
    // startY = randOdd(height);
    if (startPosition == "topLeft") {
        startX = randOdd(width);
        startY = randOdd(height);
    } 
    else if (startPosition == "center") {
        startX = Math.floor(width/2);
        startY = Math.floor(height/2);
    } 
    else { // Default top-left
        startX = randOdd(width);
        startY = randOdd(height); 
    }
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
        const i = Math.floor(prng() * walls.length);
        const [wx, wy, fx, fy] = walls[i];
        walls.splice(i, 1);

        if (maze[wx][wy] === 1) {
        maze[wx][wy] = 0;                              // carve new cell
        maze[(wx + fx) >> 1][(wy + fy) >> 1] = 0;      // carve wall between
        addWalls(wx, wy);
        }
    }

    // Determine the farthest cell from the starting point (will become finish cell)
    function findFarthestCell(maze, startX, startY) {
        const width = maze.length, height = maze[0].length;
        const visited = Array.from({ length: width }, () => Array(height).fill(false));
        let queue = [[startX, startY, 0]];
        visited[startX][startY] = true;

        let farthest = [startX, startY, 0];
        const directions = [[1,0],[-1,0],[0,1],[0,-1]];

        while (queue.length) {
            const [x, y, dist] = queue.shift();
            if (dist > farthest[2]) farthest = [x, y, dist];
            for (const [dx, dy] of directions) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && ny >= 0 && nx < width && ny < height &&
                    !visited[nx][ny] && maze[nx][ny] === 0) {
                    visited[nx][ny] = true;
                    queue.push([nx, ny, dist + 1]);
                }
            }
        }
        return [farthest[0], farthest[1]];
    }

    // Determine finish cell
    const [fx, fy] = findFarthestCell(maze, startX, startY); // Finish cell coordinates
    maze[fx][fy] = 2;

    return maze; // maze[x][y]; e.g., maze[12][8] exists for width=13, height=9
}
