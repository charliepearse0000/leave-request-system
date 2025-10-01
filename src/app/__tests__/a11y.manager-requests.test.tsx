import React from 'react'
import { render, screen } from '@testing-library/react'
import ApproveRequestsPage from '@/app/approve-requests/page'
const shouldRunA11Y = process.env.RUN_A11Y === 'true'
const describeOrSkip = shouldRunA11Y ? describe : describe.skip

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
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
jest.mock('@/app/components/ConfirmationDialog', () => () => null)
jest.mock('@heroicons/react/24/outline', () => ({
  ClockIcon: () => null,
  CheckCircleIcon: () => null,
  XCircleIcon: () => null,
  MinusCircleIcon: () => null,
  MagnifyingGlassIcon: () => null,
}))

jest.mock('@/app/services/company-settings', () => ({
  companySettings: {
    getSettings: () => ({})
  },
}))

jest.mock('@/app/components/RouteGuard', () => ({ __esModule: true, default: ({ children }: any) => <>{children}</> }))

jest.mock('@/app/services/api', () => ({
  apiService: {
    getTeamLeaveRequests: jest.fn().mockResolvedValue([]),
    getAllCompanyLeaveRequests: jest.fn().mockResolvedValue([]),
  },
}))

describeOrSkip('Manager Requests Accessibility', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('authToken', 'token')
    localStorage.setItem('userData', JSON.stringify({ id: 'm1', role: { id: 'r2', name: 'manager' } }))
  })

  it('has no serious axe violations', async () => {
    render(<ApproveRequestsPage />)
    const main = await screen.findByRole('main', undefined, { timeout: 2000 }) as HTMLElement
    const violations = await runAxe(main)
    const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
    if (serious.length) {
      throw new Error(formatViolations(serious))
    }
    expect(serious).toHaveLength(0)
  })
})