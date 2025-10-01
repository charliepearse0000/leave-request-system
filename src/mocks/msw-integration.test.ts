import { apiService } from '../app/services/api'
import './setup'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('MSW Integration Tests', () => {

  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear.mockClear()
  })

  describe('Authentication API', () => {
    it('should mock login API call', async () => {
      const credentials = {
        email: 'john.doe@company.com',
        password: 'password123'
      }

      const response = await apiService.login(credentials)

      expect(response).toEqual({
        token: 'mock-jwt-token-12345',
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@company.com',
          role: 'employee',
        },
      })
    })
  })

  describe('Leave Requests API', () => {
    beforeEach(async () => {
      const loginResponse = await apiService.login({
        email: 'john.doe@company.com',
        password: 'password123'
      })
      
      apiService.setAuthToken(loginResponse.token)
      localStorageMock.setItem('userData', JSON.stringify(loginResponse.user))
    })

    it('should mock get leave requests API call', async () => {
      const response = await apiService.getLeaveRequests()

      expect(Array.isArray(response)).toBe(true)
      expect(response.length).toBeGreaterThan(0)
      expect(response[0]).toHaveProperty('id')
      expect(response[0]).toHaveProperty('user')
      expect(response[0]).toHaveProperty('leaveType')
      expect(response[0]).toHaveProperty('status')
    })

    it('should mock create leave request API call', async () => {
      const requestData = {
        leaveTypeId: '1',
        startDate: '2024-01-15',
        endDate: '2024-01-16',
        reason: 'Personal time off',
        duration: 2
      }

      const response = await apiService.createLeaveRequest(requestData)

      expect(response).toHaveProperty('id')
      expect(response).toHaveProperty('user')
      expect(response).toHaveProperty('leaveType')
      expect(response.status).toBe('pending')
    })

    it('should mock approve leave request API call', async () => {
      const requestId = '1'
      const comments = 'Approved for vacation'
      
      const result = await apiService.approveLeaveRequest(requestId, comments)
      expect(result).toEqual({})
    })

    it('should mock reject leave request API call', async () => {
      const requestId = '1'
      const comments = 'Insufficient leave balance'
      
      const result = await apiService.rejectLeaveRequest(requestId, comments)
      expect(result).toEqual({})
    })
  })

  describe('User Management API', () => {
    beforeEach(async () => {
      const loginResponse = await apiService.login({
        email: 'john.doe@company.com',
        password: 'password123'
      })
      
      apiService.setAuthToken(loginResponse.token)
      localStorageMock.setItem('userData', JSON.stringify(loginResponse.user))
    })

    it('should mock get user profile API call', async () => {
      const response = await apiService.getUserProfile()

      expect(response).toHaveProperty('id')
      expect(response).toHaveProperty('firstName')
      expect(response).toHaveProperty('lastName')
      expect(response).toHaveProperty('email')
      expect(response).toHaveProperty('role')
      expect(response).toHaveProperty('annualLeaveBalance')
      expect(response).toHaveProperty('sickLeaveBalance')
    })

    it('should mock get leave types API call', async () => {
      const response = await apiService.getLeaveTypes()

      expect(Array.isArray(response)).toBe(true)
      expect(response.length).toBeGreaterThan(0)
      expect(response[0]).toHaveProperty('id')
      expect(response[0]).toHaveProperty('name')
      expect(response[0]).toHaveProperty('category')
    })
  })
})