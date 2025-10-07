// Hybrid Storage Service - Local + Backend Sync
import { Patient, Vitals, Doctor, Recommendation } from '../types';
import { patientApi, vitalsApi, doctorApi, recommendationApi } from './api';

// Storage keys for localStorage
const STORAGE_KEYS = {
  PATIENTS: 'health_for_all_patients',
  VITALS: 'health_for_all_vitals',
  DOCTORS: 'health_for_all_doctors',
  RECOMMENDATIONS: 'health_for_all_recommendations',
  SYNC_QUEUE: 'health_for_all_sync_queue',
  LAST_SYNC: 'health_for_all_last_sync',
  OFFLINE_MODE: 'health_for_all_offline_mode'
};

// Sync status types
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'error' | 'offline';

// Data item with sync metadata
export interface SyncableItem<T> {
  id: string;
  data: T;
  lastModified: number;
  syncStatus: SyncStatus;
  version: number;
  isLocal: boolean;
}

// Sync queue item
export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entityType: 'patient' | 'vitals' | 'doctor' | 'recommendation';
  data: any;
  timestamp: number;
  retryCount: number;
}

class HybridStorageService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncListeners: Array<(status: SyncStatus) => void> = [];

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.setOfflineMode(false);
      this.syncAllData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.setOfflineMode(true);
    });

    // Auto-sync when page loads if online
    if (this.isOnline) {
      setTimeout(() => this.syncAllData(), 1000);
    }
  }

  // ===== LOCAL STORAGE OPERATIONS =====

  private getLocalData<T>(key: string): SyncableItem<T>[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading local data for ${key}:`, error);
      return [];
    }
  }

  private setLocalData<T>(key: string, data: SyncableItem<T>[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving local data for ${key}:`, error);
    }
  }

  private addToSyncQueue(item: SyncQueueItem): void {
    const queue = this.getSyncQueue();
    queue.push(item);
    this.setSyncQueue(queue);
  }

  private getSyncQueue(): SyncQueueItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading sync queue:`, error);
      return [];
    }
  }

  private setSyncQueue(queue: SyncQueueItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error(`Error saving sync queue:`, error);
    }
  }

  // ===== PATIENT OPERATIONS =====

  async createPatient(patientData: Omit<Patient, 'id'>): Promise<Patient> {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPatient: Patient = {
      ...patientData,
      id: tempId
    };

    // Store locally first
    const localPatients = this.getLocalData<Patient>(STORAGE_KEYS.PATIENTS);
    const syncablePatient: SyncableItem<Patient> = {
      id: tempId,
      data: newPatient,
      lastModified: Date.now(),
      syncStatus: this.isOnline ? 'pending' : 'offline',
      version: 1,
      isLocal: true
    };

    localPatients.push(syncablePatient);
    this.setLocalData(STORAGE_KEYS.PATIENTS, localPatients);

    // Add to sync queue
    this.addToSyncQueue({
      id: tempId,
      type: 'create',
      entityType: 'patient',
      data: patientData,
      timestamp: Date.now(),
      retryCount: 0
    });

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPatient(tempId);
    }

    return newPatient;
  }

  async getPatients(): Promise<Patient[]> {
    // Always return local data first for fast response
    const localPatients = this.getLocalData<Patient>(STORAGE_KEYS.PATIENTS);
    const patients = localPatients.map(item => item.data);

    // If online, try to sync and get latest data
    if (this.isOnline && !this.syncInProgress) {
      this.syncAllData();
    }

    return patients;
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    const localPatients = this.getLocalData<Patient>(STORAGE_KEYS.PATIENTS);
    const patientIndex = localPatients.findIndex(p => p.id === id);

    if (patientIndex === -1) {
      throw new Error('Patient not found');
    }

    // Update local data
    const updatedPatient = { ...localPatients[patientIndex].data, ...updates };
    localPatients[patientIndex] = {
      ...localPatients[patientIndex],
      data: updatedPatient,
      lastModified: Date.now(),
      syncStatus: this.isOnline ? 'pending' : 'offline',
      version: localPatients[patientIndex].version + 1
    };

    this.setLocalData(STORAGE_KEYS.PATIENTS, localPatients);

    // Add to sync queue
    this.addToSyncQueue({
      id,
      type: 'update',
      entityType: 'patient',
      data: updates,
      timestamp: Date.now(),
      retryCount: 0
    });

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncPatient(id);
    }

    return updatedPatient;
  }

  // ===== SYNC OPERATIONS =====

  private async syncPatient(patientId: string): Promise<void> {
    const localPatients = this.getLocalData<Patient>(STORAGE_KEYS.PATIENTS);
    const patientItem = localPatients.find(p => p.id === patientId);

    if (!patientItem || patientItem.syncStatus === 'synced') {
      return;
    }

    try {
      patientItem.syncStatus = 'syncing';
      this.setLocalData(STORAGE_KEYS.PATIENTS, localPatients);

      if (patientItem.isLocal) {
        // Create new patient on backend
        const response = await patientApi.create(patientItem.data);
        if (response.success && response.data && response.data.id) {
          // Update local record with backend ID
          patientItem.id = response.data.id;
          patientItem.data = response.data;
          patientItem.isLocal = false;
          patientItem.syncStatus = 'synced';
        }
      } else {
        // Update existing patient on backend
        const response = await patientApi.update(patientId, patientItem.data);
        if (response.success) {
          patientItem.syncStatus = 'synced';
        }
      }

      this.setLocalData(STORAGE_KEYS.PATIENTS, localPatients);
      this.removeFromSyncQueue(patientId, 'patient');

    } catch (error) {
      console.error('Error syncing patient:', error);
      patientItem.syncStatus = 'error';
      this.setLocalData(STORAGE_KEYS.PATIENTS, localPatients);
    }
  }

  async syncAllData(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    this.notifySyncListeners('syncing');

    try {
      // Sync patients
      await this.syncPatientsFromBackend();
      
      // Process sync queue
      await this.processSyncQueue();

      // Update last sync time
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString());
      this.notifySyncListeners('synced');

    } catch (error) {
      console.error('Error during full sync:', error);
      this.notifySyncListeners('error');
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncPatientsFromBackend(): Promise<void> {
    try {
      const response = await patientApi.getAll();
      if (response.success && response.data) {
        const backendPatients = response.data.map(patient => ({
          id: patient.id || `backend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          data: patient,
          lastModified: Date.now(),
          syncStatus: 'synced' as SyncStatus,
          version: 1,
          isLocal: false
        }));

        // Merge with local data (keep local changes)
        const localPatients = this.getLocalData<Patient>(STORAGE_KEYS.PATIENTS);
        const mergedPatients = this.mergePatientData(localPatients, backendPatients);
        
        this.setLocalData(STORAGE_KEYS.PATIENTS, mergedPatients);
      }
    } catch (error) {
      console.error('Error syncing patients from backend:', error);
    }
  }

  private mergePatientData(local: SyncableItem<Patient>[], backend: SyncableItem<Patient>[]): SyncableItem<Patient>[] {
    const merged = [...local];

    backend.forEach(backendPatient => {
      const localIndex = merged.findIndex(p => p.id === backendPatient.id);
      
      if (localIndex === -1) {
        // New patient from backend
        merged.push(backendPatient);
      } else {
        // Merge logic: keep local changes if newer
        const localPatient = merged[localIndex];
        if (localPatient.lastModified > backendPatient.lastModified) {
          // Keep local version, but mark for sync
          localPatient.syncStatus = 'pending';
        } else {
          // Use backend version
          merged[localIndex] = backendPatient;
        }
      }
    });

    return merged;
  }

  private async processSyncQueue(): Promise<void> {
    const queue = this.getSyncQueue();
    const processedItems: string[] = [];

    for (const item of queue) {
      try {
        if (item.entityType === 'patient') {
          await this.syncPatient(item.id);
          processedItems.push(item.id);
        }
        // Add other entity types here (vitals, doctors, etc.)
      } catch (error) {
        console.error(`Error processing sync queue item ${item.id}:`, error);
        item.retryCount++;
        
        // Remove from queue if too many retries
        if (item.retryCount > 3) {
          processedItems.push(item.id);
        }
      }
    }

    // Remove processed items from queue
    const updatedQueue = queue.filter(item => !processedItems.includes(item.id));
    this.setSyncQueue(updatedQueue);
  }

  private removeFromSyncQueue(id: string, entityType: string): void {
    const queue = this.getSyncQueue();
    const updatedQueue = queue.filter(item => !(item.id === id && item.entityType === entityType));
    this.setSyncQueue(updatedQueue);
  }

  // ===== UTILITY METHODS =====

  private setOfflineMode(isOffline: boolean): void {
    localStorage.setItem(STORAGE_KEYS.OFFLINE_MODE, isOffline.toString());
  }

  isOfflineMode(): boolean {
    return localStorage.getItem(STORAGE_KEYS.OFFLINE_MODE) === 'true';
  }

  getLastSyncTime(): number {
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return lastSync ? parseInt(lastSync) : 0;
  }

  getSyncStatus(): SyncStatus {
    if (this.isOfflineMode()) return 'offline';
    if (this.syncInProgress) return 'syncing';
    
    const queue = this.getSyncQueue();
    if (queue.length > 0) return 'pending';
    
    return 'synced';
  }

  addSyncListener(callback: (status: SyncStatus) => void): void {
    this.syncListeners.push(callback);
  }

  removeSyncListener(callback: (status: SyncStatus) => void): void {
    this.syncListeners = this.syncListeners.filter(listener => listener !== callback);
  }

  private notifySyncListeners(status: SyncStatus): void {
    this.syncListeners.forEach(listener => listener(status));
  }

  // ===== CLEANUP METHODS =====

  clearLocalData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  getStorageStats(): { localPatients: number; syncQueue: number; lastSync: string } {
    const localPatients = this.getLocalData<Patient>(STORAGE_KEYS.PATIENTS).length;
    const syncQueue = this.getSyncQueue().length;
    const lastSync = new Date(this.getLastSyncTime()).toLocaleString();
    
    return { localPatients, syncQueue, lastSync };
  }
}

// Export singleton instance
export const hybridStorage = new HybridStorageService();
export default hybridStorage;
