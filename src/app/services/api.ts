interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
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
  status: 'pending' | 'approved' | 'rejected';
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

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw {
            message: 'Request timeout - please try again',
            status: 408
          } as ApiError;
        }
        
        // Handle network connection errors
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

  // Method to set authorization header for authenticated requests
  setAuthToken(token: string): void {
    // This can be used for future authenticated API calls
    localStorage.setItem('authToken', token);
  }

  // Method to get stored token
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  // Method to clear stored token
  clearAuthToken(): void {
    localStorage.removeItem('authToken');
  }

  // Method to make authenticated requests
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

  // Method to fetch leave requests for the current user
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    return this.makeAuthenticatedRequest<LeaveRequest[]>('/api/leave-requests/me');
  }

  // Method to fetch all team leave requests
  async getTeamLeaveRequests(): Promise<LeaveRequest[]> {
    return this.makeAuthenticatedRequest<LeaveRequest[]>('/api/leave-requests/for-approval');
  }

  // Method to fetch all company leave requests (admin only)
  async getAllCompanyLeaveRequests(): Promise<LeaveRequest[]> {
    return this.makeAuthenticatedRequest<LeaveRequest[]>('/api/leave-requests/all');
  }

  async approveLeaveRequest(requestId: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/api/leave-requests/${requestId}/approve`, {
      method: 'PUT'
    });
  }

  async rejectLeaveRequest(requestId: string): Promise<void> {
    return this.makeAuthenticatedRequest<void>(`/api/leave-requests/${requestId}/reject`, {
      method: 'PUT'
    });
  }

  // Method to cancel a leave request
  async cancelLeaveRequest(requestId: string): Promise<LeaveRequest> {
    return this.makeAuthenticatedRequest<LeaveRequest>(`/api/leave-requests/${requestId}/cancel`, {
      method: 'POST',
    });
  }

  // Method to delete a leave request using DELETE API
  async deleteLeaveRequest(requestId: string): Promise<LeaveRequest> {
    return this.makeAuthenticatedRequest<LeaveRequest>(`/api/leave-requests/${requestId}`, {
      method: 'DELETE',
    });
  }

  async getUserProfile(): Promise<UserProfile> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Extract user ID from stored user data
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

  // Method to fetch all leave types
  async getLeaveTypes(): Promise<LeaveType[]> {
    return this.makeAuthenticatedRequest<LeaveType[]>('/api/leave-types');
  }

  // Method to create a new leave request
  async createLeaveRequest(requestData: CreateLeaveRequestData): Promise<LeaveRequest> {
    return this.makeAuthenticatedRequest<LeaveRequest>('/api/leave-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  // Method to fetch team balances
  async getTeamBalances(): Promise<TeamBalance[]> {
    // Use getAllUsers endpoint instead of team-balances due to route ordering issue
    const users = await this.makeAuthenticatedRequest<any[]>('/api/users');
    // Transform user data to match TeamBalance interface
    return users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      annualLeaveBalance: user.annualLeaveBalance || 0,
      sickLeaveBalance: user.sickLeaveBalance || 0
    }));
  }

  // Method to create a new staff member
  async createStaff(staffData: CreateStaffData): Promise<UserProfile> {
    // Step 1: Register the user (creates with default employee role)
    const newUser = await this.makeRequest<UserProfile>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        email: staffData.email,
        password: staffData.password
      }),
    });

    // Step 2: Update the user's role if not employee
    if (staffData.roleId && staffData.roleId !== '5596b6ac-2059-4a6f-8522-4180c3c82e1a') {
      await this.makeAuthenticatedRequest(`/api/users/${newUser.id}/role`, {
        method: 'POST',
        body: JSON.stringify({ roleId: staffData.roleId }),
      });
    }

    // Step 3: Update leave balances if provided
    if (staffData.annualLeaveBalance !== undefined || staffData.sickLeaveBalance !== undefined) {
      await this.makeAuthenticatedRequest(`/api/users/${newUser.id}/leave-balance`, {
        method: 'POST',
        body: JSON.stringify({
          annualLeaveChange: staffData.annualLeaveBalance || 25,
          sickLeaveChange: staffData.sickLeaveBalance || 10
        }),
      });
    }

    // Return the updated user data
    return this.makeAuthenticatedRequest<UserProfile>(`/api/users/${newUser.id}`);
  }

  // Method to update staff allowances (leave balances)
  async updateStaffAllowance(staffId: string, annualLeaveBalance: number, sickLeaveBalance: number): Promise<UserProfile> {
    await this.makeAuthenticatedRequest(`/api/users/${staffId}/leave-balance`, {
      method: 'POST',
      body: JSON.stringify({
        annualLeaveChange: annualLeaveBalance,
        sickLeaveChange: sickLeaveBalance
      }),
    });

    // Return the updated user data
    return this.makeAuthenticatedRequest<UserProfile>(`/api/users/${staffId}`);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export type { LoginRequest, LoginResponse, ApiError, LeaveRequest, UserProfile, LeaveType, CreateLeaveRequestData, TeamBalance, CreateStaffData };