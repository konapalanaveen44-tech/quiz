
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-analytics.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // IMPORTANT: It is strongly recommended to use environment variables
  // to store your Firebase config keys rather than hardcoding them.
  // This prevents exposing sensitive information in your source code.
  // The values below should be stored in a `.env` file and loaded
  // by your build process (e.g., using Vite, Webpack, or Parcel).

  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    // Example for a build tool environment: import.meta.env.VITE_API_KEY
    apiKey: "AIzaSyBNsMOjUEjqUUU6ibMrKmhIdR03zsljTGU", // Replace with process.env.FIREBASE_API_KEY or similar
    authDomain: "quize-dc446.firebaseapp.com", // Replace with process.env.FIREBASE_AUTH_DOMAIN
    projectId: "quize-dc446", // Replace with process.env.FIREBASE_PROJECT_ID
    storageBucket: "quize-dc446.firebasestorage.app", // Replace with process.env.FIREBASE_STORAGE_BUCKET
    messagingSenderId: "1097388051504", // Replace with process.env.FIREBASE_MESSAGING_SENDER_ID
    appId: "1:1097388051504:web:d208a954530a4ff99031f5", // Replace with process.env.FIREBASE_APP_ID
    measurementId: "G-04V706ESN9" // Replace with process.env.FIREBASE_MEASUREMENT_ID
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Export for use in other modules
  export { app, analytics, auth, db };
