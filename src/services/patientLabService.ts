/**
 * Hybrid Lab + Radiology orders for Health For ALL patients.
 *
 * Local: localStorage
 * Backend: https://api.mywaitime.com/api/lab-results/  (GoDaddy hospitalfinder :3015)
 * Catalog: https://api.mywaitime.com/lab/tests/       (same VPS, lab_management)
 *
 * Radiology = test_category "imaging" (XRAY/CT/MRI/US from Lab Imaging catalog).
 */
import { GODADDY_BACKENDS, categoryFromLabTest, LabResultCategory } from '../config/godaddyBackends';
import type { LabTest } from './labApi';

const LOCAL_KEY = 'hfa_patient_lab_orders_v1';
const DEFAULT_DOCTOR_KEY = 'hfa_default_doctor_id_v1';

export interface PatientLabOrder {
  id: string;
  patientId: string;
  patientName: string;
  kind: 'lab' | 'radiology';
  testId: string;
  testCode: string;
  testName: string;
  categoryName: string;
  apiCategory: LabResultCategory;
  priority: 'routine' | 'urgent' | 'stat';
  orderedBy: string;
  orderDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  resultValue?: string;
  resultUnit?: string;
  referenceRange?: string;
  resultStatus?: 'normal' | 'abnormal' | 'critical' | 'report';
  backendId?: string;
  source: 'local' | 'backend' | 'hybrid';
}

function readLocal(): PatientLabOrder[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(orders: PatientLabOrder[]): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(orders));
}

