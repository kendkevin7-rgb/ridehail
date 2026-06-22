import { createContext, useContext, useReducer, ReactNode } from 'react';
import { Driver, DriverDocument, DriverStatus } from '../types';
import { get, put, patch, getErrorMessage } from '../services/api';
import api from '../services/api';

interface DriverState {
  profile: Driver | null;
  documents: DriverDocument[];
  isOnline: boolean;
  isLoading: boolean;
}

type DriverAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Driver }
  | { type: 'FETCH_FAILURE' }
  | { type: 'UPDATE_PROFILE'; payload: Driver }
  | { type: 'SET_DOCUMENTS'; payload: DriverDocument[] }
  | { type: 'ADD_DOCUMENT'; payload: DriverDocument }
  | { type: 'TOGGLE_ONLINE'; payload: boolean };

const initialState: DriverState = {
  profile: null,
  documents: [],
  isOnline: false,
  isLoading: false,
};

function driverReducer(state: DriverState, action: DriverAction): DriverState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true };
    case 'FETCH_SUCCESS':
      return { ...state, profile: action.payload, isOnline: action.payload.status === DriverStatus.ONLINE, isLoading: false };
    case 'FETCH_FAILURE':
      return { ...state, isLoading: false };
    case 'UPDATE_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload };
    case 'ADD_DOCUMENT':
      return { ...state, documents: [...state.documents, action.payload] };
    case 'TOGGLE_ONLINE':
      return { ...state, isOnline: action.payload };
    default:
      return state;
  }
}

interface DriverContextValue {
  state: DriverState;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Driver>) => Promise<void>;
  uploadDocument: (type: string, file: File) => Promise<void>;
  toggleOnline: () => Promise<void>;
}

const DriverContext = createContext<DriverContextValue | null>(null);

export function DriverProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(driverReducer, initialState);

  const fetchProfile = async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const profile = await get<Driver>('/driver/profile');
      dispatch({ type: 'FETCH_SUCCESS', payload: profile });
    } catch {
      dispatch({ type: 'FETCH_FAILURE' });
    }
  };

  const updateProfile = async (data: Partial<Driver>) => {
    try {
      const profile = await put<Driver>('/driver/profile', data);
      dispatch({ type: 'UPDATE_PROFILE', payload: profile });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update profile');
      throw new Error(message);
    }
  };

  const uploadDocument = async (type: string, file: File) => {
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('file', file);
      const response = await api.post<DriverDocument>('/driver/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      dispatch({ type: 'ADD_DOCUMENT', payload: response.data });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to upload document');
      throw new Error(message);
    }
  };

  const toggleOnline = async () => {
    const newStatus = state.isOnline ? DriverStatus.OFFLINE : DriverStatus.ONLINE;
    try {
      await patch<{ status: DriverStatus }>('/driver/status', { status: newStatus });
      dispatch({ type: 'TOGGLE_ONLINE', payload: !state.isOnline });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to update status');
      throw new Error(message);
    }
  };

  return (
    <DriverContext.Provider value={{ state, fetchProfile, updateProfile, uploadDocument, toggleOnline }}>
      {children}
    </DriverContext.Provider>
  );
}

export function useDriver() {
  const context = useContext(DriverContext);
  if (!context) {
    throw new Error('useDriver must be used within a DriverProvider');
  }
  return {
    profile: context.state.profile,
    documents: context.state.documents,
    isOnline: context.state.isOnline,
    isLoading: context.state.isLoading,
    fetchProfile: context.fetchProfile,
    updateProfile: context.updateProfile,
    uploadDocument: context.uploadDocument,
    toggleOnline: context.toggleOnline,
  };
}
