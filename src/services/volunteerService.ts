/**
 * Volunteer Service
 * Handles volunteer registration and retrieval using a hybrid approach:
 * - Attempts to sync with backend Health Fair API when available
 * - Falls back to local storage for offline resilience
 * - Sends volunteer interest emails via EmailJS as a notification channel
 */

import healthForAllEmailJS from './emailJSService';

export interface VolunteerData {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  organization?: string;
  role?: string;
  availability?: string;
  skills?: string[];
  notes?: string;
  created_at: string;
  source: 'backend' | 'local';
}

export interface VolunteerInput {
  full_name: string;
  email: string;
  phone: string;
  organization?: string;
  role?: string;
  availability?: string;
  skills?: string[];
  notes?: string;
}

interface VolunteerResponse {
  success: boolean;
  volunteers: VolunteerData[];
  errors: string[];
}

interface RegisterVolunteerResult {
  success: boolean;
  volunteer: VolunteerData;
  message?: string;
  error?: string;
}

class VolunteerService {
  private localStorageKey = 'health_for_all_volunteers';

  /**
   * Retrieve volunteers from backend + local storage
   */
  async getVolunteers(): Promise<VolunteerResponse> {
    const volunteers: VolunteerData[] = [];
    const errors: string[] = [];

    // 1. Attempt to fetch from backend (Health Fair API)
    try {
      const backendVolunteers = await this.fetchBackendVolunteers();
      volunteers.push(...backendVolunteers);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch backend volunteers';
      console.warn('⚠️ VolunteerService backend fetch failed:', errorMsg);
      errors.push(errorMsg);
    }

    // 2. Merge local storage volunteers
    try {
      const localVolunteers = this.getLocalVolunteers();
      // De-duplicate using email + phone combination
      const existingKeys = new Set(volunteers.map((vol) => this.getVolunteerKey(vol)));
      localVolunteers.forEach((volunteer) => {
        const key = this.getVolunteerKey(volunteer);
        if (!existingKeys.has(key)) {
          volunteers.push(volunteer);
        }
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to read local volunteers';
      console.warn('⚠️ VolunteerService local storage read failed:', errorMsg);
      errors.push(errorMsg);
    }

    return {
      success: volunteers.length > 0,
      volunteers: volunteers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      errors
    };
  }

  /**
   * Register a new volunteer
   * Attempts backend sync, sends notification email, and stores locally.
   */
  async registerVolunteer(input: VolunteerInput): Promise<RegisterVolunteerResult> {
    const timestamp = new Date().toISOString();
    const volunteerRecord: VolunteerData = {
      id: `vol_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
      organization: input.organization,
      role: input.role,
      availability: input.availability,
      skills: input.skills,
      notes: input.notes,
      created_at: timestamp,
      source: 'local'
    };

    let backendVolunteer: VolunteerData | null = null;

    // 1. Attempt to sync with backend
    try {
      backendVolunteer = await this.saveVolunteerToBackend(input);
      if (backendVolunteer) {
        volunteerRecord.id = backendVolunteer.id;
        volunteerRecord.created_at = backendVolunteer.created_at;
        volunteerRecord.source = 'backend';
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to sync volunteer with backend';
      console.warn('⚠️ VolunteerService backend save failed:', errorMsg);
    }

    // 2. Store locally (always, to ensure offline availability)
    this.saveVolunteerToLocal(volunteerRecord);

    // 3. Send volunteer interest email (best effort)
    try {
      await healthForAllEmailJS.sendVolunteerEmail({
        from_name: volunteerRecord.full_name,
        from_email: volunteerRecord.email,
        volunteer_interest: [
          `Organization: ${volunteerRecord.organization || 'Not specified'}`,
          `Role: ${volunteerRecord.role || 'Not specified'}`,
          `Availability: ${volunteerRecord.availability || 'Not specified'}`,
          `Skills: ${(volunteerRecord.skills || []).join(', ') || 'Not specified'}`,
          volunteerRecord.notes ? `Notes: ${volunteerRecord.notes}` : null
        ]
          .filter(Boolean)
          .join('\n')
      });
    } catch (error) {
      console.warn('⚠️ VolunteerService email notification failed:', error);
    }

    return {
      success: true,
      volunteer: backendVolunteer || volunteerRecord,
      message: backendVolunteer
        ? 'Volunteer registered and synced with backend successfully.'
        : 'Volunteer saved locally (backend sync not available).'
    };
  }

  /**
   * Fetch volunteers from backend API
   */
  private async fetchBackendVolunteers(): Promise<VolunteerData[]> {
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const endpoints = isLocalhost
      ? ['http://api.mywaitime.com:3015/health-fair/volunteers/']
      : ['https://api.mywaitime.com/health-fair/volunteers/'];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 VolunteerService fetching: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Origin: 'https://zub165.github.io'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            return data.map((volunteer: any) => this.normalizeBackendVolunteer(volunteer));
          }

          if (data.status === 'success' && Array.isArray(data.data)) {
            return data.data.map((volunteer: any) => this.normalizeBackendVolunteer(volunteer));
          }
        }
      } catch (error) {
        console.warn(`⚠️ VolunteerService backend endpoint failed (${endpoint}):`, error);
      }
    }

    throw new Error('All volunteer backend endpoints failed');
  }

  /**
   * Save volunteer to backend API
   */
  private async saveVolunteerToBackend(input: VolunteerInput): Promise<VolunteerData | null> {
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const endpoint = isLocalhost
      ? 'http://api.mywaitime.com:3015/health-fair/volunteers/'
      : 'https://api.mywaitime.com/health-fair/volunteers/';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: 'https://zub165.github.io'
        },
        body: JSON.stringify({
          full_name: input.full_name,
          email: input.email,
          phone: input.phone,
          organization: input.organization,
          role: input.role,
          availability: input.availability,
          skills: input.skills,
          notes: input.notes
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.message || response.statusText;
        throw new Error(`Backend volunteer save failed: ${errorMsg}`);
      }

      const data = await response.json().catch(() => null);
      if (data) {
        if (data.status === 'success' && data.data) {
          return this.normalizeBackendVolunteer(data.data);
        }
        if (data.id || data.full_name) {
          return this.normalizeBackendVolunteer(data);
        }
      }

      return null;
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Normalize backend payload into VolunteerData format
   */
  private normalizeBackendVolunteer(data: any): VolunteerData {
    return {
      id: data.id || data.uuid || `backend_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      full_name: data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Volunteer',
      email: data.email || 'no-email@volunteer.org',
      phone: data.phone || data.phone_number || 'No phone provided',
      organization: data.organization || data.affiliation || '',
      role: data.role || data.position || '',
      availability: data.availability || data.preferred_shift || '',
      skills: Array.isArray(data.skills) ? data.skills : data.skills ? String(data.skills).split(',').map((s: string) => s.trim()) : undefined,
      notes: data.notes || data.comments || '',
      created_at: data.created_at || data.registered_at || new Date().toISOString(),
      source: 'backend'
    };
  }

  /**
   * Retrieve volunteers from local storage
   */
  private getLocalVolunteers(): VolunteerData[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((volunteer: any) => ({
        id: volunteer.id,
        full_name: volunteer.full_name,
        email: volunteer.email,
        phone: volunteer.phone,
        organization: volunteer.organization,
        role: volunteer.role,
        availability: volunteer.availability,
        skills: volunteer.skills,
        notes: volunteer.notes,
        created_at: volunteer.created_at,
        source: 'local' as const
      }));
    } catch (error) {
      console.warn('VolunteerService local storage parse failed:', error);
      return [];
    }
  }

  /**
   * Save volunteer to local storage (merge + deduplicate)
   */
  private saveVolunteerToLocal(volunteer: VolunteerData): void {
    if (typeof window === 'undefined') return;
    try {
      const existing = this.getLocalVolunteers();
      const key = this.getVolunteerKey(volunteer);
      const updated = existing.filter((v) => this.getVolunteerKey(v) !== key);
      updated.push(volunteer);
      localStorage.setItem(this.localStorageKey, JSON.stringify(updated));
      console.log('💾 Volunteer cached locally:', volunteer.full_name);
    } catch (error) {
      console.warn('VolunteerService local storage save failed:', error);
    }
  }

  private getVolunteerKey(volunteer: VolunteerData): string {
    return `${(volunteer.email || '').toLowerCase()}_${volunteer.phone || ''}`.trim();
  }
}

export const volunteerService = new VolunteerService();
export type { VolunteerResponse, RegisterVolunteerResult };
export default volunteerService;

