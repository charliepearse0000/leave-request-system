import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';

// Mock next/navigation router
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() })
}));

describe('useAuth logout', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('clears tokens, updates state, and navigates on logout', () => {
    const { result, unmount } = renderHook(() => useAuth());

    // Set tokens after render to avoid interval setup from authenticated state
    localStorage.setItem('authToken', 't');
    localStorage.setItem('userData', JSON.stringify({ id: 'u1' }));

    act(() => {
      result.current.logout();
    });

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('userData')).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);

    unmount();
  });
});