import request from 'supertest';
import { createTestUser, createTestAdmin, getAuthToken, initializeTestDatabase, cleanupTestData, closeTestDatabase, roles } from '../helpers/test-utils';
import App from '../../src/app';

describe('Role Routes E2E Tests', () => {
  let app: App;
  
  beforeAll(async () => {
    await initializeTestDatabase();
    app = new App();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('Role CRUD Operations', () => {
    let adminToken: string;
    let userToken: string;
    let testUser: any;
    let testAdmin: any;
    let testRole: any;

    beforeEach(async () => {
      testAdmin = await createTestAdmin();
      testUser = await createTestUser();
      adminToken = await getAuthToken(testAdmin);
      userToken = await getAuthToken(testUser);
      testRole = roles[0];
    });

    afterEach(async () => {
      await cleanupTestData();
    });


    describe('POST /roles', () => {
      it('should create a new role when admin', async () => {
        const response = await request(app.getServer())
          .post('/api/roles/create-defaults')
          .set('Authorization', `Bearer ${adminToken}`)

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Default roles created successfully');
      });
    });

    describe('GET /roles', () => {
      it('should get all roles when authenticated', async () => {
        const response = await request(app.getServer())
          .get('/api/roles')
          .set('Authorization', `Bearer ${userToken}`);
  
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBeGreaterThan(0);
      });
  
      it('should return 401 when not authenticated', async () => {
        const response = await request(app.getServer())
          .get('/api/roles');
  
        expect(response.status).toBe(401);
      });
    });
  
    describe('GET /roles/:id', () => {
      it('should get role by id when authenticated', async () => {
        const response = await request(app.getServer())
          .get(`/api/roles/${roles[0].id}`)
          .set('Authorization', `Bearer ${userToken}`);
  
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(roles[0].id);
        expect(response.body.name).toBe(roles[0].name);
      });

      it('should return 404 when role not found', async () => {
        const response = await request(app.getServer())
          .get(`/api/roles/5596b6ac-2059-4a6f-8522-4180c3c82e1a`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(404);
      });
    });
  
    describe('PUT /roles/:id', () => {
      it('should update role when admin', async () => {
        const updateData = {
          description: 'Updated Role Description'
        };
  
        const response = await request(app.getServer())
          .put(`/api/roles/${roles[0].id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData);
  
        expect(response.status).toBe(200);
        expect(response.body.role.description).toBe(updateData.description);
      });
  
      it('should return 403 when non-admin tries to update role', async () => {
        const updateData = {
          description: 'Updated Role Description'
        };
  
        const response = await request(app.getServer())
          .put(`/api/roles/${roles[0].id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(updateData);
  
        expect(response.status).toBe(403);
      });
    });
  });

  
}); 