import { APP_NAME_MAIN } from "../../data/constants.js";

export function createFooter() {
  const footer = document.createElement("footer");
  footer.className = "bg-light text-center p-3 mt-5";
  footer.textContent = "© 2026 Demo " + APP_NAME_MAIN;
  return footer;
}
