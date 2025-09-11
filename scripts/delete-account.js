// delete-account.js

// Import necessary Firebase Auth functions
// Ensure 'auth' is imported from your centralized firebase.js file
import { auth } from './firebase.js'; // Adjust path as needed
import {
    reauthenticateWithCredential,
    EmailAuthProvider,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

// DOM Elements
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const deleteButton = document.getElementById('delete-button');
const messageDiv = document.getElementById('message');

let currentLoggedInUser = null; // To store the user object
// NEW: A flag to indicate we are in the process of deleting
let isAccountDeletionInProgress = false;


// --- Initial Auth Check (Crucial for Page Access) ---
onAuthStateChanged(auth, (user) => {
    currentLoggedInUser = user; // Always update the user reference

    // ONLY apply the gatekeeper logic if we are NOT actively deleting the account
    if (!isAccountDeletionInProgress) {
        if (user && !user.isAnonymous) {
            // User is logged in and not anonymous. Continue.
            if (user.email) {
                emailInput.value = user.email;
            }
            console.log("User is logged in:", user.uid);
        } else {
            // User is not logged in or is anonymous. Redirect them immediately.
            console.warn("No permanent user logged in. Redirecting to login page.");
            window.location.href = '/pages/login.html'; // Adjust to your login page path
        }
    }
    // If isAccountDeletionInProgress is true, we let the delete process handle the redirect.
});


// --- Helper to display messages ---
function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = ''; // Clear existing classes
    messageDiv.classList.add(type); // Add success or error class
    messageDiv.style.display = 'block';
}

// --- Delete Account Logic ---
deleteButton.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if (!email || !password) {
        showMessage('Please enter both email and password.', 'error');
        return;
    }

    if (!currentLoggedInUser) {
        showMessage('No user is currently logged in. Please log in first.', 'error');
        return;
    }

    // Clear previous messages
    messageDiv.style.display = 'none';

    try {
        const credential = EmailAuthProvider.credential(email, password);

        // Before attempting deletion, set the flag.
        // This tells the onAuthStateChanged listener to stand down.
        isAccountDeletionInProgress = true;

        // Re-authenticate the current user with these credentials
        await reauthenticateWithCredential(currentLoggedInUser, credential);
        console.log("User successfully re-authenticated.");

        // Now, delete the user's account
        await currentLoggedInUser.delete();
        console.log("User account deleted successfully.");
        // We can show a success message briefly, but the redirect will happen immediately.
        showMessage('Your account has been permanently deleted.', 'success');


        // *** CRITICAL CHANGE: Redirect IMMEDIATELY to the goodbye page. ***
        // No setTimeout needed here, as the onAuthStateChanged listener will now ignore
        // the sign-out event because of our flag.
        window.location.href = '/pages/goodbye.html';

    } catch (error) {
        // If an error occurs, reset the flag so the auth listener can take over again.
        isAccountDeletionInProgress = false;

        console.error("Error deleting account:", error);
        let errorMessage = 'An unexpected error occurred.';

        switch (error.code) {
            case 'auth/requires-recent-login':
                errorMessage = 'Your session has expired. Please log in again to delete your account.';
                // After this error, redirect to login page immediately to force re-auth
                setTimeout(() => { window.location.href = '/pages/login.html'; }, 1000);
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/user-mismatch':
                errorMessage = 'The email and password do not match the current logged-in user.';
                break;
            default:
                errorMessage = `Error: ${error.message}`;
                break;
        }
        showMessage(errorMessage, 'error');
    }
});
