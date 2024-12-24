import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBygOPETEedMdBlML3LIde_w4yKzXTLU9U",
    authDomain: "dealer-management-4f2fd.firebaseapp.com",
    projectId: "dealer-management-4f2fd",
    storageBucket: "dealer-management-4f2fd.firebasestorage.app",
    messagingSenderId: "306098669645",
    appId: "1:306098669645:web:08dade5a26c40be6977404",
    measurementId: "G-HZ1CEB3BY9"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
