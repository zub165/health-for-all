/**
 * Hybrid Patient Service
 * Combines multiple data sources with intelligent fallback mechanisms
 * Handles SSL certificate issues and provides offline capability
 */

interface PatientData {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  age?: number;
  gender?: string;
  health_score?: number;
  address?: string;
  blood_type?: string;
  past_medical_history?: string;
  family_history?: string;
  allergies?: string[];
  current_medications?: string[];
  emergency_contact?: any;
  source: 'main_api' | 'health_fair_api' | 'local_storage' | 'cached';
  last_updated: string;
  volunteer_info?: {
    name?: string;
    organization?: string;
    role?: string;
    contact?: string;
  };
}

interface HybridResponse {
  success: boolean;
  patients: PatientData[];
  sources: {
    main_api: number;
    health_fair_api: number;
    local_storage: number;
    cached: number;
  };
  errors: string[];
  total: number;
}

class HybridPatientService {
  private cacheKey = 'health_for_all_patients_cache';
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  /**
   * Get patients from all available sources with intelligent fallback
   */
  async getPatients(): Promise<HybridResponse> {
    const sources = {
      main_api: 0,
      health_fair_api: 0,
      local_storage: 0,
      cached: 0
    };
    const errors: string[] = [];
    let allPatients: PatientData[] = [];

    console.log('🔄 Hybrid Patient Service: Starting multi-source fetch...');

    // 1. Try cached data first (fastest)
    try {
      const cachedPatients = this.getCachedPatients();
      if (cachedPatients.length > 0) {
        allPatients = [...allPatients, ...cachedPatients];
        sources.cached = cachedPatients.length;
        console.log('✅ Cached patients loaded:', cachedPatients.length);
      }
    } catch (error) {
      console.warn('⚠️ Cache failed:', error);
    }

    // 2. Try Main API (most comprehensive)
    try {
      const mainApiPatients = await this.fetchMainApiPatients();
      if (mainApiPatients.length > 0) {
        allPatients = [...allPatients, ...mainApiPatients];
        sources.main_api = mainApiPatients.length;
        console.log('✅ Main API patients loaded:', mainApiPatients.length);
        // Update cache
        this.updateCache(mainApiPatients);
      }
    } catch (error) {
      const errorMsg = `Main API failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.warn('⚠️ Main API failed:', error);
    }

    // 3. Try Health Fair API (specialized)
    try {
      const healthFairPatients = await this.fetchHealthFairPatients();
      if (healthFairPatients.length > 0) {
        allPatients = [...allPatients, ...healthFairPatients];
        sources.health_fair_api = healthFairPatients.length;
        console.log('✅ Health Fair API patients loaded:', healthFairPatients.length);
      }
    } catch (error) {
      const errorMsg = `Health Fair API failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.warn('⚠️ Health Fair API failed:', error);
    }

    // 4. Try Local Storage (offline capability)
    try {
      const localPatients = this.getLocalStoragePatients();
      if (localPatients.length > 0) {
        allPatients = [...allPatients, ...localPatients];
        sources.local_storage = localPatients.length;
        console.log('✅ Local storage patients loaded:', localPatients.length);
      }
    } catch (error) {
      console.warn('⚠️ Local storage failed:', error);
    }

    // 5. Filter out invalid placeholder entries before deduplication
    const validPatients = allPatients.filter(patient => {
      const isPlaceholder = patient.full_name === 'Local Patient' ||
                           patient.email === 'no-email@local.com' ||
                           patient.phone === 'No phone' ||
                           (!patient.email && !patient.phone && !patient.full_name);
      
      // Keep backend patients always, filter placeholders from local storage/cache
      if (patient.source === 'main_api' || patient.source === 'health_fair_api') {
        return true; // Always keep backend patients
      }
      
      // For local storage and cache, only keep if not a placeholder
      return !isPlaceholder;
    });
    
    // 6. Remove duplicates and merge data
    const uniquePatients = this.deduplicatePatients(validPatients);
    
    console.log('📊 Hybrid Patient Service Results:', {
      total: uniquePatients.length,
      sources,
      errors: errors.length
    });

    return {
      success: uniquePatients.length > 0,
      patients: uniquePatients,
      sources,
      errors,
      total: uniquePatients.length
    };
  }

