import { auth, db } from './firebase_cofig.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const googleSignInButton = document.getElementById('google-signin');
const facebookSignInButton = document.getElementById('facebook-signin');

// Redirect user if already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User is logged in, redirecting to dashboard.');
        // Check if we are not already on a dashboard/profile page to avoid redirect loops
        if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
            window.location.href = 'profile.html';
        }
    } else {
        console.log('User is not logged in.');
    }
});


// --- Login with Email and Password ---
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in 
                const user = userCredential.user;
                console.log('User logged in:', user);
                window.location.href = 'profile.html'; // Redirect to profile
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                alert(`Error: ${errorMessage}`);
            });
    });
}

// --- Register with Email and Password ---
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed up 
                const user = userCredential.user;
                // Update profile with display name
                updateProfile(user, {
                    displayName: name
                });
                // Create a document for the user in Firestore
                return setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: name,
                    email: email,
                    createdAt: serverTimestamp(),
                    totalPoints: 0,
                    quizzesCompleted: 0,
                    overallAccuracy: 0
                });
            })
            .then(() => {
                console.log('User created and data saved to Firestore.');
                window.location.href = 'profile.html'; // Redirect after profile update
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                alert(`Error: ${errorMessage}`);
            });
    });
}

// --- Google Sign-In ---
if (googleSignInButton) {
    googleSignInButton.addEventListener('click', () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                const user = result.user;
                const userRef = doc(db, "users", user.uid);
                return getDoc(userRef).then(docSnap => {
                    if (!docSnap.exists()) {
                        // User is new, create a document for them
                        console.log('First time Google sign-in, creating user document.');
                        return setDoc(userRef, {
                            uid: user.uid,
                            // Ensure name is never null. Fallback to creating from email.
                            name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
                            email: user.email || '',
                            createdAt: serverTimestamp(),
                            totalPoints: 0,
                            quizzesCompleted: 0,
                            overallAccuracy: 0
                        });
                    }
                }).then(() => {
                    console.log('Google sign-in successful:', user);
                    window.location.href = 'profile.html';
                });
            }).catch((error) => {
                const errorMessage = error.message;
                alert(`Google Sign-In Error: ${errorMessage}`);
            });
    });
}

// --- Facebook Sign-In ---
if (facebookSignInButton) {
    facebookSignInButton.addEventListener('click', () => {
        const provider = new FacebookAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                const user = result.user;
                const userRef = doc(db, "users", user.uid);
                return getDoc(userRef).then(docSnap => {
                    if (!docSnap.exists()) {
                        // User is new, create a document for them
                        console.log('First time Facebook sign-in, creating user document.');
                        return setDoc(userRef, {
                            uid: user.uid,
                            // Ensure name is never null. Fallback to creating from email.
                            name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
                            email: user.email || '',
                            createdAt: serverTimestamp(),
                            totalPoints: 0,
                            quizzesCompleted: 0,
                            overallAccuracy: 0
                        });
                    }
                }).then(() => {
                    console.log('Facebook sign-in successful:', user);
                    window.location.href = 'profile.html';
                });
            })
            .catch((error) => {
                // Handle common errors
                if (error.code === 'auth/account-exists-with-different-credential') {
                    alert('An account already exists with the same email address. Please sign in with the original method.');
                } else {
                    const errorMessage = error.message;
                    alert(`Facebook Sign-In Error: ${errorMessage}`);
                }
            });
    });
}