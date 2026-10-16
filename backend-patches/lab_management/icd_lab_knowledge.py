"""
ICD-10 → Lab & Radiology clinical decision support.

Sources (guideline-oriented, not a substitute for clinician judgment):
- CMS Lab NCD ICD-10 coverage themes (https://www.cms.gov/medicare/coverage/.../lab-ncds-icd-10)
- Common health-fair / primary-care panels (ADA diabetes, AHA lipids/HTN, ACR imaging appropriateness themes)
- NIH Clinical Tables ICD-10-CM for code validation (client-side)

References stored with each rule for transparency in API responses.
"""

from __future__ import annotations

from typing import Any, Dict, List, Set

# Expanded catalog seeds: (code, name, category_name, description, unit, normal_range, price, turnaround_days)
CATALOG_SEEDS: List[tuple] = [
    # Chemistry / panels
    ("A1C", "Hemoglobin A1c", "Chemistry", "Diabetes monitoring", "%", "4.0-5.6%", "45.00", 1),
    ("MG", "Magnesium", "Chemistry", "Electrolyte", "mg/dL", "1.7-2.2", "28.00", 1),
    ("PHOS", "Phosphorus", "Chemistry", "Electrolyte / bone", "mg/dL", "2.5-4.5", "24.00", 1),
    ("LDH", "Lactate Dehydrogenase", "Chemistry", "Tissue injury / hemolysis", "U/L", "140-280", "30.00", 1),
    ("GGT", "Gamma-Glutamyl Transferase", "Liver", "Biliary / alcohol use", "U/L", "9-48", "32.00", 1),
    ("AMY", "Amylase", "Chemistry", "Pancreatitis workup", "U/L", "30-110", "35.00", 1),
    ("LIP", "Lipase", "Chemistry", "Pancreatitis workup", "U/L", "0-160", "38.00", 1),
    ("URIC", "Uric Acid", "Chemistry", "Gout / metabolic", "mg/dL", "3.5-7.2", "26.00", 1),
    ("IRON", "Serum Iron", "Hematology", "Anemia iron studies", "µg/dL", "60-170", "30.00", 1),
    ("TIBC", "Total Iron Binding Capacity", "Hematology", "Anemia iron studies", "µg/dL", "240-450", "32.00", 1),
    ("TRANSFER", "Transferrin Saturation", "Hematology", "Iron overload / deficiency", "%", "20-50", "34.00", 1),
    ("RETIC", "Reticulocyte Count", "Hematology", "Anemia workup", "%", "0.5-1.5", "40.00", 1),
    ("D-DIMER", "D-Dimer", "Hematology", "VTE / PE evaluation", "ng/mL", "<500", "55.00", 1),
    ("INR", "INR (International Normalized Ratio)", "Hematology", "Anticoagulation", "", "0.8-1.2", "28.00", 1),
    ("UACR", "Urine Albumin/Creatinine Ratio", "Renal", "Diabetic nephropathy screen", "mg/g", "<30", "42.00", 1),
    ("MICROALB", "Microalbumin (Urine)", "Renal", "Early kidney damage", "mg/L", "<30", "38.00", 1),
    ("CK", "Creatine Kinase (Total)", "Cardiology", "Myopathy / rhabdo / ACS adjunct", "U/L", "30-200", "36.00", 1),
    ("PROBNP", "NT-proBNP", "Cardiology", "Heart failure biomarker", "pg/mL", "age-dependent", "95.00", 1),
    ("HSCRP", "High-Sensitivity CRP", "Cardiology", "CV risk inflammation", "mg/L", "<3.0", "48.00", 1),
    ("HCG", "Beta-hCG (Quantitative)", "Endocrinology", "Pregnancy / tumor marker context", "mIU/mL", "<5 non-pregnant", "40.00", 1),
    ("CORT", "Cortisol (AM)", "Endocrinology", "Adrenal evaluation", "µg/dL", "6-23", "50.00", 1),
    ("TESTO", "Testosterone (Total)", "Endocrinology", "Hypogonadism", "ng/dL", "age/sex specific", "55.00", 1),
    ("PTH", "Parathyroid Hormone", "Endocrinology", "Calcium / bone metabolism", "pg/mL", "15-65", "70.00", 1),
    ("CA125", "CA-125", "Oncology", "Ovarian marker (context)", "U/mL", "<35", "85.00", 2),
    ("CEA", "Carcinoembryonic Antigen", "Oncology", "GI tumor marker (context)", "ng/mL", "<5", "80.00", 2),
    ("AFP", "Alpha-Fetoprotein", "Oncology", "Liver / germ cell marker", "ng/mL", "<10", "78.00", 2),
    ("COVID", "COVID-19 PCR", "Microbiology", "SARS-CoV-2 detection", "", "Negative", "90.00", 1),
    ("FLU", "Influenza A/B Rapid", "Microbiology", "Respiratory virus", "", "Negative", "45.00", 1),
    ("RSV", "RSV Antigen / PCR", "Microbiology", "Respiratory syncytial virus", "", "Negative", "55.00", 1),
    ("GC-CT", "Gonorrhea/Chlamydia NAAT", "Microbiology", "STI screening", "", "Negative", "95.00", 2),
    ("BLOOD-GAS", "Arterial Blood Gas", "Pulmonary", "Gas exchange / acid-base", "", "context", "60.00", 1),
    ("SPO2-ABG", "Pulse Oximetry Documentation", "Pulmonary", "Oxygen saturation assessment", "%", "95-100", "15.00", 0),
    # Imaging / cardiology studies (Imaging category)
    ("CXR", "Chest X-Ray (2 views)", "Imaging", "Pulmonary / cardiac silhouette", "", "Radiologist report", "120.00", 1),
    ("AXR", "Abdominal X-Ray", "Imaging", "Acute abdomen screening", "", "Radiologist report", "110.00", 1),
    ("MAMMO", "Mammogram (Screening)", "Imaging", "Breast cancer screening", "", "BI-RADS report", "180.00", 2),
    ("DEXA", "DEXA Bone Density", "Imaging", "Osteoporosis evaluation", "", "T-score report", "200.00", 2),
    ("ECHO", "Echocardiogram (Transthoracic)", "Imaging", "Cardiac structure / function", "", "Cardiology report", "450.00", 2),
    ("EKG", "12-Lead Electrocardiogram", "Cardiology", "Rhythm / ischemia screening", "", "Interpreted tracing", "75.00", 0),
    ("ECG", "ECG (Electrocardiogram)", "Cardiology", "Alias for EKG", "", "Interpreted tracing", "75.00", 0),
    ("CT-HEAD", "CT Head (without contrast)", "Imaging", "Neuro acute / trauma", "", "Radiologist report", "650.00", 1),
    ("CT-CHEST", "CT Chest", "Imaging", "Pulmonary / mediastinal", "", "Radiologist report", "700.00", 1),
    ("CT-ABD", "CT Abdomen/Pelvis", "Imaging", "Acute abdomen / staging", "", "Radiologist report", "850.00", 1),
    ("MRI-BRAIN", "MRI Brain", "Imaging", "Neuro soft tissue", "", "Radiologist report", "1200.00", 2),
    ("MRI-SPINE", "MRI Spine", "Imaging", "Back pain / cord evaluation", "", "Radiologist report", "1300.00", 2),
    ("MRI-KNEE", "MRI Knee", "Imaging", "Orthopedic soft tissue", "", "Radiologist report", "1100.00", 2),
    ("US-ABD", "Abdominal Ultrasound", "Imaging", "RUQ / biliary / aorta", "", "Radiologist report", "280.00", 1),
    ("US-PELV", "Pelvic Ultrasound", "Imaging", "GYN evaluation", "", "Radiologist report", "300.00", 1),
    ("US-CAROTID", "Carotid Duplex Ultrasound", "Imaging", "Stroke / bruit evaluation", "", "Vascular report", "350.00", 1),
    ("US-RENAL", "Renal Ultrasound", "Imaging", "CKD / obstruction", "", "Radiologist report", "290.00", 1),
    ("US-THYROID", "Thyroid Ultrasound", "Imaging", "Nodule / goiter", "", "Radiologist report", "270.00", 1),
    ("PET", "PET/CT (Oncology)", "Imaging", "Staging / response (specialty)", "", "Nuclear medicine report", "2500.00", 3),
]

