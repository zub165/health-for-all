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
  private lastGoodKey = 'health_for_all_patients_last_good';
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

    // 1. Main API is source of truth when online — do NOT merge stale cache first
    //    (old cache was re-adding deleted patients after DELETE + refresh).
    let mainApiOk = false;
    try {
      const mainApiPatients = await this.fetchMainApiPatients();
      mainApiOk = true;
      allPatients = [...mainApiPatients];
      sources.main_api = mainApiPatients.length;
      console.log('✅ Main API patients loaded:', mainApiPatients.length);
      this.updateCache(mainApiPatients);
    } catch (error) {
      const errorMsg = `Main API failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.warn('⚠️ Main API failed:', error);
    }

    // 2. On throttle/network failure: keep last-good list (ignore 5-min expiry)
    //    so a 429 does not wipe the Doctor Dashboard to "0 patients".
    if (!mainApiOk) {
      try {
        const cachedPatients = this.getCachedPatients({ ignoreExpiry: true });
        if (cachedPatients.length > 0) {
          allPatients = [...allPatients, ...cachedPatients];
          sources.cached = cachedPatients.length;
          errors.push(
            'Showing last saved patient list — GoDaddy API was busy/throttled. Click Refresh shortly.'
          );
          console.log('✅ Last-good cache fallback:', cachedPatients.length);
        }
      } catch (error) {
        console.warn('⚠️ Cache failed:', error);
      }
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
    
    // Default API page size is 20 — without page_size, deletes look like they "come back"
    // because the next page of duplicates is loaded on refresh.
    const endpoints = isLocalhost
      ? [
          'http://api.mywaitime.com:3015/api/patients/?page_size=500',
        ]
      : [
          'https://api.mywaitime.com/api/patients/?page_size=500',
          'https://api.mywaitime.com/health-fair/patients/?page_size=500',
        ];

    for (const endpoint of endpoints) {
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          console.log(`🔄 Trying Main API: ${endpoint} (attempt ${attempt + 1})`);

          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
            signal: AbortSignal.timeout(15000),
          });

          // Django REST throttle — wait and retry instead of blanking the UI
          if (response.status === 429) {
            let waitSec = 5 + attempt * 5;
            try {
              const body = await response.json();
              const detail = String(body?.errors?.detail || body?.detail || '');
              const m = detail.match(/(\d+)\s*seconds?/i);
              if (m) waitSec = Math.min(60, parseInt(m[1], 10) + 1);
            } catch {
              /* ignore */
            }
            console.warn(`⏳ Patients API throttled (429). Retry in ${waitSec}s…`);
            await new Promise((r) => setTimeout(r, waitSec * 1000));
            continue;
          }

          if (response.ok) {
            const data = await response.json();
            const rows = Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : null;
            if ((data.status === 'success' || Array.isArray(data)) && rows) {
              const patients = rows.map((patient: any) => {
                const rawVolunteerInfo =
                  patient.volunteer_info ||
                  patient.volunteerInfo || {
                    name: patient.volunteer_name,
                    organization: patient.volunteer_organization,
                    role: patient.volunteer_role,
                    contact: patient.volunteer_contact,
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
                      contact: rawVolunteerInfo.contact || undefined,
                    }
                  : undefined;

                return {
                  id: patient.id,
                  first_name: patient.first_name,
                  last_name: patient.last_name,
                  full_name:
                    patient.full_name ||
                    `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
                  email: patient.email,
                  phone: patient.phone,
                  age: patient.age || this.calculateAge(patient.date_of_birth),
                  gender: patient.gender,
                  health_score: patient.health_risk_score || patient.ai_health_score,
                  source: 'main_api' as const,
                  last_updated: new Date().toISOString(),
                  volunteer_info: volunteerInfo,
                };
              });

              console.log(`✅ Main API success: ${endpoint} (${patients.length})`);
              return patients;
            }
          }
          break; // non-429 failure for this endpoint — try next URL
        } catch (error) {
          console.warn(`⚠️ Main API failed for ${endpoint}:`, error);
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
            continue;
          }
        }
      }
    }

    throw new Error('All Main API endpoints failed (throttled or unreachable)');
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
  private getCachedPatients(opts?: { ignoreExpiry?: boolean }): PatientData[] {
    try {
      const preferLastGood = !!opts?.ignoreExpiry;
      const raw = preferLastGood
        ? localStorage.getItem(this.lastGoodKey) || localStorage.getItem(this.cacheKey)
        : localStorage.getItem(this.cacheKey);
      if (!raw) return [];
      const { data, timestamp } = JSON.parse(raw);
      if (!preferLastGood && Date.now() - (timestamp || 0) >= this.cacheExpiry) {
        return [];
      }
      const list = Array.isArray(data) ? data : [];
      const validPatients = list.filter((patient: any) => {
        const isPlaceholder =
          patient.full_name === 'Local Patient' ||
          patient.email === 'no-email@local.com' ||
          patient.phone === 'No phone' ||
          (!patient.email && !patient.phone);
        return !isPlaceholder;
      });
      return validPatients.map((patient: any) => ({
        ...patient,
        source: 'cached' as const,
      }));
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
        timestamp: Date.now(),
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
      // Always keep last-good snapshot for 429 / offline fallback (even if list is small)
      localStorage.setItem(this.lastGoodKey, JSON.stringify(cacheData));
      console.log('💾 Cache updated with', patients.length, 'patients');
    } catch (error) {
      console.warn('Cache update failed:', error);
    }
  }

  /** Remove deleted IDs from browser cache + local hybrid list so they cannot reappear. */
  purgeLocalPatients(ids: string[]): void {
    const idSet = new Set(ids.filter(Boolean));
    if (idSet.size === 0) return;
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const data = Array.isArray(parsed?.data) ? parsed.data : [];
        parsed.data = data.filter((p: { id?: string }) => !idSet.has(String(p?.id)));
        parsed.timestamp = Date.now();
        localStorage.setItem(this.cacheKey, JSON.stringify(parsed));
      }
    } catch {
      /* ignore */
    }
    try {
      const localRaw = localStorage.getItem('health_for_all_patients');
      if (localRaw) {
        const list = JSON.parse(localRaw);
        if (Array.isArray(list)) {
          localStorage.setItem(
            'health_for_all_patients',
            JSON.stringify(list.filter((p: { id?: string }) => !idSet.has(String(p?.id))))
          );
        }
      }
    } catch {
      /* ignore */
    }
  }

  clearPatientCache(): void {
    try {
      localStorage.removeItem(this.cacheKey);
    } catch {
      /* ignore */
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