function uid(): string {
  return `hfa-lab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function fetchDefaultDoctorId(): Promise<string | null> {
  try {
    const cached = localStorage.getItem(DEFAULT_DOCTOR_KEY);
    if (cached) return cached;
    const res = await fetch(`${GODADDY_BACKENDS.hospitalFinder.doctors}?page_size=5`);
    if (!res.ok) return null;
    const json = await res.json();
    const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    const id = list[0]?.id as string | undefined;
    if (id) localStorage.setItem(DEFAULT_DOCTOR_KEY, id);
    return id || null;
  } catch {
    return null;
  }
}

function mapBackendRow(row: Record<string, unknown>, patientName: string): PatientLabOrder {
  const cat = String(row.test_category || 'other');
  const kind: 'lab' | 'radiology' = cat === 'imaging' ? 'radiology' : 'lab';
  return {
    id: String(row.id),
    patientId: String(row.patient),
    patientName,
    kind,
    testId: String(row.id),
    testCode: String(row.lab_reference || cat).toUpperCase(),
    testName: String(row.test_name || 'Test'),
    categoryName: cat,
    apiCategory: cat as LabResultCategory,
    priority: 'routine',
    orderedBy: String(row.doctor_name || row.lab_name || 'Staff'),
    orderDate: String(row.test_date || row.created_at || new Date().toISOString()),
    status: String(row.status || 'pending') as PatientLabOrder['status'],
    notes: String(row.notes || ''),
    resultValue: String(row.result_value || ''),
    resultUnit: String(row.units || ''),
    referenceRange: String(row.normal_range || ''),
    resultStatus: cat === 'imaging' ? 'report' : 'normal',
    backendId: String(row.id),
    source: 'backend',
  };
}

class PatientLabService {
  getLocalOrders(patientId?: string): PatientLabOrder[] {
    const all = readLocal();
    return patientId ? all.filter((o) => o.patientId === patientId) : all;
  }

  async getOrdersForPatient(patientId: string, patientName = ''): Promise<PatientLabOrder[]> {
    const local = this.getLocalOrders(patientId);
    let remote: PatientLabOrder[] = [];
    try {
      const url = `${GODADDY_BACKENDS.hospitalFinder.labResults}?patient=${encodeURIComponent(patientId)}&page_size=100`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const rows = Array.isArray(json?.data) ? json.data : [];
        remote = rows.map((r: Record<string, unknown>) => mapBackendRow(r, patientName));
      }
    } catch (e) {
      console.warn('patientLabService remote fetch failed:', e);
    }

    const byKey = new Map<string, PatientLabOrder>();
    for (const o of remote) byKey.set(o.backendId || o.id, { ...o, source: 'backend' });
    for (const o of local) {
      const key = o.backendId || o.id;
      if (byKey.has(key)) {
        byKey.set(key, { ...byKey.get(key)!, ...o, source: 'hybrid' });
      } else {
        byKey.set(key, o);
      }
    }
    return Array.from(byKey.values()).sort(
      (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    );
  }

  async createOrder(input: {
    patientId: string;
    patientName: string;
    test: LabTest;
    orderedBy: string;
    priority: 'routine' | 'urgent' | 'stat';
    notes?: string;
    kind?: 'lab' | 'radiology';
  }): Promise<{ success: boolean; order?: PatientLabOrder; error?: string; backendSynced: boolean }> {
    const apiCategory = categoryFromLabTest(input.test.category_name, input.test.test_code);
    const kind =
      input.kind ||
      (apiCategory === 'imaging' ? 'radiology' : 'lab');

    const order: PatientLabOrder = {
      id: uid(),
      patientId: input.patientId,
      patientName: input.patientName,
      kind,
      testId: input.test.id,
      testCode: input.test.test_code,
      testName: input.test.test_name,
      categoryName: input.test.category_name,
      apiCategory,
      priority: input.priority,
      orderedBy: input.orderedBy || 'Health For ALL staff',
      orderDate: new Date().toISOString(),
      status: 'pending',
      notes: input.notes,
      resultValue: kind === 'radiology' ? 'Ordered — awaiting report' : 'Pending',
      resultUnit: input.test.unit || (kind === 'radiology' ? 'report' : ''),
      referenceRange: input.test.normal_range || 'N/A',
      resultStatus: kind === 'radiology' ? 'report' : 'normal',
      source: 'local',
    };

    const all = readLocal();
    all.unshift(order);
    writeLocal(all);

    let backendSynced = false;
    try {
      const doctorId = await fetchDefaultDoctorId();
      if (doctorId) {
        const body = {
          patient: input.patientId,
          doctor: doctorId,
          test_name: input.test.test_name,
          test_category: apiCategory,
          result_value: order.resultValue,
          normal_range: order.referenceRange || 'N/A',
          units: order.resultUnit || 'n/a',
          test_date: new Date().toISOString().slice(0, 10),
          lab_name: 'Health For ALL (GoDaddy lab-results)',
          lab_reference: input.test.test_code,
          status: 'pending',
          notes: [
            input.notes,
            `priority=${input.priority}`,
            `ordered_by=${input.orderedBy}`,
            `kind=${kind}`,
            `catalog_id=${input.test.id}`,
          ]
            .filter(Boolean)
            .join(' | '),
        };
        const res = await fetch(GODADDY_BACKENDS.hospitalFinder.labResults, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.data?.id) {
          order.backendId = json.data.id;
          order.source = 'hybrid';
          backendSynced = true;
          const updated = readLocal().map((o) => (o.id === order.id ? order : o));
          writeLocal(updated);
        } else {
          console.warn('lab-results POST failed:', json);
        }
      }
    } catch (e) {
      console.warn('Backend sync failed (kept local):', e);
    }

    return { success: true, order, backendSynced };
  }

  async updateResult(
    orderId: string,
    result: {
      resultValue: string;
      resultUnit?: string;
      referenceRange?: string;
      resultStatus?: PatientLabOrder['resultStatus'];
      notes?: string;
    }
  ): Promise<{ success: boolean; order?: PatientLabOrder; error?: string }> {
    const all = readLocal();
    const idx = all.findIndex((o) => o.id === orderId || o.backendId === orderId);
    if (idx < 0) {
      // create local overlay for backend-only rows
      return { success: false, error: 'Order not found in local store — re-open after refresh' };
    }
    const updated: PatientLabOrder = {
      ...all[idx],
      resultValue: result.resultValue,
      resultUnit: result.resultUnit ?? all[idx].resultUnit,
      referenceRange: result.referenceRange ?? all[idx].referenceRange,
      resultStatus: result.resultStatus ?? all[idx].resultStatus,
      notes: result.notes ?? all[idx].notes,
      status: 'completed',
      source: all[idx].backendId ? 'hybrid' : 'local',
    };
    all[idx] = updated;
    writeLocal(all);
    return { success: true, order: updated };
  }
}

export const patientLabService = new PatientLabService();