# Prefix / exact ICD → recommended test codes + rationale + sources
# Keys are uppercase ICD prefixes matched with startswith after normalizing dots.
ICD_RULES: List[Dict[str, Any]] = [
    {
        "prefixes": ["I10", "I11", "I12", "I13", "I15"],
        "label": "Hypertension",
        "labs": ["BMP", "CMP", "LIPID", "CBC", "UA", "UACR", "HSCRP"],
        "imaging": ["EKG", "ECHO", "CXR"],
        "rationale": "Baseline metabolic, lipids, renal, and cardiac screening for hypertension.",
        "sources": ["AHA/ACC HTN guideline themes", "CMS Lab NCD ICD-10 coverage themes"],
    },
    {
        "prefixes": ["E11", "E10", "E13", "R73"],
        "label": "Diabetes / hyperglycemia",
        "labs": ["HBA1C", "A1C", "GLUC", "BMP", "CMP", "LIPID", "UACR", "MICROALB", "UA", "CBC"],
        "imaging": ["EKG", "US-RENAL"],
        "rationale": "ADA-oriented monitoring: A1c, glucose, lipids, kidney protection labs.",
        "sources": ["ADA Standards of Care themes", "CMS Lab NCD"],
    },
    {
        "prefixes": ["E78", "E88"],
        "label": "Dyslipidemia / metabolic",
        "labs": ["LIPID", "HBA1C", "GLUC", "CMP", "HSCRP", "TSH"],
        "imaging": ["EKG"],
        "rationale": "Lipid panel and metabolic risk labs for hyperlipidemia.",
        "sources": ["AHA/ACC Cholesterol guideline themes"],
    },
    {
        "prefixes": ["E66"],
        "label": "Obesity",
        "labs": ["LIPID", "HBA1C", "GLUC", "CMP", "TSH", "LFT"],
        "imaging": ["EKG"],
        "rationale": "Screen for metabolic syndrome and thyroid contribution.",
        "sources": ["Obesity medicine common workup"],
    },
    {
        "prefixes": ["I25", "I20", "I21", "I22", "I24"],
        "label": "Ischemic heart disease / ACS",
        "labs": ["TROP", "TROPONIN", "BNP", "PROBNP", "CBC", "BMP", "LIPID", "HSCRP", "CK", "CK-MB"],
        "imaging": ["EKG", "CXR", "ECHO", "CT-CHEST"],
        "rationale": "Cardiac biomarkers, ECG, and chest imaging for CAD/ACS evaluation.",
        "sources": ["AHA ACS / stable ischemic HD themes"],
    },
    {
        "prefixes": ["I50"],
        "label": "Heart failure",
        "labs": ["BNP", "PROBNP", "BMP", "CMP", "CBC", "TSH", "LFT"],
        "imaging": ["EKG", "CXR", "ECHO"],
        "rationale": "Natriuretic peptides and echo are central to HF assessment.",
        "sources": ["AHA/ACC HF guideline themes"],
    },
    {
        "prefixes": ["I63", "I61", "I64", "G45"],
        "label": "Stroke / TIA",
        "labs": ["CBC", "BMP", "PT", "PTT", "INR", "LIPID", "HBA1C", "GLUC"],
        "imaging": ["CT-HEAD", "MRI-BRAIN", "US-CAROTID", "EKG", "ECHO"],
        "rationale": "Neuroimaging and stroke labs; carotid duplex and cardiac source evaluation.",
        "sources": ["AHA stroke guideline / ACR appropriateness themes"],
    },
    {
        "prefixes": ["J44", "J45", "J18", "J06", "J20", "J12"],
        "label": "Respiratory (COPD/asthma/pneumonia)",
        "labs": ["CBC", "BMP", "CRP", "FLU", "COVID", "RSV", "BLOOD-GAS"],
        "imaging": ["CXR", "CT-CHEST"],
        "rationale": "Infection labs and chest imaging for lower respiratory disease.",
        "sources": ["IDSA/ATS pneumonia themes", "ACR chest imaging appropriateness"],
    },
    {
        "prefixes": ["N18", "N17", "N19", "R34"],
        "label": "Chronic / acute kidney disease",
        "labs": ["BMP", "CMP", "RFP", "RFT", "CBC", "UA", "UACR", "MICROALB", "PHOS", "PTH", "VITD"],
        "imaging": ["US-RENAL"],
        "rationale": "Renal panel, anemia check, mineral bone labs, renal ultrasound.",
        "sources": ["KDIGO CKD themes"],
    },
    {
        "prefixes": ["N39", "N30", "N10", "N11"],
        "label": "UTI / urinary symptoms",
        "labs": ["UA", "UAM", "URINE-C", "CBC", "BMP"],
        "imaging": ["US-RENAL"],
        "rationale": "Urinalysis ± culture; imaging if complicated / recurrent.",
        "sources": ["IDSA UTI themes"],
    },
    {
        "prefixes": ["K70", "K74", "K75", "K76", "B18"],
        "label": "Liver disease / hepatitis",
        "labs": ["LFT", "LFP", "ALT", "AST", "ALP", "BIL-T", "GGT", "INR", "PT", "CBC", "HEP-B", "HEP-C"],
        "imaging": ["US-ABD", "CT-ABD", "MRI"],
        "rationale": "Hepatic panel, coagulation, viral serologies, abdominal imaging.",
        "sources": ["AASLD themes", "CMS AFP/liver lab NCD themes"],
    },
    {
        "prefixes": ["K85", "K86", "R10"],
        "label": "Abdominal pain / pancreatitis",
        "labs": ["AMY", "LIP", "CMP", "CBC", "LFT", "LIPID"],
        "imaging": ["US-ABD", "CT-ABD", "AXR"],
        "rationale": "Pancreatic enzymes and abdominal imaging for acute abdomen.",
        "sources": ["ACG pancreatitis / ACR abdominal appropriateness themes"],
    },
    {
        "prefixes": ["E03", "E04", "E05", "E06"],
        "label": "Thyroid disorders",
        "labs": ["TSH", "FT4", "FT3", "T3", "T4", "THYROID"],
        "imaging": ["US-THYROID"],
        "rationale": "TSH-first thyroid labs; ultrasound for nodules/goiter.",
        "sources": ["ATA thyroid guideline themes"],
    },
    {
        "prefixes": ["D50", "D51", "D52", "D53", "D64", "R71"],
        "label": "Anemia",
        "labs": ["CBC", "CBC-DIFF", "FER", "IRON", "TIBC", "TRANSFER", "B12", "FOL", "RETIC", "LDH"],
        "imaging": [],
        "rationale": "CBC and iron/B12/folate studies for anemia classification.",
        "sources": ["ASH anemia workup themes"],
    },
    {
        "prefixes": ["M05", "M06", "M79", "M54"],
        "label": "Rheumatologic / back pain",
        "labs": ["CBC", "ESR", "CRP", "ANA", "RF", "UA"],
        "imaging": ["XRAY", "MRI-SPINE", "MRI"],
        "rationale": "Inflammatory markers and targeted musculoskeletal imaging.",
        "sources": ["ACR appropriateness for low back pain themes"],
    },
    {
        "prefixes": ["M80", "M81"],
        "label": "Osteoporosis",
        "labs": ["CMP", "VITD", "PTH", "PHOS", "CBC"],
        "imaging": ["DEXA", "XRAY"],
        "rationale": "Bone density (DEXA) and mineral metabolism labs.",
        "sources": ["NOF / Endocrine Society osteoporosis themes"],
    },
    {
        "prefixes": ["F32", "F33", "F41", "F43"],
        "label": "Depression / anxiety",
        "labs": ["TSH", "CBC", "BMP", "VITD", "B12", "FOL"],
        "imaging": [],
        "rationale": "Rule out medical contributors (thyroid, anemia, B12/folate/D).",
        "sources": ["Primary care psych medical workup themes"],
    },
    {
        "prefixes": ["C50"],
        "label": "Breast neoplasm",
        "labs": ["CBC", "CMP"],
        "imaging": ["MAMMO", "US", "MRI", "PET"],
        "rationale": "Mammography and staging imaging per oncology pathways.",
        "sources": ["NCCN Imaging AUC themes"],
    },
    {
        "prefixes": ["C61", "N40"],
        "label": "Prostate",
        "labs": ["PSA", "PSA-FREE", "CBC", "CMP"],
        "imaging": ["MRI", "US"],
        "rationale": "PSA and prostate imaging when indicated.",
        "sources": ["AUA / NCCN prostate themes"],
    },
    {
        "prefixes": ["Z00", "Z01", "Z13"],
        "label": "General / screening encounter",
        "labs": ["CBC", "CMP", "LIPID", "HBA1C", "TSH", "UA", "VITD"],
        "imaging": ["CXR"],
        "rationale": "Health-fair / wellness screening panel.",
        "sources": ["USPSTF / health fair screening themes"],
    },
    {
        "prefixes": ["I26", "I80", "I82"],
        "label": "VTE / PE / DVT",
        "labs": ["D-DIMER", "CBC", "PT", "PTT", "INR"],
        "imaging": ["CT-CHEST", "US", "CXR"],
        "rationale": "D-dimer and CT pulmonary / duplex pathways.",
        "sources": ["ASH VTE / ACR PE appropriateness themes"],
    },
    {
        "prefixes": ["G40", "R56", "G43"],
        "label": "Seizure / headache",
        "labs": ["BMP", "CBC", "GLUC", "MG"],
        "imaging": ["CT-HEAD", "MRI-BRAIN"],
        "rationale": "Metabolic labs and neuroimaging for new neuro symptoms.",
        "sources": ["ACR headache / seizure imaging appropriateness themes"],
    },
]


