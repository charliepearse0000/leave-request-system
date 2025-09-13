import request from 'supertest';
import { LeaveType, LeaveTypeCategory } from '../../src/models/leave-type.entity';
import { createTestUser, createTestAdmin, getAuthToken, initializeTestDatabase, cleanupTestData, closeTestDatabase, createTestLeaveType } from '../helpers/test-utils';
import App from '../../src/app';

describe('LeaveType Routes E2E Tests', () => {
  let app: App;
  
  beforeAll(async () => {
    await initializeTestDatabase();
    app = new App();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('LeaveType CRUD Operations', () => {
    let adminToken: string;
    let userToken: string;
    let testUser: any;
    let testAdmin: any;
    let testLeaveType: LeaveType;

    beforeEach(async () => {
      testAdmin = await createTestAdmin();
      testUser = await createTestUser();
      adminToken = await getAuthToken(testAdmin);
      userToken = await getAuthToken(testUser);
      testLeaveType = await createTestLeaveType();
    });

    afterEach(async () => {
      await cleanupTestData();
    });

    describe('GET /leave-types', () => {
      it('should get all leave types when authenticated', async () => {
        const response = await request(app.getServer())
          .get('/api/leave-types')
          .set('Authorization', `Bearer ${userToken}`);
  
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBeGreaterThan(0);
      });
  
      it('should return 401 when not authenticated', async () => {
        const response = await request(app.getServer())
          .get('/api/leave-types');
  
        expect(response.status).toBe(401);
      });
    });
  
    describe('GET /leave-types/:id', () => {
      it('should get leave type by id when authenticated', async () => {
        const response = await request(app.getServer())
          .get(`/api/leave-types/${testLeaveType.id}`)
          .set('Authorization', `Bearer ${userToken}`);
  
        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testLeaveType.id);
        expect(response.body.name).toBe(testLeaveType.name);
      });
    });
  
    describe('POST /leave-types', () => {
      it('should create leave type when admin', async () => {
        const newLeaveType = {
          name: 'New Leave Type',
          description: 'New description',
          category: LeaveTypeCategory.OTHER,
          requiresApproval: true,
          deductsBalance: true
        };
  
        const response = await request(app.getServer())
          .post('/api/leave-types')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(newLeaveType);
  
        expect(response.status).toBe(201);
        expect(response.body.leaveType.name).toBe(newLeaveType.name);
        expect(response.body.leaveType.category).toBe(newLeaveType.category);
      });
  
      it('should return 403 when non-admin tries to create leave type', async () => {
        const newLeaveType = {
          name: 'New Leave Type',
          description: 'New description',
          category: LeaveTypeCategory.SICK,
          requiresApproval: true,
          deductsBalance: true
        };
  
        const response = await request(app.getServer())
          .post('/api/leave-types')
          .set('Authorization', `Bearer ${userToken}`)
          .send(newLeaveType);
  
        expect(response.status).toBe(403);
      });
    });
  
    describe('PUT /leave-types/:id', () => {
      it('should update leave type when admin', async () => {
        const updateData = {
          name: 'Updated Leave Type',
          description: 'Updated description'
        };
  
        const response = await request(app.getServer())
          .put(`/api/leave-types/${testLeaveType.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData);
  
        expect(response.status).toBe(200);
        expect(response.body.leaveType.name).toBe(updateData.name);
        expect(response.body.leaveType.description).toBe(updateData.description);
      });
  
      it('should return 403 when non-admin tries to update leave type', async () => {
        const updateData = {
          name: 'Updated Leave Type',
          description: 'Updated description'
        };
  
        const response = await request(app.getServer())
          .put(`/api/leave-types/${testLeaveType.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(updateData);
  
        expect(response.status).toBe(403);
      });
    });
  
    describe('DELETE /leave-types/:id', () => {
      it('should delete leave type when admin', async () => {
        const response = await request(app.getServer())
          .delete(`/api/leave-types/${testLeaveType.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
  
        expect(response.status).toBe(200);
        
        const getResponse = await request(app.getServer())
          .get(`/api/leave-types/${testLeaveType.id}`)
          .set('Authorization', `Bearer ${adminToken}`);
          
        expect(getResponse.status).toBe(404);
      });
  
      it('should return 403 when non-admin tries to delete leave type', async () => {
        const response = await request(app.getServer())
          .delete(`/api/leave-types/${testLeaveType.id}`)
          .set('Authorization', `Bearer ${userToken}`);
  
        expect(response.status).toBe(403);
      });
    });

  });
}); 