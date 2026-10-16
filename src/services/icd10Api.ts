/**
 * ICD-10 API Service
 * Primary: NIH Clinical Tables (free, CORS-friendly)
 * Fallback: local catalog + clinical aliases (HTN → I10)
 */

export interface ICD10Code {
  code: string;
  description: string;
  category?: string;
  subcategory?: string;
  chapter?: string;
}

export interface ICD10SearchResult {
  codes: ICD10Code[];
  total: number;
  page: number;
  limit: number;
}

export interface ICD10ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const NLM_BASE = 'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search';

const ALIASES: Record<string, string[]> = {
  htn: ['I10', 'essential hypertension', 'hypertension'],
  hbp: ['I10', 'essential hypertension'],
  'high blood pressure': ['I10', 'essential hypertension'],
  dm: ['E11.9', 'type 2 diabetes'],
  dm2: ['E11.9', 'type 2 diabetes'],
  t2dm: ['E11.9', 'type 2 diabetes'],
  diabetes: ['E11.9', 'type 2 diabetes'],
  hld: ['E78.5', 'hyperlipidemia'],
  cholesterol: ['E78.5', 'hyperlipidemia'],
  obesity: ['E66.9', 'obesity'],
  depression: ['F32.9', 'major depressive'],
  anxiety: ['F41.9', 'anxiety'],
  asthma: ['J45.909', 'asthma'],
  ckd: ['N18.9', 'chronic kidney'],
  cad: ['I25.10', 'atherosclerotic heart'],
  chf: ['I50.9', 'heart failure'],
  copd: ['J44.9', 'COPD'],
};

const LOCAL_CODES: ICD10Code[] = [
  { code: 'I10', description: 'Essential (primary) hypertension' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
  { code: 'E66.9', description: 'Obesity, unspecified' },
  { code: 'F32.9', description: 'Major depressive disorder, single episode, unspecified' },
  { code: 'F41.9', description: 'Anxiety disorder, unspecified' },
  { code: 'J45.909', description: 'Unspecified asthma, uncomplicated' },
  { code: 'N18.9', description: 'Chronic kidney disease, unspecified' },
  { code: 'I25.10', description: 'Atherosclerotic heart disease of native coronary artery' },
  { code: 'I50.9', description: 'Heart failure, unspecified' },
  { code: 'J44.9', description: 'Chronic obstructive pulmonary disease, unspecified' },
  { code: 'Z00.00', description: 'Encounter for general adult medical examination without abnormal findings' },
  { code: 'Z00.01', description: 'Encounter for general adult medical examination with abnormal findings' },
];

class ICD10ApiService {
  private expandQuery(query: string): string[] {
    const lower = query.trim().toLowerCase();
    const terms = new Set<string>([query.trim()]);
    const direct = ALIASES[lower];
    if (direct) direct.forEach((t) => terms.add(t));
    Object.entries(ALIASES).forEach(([key, values]) => {
      if (lower.includes(key) || key.includes(lower)) {
        values.forEach((t) => terms.add(t));
      }
    });
    return Array.from(terms).filter(Boolean);
  }

  private matchLocal(term: string): ICD10Code[] {
    const t = term.toLowerCase();
    return LOCAL_CODES.filter(
      (c) =>
        c.code.toLowerCase() === t ||
        c.code.toLowerCase().includes(t) ||
        c.description.toLowerCase().includes(t)
    );
  }

  private async searchNlm(term: string, limit: number): Promise<ICD10Code[]> {
    const url = `${NLM_BASE}?sf=code,name&terms=${encodeURIComponent(term)}&maxList=${limit}`;
    const response = await fetch(url, { method: 'GET', mode: 'cors' });
    if (!response.ok) {
      throw new Error(`NIH ICD-10 HTTP ${response.status}`);
    }
    const data = await response.json();
    // Format: [count, codes[], null, [[code, name], ...]]
    const rows: unknown = Array.isArray(data) ? data[3] : [];
    if (!Array.isArray(rows)) return [];
    return rows
      .filter((row): row is [string, string] => Array.isArray(row) && row.length >= 2)
      .map(([code, description]) => ({ code: String(code), description: String(description) }));
  }

  async searchCodes(query: string, limit: number = 20): Promise<ICD10ApiResponse<ICD10Code[]>> {
    try {
      if (!query.trim()) {
        return { success: true, data: [], message: 'Empty query' };
      }

      const terms = this.expandQuery(query);
      const byCode = new Map<string, ICD10Code>();

      for (const term of terms) {
        this.matchLocal(term).forEach((c) => byCode.set(c.code, c));
      }

      for (const term of terms) {
        try {
          const remote = await this.searchNlm(term, limit);
          remote.forEach((c) => {
            if (!byCode.has(c.code)) byCode.set(c.code, c);
          });
        } catch (err) {
          console.warn('ICD-10 NLM search failed:', term, err);
        }
      }

      const results = Array.from(byCode.values()).slice(0, limit);
      return {
        success: true,
        data: results,
        message:
          results.length > 0
            ? 'ICD-10 codes retrieved (NIH Clinical Tables + local aliases)'
            : 'No ICD-10 matches found',
      };
    } catch (error) {
      console.error('ICD-10 API: Error searching codes:', error);
      return this.getLocalICD10Codes(query);
    }
  }

  async getCodeDetails(code: string): Promise<ICD10ApiResponse<ICD10Code>> {
    const search = await this.searchCodes(code, 5);
    const match = search.data?.find((c) => c.code.toUpperCase() === code.toUpperCase()) || search.data?.[0];
    if (match) {
      return { success: true, data: match, message: 'ICD-10 code details retrieved' };
    }
    return { success: false, error: `Code ${code} not found` };
  }

  async getCommonHealthFairCodes(): Promise<ICD10ApiResponse<ICD10Code[]>> {
    return {
      success: true,
      data: LOCAL_CODES,
      message: 'Common health fair ICD-10 codes retrieved successfully',
    };
  }

  private getLocalICD10Codes(query: string): ICD10ApiResponse<ICD10Code[]> {
    const terms = this.expandQuery(query);
    const byCode = new Map<string, ICD10Code>();
    terms.forEach((term) => this.matchLocal(term).forEach((c) => byCode.set(c.code, c)));
    return {
      success: true,
      data: Array.from(byCode.values()),
      message: 'Local ICD-10 codes retrieved successfully',
    };
  }

  async autoCodeClinicalText(clinicalText: string): Promise<ICD10ApiResponse<ICD10Code[]>> {
    const text = clinicalText.toLowerCase();
    const found: ICD10Code[] = [];
    const keywords: Record<string, string> = {
      htn: 'I10',
      hypertension: 'I10',
      diabetes: 'E11.9',
      dm: 'E11.9',
      depression: 'F32.9',
      anxiety: 'F41.9',
      obesity: 'E66.9',
      asthma: 'J45.909',
      cholesterol: 'E78.5',
      hyperlipidemia: 'E78.5',
    };
    for (const [keyword, code] of Object.entries(keywords)) {
      if (text.includes(keyword)) {
        const local = LOCAL_CODES.find((c) => c.code === code);
        found.push(local || { code, description: code });
      }
    }
    return { success: true, data: found, message: 'Clinical text auto-coded successfully' };
  }
}

export const icd10Api = new ICD10ApiService();
