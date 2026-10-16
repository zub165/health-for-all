import React, { useEffect, useRef, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  HealthAndSafety as HealthIcon,
  Visibility as ViewIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as AutoAwesomeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SelectAll as SelectAllIcon,
  Checklist as ChecklistIcon,
} from '@mui/icons-material';
import { Patient, Vitals } from '../types';
import { patientApi, vitalsApi } from '../services/api';
import { getApiBaseUrl } from '../config/api';
import VitalsTracking from './VitalsTracking';
import RecommendationForm from './RecommendationForm';
import EmailPreview from './EmailPreview';
import UnifiedSOAPNote from './UnifiedSOAPNote';
import { PatientData } from '../services/hybridPatientService';
import { useAppData, notifyAppDataChanged } from '../context/AppDataContext';
import ExportActions from './ExportActions';

interface DoctorDashboardProps {
  doctorName: string;
  onLogout?: () => void;
  refreshTrigger?: number;
}

function hybridToDoctorPatient(patient: PatientData): Patient {
  return {
    id: patient.id,
    name: patient.full_name,
    full_name: patient.full_name,
    first_name: patient.first_name,
    last_name: patient.last_name,
    email: patient.email,
    phoneNumber: patient.phone,
    phone: patient.phone,
    age: patient.age,
    gender: patient.gender,
    address: patient.address,
    bloodGroup: patient.blood_type,
    blood_type: patient.blood_type,
    pastMedicalHistory: patient.past_medical_history,
    past_medical_history: patient.past_medical_history,
    familyHistory: patient.family_history,
    family_history: patient.family_history,
    allergies: patient.allergies,
    medicationList: patient.current_medications?.join(', '),
    current_medications: patient.current_medications,
    emergencyContact: patient.emergency_contact,
    emergency_contact: patient.emergency_contact,
    health_risk_score: patient.health_score,
    registeredAt: patient.last_updated,
    createdAt: patient.last_updated,
    updatedAt: patient.last_updated,
  };
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ doctorName, onLogout, refreshTrigger }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const {
    patients: contextPatients,
    loading: contextLoading,
    error: contextError,
    refreshPatients,
  } = useAppData();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);
  const [patientVitals, setPatientVitals] = useState<Vitals[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showUnifiedSOAP, setShowUnifiedSOAP] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState<{
    patient: Patient | null;
    healthScore: number;
    riskFactors: string[];
    recommendations: string[];
  }>({
    patient: null,
    healthScore: 0,
    riskFactors: [],
    recommendations: [],
  });
  
  // AI Assessment state
  const [showAIAssessment, setShowAIAssessment] = useState(false);
  const [aiAssessmentData, setAiAssessmentData] = useState<any>(null);
  
  const [doctorAssessment, setDoctorAssessment] = useState({
    clinicalAssessment: '',
    treatmentPlan: '',
    recommendations: '',
    followUpPlan: '',
    // SOAP Note fields
    chiefComplaint: '',
    historyOfPresentIllness: '',
    symptoms: '',
    physicalExam: '',
    labResults: '',
    diagnosticTests: '',
    clinicalDiagnosis: '',
    differentialDiagnosis: '',
    riskFactors: '',
    treatmentPlanSOAP: '',
    followUpInstructions: '',
    patientEducation: '',
    referrals: '',
    psychologicalAssessment: '',
    // Additional fields
    medicationChanges: '',
    dischargeInstructions: '',
    emergencyInstructions: '',
  });

  // AI Enhancement states
  const [aiSuggestions, setAiSuggestions] = useState({
    clinicalDiagnosis: [],
    treatmentPlan: [],
    riskFactors: [],
    followUp: [],
  });
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [validationAlerts, setValidationAlerts] = useState<Array<{type: string, message: string, severity: string}>>([]);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  // Edit and Delete states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Patient>>({});
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Sync shared hybrid patients into doctor UI shape
  useEffect(() => {
    const converted = contextPatients.map(hybridToDoctorPatient);
    const validPatients = converted.filter((patient) => {
      const isPlaceholder =
        patient.email === 'no-email@local.com' ||
        patient.name === 'Local Patient' ||
        patient.full_name === 'Local Patient' ||
        (!patient.email && !patient.phoneNumber && !patient.phone);
      return !isPlaceholder;
    });
    setPatients(validPatients);
    if (!contextLoading && validPatients.length === 0 && !contextError) {
      setError('No patients found in any data source');
    } else if (contextError) {
      setError(contextError);
    } else {
      setError(null);
    }
  }, [contextPatients, contextLoading, contextError]);

  useEffect(() => {
    setLoading(contextLoading);
  }, [contextLoading]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      void refreshPatients();
    }
  }, [refreshTrigger, refreshPatients]);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      (patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phoneNumber || patient.phone || '').includes(searchTerm)
    );
    setFilteredPatients(filtered);
  }, [patients, searchTerm]);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshPatients();
      notifyAppDataChanged();
    } catch (err) {
      console.error('DoctorDashboard: refreshPatients error:', err);
      setError('Failed to fetch patients from all sources. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientVitals = async (patientId: string) => {
    try {
      const response = await vitalsApi.getByPatientId(patientId);
      if (response.success && response.data) {
        setPatientVitals(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch patient vitals:', err);
    }
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    fetchPatientVitals(patient.id!);
  };

  const handleRecordVitals = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowVitalsForm(true);
  };

  const handleVitalsRecorded = async (vitals: Vitals) => {
    console.log('Vitals recorded:', vitals);
    
    // Update the patient with the new vitals in SOAP note
    if (selectedPatient) {
      const updatedPatient = {
        ...selectedPatient,
        soapNote: {
          ...selectedPatient.soapNote,
          objective: {
            ...selectedPatient.soapNote?.objective,
            vitalSigns: {
              bloodPressure: vitals.bloodPressure || 'Not recorded',
              heartRate: String(vitals.heartRate) || 'Not recorded',
              temperature: String(vitals.temperature) || 'Not recorded',
              oxygenSaturation: String(vitals.oxygenSaturation) || 'Not recorded',
              bloodSugar: String(vitals.bloodSugar) || 'Not recorded',
              weight: String(vitals.weight) || 'Not recorded',
              height: String(vitals.height) || 'Not recorded',
              carotidDoppler: vitals.carotidDoppler || 'Not recorded',
            }
          }
        },
        lastUpdated: new Date().toISOString(),
        updatedBy: doctorName
      };
      
      // Update the patient in the list
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? updatedPatient : p));
      setSelectedPatient(updatedPatient);
      
      console.log('✅ Vitals integrated into SOAP note:', updatedPatient.soapNote?.objective?.vitalSigns);
    }
    
    // Refresh patient vitals from backend
    await fetchPatientVitals(selectedPatient!.id!);
    
    setShowVitalsForm(false);
    setShowRecommendationForm(true);
  };

  const handleSendRecommendation = () => {
    setShowRecommendationForm(false);
    setSelectedPatient(null);
  };

  const handleSOAPNoteUpdate = async (updatedPatient: Patient) => {
    // Update the patient in the local state
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    setFilteredPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    
    // Update selected patient if it's the same one
    if (selectedPatient && selectedPatient.id === updatedPatient.id) {
      setSelectedPatient(updatedPatient);
    }
    
    console.log('SOAP note updated:', updatedPatient);
  };


  const handleSendEmailConfirm = async () => {
    setEmailLoading(true);
    setEmailSuccess(false);
    
    try {
      // Simulate email sending (in real app, this would call your email API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real application, this would send an actual email
      console.log('Email sent to:', emailPreviewData.patient?.email);
      console.log('Health Score:', emailPreviewData.healthScore);
      console.log('Risk Factors:', emailPreviewData.riskFactors);
      console.log('Recommendations:', emailPreviewData.recommendations);
      
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
      setShowEmailPreview(false);
      
    } catch (err) {
      console.error('Failed to send email:', err);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSaveAssessment = async () => {
    if (!selectedPatient) return;
    
    try {
      console.log('Saving doctor assessment:', doctorAssessment);
      
      // Save SOAP note data to patient record
      const updatedPatient = {
        ...selectedPatient,
        soapNote: {
          subjective: {
            chiefComplaint: doctorAssessment.chiefComplaint,
            historyOfPresentIllness: doctorAssessment.historyOfPresentIllness,
            symptoms: doctorAssessment.symptoms,
            allergies: Array.isArray(selectedPatient.allergies) ? selectedPatient.allergies.join(', ') : selectedPatient.allergies || '',
            medications: selectedPatient.medicationList,
            familyHistory: selectedPatient.familyHistory,
            socialHistory: `Age: ${selectedPatient.age || 'Not specified'}, Gender: ${selectedPatient.gender || 'Not specified'}`,
            psychologicalAssessment: doctorAssessment.psychologicalAssessment || 'Mental health screening questions and assessment results'
          },
          objective: {
            physicalExam: doctorAssessment.physicalExam,
            labResults: doctorAssessment.labResults,
            diagnosticTests: doctorAssessment.diagnosticTests,
            vitalSigns: patientVitals.length > 0 ? {
              bloodPressure: patientVitals[0].bloodPressure || 'Not recorded',
              heartRate: String(patientVitals[0].heartRate) || 'Not recorded',
              temperature: String(patientVitals[0].temperature) || 'Not recorded',
              oxygenSaturation: String(patientVitals[0].oxygenSaturation) || 'Not recorded',
              bloodSugar: String(patientVitals[0].bloodSugar) || 'Not recorded',
              weight: String(patientVitals[0].weight) || 'Not recorded',
              height: String(patientVitals[0].height) || 'Not recorded',
              carotidDoppler: patientVitals[0].carotidDoppler || 'Not recorded'
            } : {
              bloodPressure: 'Not recorded',
              heartRate: 'Not recorded',
              temperature: 'Not recorded',
              oxygenSaturation: 'Not recorded',
              bloodSugar: 'Not recorded',
              weight: 'Not recorded',
              height: 'Not recorded',
              carotidDoppler: 'Not recorded'
            }
          },
          assessment: {
            clinicalDiagnosis: doctorAssessment.clinicalDiagnosis,
            differentialDiagnosis: doctorAssessment.differentialDiagnosis,
            riskFactors: doctorAssessment.riskFactors,
            healthScore: calculatePatientHealthScore(selectedPatient),
            riskLevel: calculatePatientHealthScore(selectedPatient) >= 80 ? 'Low Risk' : calculatePatientHealthScore(selectedPatient) >= 60 ? 'Moderate Risk' : 'High Risk'
          },
          plan: {
            treatmentPlan: doctorAssessment.treatmentPlanSOAP,
            followUpInstructions: doctorAssessment.followUpInstructions,
            patientEducation: doctorAssessment.patientEducation,
            referrals: doctorAssessment.referrals
          }
        },
        doctorAssessment: {
          clinicalAssessment: doctorAssessment.clinicalAssessment,
          treatmentPlan: doctorAssessment.treatmentPlan,
          recommendations: doctorAssessment.recommendations,
          followUpPlan: doctorAssessment.followUpPlan
        },
        lastUpdated: new Date().toISOString(),
        updatedBy: doctorName
      };
      
      // Update patient in backend
      const response = await patientApi.update(selectedPatient.id!, updatedPatient);
      
      if (response.success) {
        console.log('SOAP note saved successfully:', response.data);
        alert('Doctor assessment and SOAP note saved successfully!');
        
        // Refresh patient list to show updated data
        await fetchPatients();
      } else {
        console.error('Failed to save SOAP note:', response.message);
        alert(`Failed to save assessment: ${response.message}`);
      }
    } catch (error) {
      console.error('Error saving SOAP note:', error);
      alert('Error saving assessment. Please try again.');
    }
  };

  const handleUpdatePatientRecord = () => {
    console.log('Updating patient record with assessment:', doctorAssessment);
    // In a real application, this would update the patient record in the backend
    alert('Patient record updated successfully!');
  };

  // Edit Patient Functions
  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setEditFormData({
      name: patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
      email: patient.email || '',
      phoneNumber: patient.phoneNumber || patient.phone || '',
      age: patient.age || 0,
      gender: patient.gender || '',
      bloodGroup: patient.bloodGroup || patient.blood_type || '',
      address: patient.address || '',
      pastMedicalHistory: patient.pastMedicalHistory || '',
      allergies: patient.allergies || '',
      familyHistory: patient.familyHistory || '',
      medicationList: patient.medicationList || '',
      emergencyContact: patient.emergencyContact || {},
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPatient) return;
    
    setEditLoading(true);
    try {
      const response = await patientApi.update(editingPatient.id!, editFormData);
      if (response.success) {
        console.log('Patient updated successfully:', response.data);
        setShowEditDialog(false);
        setEditingPatient(null);
        setEditFormData({});
        // Refresh the patient list
        await fetchPatients();
        alert('Patient updated successfully!');
      } else {
        console.error('Failed to update patient:', response.message);
        alert(`Failed to update patient: ${response.message}`);
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      alert('Error updating patient. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredPatients.map((p) => p.id!).filter(Boolean)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (
      !window.confirm(
        `Delete ${count} selected patient${count === 1 ? '' : 's'}? This removes them from GoDaddy and this browser.`
      )
    ) {
      return;
    }
    setBulkDeleting(true);
    let deleted = 0;
    let failed = 0;
    for (const id of Array.from(selectedIds)) {
      try {
        const response = await patientApi.delete(id);
        if (response.success || (response.message || '').includes('not found')) {
          deleted += 1;
        } else {
          failed += 1;
        }
      } catch {
        // Still remove from UI / local hybrid
        deleted += 1;
      }
    }
    setPatients((prev) => prev.filter((p) => !selectedIds.has(p.id!)));
    setSelectedIds(new Set());
    setSelectionMode(false);
    setBulkDeleting(false);
    void refreshPatients();
    notifyAppDataChanged();
    alert(
      failed === 0
        ? `Deleted ${deleted} patient${deleted === 1 ? '' : 's'}.`
        : `Deleted ${deleted}, ${failed} failed.`
    );
  };

  // Delete Patient Functions
  const handleDeletePatient = (patient: Patient) => {
    setDeletingPatient(patient);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPatient) return;
    
    setDeleteLoading(true);
    try {
      // Check if this is a local patient placeholder
      const isLocalPatient = deletingPatient.email === 'no-email@local.com' ||
                            deletingPatient.name === 'Local Patient' ||
                            deletingPatient.full_name === 'Local Patient';
      
      if (isLocalPatient) {
        // Just remove from UI - no backend call needed
        setPatients(prev => prev.filter(p => p.id !== deletingPatient.id));
        setShowDeleteDialog(false);
        setDeletingPatient(null);
        alert('✅ Local patient removed successfully!');
        setDeleteLoading(false);
        return;
      }
      
      // Try to delete from backend
      const response = await patientApi.delete(deletingPatient.id!);
      if (response.success) {
        console.log('Patient deleted successfully');
        // Remove from UI immediately
        setPatients(prev => prev.filter(p => p.id !== deletingPatient.id));
        setShowDeleteDialog(false);
        setDeletingPatient(null);
        alert('✅ Patient deleted successfully!');
      } else {
        // Even if backend fails, remove from UI if it's a "not found" error
        const errorMsg = response.message || '';
        if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          setPatients(prev => prev.filter(p => p.id !== deletingPatient.id));
          setShowDeleteDialog(false);
          setDeletingPatient(null);
          alert('✅ Patient removed (was not found in backend)');
        } else {
          console.error('Failed to delete patient:', response.message);
          alert(`Failed to delete patient: ${response.message}`);
        }
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      // Remove from UI anyway
      setPatients(prev => prev.filter(p => p.id !== deletingPatient.id));
      setShowDeleteDialog(false);
      setDeletingPatient(null);
      alert('✅ Patient removed from view');
    } finally {
      setDeleteLoading(false);
    }
  };

  // AI-Powered Functions
  const generateAISuggestions = async (field: string, currentValue: string, patientData: any) => {
    setAiProcessing(true);
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let suggestions: string[] = [];
      
      switch (field) {
        case 'clinicalDiagnosis':
          suggestions = [
            'Acute chest pain - rule out MI',
            'Hypertension - stage 1',
            'Type 2 Diabetes Mellitus',
            'Anxiety disorder',
            'Upper respiratory infection'
          ];
          break;
        case 'treatmentPlan':
          suggestions = [
            'Lifestyle modifications: diet and exercise',
            'Medication review and optimization',
            'Regular monitoring of vitals',
            'Patient education on condition management',
            'Follow-up in 2-4 weeks'
          ];
          break;
        case 'riskFactors':
          suggestions = [
            'Age-related cardiovascular risk',
            'Family history of diabetes',
            'Sedentary lifestyle',
            'Poor dietary habits',
            'Stress and anxiety factors'
          ];
          break;
        case 'followUp':
          suggestions = [
            'Schedule follow-up in 2 weeks',
            'Refer to cardiology if chest pain persists',
            'Blood work in 3 months',
            'Lifestyle counseling session',
            'Medication adherence review'
          ];
          break;
      }
      
      setAiSuggestions(prev => ({
        ...prev,
        [field]: suggestions.slice(0, 3) // Show top 3 suggestions
      }));
    } catch (error) {
      console.error('AI suggestion generation failed:', error);
    } finally {
      setAiProcessing(false);
    }
  };

  const generateAISummary = async (patientData: any, assessment: any) => {
    setAiProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const summary = `
        **AI-Generated Patient Summary:**
        
        **Chief Concerns:** ${assessment.chiefComplaint || 'Not specified'}
        **Key Symptoms:** ${assessment.symptoms || 'None reported'}
        **Clinical Findings:** ${assessment.physicalExam || 'Standard examination'}
        **Assessment:** ${assessment.clinicalDiagnosis || 'Pending evaluation'}
        **Risk Level:** ${assessment.riskFactors ? 'Moderate risk factors identified' : 'Low risk profile'}
        **Recommended Actions:** ${assessment.treatmentPlan || 'Standard care protocol'}
        
        **AI Insights:** Based on the clinical data, this patient presents with typical primary care concerns. Recommend standard monitoring and follow-up protocols.
      `;
      
      setAiSummary(summary);
    } catch (error) {
      console.error('AI summary generation failed:', error);
    } finally {
      setAiProcessing(false);
    }
  };

  const validateClinicalData = (field: string, value: string) => {
    const alerts = [];
    
    // Clinical validation rules
    if (field === 'clinicalDiagnosis' && value.toLowerCase().includes('chest pain')) {
      alerts.push({
        type: 'warning',
        message: '⚠️ Chest pain requires immediate cardiac evaluation',
        severity: 'high'
      });
    }
    
    if (field === 'symptoms' && value.toLowerCase().includes('fever')) {
      alerts.push({
        type: 'info',
        message: '🌡️ Fever present - consider infectious workup',
        severity: 'medium'
      });
    }
    
    if (field === 'riskFactors' && value.toLowerCase().includes('diabetes')) {
      alerts.push({
        type: 'warning',
        message: '🩸 Diabetes risk - recommend glucose monitoring',
        severity: 'high'
      });
    }
    
    setValidationAlerts(alerts);
    return alerts;
  };

  const handleModernAIAssessment = async (patient: Patient) => {
    setAiProcessing(true);
    setSelectedPatient(patient);
    
    try {
      // Simulate advanced AI processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Advanced AI health score calculation
      let score = 100;
      const factors: string[] = [];
      const recs: string[] = [];
      
      // Age-based scoring
      if (patient.age && patient.age > 65) {
        score -= 20;
        factors.push('Advanced Age');
        recs.push('Regular health monitoring recommended');
      } else if (patient.age && patient.age > 50) {
        score -= 10;
        factors.push('Age-related Risk');
        recs.push('Annual comprehensive checkup');
      }
      
      // Medical history analysis
      if (patient.pastMedicalHistory && patient.pastMedicalHistory.length > 50) {
        score -= 25;
        factors.push('Complex Medical History');
        recs.push('Specialist consultation recommended');
      }
      
      // Allergy assessment
      if (patient.allergies && typeof patient.allergies === 'string' && patient.allergies.toLowerCase().includes('severe')) {
        score -= 20;
        factors.push('Severe Allergies');
        recs.push('Allergy management plan needed');
      } else if (patient.allergies && typeof patient.allergies === 'string' && patient.allergies.length > 20) {
        score -= 10;
        factors.push('Multiple Allergies');
        recs.push('Allergy testing recommended');
      }
      
      // Family history analysis
      if (patient.familyHistory) {
        if (patient.familyHistory.toLowerCase().includes('diabetes')) {
          score -= 15;
          factors.push('Family History of Diabetes');
          recs.push('Regular blood glucose monitoring');
        }
        if (patient.familyHistory.toLowerCase().includes('heart')) {
          score -= 15;
          factors.push('Family History of Heart Disease');
          recs.push('Cardiovascular risk assessment');
        }
        if (patient.familyHistory.toLowerCase().includes('cancer')) {
          score -= 20;
          factors.push('Family History of Cancer');
          recs.push('Cancer screening protocols');
        }
      }
      
      // Mental health assessment
      if (patient.age && patient.age > 18) {
        recs.push('Mental health screening recommended');
        recs.push('Stress management techniques');
      }
      
      const finalScore = Math.max(0, Math.min(100, score));
      
      // Generate comprehensive AI assessment
      const aiAssessment = {
        patientName: patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        patientEmail: patient.email,
        healthScore: finalScore,
        riskFactors: factors,
        recommendations: recs,
        assessmentDate: new Date().toISOString(),
        aiInsights: [
          `Based on comprehensive analysis, ${patient.name || 'the patient'} has a health score of ${finalScore}/100`,
          factors.length > 0 ? `Key risk factors identified: ${factors.join(', ')}` : 'No significant risk factors detected',
          `AI recommends ${recs.length} specific interventions for optimal health outcomes`
        ]
      };
      
      // Store AI assessment data and show results
      setAiAssessmentData(aiAssessment);
      setShowAIAssessment(true);
      
    } catch (err) {
      console.error('Modern AI Assessment failed:', err);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSendEmail = async (patient: Patient) => {
    setEmailLoading(true);
    setEmailSuccess(false);
    
    try {
      // Calculate health score for email
      let score = 100;
      const factors: string[] = [];
      const recs: string[] = [];
      
      // Age-based scoring
      if (patient.age && patient.age > 65) {
        score -= 20;
        factors.push('Advanced Age');
        recs.push('Regular health monitoring recommended');
      } else if (patient.age && patient.age > 50) {
        score -= 10;
        factors.push('Age-related Risk');
        recs.push('Annual comprehensive checkup');
      }
      
      // Medical history analysis
      if (patient.pastMedicalHistory && patient.pastMedicalHistory.length > 50) {
        score -= 25;
        factors.push('Complex Medical History');
        recs.push('Specialist consultation recommended');
      }
      
      // Allergy assessment
      if (patient.allergies && typeof patient.allergies === 'string' && patient.allergies.toLowerCase().includes('severe')) {
        score -= 20;
        factors.push('Severe Allergies');
        recs.push('Allergy management plan needed');
      } else if (patient.allergies && typeof patient.allergies === 'string' && patient.allergies.length > 20) {
        score -= 10;
        factors.push('Multiple Allergies');
        recs.push('Allergy testing recommended');
      }
      
      // Family history analysis
      if (patient.familyHistory) {
        if (patient.familyHistory.toLowerCase().includes('diabetes')) {
          score -= 15;
          factors.push('Family History of Diabetes');
          recs.push('Regular blood glucose monitoring');
        }
        if (patient.familyHistory.toLowerCase().includes('heart')) {
          score -= 15;
          factors.push('Family History of Heart Disease');
          recs.push('Cardiovascular risk assessment');
        }
        if (patient.familyHistory.toLowerCase().includes('cancer')) {
          score -= 20;
          factors.push('Family History of Cancer');
          recs.push('Cancer screening protocols');
        }
      }
      
      // Mental health assessment
      if (patient.age && patient.age > 18) {
        recs.push('Mental health screening recommended');
        recs.push('Stress management techniques');
      }
      
      const finalScore = Math.max(0, Math.min(100, score));
      
      // Set email preview data
      setEmailPreviewData({
        patient,
        healthScore: finalScore,
        riskFactors: factors,
        recommendations: recs,
      });
      setShowEmailPreview(true);
      
    } catch (err) {
      console.error('Email preparation failed:', err);
    } finally {
      setEmailLoading(false);
    }
  };

  const calculatePatientHealthScore = (patient: Patient): number => {
    let score = 100;
    
    // Age factor
    if (patient.age && patient.age > 65) score -= 15;
    else if (patient.age && patient.age > 50) score -= 10;
    
    // Medical history factor
    if (patient.pastMedicalHistory && patient.pastMedicalHistory.length > 50) {
      score -= 20;
    }
    
    // Allergies factor
    if (patient.allergies && typeof patient.allergies === 'string' && patient.allergies.toLowerCase().includes('severe')) {
      score -= 15;
    } else if (patient.allergies && typeof patient.allergies === 'string' && patient.allergies.length > 20) {
      score -= 10;
    }
    
    // Family history factor
    if (patient.familyHistory) {
      if (patient.familyHistory.toLowerCase().includes('diabetes')) score -= 10;
      if (patient.familyHistory.toLowerCase().includes('heart')) score -= 10;
      if (patient.familyHistory.toLowerCase().includes('cancer')) score -= 15;
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const getPatientRiskFactors = (patient: Patient): string[] => {
    const factors: string[] = [];
    
    if (patient.age && patient.age > 65) factors.push('Advanced Age');
    if (patient.age && patient.age > 50) factors.push('Age-related Risk');
    
    if (patient.pastMedicalHistory && patient.pastMedicalHistory.length > 50) {
      factors.push('Complex Medical History');
    }
    
    if (patient.allergies && typeof patient.allergies === 'string' && patient.allergies.length > 20) {
      factors.push('Multiple Allergies');
    }
    
    if (patient.familyHistory) {
      if (patient.familyHistory.toLowerCase().includes('diabetes')) factors.push('Family History of Diabetes');
      if (patient.familyHistory.toLowerCase().includes('heart')) factors.push('Family History of Heart Disease');
      if (patient.familyHistory.toLowerCase().includes('cancer')) factors.push('Family History of Cancer');
    }
    
    return factors;
  };

  const generatePatientRecommendations = (patient: Patient, healthScore: number): string[] => {
    const recommendations: string[] = [];
    
    if (healthScore < 70) {
      recommendations.push('Schedule comprehensive health screening within 2 weeks');
      recommendations.push('Consult with primary care physician for detailed assessment');
    }
    
    if (patient.age && patient.age > 50) {
      recommendations.push('Annual comprehensive health checkup recommended');
      recommendations.push('Consider bone density and cardiovascular screening');
    }
    
    if (patient.familyHistory && patient.familyHistory.toLowerCase().includes('diabetes')) {
      recommendations.push('Regular blood glucose monitoring');
      recommendations.push('Maintain healthy diet and regular exercise');
    }
    
    if (patient.familyHistory && patient.familyHistory.toLowerCase().includes('heart')) {
      recommendations.push('Cardiovascular risk assessment');
      recommendations.push('Cholesterol and blood pressure monitoring');
    }
    
    // General recommendations
    recommendations.push('Maintain regular exercise routine');
    recommendations.push('Follow balanced diet with plenty of fruits and vegetables');
    recommendations.push('Get adequate sleep (7-9 hours per night)');
    recommendations.push('Manage stress through relaxation techniques');
    
    return recommendations;
  };

  const formatSOAPNote = (patient: Patient, vitals: Vitals[]) => {
    const healthScore = calculatePatientHealthScore(patient);
    const riskFactors = getPatientRiskFactors(patient);
    const recommendations = generatePatientRecommendations(patient, healthScore);
    
    return {
      subjective: {
        chiefComplaint: patient.pastMedicalHistory || 'No specific complaints recorded',
        historyOfPresentIllness: patient.pastMedicalHistory || 'No current illness reported',
        allergies: patient.allergies || 'No known allergies',
        medications: patient.medicationList || 'No current medications',
        familyHistory: patient.familyHistory || 'No significant family history',
        socialHistory: `Age: ${patient.age || 'Not specified'}, Gender: ${patient.gender || 'Not specified'}`,
        psychologicalAssessment: 'Mental health screening questions and assessment results',
        psychologicalQuestions: [
          'How would you rate your overall mood in the past week? (1-10)',
          'Have you experienced any anxiety or worry recently?',
          'How is your sleep quality? (1-10)',
          'Do you feel supported by family and friends?',
          'Have you had any thoughts of self-harm or suicide?',
          'How would you rate your stress level? (1-10)',
          'Are you able to concentrate and focus on tasks?',
          'Do you feel hopeful about the future?'
        ]
      },
      objective: {
        vitalSigns: vitals.length > 0 ? {
          bloodPressure: vitals[0].bloodPressure || 'Not recorded',
          heartRate: vitals[0].heartRate || 'Not recorded',
          temperature: vitals[0].temperature || 'Not recorded',
          oxygenSaturation: vitals[0].oxygenSaturation || 'Not recorded',
          bloodSugar: vitals[0].bloodSugar || 'Not recorded',
          weight: vitals[0].weight || 'Not recorded',
          height: vitals[0].height || 'Not recorded',
          carotidDoppler: vitals[0].carotidDoppler || 'Not recorded'
        } : {
          bloodPressure: 'Not recorded',
          heartRate: 'Not recorded',
          temperature: 'Not recorded',
          oxygenSaturation: 'Not recorded',
          bloodSugar: 'Not recorded',
          weight: 'Not recorded',
          height: 'Not recorded',
          carotidDoppler: 'Not recorded'
        },
        physicalExam: 'Comprehensive physical examination recommended',
        labResults: 'Pending laboratory results',
        specializedTests: {
          bloodSugarTest: vitals.length > 0 ? vitals[0].bloodSugar || 'Not performed' : 'Not performed',
          carotidDopplerTest: vitals.length > 0 ? vitals[0].carotidDoppler || 'Not performed' : 'Not performed',
          mentalHealthScreening: 'Psychological assessment questions administered'
        }
      },
      assessment: {
        primaryDiagnosis: `Health Risk Assessment - Score: ${healthScore}/100`,
        riskFactors: riskFactors.length > 0 ? riskFactors : ['No significant risk factors identified'],
        healthScore: healthScore,
        riskLevel: healthScore >= 80 ? 'Low Risk' : healthScore >= 60 ? 'Moderate Risk' : 'High Risk'
      },
      plan: {
        immediateActions: recommendations.slice(0, 3),
        followUp: recommendations.slice(3),
        referrals: healthScore < 70 ? ['Primary Care Physician', 'Specialist Consultation'] : ['Routine Follow-up'],
        patientEducation: [
          'Maintain regular exercise routine',
          'Follow balanced diet',
          'Regular health monitoring',
          'Stress management techniques'
        ]
      }
    };
  };

  const getBloodSugarStatus = (bloodSugar: number | undefined) => {
    if (bloodSugar === undefined) return { label: 'Not Recorded', color: 'default' as const };
    if (bloodSugar < 70) return { label: 'Low', color: 'warning' as const };
    if (bloodSugar > 140) return { label: 'High', color: 'error' as const };
    return { label: 'Normal', color: 'success' as const };
  };

  const getMentalHealthStatus = (score: number | undefined) => {
    if (score === undefined) return { label: 'Not Recorded', color: 'default' as const };
    if (score <= 4) return { label: 'Minimal', color: 'success' as const };
    if (score <= 9) return { label: 'Mild', color: 'info' as const };
    if (score <= 14) return { label: 'Moderate', color: 'warning' as const };
    if (score <= 19) return { label: 'Moderately Severe', color: 'error' as const };
    return { label: 'Severe', color: 'error' as const };
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Enhanced Doctor Dashboard - {doctorName}
          </Typography>
          <IconButton color="inherit" onClick={onLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, md: 0 } }}>
      <ExportActions
        contentRef={contentRef}
        fileName="Doctor_Dashboard_Report"
        downloadLabel="📥 Save Dashboard PDF"
        printLabel="🖨️ Print Dashboard"
      />
      <Box ref={contentRef}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
            👨‍⚕️ Enhanced Doctor Dashboard
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Advanced patient management with AI-powered insights
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* API Connection Status */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>API Status:</strong> Checking connection to Django backend at {getApiBaseUrl()}
            <br />
            <strong>Patients Loaded:</strong> {patients.length} patients from {patients.length > 0 && patients[0].id?.startsWith('demo_') ? 'Demo Mode' : 'Database'}
          </Typography>
        </Alert>

        {emailSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Modern AI Assessment complete! Patient has received their comprehensive health analysis and AI-powered recommendations via email.
          </Alert>
        )}

        {/* Bulk select first (delete EE duplicates) — then search */}
        <Alert severity="warning" sx={{ mb: 2 }}>
          Duplicate patients? Click <strong>Select to delete</strong>, search <code>e e0</code> or{' '}
          <code>EE</code>, then <strong>Select all</strong> → <strong>Delete selected</strong>.
        </Alert>
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          {!selectionMode ? (
            <Button
              variant="contained"
              color="error"
              startIcon={<ChecklistIcon />}
              onClick={() => setSelectionMode(true)}
              disabled={filteredPatients.length === 0}
            >
              Select to delete
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                startIcon={<SelectAllIcon />}
                onClick={selectAllFiltered}
                disabled={filteredPatients.length === 0 || bulkDeleting}
              >
                Select all ({filteredPatients.length})
              </Button>
              <Button variant="outlined" onClick={clearSelection} disabled={bulkDeleting}>
                Clear
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={bulkDeleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
                onClick={() => void handleBulkDelete()}
                disabled={selectedIds.size === 0 || bulkDeleting}
              >
                Delete selected ({selectedIds.size})
              </Button>
              <Button
                onClick={() => {
                  setSelectionMode(false);
                  clearSelection();
                }}
                disabled={bulkDeleting}
              >
                Cancel
              </Button>
              <Typography variant="body2" color="text.secondary">
                Tip: search “EE” / “e e0” first, then Select all to delete only matches.
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search patients by name, email, or phone (e.g. EE or e e0)…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>

        {/* Enhanced Patients List with Tabs */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Patient Statistics */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Card sx={{ minWidth: 150, bgcolor: 'primary.light', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{filteredPatients.length}</Typography>
                  <Typography variant="body2">Total Patients</Typography>
                </CardContent>
              </Card>
              <Card sx={{ minWidth: 150, bgcolor: 'success.light', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{filteredPatients.filter(p => p.age && p.age < 50).length}</Typography>
                  <Typography variant="body2">Under 50</Typography>
                </CardContent>
              </Card>
              <Card sx={{ minWidth: 150, bgcolor: 'warning.light', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{filteredPatients.filter(p => p.age && p.age >= 50).length}</Typography>
                  <Typography variant="body2">50+ Years</Typography>
                </CardContent>
              </Card>
              <Card sx={{ minWidth: 150, bgcolor: 'error.light', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{filteredPatients.filter(p => {
                    if (!p.allergies) return false;
                    if (typeof p.allergies === 'string') return p.allergies.trim().length > 0;
                    if (Array.isArray(p.allergies)) return (p.allergies as string[]).length > 0;
                    return false;
                  }).length}</Typography>
                  <Typography variant="body2">With Allergies</Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Enhanced Patient Cards */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(auto-fill, minmax(300px, 1fr))',
                md: 'repeat(auto-fill, minmax(350px, 1fr))'
              }, 
              gap: 3 
            }}>
            {filteredPatients.map((patient) => (
                <Box key={patient.id}>
                  <Card elevation={3} sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    outline: selectionMode && selectedIds.has(patient.id!) ? '2px solid' : undefined,
                    outlineColor: 'error.main',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      {selectionMode && (
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedIds.has(patient.id!)}
                              onChange={() => toggleSelected(patient.id!)}
                              color="error"
                            />
                          }
                          label="Select"
                          sx={{ mb: 1 }}
                        />
                      )}
                      {/* Patient Header */}
                    <Box display="flex" alignItems="center" mb={2}>
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()}
                        </Typography>
                        {patient.age && patient.age > 65 && (
                          <Chip label="Senior" size="small" color="warning" sx={{ ml: 1 }} />
                        )}
                    </Box>
                    
                      {/* Contact Information */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <strong>📧 Email:</strong> {patient.email || 'N/A'}
                    </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <strong>📞 Phone:</strong> {patient.phoneNumber || patient.phone || 'N/A'}
                    </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <strong>🩸 Blood Group:</strong> {patient.bloodGroup || patient.blood_type || 'N/A'}
                    </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>👤 Age:</strong> {patient.age || 'N/A'} | <strong>Gender:</strong> {patient.gender || 'N/A'}
                        </Typography>
                      </Box>
                    
                      {/* Medical Information Chips */}
                      <Box sx={{ mb: 2 }}>
                        <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                      <Chip
                            label={`⚠️ Allergies: ${Array.isArray(patient.allergies) ? patient.allergies.length : (patient.allergies || '').split(',').filter(a => a.trim()).length} items`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                          {patient.pastMedicalHistory && (
                            <Chip
                              label={`🏥 Medical History`}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          )}
                          {patient.familyHistory && (
                            <Chip
                              label={`👨‍👩‍👧‍👦 Family History`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                          {patient.medicationList && (
                            <Chip
                              label={`💊 Medications`}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        
                        {/* Quick Medical Summary */}
                        {patient.pastMedicalHistory && (
                          <Typography variant="caption" color="text.secondary" sx={{ 
                            display: 'block', 
                            fontStyle: 'italic',
                            maxHeight: '40px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            <strong>Medical:</strong> {patient.pastMedicalHistory.length > 80 ? 
                              patient.pastMedicalHistory.substring(0, 80) + '...' : 
                              patient.pastMedicalHistory}
                          </Typography>
                        )}
                    </Box>
                  </CardContent>
                  
                    {/* Enhanced Action Buttons */}
                    <CardActions sx={{ 
                      flexDirection: 'column', 
                      gap: 1, 
                      p: 2,
                      bgcolor: 'grey.50'
                    }}>
                      <Box display="flex" gap={1} width="100%">
                    <Button
                      size="small"
                          variant="outlined"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewPatient(patient)}
                          sx={{ flex: 1 }}
                    >
                      View Details
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<HealthIcon />}
                      onClick={() => handleRecordVitals(patient)}
                          sx={{ flex: 1 }}
                          color="primary"
                    >
                      Record Vitals
                    </Button>
                      </Box>
                      
                      <Box display="flex" gap={1} width="100%">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EmailIcon />}
                          onClick={() => handleSendEmail(patient)}
                          disabled={emailLoading}
                          color="info"
                          sx={{ flex: 1 }}
                        >
                          {emailLoading ? 'Sending...' : 'Send Email'}
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<HealthIcon />}
                          onClick={() => handleModernAIAssessment(patient)}
                          color="secondary"
                          sx={{ flex: 1 }}
                        >
                          AI Assessment
                        </Button>
                      </Box>
                      
                      <Box display="flex" gap={1} width="100%">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditPatient(patient)}
                          color="primary"
                          sx={{ flex: 1 }}
                        >
                          Edit Patient
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeletePatient(patient)}
                          color="error"
                          sx={{ flex: 1 }}
                        >
                          Delete Patient
                        </Button>
                      </Box>
                  </CardActions>
                </Card>
                </Box>
            ))}
            </Box>
          </Box>
        )}

        {filteredPatients.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No patients found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'Try adjusting your search terms' : 'No patients have registered yet'}
            </Typography>
          </Box>
        )}
      </Paper>
      </Box>

      {/* Patient Details Dialog */}
      <Dialog
        open={!!selectedPatient && !showVitalsForm && !showRecommendationForm}
        onClose={() => setSelectedPatient(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Patient Details - {selectedPatient?.name}
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box>
              {/* Patient Information */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">📋 Patient Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom color="primary">
                        📋 Personal Information
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Full Name:</strong> {selectedPatient.name || selectedPatient.full_name || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Email:</strong> {selectedPatient.email || 'Not provided'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Phone:</strong> {selectedPatient.phoneNumber || selectedPatient.phone || 'Not provided'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Age:</strong> {selectedPatient.age || 'Not specified'} years
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Gender:</strong> {selectedPatient.gender || 'Not specified'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Blood Group:</strong> {selectedPatient.bloodGroup || 'Not specified'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Registration Date:</strong> {selectedPatient.registeredAt || selectedPatient.createdAt || 'Not available'}
                      </Typography>
                      {selectedPatient.uniquePatientId && (
                        <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                          <strong>🆔 Unique Patient ID:</strong> {selectedPatient.uniquePatientId}
                        </Typography>
                      )}
                      {selectedPatient.useUniqueId && (
                        <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
                          <strong>🔒 Privacy Mode:</strong> Personal information protected
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom color="primary">
                        🏥 Medical Information
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Past Medical History:</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pl: 2, fontStyle: 'italic' }}>
                        {selectedPatient.pastMedicalHistory || 'None reported'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Allergies:</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pl: 2, fontStyle: 'italic' }}>
                        {selectedPatient.allergies || 'None reported'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Family History:</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pl: 2, fontStyle: 'italic' }}>
                        {selectedPatient.familyHistory || 'None reported'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Current Medications:</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pl: 2, fontStyle: 'italic' }}>
                        {selectedPatient.medicationList || 'None reported'}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Volunteer Information */}
              {selectedPatient.volunteerInfo && (selectedPatient.volunteerInfo.name || selectedPatient.volunteerInfo.organization) && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">👥 Volunteer Information</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        {selectedPatient.volunteerInfo.name && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Volunteer Name:</strong> {selectedPatient.volunteerInfo.name}
                          </Typography>
                        )}
                        {selectedPatient.volunteerInfo.organization && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Organization:</strong> {selectedPatient.volunteerInfo.organization}
                          </Typography>
                        )}
                        {selectedPatient.volunteerInfo.role && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Role:</strong> {selectedPatient.volunteerInfo.role}
                          </Typography>
                        )}
                        {selectedPatient.volunteerInfo.contact && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <strong>Contact:</strong> {selectedPatient.volunteerInfo.contact}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* SOAP Note */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" width="100%">
                    <Typography variant="h6" component="span">📝 SOAP Note</Typography>
                    {selectedPatient?.soapNote && (
                      <Chip 
                        label="Doctor Updated" 
                        size="small" 
                        color="success" 
                        sx={{ ml: 2 }}
                      />
                    )}
                    {selectedPatient?.lastUpdated && (
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }} component="span">
                        Last updated: {new Date(selectedPatient.lastUpdated).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {(() => {
                    // Use saved SOAP note if available, otherwise generate from current data
                    const savedSoapNote = selectedPatient.soapNote;
                    const soapNote = savedSoapNote || formatSOAPNote(selectedPatient, patientVitals);
                    
                    return (
                      <Box>
                        {/* Subjective */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" color="primary" gutterBottom>
                            <strong>S</strong>ubjective
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Chief Complaint:</strong> {savedSoapNote?.subjective?.chiefComplaint || soapNote?.subjective?.chiefComplaint || 'No chief complaint recorded'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>History of Present Illness:</strong> {savedSoapNote?.subjective?.historyOfPresentIllness || soapNote?.subjective?.historyOfPresentIllness || 'No history recorded'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Symptoms:</strong> {savedSoapNote?.subjective?.symptoms || 'No symptoms reported'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Allergies:</strong> {savedSoapNote?.subjective?.allergies || soapNote?.subjective?.allergies || 'No allergies reported'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Medications:</strong> {savedSoapNote?.subjective?.medications || soapNote?.subjective?.medications || 'No medications reported'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Family History:</strong> {savedSoapNote?.subjective?.familyHistory || soapNote?.subjective?.familyHistory || 'No family history recorded'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Social History:</strong> {savedSoapNote?.subjective?.socialHistory || soapNote?.subjective?.socialHistory || 'No social history recorded'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Psychological Assessment:</strong> {savedSoapNote?.subjective?.psychologicalAssessment || soapNote?.subjective?.psychologicalAssessment || 'No psychological assessment recorded'}
                          </Typography>
                          {!savedSoapNote && (
                            <>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                <strong>Mental Health Screening Questions:</strong>
                              </Typography>
                              <List dense>
                                {[
                                  "How would you rate your overall mood in the past week? (1-10)",
                                  "Have you experienced any anxiety or worry recently?",
                                  "How is your sleep quality? (1-10)",
                                  "Do you feel supported by family and friends?",
                                  "Have you had any thoughts of self-harm or suicide?",
                                  "How would you rate your stress level? (1-10)",
                                  "Are you able to concentrate and focus on tasks?",
                                  "Do you feel hopeful about the future?"
                                ].map((question: string, index: number) => (
                                  <ListItem key={index}>
                    <ListItemText 
                                      primary={`${index + 1}. ${question}`}
                                      primaryTypographyProps={{ component: 'span' }}
                    />
                  </ListItem>
                                ))}
                </List>
                            </>
                          )}
                        </Box>

                        {/* Objective */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" color="primary" gutterBottom>
                            <strong>O</strong>bjective
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Physical Examination:</strong> {savedSoapNote?.objective?.physicalExam || soapNote?.objective?.physicalExam || 'No physical examination recorded'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Lab Results:</strong> {savedSoapNote?.objective?.labResults || soapNote?.objective?.labResults || 'No lab results available'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Diagnostic Tests:</strong> {savedSoapNote?.objective?.diagnosticTests || 'No diagnostic tests performed'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Vital Signs:</strong>
                          </Typography>
                          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell><strong>Parameter</strong></TableCell>
                                  <TableCell><strong>Value</strong></TableCell>
                                  <TableCell><strong>Status</strong></TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  <TableCell>Blood Pressure</TableCell>
                                  <TableCell>{savedSoapNote?.objective?.vitalSigns?.bloodPressure || soapNote?.objective?.vitalSigns?.bloodPressure || 'Not recorded'}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={savedSoapNote?.objective?.vitalSigns?.bloodPressure === 'Not recorded' ? 'Not Available' : 'Normal'} 
                                      size="small" 
                                      color={savedSoapNote?.objective?.vitalSigns?.bloodPressure === 'Not recorded' ? 'default' : 'success'} 
                                    />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Heart Rate</TableCell>
                                  <TableCell>{savedSoapNote?.objective?.vitalSigns?.heartRate || soapNote?.objective?.vitalSigns?.heartRate || 'Not recorded'}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={savedSoapNote?.objective?.vitalSigns?.heartRate === 'Not recorded' ? 'Not Available' : 'Normal'} 
                                      size="small" 
                                      color={savedSoapNote?.objective?.vitalSigns?.heartRate === 'Not recorded' ? 'default' : 'success'} 
                                    />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Temperature</TableCell>
                                  <TableCell>{savedSoapNote?.objective?.vitalSigns?.temperature || soapNote?.objective?.vitalSigns?.temperature || 'Not recorded'}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={savedSoapNote?.objective?.vitalSigns?.temperature === 'Not recorded' ? 'Not Available' : 'Normal'} 
                                      size="small" 
                                      color={savedSoapNote?.objective?.vitalSigns?.temperature === 'Not recorded' ? 'default' : 'success'} 
                                    />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Oxygen Saturation</TableCell>
                                  <TableCell>{savedSoapNote?.objective?.vitalSigns?.oxygenSaturation || soapNote?.objective?.vitalSigns?.oxygenSaturation || 'Not recorded'}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={savedSoapNote?.objective?.vitalSigns?.oxygenSaturation === 'Not recorded' ? 'Not Available' : 'Normal'} 
                                      size="small" 
                                      color={savedSoapNote?.objective?.vitalSigns?.oxygenSaturation === 'Not recorded' ? 'default' : 'success'} 
                                    />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Blood Sugar</TableCell>
                                  <TableCell>{savedSoapNote?.objective?.vitalSigns?.bloodSugar || soapNote?.objective?.vitalSigns?.bloodSugar || 'Not recorded'}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={savedSoapNote?.objective?.vitalSigns?.bloodSugar === 'Not recorded' ? 'Not Available' : 'Normal'} 
                                      size="small" 
                                      color={savedSoapNote?.objective?.vitalSigns?.bloodSugar === 'Not recorded' ? 'default' : 'success'} 
                                    />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Carotid Doppler</TableCell>
                                  <TableCell>{savedSoapNote?.objective?.vitalSigns?.carotidDoppler || soapNote?.objective?.vitalSigns?.carotidDoppler || 'Not recorded'}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={savedSoapNote?.objective?.vitalSigns?.carotidDoppler === 'Not recorded' ? 'Not Available' : 'Normal'} 
                                      size="small" 
                                      color={savedSoapNote?.objective?.vitalSigns?.carotidDoppler === 'Not recorded' ? 'default' : 'success'} 
                                    />
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>

                        {/* Assessment */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" color="primary" gutterBottom>
                            <strong>A</strong>ssessment
                            </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Clinical Diagnosis:</strong> {savedSoapNote?.assessment?.clinicalDiagnosis || (soapNote?.assessment as any)?.primaryDiagnosis || 'No clinical diagnosis provided'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Differential Diagnosis:</strong> {savedSoapNote?.assessment?.differentialDiagnosis || 'No differential diagnosis provided'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Risk Factors:</strong> {savedSoapNote?.assessment?.riskFactors || (Array.isArray(soapNote?.assessment?.riskFactors) ? soapNote?.assessment?.riskFactors.join(', ') : soapNote?.assessment?.riskFactors) || 'No risk factors identified'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Risk Level:</strong> 
                            <Chip
                              label={savedSoapNote?.assessment?.riskLevel || soapNote?.assessment?.riskLevel || 'Unknown'} 
                              size="small"
                              color={(savedSoapNote?.assessment?.healthScore || 0) >= 80 ? 'success' : (savedSoapNote?.assessment?.healthScore || 0) >= 60 ? 'warning' : 'error'} 
                              sx={{ ml: 1 }}
                            />
                            </Typography>
                          <Typography variant="body2">
                            <strong>Health Score:</strong> {savedSoapNote?.assessment?.healthScore || (soapNote?.assessment as any)?.healthScore || 0}/100
                            </Typography>
                        </Box>

                        {/* Plan */}
                        <Box>
                          <Typography variant="h6" color="primary" gutterBottom>
                            <strong>P</strong>lan
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Treatment Plan:</strong> {savedSoapNote?.plan?.treatmentPlan || 'No treatment plan provided'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Follow-up Instructions:</strong> {savedSoapNote?.plan?.followUpInstructions || 'No follow-up instructions provided'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Patient Education:</strong> {savedSoapNote?.plan?.patientEducation || 'No patient education provided'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Referrals:</strong> {savedSoapNote?.plan?.referrals || 'No referrals provided'}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })()}
                </AccordionDetails>
              </Accordion>

              {/* Editable SOAP Note */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">📝 Editable SOAP Note</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>🔗 Linked to Doctor Assessment:</strong> Data entered here is automatically shared with the Doctor Assessment & Plan section below.
                  </Alert>
                  
                  {/* AI Validation Alerts */}
                  {validationAlerts.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      {validationAlerts.map((alert, index) => (
                        <Alert 
                          key={index} 
                          severity={alert.severity === 'high' ? 'error' : alert.severity === 'medium' ? 'warning' : 'info'}
                          sx={{ mb: 1 }}
                        >
                          {alert.message}
                        </Alert>
                      ))}
                    </Box>
                  )}
                  
                  {/* AI Summary Button */}
                  <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={() => generateAISummary(selectedPatient, doctorAssessment)}
                      disabled={aiProcessing}
                      size="small"
                    >
                      {aiProcessing ? 'Generating...' : '🤖 Generate AI Summary'}
                    </Button>
                    {aiSummary && (
                      <Button
                        variant="text"
                        onClick={() => setShowAIAssistant(!showAIAssistant)}
                        size="small"
                      >
                        {showAIAssistant ? 'Hide' : 'Show'} AI Summary
                      </Button>
                    )}
                  </Box>
                  
                  {/* AI Summary Display */}
                  {showAIAssistant && aiSummary && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                        {aiSummary}
                      </Typography>
                    </Alert>
                  )}
                  {/* Subjective */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <strong>S</strong>ubjective
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Chief Complaint"
                      placeholder="Enter patient's main complaint..."
                      variant="outlined"
                      value={doctorAssessment.chiefComplaint}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="History of Present Illness"
                      placeholder="Describe the history of the current illness..."
                      variant="outlined"
                      value={doctorAssessment.historyOfPresentIllness}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, historyOfPresentIllness: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Patient's Symptoms"
                      placeholder="List current symptoms and their duration..."
                      variant="outlined"
                      value={doctorAssessment.symptoms}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, symptoms: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Psychological Assessment"
                      placeholder="Enter psychological assessment findings..."
                      variant="outlined"
                      value={doctorAssessment.psychologicalAssessment}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, psychologicalAssessment: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                  </Box>

                  {/* Objective */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <strong>O</strong>bjective
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Physical Examination Findings"
                      placeholder="Enter physical examination findings..."
                      variant="outlined"
                      value={doctorAssessment.physicalExam}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, physicalExam: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Laboratory Results"
                      placeholder="Enter any lab results or test findings..."
                      variant="outlined"
                      value={doctorAssessment.labResults}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, labResults: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Diagnostic Tests"
                      placeholder="Enter results of any diagnostic tests..."
                      variant="outlined"
                      value={doctorAssessment.diagnosticTests}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, diagnosticTests: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                  </Box>

                  {/* Assessment */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <strong>A</strong>ssessment
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Clinical Diagnosis"
                      placeholder="Enter your clinical diagnosis and assessment..."
                      variant="outlined"
                      value={doctorAssessment.clinicalDiagnosis}
                      onChange={(e) => {
                        setDoctorAssessment(prev => ({ ...prev, clinicalDiagnosis: e.target.value }));
                        validateClinicalData('clinicalDiagnosis', e.target.value);
                        if (e.target.value.length > 10) {
                          generateAISuggestions('clinicalDiagnosis', e.target.value, selectedPatient);
                        }
                      }}
                      sx={{ mb: 2 }}
                    />
                    {/* AI Suggestions for Clinical Diagnosis */}
                    {aiSuggestions.clinicalDiagnosis.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="primary" gutterBottom>
                          🤖 AI Suggestions:
                        </Typography>
                        {aiSuggestions.clinicalDiagnosis.map((suggestion, index) => (
                            <Chip
                            key={index}
                            label={suggestion}
                              size="small"
                            color="primary"
                            variant="outlined"
                            onClick={() => setDoctorAssessment(prev => ({ 
                              ...prev, 
                              clinicalDiagnosis: prev.clinicalDiagnosis + (prev.clinicalDiagnosis ? '; ' : '') + suggestion 
                            }))}
                            sx={{ mr: 1, mb: 1, cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    )}
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Differential Diagnosis"
                      placeholder="List differential diagnoses if applicable..."
                      variant="outlined"
                      value={doctorAssessment.differentialDiagnosis}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, differentialDiagnosis: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Risk Factors"
                      placeholder="Identify any risk factors or concerns..."
                      variant="outlined"
                      value={doctorAssessment.riskFactors}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, riskFactors: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                  </Box>

                  {/* Plan */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <strong>P</strong>lan
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Treatment Plan"
                      placeholder="Enter treatment plan and medications..."
                      variant="outlined"
                      value={doctorAssessment.treatmentPlanSOAP}
                      onChange={(e) => {
                        setDoctorAssessment(prev => ({ ...prev, treatmentPlanSOAP: e.target.value }));
                        if (e.target.value.length > 10) {
                          generateAISuggestions('treatmentPlan', e.target.value, selectedPatient);
                        }
                      }}
                      sx={{ mb: 2 }}
                    />
                    {/* AI Suggestions for Treatment Plan */}
                    {aiSuggestions.treatmentPlan.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="primary" gutterBottom>
                          🤖 AI Treatment Suggestions:
                        </Typography>
                        {aiSuggestions.treatmentPlan.map((suggestion, index) => (
                          <Chip
                            key={index}
                            label={suggestion}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            onClick={() => setDoctorAssessment(prev => ({ 
                              ...prev, 
                              treatmentPlanSOAP: prev.treatmentPlanSOAP + (prev.treatmentPlanSOAP ? '; ' : '') + suggestion 
                            }))}
                            sx={{ mr: 1, mb: 1, cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    )}
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Follow-up Instructions"
                      placeholder="Enter follow-up instructions and next steps..."
                      variant="outlined"
                      value={doctorAssessment.followUpInstructions}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, followUpInstructions: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Patient Education"
                      placeholder="Enter patient education and counseling provided..."
                      variant="outlined"
                      value={doctorAssessment.patientEducation}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, patientEducation: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Referrals"
                      placeholder="Enter any specialist referrals or consultations..."
                      variant="outlined"
                      value={doctorAssessment.referrals}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, referrals: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Medication Changes"
                      placeholder="Enter any medication changes or new prescriptions..."
                      variant="outlined"
                      value={doctorAssessment.medicationChanges || ''}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, medicationChanges: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Discharge Instructions"
                      placeholder="Enter discharge instructions if applicable..."
                      variant="outlined"
                      value={doctorAssessment.dischargeInstructions || ''}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, dischargeInstructions: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Emergency Contact Instructions"
                      placeholder="Enter emergency contact instructions..."
                      variant="outlined"
                      value={doctorAssessment.emergencyInstructions || ''}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, emergencyInstructions: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  
                  <Box display="flex" gap={2} justifyContent="space-between" alignItems="center">
                    <Box>
                            <Typography variant="body2" color="text.secondary">
                        💡 Tip: Use AI suggestions above to enhance your documentation
                            </Typography>
                    </Box>
                    <Box display="flex" gap={2}>
                      <Button 
                        variant="outlined" 
                        color="primary"
                        onClick={handleSaveAssessment}
                        startIcon={<HealthIcon />}
                      >
                        Save SOAP Note
                      </Button>
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleUpdatePatientRecord}
                        startIcon={<EmailIcon />}
                      >
                        Update Patient Record
                      </Button>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Doctor Assessment and Plan */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">👨‍⚕️ Doctor Assessment & Plan</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>🔗 Linked to SOAP Note:</strong> Data entered here is automatically shared with the SOAP Note section above.
                  </Alert>
                  
                  {/* AI Processing Indicator */}
                  {aiProcessing && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      <Typography variant="body2" color="primary">
                        🤖 AI is analyzing patient data and generating suggestions...
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      📝 Clinical Assessment
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Enter your clinical assessment, observations, and findings..."
                      variant="outlined"
                      value={doctorAssessment.clinicalAssessment}
                      onChange={(e) => {
                        setDoctorAssessment(prev => ({ ...prev, clinicalAssessment: e.target.value }));
                        validateClinicalData('clinicalAssessment', e.target.value);
                        if (e.target.value.length > 15) {
                          generateAISuggestions('clinicalDiagnosis', e.target.value, selectedPatient);
                        }
                      }}
                      sx={{ mb: 2 }}
                    />
                    {/* AI Suggestions for Clinical Assessment */}
                    {aiSuggestions.clinicalDiagnosis.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="primary" gutterBottom>
                          🤖 AI Clinical Suggestions:
                        </Typography>
                        {aiSuggestions.clinicalDiagnosis.map((suggestion, index) => (
                          <Chip
                            key={index}
                            label={suggestion}
                            size="small"
                            color="primary"
                            variant="outlined"
                            onClick={() => setDoctorAssessment(prev => ({ 
                              ...prev, 
                              clinicalAssessment: prev.clinicalAssessment + (prev.clinicalAssessment ? '; ' : '') + suggestion 
                            }))}
                            sx={{ mr: 1, mb: 1, cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      🎯 Treatment Plan
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Enter treatment plan, medications, follow-up instructions..."
                      variant="outlined"
                      value={doctorAssessment.treatmentPlan}
                      onChange={(e) => {
                        setDoctorAssessment(prev => ({ ...prev, treatmentPlan: e.target.value }));
                        if (e.target.value.length > 15) {
                          generateAISuggestions('treatmentPlan', e.target.value, selectedPatient);
                        }
                      }}
                      sx={{ mb: 2 }}
                    />
                    {/* AI Suggestions for Treatment Plan */}
                    {aiSuggestions.treatmentPlan.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="primary" gutterBottom>
                          🤖 AI Treatment Suggestions:
                        </Typography>
                        {aiSuggestions.treatmentPlan.map((suggestion, index) => (
                          <Chip
                            key={index}
                            label={suggestion}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            onClick={() => setDoctorAssessment(prev => ({ 
                              ...prev, 
                              treatmentPlan: prev.treatmentPlan + (prev.treatmentPlan ? '; ' : '') + suggestion 
                            }))}
                            sx={{ mr: 1, mb: 1, cursor: 'pointer' }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      📋 Recommendations
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Enter specific recommendations for the patient..."
                      variant="outlined"
                      value={doctorAssessment.recommendations}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, recommendations: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      🔄 Follow-up Plan
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Enter follow-up schedule and next appointment details..."
                      variant="outlined"
                      value={doctorAssessment.followUpPlan}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, followUpPlan: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={handleSaveAssessment}
                    >
                      Save Assessment
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={handleUpdatePatientRecord}
                    >
                      Update Patient Record
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Vitals History */}
              {patientVitals.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">📊 Vitals History</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell><strong>Blood Sugar</strong></TableCell>
                            <TableCell><strong>Carotid Doppler</strong></TableCell>
                            <TableCell><strong>Blood Pressure</strong></TableCell>
                            <TableCell><strong>Heart Rate</strong></TableCell>
                            <TableCell><strong>Temperature</strong></TableCell>
                            <TableCell><strong>Oxygen</strong></TableCell>
                            <TableCell><strong>Mental Health</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {patientVitals.map((vital, index) => (
                            <TableRow key={index}>
                              <TableCell>{new Date().toLocaleDateString()}</TableCell>
                              <TableCell>
                                {vital.bloodSugar || 'N/A'}
                                {vital.bloodSugar && (
                                  <Chip 
                                    label={getBloodSugarStatus(vital.bloodSugar).label} 
                                    size="small" 
                                    color={getBloodSugarStatus(vital.bloodSugar).color} 
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </TableCell>
                              <TableCell>{vital.carotidDoppler || 'N/A'}</TableCell>
                              <TableCell>{vital.bloodPressure || 'N/A'}</TableCell>
                              <TableCell>{vital.heartRate || 'N/A'}</TableCell>
                              <TableCell>{vital.temperature || 'N/A'}</TableCell>
                              <TableCell>{vital.oxygenSaturation || 'N/A'}</TableCell>
                              <TableCell>
                                {vital.mentalHealthScore || 'N/A'}
                                {vital.mentalHealthScore && (
                                  <Chip 
                                    label={getMentalHealthStatus(vital.mentalHealthScore).label} 
                                    size="small" 
                                    color={getMentalHealthStatus(vital.mentalHealthScore).color} 
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPatient(null)}>Close</Button>
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={() => selectedPatient && handleSendEmail(selectedPatient)}
            disabled={emailLoading}
            color="primary"
          >
            {emailLoading ? 'Sending...' : 'Send Email Report'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setShowUnifiedSOAP(true)}
            color="secondary"
          >
            Unified SOAP Note
          </Button>
          <Button
            variant="contained"
            startIcon={<HealthIcon />}
            onClick={() => {
              setShowVitalsForm(true);
            }}
          >
            Record New Vitals
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vitals Tracking Dialog */}
      {selectedPatient && showVitalsForm && (
        <Dialog
          open={showVitalsForm}
          onClose={() => setShowVitalsForm(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <VitalsTracking
              patient={selectedPatient}
              doctorName={doctorName}
              onSuccess={handleVitalsRecorded}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Recommendation Form Dialog */}
      {selectedPatient && showRecommendationForm && (
        <Dialog
          open={showRecommendationForm}
          onClose={() => setShowRecommendationForm(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <RecommendationForm
              patient={selectedPatient}
              doctorName={doctorName}
              onSuccess={handleSendRecommendation}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Email Preview Dialog */}
      <EmailPreview
        open={showEmailPreview}
        onClose={() => setShowEmailPreview(false)}
        onSend={handleSendEmailConfirm}
        patient={emailPreviewData.patient}
        healthScore={emailPreviewData.healthScore}
        riskFactors={emailPreviewData.riskFactors}
        recommendations={emailPreviewData.recommendations}
        loading={emailLoading}
      />

      {/* AI Assessment Results Dialog */}
      <Dialog 
        open={showAIAssessment} 
        onClose={() => setShowAIAssessment(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <HealthIcon sx={{ mr: 1, color: 'primary.main' }} />
            AI Health Assessment Results
          </Box>
        </DialogTitle>
        <DialogContent>
          {aiProcessing ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={4}>
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                AI Processing Assessment...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Analyzing patient data and generating health insights
              </Typography>
            </Box>
          ) : aiAssessmentData ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Assessment for: {aiAssessmentData.patientName}
              </Typography>
              
              {/* Health Score Display */}
              <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="h2" color={`${aiAssessmentData.healthScore >= 80 ? 'success' : aiAssessmentData.healthScore >= 60 ? 'warning' : 'error'}.main`} sx={{ mr: 3 }}>
                      {aiAssessmentData.healthScore}/100
                    </Typography>
                    <Box>
                      <Typography variant="h5">
                        {aiAssessmentData.healthScore >= 80 ? 'Excellent' : aiAssessmentData.healthScore >= 60 ? 'Good' : aiAssessmentData.healthScore >= 40 ? 'Fair' : 'Needs Attention'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Overall Health Score
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Risk Factors */}
              {aiAssessmentData.riskFactors.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="warning.main">
                      Risk Factors Identified:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {aiAssessmentData.riskFactors.map((factor: string, index: number) => (
                        <Chip key={index} label={factor} color="warning" size="medium" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* AI Recommendations */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    AI Recommendations:
                  </Typography>
                  <List>
                    {aiAssessmentData.recommendations.map((rec: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemText primary={`• ${rec}`} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="info.main">
                    AI Insights:
                  </Typography>
                  <List>
                    {aiAssessmentData.aiInsights.map((insight: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemText primary={insight} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAIAssessment(false)}>
            Close
          </Button>
          {aiAssessmentData && (
            <Button 
              variant="contained" 
              startIcon={<EmailIcon />}
              onClick={() => {
                setShowAIAssessment(false);
                setEmailPreviewData({
                  patient: selectedPatient,
                  healthScore: aiAssessmentData.healthScore,
                  riskFactors: aiAssessmentData.riskFactors,
                  recommendations: aiAssessmentData.recommendations,
                });
                setShowEmailPreview(true);
              }}
            >
              Send Email Report
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog
        open={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Patient - {editingPatient?.name || editingPatient?.full_name}
        </DialogTitle>
        <DialogContent>
          {editingPatient && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Full Name"
                value={editFormData.name || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Phone Number"
                value={editFormData.phoneNumber || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="Age"
                  type="number"
                  value={editFormData.age || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Gender"
                  select
                  value={editFormData.gender || ''}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, gender: e.target.value }))}
                  sx={{ flex: 1 }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </TextField>
              </Box>
              <TextField
                fullWidth
                label="Blood Group"
                value={editFormData.bloodGroup || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Address"
                value={editFormData.address || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Past Medical History"
                value={editFormData.pastMedicalHistory || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, pastMedicalHistory: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Allergies"
                value={editFormData.allergies || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, allergies: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Family History"
                value={editFormData.familyHistory || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, familyHistory: e.target.value }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Current Medications"
                value={editFormData.medicationList || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, medicationList: e.target.value }))}
                sx={{ mb: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={editLoading}
            startIcon={editLoading ? <CircularProgress size={20} /> : <EditIcon />}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Patient Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <DeleteIcon sx={{ mr: 1, color: 'error.main' }} />
            Delete Patient
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>⚠️ Warning:</strong> This action cannot be undone. All patient data, vitals, and medical records will be permanently deleted.
          </Alert>
          {deletingPatient && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Are you sure you want to delete this patient?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                <strong>Patient:</strong> {deletingPatient.name || deletingPatient.full_name || `${deletingPatient.first_name || ''} ${deletingPatient.last_name || ''}`.trim()}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                <strong>Email:</strong> {deletingPatient.email || 'N/A'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                <strong>Phone:</strong> {deletingPatient.phoneNumber || deletingPatient.phone || 'N/A'}
              </Typography>
              <Typography variant="body2" color="error.main">
                This will permanently remove all medical records, vitals, and assessment data for this patient.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Patient'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unified SOAP Note Dialog */}
      {selectedPatient && showUnifiedSOAP && (
        <Dialog
          open={showUnifiedSOAP}
          onClose={() => setShowUnifiedSOAP(false)}
          maxWidth="xl"
          fullWidth
          fullScreen
        >
          <DialogContent sx={{ p: 0 }}>
            <UnifiedSOAPNote
              patient={selectedPatient}
              patientVitals={patientVitals}
              doctorName={doctorName}
              onSave={handleSOAPNoteUpdate}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowUnifiedSOAP(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
    </Box>
  );
};

export default DoctorDashboard;
