import { auth, db } from './firebase_cofig.js';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const welcomeMessage = document.getElementById('welcome-message');
const userAvatar = document.getElementById('user-avatar');
const userDisplayName = document.getElementById('user-display-name');
const userEmail = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');
const totalPointsEl = document.getElementById('total-points');
const userRankEl = document.getElementById('user-rank');
const overallAccuracyEl = document.getElementById('overall-accuracy');
const recentActivityList = document.getElementById('recent-activity-list');
const loadingActivity = document.getElementById('loading-activity');

// Accuracy bars
const accuracyBars = {
    Physics: document.getElementById('physics-accuracy-bar'),
    Chemistry: document.getElementById('chemistry-accuracy-bar'),
    Mathematics: document.getElementById('math-accuracy-bar'),
    History: document.getElementById('history-accuracy-bar')
};

const subjectIcons = {
    'Physics': 'science',
    'Chemistry': 'biotech',
    'Mathematics': 'calculate',
    'History': 'history_edu'
};

// Difficulty Rings
const easyRing = document.getElementById('easy-ring');
const easyPercent = document.getElementById('easy-percent');
const mediumRing = document.getElementById('medium-ring');
const mediumPercent = document.getElementById('medium-percent');
const hardRing = document.getElementById('hard-ring');
const hardPercent = document.getElementById('hard-percent');

// Default values
const defaultAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2yY48i-e_1V6KIbRpjUQCBklJrW6f67RN2aSw_PdwhvoXxYmWnCI_0HCIrbPEhxEPFwAKusm15FgyKR36_gyd-3OqgQ0yX3vGy6Z72faoQXkp5WNBzyVjRbE3XEMfmMJ-MRQVxKDp0VQRiDfXWtTPOQz-qfcAuYPhLLMXMg5gLYCsYugV22dMivLzsvZ42L1lKl0HJWhubWMYw7Ob13xjjnfHiCz_oYZ7vFeYGASYNSKYpxSo10bMB23d3Ldm7FWuvgA5XqNeqk-p';

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        console.log('User is logged in:', user);

        const displayName = user.displayName || 'User';
        const email = user.email;
        const photoURL = user.photoURL || defaultAvatar;

        // Update the UI with user information
        if (welcomeMessage) welcomeMessage.textContent = `Welcome back, ${displayName}!`;
        if (userDisplayName) userDisplayName.textContent = displayName;
        if (userEmail) userEmail.textContent = email;
        if (userAvatar) userAvatar.style.backgroundImage = `url('${photoURL}')`;

        // --- Fetch data from Firestore ---

        // 1. Fetch user's main document for aggregated stats
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const totalPoints = userData.totalPoints || 0;
            if (totalPointsEl) totalPointsEl.textContent = `${totalPoints.toLocaleString()} Points`;
            if (overallAccuracyEl) overallAccuracyEl.textContent = `${(userData.overallAccuracy || 0).toFixed(0)}%`;

            // Simple ranking system
            if (userRankEl) {
                if (totalPoints > 20000) userRankEl.textContent = 'Rank: Prodigy';
                else if (totalPoints > 5000) userRankEl.textContent = 'Rank: Expert';
                else if (totalPoints > 1000) userRankEl.textContent = 'Rank: Adept';
                else if (totalPoints > 100) userRankEl.textContent = 'Rank: Apprentice';
                else userRankEl.textContent = 'Rank: Novice';
            }
        }

        // 2. Fetch all quiz results to calculate subject accuracies
        const resultsQuery = query(collection(db, "quiz_results"), where("userId", "==", user.uid));
        const resultsSnapshot = await getDocs(resultsQuery);

        const subjectStats = {};
        const difficultyStats = {
            Easy: new Set(),
            Medium: new Set(),
            Hard: new Set()
        };

        resultsSnapshot.forEach(doc => {
            const result = doc.data();
            if (!subjectStats[result.subject]) {
                subjectStats[result.subject] = { totalAccuracy: 0, count: 0 };
            }
            if (result.difficulty && difficultyStats[result.difficulty]) {
                difficultyStats[result.difficulty].add(result.subject);
            }
            subjectStats[result.subject].totalAccuracy += result.accuracy;
            subjectStats[result.subject].count++;
        });

        for (const subject in accuracyBars) {
            if (subjectStats[subject] && accuracyBars[subject]) {
                const avgAccuracy = subjectStats[subject].totalAccuracy / subjectStats[subject].count;
                accuracyBars[subject].style.width = `${avgAccuracy.toFixed(0)}%`;
            }
        }

        // 4. Update difficulty completion rings
        // Assuming there are 4 total easy quizzes for now.
        const totalEasyQuizzes = 4;
        const easyCompletion = (difficultyStats.Easy.size / totalEasyQuizzes) * 100;
        if (easyRing) easyRing.style.strokeDashoffset = 100 - easyCompletion;
        if (easyPercent) easyPercent.textContent = `${easyCompletion.toFixed(0)}%`;

        // For Medium and Hard, we'll leave them at 0 as requested
        if (mediumRing) mediumRing.style.strokeDashoffset = 100;
        if (mediumPercent) mediumPercent.textContent = '0%';
        if (hardRing) hardRing.style.strokeDashoffset = 100;
        if (hardPercent) hardPercent.textContent = '0%';



        // 3. Fetch recent 3 activities
        const recentActivityQuery = query(collection(db, "quiz_results"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(3));
        const activitySnapshot = await getDocs(recentActivityQuery);

        if (loadingActivity) loadingActivity.style.display = 'none';
        if (recentActivityList) recentActivityList.innerHTML = '';

        if (activitySnapshot.empty) {
            if(recentActivityList) recentActivityList.innerHTML = '<p class="text-sm text-gray-500">No recent activity.</p>';
        } else {
            activitySnapshot.forEach(doc => {
                const result = doc.data();
                const icon = subjectIcons[result.subject] || 'quiz';
                const date = result.createdAt.toDate();
                const timeAgo = Math.round((new Date() - date) / (1000 * 60 * 60 * 24)); // days ago

                const activityItem = document.createElement('li');
                activityItem.className = 'flex items-center gap-4';
                activityItem.innerHTML = `
                    <div class="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
                        <span class="material-symbols-outlined text-blue-600 dark:text-blue-300">${icon}</span>
                    </div>
                    <div class="flex-1">
                        <p class="font-medium text-gray-800 dark:text-gray-200">${result.subject} Quiz</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${result.accuracy.toFixed(0)}% - ${timeAgo} days ago</p>
                    </div>
                `;
                if (recentActivityList) recentActivityList.appendChild(activityItem);
            });
        }

    } else {
        // User is signed out
        console.log('User is not logged in. Redirecting to login page.');
        window.location.href = 'login.html';
    }
});

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