import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import RequestsListView from '@/app/requests/RequestsListView';
import { apiService } from '@/app/services/api';

// Router mock
const pushMock = jest.fn();
jest.mock('next/navigation', () => {
  const stableSearchParams = { get: () => null };
  return {
    useRouter: () => ({ push: pushMock }),
    useSearchParams: () => stableSearchParams,
  };
});

// BalanceContext mock
jest.mock('@/app/contexts/BalanceContext', () => ({
  useBalance: () => ({ refreshBalance: jest.fn() }),
}));

// Lightweight mocks for heavy UI components
jest.mock('@/app/components/Header', () => () => <div />);
jest.mock('@/app/components/Card', () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));
jest.mock('@/app/components/ConfirmationDialog', () => () => null);
jest.mock('@heroicons/react/24/outline', () => ({
  ClockIcon: () => null,
  CheckCircleIcon: () => null,
  XCircleIcon: () => null,
  MinusCircleIcon: () => null,
}));

describe('Requests List UI Integration', () => {
  beforeEach(() => {
    pushMock.mockReset();
    localStorage.clear();
    localStorage.setItem('authToken', 'token');
    localStorage.setItem('userData', JSON.stringify({ id: 'u1', role: 'employee' }));
    jest.spyOn(apiService, 'getLeaveRequests').mockReset();
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('renders mock data, shows status and cancel button for pending items', async () => {
    const mockRequests = [
      {
        id: 'r1',
        leaveType: { id: 'lt1', name: 'Annual Leave', category: 'annual' },
        startDate: '2025-01-10',
        endDate: '2025-01-12',
        duration: 3,
        reason: 'Family event',
        status: 'pending',
        submittedAt: '2025-01-01',
      },
      {
        id: 'r2',
        leaveType: { id: 'lt2', name: 'Sick Leave', category: 'sick' },
        startDate: '2025-02-02',
        endDate: '2025-02-02',
        duration: 1,
        reason: 'Flu',
        status: 'approved',
        submittedAt: '2025-02-01',
      },
    ] as any;

    render(<RequestsListView requests={mockRequests as any} />);

    // Wait for list items
    expect(screen.getByText('Annual Leave')).toBeInTheDocument();
    expect(screen.getByText('Sick Leave')).toBeInTheDocument();

    // Verify status labels
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText(/approved/i)).toBeInTheDocument();

    // Assert cancel button for pending item
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeTruthy();
  });
});