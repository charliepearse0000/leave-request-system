import pino from 'pino';
import { config } from './env';

// Singleton Pattern: Single logger instance for the entire application
class Logger {
  private static instance: Logger;
  private pinoLogger: pino.Logger;

  private constructor() {
    this.pinoLogger = pino({
      level: config.logLevel,
      transport: config.nodeEnv === 'development' 
        ? { target: 'pino-pretty' } 
        : undefined,
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
    });
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public getLogger(): pino.Logger {
    return this.pinoLogger;
  }
}

export const logger = Logger.getInstance().getLogger(); 