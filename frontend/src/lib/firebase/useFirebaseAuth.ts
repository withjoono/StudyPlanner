/**
 * Firebase Auth React Hook
 *
 * Firebase 인증 상태를 React 컴포넌트에서 사용하기 위한 커스텀 훅
 */
import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  onAuthStateChange,
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut,
  getFirebaseIdToken,
  sendPasswordReset,
  getCurrentUser,
} from './auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

interface UseFirebaseAuth {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  clearError: () => void;
}

export function useFirebaseAuth(): UseFirebaseAuth {
  const [state, setState] = useState<AuthState>({
    user: getCurrentUser(),
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setState((prev) => ({
        ...prev,
        user,
        loading: false,
      }));
    });
    return () => unsubscribe();
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error, loading: false }));
      throw error;
    }
  }, []);

  const registerWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await signUpWithEmail(email, password, displayName);
      } catch (error) {
        setState((prev) => ({ ...prev, error: error as Error, loading: false }));
        throw error;
      }
    },
    [],
  );

  const loginWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithGoogle();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error, loading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await signOut();
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error, loading: false }));
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await sendPasswordReset(email);
      setState((prev) => ({ ...prev, loading: false }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error, loading: false }));
      throw error;
    }
  }, []);

  const getIdToken = useCallback(async (forceRefresh = false) => {
    return getFirebaseIdToken(forceRefresh);
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    resetPassword,
    getIdToken,
    clearError,
  };
}

export default useFirebaseAuth;
