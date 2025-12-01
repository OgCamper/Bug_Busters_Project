import { describe, it, expect, beforeEach, vi, afterEach, type Mock } from 'vitest';
import { authService, type AuthResponse, type User } from '../services/AuthService';

const mockUser: User = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
};

const mockAuthResponse: AuthResponse = {
  message: 'ok',
  token: 'test-token',
  user: mockUser,
};

describe('authService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // simple in-memory localStorage mock
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
      }),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('signUp stores token and user on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockAuthResponse),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await authService.signUp('Test User', 'test@example.com', 'password');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/signup',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(localStorage.setItem).toHaveBeenCalledWith('token', mockAuthResponse.token);
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockAuthResponse.user));
    expect(result).toEqual(mockAuthResponse);
  });

  it('signUp throws error when response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Signup failed' }),
      } as unknown as Response),
    );

    await expect(authService.signUp('Test User', 'bad@example.com', 'password')).rejects.toThrow(
      'Signup failed',
    );
  });

  it('login stores token and user on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockAuthResponse),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await authService.login('test@example.com', 'password');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/login',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(localStorage.setItem).toHaveBeenCalledWith('token', mockAuthResponse.token);
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockAuthResponse.user));
    expect(result).toEqual(mockAuthResponse);
  });

  it('login throws error when response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Login failed' }),
      } as unknown as Response),
    );

    await expect(authService.login('test@example.com', 'bad-password')).rejects.toThrow(
      'Login failed',
    );
  });

  it('logout clears token and user from localStorage', () => {
    localStorage.setItem('token', 'some-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    authService.logout();

    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');
  });

  it('getToken returns stored token', () => {
    (localStorage.getItem as Mock).mockReturnValueOnce('stored-token');

    const token = authService.getToken();

    expect(token).toBe('stored-token');
  });

  it('getUser returns parsed user object when present', () => {
    (localStorage.getItem as Mock).mockReturnValueOnce(JSON.stringify(mockUser));

    const user = authService.getUser();

    expect(user).toEqual(mockUser);
  });

  it('getUser returns null when user not stored', () => {
    (localStorage.getItem as Mock).mockReturnValueOnce(null);

    const user = authService.getUser();

    expect(user).toBeNull();
  });

  it('isAuthenticated returns true when token exists', () => {
    (localStorage.getItem as Mock).mockReturnValueOnce('stored-token');

    const isAuth = authService.isAuthenticated();

    expect(isAuth).toBe(true);
  });

  it('isAuthenticated returns false when no token', () => {
    (localStorage.getItem as Mock).mockReturnValueOnce(null);

    const isAuth = authService.isAuthenticated();

    expect(isAuth).toBe(false);
  });
});


