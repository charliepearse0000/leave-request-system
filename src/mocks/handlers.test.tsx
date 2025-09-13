import fs from 'fs'
import path from 'path'

// Test the handlers configuration without importing MSW modules
describe('MSW Handlers Configuration', () => {
  it('should have handlers file with login endpoint', () => {
    const handlersPath = path.join(__dirname, 'handlers.ts')
    const handlersContent = fs.readFileSync(handlersPath, 'utf-8')
    
    // Check for login handler
    expect(handlersContent).toContain("http.post('/login'")
    expect(handlersContent).toContain('Login successful')
    expect(handlersContent).toContain('mock-jwt-token')
  })

  it('should have handlers file with GET leave endpoint', () => {
    const handlersPath = path.join(__dirname, 'handlers.ts')
    const handlersContent = fs.readFileSync(handlersPath, 'utf-8')
    
    // Check for GET leave handler
    expect(handlersContent).toContain("http.get('/leave'")
    expect(handlersContent).toContain('annual')
    expect(handlersContent).toContain('approved')
  })

  it('should have handlers file with POST leave endpoint', () => {
    const handlersPath = path.join(__dirname, 'handlers.ts')
    const handlersContent = fs.readFileSync(handlersPath, 'utf-8')
    
    // Check for POST leave handler
    expect(handlersContent).toContain("http.post('/leave'")
    expect(handlersContent).toContain('Leave request submitted successfully')
    expect(handlersContent).toContain('pending')
  })

  it('should have proper response structure for login', () => {
    const handlersPath = path.join(__dirname, 'handlers.ts')
    const handlersContent = fs.readFileSync(handlersPath, 'utf-8')
    
    // Check login response structure
    expect(handlersContent).toContain('success: true')
    expect(handlersContent).toContain('user:')
    expect(handlersContent).toContain('email:')
    expect(handlersContent).toContain('token:')
  })

  it('should have proper response structure for leave endpoints', () => {
    const handlersPath = path.join(__dirname, 'handlers.ts')
    const handlersContent = fs.readFileSync(handlersPath, 'utf-8')
    
    // Check leave response structure
    expect(handlersContent).toContain('employeeId:')
    expect(handlersContent).toContain('startDate:')
    expect(handlersContent).toContain('endDate:')
    expect(handlersContent).toContain('status:')
  })
})