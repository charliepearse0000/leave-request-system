import request from 'supertest';
import { createTestUser, createTestAdmin, initializeTestDatabase, cleanupTestData, closeTestDatabase } from '../helpers/test-utils';
import App from '../../src/app';
import { db } from '../../src/config/database';
import { User } from '../../src/models/user.entity';
import { RoleType } from '../../src/models/role.entity';
describe('Authentication Routes E2E Tests', () => {
  let app: App;
  
  beforeAll(async () => {
    await initializeTestDatabase();
    app = new App();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('Authentication Flow', () => {
    let testUser: any;
    let testAdmin: any;
    let userToken: string;

    beforeEach(async () => {
      testUser = await createTestUser();
      testAdmin = await createTestAdmin();
    });

    afterEach(async () => {
      await cleanupTestData();
    });

    describe('POST /auth/login', () => {
      it('should login with valid credentials', async () => {
        const loginData = {
          email: testUser.email,
          password: 'test123'
        };

        const response = await request(app.getServer())
          .post('/api/auth/login')
          .send(loginData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.user).not.toHaveProperty('password');
        
        userToken = response.body.token;
      });

      it('should login admin with valid credentials', async () => {
        const loginData = {
          email: testAdmin.email,
          password: 'admin123'
        };

        const response = await request(app.getServer())
          .post('/api/auth/login')
          .send(loginData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.role).toBe(RoleType.ADMIN);
      });

      it('should return 401 with invalid email', async () => {
        const loginData = {
          email: 'nonexistent@example.com',
          password: 'test123'
        };

        const response = await request(app.getServer())
          .post('/api/auth/login')
          .send(loginData);

        

        expect(response.status).toBe(401);
        expect(response.body.message).toContain('Invalid credentials');
      });

      it('should return 401 with invalid password', async () => {
        const loginData = {
          email: testUser.email,
          password: 'wrongpassword'
        };

        const response = await request(app.getServer())
          .post('/api/auth/login')
          .send(loginData);

        expect(response.status).toBe(401);
        expect(response.body.message).toContain('Invalid credentials');
      });

      it('should return 400 with missing email', async () => {
        const loginData = {
          password: 'test123'
        };

        const response = await request(app.getServer())
          .post('/api/auth/login')
          .send(loginData);

        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain('Valid email is required');
      });

      it('should return 400 with missing password', async () => {
        const loginData = {
          email: testUser.email
        };

        const response = await request(app.getServer())
          .post('/api/auth/login')
          .send(loginData);

        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain('Password is required');
      });

      it('should return 400 with invalid email format', async () => {
        const loginData = {
          email: 'invalid-email',
          password: 'test123'
        };

        const response = await request(app.getServer())
          .post('/api/auth/login')
          .send(loginData);

        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain('Valid email is required');
      });

      it('should return 400 with empty request body', async () => {
        const response = await request(app.getServer())
          .post('/api/auth/login')
          .send({});

        expect(response.status).toBe(400);
      });
    });

    describe('POST /auth/register', () => {
      it('should register new user with valid data', async () => {
        const registerData = {
          email: 'newuser@example.com',
          password: 'newpassword123',
          firstName: 'New',
          lastName: 'User'
        };

        const response = await request(app.getServer())
          .post('/api/auth/register')
          .send(registerData);


        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(registerData.email);
        expect(response.body.user).not.toHaveProperty('password');
      });

      it('should return 400 when email already exists', async () => {
        const registerData = {
          email: testUser.email,
          password: 'newpassword123',
          firstName: 'Duplicate',
          lastName: 'User'
        };

        const response = await request(app.getServer())
          .post('/api/auth/register')
          .send(registerData);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('User with this email already exists');
      });

      it('should return 400 with missing required fields', async () => {
        const registerData = {
          email: 'incomplete@example.com'
        };

        const response = await request(app.getServer())
          .post('/api/auth/register')
          .send(registerData);

        expect(response.status).toBe(400);
      });

      it('should return 400 with weak password', async () => {
        const registerData = {
          email: 'weakpass@example.com',
          password: '123',
          firstName: 'Weak',
          lastName: 'Password'
        };

        const response = await request(app.getServer())
          .post('/api/auth/register')
          .send(registerData);

        expect(response.status).toBe(400);
        expect(response.body.errors[0].msg).toContain('Password must be at least 6 characters long');
      });

      it('should hash password correctly', async () => {
        const registerData = {
          email: 'hashtest@example.com',
          password: 'testpassword123',
          firstName: 'Hash',
          lastName: 'Test'
        };

        const response = await request(app.getServer())
          .post('/api/auth/register')
          .send(registerData);

        expect(response.status).toBe(201);

        const userRepository = db.getDataSource().getRepository(User);
        const savedUser = await userRepository.findOne({ 
          where: { email: registerData.email } 
        });

        expect(savedUser?.password).not.toBe(registerData.password);
        expect(savedUser?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
      });
    });

    describe('JWT Token Validation', () => {
      it('should accept valid JWT token format', async () => {
        const loginResponse = await request(app.getServer())
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'test123'
          });

        const token = loginResponse.body.token;
        
        const tokenParts = token.split('.');
        expect(tokenParts).toHaveLength(3);
        
        const protectedResponse = await request(app.getServer())
          .get('/api/users')
          .set('Authorization', `Bearer ${token}`);

        expect(protectedResponse.status).toBe(200);
      });

      it('should reject tampered JWT token', async () => {
        const loginResponse = await request(app.getServer())
          .post('/api/auth/login')
          .send({
            email: testUser.email,
            password: 'test123'
          });

        let token = loginResponse.body.token;

        token = token.slice(0, -5) + 'XXXXX';

        const response = await request(app.getServer())
          .get('/api/users')
          .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(401);
        expect(response.body.message).toContain('Invalid token');
      });

      it('should reject token with invalid signature', async () => {
        const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.invalid_signature';

        const response = await request(app.getServer())
          .get('/api/users')
          .set('Authorization', `Bearer ${invalidToken}`);

        expect(response.status).toBe(401);
      });
    });
   
  });

  // describe('Additional Authentication Edge Cases', () => {
  //   describe('Token Edge Cases', () => {
  //     it('should handle token with extra whitespace', async () => {
  //       const token = await getAuthToken(testUser);
        
  //       const response = await request(app.getServer())
  //         .get('/api/users')
  //         .set('Authorization', `  Bearer   ${token}  `); // Extra whitespace

  //       expect([200, 401]).toContain(response.status);
  //     });

  //     it('should handle case-insensitive Bearer keyword', async () => {
  //       const token = await getAuthToken(testUser);
        
  //       const response = await request(app.getServer())
  //         .get('/api/users')
  //         .set('Authorization', `bearer ${token}`); // lowercase

  //       expect([200, 401]).toContain(response.status);
  //     });

  //     it('should handle multiple Authorization headers', async () => {
  //       const token = await getAuthToken(testUser);
        
  //       const response = await request(app.getServer())
  //         .get('/api/users')
  //         .set('Authorization', `Bearer ${token}`)
  //         .set('Authorization', `Bearer invalid-token`); // Second header overwrites

  //       expect(response.status).toBe(401);
  //     });
  //   });

  //   describe('Login Edge Cases', () => {
  //     it('should handle login with email containing plus sign', async () => {
  //       // Create user with plus in email
  //       const userWithPlus = await request(app.getServer())
  //         .post('/api/users')
  //         .set('Authorization', `Bearer ${adminToken}`)
  //         .send({
  //           email: 'test+tag@example.com',
  //           password: 'password123',
  //           firstName: 'Test',
  //           lastName: 'User',
  //           roleId: roles[1].id
  //         });

  //       const response = await request(app.getServer())
  //         .post('/api/auth/login')
  //         .send({
  //           email: 'test+tag@example.com',
  //           password: 'password123'
  //         });

  //       expect(response.status).toBe(200);
  //     });

  //     it('should handle login with email case variations', async () => {
  //       const response = await request(app.getServer())
  //         .post('/api/auth/login')
  //         .send({
  //           email: testUser.email.toUpperCase(),
  //           password: 'test123'
  //         });

  //       // Depending on implementation, might be case-sensitive or not
  //       expect([200, 401]).toContain(response.status);
  //     });

  //     it('should handle login with very long password', async () => {
  //       const longPassword = 'a'.repeat(1000);
        
  //       const response = await request(app.getServer())
  //         .post('/api/auth/login')
  //         .send({
  //           email: testUser.email,
  //           password: longPassword
  //         });

  //       expect(response.status).toBe(401);
  //     });
  //   });

  //   describe('Registration Edge Cases', () => {
  //     it('should handle registration with minimum valid data', async () => {
  //       const response = await request(app.getServer())
  //         .post('/api/auth/register')
  //         .send({
  //           email: 'min@example.com',
  //           password: '123456', // Minimum length
  //           firstName: 'A',
  //           lastName: 'B'
  //         });

  //       expect([201, 400]).toContain(response.status);
  //     });

  //     it('should handle registration with unicode characters', async () => {
  //       const response = await request(app.getServer())
  //         .post('/api/auth/register')
  //         .send({
  //           email: 'unicode@example.com',
  //           password: 'password123',
  //           firstName: '测试',
  //           lastName: 'Тест'
  //         });

  //       expect([201, 400]).toContain(response.status);
  //     });
  //   });
  // });
}); 