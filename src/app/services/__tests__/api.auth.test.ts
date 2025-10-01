import { apiService } from '@/app/services/api';

describe('ApiService Auth', () => {
  const mockCredentials = { email: 'user@example.com', password: 'secret' };
  const mockLoginResponse = {
    token: 'jwt.token.value',
    user: {
      id: 'u1',
      firstName: 'Test',
      lastName: 'User',
      email: 'user@example.com',
      role: 'employee',
    },
  };

  beforeEach(() => {
    // Reset fetch and localStorage before each test
    (global as any).fetch = jest.fn();
    localStorage.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  it('login success returns token and user data', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: true,
      json: async () => mockLoginResponse,
    });

    const result = await apiService.login(mockCredentials);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/login',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toEqual(mockLoginResponse);
  });

  it('login failure throws ApiError with status and message', async () => {
    (global as any).fetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ message: 'Invalid credentials' }),
    });

    await expect(apiService.login(mockCredentials)).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining('Invalid credentials'),
    });
  });

  it('setAuthToken and clearAuthToken manage localStorage', () => {
    apiService.setAuthToken('abc123');
    expect(apiService.getAuthToken()).toBe('abc123');

    apiService.clearAuthToken();
    expect(apiService.getAuthToken()).toBeNull();
  });

  it('logout logic prevents authenticated requests (no token -> 401)', async () => {
    // Ensure token is cleared
    apiService.clearAuthToken();

    await expect(apiService.getLeaveRequests()).rejects.toMatchObject({
      status: 401,
      message: expect.stringContaining('Authentication required'),
    });
  });
});