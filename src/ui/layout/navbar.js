import { auth } from "../../config/firebaseClient.js"
import { isAuthenticated, subscribeAuth } from "../../state/authState.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export function createNavbar() {
  const nav = document.createElement("nav");
  nav.className = "navbar navbar-expand-lg navbar-dark bg-dark";

  nav.innerHTML = `
    <div class="container">
      <span class="navbar-brand">PyShop</span>
      <div class="navbar-nav ms-auto" id="nav-links"></div>
    </div>
  `;

  const linksContainer = nav.querySelector("#nav-links");

  function render() {
    linksContainer.innerHTML = "";

    linksContainer.append(link("Home", "./home.html"));
    linksContainer.append(link("Products", "./products.html"));

    if (isAuthenticated()) {
      linksContainer.append(link("Cart", "./cart.html"));
      linksContainer.append(link("Profile", "./profile.html"));
      linksContainer.append(link("Sign out", "#", true));
    } else {
      linksContainer.append(link("Sign in", "./login.html"));
    }
  }

  subscribeAuth(render);
  render();

  return nav;
}

function link(text, href, isButton = false) {
  const a = document.createElement("a");
  a.className = "nav-link";
  a.textContent = text;
  a.href = href;

  // sign-out handler
  if (isButton) {
    a.addEventListener("click", e => {
      e.preventDefault();
      signOut(auth);
    });
  }

  return a;
}