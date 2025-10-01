import React from 'react'
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'
const shouldRunA11Y = process.env.RUN_A11Y === 'true'
const describeOrSkip = shouldRunA11Y ? describe : describe.skip

// Router mock
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

// Context and heavy UI mocks
jest.mock('@/app/contexts/BalanceContext', () => ({
  useBalance: () => ({ balance: { annualLeaveBalance: 10, sickLeaveBalance: 5 }, loading: false, refreshBalance: jest.fn(), setBalance: jest.fn() }),
}))
jest.mock('@/app/components/Header', () => () => <div />)
jest.mock('@/app/components/Card', () => {
  const Card = ({ children }: any) => <div>{children}</div>
  ;(Card as any).Header = ({ children }: any) => <div>{children}</div>
  ;(Card as any).Content = ({ children }: any) => <div>{children}</div>
  ;(Card as any).Icon = ({ icon }: any) => <span>{icon ?? null}</span>
  ;(Card as any).Title = ({ children }: any) => <div>{children}</div>
  ;(Card as any).Description = ({ children }: any) => <div>{children}</div>
  ;(Card as any).Arrow = () => null
  return { __esModule: true, default: Card }
})
jest.mock('@/app/components/RoleBasedAccess', () => ({
  AdminOnly: ({ children }: any) => <>{children}</>,
  AdminOrManager: ({ children }: any) => <>{children}</>,
}))
jest.mock('@heroicons/react/24/outline', () => ({
  ClockIcon: () => null,
}))

jest.mock('@/app/services/company-settings', () => ({
  companySettings: {
    getSettings: () => ({}),
    getDefaultAnnualLeaveAllowance: () => 20,
    getDefaultSickLeaveAllowance: () => 10,
  },
}))

// Avoid external API work in page
jest.mock('@/app/services/api', () => ({
  apiService: {
    getLeaveBalance: jest.fn().mockResolvedValue({ annualLeaveBalance: 10, sickLeaveBalance: 5 }),
  },
}))

describeOrSkip('Staff Dashboard Accessibility', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('authToken', 'token')
    localStorage.setItem('userData', JSON.stringify({ id: 'u1', role: { id: 'r1', name: 'employee' } }))
  })

  it('has no serious axe violations', async () => {
    render(<Home />)
    const main = await screen.findByRole('main', undefined, { timeout: 2000 }) as HTMLElement
    const violations = await runAxe(main)
    const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
    if (serious.length) {
      throw new Error(formatViolations(serious))
    }
    expect(serious).toHaveLength(0)
  })
})