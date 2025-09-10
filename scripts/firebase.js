// === Set up database connection ===
// Import the functions you need from the SDKs you want to use
// Notice we're adding 'getDatabase' from 'firebase-database.js'
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
import { getDatabase, ref, set, get, query, orderByChild, limitToFirst, onValue } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js"; // <--- Add this import!

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDlFg-BX_s3evEGRodQ2RvEUzjjaMEATm4",
    authDomain: "onlinemazegame.firebaseapp.com",
    databaseURL: "https://onlinemazegame-default-rtdb.firebaseio.com",
    projectId: "onlinemazegame",
    storageBucket: "onlinemazegame.firebasestorage.app",
    messagingSenderId: "208421916495",
    appId: "1:208421916495:web:c5c6669d52e4f81f337f3a",
    measurementId: "G-EYZ2BYQDTQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Get a reference to the Realtime Database service
// Use the modular 'getDatabase' function and pass your 'app' instance
const database = getDatabase(app); // <--- Corrected line!



/**
 * Writes the daily maze configuration (seed, width, height) to the database.
 * This should ideally be done by an admin or an automated process.
 * @param {string} dateString - The date in YYYY-MM-DD format (e.g., "2023-10-28").
 * @param {number} seed - The 32-bit seed for the maze.
 * @param {number} width - The width of the maze.
 * @param {number} height - The height of the maze.
 * @param {number} mazeAlgorithm - The type of maze generation algorithm to use: "prim"
 * @param {number} playZoom - Determines whether to play the zoom animation at the start
 * @param {number} zoomStartScale - The scale level to define the start of the animation (how zoomed out it is)
 * @param {number} zoomEndScale - Adjust this to change the play zoom level (high => zoom in; smaller => zoom out)
 * @param {number} startPosition - Where the player starts in the maze: "center" or "topLeft"
 * @param {number} canvasColor - The color of the canvas itself (the area around the maze)
 * @param {number} finishCellColor - The color of the cell marking the end of the maze
 * @param {number} wallColor - The color of the walls of the maze
 * @param {number} floorColor - The color of the passages within the maze
 * @param {number} playerColor - The color of the player
 */
async function setDailyMazeConfig(dateString, seed, width, height, mazeAlgorithm, playZoom, zoomStartScale, zoomEndScale, startPosition, canvasColor, finishCellColor, wallColor, floorColor, playerColor) {
    const mazeRef = ref(database, `daily_leaderboards/${dateString}`);
    try {
        await set(mazeRef, {
            seed: seed,
            width: width,
            height: height,
            mazeAlgorithm: mazeAlgorithm,
            playZoom: playZoom,
            zoomStartScale: zoomStartScale,
            zoomEndScale: zoomEndScale,
            startPosition: startPosition,
            canvasColor: canvasColor,
            finishCellColor: finishCellColor,
            wallColor: wallColor,
            floorColor: floorColor,
            playerColor: playerColor
        });
        console.log(`Daily maze config for ${dateString} set successfully!`);
    } catch (error) {
        console.error("Error setting daily maze config:", error);
    }
}

// Example usage (you might call this from an admin panel or a Cloud Function)
// You can run this once to populate some data for testing
// setDailyMazeConfig("2023-10-28", 123456789, 15, 15);
// setDailyMazeConfig("2023-10-27", 987654321, 10, 10); // Add some historical data too!

// setDailyMazeConfig("2025-9-9", (Math.random()*2**32)>>>0, 15, 15, "prim", true, 0.5, 1, "center", "black", "green", "black", "beige", "navy");



/**
 * Submits a player's score for a specific daily maze.
 * Overwrites existing score if player already submitted for that day.
 * @param {string} dateString - The date in YYYY-MM-DD format.
 * @param {string} playerId - A unique identifier for the player (e.g., Firebase Auth UID).
 * @param {string} playerName - The display name of the player.
 * @param {number} timeMs - The completion time in milliseconds.
 */
export async function submitPlayerScore(dateString, playerId, playerName, timeMs) {
    const scoreRef = ref(database, `daily_leaderboards/${dateString}/${playerId}`);
    try {
        await set(scoreRef, {
            name: playerName,
            time_ms: timeMs
        });
        console.log(`Score for ${playerName} on ${dateString} submitted successfully!`);
    } catch (error) {
        console.error("Error submitting player score:", error);
    }
}

// Example usage (simulate a couple of players)
// For testing without auth, you can generate simple IDs:
const generateTestPlayerId = () => `player_${Math.random().toString(36).substring(2, 11)}`;

// submitPlayerScore("2023-10-28", generateTestPlayerId(), "SpeedyGonzales", 65000);
// submitPlayerScore("2023-10-28", generateTestPlayerId(), "MazeRunner", 72000);
// submitPlayerScore("2023-10-28", generateTestPlayerId(), "QuickFeet", 68000);
// submitPlayerScore("2023-10-28", generateTestPlayerId(), "SmartyPants", 80000);

