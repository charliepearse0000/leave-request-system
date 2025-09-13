import request from "supertest";
import {
  createTestUser,
  createTestAdmin,
  getAuthToken,
  initializeTestDatabase,
  cleanupTestData,
  closeTestDatabase,
  roles,
  leaveTypes,
} from "../helpers/test-utils";
import App from "../../src/app";

describe("User Routes E2E Tests", () => {
  let app: App;

  beforeAll(async () => {
    await initializeTestDatabase();
    app = new App();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe("User CRUD Operations", () => {
    let adminToken: string;
    let userToken: string;
    let testUser: any;
    let testAdmin: any;

    beforeEach(async () => {
      testAdmin = await createTestAdmin();
      testUser = await createTestUser();
      adminToken = await getAuthToken(testAdmin);
      userToken = await getAuthToken(testUser);
    });

    afterEach(async () => {
      await cleanupTestData();
    });

    describe("GET /users", () => {
      it("should get all users when authenticated", async () => {
        const response = await request(app.getServer())
          .get("/api/users")
          .set("Authorization", `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBeTruthy();
      });

      it("should return 401 when not authenticated", async () => {
        const response = await request(app.getServer()).get("/api/users");

        expect(response.status).toBe(401);
      });
    });

    describe("GET /users/:id", () => {
      it("should get user by id when authenticated", async () => {
        const response = await request(app.getServer())
          .get(`/api/users/${testUser.id}`)
          .set("Authorization", `Bearer ${userToken}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(testUser.id);
      });
    });

    describe("PUT /users/:id", () => {
      it("should update user when authenticated", async () => {
        const updateData = {
          firstName: "Updated",
          lastName: "User",
        };

        const response = await request(app.getServer())
          .put(`/api/users/${testUser.id}`)
          .set("Authorization", `Bearer ${userToken}`)
          .send(updateData);

        expect(response.status).toBe(200);
        expect(response.body.user.firstName).toBe(updateData.firstName);
      });
    });

    describe("DELETE /users/:id", () => {
      it("should delete user when admin", async () => {
        const userForDelete = await createTestUser();

        const response = await request(app.getServer())
          .delete(`/api/users/${userForDelete.id}`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });

      it("should return 403 when non-admin tries to delete", async () => {
        const response = await request(app.getServer())
          .delete(`/api/users/${testUser.id}`)
          .set("Authorization", `Bearer ${userToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe("POST /users/:id/role", () => {
      it("should assign role when admin", async () => {
        const roleData = {
          roleId: roles[1].id,
        };

        const response = await request(app.getServer())
          .post(`/api/users/${testUser.id}/role`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(roleData);

        expect(response.status).toBe(200);
      });
    });

    describe("POST /users/:id/manager", () => {
      it("should assign manager when admin", async () => {
        const managerData = {
          managerId: testAdmin.id,
        };

        const response = await request(app.getServer())
          .post(`/api/users/${testUser.id}/manager`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(managerData);

        expect(response.status).toBe(200);
      });
    });

    describe("POST /users/:id/leave-balance", () => {
      it("should update leave balance when admin", async () => {
        const leaveBalanceData = {
          annualLeave: 20,
          sickLeave: 10,
        };

        const response = await request(app.getServer())
          .post(`/api/users/${testUser.id}/leave-balance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(leaveBalanceData);

        expect(response.status).toBe(200);
      });

      it("should return 403 when non-admin tries to update leave balance", async () => {
        const response = await request(app.getServer())
          .post(`/api/users/${testUser.id}/leave-balance`)
          .set("Authorization", `Bearer ${userToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe("Edge Cases and Error Scenarios", () => {
      it("should handle malformed JSON in request body", async () => {
        const response = await request(app.getServer())
          .post("/api/users")
          .set("Authorization", `Bearer ${adminToken}`)
          .set("Content-Type", "application/json")
          .send('{"invalid": json}');

        expect([400, 500]).toContain(response.status);
      });

      it("should handle user deletion with existing leave requests", async () => {
        await request(app.getServer())
          .post("/api/leave-requests")
          .set("Authorization", `Bearer ${userToken}`)
          .send({
            leaveTypeId: leaveTypes[0].id,
            startDate: "2024-12-25",
            endDate: "2024-12-27",
            reason: "Test leave",
          });

        const response = await request(app.getServer())
          .delete(`/api/users/${testUser.id}`)
          .set("Authorization", `Bearer ${adminToken}`);

        // Should handle foreign key constraints appropriately
        expect([200, 400, 409]).toContain(response.status);
      });
    });

    describe("Manager Assignment Edge Cases", () => {
      it("should prevent circular manager assignments", async () => {
        const manager1 = await createTestUser();
        const manager2 = await createTestUser();

        await request(app.getServer())
          .post(`/api/users/${manager2.id}/manager`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ managerId: manager1.id });

        const response = await request(app.getServer())
          .post(`/api/users/${manager1.id}/manager`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ managerId: manager2.id });

        expect([400, 409]).toContain(response.status);
      });

      it("should handle self-assignment as manager", async () => {
        const response = await request(app.getServer())
          .post(`/api/users/${testUser.id}/manager`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ managerId: testUser.id });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain("Only managers or admins can be assigned as managers");
      });
    });

    describe("Leave Balance Edge Cases", () => {
      it("should handle negative leave balance updates", async () => {
        const response = await request(app.getServer())
          .post(`/api/users/${testUser.id}/leave-balance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            annualLeaveChange: -5,
            sickLeaveChange: -10,
          });

        expect([200, 400]).toContain(response.status);
      });

      it("should handle extremely large leave balance values", async () => {
        const response = await request(app.getServer())
          .post(`/api/users/${testUser.id}/leave-balance`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            annualLeave: 999999,
            sickLeave: 999999,
          });

        expect([200, 400]).toContain(response.status);
      });
    });
  });
});
