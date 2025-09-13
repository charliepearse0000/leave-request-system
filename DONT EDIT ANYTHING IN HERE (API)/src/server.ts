import App from "./app";
import { config } from "./config/env";
import { logger } from "./config/logger";

const app = new App();

process.on("uncaughtException", (error) => {
  console.log(error);
  logger.error("Uncaught exception", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.log(reason, promise);
  logger.error("Unhandled rejection", { reason, promise });
  process.exit(1);
});

app
  .listen(config.port)
  .catch((error) => {
    logger.error("Failed to start server", error);
    process.exit(1);
  });
