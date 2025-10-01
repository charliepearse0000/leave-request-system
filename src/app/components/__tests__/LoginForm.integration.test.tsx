import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '@/app/components/LoginForm';
import { apiService } from '@/app/services/api';

// Router mock
const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe('LoginForm Integration', () => {
  beforeEach(() => {
    pushMock.mockReset();
    localStorage.clear();
    jest.spyOn(apiService, 'login').mockReset();
  });

  it('simulates typing valid credentials and submits', async () => {
    const loginSpy = jest.spyOn(apiService, 'login').mockResolvedValue({
      token: 'valid.jwt.token',
      user: {
        id: 'u1',
        firstName: 'Test',
        lastName: 'User',
        email: 'user@example.com',
        role: 'employee',
      },
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email Address');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    fireEvent.click(submitButton);

    await waitFor(() => expect(loginSpy).toHaveBeenCalled());
    expect(loginSpy).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
    });

    // Assert local storage and navigation
    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBe('valid.jwt.token');
      expect(localStorage.getItem('userData')).toContain('user@example.com');
      expect(pushMock).toHaveBeenCalledWith('/');
    });
  });

  it('simulates typing invalid credentials and shows error, no navigation', async () => {
    const apiError = new Error('Invalid credentials') as any;
    apiError.status = 401;
    jest.spyOn(apiService, 'login').mockRejectedValue(apiError);

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'bad@example.com' } });
    // Use long password to trigger API 401, not client validation
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong123' } });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Assert 401 error feedback via alert
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Invalid email or password/i);
    expect(pushMock).not.toHaveBeenCalled();
  });
});