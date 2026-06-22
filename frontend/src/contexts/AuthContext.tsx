import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthTokens } from '../types';
import { post, getErrorMessage } from '../services/api';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_REFRESHED'; payload: AuthTokens }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  tokens: null,
  isLoading: true,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { user: action.payload.user, tokens: action.payload.tokens, isLoading: false, error: null };
    case 'LOGIN_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    case 'LOGOUT':
      return { user: null, tokens: null, isLoading: false, error: null };
    case 'TOKEN_REFRESHED':
      return { ...state, tokens: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const restoreSession = async () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (!accessToken || !refreshToken) {
      dispatch({ type: 'LOGOUT' });
      return;
    }
    try {
      const data = await post<{ user: User; tokens: AuthTokens }>('/auth/refresh', { refresh_token: refreshToken });
      localStorage.setItem('access_token', data.tokens.access_token);
      localStorage.setItem('refresh_token', data.tokens.refresh_token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, tokens: data.tokens } });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      dispatch({ type: 'LOGOUT' });
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const data = await post<{ user: User; tokens: AuthTokens }>('/auth/login', { email, password });
      localStorage.setItem('access_token', data.tokens.access_token);
      localStorage.setItem('refresh_token', data.tokens.refresh_token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, tokens: data.tokens } });
    } catch (error) {
      const message = getErrorMessage(error, 'Login failed');
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  };

  const register = async (data: Record<string, unknown>) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const result = await post<{ user: User; tokens: AuthTokens }>('/auth/register', data);
      localStorage.setItem('access_token', result.tokens.access_token);
      localStorage.setItem('refresh_token', result.tokens.refresh_token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: result.user, tokens: result.tokens } });
    } catch (error) {
      const message = getErrorMessage(error, 'Registration failed');
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <AuthContext.Provider value={{ state, login, register, logout, restoreSession, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return {
    user: context.state.user,
    tokens: context.state.tokens,
    isLoading: context.state.isLoading,
    error: context.state.error,
    login: context.login,
    register: context.register,
    logout: context.logout,
    restoreSession: context.restoreSession,
    clearError: context.clearError,
  };
}
