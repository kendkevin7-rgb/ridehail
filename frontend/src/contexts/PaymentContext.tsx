import { createContext, useContext, useReducer, ReactNode } from 'react';
import { PaymentMethod, Payment } from '../types';
import { get, post, del, patch, getErrorMessage } from '../services/api';

interface PaymentState {
  methods: PaymentMethod[];
  history: Payment[];
  isLoading: boolean;
}

type PaymentAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_METHODS'; payload: PaymentMethod[] }
  | { type: 'ADD_METHOD'; payload: PaymentMethod }
  | { type: 'REMOVE_METHOD'; payload: string }
  | { type: 'SET_DEFAULT'; payload: string }
  | { type: 'SET_HISTORY'; payload: Payment[] };

const initialState: PaymentState = {
  methods: [],
  history: [],
  isLoading: false,
};

function paymentReducer(state: PaymentState, action: PaymentAction): PaymentState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: true };
    case 'SET_METHODS':
      return { ...state, methods: action.payload, isLoading: false };
    case 'ADD_METHOD':
      return { ...state, methods: [...state.methods, action.payload], isLoading: false };
    case 'REMOVE_METHOD':
      return { ...state, methods: state.methods.filter((m) => m.id !== action.payload), isLoading: false };
    case 'SET_DEFAULT':
      return {
        ...state,
        methods: state.methods.map((m) => ({ ...m, is_default: m.id === action.payload })),
        isLoading: false,
      };
    case 'SET_HISTORY':
      return { ...state, history: action.payload, isLoading: false };
    default:
      return state;
  }
}

interface PaymentContextValue {
  state: PaymentState;
  fetchMethods: () => Promise<void>;
  addMethod: (paymentMethodId: string) => Promise<void>;
  removeMethod: (methodId: string) => Promise<void>;
  setDefaultMethod: (methodId: string) => Promise<void>;
  fetchHistory: () => Promise<void>;
}

const PaymentContext = createContext<PaymentContextValue | null>(null);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(paymentReducer, initialState);

  const fetchMethods = async () => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const methods = await get<PaymentMethod[]>('/payment-methods');
      dispatch({ type: 'SET_METHODS', payload: methods });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch payment methods');
      throw new Error(message);
    }
  };

  const addMethod = async (paymentMethodId: string) => {
    try {
      const method = await post<PaymentMethod>('/payment-methods', { stripe_payment_method_id: paymentMethodId });
      dispatch({ type: 'ADD_METHOD', payload: method });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to add payment method');
      throw new Error(message);
    }
  };

  const removeMethod = async (methodId: string) => {
    try {
      await del(`/payment-methods/${methodId}`);
      dispatch({ type: 'REMOVE_METHOD', payload: methodId });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to remove payment method');
      throw new Error(message);
    }
  };

  const setDefaultMethod = async (methodId: string) => {
    try {
      const method = await patch<PaymentMethod>(`/payment-methods/${methodId}/default`);
      dispatch({ type: 'SET_DEFAULT', payload: method.id });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to set default payment method');
      throw new Error(message);
    }
  };

  const fetchHistory = async () => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const history = await get<Payment[]>('/payments');
      dispatch({ type: 'SET_HISTORY', payload: history });
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to fetch payment history');
      throw new Error(message);
    }
  };

  return (
    <PaymentContext.Provider value={{ state, fetchMethods, addMethod, removeMethod, setDefaultMethod, fetchHistory }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayment() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return {
    methods: context.state.methods,
    history: context.state.history,
    isLoading: context.state.isLoading,
    fetchMethods: context.fetchMethods,
    addMethod: context.addMethod,
    removeMethod: context.removeMethod,
    setDefaultMethod: context.setDefaultMethod,
    fetchHistory: context.fetchHistory,
  };
}
