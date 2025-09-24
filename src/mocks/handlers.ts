import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock handler for POST /login
  http.post('/login', () => {
    return HttpResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'employee'
        },
        token: 'mock-jwt-token-12345',
        expiresIn: '24h'
      }
    })
  }),

  // Mock handler for GET /leave
  http.get('/leave', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          employeeId: 1,
          type: 'annual',
          startDate: '2025-01-15',
          endDate: '2025-01-19',
          duration: 5,
          status: 'approved',
          reason: 'Family vacation',
          appliedDate: '2025-01-01'
        },
        {
          id: 2,
          employeeId: 1,
          type: 'sick',
          startDate: '2025-02-10',
          endDate: '2025-02-12',
          duration: 3,
          status: 'pending',
          reason: 'Medical appointment',
          appliedDate: '2025-02-08'
        }
      ]
    })
  }),

  // Mock handler for POST /leave (submit new leave request)
  http.post('/leave', () => {
    return HttpResponse.json({
      success: true,
      message: 'Leave request submitted successfully',
      data: {
        id: 3,
        employeeId: 1,
        type: 'annual',
        startDate: '2025-03-01',
        endDate: '2025-03-05',
        duration: 5,
        status: 'pending',
        reason: 'Personal time off',
        appliedDate: '2025-02-20'
      }
    })
  }),

  // Example handler for a GET request
  http.get('/api/example', () => {
    return HttpResponse.json({
      message: 'This is a mocked response'
    })
  })
]