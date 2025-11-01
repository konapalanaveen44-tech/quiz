import { auth, db } from './firebase_cofig.js';
import { onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// --- DOM Elements ---
const form = document.getElementById('edit-profile-form');
const nameInput = document.getElementById('edit-name');
const emailInput = document.getElementById('edit-email');
const photoUrlInput = document.getElementById('edit-photo-url');
const avatarPreview = document.getElementById('avatar-preview');
const successMessage = document.getElementById('success-message');
const logoutButton = document.getElementById('logout-button');

const defaultAvatar = 'https://lh3.googleusercontent.com/a/ACg8ocJ-0_v4s-Co32-QdI-fM2Tsf1iT2x-32l2wO9Ml7dM=s96-c';

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const photoURL = userData.photoURL || user.photoURL || defaultAvatar;

            // Populate the form with existing data
            nameInput.value = userData.name || user.displayName || '';
            emailInput.value = userData.email || user.email || '';
            photoUrlInput.value = photoURL;
            avatarPreview.style.backgroundImage = `url('${photoURL}')`;
        } else {
            console.error("User document not found in Firestore.");
            // Fallback to auth data if firestore doc is missing
            nameInput.value = user.displayName || '';
            emailInput.value = user.email || '';
            photoUrlInput.value = user.photoURL || defaultAvatar;
            avatarPreview.style.backgroundImage = `url('${user.photoURL || defaultAvatar}')`;
        }
    } else {
        window.location.href = 'index.html';
    }
});

// Update avatar preview as user types
photoUrlInput.addEventListener('input', () => {
    const newUrl = photoUrlInput.value.trim();
    avatarPreview.style.backgroundImage = `url('${newUrl || defaultAvatar}')`;
});

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const newName = nameInput.value.trim();
    const newPhotoURL = photoUrlInput.value.trim();

    try {
        const userDocRef = doc(db, "users", currentUser.uid);

        // Update both Firebase Auth profile and Firestore document
        await Promise.all([
            updateProfile(currentUser, { displayName: newName, photoURL: newPhotoURL }),
            updateDoc(userDocRef, { name: newName, photoURL: newPhotoURL })
        ]);

        successMessage.classList.remove('hidden');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500); // Redirect back to profile after 1.5 seconds

    } catch (error) {
        console.error("Error updating profile:", error);
        alert(`Error: ${error.message}`);
    }
});

if (logoutButton) logoutButton.addEventListener('click', () => signOut(auth).then(() => window.location.href = 'index.html'));