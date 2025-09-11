// === Set up database connection ===
// Import the functions you need from the SDKs you want to use
// Notice we're adding 'getDatabase' from 'firebase-database.js'
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";
import { getDatabase, ref, set, get, query, orderByChild, limitToFirst, onValue } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js"; // <--- Add this import!
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    EmailAuthProvider,
    linkWithCredential
 } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

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

// Get a reference to the Authentication service
export const auth = getAuth(app); // Pass your 'app' instance


/**
 * Saves or updates a user's profile information in the Realtime Database.
 * This is typically called after a user signs up or links an account.
 * @param {import("firebase/auth").User} user - The Firebase User object.
 * @param {string} displayName - The display name provided by the user.
 */
export async function saveUserProfileToDatabase(user, displayName) {
    if (!user || !user.uid) {
        console.error("Attempted to save profile with null or invalid user object.");
        return;
    }
    const userProfileRef = ref(database, `user_profiles/${user.uid}`);
    try {
        await set(userProfileRef, {
            email: user.email || null, // Firebase User object may not always have email (e.g., anonymous before linking)
            displayName: displayName,
            // You can add other default profile fields here if needed
            createdAt: Date.now() // Useful for tracking creation time
        });
        console.log(`User profile for ${user.uid} saved/updated in DB with displayName: ${displayName}`);
    } catch (error) {
        console.error("Error saving user profile to DB:", error);
        throw error; // Re-throw to allow calling functions to handle
    }
}


// export let currentUserUid = null; // Variable to store the current user's UID
// export let currentFirebaseUser = null; // Firebase user object

// Internal variables to hold the current user and UID
let _currentUser = null;
let _currentUid = null;

// onAuthStateChanged listener to keep _currentUser and _currentUid updated

onAuthStateChanged(auth, (user) => {
    _currentUser = user;
    _currentUid = user ? user.uid : null;
    console.log("firebase.js: Auth state updated. Current UID:", _currentUid);
    // If no user is present, attempt anonymous sign-in to keep a session alive
    if (!user) {
        signInAnonymously(auth).catch(error => {
            console.error("Error signing in anonymously:", error);
        });
    }
});

// Export getter functions for the current user and UID
export function getCurrentUser() {
    return _currentUser;
}

export function getCurrentUserUid() {
    return _currentUid;
}


let authCheckCompleted = false; // Flag to ensure we only proceed once




// Function to sign in anonymously (call this when your app starts or user needs to log in)
async function loginAnonymously() {
  try {
    const userCredential = await signInAnonymously(auth);
    // User is automatically handled by onAuthStateChanged listener above
  } catch (error) {
    console.error("Anonymous sign-in failed:", error);
  }
}

// Call this somewhere to kick off the anonymous login process, e.g., when your game loads
// loginAnonymously();

// Now, when you submit a player score, you'll use 'currentUserUid' for the playerId
// submitPlayerScore(dateString, currentUserUid, playerName, timeMs);

async function signUpWithEmail(email, password, displayName) { // Add displayName parameter

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await saveUserProfileToDatabase(user, displayName);

    // Store the display name and other profile info in Realtime Database
    // We'll create a new node for user_profiles
    const userProfileRef = ref(database, `user_profiles/${user.uid}`);
    await set(userProfileRef, {
      email: user.email, // Storing email is optional, but common
      displayName: displayName,
      createdAt: Date.now() // Useful for tracking
      // Add other default profile fields here (e.g., default avatar URL)
    });

    console.log("User signed up successfully:", user.uid, "DisplayName:", displayName);
    alert("Account created successfully!");
    // Optional: If you ALSO want it on the Auth user object (for user.displayName), uncomment this:
    // await updateProfile(user, { displayName: displayName });

  } catch (error) {
    console.error("Error signing up:", error);
    alert(`Sign up failed: ${error.message}`);
  }
}

