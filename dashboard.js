import { auth, db } from './firebase_cofig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// --- DOM Elements ---
const welcomeMessage = document.getElementById('welcome-message');
const userNameSidebar = document.getElementById('user-name-sidebar');
const userAvatarSidebar = document.getElementById('user-avatar-sidebar');
const userLevelSidebar = document.getElementById('user-level-sidebar');
const logoutButton = document.getElementById('logout-button');

// Stats
const totalPoints = document.getElementById('total-points');
const overallAccuracy = document.getElementById('overall-accuracy');
const quizzesCompleted = document.getElementById('quizzes-completed');

// Subject-specific elements
const physicsStats = document.getElementById('physics-stats');
const physicsProgress = document.getElementById('physics-progress');
const physicsProgressText = document.getElementById('physics-progress-text');

const chemistryStats = document.getElementById('chemistry-stats');
const chemistryProgress = document.getElementById('chemistry-progress');
const chemistryProgressText = document.getElementById('chemistry-progress-text');

const mathStats = document.getElementById('math-stats');
const mathProgress = document.getElementById('math-progress');
const mathProgressText = document.getElementById('math-progress-text');

const historyStats = document.getElementById('history-stats');
const historyProgress = document.getElementById('history-progress');
const historyProgressText = document.getElementById('history-progress-text');


// Default values
const defaultAvatar = 'https://lh3.googleusercontent.com/a/ACg8ocJ-0_v4s-Co32-QdI-fM2Tsf1iT2x-32l2wO9Ml7dM=s96-c'; // A generic avatar

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        console.log('User is logged in:', user);

        const displayName = user.displayName || 'User';
        const photoURL = user.photoURL || defaultAvatar;

        // Update Welcome Message
        if (welcomeMessage) welcomeMessage.textContent = `Hello, ${displayName}!`;

        // Update Sidebar
        if (userNameSidebar) userNameSidebar.textContent = displayName;
        if (userAvatarSidebar) userAvatarSidebar.style.backgroundImage = `url('${photoURL}')`;

        // Fetch user's aggregated stats from their document
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const userTotalPoints = userData.totalPoints || 0;

            if (quizzesCompleted) quizzesCompleted.textContent = userData.quizzesCompleted || 0;
            if (totalPoints) totalPoints.textContent = userTotalPoints;
            if (overallAccuracy) overallAccuracy.textContent = `${(userData.overallAccuracy || 0).toFixed(0)}%`;

            // --- Level Calculation ---
            let level = 0;
            if (userTotalPoints > 1000) level = 5;
            else if (userTotalPoints > 500) level = 4;
            else if (userTotalPoints > 250) level = 3;
            else if (userTotalPoints > 100) level = 2;
            else if (userTotalPoints > 0) level = 1;

            if (userLevelSidebar) {
                userLevelSidebar.textContent = `Level ${level}`;
            }
        }

        // Fetch all quiz results for the user to calculate subject-specific stats
        const resultsQuery = query(collection(db, "quiz_results"), where("userId", "==", user.uid));
        const resultsSnapshot = await getDocs(resultsQuery);

        let physicsQuizCount = 0;
        let physicsTotalAccuracy = 0;
        let chemistryQuizCount = 0;
        let chemistryTotalAccuracy = 0;
        let mathQuizCount = 0;
        let mathTotalAccuracy = 0;
        let historyQuizCount = 0;
        let historyTotalAccuracy = 0;

        resultsSnapshot.forEach((doc) => {
            const result = doc.data();

            if (result.subject === 'Physics') {
                physicsQuizCount++;
                physicsTotalAccuracy += result.accuracy;
            } else if (result.subject === 'Chemistry') {
                chemistryQuizCount++;
                chemistryTotalAccuracy += result.accuracy;
            } else if (result.subject === 'Mathematics') {
                mathQuizCount++;
                mathTotalAccuracy += result.accuracy;
            } else if (result.subject === 'History') {
                historyQuizCount++;
                historyTotalAccuracy += result.accuracy;
            }
        });
        
        if (physicsQuizCount > 0) {
            const avgPhysicsAccuracy = (physicsTotalAccuracy / physicsQuizCount).toFixed(0);
            if (physicsStats) physicsStats.textContent = `Avg. Accuracy: ${avgPhysicsAccuracy}%`;
            if (physicsProgress) physicsProgress.style.width = `${avgPhysicsAccuracy}%`;
            if (physicsProgressText) physicsProgressText.textContent = `${avgPhysicsAccuracy}%`;
        }

        if (chemistryQuizCount > 0) {
            const avgChemistryAccuracy = (chemistryTotalAccuracy / chemistryQuizCount).toFixed(0);
            if (chemistryStats) chemistryStats.textContent = `Avg. Accuracy: ${avgChemistryAccuracy}%`;
            if (chemistryProgress) chemistryProgress.style.width = `${avgChemistryAccuracy}%`;
            if (chemistryProgressText) chemistryProgressText.textContent = `${avgChemistryAccuracy}%`;
        }

        if (mathQuizCount > 0) {
            const avgMathAccuracy = (mathTotalAccuracy / mathQuizCount).toFixed(0);
            if (mathStats) mathStats.textContent = `Avg. Accuracy: ${avgMathAccuracy}%`;
            if (mathProgress) mathProgress.style.width = `${avgMathAccuracy}%`;
            if (mathProgressText) mathProgressText.textContent = `${avgMathAccuracy}%`;
        }

        if (historyQuizCount > 0) {
            const avgHistoryAccuracy = (historyTotalAccuracy / historyQuizCount).toFixed(0);
            if (historyStats) historyStats.textContent = `Avg. Accuracy: ${avgHistoryAccuracy}%`;
            if (historyProgress) historyProgress.style.width = `${avgHistoryAccuracy}%`;
            if (historyProgressText) historyProgressText.textContent = `${avgHistoryAccuracy}%`;
        }

    } else {
        // User is signed out
        console.log('User is not logged in. Redirecting to login page.');
        window.location.href = 'login.html';
    }
});

// --- Logout ---
if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
            // Sign-out successful.
            console.log('User signed out.');
            window.location.href = 'login.html';
        }).catch((error) => {
            // An error happened.
            console.error('Sign out error:', error);
        });
    });
}