def _norm_code(code: str) -> str:
    return (code or "").strip().upper().replace(" ", "")


def recommend_for_codes(codes: List[str]) -> Dict[str, Any]:
    matched_rules = []
    lab_codes: Set[str] = set()
    imaging_codes: Set[str] = set()
    sources: Set[str] = set()

    for raw in codes:
        c = _norm_code(raw)
        if not c:
            continue
        for rule in ICD_RULES:
            if any(c.startswith(p) or c.replace(".", "").startswith(p.replace(".", "")) for p in rule["prefixes"]):
                matched_rules.append(
                    {
                        "icd_matched": c,
                        "condition": rule["label"],
                        "rationale": rule["rationale"],
                        "labs": rule["labs"],
                        "imaging": rule["imaging"],
                        "sources": rule["sources"],
                    }
                )
                lab_codes.update(rule["labs"])
                imaging_codes.update(rule["imaging"])
                sources.update(rule["sources"])

    # Deduplicate rules by condition+icd
    uniq = []
    seen = set()
    for r in matched_rules:
        key = (r["icd_matched"], r["condition"])
        if key not in seen:
            seen.add(key)
            uniq.append(r)

    return {
        "input_codes": [_norm_code(c) for c in codes if _norm_code(c)],
        "matched_rules": uniq,
        "recommended_lab_codes": sorted(lab_codes),
        "recommended_imaging_codes": sorted(imaging_codes),
        "sources": sorted(sources),
        "disclaimer": (
            "AI-assisted clinical decision support based on common guidelines and CMS Lab NCD themes. "
            "Not a substitute for clinician judgment or payer-specific coverage rules."
        ),
    }
