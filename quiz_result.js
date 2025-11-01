import { auth, db } from './firebase_cofig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { questions as physicsQuestions } from './physics_quiz.js';
import { questions as chemistryQuestions } from './chemistry_quiz.js';
import { questions as mathematicsQuestions } from './mathematics_quiz.js';
import { questions as historyQuestions } from './history_quiz.js';

const quizTitle = document.getElementById('quiz-title');
const scoreEl = document.getElementById('score');
const totalQuestionsEl = document.getElementById('total-questions');
const scoreMessageEl = document.getElementById('score-message');
const pointsEarnedEl = document.getElementById('points-earned');
const accuracyEl = document.getElementById('accuracy');
const reviewContainer = document.getElementById('review-container');

const allQuestions = {
    'Physics': physicsQuestions,
    'Chemistry': chemistryQuestions,
    'Mathematics': mathematicsQuestions,
    'History': historyQuestions
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const urlParams = new URLSearchParams(window.location.search);
        const resultId = urlParams.get('resultId');

        if (!resultId) {
            alert('No result found!');
            window.location.href = 'dashboard.html';
            return;
        }

        const docRef = doc(db, "quiz_results", resultId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const result = docSnap.data();
            
            quizTitle.textContent = `Quiz Completed: ${result.subject}`;
            scoreEl.textContent = result.score;
            totalQuestionsEl.textContent = `/ ${result.totalQuestions}`;
            pointsEarnedEl.textContent = result.points;
            accuracyEl.textContent = `${result.accuracy.toFixed(0)}%`;

            if (result.accuracy >= 80) {
                scoreMessageEl.textContent = "Excellent!";
                scoreMessageEl.className = "text-2xl font-bold text-success";
            } else if (result.accuracy >= 50) {
                scoreMessageEl.textContent = "Good Job!";
                scoreMessageEl.className = "text-2xl font-bold text-yellow-500";
            } else {
                scoreMessageEl.textContent = "Keep Practicing!";
                scoreMessageEl.className = "text-2xl font-bold text-error";
            }

            // --- Answer Review Logic ---
            const questionsForSubject = allQuestions[result.subject];
            if (questionsForSubject && result.answers) {
                reviewContainer.innerHTML = ''; // Clear placeholder
                questionsForSubject.forEach((question, index) => {
                    const userAnswer = result.answers[index] || "Not Answered";
                    const isCorrect = userAnswer === question.answer;

                    const reviewItem = document.createElement('div');
                    reviewItem.className = 'p-6';
                    reviewItem.innerHTML = `
                        <div class="flex items-start gap-4">
                            <div class="flex-shrink-0 flex items-center justify-center size-8 rounded-full ${isCorrect ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}">
                                <span class="material-symbols-outlined text-xl">${isCorrect ? 'check' : 'close'}</span>
                            </div>
                            <div class="flex-1">
                                <p class="text-base font-medium text-gray-900 dark:text-white">Q${index + 1}: ${question.question}</p>
                                <div class="mt-2 text-sm">
                                    <p class="${isCorrect ? 'text-gray-500 dark:text-gray-400' : 'text-error'}">
                                        <strong>Your Answer:</strong> ${userAnswer}
                                    </p>
                                    ${!isCorrect ? `
                                    <p class="text-success">
                                        <strong>Correct Answer:</strong> ${question.answer}
                                    </p>` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                    reviewContainer.appendChild(reviewItem);
                });
            } else {
                reviewContainer.innerHTML = '<p class="p-6 text-gray-500">Answer review is not available for this quiz.</p>';
            }

        } else {
            console.log("No such document!");
            window.location.href = 'dashboard.html';
        }
    } else {
        window.location.href = 'login.html';
    }
});