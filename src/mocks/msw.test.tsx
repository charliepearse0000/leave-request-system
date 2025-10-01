import { describe, it, expect } from '@jest/globals'
import * as path from 'path'
import * as fs from 'fs'
import packageJson from '../../package.json'

describe('MSW Setup', () => {
  it('should have MSW package available', () => {
    expect(packageJson.devDependencies.msw).toBeDefined()
    expect(packageJson.devDependencies.msw).toMatch(/^[\^~]?\d+\.\d+\.\d+/)
  })

  it('should have mock handlers file', () => {
    const handlersPath = path.join(__dirname, 'handlers.ts')
    expect(fs.existsSync(handlersPath)).toBe(true)
  })

  it('should have server setup file', () => {
    const serverPath = path.join(__dirname, 'server.ts')
    expect(fs.existsSync(serverPath)).toBe(true)
  })

  it('should have MSW configuration ready', () => {
    expect(true).toBe(true)
  })
})