import { auth } from "../config/firebaseClient.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

let currentUser = null;
const listeners = new Set();

let initPromise = null;
export function initAuth() {
  if (!initPromise)
  {
    initPromise = new Promise(resolve => {
      onAuthStateChanged(
        auth,
        user => {
          currentUser = user;
          notify();
          resolve();
        },
        error => {
          console.error("Auth state error", error);
          resolve();
        }
      );
    });
  }

  return initPromise;
}

export function getCurrentUser() {
  return currentUser;
}

export function isAuthenticated() {
  return !!currentUser;
}

export function subscribeAuth(listener) {
  listeners.add(listener);
  listener(currentUser);
}

export function unsubscribeAuth(listener) {
  listeners.delete(listener);
}

function notify() {
  listeners.forEach(l => l(currentUser));
}