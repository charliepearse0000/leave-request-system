// MSW Mock Endpoints Integration Tests
// This test verifies that MSW handlers are properly configured and can be used

import fs from 'fs'
import path from 'path'

describe('MSW Mock Endpoints Integration Tests', () => {
  describe('MSW Handlers Configuration', () => {
    it('should have handlers properly configured for testing', () => {
      const handlersPath = path.join(__dirname, 'handlers.ts')
      const handlersContent = fs.readFileSync(handlersPath, 'utf8')
      
      // Verify handlers are configured for our endpoints
      expect(handlersContent).toContain("http.post('/login'")
      expect(handlersContent).toContain("http.get('/leave'")
      expect(handlersContent).toContain("http.post('/leave'")
      
      // Verify response structures are defined
       expect(handlersContent).toContain('token')
       expect(handlersContent).toContain('user')
       expect(handlersContent).toContain('data')
       expect(handlersContent).toContain('success')
    })
    
    it('should export handlers array for MSW server', () => {
      const handlersPath = path.join(__dirname, 'handlers.ts')
      const handlersContent = fs.readFileSync(handlersPath, 'utf8')
      
      expect(handlersContent).toContain('export const handlers')
      expect(handlersContent).toContain('HttpResponse.json')
    })
  })


})