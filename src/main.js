// Global bootstrap entry point

import { APP_NAME_MAIN } from "./data/constants.js";
import { initAuth, isAuthenticated } from "./state/authState.js";

async function bootstrap() {
  document.title = APP_NAME_MAIN;
  await initAuth();

  if (isAuthenticated()) {
    window.location.replace("./home.html");
  } else {
    window.location.replace("./login.html");
  }
}

bootstrap();