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
            window.location.href = 'index.html';
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
                window.location.href = 'index.html'; // Redirect to profile
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
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            // 1. Create the user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Update the user's profile with their name
            await updateProfile(user, { displayName: name });

            // 3. Create the user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                createdAt: serverTimestamp(),
                totalPoints: 0,
                quizzesCompleted: 0,
                    overallAccuracy: 0,
                    subjectLevels: {
                        Physics: 'Easy',
                        Chemistry: 'Easy',
                        Mathematics: 'Easy',
                        History: 'Easy'
                    }
            });

            console.log('User created and data saved to Firestore.');
            window.location.href = 'index.html'; // Redirect after all operations are successful
        } catch (error) {
            const errorMessage = error.message;
            alert(`Registration Error: ${errorMessage}`);
        }
    });
}

// --- Google Sign-In ---
if (googleSignInButton) {
    googleSignInButton.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);

            if (!docSnap.exists()) {
                console.log('First time Google sign-in, creating user document.');
                await setDoc(userRef, {
                    uid: user.uid,
                    name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
                    email: user.email || '',
                    createdAt: serverTimestamp(),
                    totalPoints: 0,
                    quizzesCompleted: 0,
                    overallAccuracy: 0,
                    subjectLevels: {
                        Physics: 'Easy',
                        Chemistry: 'Easy',
                        Mathematics: 'Easy',
                        History: 'Easy'
                    }
                });
            }
            console.log('Google sign-in successful:', user);
            window.location.href = 'index.html';
        } catch (error) {
            const errorMessage = error.message;
            alert(`Google Sign-In Error: ${errorMessage}`);
        }
    });
}

// --- Facebook Sign-In ---
if (facebookSignInButton) {
    facebookSignInButton.addEventListener('click', async () => {
        const provider = new FacebookAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const userRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(userRef);

            if (!docSnap.exists()) {
                console.log('First time Facebook sign-in, creating user document.');
                await setDoc(userRef, {
                    uid: user.uid,
                    name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
                    email: user.email || '',
                    createdAt: serverTimestamp(),
                    totalPoints: 0,
                    quizzesCompleted: 0,
                    overallAccuracy: 0,
                    subjectLevels: {
                        Physics: 'Easy',
                        Chemistry: 'Easy',
                        Mathematics: 'Easy',
                        History: 'Easy'
                    }
                });
            }
            console.log('Facebook sign-in successful:', user);
            window.location.href = 'index.html';
        } catch (error) {
            if (error.code === 'auth/account-exists-with-different-credential') {
                alert('An account already exists with the same email address. Please sign in with the original method.');
            } else {
                const errorMessage = error.message;
                alert(`Facebook Sign-In Error: ${errorMessage}`);
            }
        }
    });
}