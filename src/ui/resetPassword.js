import { createNavbar } from "./layout/navbar.js";
import { createFooter } from "./layout/footer.js";

import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { auth } from "../config/firebaseClient.js";
import { initAuth } from "../state/authState.js";

document.getElementById("navbar").append(createNavbar());
document.getElementById("footer").append(createFooter());

async function loadResetPasswordPage() {
  const email = document.getElementById("email");
  const btn = document.getElementById("resetBtn");

  let loadingInProcess = false;

  function validate() {
    btn.disabled = !email.value || loadingInProcess;
  }

  email.addEventListener("input", () => {
    validate();
  });

  btn.addEventListener("click", async () => {
    try {
      btn.disabled = true;
      loadingInProcess = true;
      await sendPasswordResetEmail(auth, email.value);
      alert("Reset email sent");
    } catch (e) {
      alert(e.message);
    }
    loadingInProcess = false;
    validate();
  });
};

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  loadResetPasswordPage();
});