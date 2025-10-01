import { DataSource } from 'typeorm';
import { User } from '../models/user.entity';
import { Role } from '../models/role.entity';
import { LeaveRequest } from '../models/leave-request.entity';
import { LeaveType } from '../models/leave-type.entity';
import { config } from './env';
import { logger } from './logger';

// Singleton Pattern: Only one database connection instance is created
class Database {
  private static instance: Database;
  private appDataSource: DataSource;

  private constructor() {
    this.appDataSource = new DataSource({
      type: 'postgres',
      host: config.db.host,
      port: config.db.port,
      username: config.db.username,
      password: config.db.password,
      database: config.db.database,
      entities: [User, Role, LeaveRequest, LeaveType],
      synchronize: config.nodeEnv === 'development' || config.nodeEnv === 'test',
      logging: false,
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async initialize(): Promise<DataSource> {
    try {
      if (!this.appDataSource.isInitialized) {
        await this.appDataSource.initialize();
        logger.info('Database connection established');
      }
      return this.appDataSource;
    } catch (error) {
      logger.error('Error connecting to database', error);
      throw error;
    }
  }

  public getDataSource(): DataSource {
    return this.appDataSource;
  }
}

export const db = Database.getInstance();
export const dataSource = db.getDataSource(); 