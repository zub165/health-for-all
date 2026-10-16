/**
 * Medication search + Rx prescriptions (hybrid).
 * Search: NIH RxTerms (CORS) + GoDaddy /api/medications/
 * Orders: localStorage + mirrored into patient SOAP plan / treatment text.
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

export interface RxPrescription {
  id: string;
  patientId: string;
  drugName: string;
  sig: string;
  quantity?: string;
  refills?: string;
  prescribedBy: string;
  prescribedAt: string;
  source: 'rxterms' | 'godaddy' | 'local' | 'manual';
  status: 'active' | 'cancelled';
}

const RXTERMS = 'https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search';
const GODADDY_MEDS = 'https://api.mywaitime.com/api/medications/';
const RX_KEY = 'hfa_patient_rx_v1';

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

function readRx(): RxPrescription[] {
  try {
    const raw = localStorage.getItem(RX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRx(list: RxPrescription[]): void {
  localStorage.setItem(RX_KEY, JSON.stringify(list));
}

class MedicationApiService {
  readonly apiUrls = {
    rxterms: RXTERMS,
    godaddy: GODADDY_MEDS,
  };

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
        `${GODADDY_MEDS}?q=${encodeURIComponent(q)}&page_size=${limit}`,
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
      message: data.length ? 'Medications retrieved (RxTerms + GoDaddy)' : 'No medication matches',
    };
  }

  getPrescriptions(patientId: string): RxPrescription[] {
    return readRx()
      .filter((r) => r.patientId === patientId && r.status === 'active')
      .sort((a, b) => new Date(b.prescribedAt).getTime() - new Date(a.prescribedAt).getTime());
  }

  createPrescription(input: {
    patientId: string;
    drugName: string;
    sig: string;
    quantity?: string;
    refills?: string;
    prescribedBy: string;
    source?: RxPrescription['source'];
  }): RxPrescription {
    const rx: RxPrescription = {
      id: `rx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      patientId: input.patientId,
      drugName: input.drugName.trim(),
      sig: input.sig.trim() || 'Take as directed',
      quantity: input.quantity,
      refills: input.refills || '0',
      prescribedBy: input.prescribedBy,
      prescribedAt: new Date().toISOString(),
      source: input.source || 'rxterms',
      status: 'active',
    };
    const all = readRx();
    all.unshift(rx);
    writeRx(all);

    // Best-effort mirror to GoDaddy medications endpoint (may be empty catalog)
    void fetch(GODADDY_MEDS, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: rx.drugName,
        patient: input.patientId,
        sig: rx.sig,
        quantity: rx.quantity,
        refills: rx.refills,
        prescribed_by: rx.prescribedBy,
      }),
    }).catch(() => undefined);

    return rx;
  }

  cancelPrescription(id: string): void {
    writeRx(
      readRx().map((r) => (r.id === id ? { ...r, status: 'cancelled' as const } : r))
    );
  }

  formatPlanLines(patientId: string): string {
    return this.getPrescriptions(patientId)
      .map((r) => `Rx: ${r.drugName} — ${r.sig}${r.quantity ? ` qty ${r.quantity}` : ''}`)
      .join('\n');
  }
}

export const medicationApi = new MedicationApiService();
