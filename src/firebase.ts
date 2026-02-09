// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-JXNaSCAu4IfAX4O0U2rbVZGAEm20ZP4",
  authDomain: "pikis-7abfa.firebaseapp.com",
  projectId: "pikis-7abfa",
  storageBucket: "pikis-7abfa.firebasestorage.app",
  messagingSenderId: "565539620077",
  appId: "1:565539620077:web:1bbe2323a3eb37610db8e4",
  measurementId: "G-41Q6PYH0M0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
