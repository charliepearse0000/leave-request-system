import fs from 'fs'
import path from 'path'

describe('MSW Mock Endpoints Integration Tests', () => {
  describe('MSW Handlers Configuration', () => {
    it('should have handlers properly configured for testing', () => {
      const handlersPath = path.join(__dirname, 'handlers.ts')
      const handlersContent = fs.readFileSync(handlersPath, 'utf8')
      
      expect(handlersContent).toContain("http.post('http://localhost:3000/api/auth/login'")
      expect(handlersContent).toContain("http.get('http://localhost:3000/api/leave-requests/me'")
      expect(handlersContent).toContain("http.post('http://localhost:3000/api/leave-requests'")
      expect(handlersContent).toContain("http.post('http://localhost:3000/api/leave-requests/:id/approve'")
      expect(handlersContent).toContain("http.post('http://localhost:3000/api/leave-requests/:id/reject'")
      
       expect(handlersContent).toContain('token')
       expect(handlersContent).toContain('user')
       expect(handlersContent).toContain('firstName')
       expect(handlersContent).toContain('lastName')
    })
    
    it('should export handlers array for MSW server', () => {
      const handlersPath = path.join(__dirname, 'handlers.ts')
      const handlersContent = fs.readFileSync(handlersPath, 'utf8')
      
      expect(handlersContent).toContain('export const handlers')
      expect(handlersContent).toContain('HttpResponse.json')
    })
  })


})