  /**
   * Fetch from Main API with SSL bypass attempts
   */
  private async fetchMainApiPatients(): Promise<PatientData[]> {
    // ✅ FIXED: HTTPS via Nginx on port 443 for production
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    const endpoints = isLocalhost
      ? [
          'http://api.mywaitime.com:3015/api/patients/', // Direct to backend
        ]
      : [
          'https://api.mywaitime.com/api/patients/', // Via Nginx (port 443)
          'https://api.mywaitime.com/health-fair/patients/', // Health Fair fallback
        ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying Main API: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Origin': 'https://zub165.github.io'
          },
          // Add timeout
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.data) {
            const patients = data.data.map((patient: any) => {
              const rawVolunteerInfo =
                patient.volunteer_info ||
                patient.volunteerInfo || {
                  name: patient.volunteer_name,
                  organization: patient.volunteer_organization,
                  role: patient.volunteer_role,
                  contact: patient.volunteer_contact
                };

              const hasVolunteerData =
                !!rawVolunteerInfo &&
                !!(
                  rawVolunteerInfo.name ||
                  rawVolunteerInfo.organization ||
                  rawVolunteerInfo.role ||
                  rawVolunteerInfo.contact
                );

              const volunteerInfo = hasVolunteerData
                ? {
                    name: rawVolunteerInfo.name || undefined,
                    organization: rawVolunteerInfo.organization || undefined,
                    role: rawVolunteerInfo.role || undefined,
                    contact: rawVolunteerInfo.contact || undefined
                  }
                : undefined;

              return {
                id: patient.id,
                full_name: patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
                email: patient.email,
                phone: patient.phone,
                age: patient.age || this.calculateAge(patient.date_of_birth),
                gender: patient.gender,
                health_score: patient.health_risk_score || patient.ai_health_score,
                source: 'main_api' as const,
                last_updated: new Date().toISOString(),
                volunteer_info: volunteerInfo
              };
            });
            
            console.log(`✅ Main API success: ${endpoint}`);
            return patients;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Main API failed for ${endpoint}:`, error);
        continue; // Try next endpoint
      }
    }
    
    throw new Error('All Main API endpoints failed');
  }

  /**
   * Fetch from Health Fair API with SSL bypass attempts
   */
  private async fetchHealthFairPatients(): Promise<PatientData[]> {
    // ✅ FIXED: HTTPS via Nginx on port 443 for production
    const isLocalhost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    const endpoints = isLocalhost
      ? [
          'http://api.mywaitime.com:3015/health-fair/patients/', // Direct to backend
        ]
      : [
          'https://api.mywaitime.com/health-fair/patients/', // Via Nginx (port 443)
        ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying Health Fair API: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Origin': 'https://zub165.github.io'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success' && data.data) {
            const patients = data.data.map((patient: any) => {
              const rawVolunteerInfo =
                patient.volunteer_info ||
                patient.volunteerInfo || {
                  name: patient.volunteer_name,
                  organization: patient.volunteer_organization,
                  role: patient.volunteer_role,
                  contact: patient.volunteer_contact
                };

              const hasVolunteerData =
                !!rawVolunteerInfo &&
                !!(
                  rawVolunteerInfo.name ||
                  rawVolunteerInfo.organization ||
                  rawVolunteerInfo.role ||
                  rawVolunteerInfo.contact
                );

              const volunteerInfo = hasVolunteerData
                ? {
                    name: rawVolunteerInfo.name || undefined,
                    organization: rawVolunteerInfo.organization || undefined,
                    role: rawVolunteerInfo.role || undefined,
                    contact: rawVolunteerInfo.contact || undefined
                  }
                : undefined;

              return {
                id: patient.id,
                full_name: patient.full_name,
                email: patient.email,
                phone: patient.phone,
                age: patient.age,
                gender: patient.gender,
                health_score: patient.ai_health_score,
                source: 'health_fair_api' as const,
                last_updated: new Date().toISOString(),
                volunteer_info: volunteerInfo
              };
            });
            
            console.log(`✅ Health Fair API success: ${endpoint}`);
            return patients;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Health Fair API failed for ${endpoint}:`, error);
        continue; // Try next endpoint
      }
    }
    
    throw new Error('All Health Fair API endpoints failed');
  }

  /**
   * Get cached patients (fastest)
   * Filters out invalid placeholder entries
   */
  private getCachedPatients(): PatientData[] {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid
        if (now - timestamp < this.cacheExpiry) {
          // Filter out invalid placeholder entries
          const validPatients = data.filter((patient: any) => {
            const isPlaceholder = patient.full_name === 'Local Patient' ||
                                patient.email === 'no-email@local.com' ||
                                patient.phone === 'No phone' ||
                                (!patient.email && !patient.phone);
            return !isPlaceholder;
          });
          
          if (validPatients.length < data.length) {
            console.log(`ℹ️ Filtered out ${data.length - validPatients.length} placeholder entries from cache`);
          }
          
          return validPatients.map((patient: any) => ({
            ...patient,
            source: 'cached' as const
          }));
        }
      }
    } catch (error) {
      console.warn('Cache read failed:', error);
    }
    return [];
  }

  /**
   * Get patients from local storage
   * Only returns patients with valid data (filters out placeholder entries)
   */
  private getLocalStoragePatients(): PatientData[] {
    try {
      const localData = localStorage.getItem('health_for_all_patients');
      if (localData) {
        const patients = JSON.parse(localData);
        // Filter out invalid/placeholder entries
        const validPatients = patients.filter((patient: any) => {
          const hasValidName = patient.name || patient.full_name;
          const hasValidEmail = patient.email && 
                                patient.email !== 'no-email@local.com' && 
                                patient.email.includes('@') &&
                                !patient.email.includes('local.com');
          const hasValidPhone = patient.phoneNumber || patient.phone;
          const hasValidId = patient.id && !patient.id.startsWith('local_');
          
          // Only include if it has at least name OR (email AND phone)
          return (hasValidName && hasValidEmail) || (hasValidName && hasValidPhone && hasValidId);
        });
        
        if (validPatients.length === 0) {
          console.log('ℹ️ No valid local storage patients found (filtered out placeholders)');
          return [];
        }
        
        return validPatients.map((patient: any) => {
          const rawVolunteerInfo =
            patient.volunteer_info ||
            patient.volunteerInfo || {
              name: patient.volunteerName,
              organization: patient.volunteerOrganization,
              role: patient.volunteerRole,
              contact: patient.volunteerContact
            };

          const hasVolunteerData =
            !!rawVolunteerInfo &&
            !!(
              rawVolunteerInfo.name ||
              rawVolunteerInfo.organization ||
              rawVolunteerInfo.role ||
              rawVolunteerInfo.contact
            );

          const volunteerInfo = hasVolunteerData
            ? {
                name: rawVolunteerInfo.name || undefined,
                organization: rawVolunteerInfo.organization || undefined,
                role: rawVolunteerInfo.role || undefined,
                contact: rawVolunteerInfo.contact || undefined
              }
            : undefined;

          return {
            id: patient.id || `local_${Date.now()}_${Math.random()}`,
            full_name: patient.name || patient.full_name,
            email: patient.email,
            phone: patient.phoneNumber || patient.phone,
            age: patient.age,
            gender: patient.gender,
            health_score: patient.healthScore || patient.health_risk_score,
            source: 'local_storage' as const,
            last_updated: patient.registeredAt || patient.createdAt || new Date().toISOString(),
            volunteer_info: volunteerInfo
          };
        });
      }
    } catch (error) {
      console.warn('Local storage read failed:', error);
    }
    return [];
  }

  /**
   * Update cache with fresh data
   */
  private updateCache(patients: PatientData[]): void {
    try {
      const cacheData = {
        data: patients,
        timestamp: Date.now()
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
      console.log('💾 Cache updated with', patients.length, 'patients');
    } catch (error) {
      console.warn('Cache update failed:', error);
    }
  }

  /**
   * Remove duplicate patients based on ID and email
   */
  private deduplicatePatients(patients: PatientData[]): PatientData[] {
    const seen = new Set<string>();
    const unique: PatientData[] = [];

    for (const patient of patients) {
      const key = `${patient.id}_${patient.email}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(patient);
      }
    }

    return unique;
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: string): number {
    if (!dateOfBirth) return 0;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Get patient by ID from all sources
   */
  async getPatientById(id: string): Promise<PatientData | null> {
    const response = await this.getPatients();
    return response.patients.find(p => p.id === id) || null;
  }

  /**
   * Search patients across all sources
   */
  async searchPatients(query: string): Promise<PatientData[]> {
    const response = await this.getPatients();
    const searchTerm = query.toLowerCase();
    
    return response.patients.filter(patient => 
      patient.full_name.toLowerCase().includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm) ||
      patient.phone.includes(searchTerm)
    );
  }

  /**
   * Get statistics about data sources
   */
  getSourceStatistics(): { source: string; count: number; percentage: number }[] {
    const cached = this.getCachedPatients();
    const local = this.getLocalStoragePatients();
    
    return [
      { source: 'Cached', count: cached.length, percentage: 0 },
      { source: 'Local Storage', count: local.length, percentage: 0 },
      { source: 'Main API', count: 0, percentage: 0 },
      { source: 'Health Fair API', count: 0, percentage: 0 }
    ];
  }
}

// Create and export singleton instance
export const hybridPatientService = new HybridPatientService();

// Export types
export type { PatientData, HybridResponse };

export default hybridPatientService;
