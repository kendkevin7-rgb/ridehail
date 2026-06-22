import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Ride, Driver, Location, PaginatedResponse } from '../types';
import { get, post, patch, getErrorMessage } from '../services/api';
import { connect, disconnect, onRideAccepted, onRideStatusChanged, offAll } from '../services/socket';

interface RideState {
  activeRide: Ride | null;
  rideHistory: Ride[];
  nearbyDrivers: Driver[];
  isLoading: boolean;
}

type RideAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_ACTIVE_RIDE'; payload: Ride | null }
  | { type: 'SET_RIDE_HISTORY'; payload: Ride[] }
  | { type: 'SET_NEARBY_DRIVERS'; payload: Driver[] }
  | { type: 'UPDATE_RIDE_STATUS'; payload: Ride };

const initialState: RideState = {
  activeRide: null,
  rideHistory: [],
  nearbyDrivers: [],
  isLoading: false,
};

function rideReducer(state: RideState, action: RideAction): RideState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: true };
    case 'SET_ACTIVE_RIDE':
      return { ...state, activeRide: action.payload, isLoading: false };
    case 'SET_RIDE_HISTORY':
      return { ...state, rideHistory: action.payload, isLoading: false };
    case 'SET_NEARBY_DRIVERS':
      return { ...state, nearbyDrivers: action.payload, isLoading: false };
    case 'UPDATE_RIDE_STATUS':
      return { ...state, activeRide: action.payload, isLoading: false };
    default:
      return state;
  }
}

interface RideContextValue {
  state: RideState;
  requestRide: (pickup: Location, dropoff: Location) => Promise<void>;
  fetchHistory: (page?: number) => Promise<void>;
  cancelRide: (rideId: string) => Promise<void>;
  setActiveRide: (ride: Ride | null) => void;
}

const RideContext = createContext<RideContextValue | null>(null);

export function RideProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(rideReducer, initialState);

  useEffect(() => {
    connect();

    onRideAccepted((ride) => {
      dispatch({ type: 'SET_ACTIVE_RIDE', payload: ride });
    });

    onRideStatusChanged((ride) => {
      dispatch({ type: 'UPDATE_RIDE_STATUS', payload: ride });
    });

    return () => {
      offAll();
      disconnect();
    };
  }, []);

  const requestRide = async (pickup: Location, dropoff: Location) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const ride = await post<Ride>('/rides', { pickup_location: pickup, dropoff_location: dropoff });
      dispatch({ type: 'SET_ACTIVE_RIDE', payload: ride });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to request ride');
      throw new Error(message);
    }
  };

  const fetchHistory = async (page = 1) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const result = await get<PaginatedResponse<Ride>>('/rides', { page, limit: 10 });
      dispatch({ type: 'SET_RIDE_HISTORY', payload: result.data });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch ride history');
      throw new Error(message);
    }
  };

  const cancelRide = async (rideId: string) => {
    try {
      const ride = await patch<Ride>(`/rides/${rideId}/cancel`);
      dispatch({ type: 'UPDATE_RIDE_STATUS', payload: ride });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to cancel ride');
      throw new Error(message);
    }
  };

  const setActiveRide = (ride: Ride | null) => {
    dispatch({ type: 'SET_ACTIVE_RIDE', payload: ride });
  };

  return (
    <RideContext.Provider value={{ state, requestRide, fetchHistory, cancelRide, setActiveRide }}>
      {children}
    </RideContext.Provider>
  );
}

export function useRide() {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return {
    activeRide: context.state.activeRide,
    rideHistory: context.state.rideHistory,
    nearbyDrivers: context.state.nearbyDrivers,
    isLoading: context.state.isLoading,
    requestRide: context.requestRide,
    fetchHistory: context.fetchHistory,
    cancelRide: context.cancelRide,
    setActiveRide: context.setActiveRide,
  };
}
