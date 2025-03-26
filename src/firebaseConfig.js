import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
        apiKey: "AIzaSyC4Louz-sQS3e2YTxXrWdSqWpuQXMoySW0",
        authDomain: "balding-5f1b4.firebaseapp.com",
        projectId: "balding-5f1b4",
        storageBucket: "balding-5f1b4.firebasestorage.app",
        messagingSenderId: "799626676958",
        appId: "1:799626676958:web:3a6c66032e498eb149904f",
        measurementId: "G-9469H2TN6T"
      };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
