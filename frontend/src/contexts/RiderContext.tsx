import { createContext, useContext, useReducer, ReactNode } from 'react';
import { Rider } from '../types';
import { get, put, getErrorMessage } from '../services/api';

interface RiderState {
  profile: Rider | null;
  isLoading: boolean;
  error: string | null;
}

type RiderAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Rider }
  | { type: 'FETCH_FAILURE'; payload: string }
  | { type: 'UPDATE_PROFILE'; payload: Rider };

const initialState: RiderState = {
  profile: null,
  isLoading: false,
  error: null,
};

function riderReducer(state: RiderState, action: RiderAction): RiderState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return { profile: action.payload, isLoading: false, error: null };
    case 'FETCH_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    case 'UPDATE_PROFILE':
      return { ...state, profile: action.payload };
    default:
      return state;
  }
}

interface RiderContextValue {
  state: RiderState;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Rider>) => Promise<void>;
}

const RiderContext = createContext<RiderContextValue | null>(null);

export function RiderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(riderReducer, initialState);

  const fetchProfile = async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const profile = await get<Rider>('/rider/profile');
      dispatch({ type: 'FETCH_SUCCESS', payload: profile });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch profile');
      dispatch({ type: 'FETCH_FAILURE', payload: message });
    }
  };

  const updateProfile = async (data: Partial<Rider>) => {
    try {
      const profile = await put<Rider>('/rider/profile', data);
      dispatch({ type: 'UPDATE_PROFILE', payload: profile });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update profile');
      throw new Error(message);
    }
  };

  return (
    <RiderContext.Provider value={{ state, fetchProfile, updateProfile }}>
      {children}
    </RiderContext.Provider>
  );
}

export function useRider() {
  const context = useContext(RiderContext);
  if (!context) {
    throw new Error('useRider must be used within a RiderProvider');
  }
  return {
    profile: context.state.profile,
    isLoading: context.state.isLoading,
    error: context.state.error,
    fetchProfile: context.fetchProfile,
    updateProfile: context.updateProfile,
  };
}
