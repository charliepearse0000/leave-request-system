import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('http://localhost:3000/api/auth/login', () => {
    return HttpResponse.json({
      token: 'mock-jwt-token-12345',
      user: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        role: 'employee',
      },
    });
  }),

  http.post('http://localhost:3000/api/auth/register', () => {
    return HttpResponse.json({
      message: 'User registered successfully',
      user: {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
      },
    });
  }),

  http.get('http://localhost:3000/api/leave-requests/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Invalid token', status: 401 },
        { status: 401 }
      )
    }

    return HttpResponse.json([
      {
        id: '1',
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
        },
        leaveType: {
          id: '1',
          name: 'Annual Leave',
          description: 'Yearly vacation time',
          category: 'vacation',
          requiresApproval: true,
          deductsBalance: true,
        },
        startDate: '2024-01-15',
        endDate: '2024-01-20',
        duration: 5,
        status: 'pending',
        reason: 'Family vacation',
        submittedAt: '2024-01-01T10:00:00Z',
      },
    ]);
  }),

  http.get('http://localhost:3000/api/leave-requests/for-approval', () => {
    return HttpResponse.json([
      {
        id: '2',
        user: {
          id: '3',
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice.johnson@company.com',
        },
        leaveType: {
          id: '2',
          name: 'Sick Leave',
          description: 'Medical leave',
          category: 'medical',
          requiresApproval: false,
          deductsBalance: true,
        },
        startDate: '2024-02-01',
        endDate: '2024-02-03',
        duration: 3,
        status: 'pending',
        reason: 'Medical appointment',
        submittedAt: '2024-01-25T14:30:00Z',
      },
    ]);
  }),

  http.get('http://localhost:3000/api/leave-requests/all', () => {
    return HttpResponse.json([
      {
        id: '1',
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
        },
        leaveType: {
          id: '1',
          name: 'Annual Leave',
          description: 'Yearly vacation time',
          category: 'vacation',
          requiresApproval: true,
          deductsBalance: true,
        },
        startDate: '2024-01-15',
        endDate: '2024-01-20',
        duration: 5,
        status: 'approved',
        reason: 'Family vacation',
        submittedAt: '2024-01-01T10:00:00Z',
      },
      {
        id: '2',
        user: {
          id: '3',
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice.johnson@company.com',
        },
        leaveType: {
          id: '2',
          name: 'Sick Leave',
          description: 'Medical leave',
          category: 'medical',
          requiresApproval: false,
          deductsBalance: true,
        },
        startDate: '2024-02-01',
        endDate: '2024-02-03',
        duration: 3,
        status: 'pending',
        reason: 'Medical appointment',
        submittedAt: '2024-01-25T14:30:00Z',
      },
    ]);
  }),

  http.post('http://localhost:3000/api/leave-requests', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Invalid token', status: 401 },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      id: '3',
      user: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
      },
      leaveType: {
        id: '1',
        name: 'Annual Leave',
        description: 'Yearly vacation time',
        category: 'vacation',
        requiresApproval: true,
        deductsBalance: true,
      },
      startDate: '2024-02-01',
      endDate: '2024-02-05',
      duration: 4,
      status: 'pending' as const,
      reason: 'Personal time off',
      submittedAt: '2024-01-15T14:30:00Z',
    });
  }),

  http.post('http://localhost:3000/api/leave-requests/:id/approve', ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Invalid token', status: 401 },
        { status: 401 }
      )
    }

    return HttpResponse.json({});
  }),

  http.post('http://localhost:3000/api/leave-requests/:id/reject', ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Invalid token', status: 401 },
        { status: 401 }
      )
    }

    return HttpResponse.json({});
  }),

  http.post('http://localhost:3000/api/leave-requests/:id/cancel', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      user: {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
      },
      leaveType: {
        id: '1',
        name: 'Annual Leave',
        description: 'Yearly vacation time',
        category: 'vacation',
        requiresApproval: true,
        deductsBalance: true,
      },
      startDate: '2024-03-01',
      endDate: '2024-03-05',
      duration: 5,
      status: 'cancelled',
      reason: 'Spring break',
      submittedAt: '2024-02-15T10:00:00Z',
    });
  }),

  http.delete('http://localhost:3000/api/leave-requests/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      message: `Leave request ${params.id} deleted successfully`,
    });
  }),

  http.get('http://localhost:3000/api/users/:id', ({ request, params }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Invalid token', status: 401 },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      id: params.id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@company.com',
      role: {
        id: '1',
        name: 'Employee',
      },
      annualLeaveBalance: 20,
      sickLeaveBalance: 8,
    });
  }),

  http.get('http://localhost:3000/api/users', () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@company.com',
        role: 'employee',
        department: 'Engineering',
        leaveBalance: {
          annual: 20,
          sick: 10,
          personal: 5
        }
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        role: 'manager',
        department: 'HR',
        leaveBalance: {
          annual: 25,
          sick: 15,
          personal: 8
        }
      }
    ]);
  }),

  http.put('http://localhost:3000/api/users/:id', ({ params }) => {
    return HttpResponse.json({
      message: `User ${params.id} updated successfully`,
    });
  }),

  http.delete('http://localhost:3000/api/users/:id', ({ params }) => {
    return HttpResponse.json({ message: `User ${params.id} deleted` });
  }),

  http.post('http://localhost:3000/api/users/:id/role', ({ params }) => {
    return HttpResponse.json({ message: `Role updated for user ${params.id}` });
  }),

  http.post('http://localhost:3000/api/users/:id/leave-balance', ({ params }) => {
    return HttpResponse.json({ 
      message: `Leave balance updated for user ${params.id}` 
    });
  }),

  http.get('http://localhost:3000/api/leave-types', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Invalid token', status: 401 },
        { status: 401 }
      )
    }

    return HttpResponse.json([
      {
        id: '1',
        name: 'Annual Leave',
        category: 'vacation',
        maxDays: 25,
      },
      {
        id: '2',
        name: 'Sick Leave',
        category: 'medical',
        maxDays: 10,
      },
      {
        id: '3',
        name: 'Personal Leave',
        category: 'personal',
        maxDays: 5,
      },
    ]);
  }),

  http.get('http://localhost:3000/api/roles', () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'Employee',
        description: 'Standard employee role',
      },
      {
        id: '2',
        name: 'Manager',
        description: 'Team manager role',
      },
      {
        id: '3',
        name: 'Admin',
        description: 'System administrator role',
      },
    ]);
  }),
];