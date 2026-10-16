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
import { useAuth } from './AuthContext';
import {
  isStaffRole,
  scopePatientsForSession,
  scopeVolunteersForSession,
} from '../utils/appAuth';

export interface AppDataContextValue {
  /** Role-scoped: staff see all; patient/volunteer see only self; guest sees none. */
  patients: PatientData[];
  volunteers: VolunteerData[];
  /** Unfiltered hybrid lists — staff tools only; do not render for patient/volunteer. */
  allPatients: PatientData[];
  allVolunteers: VolunteerData[];
  /** True only on first load when no patients are shown yet — avoids list flicker. */
  loading: boolean;
  /** Background sync in progress; keep existing UI visible. */
  refreshing: boolean;
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
  const { session, role } = useAuth();
  const [allPatients, setAllPatients] = useState<PatientData[]>([]);
  const [allVolunteers, setAllVolunteers] = useState<VolunteerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const mountedRef = useRef(true);
  const hasLoadedOnceRef = useRef(false);
  const refreshInFlightRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const refreshPatients = useCallback(async () => {
    try {
      const response = await hybridPatientService.getPatients();
      if (!mountedRef.current) return;
      setAllPatients(response.patients || []);
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
      setAllVolunteers(response.volunteers || []);
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
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    const isInitial = !hasLoadedOnceRef.current;
    if (isInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    try {
      await Promise.all([refreshPatients(), refreshVolunteers()]);
    } finally {
      if (mountedRef.current) {
        hasLoadedOnceRef.current = true;
        setLoading(false);
        setRefreshing(false);
        setLastSynced(new Date());
      }
      refreshInFlightRef.current = false;
    }
  }, [refreshPatients, refreshVolunteers]);

  const scheduleRefreshAll = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      void refreshAll();
    }, 400);
  }, [refreshAll]);

  // Initial load
  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  // Cross-tab / same-window storage sync after create/update/delete (debounced)
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!event.key || STORAGE_KEYS.includes(event.key)) {
        scheduleRefreshAll();
      }
    };

    const onCustomRefresh = () => {
      scheduleRefreshAll();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('health-for-all-data-changed', onCustomRefresh);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('health-for-all-data-changed', onCustomRefresh);
    };
  }, [scheduleRefreshAll]);

  const patients = useMemo(
    () => scopePatientsForSession(allPatients, session),
    [allPatients, session]
  );
  const volunteers = useMemo(
    () => scopeVolunteersForSession(allVolunteers, session),
    [allVolunteers, session]
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      patients,
      volunteers,
      // Never expose full rosters to patient/volunteer consumers
      allPatients: isStaffRole(role) ? allPatients : patients,
      allVolunteers: isStaffRole(role) ? allVolunteers : volunteers,
      loading,
      refreshing,
      error,
      lastSynced,
      refreshAll,
      refreshPatients,
      refreshVolunteers,
    }),
    [
      patients,
      volunteers,
      allPatients,
      allVolunteers,
      role,
      loading,
      refreshing,
      error,
      lastSynced,
      refreshAll,
      refreshPatients,
      refreshVolunteers,
    ]
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
