# Leave Management System API

A comprehensive REST API for managing employee leave requests with role-based access control, built with Node.js, TypeScript, Express, and TypeORM.

## 🚀 Features

- **JWT Authentication** with bcrypt-hashed passwords
- **Role-based Access Control** (Admin, Manager, Employee)
- **Complete CRUD operations** for Users, Roles, Leave Types, and Leave Requests
- **Manager approval/rejection workflow** for leave requests
- **Leave balance management** with automatic deduction
- **Comprehensive test coverage** (E2E tests)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database
- Git

## 🛠️ Setup

### 1. Install Dependencies

npm install

## 🏃‍♂️ Running the Application

### Development Mode
npm run dev

The server will start on `http://localhost:3000` with hot reload enabled.

note: you should know that you need postgre sql running. If you need the complete
environment, please go to the "Running with Docker" section

### Production Mode

npm run build

npm start

### Running with Docker (with PostgreSQL already)

You should ensure that you are providing the .env file with
the vars like in the examples provided. The
.env.development should work in your initial tests:

docker compose --env-file .env.development up -d

docker exec -it lm_app sh -c "npm run seed"


### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript code
- `npm start` - Start production server
- `npm run seed` - Run unit seeders
- `npm run test:e2e` - Run end-to-end tests

## 🧪 Running Tests

npm run test:e2e  - for all tests

npm run test:e2e ./tests/e2e/{file-pattern} - for specific file


## 🔐 Authentication & Authorization

### Default Test Users

After run seeder (npm run seed) you can use the predefined test users for different roles:

#### Admin User

email: "john.smith@company.com"
password: "password123"


#### Manager User

email: "sarah.johnson@company.com"
password: "password123"

#### Employee User

email: "emma.davis@company.com"
password: "password123"




## 📚 API Documentation

### Base URL
http://localhost:3000/api

### Authentication Endpoints

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout

### User Management

- `GET /users` - Get all users (Admin only)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user (Admin only)
- `PUT /users/:id` - Update user (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)
- `POST /users/:id/manager` - Assign manager (Admin only)
- `POST /users/:id/leave-balance` - Update leave balance (Admin only)

### Leave Request Management

- `GET /leave-requests/me` - Get own leave requests
- `GET /leave-requests/for-approval` - Get requests for approval (Manager/Admin)
- `GET /leave-requests/all` - Get all requests (Admin only)
- `GET /leave-requests/:id` - Get specific request
- `POST /leave-requests` - Create leave request
- `PUT /leave-requests/:id` - Update leave request
- `POST /leave-requests/:id/approve` - Approve request (Manager/Admin)
- `POST /leave-requests/:id/reject` - Reject request (Manager/Admin)
- `POST /leave-requests/:id/cancel` - Cancel own request
- `DELETE /leave-requests/:id` - Delete request (Admin only)

### Leave Type Management

- `GET /leave-types` - Get all leave types
- `GET /leave-types/:id` - Get leave type by ID
- `POST /leave-types` - Create leave type (Admin only)
- `PUT /leave-types/:id` - Update leave type (Admin only)
- `DELETE /leave-types/:id` - Delete leave type (Admin only)

### Role Management

- `GET /roles` - Get all roles
- `GET /roles/:id` - Get role by ID
- `POST /roles` - Create role (Admin only)
- `PUT /roles/:id` - Update role (Admin only)
- `DELETE /roles/:id` - Delete role (Admin only)






## 🏗️ Project Structure

src/
├── config/ # Database and app configuration
├── controllers/ # Request handlers
├── middlewares/ # Authentication, validation, error handling
├── models/ # TypeORM entities
├── routes/ # API route definitions
├── services/ # Business logic layer
├── strategies/ # Approval strategy patterns
├── seeders/ # Seeders to initial data with roles, leave types and users
├── factories/ # Factory patterns for leave types
└── app.ts # Express app setup
tests/
├── e2e/ # End-to-end tests
├── helpers/ # Test utilities
└── setup.ts # Test configuration





## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **JWT Token Issues**
   - Verify `JWT_SECRET` is set in `.env`
   - Check token format: `Bearer <token>`
   - Ensure token hasn't expired (24h default)

3. **Permission Denied Errors**
   - Verify user role and permissions
   - Check if user is authenticated
   - Ensure proper Authorization header

4. **Test Failures**
   - Ensure test database exists
   - Check if test database is clean
   - Verify all dependencies are installed