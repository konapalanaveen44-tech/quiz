import { auth, db } from './firebase_cofig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { toggleTheme, updateThemeToggle } from './theme.js';

// --- Dynamically import all question sets ---
async function getAllQuestions() {
    const subjects = ['Physics', 'Chemistry', 'Mathematics', 'History'];
    const allQuestions = { Easy: [], Medium: [], Hard: [] };

    for (const subject of subjects) {
        try {
            const module = await import(`./${subject.toLowerCase()}_questions.js`);
            if (module.questions) {
                if (module.questions.Easy) allQuestions.Easy.push(...module.questions.Easy);
                if (module.questions.Medium) allQuestions.Medium.push(...module.questions.Medium);
                if (module.questions.Hard) allQuestions.Hard.push(...module.questions.Hard);
            }
        } catch (error) {
            console.error(`Could not load questions for ${subject}:`, error);
        }
    }
    return allQuestions;
}

// --- DOM Elements ---
const welcomeMessage = document.getElementById('welcome-message');
const totalPointsEl = document.getElementById('total-points');
const userRankEl = document.getElementById('user-rank');
const overallAccuracyEl = document.getElementById('overall-accuracy');
const userAvatar = document.getElementById('user-avatar');
const userDisplayName = document.getElementById('user-display-name');
const userEmail = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');

// Subject accuracy bars
const physicsBar = document.getElementById('physics-accuracy-bar');
const chemistryBar = document.getElementById('chemistry-accuracy-bar');
const mathBar = document.getElementById('math-accuracy-bar');
const historyBar = document.getElementById('history-accuracy-bar');

// Difficulty rings
const easyRing = document.getElementById('easy-ring');
const easyPercent = document.getElementById('easy-percent');
const mediumRing = document.getElementById('medium-ring');
const mediumPercent = document.getElementById('medium-percent');
const hardRing = document.getElementById('hard-ring');
const hardPercent = document.getElementById('hard-percent');

// Recent Activity
const recentActivityList = document.getElementById('recent-activity-list');
const loadingActivity = document.getElementById('loading-activity');

// Theme toggle
const darkModeToggle = document.getElementById('dark-mode');

const defaultAvatar = 'https://lh3.googleusercontent.com/a/ACg8ocJ-0_v4s-Co32-QdI-fM2Tsf1iT2x-32l2wO9Ml7dM=s96-c';

function updateRing(element, percentage) {
    if (!element) return;
    const radius = element.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    element.style.strokeDashoffset = offset;
    element.style.strokeDasharray = `${circumference} ${circumference}`;
}

onAuthStateChanged(auth, async (user) => {
    // Initialize the theme toggle state on page load
    if (darkModeToggle) updateThemeToggle(darkModeToggle);

    if (user) {
        // --- Fetch User Data and Quiz Results Concurrently ---
        const [userDocSnap, resultsSnapshot, allQuestions] = await Promise.all([
            getDoc(doc(db, "users", user.uid)),
            getDocs(query(collection(db, "quiz_results"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))),
            getAllQuestions()
        ]);

        // --- Process User Document ---
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const displayName = userData.name || user.displayName || 'User';
            const photoURL = userData.photoURL || user.photoURL || defaultAvatar;

            welcomeMessage.textContent = `Welcome back, ${displayName}!`;
            totalPointsEl.textContent = `${userData.totalPoints || 0} Points`;
            overallAccuracyEl.textContent = `${(userData.overallAccuracy || 0).toFixed(0)}%`;
            userDisplayName.textContent = displayName;
            userEmail.textContent = userData.email || user.email;
            userAvatar.style.backgroundImage = `url('${photoURL}')`;
        } else {
            console.log("No such user document!");
            // Handle case where user exists in Auth but not Firestore
        }

        // --- Process Quiz Results for Stats and Activity ---
        let subjectAccuracies = { Physics: [], Chemistry: [], Mathematics: [], History: [] };
        let completedByDifficulty = { Easy: 0, Medium: 0, Hard: 0 };

        if (loadingActivity) loadingActivity.style.display = 'none';
        recentActivityList.innerHTML = ''; // Clear loading message

        resultsSnapshot.docs.forEach((doc, index) => {
            const result = doc.data();
            if (subjectAccuracies[result.subject]) {
                subjectAccuracies[result.subject].push(result.accuracy);
            }

            // Count completed quizzes by difficulty
            if (result.difficulty) {
                completedByDifficulty[result.difficulty]++;
            }

            // Populate recent activity (limit to 3)
            if (index < 3) {
                const activityItem = document.createElement('li');
                activityItem.className = 'flex items-center gap-4';
                const icon = result.accuracy >= 50 ? 'task_alt' : 'highlight_off';
                const color = result.accuracy >= 50 ? 'text-emerald-500' : 'text-red-500';

                activityItem.innerHTML = `
                    <div class="flex items-center justify-center size-10 rounded-full bg-gray-100 dark:bg-gray-700">
                        <span class="material-symbols-outlined ${color}">${icon}</span>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium text-gray-900 dark:text-white">${result.subject} Quiz (${result.difficulty})</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${result.score}/${result.totalQuestions} - ${result.accuracy.toFixed(0)}%</p>
                    </div>
                `;
                recentActivityList.appendChild(activityItem);
            }
        });

        if (resultsSnapshot.empty) {
            recentActivityList.innerHTML = '<p class="text-gray-500 text-sm">No recent activity found.</p>';
        }

        // --- Calculate and Display Subject Accuracy Bars ---
        const calculateAverage = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
        if (physicsBar) physicsBar.style.width = `${calculateAverage(subjectAccuracies.Physics).toFixed(0)}%`;
        if (chemistryBar) chemistryBar.style.width = `${calculateAverage(subjectAccuracies.Chemistry).toFixed(0)}%`;
        if (mathBar) mathBar.style.width = `${calculateAverage(subjectAccuracies.Mathematics).toFixed(0)}%`;
        if (historyBar) historyBar.style.width = `${calculateAverage(subjectAccuracies.History).toFixed(0)}%`;

        // --- Calculate and Display Difficulty Completion Rings ---
        const totalEasy = allQuestions.Easy.length;
        const totalMedium = allQuestions.Medium.length;
        const totalHard = allQuestions.Hard.length;

        const easyCompletion = totalEasy > 0 ? (completedByDifficulty.Easy / totalEasy) * 100 : 0;
        const mediumCompletion = totalMedium > 0 ? (completedByDifficulty.Medium / totalMedium) * 100 : 0;
        const hardCompletion = totalHard > 0 ? (completedByDifficulty.Hard / totalHard) * 100 : 0;

        // Update Easy Ring
        easyPercent.textContent = `${Math.min(100, easyCompletion).toFixed(0)}%`;
        updateRing(easyRing, Math.min(100, easyCompletion));

        // Update Medium Ring
        mediumPercent.textContent = `${Math.min(100, mediumCompletion).toFixed(0)}%`;
        updateRing(mediumRing, Math.min(100, mediumCompletion));

        // Update Hard Ring
        hardPercent.textContent = `${Math.min(100, hardCompletion).toFixed(0)}%`;
        updateRing(hardRing, Math.min(100, hardCompletion));

    } else {
        // User is signed out
        window.location.href = 'index.html';
    }
});

// --- Logout ---
logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => {
        console.log('User signed out.');
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Sign out error:', error);
    });
});

// --- Theme Toggle Handler ---
if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        toggleTheme();
        updateThemeToggle(darkModeToggle);
    });
}