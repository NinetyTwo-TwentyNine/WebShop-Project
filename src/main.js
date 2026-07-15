// Global bootstrap entry point

import { APP_NAME_MAIN } from "./data/constants.js";
import { initAuth } from "./state/authState.js";

async function bootstrap() {
  document.title = APP_NAME_MAIN;
  await initAuth();

  // TODO: later decide landing page based on auth state
  window.location.replace("./home.html");
}

bootstrap();