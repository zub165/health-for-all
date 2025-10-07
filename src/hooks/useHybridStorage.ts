// React Hook for Hybrid Storage
import { useState, useEffect, useCallback } from 'react';
import { Patient, Vitals, Doctor, Recommendation } from '../types';
import { hybridStorage, SyncStatus } from '../services/hybridStorage';

// Hook for managing patients with hybrid storage
export const useHybridPatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('pending');

  // Load patients from hybrid storage
  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const patientData = await hybridStorage.getPatients();
      setPatients(patientData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new patient
  const createPatient = useCallback(async (patientData: Omit<Patient, 'id'>) => {
    try {
      setError(null);
      const newPatient = await hybridStorage.createPatient(patientData);
      setPatients(prev => [...prev, newPatient]);
      return newPatient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create patient';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Update patient
  const updatePatient = useCallback(async (id: string, updates: Partial<Patient>) => {
    try {
      setError(null);
      const updatedPatient = await hybridStorage.updatePatient(id, updates);
      setPatients(prev => prev.map(p => p.id === id ? updatedPatient : p));
      return updatedPatient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update patient';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Sync all data
  const syncData = useCallback(async () => {
    try {
      setError(null);
      await hybridStorage.syncAllData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync data';
      setError(errorMessage);
    }
  }, []);

  // Listen for sync status changes
  useEffect(() => {
    const handleSyncStatusChange = (status: SyncStatus) => {
      setSyncStatus(status);
    };

    hybridStorage.addSyncListener(handleSyncStatusChange);
    setSyncStatus(hybridStorage.getSyncStatus());

    return () => {
      hybridStorage.removeSyncListener(handleSyncStatusChange);
    };
  }, []);

  // Load patients on mount
  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Auto-refresh when sync completes
  useEffect(() => {
    if (syncStatus === 'synced') {
      loadPatients();
    }
  }, [syncStatus, loadPatients]);

  return {
    patients,
    loading,
    error,
    syncStatus,
    createPatient,
    updatePatient,
    syncData,
    refresh: loadPatients
  };
};

// Hook for sync status and offline mode
export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('pending');
  const [isOffline, setIsOffline] = useState(hybridStorage.isOfflineMode());
  const [lastSync, setLastSync] = useState(hybridStorage.getLastSyncTime());
  const [storageStats, setStorageStats] = useState(hybridStorage.getStorageStats());

  useEffect(() => {
    const handleSyncStatusChange = (status: SyncStatus) => {
      setSyncStatus(status);
      setIsOffline(hybridStorage.isOfflineMode());
      setLastSync(hybridStorage.getLastSyncTime());
      setStorageStats(hybridStorage.getStorageStats());
    };

    hybridStorage.addSyncListener(handleSyncStatusChange);
    setSyncStatus(hybridStorage.getSyncStatus());
    setIsOffline(hybridStorage.isOfflineMode());
    setLastSync(hybridStorage.getLastSyncTime());
    setStorageStats(hybridStorage.getStorageStats());

    return () => {
      hybridStorage.removeSyncListener(handleSyncStatusChange);
    };
  }, []);

  const syncData = useCallback(async () => {
    await hybridStorage.syncAllData();
  }, []);

  const clearLocalData = useCallback(() => {
    hybridStorage.clearLocalData();
    setStorageStats(hybridStorage.getStorageStats());
  }, []);

  return {
    syncStatus,
    isOffline,
    lastSync,
    storageStats,
    syncData,
    clearLocalData
  };
};

// Hook for offline/online status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Generic hook for any entity type
export const useHybridEntity = <T extends { id: string }>(
  entityType: 'patient' | 'vitals' | 'doctor' | 'recommendation',
  storageKey: string
) => {
  const [entities, setEntities] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // This would be implemented based on the specific entity type
      // For now, using patients as example
      if (entityType === 'patient') {
        const data = await hybridStorage.getPatients();
        setEntities(data as T[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  return {
    entities,
    loading,
    error,
    refresh: loadEntities
  };
};
