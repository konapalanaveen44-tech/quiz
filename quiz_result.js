import { db } from './firebase_cofig.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Function to dynamically import questions based on the subject
async function getQuestionsForSubject(subject, difficulty) {
    switch (subject) {
        case 'Physics':
            return (await import('./physics_questions.js')).questions[difficulty];
        case 'Chemistry':
            return (await import('./chemistry_questions.js')).questions[difficulty];
        case 'Mathematics':
            return (await import('./mathematics_questions.js')).questions[difficulty];
        case 'History':
            return (await import('./history_questions.js')).questions[difficulty];
        default:
            console.error(`Unknown subject: ${subject}`);
            return [];
    }
}

// --- DOM Elements ---
const quizTitleEl = document.getElementById('quiz-title');
const scoreEl = document.getElementById('score');
const totalQuestionsEl = document.getElementById('total-questions');
const scoreMessageEl = document.getElementById('score-message');
const pointsEarnedEl = document.getElementById('points-earned');
const accuracyEl = document.getElementById('accuracy');
const timeTakenEl = document.getElementById('time-taken');
const reviewContainer = document.getElementById('review-container');
const reviewTitleEl = document.getElementById('review-title');

async function loadResult() {
    const urlParams = new URLSearchParams(window.location.search);
    const resultId = urlParams.get('resultId');

    if (!resultId) {
        quizTitleEl.textContent = "Result Not Found";
        reviewContainer.innerHTML = '<p class="p-6 text-error">Could not find a result ID in the URL. Please go back to the dashboard and try again.</p>';
        return;
    }

    try {
        const resultRef = doc(db, "quiz_results", resultId);
        const resultSnap = await getDoc(resultRef);

        if (!resultSnap.exists()) {
            quizTitleEl.textContent = "Result Not Found";
            reviewContainer.innerHTML = `<p class="p-6 text-error">No result found for ID: ${resultId}</p>`;
            return;
        }

        const resultData = resultSnap.data();
        const questions = await getQuestionsForSubject(resultData.subject, resultData.difficulty || 'Easy');

        // --- Populate Header and Stats ---
        quizTitleEl.textContent = `${resultData.subject} Quiz Result`;
        scoreEl.textContent = resultData.score;
        totalQuestionsEl.textContent = `/ ${resultData.totalQuestions}`;
        pointsEarnedEl.textContent = resultData.points;
        accuracyEl.textContent = `${resultData.accuracy.toFixed(0)}%`;

        // Format and display time taken
        const timeTaken = resultData.timeTaken || 0;
        const minutes = Math.floor(timeTaken / 60).toString().padStart(2, '0');
        const seconds = (timeTaken % 60).toString().padStart(2, '0');
        timeTakenEl.textContent = `${minutes}:${seconds}`;


        // Update score message based on accuracy
        if (resultData.accuracy >= 80) {
            scoreMessageEl.textContent = "Excellent!";
            scoreMessageEl.className = "text-2xl font-bold text-success";
        } else if (resultData.accuracy >= 50) {
            scoreMessageEl.textContent = "Good Job!";
            scoreMessageEl.className = "text-2xl font-bold text-accent";
        } else {
            scoreMessageEl.textContent = "Keep Practicing!";
            scoreMessageEl.className = "text-2xl font-bold text-error";
        }

        // --- Populate Answer Review ---
        reviewTitleEl.textContent = `Answer Review (${resultData.subject})`;
        reviewContainer.innerHTML = ''; // Clear any existing content

        questions.forEach((question, index) => {
            const userAnswer = resultData.answers[index];
            const isCorrect = userAnswer === question.answer;

            const reviewItem = document.createElement('div');
            reviewItem.className = 'p-6';
            
            const icon = isCorrect 
                ? '<span class="material-symbols-outlined text-success">check_circle</span>'
                : '<span class="material-symbols-outlined text-error">cancel</span>';

            reviewItem.innerHTML = `
                <div class="flex items-start gap-4">
                    <div class="flex-shrink-0">${icon}</div>
                    <div class="flex-1">
                        <p class="text-base font-semibold text-gray-900 dark:text-white mb-2">${index + 1}. ${question.question}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Your answer: 
                            <span class="font-medium ${isCorrect ? 'text-success' : 'text-error'}">${userAnswer || 'Not answered'}</span>
                        </p>
                        ${!isCorrect ? `
                        <p class="text-sm text-gray-600 dark:text-gray-400">Correct answer: 
                            <span class="font-medium text-success">${question.answer}</span>
                        </p>
                        ` : ''}
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-bold ${isCorrect ? 'text-success' : 'text-error'}">
                            ${isCorrect ? `+${question.points}` : '+0'}
                        </p>
                        <p class="text-xs text-gray-500">Points</p>
                    </div>
                </div>
            `;
            reviewContainer.appendChild(reviewItem);
        });

    } catch (error) {
        console.error("Error loading quiz result:", error);
        quizTitleEl.textContent = "Error Loading Result";
        reviewContainer.innerHTML = `<p class="p-6 text-error">An error occurred while fetching your results. Please check the console for details.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', loadResult);