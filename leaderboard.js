import { auth, db } from './firebase_cofig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, query, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const leaderboardContainer = document.getElementById('leaderboard-container');
const loadingMessage = document.getElementById('loading-leaderboard');
const logoutButton = document.getElementById('logout-button');
const myProgressSection = document.getElementById('my-progress-section');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

const defaultAvatar = 'https://lh3.googleusercontent.com/a/ACg8ocJ-0_v4s-Co32-QdI-fM2Tsf1iT2x-32l2wO9Ml7dM=s96-c';

// Define level thresholds
const levelThresholds = [
    { level: 0, points: 0 },
    { level: 1, points: 101 },
    { level: 2, points: 251 },
    { level: 3, points: 501 },
    { level: 4, points: 1001 },
    { level: 5, points: 2001 } // Add more levels as needed
];

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Query all users, ordered by their total points
        const q = query(collection(db, "users"), orderBy("totalPoints", "desc"));
        const querySnapshot = await getDocs(q);

        loadingMessage.style.display = 'none';

        if (querySnapshot.empty) {
            leaderboardContainer.innerHTML = '<p class="text-gray-500 p-4">No users found on the leaderboard yet.</p>';
            return;
        }

        let rank = 1;
        querySnapshot.forEach(doc => {
            const userData = doc.data();
            const isCurrentUser = userData.uid === user.uid;
            const userTotalPoints = userData.totalPoints || 0;

            const photoURL = userData.photoURL || defaultAvatar;

            // --- Improved Name Display ---
            let displayName = userData.name || 'Anonymous';
            if (displayName === 'Anonymous' && userData.email) {
                // If name is missing, create one from the email
                const emailName = userData.email.split('@')[0];
                // Capitalize the first letter
                displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
            }

            // --- Level Calculation ---
            let currentLevelInfo = levelThresholds.slice().reverse().find(l => userTotalPoints >= l.points);
            let level = currentLevelInfo ? currentLevelInfo.level : 0;

            // --- Progress Bar Calculation for current user ---
            if (isCurrentUser) {
                const nextLevelInfo = levelThresholds.find(l => l.points > userTotalPoints);
                if (nextLevelInfo) {
                    const pointsForCurrentLevel = currentLevelInfo.points;
                    const pointsForNextLevel = nextLevelInfo.points;
                    const pointsNeeded = pointsForNextLevel - pointsForCurrentLevel;
                    const pointsEarnedInLevel = userTotalPoints - pointsForCurrentLevel;
                    const progressPercentage = (pointsEarnedInLevel / pointsNeeded) * 100;

                    if (myProgressSection) myProgressSection.style.display = 'block';
                    if (progressBar) progressBar.style.width = `${progressPercentage}%`;
                    if (progressText) progressText.textContent = `${userTotalPoints.toLocaleString()} / ${pointsForNextLevel.toLocaleString()} Points`;
                } else {
                    // User is at max level
                    if (myProgressSection) myProgressSection.style.display = 'block';
                    if (progressBar) progressBar.style.width = `100%`;
                    if (progressText) progressText.textContent = "You've reached the max level!";
                }
            }

            const userRow = document.createElement('div');
            userRow.className = `flex items-center p-4 rounded-xl border ${isCurrentUser ? 'bg-primary/10 border-primary' : 'bg-card-light dark:bg-card-dark border-border-light dark:border-border-dark'}`;
            
            userRow.innerHTML = `
                <div class="w-16 text-center font-bold text-lg ${isCurrentUser ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}">${rank}</div>
                <div class="flex-1 flex items-center gap-4">
                    <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style="background-image: url('${photoURL}')"></div>
                    <div class="flex flex-col">
                        <p class="font-semibold text-gray-900 dark:text-white">${displayName}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Level ${level}</p>
                    </div>
                </div>
                <div class="w-32 text-right font-bold text-lg text-primary">${userTotalPoints.toLocaleString()}</div>
            `;
            leaderboardContainer.appendChild(userRow);
            rank++;
        });

    } else {
        window.location.href = 'login.html';
    }
});

if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth).then(() => {
            console.log('User signed out.');
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Sign out error:', error);
        });
    });
}