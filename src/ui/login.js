import { createNavbar } from "./layout/navbar.js";
import { createFooter } from "./layout/footer.js";

import { auth } from "../config/firebaseClient.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getCurrentUser, initAuth, isAuthenticated } from "../state/authState.js";
import { PASSWORD_LENGTH_MIN } from "../data/constants.js";


document.getElementById("navbar").append(createNavbar());
document.getElementById("footer").append(createFooter());

async function loadLoginPage() {
  await initAuth();
  if (isAuthenticated())
  {
    window.location.replace("./home.html");
  }

  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const btn = document.getElementById("loginBtn");

  let loadingInProcess = false;

  function validate() {
    btn.disabled = !email.value || password.value.length < PASSWORD_LENGTH_MIN || loadingInProcess;
  }

  email.addEventListener("input", validate);
  password.addEventListener("input", validate);

  btn.addEventListener("click", async () => {
    try {
      btn.disabled = true;
      loadingInProcess = true;
      await signInWithEmailAndPassword(auth, email.value, password.value);
      window.location.replace("./home.html");
    } catch (e) {
      alert(e.message);
    }
    loadingInProcess = false;
    validate();
  });
};

document.addEventListener("DOMContentLoaded", () => {
  loadLoginPage();
});