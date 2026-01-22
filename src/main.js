// Global bootstrap entry point

import { initAuth } from "./state/authState.js";

async function bootstrap() {
  await initAuth();

  // TODO: later decide landing page based on auth state
  window.location.replace("./home.html");
}

bootstrap();