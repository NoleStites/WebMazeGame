// login.js

// Import all necessary Firebase Authentication functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    EmailAuthProvider,
    linkWithCredential,
    signOut,
    updateProfile // For directly updating user display name if desired
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// Import Realtime Database functions for user_profiles
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// --- DOM Elements ---
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const displayNameInput = document.getElementById('displayName');
const displayNameGroup = document.getElementById('display-name-group');
const mainAuthButton = document.getElementById('main-auth-button');
const authStatusMessage = document.getElementById('auth-status-message');
const switchAuthModeLink = document.getElementById('switch-auth-mode');
const signOutButton = document.getElementById('sign-out-button');

// --- State Variables ---
let currentFirebaseUser = null;
let currentAuthMode = 'signup'; // 'signup' or 'signin'

// --- Utility Functions (your previously defined Firebase ops) ---

// Your function to store/update user profile in RTDB
async function saveUserProfileToDatabase(user, displayName) {
    const userProfileRef = ref(database, `user_profiles/${user.uid}`);
    try {
        await set(userProfileRef, {
            email: user.email,
            displayName: displayName,
            lastLogin: Date.now() // Update last login timestamp
        });
        console.log("User profile saved/updated in DB.");
    } catch (error) {
        console.error("Error saving user profile to DB:", error);
    }
}

// Your updated signUpWithEmail function
async function signUpWithEmail(email, password, displayName) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await saveUserProfileToDatabase(user, displayName); // Save profile to DB
        console.log("User signed up successfully:", user.uid);
        alert("Account created successfully!");
        window.location.href = "/index.html"; // Redirect on success
    } catch (error) {
        console.error("Error signing up:", error);
        alert(`Sign up failed: ${error.message}`);
    }
}

// Your signInWithEmail function
async function signInWithEmail(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        // Optionally update lastLogin on sign-in
        await saveUserProfileToDatabase(user, user.displayName); // Pass existing displayName or update if null
        console.log("User signed in successfully:", user.uid);
        alert("Signed in successfully!");
        window.location.href = "/index.html"; // Redirect on success
    } catch (error) {
        console.error("Error signing in:", error);
        alert(`Sign in failed: ${error.message}`);
    }
}

// Your linkAnonymousToEmail function
async function linkAnonymousToEmail(email, password, displayName) { // Added displayName here
    if (!currentFirebaseUser || !currentFirebaseUser.isAnonymous) {
        console.warn("User is not anonymous or not signed in. Cannot link.");
        alert("You must be signed in anonymously to link an account.");
        return;
    }
    try {
        const credential = EmailAuthProvider.credential(email, password);
        const userCredential = await linkWithCredential(currentFirebaseUser, credential);
        const user = userCredential.user;
        await saveUserProfileToDatabase(user, displayName); // Save profile to DB
        console.log("Anonymous account successfully linked:", user.uid);
        alert("Your game progress is now saved to your email account!");
        window.location.href = "/index.html"; // Redirect on success
    } catch (error) {
        console.error("Error linking account:", error);
        if (error.code === 'auth/email-already-in-use') {
            alert("This email is already linked to another account. Please sign in with it or use a different email.");
            // OPTIONAL: If email is in use, you might try to sign in with that email/password
            // and then re-link the current anonymous user to that existing account.
            // This is more complex and handles a specific edge case.
        } else {
            alert(`Account linking failed: ${error.message}`);
        }
    }
}

// Sign out function
async function signOutUser() {
    try {
        await signOut(auth);
        console.log("User signed out.");
        alert("You have been signed out.");
        // After sign-out, immediately try to sign them in anonymously again
        // to maintain a session and allow anonymous play.
        await signInAnonymously(auth);
    } catch (error) {
        console.error("Error signing out:", error);
        alert(`Sign out failed: ${error.message}`);
    }
}


// --- UI Update Logic ---
function updateUIForAuthMode() {
    if (currentAuthMode === 'signup') {
        mainAuthButton.textContent = "Create Account";
        displayNameGroup.style.display = 'block'; // Show display name for sign up
        switchAuthModeLink.textContent = "Already have an account? Sign In";
        authStatusMessage.textContent = currentFirebaseUser && currentFirebaseUser.isAnonymous ?
            "You are playing as a guest. Create an account to save progress!" :
            ""; // Clear message if not anonymous
    } else { // signin mode
        mainAuthButton.textContent = "Sign In";
        displayNameGroup.style.display = 'none'; // Hide display name for sign in
        switchAuthModeLink.textContent = "Don't have an account? Sign Up";
        authStatusMessage.textContent = ""; // No specific message for sign in
    }
    signOutButton.style.display = currentFirebaseUser && !currentFirebaseUser.isAnonymous ? 'block' : 'none'; // Show sign out only if permanently logged in
}

function handleAuthAction() {
    const email = emailInput.value;
    const password = passwordInput.value;
    const displayName = displayNameInput.value;

    if (!email || !password) {
        alert("Please enter email and password.");
        return;
    }

    if (currentAuthMode === 'signup') {
        if (!displayName) {
            alert("Please enter a display name.");
            return;
        }
        if (currentFirebaseUser && currentFirebaseUser.isAnonymous) {
            linkAnonymousToEmail(email, password, displayName);
        } else {
            signUpWithEmail(email, password, displayName);
        }
    } else { // signin
        signInWithEmail(email, password);
    }
}

// --- Event Listeners ---
mainAuthButton.addEventListener('click', handleAuthAction);
signOutButton.addEventListener('click', signOutUser);
switchAuthModeLink.addEventListener('click', () => {
    currentAuthMode = currentAuthMode === 'signup' ? 'signin' : 'signup';
    updateUIForAuthMode();
});

// --- Initial Setup ---
// First, ensure we have an anonymous user if no one is signed in
onAuthStateChanged(auth, async (user) => {
    currentFirebaseUser = user;
    if (!user) {
        // If no user is signed in (e.g., after manual sign out or first visit),
        // sign them in anonymously immediately.
        await signInAnonymously(auth);
        // onAuthStateChanged will fire again with the anonymous user
    }
    updateUIForAuthMode(); // Update UI based on initial auth state
});

