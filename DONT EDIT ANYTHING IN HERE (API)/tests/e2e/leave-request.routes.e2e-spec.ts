import request from 'supertest';
import { LeaveRequest, LeaveRequestStatus } from '../../src/models/leave-request.entity';
import { createTestUser, createTestAdmin, getAuthToken, initializeTestDatabase, cleanupTestData, closeTestDatabase, ensureRolesExist, createTestManager, leaveTypes, ensureLeaveTypesExist } from '../helpers/test-utils';
import App from '../../src/app';

describe('LeaveRequest Routes E2E Tests', () => {
  let app: App;
  
  beforeAll(async () => {
    await initializeTestDatabase();
    app = new App();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('LeaveRequest CRUD Operations', () => {
    let adminToken: string;
    let userToken: string;
    let managerToken: string;
    let testUser: any;
    let testAdmin: any;
    let testManager: any;
    let testLeaveType: any;
    let testLeaveRequest: LeaveRequest;

    beforeEach(async () => {
      await ensureLeaveTypesExist();
      testAdmin = await createTestAdmin();
      testUser = await createTestUser();
      testManager = await createTestManager();
      
      adminToken = await getAuthToken(testAdmin);
      userToken = await getAuthToken(testUser);
      managerToken = await getAuthToken(testManager);

      
      await request(app.getServer())
        .post(`/api/users/${testUser.id}/manager`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ managerId: testManager.id });
   
      testLeaveType = leaveTypes[0];
    });

    afterEach(async () => {
      await cleanupTestData();
    });

    describe('POST /leave-requests', () => {
      it('should create leave request Annual Leave when authenticated user', async () => {
        const leaveRequestData = {
          leaveTypeId: leaveTypes[0].id,
          startDate: '2024-12-25',
          endDate: '2024-12-27',
          reason: 'Christmas vacation'
        };

        const response = await request(app.getServer())
          .post('/api/leave-requests')
          .set('Authorization', `Bearer ${userToken}`)
          .send(leaveRequestData);

        expect(response.status).toBe(201);
        expect(response.body.leaveRequest.status).toBe(LeaveRequestStatus.PENDING);
        expect(response.body.leaveRequest.userId).toBe(testUser.id);
        expect(response.body.leaveRequest.duration).toBe(3);
        testLeaveRequest = response.body.leaveRequest;
      });

      it('should create leave request Sick Leavewhen authenticated user', async () => {
        const leaveRequestData = {
          leaveTypeId: leaveTypes[1].id,
          startDate: '2024-12-25',
          endDate: '2024-12-27',
          reason: 'Christmas vacation'
        };

        const response = await request(app.getServer())
          .post('/api/leave-requests')
          .set('Authorization', `Bearer ${userToken}`)
          .send(leaveRequestData);

        expect(response.status).toBe(201);
        expect(response.body.leaveRequest.status).toBe(LeaveRequestStatus.PENDING);
        expect(response.body.leaveRequest.userId).toBe(testUser.id);
        expect(response.body.leaveRequest.duration).toBe(3);
        testLeaveRequest = response.body.leaveRequest;
      });

      it('should return 401 when not authenticated', async () => {
        const leaveRequestData = {
          leaveTypeId: testLeaveType.id,
          startDate: '2024-12-25',
          endDate: '2024-12-27',
          reason: 'Christmas vacation'
        };

        const response = await request(app.getServer())
          .post('/api/leave-requests')
          .send(leaveRequestData);

        expect(response.status).toBe(401);
      });

      it('should validate required fields', async () => {
        const response = await request(app.getServer())
          .post('/api/leave-requests')
          .set('Authorization', `Bearer ${userToken}`)
          .send({});

        expect(response.status).toBe(400);
      });
    });

    describe('GET /leave-requests', () => {
      beforeEach(async () => {
        const response = await request(app.getServer())
          .post('/api/leave-requests')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            leaveTypeId: testLeaveType.id,
            startDate: '2024-12-25',
            endDate: '2024-12-27',
            reason: 'Test leave request'
          });
        testLeaveRequest = response.body.leaveRequest;
      });

      it('should get user own leave requests', async () => {
        const response = await request(app.getServer())
          .get('/api/leave-requests/me')
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].userId).toBe(testUser.id);
      });

      it('should get all leave requests when admin', async () => {
        const response = await request(app.getServer())
          .get('/api/leave-requests/all')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
      });

      it('should get team leave requests when manager', async () => {
        const response = await request(app.getServer())
          .get('/api/leave-requests/for-approval')
          .set('Authorization', `Bearer ${managerToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
      });
    });

    describe('GET /leave-requests/:id', () => {
      beforeEach(async () => {
        const response = await request(app.getServer())
          .post('/api/leave-requests')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            leaveTypeId: testLeaveType.id,
            startDate: '2024-12-25',
            endDate: '2024-12-27',
            reason: 'Test leave request'
          });

        testLeaveRequest = response.body.leaveRequest;
      });

      it('should get leave request by id when owner', async () => {
        const response = await request(app.getServer())
          .get(`/api/leave-requests/${testLeaveRequest.id}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testLeaveRequest.id);
      });

      it('should get leave request by id when admin', async () => {
        const response = await request(app.getServer())
          .get(`/api/leave-requests/${testLeaveRequest.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testLeaveRequest.id);
      });

      it('should return 403 when accessing other user leave request', async () => {
        const anotherUser: any = await createTestUser();
        const anotherUserToken = await getAuthToken(anotherUser);

        const response = await request(app.getServer())
          .get(`/api/leave-requests/${testLeaveRequest.id}`)
          .set('Authorization', `Bearer ${anotherUserToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe('PUT /leave-requests/:id', () => {
      beforeEach(async () => {
        const response = await request(app.getServer())
          .post('/api/leave-requests')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            leaveTypeId: testLeaveType.id,
            startDate: '2024-12-25',
            endDate: '2024-12-27',
            reason: 'Test leave request'
          });

        testLeaveRequest = response.body.leaveRequest;
      });

      it('should update leave request when owner and status is pending', async () => {
        const updateData = {
          reason: 'Updated reason',
        };

        const response = await request(app.getServer())
          .put(`/api/leave-requests/${testLeaveRequest.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.leaveRequest.reason).toBe(updateData.reason);
      });

      it('should return 403 when trying to update non-pending leave request', async () => {
        await request(app.getServer())
          .post(`/api/leave-requests/${testLeaveRequest.id}/approve`)
          .set('Authorization', `Bearer ${managerToken}`)
          .send({ comments: 'Approved' });

        const updateData = {
          reason: 'Updated reason'
        };

        const response = await request(app.getServer())
          .put(`/api/leave-requests/${testLeaveRequest.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send(updateData);

        expect(response.status).toBe(403);
      });
    });

    describe('Manager Approval Workflow', () => {
      beforeEach(async () => {
        const response = await request(app.getServer())
          .post('/api/leave-requests')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            leaveTypeId: testLeaveType.id,
            startDate: '2024-12-25',
            endDate: '2024-12-27',
            reason: 'Test leave request'
          });
        testLeaveRequest = response.body.leaveRequest;
      });

      describe('POST /leave-requests/:id/approve', () => {
        it('should approve leave request when manager', async () => {
          const response = await request(app.getServer())
            .post(`/api/leave-requests/${testLeaveRequest.id}/approve`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ comments: 'Approved by manager' });

          expect(response.status).toBe(200);
          expect(response.body.leaveRequest.status).toBe(LeaveRequestStatus.APPROVED);
          expect(response.body.leaveRequest.comments).toBe('Approved by manager');
          expect(response.body.leaveRequest.approvedById).toBe(testManager.id);
        });

        it('should approve leave request when admin', async () => {
          const response = await request(app.getServer())
            .post(`/api/leave-requests/${testLeaveRequest.id}/approve`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ comments: 'Approved by admin' });

          expect(response.status).toBe(200);
          expect(response.body.leaveRequest.status).toBe(LeaveRequestStatus.APPROVED);
        });

        it('should return 403 when regular user tries to approve', async () => {
          const response = await request(app.getServer())
            .post(`/api/leave-requests/${testLeaveRequest.id}/approve`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ comments: 'Trying to approve own request' });

          expect(response.status).toBe(403);
        });

        it('should return 400 when trying to approve non-pending request', async () => {
          await request(app.getServer())
            .post(`/api/leave-requests/${testLeaveRequest.id}/approve`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ comments: 'First approval' });

          const response = await request(app.getServer())
            .post(`/api/leave-requests/${testLeaveRequest.id}/approve`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ comments: 'Second approval attempt' });

          expect(response.status).toBe(400);
        });
      });

      describe('POST /leave-requests/:id/reject', () => {
        it('should reject leave request when manager', async () => {
          const response = await request(app.getServer())
            .post(`/api/leave-requests/${testLeaveRequest.id}/reject`)
            .set('Authorization', `Bearer ${managerToken}`)
            .send({ comments: 'Rejected due to business needs' });

          expect(response.status).toBe(200);
          expect(response.body.leaveRequest.status).toBe(LeaveRequestStatus.REJECTED);
          expect(response.body.leaveRequest.comments).toBe('Rejected due to business needs');
          expect(response.body.leaveRequest.approvedById).toBe(testManager.id);
        });

        it('should reject leave request when admin', async () => {
          const response = await request(app.getServer())
            .post(`/api/leave-requests/${testLeaveRequest.id}/reject`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ comments: 'Rejected by admin' });

          expect(response.status).toBe(200);
          expect(response.body.leaveRequest.status).toBe(LeaveRequestStatus.REJECTED);
        });

        it('should return 403 when regular user tries to reject', async () => {
          const response = await request(app.getServer())
            .post(`/api/leave-requests/${testLeaveRequest.id}/reject`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({ comments: 'Trying to reject own request' });

          expect(response.status).toBe(403);
        });
      });
    });

    describe('POST /leave-requests/:id/cancel', () => {
      beforeEach(async () => {
        const response = await request(app.getServer())
          .post('/api/leave-requests')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            leaveTypeId: testLeaveType.id,
            startDate: '2024-12-25',
            endDate: '2024-12-27',
            reason: 'Test leave request'
          });
        testLeaveRequest = response.body.leaveRequest;
      });

      it('should cancel leave request when owner and status is pending', async () => {
        const response = await request(app.getServer())
          .post(`/api/leave-requests/${testLeaveRequest.id}/cancel`)
          .set('Authorization', `Bearer ${userToken}`)

        expect(response.status).toBe(200);
        expect(response.body.leaveRequest.status).toBe(LeaveRequestStatus.CANCELLED);
      });

      it('should return 400 when trying to cancel approved request', async () => {
        await request(app.getServer())
          .post(`/api/leave-requests/${testLeaveRequest.id}/approve`)
          .set('Authorization', `Bearer ${managerToken}`)
          .send({ comments: 'Approved' });

        const response = await request(app.getServer())
          .post(`/api/leave-requests/${testLeaveRequest.id}/cancel`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ comments: 'Trying to cancel approved request' });

        expect(response.status).toBe(400);
      });

      it('should return 400 when trying to cancel rejected request', async () => {
        await request(app.getServer())
          .post(`/api/leave-requests/${testLeaveRequest.id}/reject`)
          .set('Authorization', `Bearer ${managerToken}`)
          .send({ comments: 'Rejected' });

        const response = await request(app.getServer())
          .post(`/api/leave-requests/${testLeaveRequest.id}/cancel`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ comments: 'Trying to cancel rejected request' });

        expect(response.status).toBe(400);
      });

    });

    describe('DELETE /leave-requests/:id', () => {
      beforeEach(async () => {
        const response = await request(app.getServer())
          .post('/api/leave-requests')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            leaveTypeId: testLeaveType.id,
            startDate: '2024-12-25',
            endDate: '2024-12-27',
            reason: 'Test leave request'
          });
        testLeaveRequest = response.body.leaveRequest;
      });

      it('should delete leave request when admin', async () => {
        const response = await request(app.getServer())
          .delete(`/api/leave-requests/${testLeaveRequest.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);

        const getResponse = await request(app.getServer())
          .get(`/api/leave-requests/${testLeaveRequest.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(getResponse.status).toBe(404);
      });

      it('should return 403 when regular user tries to delete', async () => {
        const response = await request(app.getServer())
          .delete(`/api/leave-requests/${testLeaveRequest.id}`)
          .set('Authorization', `Bearer ${userToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe('Leave Balance Validation', () => {
      it('should return 400 when insufficient leave balance', async () => {
        const { body: user } = await request(app.getServer())
          .post(`/api/users/${testUser.id}/leave-balance`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            annualLeaveChange: 1,
            sickLeaveChange: 1,
          });


        const leaveRequestData = {
          leaveTypeId: testLeaveType.id,
          startDate: '2025-12-01',
          endDate: '2025-12-31',
          reason: 'Insufficient balance test'
        };

        const response = await request(app.getServer())
          .post('/api/leave-requests')
          .set('Authorization', `Bearer ${userToken}`)
          .send(leaveRequestData);

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('Insufficient');
      });
    });

    describe('Additional LeaveRequest Test Cases', () => {
        beforeEach(async () => {
            const response = await request(app.getServer())
              .post('/api/leave-requests')
              .set('Authorization', `Bearer ${userToken}`)
              .send({
                leaveTypeId: testLeaveType.id,
                startDate: '2024-12-25',
                endDate: '2024-12-27',
                reason: 'Test leave request'
              });
            testLeaveRequest = response.body.leaveRequest;
          });
      
        describe('GET /leave-requests/me', () => {
          beforeEach(async () => {
            await request(app.getServer())
              .post('/api/leave-requests')
              .set('Authorization', `Bearer ${userToken}`)
              .send({
                leaveTypeId: testLeaveType.id,
                startDate: '2024-12-25',
                endDate: '2024-12-27',
                duration: 3,
                reason: 'First request'
              });
      
            await request(app.getServer())
              .post('/api/leave-requests')
              .set('Authorization', `Bearer ${userToken}`)
              .send({
                leaveTypeId: testLeaveType.id,
                startDate: '2025-01-15',
                endDate: '2025-01-17',
                duration: 3,
                reason: 'Second request'
              });
          });
      
          it('should get only current user own leave requests', async () => {
            const response = await request(app.getServer())
              .get('/api/leave-requests/me')
              .set('Authorization', `Bearer ${userToken}`);
      
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBeTruthy();
            expect(response.body.length).toBe(3);
            response.body.forEach((request: any) => {
              expect(request.userId).toBe(testUser.id);
            });
          });
      
          it('should return empty array when user has no requests', async () => {
            const newUser: any = await createTestUser();
            const newUserToken = await getAuthToken(newUser);
      
            const response = await request(app.getServer())
              .get('/api/leave-requests/me')
              .set('Authorization', `Bearer ${newUserToken}`);
      
            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
          });
        });
      
        describe('GET /leave-requests/user/:userId', () => {
          let anotherUser: any;
          let anotherUserToken: string;
      
          beforeEach(async () => {
            anotherUser = await createTestUser();
            anotherUserToken = await getAuthToken(anotherUser);
      
            await request(app.getServer())
              .post('/api/leave-requests')
              .set('Authorization', `Bearer ${anotherUserToken}`)
              .send({
                leaveTypeId: testLeaveType.id,
                startDate: '2024-12-25',
                endDate: '2024-12-27',
                duration: 3,
                reason: 'Another user request'
              });
          });
      
          it('should get leave requests for specific user when admin', async () => {
            const response = await request(app.getServer())
              .get(`/api/leave-requests/user/${anotherUser.id}`)
              .set('Authorization', `Bearer ${adminToken}`);
      
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBeTruthy();
            response.body.forEach((request: any) => {
              expect(request.userId).toBe(anotherUser.id);
            });
          });
      
          it('should allow user to get their own requests', async () => {
            const response = await request(app.getServer())
              .get(`/api/leave-requests/user/${testUser.id}`)
              .set('Authorization', `Bearer ${userToken}`);
      
            expect(response.status).toBe(200);
          });
      
          it('should return 403 when user tries to access another user requests', async () => {
            const response = await request(app.getServer())
              .get(`/api/leave-requests/user/${anotherUser.id}`)
              .set('Authorization', `Bearer ${userToken}`);
      
            expect(response.status).toBe(403);
          });
        });
 
        describe('Edge Cases and Error Handling', () => {
          it('should return 404 for non-existent leave request', async () => {
            const fakeId = '123e4567-e89b-12d3-a456-426614174000';
            
            const response = await request(app.getServer())
              .get(`/api/leave-requests/${fakeId}`)
              .set('Authorization', `Bearer ${userToken}`);
      
            expect(response.status).toBe(404);
          });
        });
      
        describe('Manager Hierarchy Validation', () => {
          let subordinateUser: any;
          let subordinateToken: string;
      
          beforeEach(async () => {
            subordinateUser = await createTestUser();
            subordinateToken = await getAuthToken(subordinateUser);
      
            await request(app.getServer())
              .post(`/api/users/${subordinateUser.id}/manager`)
              .set('Authorization', `Bearer ${adminToken}`)
              .send({ managerId: testManager.id });
          });
      
          it('should allow manager to approve subordinate request', async () => {
            const createResponse = await request(app.getServer())
              .post('/api/leave-requests')
              .set('Authorization', `Bearer ${subordinateToken}`)
              .send({
                leaveTypeId: testLeaveType.id,
                startDate: '2024-12-25',
                endDate: '2024-12-27',
                reason: 'Subordinate request'
              });
            
      
            const requestId = createResponse.body.leaveRequest.id;
      
            const response = await request(app.getServer())
              .post(`/api/leave-requests/${requestId}/approve`)
              .set('Authorization', `Bearer ${managerToken}`)
              .send({ comments: 'Approved by manager' });
      
            expect(response.status).toBe(200);
          });
      
          it('should prevent manager from approving non-subordinate request', async () => {
            const anotherManager: any = await createTestManager();
            const anotherManagerToken = await getAuthToken(anotherManager);

            const createResponse = await request(app.getServer())
              .post('/api/leave-requests')
              .set('Authorization', `Bearer ${userToken}`)
              .send({
                leaveTypeId: testLeaveType.id,
                startDate: '2024-12-25',
                endDate: '2024-12-27',
                reason: 'Non-subordinate request'
              });
      
            const requestId = createResponse.body.leaveRequest.id;
      
            const response = await request(app.getServer())
              .post(`/api/leave-requests/${requestId}/approve`)
              .set('Authorization', `Bearer ${anotherManagerToken}`)
              .send({ comments: 'Trying to approve' });

      
            expect(response.status).toBe(400);
            expect(response.body.message).toContain('permission');
          });
        });
      });
  });
});
