/**
 * ICD-10 → Lab & Radiology AI recommendations.
 * Live: https://api.mywaitime.com/lab/icd-recommendations/?codes=I10,E11.9
 * Offline: local guideline map (same knowledge as GoDaddy backend).
 */
import { GODADDY_BACKENDS } from '../config/godaddyBackends';
import { LabTest, labApi } from './labApi';

export interface IcdRecommendRule {
  icd_matched: string;
  condition: string;
  rationale: string;
  labs: string[];
  imaging: string[];
  sources: string[];
}

export interface IcdRecommendResult {
  input_codes: string[];
  matched_rules: IcdRecommendRule[];
  recommended_lab_codes: string[];
  recommended_imaging_codes: string[];
  labs: LabTest[];
  imaging: LabTest[];
  sources: string[];
  disclaimer: string;
  ai_enhanced: boolean;
  online_resources?: string[];
  source: 'live' | 'local';
}

const LOCAL_RULES: Array<{
  prefixes: string[];
  label: string;
  labs: string[];
  imaging: string[];
  rationale: string;
  sources: string[];
}> = [
  {
    prefixes: ['I10', 'I11', 'I12', 'I13'],
    label: 'Hypertension',
    labs: ['BMP', 'CMP', 'LIPID', 'CBC', 'UA', 'UACR', 'HSCRP'],
    imaging: ['EKG', 'ECHO', 'CXR'],
    rationale: 'Baseline metabolic, lipids, renal, and cardiac screening for hypertension.',
    sources: ['AHA/ACC HTN guideline themes', 'CMS Lab NCD ICD-10'],
  },
  {
    prefixes: ['E11', 'E10', 'E13', 'R73'],
    label: 'Diabetes / hyperglycemia',
    labs: ['HBA1C', 'A1C', 'GLUC', 'BMP', 'CMP', 'LIPID', 'UACR', 'MICROALB', 'UA', 'CBC'],
    imaging: ['EKG', 'US-RENAL'],
    rationale: 'ADA-oriented monitoring: A1c, glucose, lipids, kidney protection labs.',
    sources: ['ADA Standards of Care themes', 'CMS Lab NCD'],
  },
  {
    prefixes: ['E78'],
    label: 'Dyslipidemia',
    labs: ['LIPID', 'HBA1C', 'GLUC', 'CMP', 'HSCRP', 'TSH'],
    imaging: ['EKG'],
    rationale: 'Lipid panel and metabolic risk labs.',
    sources: ['AHA/ACC Cholesterol guideline themes'],
  },
  {
    prefixes: ['I25', 'I20', 'I21'],
    label: 'Ischemic heart disease',
    labs: ['TROP', 'BNP', 'CBC', 'BMP', 'LIPID', 'HSCRP'],
    imaging: ['EKG', 'CXR', 'ECHO', 'CT-CHEST'],
    rationale: 'Cardiac biomarkers and chest/cardiac imaging.',
    sources: ['AHA ACS themes'],
  },
  {
    prefixes: ['I50'],
    label: 'Heart failure',
    labs: ['BNP', 'PROBNP', 'BMP', 'CMP', 'CBC', 'TSH'],
    imaging: ['EKG', 'CXR', 'ECHO'],
    rationale: 'Natriuretic peptides and echocardiography.',
    sources: ['AHA/ACC HF themes'],
  },
  {
    prefixes: ['I63', 'G45'],
    label: 'Stroke / TIA',
    labs: ['CBC', 'BMP', 'PT', 'PTT', 'INR', 'LIPID', 'HBA1C'],
    imaging: ['CT-HEAD', 'MRI-BRAIN', 'US-CAROTID', 'EKG', 'ECHO'],
    rationale: 'Neuroimaging and stroke labs.',
    sources: ['AHA stroke / ACR themes'],
  },
  {
    prefixes: ['J44', 'J45', 'J18'],
    label: 'Respiratory',
    labs: ['CBC', 'BMP', 'CRP', 'FLU', 'COVID'],
    imaging: ['CXR', 'CT-CHEST'],
    rationale: 'Infection labs and chest imaging.',
    sources: ['IDSA/ATS / ACR chest themes'],
  },
  {
    prefixes: ['N18', 'N17'],
    label: 'Kidney disease',
    labs: ['BMP', 'CMP', 'CBC', 'UA', 'UACR', 'PHOS', 'PTH', 'VITD'],
    imaging: ['US-RENAL'],
    rationale: 'Renal labs and ultrasound.',
    sources: ['KDIGO CKD themes'],
  },
  {
    prefixes: ['E03', 'E04', 'E05'],
    label: 'Thyroid',
    labs: ['TSH', 'FT4', 'FT3', 'THYROID'],
    imaging: ['US-THYROID'],
    rationale: 'TSH-first labs; ultrasound for nodules.',
    sources: ['ATA thyroid themes'],
  },
  {
    prefixes: ['D50', 'D64'],
    label: 'Anemia',
    labs: ['CBC', 'CBC-DIFF', 'FER', 'IRON', 'TIBC', 'B12', 'FOL', 'RETIC'],
    imaging: [],
    rationale: 'CBC and iron studies.',
    sources: ['ASH anemia themes'],
  },
  {
    prefixes: ['Z00', 'Z01'],
    label: 'Screening encounter',
    labs: ['CBC', 'CMP', 'LIPID', 'HBA1C', 'TSH', 'UA'],
    imaging: ['CXR'],
    rationale: 'Health-fair screening panel.',
    sources: ['USPSTF / health fair themes'],
  },
];

