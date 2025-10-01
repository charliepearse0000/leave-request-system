import { apiService } from '@/app/services/api';

describe('ApiService Leave', () => {
  const mockToken = 'jwt.token.value';
  const authHeaders = { Authorization: `Bearer ${mockToken}` };

  const mockLeaveRequest = {
    id: 'lr1',
    user: { id: 'u1', firstName: 'T', lastName: 'U', email: 'u@e.com' },
    leaveType: {
      id: 'lt1',
      name: 'Annual Leave',
      description: 'desc',
      category: 'ANNUAL',
      requiresApproval: true,
      deductsBalance: true,
    },
    startDate: '2025-10-02',
    endDate: '2025-10-03',
    duration: 2,
    status: 'pending' as const,
    reason: 'Trip',
    submittedAt: '2025-10-01T12:00:00Z',
  };

  beforeEach(() => {
    (global as any).fetch = jest.fn();
    localStorage.clear();
    localStorage.setItem('authToken', mockToken);
    localStorage.setItem('userData', JSON.stringify({ id: 'u1' }));
  });

  afterEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  it('list my leave requests via getLeaveRequests', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => [mockLeaveRequest],
    });

    const result = await apiService.getLeaveRequests();
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/leave-requests/me',
      expect.objectContaining({
        headers: expect.objectContaining(authHeaders),
      })
    );
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toMatchObject({ id: 'lr1', status: 'pending' });
  });

  it('create leave request sends POST with body', async () => {
    const payload = {
      leaveTypeId: 'lt1',
      startDate: '2025-10-02',
      endDate: '2025-10-03',
      reason: 'Trip',
      duration: 2,
    };

    (global as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => mockLeaveRequest,
    });

    const result = await apiService.createLeaveRequest(payload);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/leave-requests',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining(authHeaders),
        body: JSON.stringify(payload),
      })
    );
    expect(result).toMatchObject({ id: 'lr1', reason: 'Trip' });
  });

  it('cancel request posts to /:id/cancel and returns updated request', async () => {
    const updated = { ...mockLeaveRequest, status: 'cancelled' as const };
    (global as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => updated,
    });

    const result = await apiService.cancelLeaveRequest('lr1');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/leave-requests/lr1/cancel',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining(authHeaders),
      })
    );
    expect(result.status).toBe('cancelled');
  });
});