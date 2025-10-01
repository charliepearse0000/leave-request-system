import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Singleton Pattern: Single configuration instance
class Config {
  private static instance: Config;

  public readonly port: number;
  public readonly nodeEnv: string;
  public readonly db: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  public readonly jwt: {
    secret: string;
    expiresIn: string;
  };
  public readonly logLevel: string;

  private constructor() {
    this.port = parseInt(process.env.PORT || "3000", 10);
    this.nodeEnv = process.env.NODE_ENV || "development";
    this.db = {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432", 10),
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database:
        process.env.NODE_ENV === "test"
          ? "leave_management_test"
          : process.env.DB_DATABASE || "leave_management",
    };
    this.jwt = {
      secret: process.env.JWT_SECRET || "your_jwt_secret_key",
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    };
    this.logLevel = process.env.LOG_LEVEL || "info";
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }
}

export const config = Config.getInstance();
