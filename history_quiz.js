import { auth, db } from './firebase_cofig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { doc, setDoc, collection, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

export const questions = [
    {
        question: "In which year did World War II end?",
        options: ["1943", "1945", "1947", "1950"],
        answer: "1945",
        points: 10
    },
    {
        question: "Who was the first President of the United States?",
        options: ["Abraham Lincoln", "Thomas Jefferson", "John Adams", "George Washington"],
        answer: "George Washington",
        points: 10
    },
    {
        question: "The ancient city of Rome was built on how many hills?",
        options: ["Five", "Six", "Seven", "Eight"],
        answer: "Seven",
        points: 15
    },
    {
        question: "Who discovered penicillin?",
        options: ["Marie Curie", "Alexander Fleming", "Louis Pasteur", "Isaac Newton"],
        answer: "Alexander Fleming",
        points: 15
    },
    {
        question: "The Magna Carta was signed in which year?",
        options: ["1066", "1215", "1492", "1776"],
        answer: "1215",
        points: 10
    }
];

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextButton = document.getElementById('next-question-btn');
const submitButton = document.getElementById('submit-quiz-btn');
const quitButton = document.getElementById('quit-quiz-btn');
const progressBar = document.getElementById('progress-bar');
const questionCounter = document.getElementById('question-counter');
const timerEl = document.getElementById('timer');

let currentQuestionIndex = 0;
let userAnswers = [];
let currentUser = null;
let timerInterval = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadQuestion();
        startTimer();
    } else {
        window.location.href = 'login.html';
    }
});

function startTimer() {
    let timeRemaining = 600; // 10 minutes in seconds
    timerInterval = setInterval(() => {
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (--timeRemaining < 0) {
            clearInterval(timerInterval);
            alert("Time's up! Submitting your quiz.");
            submitButton.click();
        }
    }, 1000);
}

function loadQuestion() {
    const currentQuestion = questions[currentQuestionIndex];
    questionText.textContent = currentQuestion.question;
    optionsContainer.innerHTML = '';

    currentQuestion.options.forEach(option => {
        const label = document.createElement('label');
        label.className = "flex items-center gap-4 rounded-lg border border-solid border-gray-300 dark:border-gray-700 p-4 cursor-pointer hover:border-primary dark:hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/10 transition-colors";
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'question-option';
        radio.value = option;
        radio.className = "h-5 w-5 border-2 border-gray-300 dark:border-gray-600 bg-transparent text-transparent checked:border-primary dark:checked:border-primary checked:bg-[image:--radio-dot-svg-light] dark:checked:bg-[image:--radio-dot-svg-dark] focus:outline-none focus:ring-0 focus:ring-offset-0";
        
        const text = document.createElement('p');
        text.className = "text-gray-800 dark:text-gray-200 text-sm font-medium leading-normal";
        text.textContent = option;

        label.appendChild(radio);
        label.appendChild(text);
        optionsContainer.appendChild(label);
    });

    updateProgress();
}

function updateProgress() {
    const progressPercentage = ((currentQuestionIndex) / questions.length) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    questionCounter.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
}

nextButton.addEventListener('click', () => {
    const selectedOption = document.querySelector('input[name="question-option"]:checked');
    if (!selectedOption) {
        alert('Please select an answer.');
        return;
    }
    userAnswers[currentQuestionIndex] = selectedOption.value;

    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        // End of quiz
        nextButton.classList.add('hidden');
        submitButton.classList.remove('hidden');
        questionText.textContent = "You have reached the end of the quiz. Click submit to see your results.";
        optionsContainer.innerHTML = '';
        progressBar.style.width = `100%`;
    }
});

submitButton.addEventListener('click', async () => {
    clearInterval(timerInterval); // Stop the timer
    let score = 0;
    let totalPoints = 0;
    questions.forEach((q, index) => {
        if (q.answer === userAnswers[index]) {
            score++;
            totalPoints += q.points; // Add points for each correct answer
        }
    });

    const accuracy = (score / questions.length) * 100;

    const result = {
        userId: currentUser.uid,
        subject: 'History',
        score: score,
        totalQuestions: questions.length,
        accuracy: accuracy,
        points: totalPoints,
        createdAt: serverTimestamp(),
        answers: userAnswers,
        difficulty: 'Easy' // Add difficulty
    };

    try {
        // Save result to Firestore
        const userRef = doc(db, "users", currentUser.uid);
        const resultRef = doc(collection(db, "quiz_results")); // New ref for the result

        // Use a transaction to update user stats and save quiz result atomically
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            let userData = {};

            if (!userDoc.exists()) {
                // Document doesn't exist, so we'll create it in this transaction.
                console.warn("User document did not exist, creating it now.");
                userData = {
                    quizzesCompleted: 0,
                    totalPoints: 0,
                    overallAccuracy: 0
                };
            } else {
                userData = userDoc.data();
            }

            const newQuizzesCompleted = (userData.quizzesCompleted || 0) + 1;
            const newTotalPoints = (userData.totalPoints || 0) + totalPoints;
            // A more robust accuracy calculation would weigh by number of questions
            const newOverallAccuracy = ((userData.overallAccuracy || 0) * (newQuizzesCompleted - 1) + accuracy) / newQuizzesCompleted;

            // Use set with merge:true to create or update the document.
            transaction.set(userRef, { 
                quizzesCompleted: newQuizzesCompleted,
                totalPoints: newTotalPoints,
                overallAccuracy: newOverallAccuracy
            }, { merge: true });

            transaction.set(resultRef, result);
        });

        window.location.href = `performance_tracking.html?resultId=${resultRef.id}`; // Redirect after success
    } catch (error) {
        console.error("Error saving quiz result: ", error);
        alert("There was an error saving your result. Please try again.");
    }
});

quitButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to quit? Your progress will not be saved.')) {
        clearInterval(timerInterval);
        window.location.href = 'dashboard.html';
    }
});