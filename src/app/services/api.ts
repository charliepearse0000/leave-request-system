interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: {
    id: string;
    name: string;
  };
  annualLeaveBalance: number;
  sickLeaveBalance: number;
}

interface TeamBalance {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  annualLeaveBalance: number;
  sickLeaveBalance: number;
}

interface ApiError {
  message: string;
  status: number;
}

interface LeaveRequest {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  leaveType: {
    id: string;
    name: string;
    description: string;
    category: string;
    requiresApproval: boolean;
    deductsBalance: boolean;
  };
  startDate: string;
  endDate: string;
  duration: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason: string;
  submittedAt: string;
}

interface LeaveType {
  id: string;
  name: string;
  category: string;
  maxDays: number;
}

interface CreateLeaveRequestData {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  duration: number;
}

interface CreateStaffData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: string;
  annualLeaveBalance: number;
  sickLeaveBalance: number;
}

class ApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    this.timeout = 10000;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'An error occurred'
        }));
        
        throw {
          message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status
        } as ApiError;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw {
            message: 'Request timeout - please try again',
            status: 408
          } as ApiError;
        }
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
          throw {
            message: 'Unable to connect to server. Please ensure the backend is running.',
            status: 0
          } as ApiError;
        }
        
        throw {
          message: error.message || 'Network error - please check your connection',
          status: 0
        } as ApiError;
      }
      
      throw error;
    }
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.makeRequest<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  clearAuthToken(): void {
    localStorage.removeItem('authToken');
  }
  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    if (!token) {
      throw {
        message: 'Authentication required. Please log in.',
        status: 401
      } as ApiError;
    }

    return this.makeRequest<T>(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    return this.makeAuthenticatedRequest<LeaveRequest[]>('/api/leave-requests/me');
  }

  async getTeamLeaveRequests(): Promise<LeaveRequest[]> {
    return this.makeAuthenticatedRequest<LeaveRequest[]>('/api/leave-requests/for-approval');
  }

  async getAllCompanyLeaveRequests(): Promise<LeaveRequest[]> {
    return this.makeAuthenticatedRequest<LeaveRequest[]>('/api/leave-requests/all');
  }

  async approveLeaveRequest(requestId: string, comments?: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/api/leave-requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify(comments ? { comments } : {})
    });
  }

  async rejectLeaveRequest(requestId: string, comments?: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/api/leave-requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify(comments ? { comments } : {})
    });
  }

  async cancelLeaveRequest(requestId: string): Promise<LeaveRequest> {
    try {
      const result = await this.makeAuthenticatedRequest<LeaveRequest>(`/api/leave-requests/${requestId}/cancel`, {
        method: 'POST',
      });
      return result;
    } catch (error) {
      throw error;
    }
  }
  async deleteLeaveRequest(requestId: string): Promise<LeaveRequest> {
    try {
      const result = await this.makeAuthenticatedRequest<LeaveRequest>(`/api/leave-requests/${requestId}`, {
        method: 'DELETE',
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getUserProfile(): Promise<UserProfile> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const userData = localStorage.getItem('userData');
    if (!userData) {
      throw new Error('No user data found');
    }
    
    const user = JSON.parse(userData);
    return this.makeAuthenticatedRequest<UserProfile>(`/api/users/${user.id}`);
  }

  async getLeaveBalance(): Promise<{ annualLeaveBalance: number; sickLeaveBalance: number }> {
    const profile = await this.getUserProfile();
    return {
      annualLeaveBalance: profile.annualLeaveBalance,
      sickLeaveBalance: profile.sickLeaveBalance
    };
  }

  async getLeaveTypes(): Promise<LeaveType[]> {
    return this.makeAuthenticatedRequest<LeaveType[]>('/api/leave-types');
  }

  async getRoles(): Promise<{ id: string; name: string; description: string }[]> {
    return this.makeAuthenticatedRequest<{ id: string; name: string; description: string }[]>('/api/roles');
  }

  async createLeaveRequest(requestData: CreateLeaveRequestData): Promise<LeaveRequest> {
    return this.makeAuthenticatedRequest<LeaveRequest>('/api/leave-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }
  async getTeamBalances(): Promise<TeamBalance[]> {
    const users = await this.makeAuthenticatedRequest<UserProfile[]>('/api/users');
    return users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      annualLeaveBalance: user.annualLeaveBalance || 0,
      sickLeaveBalance: user.sickLeaveBalance || 0
    }));
  }
  async createStaff(staffData: CreateStaffData): Promise<UserProfile> {
    try {
      const registrationResponse = await this.makeRequest<{
        message: string;
        user: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
        };
      }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: staffData.firstName,
          lastName: staffData.lastName,
          email: staffData.email,
          password: staffData.password,
          roleId: staffData.roleId
        }),
      });

      if (!registrationResponse) {
        throw new Error('User registration failed - no response received');
      }
      
      if (!registrationResponse.user) {
        throw new Error('User registration failed - no user object returned');
      }
      
      if (!registrationResponse.user.id) {
        throw new Error('User registration failed - no user ID returned');
      }

      const newUser = registrationResponse.user;
      if (staffData.annualLeaveBalance !== undefined || staffData.sickLeaveBalance !== undefined) {
        try {
          await this.makeAuthenticatedRequest(`/api/users/${newUser.id}/leave-balance`, {
            method: 'POST',
            body: JSON.stringify({
              annualLeaveChange: staffData.annualLeaveBalance || 25,
              sickLeaveChange: staffData.sickLeaveBalance || 10
            }),
          });
        } catch (balanceError: unknown) {
          const errorMessage = balanceError instanceof Error ? balanceError.message : 'Unknown error';
          throw new Error(`Failed to set leave balances: ${errorMessage}`);
        }
      }

      try {
        return await this.makeAuthenticatedRequest<UserProfile>(`/api/users/${newUser.id}`);
      } catch (fetchError: unknown) {
        const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
        throw new Error(`Failed to fetch updated user data: ${errorMessage}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (errorMessage && (errorMessage.includes('Failed to') || errorMessage.includes('User registration failed'))) {
        throw error;
      }
      throw new Error(`Failed to create staff member: ${errorMessage}`);
    }
  }
  async updateStaffAllowance(staffId: string, annualLeaveBalance: number, sickLeaveBalance: number): Promise<UserProfile> {
    await this.makeAuthenticatedRequest(`/api/users/${staffId}/leave-balance`, {
      method: 'POST',
      body: JSON.stringify({
        annualLeaveChange: annualLeaveBalance,
        sickLeaveChange: sickLeaveBalance
      }),
    });

    return this.makeAuthenticatedRequest<UserProfile>(`/api/users/${staffId}`);
  }

  async deleteUser(userId: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/api/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async getUsers(): Promise<UserProfile[]> {
    return this.makeAuthenticatedRequest<UserProfile[]>('/api/users');
  }

  async updateUser(userId: string, userData: { firstName: string; lastName: string; email: string }): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async updateUserRole(userId: string, roleId: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/api/users/${userId}/role`, {
      method: 'POST',
      body: JSON.stringify({ roleId })
    });
  }

  async getUser(userId: string): Promise<UserProfile> {
    return this.makeAuthenticatedRequest<UserProfile>(`/api/users/${userId}`);
  }
}

export const apiService = new ApiService();
export type { LoginRequest, LoginResponse, ApiError, LeaveRequest, UserProfile, LeaveType, CreateLeaveRequestData, TeamBalance, CreateStaffData };