function norm(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

function localRecommend(codes: string[]): Omit<IcdRecommendResult, 'labs' | 'imaging' | 'source'> {
  const input = codes.map(norm).filter(Boolean);
  const matched_rules: IcdRecommendRule[] = [];
  const labSet = new Set<string>();
  const imgSet = new Set<string>();
  const sources = new Set<string>();

  for (const c of input) {
    for (const rule of LOCAL_RULES) {
      if (rule.prefixes.some((p) => c.startsWith(p) || c.replace(/\./g, '').startsWith(p.replace(/\./g, '')))) {
        matched_rules.push({
          icd_matched: c,
          condition: rule.label,
          rationale: rule.rationale,
          labs: rule.labs,
          imaging: rule.imaging,
          sources: rule.sources,
        });
        rule.labs.forEach((x) => labSet.add(x));
        rule.imaging.forEach((x) => imgSet.add(x));
        rule.sources.forEach((x) => sources.add(x));
      }
    }
  }

  return {
    input_codes: input,
    matched_rules,
    recommended_lab_codes: Array.from(labSet).sort(),
    recommended_imaging_codes: Array.from(imgSet).sort(),
    sources: Array.from(sources).sort(),
    disclaimer:
      'AI-assisted clinical decision support. Not a substitute for clinician judgment.',
    ai_enhanced: true,
    online_resources: [
      GODADDY_BACKENDS.labManagement.icdRecommendations,
      'https://www.cms.gov/medicare/coverage/determination-process/basics/lab-ncds-icd-10',
      'https://clinicaltables.nlm.nih.gov/apidoc/icd10cm/v3/doc.html',
    ],
  };
}

async function hydrateCodes(codes: string[]): Promise<LabTest[]> {
  const catalog = await labApi.getTests();
  const byCode = new Map(
    (catalog.data || []).map((t) => [String(t.test_code).toUpperCase(), t])
  );
  return codes
    .map((c) => byCode.get(c.toUpperCase()))
    .filter((t): t is LabTest => !!t);
}

class IcdLabRecommendApi {
  async recommend(codes: string[]): Promise<IcdRecommendResult> {
    const cleaned = codes.map(norm).filter(Boolean);
    if (!cleaned.length) {
      return {
        ...localRecommend([]),
        labs: [],
        imaging: [],
        source: 'local',
      };
    }

    try {
      const url = `${GODADDY_BACKENDS.labManagement.icdRecommendations}?codes=${encodeURIComponent(cleaned.join(','))}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const body = await res.json();
        const data = body?.data || body;
        if (data) {
          const labsRaw = Array.isArray(data.labs) ? data.labs : [];
          const imgRaw = Array.isArray(data.imaging) ? data.imaging : [];
          const keep = (t: LabTest & { missing_in_catalog?: boolean }) =>
            !!t?.test_code && !t.missing_in_catalog;
          return {
            input_codes: data.input_codes || cleaned,
            matched_rules: data.matched_rules || [],
            recommended_lab_codes: data.recommended_lab_codes || [],
            recommended_imaging_codes: data.recommended_imaging_codes || [],
            labs: labsRaw.filter(keep),
            imaging: imgRaw.filter(keep),
            sources: data.sources || [],
            disclaimer: data.disclaimer || '',
            ai_enhanced: true,
            online_resources: data.online_resources,
            source: 'live',
          };
        }
      }
    } catch (err) {
      console.warn('ICD recommend live API failed, using local map:', err);
    }

    const local = localRecommend(cleaned);
    const [labs, imaging] = await Promise.all([
      hydrateCodes(local.recommended_lab_codes),
      hydrateCodes(local.recommended_imaging_codes),
    ]);
    return { ...local, labs, imaging, source: 'local' };
  }
}

export const icdLabRecommendApi = new IcdLabRecommendApi();
