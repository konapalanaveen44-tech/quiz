import { auth, db } from './firebase_cofig.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const historyContainer = document.getElementById('history-container');
const loadingMessage = document.getElementById('loading-message');
const logoutButton = document.getElementById('logout-button');

const subjectIcons = {
    'Physics': 'science',
    'Chemistry': 'biotech',
    'Mathematics': 'calculate',
    'History': 'history_edu'
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const q = query(collection(db, "quiz_results"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        loadingMessage.style.display = 'none';

        if (querySnapshot.empty) {
            historyContainer.innerHTML = '<p class="text-gray-500">You haven\'t completed any quizzes yet. Take a quiz to see your history!</p>';
            return;
        }

        querySnapshot.forEach(doc => {
            const result = doc.data();
            const resultId = doc.id;
            const date = result.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const icon = subjectIcons[result.subject] || 'quiz';

            const item = document.createElement('div');
            item.className = 'flex items-center gap-4 p-4 rounded-xl bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark';
            item.innerHTML = `
                <div class="flex items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 size-12">
                    <span class="material-symbols-outlined">${icon}</span>
                </div>
                <div class="flex-1">
                    <p class="font-bold text-gray-900 dark:text-white">${result.subject} Quiz</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Completed on ${date}</p>
                </div>
                <div class="text-center">
                    <p class="font-bold text-lg text-gray-900 dark:text-white">${result.accuracy.toFixed(0)}%</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Accuracy</p>
                </div>
                <a href="performance_tracking.html?resultId=${resultId}" class="flex items-center justify-center h-10 px-4 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                    Review
                </a>
            `;
            historyContainer.appendChild(item);
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