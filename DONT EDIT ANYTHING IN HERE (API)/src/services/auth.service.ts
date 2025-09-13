import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { dataSource } from '../config/database';
import { config } from '../config/env';
import { logger } from '../config/logger';

export class AuthService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = dataSource.getRepository(User);
  }

  async register(userData: User): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const salt = bcrypt.genSaltSync(14);
      const hashedPassword = bcrypt.hashSync(userData.password, salt);

      // Create new user
      const user = this.userRepository.create({
        ...userData,
        password: hashedPassword
      });

      return await this.userRepository.save(user);
    } catch (error) {
      logger.error('Error in user registration', { error });
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{ user: Partial<User>, token: string }> {
    try {
      // Find user by email
      const user = await this.userRepository.findOne({
        where: { email },
        relations: ['role']
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate JWT token
      const token = this.generateToken(user);

      // Return user data (excluding password) and token
      const { password: _, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      logger.error('Error in user login', { error });
      throw error;
    }
  }

  private generateToken(user: User): string {
    return jwt.sign(
      { 
        id: user.id,
        email: user.email,
        role: user.role?.name
      },
      config.jwt.secret as Secret,
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.jwt.secret as Secret);
    } catch (error) {
      logger.error('Error verifying token', { error });
      throw new Error('Invalid token');
    }
  }
} 