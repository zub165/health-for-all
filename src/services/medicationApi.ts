/**
 * Medication search — NIH RxTerms (CORS-friendly) + optional GoDaddy catalog.
 */

export interface MedicationResult {
  name: string;
  source: 'rxterms' | 'godaddy' | 'local';
}

export interface MedicationApiResponse {
  success: boolean;
  data?: MedicationResult[];
  error?: string;
  message?: string;
}

const RXTERMS = 'https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search';

const LOCAL_MEDS = [
  'Lisinopril 10 MG Oral Tablet',
  'Metformin 500 MG Oral Tablet',
  'Atorvastatin 20 MG Oral Tablet',
  'Amlodipine 5 MG Oral Tablet',
  'Losartan 50 MG Oral Tablet',
  'Omeprazole 20 MG Delayed Release Oral Capsule',
  'Levothyroxine 50 MCG Oral Tablet',
  'Metoprolol Succinate 25 MG Oral Tablet',
  'Aspirin 81 MG Oral Tablet',
  'Albuterol 90 MCG/ACTUATION Metered Dose Inhaler',
];

class MedicationApiService {
  async search(query: string, limit = 15): Promise<MedicationApiResponse> {
    const q = query.trim();
    if (!q) {
      return { success: true, data: [], message: 'Empty query' };
    }

    const byName = new Map<string, MedicationResult>();

    LOCAL_MEDS.filter((m) => m.toLowerCase().includes(q.toLowerCase())).forEach((name) => {
      byName.set(name.toLowerCase(), { name, source: 'local' });
    });

    try {
      const url = `${RXTERMS}?terms=${encodeURIComponent(q)}&maxList=${limit}`;
      const res = await fetch(url, { method: 'GET', mode: 'cors' });
      if (res.ok) {
        const data = await res.json();
        const names: string[] = Array.isArray(data?.[1]) ? data[1] : [];
        names.forEach((name) => {
          if (name) byName.set(String(name).toLowerCase(), { name: String(name), source: 'rxterms' });
        });
      }
    } catch (err) {
      console.warn('RxTerms search failed:', err);
    }

    try {
      const res = await fetch(
        `https://api.mywaitime.com/api/medications/?q=${encodeURIComponent(q)}&page_size=${limit}`,
        { headers: { Accept: 'application/json' } }
      );
      if (res.ok) {
        const body = await res.json();
        const rows = Array.isArray(body?.data) ? body.data : [];
        rows.forEach((row: { name?: string; drug_name?: string; medication_name?: string }) => {
          const name = row.name || row.drug_name || row.medication_name;
          if (name) byName.set(String(name).toLowerCase(), { name: String(name), source: 'godaddy' });
        });
      }
    } catch {
      /* optional catalog */
    }

    const data = Array.from(byName.values()).slice(0, limit);
    return {
      success: true,
      data,
      message: data.length ? 'Medications retrieved' : 'No medication matches',
    };
  }
}

export const medicationApi = new MedicationApiService();
