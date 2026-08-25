import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCtrZfdFQva6q6br5I514j49PbblgbwJrE",
  authDomain: "al-shifa-6b8d7.firebaseapp.com",
  projectId: "al-shifa-6b8d7",
  storageBucket: "al-shifa-6b8d7.firebasestorage.app",
  messagingSenderId: "761357599772",
  appId: "1:761357599772:web:2e854057c0f079ec830bd9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