// Simulate a player improving their score (same player ID)
const existingPlayerId = "player_abc123"; // Or whatever ID you're using for a consistent player
// submitPlayerScore("2023-10-28", existingPlayerId, "MySelf", 75000); // First submission
// submitPlayerScore("2023-10-28", existingPlayerId, "MySelf", 60000); // Improved score



/**
 * Reads the daily maze configuration (seed, width, height, and all other properties) for a given date.
 * @param {string} dateString - The date in YYYY-MM-DD format.
 * @returns {Promise<object | null>} - A promise that resolves with the maze config object or null if not found.
 *                                     The returned object will contain:
 *                                     {
 *                                       seed: number,
 *                                       width: number,
 *                                       height: number,
 *                                       mazeAlgorithm: string,
 *                                       playZoom: boolean,
 *                                       zoomStartScale: number,
 *                                       zoomEndScale: number,
 *                                       startPosition: string,
 *                                       canvasColor: string,
 *                                       finishCellColor: string,
 *                                       wallColor: string,
 *                                       floorColor: string,
 *                                       playerColor: string
 *                                     }
 */
export async function getDailyMazeConfig(dateString) {
    const mazeRef = ref(database, `daily_leaderboards/${dateString}`);
    try {
        const snapshot = await get(mazeRef);
        if (snapshot.exists()) {
            const data = snapshot.val();

            // Extract all maze configuration properties.
            // We assume any property that is NOT 'name' or 'time_ms' (which are player-specific)
            // is part of the maze configuration. Or, more precisely, we explicitly list them.
            return {
                seed: data.seed,
                width: data.width,
                height: data.height,
                mazeAlgorithm: data.mazeAlgorithm,
                playZoom: data.playZoom,
                zoomStartScale: data.zoomStartScale,
                zoomEndScale: data.zoomEndScale,
                startPosition: data.startPosition,
                canvasColor: data.canvasColor,
                finishCellColor: data.finishCellColor,
                wallColor: data.wallColor,
                floorColor: data.floorColor,
                playerColor: data.playerColor
                // If you add more config options in the future, remember to add them here!
            };
        } else {
            console.log(`No maze config found for ${dateString}.`);
            return null;
        }
    } catch (error) {
        console.error("Error getting daily maze config:", error);
        return null;
    }
}


// Example usage
// getDailyMazeConfig("2023-10-28").then(config => {
//     if (config) {
//         console.log("Today's Maze Config:", config);
//         // Now you can use config.seed, config.width, config.height to generate the maze!
//     }
// });
// getDailyMazeConfig("2023-10-29").then(config => { // A date that doesn't exist yet
//     if (!config) {
//         console.log("No config for 2023-10-29 as expected.");
//     }
// });



/**
 * Sets up a real-time listener for the daily leaderboard and fetches top scores.
 * @param {string} dateString - The date in YYYY-MM-DD format.
 * @param {number} limit - The number of top scores to retrieve (e.g., 10 for top 10).
 * @param {function(Array)} callback - A callback function that receives the sorted leaderboard array.
 * @returns {function()} - A function to unsubscribe the listener.
 */
function listenForLeaderboard(dateString, limit, callback) {
    const leaderboardRef = ref(database, `daily_leaderboards/${dateString}`);
    const topScoresQuery = query(
        leaderboardRef,
        orderByChild('time_ms'), // Sort by the 'time_ms' property
        limitToFirst(limit)       // Get only the fastest 'limit' entries
    );

    const unsubscribe = onValue(topScoresQuery, (snapshot) => {
        const scores = [];
        snapshot.forEach((childSnapshot) => {
            const playerId = childSnapshot.key;
            const data = childSnapshot.val();
            // Exclude seed, width, height if they exist at the same level
            if (data.name && data.time_ms !== undefined) {
                scores.push({
                    playerId: playerId,
                    name: data.name,
                    time_ms: data.time_ms
                });
            }
        });
        // Realtime Database orders numerically, so it's already sorted fastest to slowest
        callback(scores);
    }, (error) => {
        console.error("Error listening for leaderboard:", error);
    });

    return unsubscribe; // Return the unsubscribe function
}

// Example usage
// const today = "2023-10-28";
// console.log(`Listening for top 5 scores on ${today}...`);
// const unsubscribeLeaderboard = listenForLeaderboard(today, 5, (leaderboard) => {
//     console.log(`--- Leaderboard for ${today} (Top 5) ---`);
//     if (leaderboard.length === 0) {
//         console.log("No scores yet.");
//     } else {
//         leaderboard.forEach((entry, index) => {
//             console.log(`${index + 1}. ${entry.name} (${entry.time_ms / 1000}s)`);
//         });
//     }
//     console.log("---------------------------------------");
// });

// To stop listening later (e.g., when the user leaves the page):
// unsubscribeLeaderboard();