// Example usage (assuming you have input fields for email, password, and displayName)
// const emailInput = document.getElementById('email-signup').value;
// const passwordInput = document.getElementById('password-signup').value;
// const displayNameInput = document.getElementById('displayname-signup').value;
// signUpWithEmail(emailInput, passwordInput, displayNameInput);

async function linkAnonymousToEmail(email, password, displayName) { // Add displayName parameter
  if (!currentFirebaseUser || !currentFirebaseUser.isAnonymous) {
    console.warn("User is not anonymous or not signed in. Cannot link.");
    alert("You must be signed in anonymously to link an account.");
    return;
  }

  try {
    // 1. Create an Email/Password credential object
    const credential = EmailAuthProvider.credential(email, password);

    // 2. Link the current anonymous user to this new credential
    // All data associated with the anonymous UID will now belong to the new permanent UID
    const userCredential = await linkWithCredential(currentFirebaseUser, credential);
    const user = userCredential.user; // Get the newly linked permanent user object

    await saveUserProfileToDatabase(user, displayName);


    // 3. Store the display name and other profile info in Realtime Database
    // This will either create a new profile or update an existing one if the email
    // was already associated with a permanent account before linking.
    const userProfileRef = ref(database, `user_profiles/${user.uid}`);
    await set(userProfileRef, {
      email: user.email,
      displayName: displayName,
      lastLinked: Date.now() // Optional: Track when it was linked
      // You might also want to copy over any specific anonymous user data from your DB
      // here if you were storing it separately from user_progress.
    });

    // Optional: If you ALSO want to update the displayName directly on the Firebase Auth User profile
    // for use with user.displayName property, uncomment the line below.
    // import { updateProfile } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
    // await updateProfile(user, { displayName: displayName });

    console.log("Anonymous account successfully linked to Email/Password:", user.uid, "DisplayName:", displayName);
    alert("Your game progress is now saved to your email account!");

  } catch (error) {
    console.error("Error linking account:", error);
    // Handle specific errors
    if (error.code === 'auth/credential-already-in-use') {
        alert("This email is already linked to another account. Please use a different email or sign in with it.");
    } else {
        alert(`Account linking failed: ${error.message}`);
    }
  }
}


async function signOutUser() {
  try {
    await auth.signOut();
    console.log("User signed out.");
    alert("You have been signed out.");
    // After signOut, onAuthStateChanged will fire with a null user.
    // You might want to automatically sign them in anonymously again here
    // if your game requires a user to always be signed in.
    loginAnonymously(); // Re-sign them in anonymously if you want
  } catch (error) {
    console.error("Error signing out:", error);
    alert(`Sign out failed: ${error.message}`);
  }
}


// Get a reference to the Realtime Database service
// Use the modular 'getDatabase' function and pass your 'app' instance
export const database = getDatabase(app); // <--- Corrected line!



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
    const mazeRef = ref(database, `daily_leaderboards/${dateString}/config`);
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

// setDailyMazeConfig("2025-9-10", (Math.random()*2**32)>>>0, 15, 15, "prim", true, 0.5, 1, "center", "black", "green", "black", "beige", "navy");



/**
 * Submits a player's score for a specific daily maze.
 * Overwrites existing score if player already submitted for that day.
 * @param {string} dateString - The date in YYYY-MM-DD format.
 * @param {string} playerId - A unique identifier for the player (e.g., Firebase Auth UID).
 * @param {string} playerName - The display name of the player.
 * @param {number} timeMs - The completion time in milliseconds.
 */
export async function submitPlayerScore(dateString, playerId, playerName, timeMs) {
    const scoreRef = ref(database, `daily_leaderboards/${dateString}/scores/${playerId}`);
    try {
        await set(scoreRef, {
            name: playerName,
            time_ms: timeMs
        });
        // console.log(`Score for ${playerName} on ${dateString} submitted successfully!`);
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
    const mazeRef = ref(database, `daily_leaderboards/${dateString}/config`);
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
export function listenForLeaderboard(dateString, limit, callback) {
    const leaderboardRef = ref(database, `daily_leaderboards/${dateString}/scores`);
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
