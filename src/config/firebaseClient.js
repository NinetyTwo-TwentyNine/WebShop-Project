// src/firebase/firebaseClient.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7oNEoIY_h9-E3AxgGtnslpq2mqr-csGs",
  authDomain: "fcm-learn-web.firebaseapp.com",
  projectId: "fcm-learn-web",
  appId: "1:538203619115:web:a87862e792468396cecf6e",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);