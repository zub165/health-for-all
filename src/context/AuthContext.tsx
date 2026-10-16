import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AppRole,
  AppSession,
  clearAllSessions,
  isStaffRole,
  readAppSession,
  writePatientSession,
  writeStaffSession,
  writeVolunteerSession,
} from '../utils/appAuth';

interface AuthContextValue {
  session: AppSession | null;
  role: AppRole;
  isStaff: boolean;
  displayName: string;
  refreshSession: () => void;
  loginStaff: (input: { name: string; email: string; id?: string }) => void;
  loginPatient: (input: { name: string; email: string; id?: string }) => void;
  loginVolunteer: (input: { name: string; email: string; id?: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AppSession | null>(() => readAppSession());

  const refreshSession = useCallback(() => {
    setSession(readAppSession());
  }, []);

  useEffect(() => {
    const onStorage = () => refreshSession();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refreshSession]);

  const loginStaff = useCallback(
    (input: { name: string; email: string; id?: string }) => {
      const s = writeStaffSession(input);
      setSession(s);
    },
    []
  );

  const loginPatient = useCallback(
    (input: { name: string; email: string; id?: string }) => {
      const s = writePatientSession(input);
      setSession(s);
    },
    []
  );

  const loginVolunteer = useCallback(
    (input: { name: string; email: string; id?: string }) => {
      const s = writeVolunteerSession(input);
      setSession(s);
    },
    []
  );

  const logout = useCallback(() => {
    clearAllSessions();
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role: AppRole = session?.role || 'guest';
    return {
      session,
      role,
      isStaff: isStaffRole(role),
      displayName: session?.name || '',
      refreshSession,
      loginStaff,
      loginPatient,
      loginVolunteer,
      logout,
    };
  }, [session, refreshSession, loginStaff, loginPatient, loginVolunteer, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
