import express from "express";
import cors from "cors";
import { routes } from "./routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { loggerMiddleware } from "./middlewares/logger.middleware";
import { logger } from "./config/logger";
import { db } from "./config/database";

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors());
    this.app.use(loggerMiddleware);
  }

  private initializeRoutes(): void {
    this.app.use("/api", routes);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware);
  }

  public async listen(port: number) {
    try {
      // Initialize database connection
      await db.initialize();

      this.app.listen(port, () => {
        logger.info(`Server running on port ${port}`);
      });
    } catch (error) {
      logger.error("Error starting server", error);
      process.exit(1);
    }
  }

  public getServer(): express.Application {
    return this.app;
  }
}

export default App;
