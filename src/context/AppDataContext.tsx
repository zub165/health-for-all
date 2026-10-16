/**
 * Shared app data: hybrid patients + volunteers.
 * Tabs consume this instead of independently re-fetching.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import hybridPatientService, { PatientData } from '../services/hybridPatientService';
import volunteerService, { VolunteerData } from '../services/volunteerService';

export interface AppDataContextValue {
  patients: PatientData[];
  volunteers: VolunteerData[];
  loading: boolean;
  error: string | null;
  lastSynced: Date | null;
  refreshAll: () => Promise<void>;
  refreshPatients: () => Promise<void>;
  refreshVolunteers: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

const STORAGE_KEYS = [
  'health_for_all_patients',
  'health_for_all_patients_cache',
  'health_for_all_volunteers',
];

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refreshPatients = useCallback(async () => {
    try {
      const response = await hybridPatientService.getPatients();
      if (!mountedRef.current) return;
      setPatients(response.patients || []);
      if (response.errors?.length) {
        setError((prev) => prev || response.errors.join('; '));
      }
      setLastSynced(new Date());
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Failed to load patients';
      setError(msg);
      console.error('AppDataContext refreshPatients:', err);
    }
  }, []);

  const refreshVolunteers = useCallback(async () => {
    try {
      const response = await volunteerService.getVolunteers();
      if (!mountedRef.current) return;
      setVolunteers(response.volunteers || []);
      if (response.errors?.length) {
        setError((prev) => prev || response.errors.join('; '));
      }
      setLastSynced(new Date());
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Failed to load volunteers';
      setError(msg);
      console.error('AppDataContext refreshVolunteers:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([refreshPatients(), refreshVolunteers()]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLastSynced(new Date());
      }
    }
  }, [refreshPatients, refreshVolunteers]);

  // Initial load
  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  // Cross-tab / same-window storage sync after create/update/delete
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key || STORAGE_KEYS.includes(event.key)) {
        void refreshAll();
      }
    };

    const onCustomRefresh = () => {
      void refreshAll();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('health-for-all-data-changed', onCustomRefresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('health-for-all-data-changed', onCustomRefresh);
    };
  }, [refreshAll]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      patients,
      volunteers,
      loading,
      error,
      lastSynced,
      refreshAll,
      refreshPatients,
      refreshVolunteers,
    }),
    [patients, volunteers, loading, error, lastSynced, refreshAll, refreshPatients, refreshVolunteers]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return ctx;
}

/** Notify other listeners (and context) after local create/update/delete. */
export function notifyAppDataChanged(): void {
  try {
    window.dispatchEvent(new Event('health-for-all-data-changed'));
  } catch {
    // ignore
  }
}

export default AppDataContext;
