import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewLeaveRequest from '@/app/new-request/page';
import { apiService } from '@/app/services/api';
const shouldRunA11Y = process.env.RUN_A11Y === 'true'
const itOrSkip = shouldRunA11Y ? it : it.skip

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/app/contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showToast: jest.fn(),
  }),
}));

describe('New Leave Request Form Integration', () => {
  beforeEach(() => {
    pushMock.mockReset();
    localStorage.clear();
    localStorage.setItem('authToken', 'token');
    jest.spyOn(apiService, 'getLeaveTypes').mockResolvedValue([
      { id: 'lt1', name: 'Annual Leave', category: 'annual', maxDays: 20 },
    ] as any);
    jest.spyOn(apiService, 'createLeaveRequest').mockReset();
  });

  it('fills dates and reason, submits successfully, shows feedback and redirects', async () => {
    jest.useFakeTimers();
    const createSpy = jest
      .spyOn(apiService, 'createLeaveRequest')
      .mockResolvedValue({ success: true } as any);

    render(<NewLeaveRequest />);

    const select = await screen.findByLabelText('Leave Type *');
    await waitFor(() => expect(select).not.toBeDisabled());
    fireEvent.change(select, { target: { value: 'lt1' } });

    const startDate = screen.getByLabelText('Start Date *');
    const endDate = screen.getByLabelText('End Date *');
    fireEvent.change(startDate, { target: { value: '2025-01-10' } });
    fireEvent.change(endDate, { target: { value: '2025-01-12' } });

    const reason = screen.getByLabelText('Reason *');
    fireEvent.change(reason, { target: { value: 'Family event' } });

    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));

    await waitFor(() => expect(createSpy).toHaveBeenCalled());
    expect(createSpy).toHaveBeenCalledWith({
      leaveTypeId: 'lt1',
      startDate: '2025-01-10',
      endDate: '2025-01-12',
      reason: 'Family event',
      duration: 3,
    });

    jest.advanceTimersByTime(2000);
    jest.useRealTimers();

    expect(pushMock).toHaveBeenCalledWith('/requests');
  });

  it('shows validation errors for invalid inputs', async () => {
    render(<NewLeaveRequest />);

    fireEvent.click(screen.getByRole('button', { name: /submit request/i }));

    expect(await screen.findByText(/Please select a leave type/i)).toBeInTheDocument();
    expect(screen.getByText(/Please select a start date/i)).toBeInTheDocument();
    expect(screen.getByText(/Please select an end date/i)).toBeInTheDocument();
    expect(screen.getByText(/Please provide a reason for your leave/i)).toBeInTheDocument();
  });

  itOrSkip('has no serious axe violations', async () => {
    const { container } = render(<NewLeaveRequest />)
    const violations = await runAxe(container as unknown as HTMLElement)
    const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical')
    if (serious.length) {
      throw new Error(formatViolations(serious))
    }
    expect(serious).toHaveLength(0)
  })
});