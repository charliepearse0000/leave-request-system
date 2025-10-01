import fs from 'fs'
import path from 'path'

describe('MSW Handlers Configuration', () => {
  it('should have handlers file with login endpoint', () => {
    const handlersPath = path.join(__dirname, 'handlers.ts')
    const handlersContent = fs.readFileSync(handlersPath, 'utf-8')
    
    expect(handlersContent).toContain("http.post('http://localhost:3000/api/auth/login'")
    expect(handlersContent).toContain('mock-jwt-token-12345')
    expect(handlersContent).toContain('john.doe@company.com')
  })

  it('should have handlers file with GET leave endpoint', () => {
    const handlersPath = path.join(__dirname, 'handlers.ts')
    const handlersContent = fs.readFileSync(handlersPath, 'utf-8')
    
    expect(handlersContent).toContain("http.get('http://localhost:3000/api/leave-requests/me'")
    expect(handlersContent).toContain('Annual Leave')
    expect(handlersContent).toContain('pending')
  })

  it('should have handlers file with POST leave endpoint', () => {
    const handlersPath = path.join(__dirname, 'handlers.ts')
    const handlersContent = fs.readFileSync(handlersPath, 'utf-8')
    
    expect(handlersContent).toContain("http.post('http://localhost:3000/api/leave-requests'")
    expect(handlersContent).toContain('Spring break')
    expect(handlersContent).toContain('pending')
  })

  it('should have proper response structure for login', () => {
    const handlersPath = path.join(__dirname, 'handlers.ts')
    const handlersContent = fs.readFileSync(handlersPath, 'utf-8')
    
    // Check login response structure
    expect(handlersContent).toContain('token:')
    expect(handlersContent).toContain('user:')
    expect(handlersContent).toContain('firstName:')
    expect(handlersContent).toContain('lastName:')
  })

  it('should have proper response structure for leave endpoints', () => {
    const handlersPath = path.join(__dirname, 'handlers.ts')
    const handlersContent = fs.readFileSync(handlersPath, 'utf-8')
    
    // Check leave response structure
    expect(handlersContent).toContain('leaveType:')
    expect(handlersContent).toContain('startDate:')
    expect(handlersContent).toContain('endDate:')
    expect(handlersContent).toContain('status:')
  })
})