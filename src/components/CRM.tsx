import React, { useState } from 'react';
import { Candidate, Vacancy, InterviewSchedule, InterviewSlot } from '../types';
import { 
  Plus, Search, Filter, MoreHorizontal, User, Mail, Phone, Calendar as CalendarIcon, 
  MapPin, Clock, Edit2, FileText, CheckCircle2, AlertCircle, XCircle, Brain, 
  Award, MessageSquare, ChevronRight, X, Trash2, Check, ArrowRight, Download,
  Upload, RefreshCw, Eye, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CRMProps {
  candidates: Candidate[];
  vacancies: Vacancy[];
  interviewSchedule: InterviewSchedule;
  onUpdateCandidate: (candidate: Candidate) => void;
  onDeleteCandidate: (id: string) => void;
  onSelectCandidateChat: (candidateId: string) => void;
  onUpdateInterviewSchedule: (schedule: InterviewSchedule) => void;
  onRefreshData?: () => void;
}

const TEMPLATES = [
  {
    id: 'welcome',
    name: '👋 Primer Contacto / Bienvenida',
    text: 'Hola {nombre}, gracias por postularte para la vacante de {vacante}. Me gustaría agendar una breve llamada para conocer más sobre tu perfil. ¿Qué día tienes disponible? Saludos, {reclutador}.'
  },
  {
    id: 'interview',
    name: '📅 Invitación a Entrevista Virtual',
    text: 'Estimado/a {nombre},\n\nFelicidades, tu perfil ha sido seleccionado para la etapa de entrevistas para la vacante de {vacante}.\n\nPara elegir la hora y fecha de tu entrevista autónoma de forma virtual, puedes ingresar a tu portal de postulante.\n\nAtentamente,\n{reclutador}'
  },
  {
    id: 'welcome_team',
    name: '🎉 Oferta de Contratación / Incorporación',
    text: '¡Felicidades {nombre}! Es un placer informarte que has sido seleccionado para unirte a nuestro equipo en la posición de {vacante}.\n\nNos pondremos en contacto para coordinar la entrega de documentos y el plan de inducción.\n\n¡Bienvenido/a al equipo!\nAtentamente, {reclutador}'
  }
];

const STAGES = [
  { id: 'nuevo', label: 'Nuevo', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'contactado', label: 'Contactado', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  { id: 'interesado', label: 'Interesado', color: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' },
  { id: 'precalificado', label: 'Precalificado', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { id: 'entrevista', label: 'Entrevista', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { id: 'capacitacion', label: 'Capacitación', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'activo', label: 'Activo (Contratado)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { id: 'no_contratado', label: 'No Contratado / Lista Negra', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
];

export default function CRM({ 
  candidates, 
  vacancies, 
  interviewSchedule,
  onUpdateCandidate, 
  onDeleteCandidate, 
  onSelectCandidateChat,
  onUpdateInterviewSchedule,
  onRefreshData
}: CRMProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVacancyFilter, setSelectedVacancyFilter] = useState('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingDocKey, setAnalyzingDocKey] = useState<string | null>(null);
  const [activeAnalysisDoc, setActiveAnalysisDoc] = useState<string | null>(null);

  // Bulk Messaging State
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isBulkMessagingOpen, setIsBulkMessagingOpen] = useState(false);
  const [bulkChannel, setBulkChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [bulkTemplateText, setBulkTemplateText] = useState(TEMPLATES[0].text);
  const [bulkRecruiter, setBulkRecruiter] = useState('Sofía Ruiz');
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [bulkMessageProgress, setBulkMessageProgress] = useState<'idle' | 'sending' | 'success'>('idle');

  // New Candidate Form State
  const [newCand, setNewCand] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    vacancyId: vacancies[0]?.id || '',
    experience: '',
    source: 'Indeed',
    recruiter: 'Sofía Ruiz',
    observations: ''
  });

  const handleAddCandidateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCand.name || !newCand.phone) return;

    const candidate: Candidate = {
      id: "cand-" + Date.now(),
      name: newCand.name,
      phone: newCand.phone,
      email: newCand.email || `${newCand.name.toLowerCase().replace(/\s+/g, '')}@test.com`,
      age: parseInt(newCand.age) || 25,
      vacancyId: newCand.vacancyId,
      experience: newCand.experience,
      status: 'nuevo',
      source: newCand.source,
      recruiter: newCand.recruiter,
      date: new Date().toISOString().split('T')[0],
      observations: newCand.observations,
      documents: { cv: 'pendiente', ine: 'pendiente', domicilio: 'pendiente', curp: 'pendiente' }
    };

    onUpdateCandidate(candidate);
    setIsAddingCandidate(false);
    setNewCand({
      name: '',
      phone: '',
      email: '',
      age: '',
      vacancyId: vacancies[0]?.id || '',
      experience: '',
      source: 'Indeed',
      recruiter: 'Sofía Ruiz',
      observations: ''
    });
  };

  const handleSendBulkMessages = async () => {
    if (selectedCandidateIds.length === 0) return;
    setIsSendingBulk(true);
    try {
      const res = await fetch('/api/candidates/bulk-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateIds: selectedCandidateIds,
          templateText: bulkTemplateText,
          channel: bulkChannel,
          recruiterName: bulkRecruiter
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBulkMessageProgress('success');
          setSelectedCandidateIds([]);
          if (onRefreshData) {
            onRefreshData();
          }
        } else {
          alert("Error al enviar los mensajes masivos: " + (data.error || "Error desconocido"));
        }
      } else {
        alert("Error de red al intentar enviar los mensajes.");
      }
    } catch (e) {
      console.error("Error sending bulk messages:", e);
      alert("Error al realizar el envío masivo.");
    } finally {
      setIsSendingBulk(false);
    }
  };

  const moveCandidate = (candidate: Candidate, targetStage: Candidate['status']) => {
    const updated = { ...candidate, status: targetStage };
    onUpdateCandidate(updated);
    if (selectedCandidate?.id === candidate.id) {
      setSelectedCandidate(updated);
    }
  };

  const handleDocStatusChange = (docName: 'cv' | 'ine' | 'domicilio' | 'curp', status: 'pendiente' | 'aprobado' | 'rechazado') => {
    if (!selectedCandidate) return;
    const updatedDocs = { ...selectedCandidate.documents, [docName]: status };
    const updated = { ...selectedCandidate, documents: updatedDocs };
    onUpdateCandidate(updated);
    setSelectedCandidate(updated);
  };

  const handleUploadAndAnalyzeDocument = async (docKey: 'cv' | 'ine' | 'domicilio' | 'curp', file: File) => {
    if (!selectedCandidate) return;
    setAnalyzingDocKey(docKey);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const fileBase64 = reader.result as string;
          const res = await fetch('/api/candidates/analyze-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              candidateId: selectedCandidate.id,
              documentType: docKey,
              fileBase64,
              fileName: file.name,
              mimeType: file.type
            })
          });
          const data = await res.json();
          if (data.success && data.analysis) {
            // Update Candidate locally
            const updated = { 
              ...selectedCandidate, 
              documents: { 
                ...selectedCandidate.documents, 
                [docKey]: data.analysis.recruiterAction 
              },
              documentAnalysis: {
                ...(selectedCandidate.documentAnalysis || {}),
                [docKey]: data.analysis
              }
            };
            
            // If CV was parsed, let's prefill Candidate experience or observations if desired
            if (docKey === 'cv' && data.analysis.extractedInfo?.skills) {
              const skillsStr = data.analysis.extractedInfo.skills.join(', ');
              updated.experience = `Habilidades detectadas: ${skillsStr}. Años de experiencia: ${data.analysis.extractedInfo.experienceYears || 'No especificados'}. \n\nOriginal: ${updated.experience || ''}`;
            }

            setSelectedCandidate(updated);
            onUpdateCandidate(updated);
            setActiveAnalysisDoc(docKey);
          } else {
            alert("Error al analizar el documento con IA.");
          }
        } catch (innerErr) {
          console.error("Error inside reader.onload:", innerErr);
          alert("Error al procesar la respuesta del servidor.");
        } finally {
          setAnalyzingDocKey(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error("Error reading file:", e);
      alert("No se pudo leer el archivo.");
      setAnalyzingDocKey(null);
    }
  };

  const handleSaveObservations = (text: string) => {
    if (!selectedCandidate) return;
    const updated = { ...selectedCandidate, observations: text };
    onUpdateCandidate(updated);
    setSelectedCandidate(updated);
  };

  const handleBookSlot = async (slotId: string) => {
    if (!selectedCandidate) return;
    try {
      const response = await fetch('/api/candidates/schedule-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: selectedCandidate.id, slotId })
      });
      if (response.ok) {
        const data = await response.json();
        const updatedCand = data.candidate;
        setSelectedCandidate(updatedCand);
        onUpdateCandidate(updatedCand);
        onUpdateInterviewSchedule(data.interviewSchedule);
      } else {
        alert("No se pudo reservar el horario.");
      }
    } catch (e) {
      console.error("Error booking slot:", e);
    }
  };

  const handleCancelSlot = async () => {
    if (!selectedCandidate) return;
    try {
      const response = await fetch('/api/candidates/cancel-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: selectedCandidate.id })
      });
      if (response.ok) {
        const data = await response.json();
        const updatedCand = data.candidate;
        setSelectedCandidate(updatedCand);
        onUpdateCandidate(updatedCand);
        onUpdateInterviewSchedule(data.interviewSchedule);
      } else {
        alert("No se pudo cancelar la cita.");
      }
    } catch (e) {
      console.error("Error cancelling slot:", e);
    }
  };

  const formatSlotSpanishLocal = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const dayName = days[date.getDay()];
      const dayNum = date.getDate();
      const monthName = months[date.getMonth()];
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${dayName} ${dayNum} de ${monthName} a las ${hours}:${minutes} hs`;
    } catch (e) {
      return isoStr;
    }
  };

  const handleRunPsychologicalAnalysis = async () => {
    if (!selectedCandidate) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/candidates/analyze-psychology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: selectedCandidate.id })
      });
      const data = await res.json();
      if (data.success && data.candidate) {
        onUpdateCandidate(data.candidate);
        setSelectedCandidate(data.candidate);
      }
    } catch (err) {
      console.error('Failed to run psychological analysis', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCandidateTags = (cand: Candidate): string[] => {
    const tags: string[] = [];
    if (cand.psychoAnalysis && cand.psychoAnalysis.compatibility >= 85) {
      tags.push('Alta Compatibilidad');
    }
    const docs = cand.documents || {};
    if (docs.cv === 'aprobado' && docs.ine === 'aprobado' && docs.curp === 'aprobado') {
      tags.push('Doc Verificada');
    }
    if (cand.evaluation && cand.evaluation.technicalScore >= 80) {
      tags.push('Excelente Score');
    }
    const exp = cand.experience || '';
    if (exp.toLowerCase().includes('venta')) {
      tags.push('Ventas');
    }
    if (exp.toLowerCase().includes('sap') || exp.toLowerCase().includes('erp')) {
      tags.push('SAP/ERP');
    }
    if (exp.toLowerCase().includes('atención') || exp.toLowerCase().includes('atencion') || exp.toLowerCase().includes('servicio') || exp.toLowerCase().includes('atc')) {
      tags.push('ATC');
    }
    if (cand.status === 'activo') {
      tags.push('Contratado');
    }
    if (cand.interviewDate) {
      tags.push('Entrevista Agendada');
    }
    return tags;
  };

  const filteredCandidates = candidates.filter(cand => {
    const matchesSearch = cand.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          cand.phone.includes(searchTerm) || 
                          cand.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVacancy = selectedVacancyFilter === 'all' || cand.vacancyId === selectedVacancyFilter;
    const matchesStage = selectedStageFilter === 'all' || cand.status === selectedStageFilter;
    
    // Tag filter
    let matchesTag = true;
    if (selectedTagFilter !== 'all') {
      const tags = getCandidateTags(cand);
      matchesTag = tags.includes(selectedTagFilter);
    }
    
    // Date filter
    let matchesDate = true;
    if (selectedDateFilter !== 'all') {
      const candDate = new Date(cand.date);
      const candDateMidnight = new Date(candDate.getFullYear(), candDate.getMonth(), candDate.getDate());
      
      const today = new Date('2026-07-12'); // Local baseline date
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      if (selectedDateFilter === 'today') {
        matchesDate = candDateMidnight.getTime() === todayMidnight.getTime();
      } else if (selectedDateFilter === 'yesterday') {
        const yesterdayMidnight = new Date(todayMidnight);
        yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
        matchesDate = candDateMidnight.getTime() === yesterdayMidnight.getTime();
      } else if (selectedDateFilter === 'week') {
        const weekAgo = new Date(todayMidnight);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = candDateMidnight >= weekAgo && candDateMidnight <= todayMidnight;
      } else if (selectedDateFilter === 'month') {
        const monthAgo = new Date(todayMidnight);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = candDateMidnight >= monthAgo && candDateMidnight <= todayMidnight;
      } else if (selectedDateFilter === 'custom') {
        if (startDateFilter) {
          const start = new Date(startDateFilter);
          const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
          matchesDate = matchesDate && candDateMidnight >= startMidnight;
        }
        if (endDateFilter) {
          const end = new Date(endDateFilter);
          const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
          matchesDate = matchesDate && candDateMidnight <= endMidnight;
        }
      }
    }
    
    return matchesSearch && matchesVacancy && matchesStage && matchesTag && matchesDate;
  });

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Nombre',
      'Telefono',
      'Email',
      'Edad',
      'ID Vacante',
      'Vacante',
      'Estado',
      'Canal_Fuente',
      'Reclutador',
      'Fecha_Registro',
      'Fecha_Entrevista',
      'Observaciones'
    ];
    
    const rows = filteredCandidates.map(cand => {
      const vac = vacancies.find(v => v.id === cand.vacancyId);
      const stageLabel = STAGES.find(s => s.id === cand.status)?.label || cand.status;
      return [
        cand.id,
        cand.name,
        cand.phone,
        cand.email,
        cand.age,
        cand.vacancyId,
        vac?.title || 'Vacante General',
        stageLabel,
        cand.source,
        cand.recruiter,
        cand.date,
        cand.interviewDate || 'No agendada',
        cand.observations || ''
      ];
    });

    const csvContent = "\ufeff" + [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `heavenly_dreams_candidatos_${selectedStageFilter === 'all' ? 'todos' : selectedStageFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="crm-view">
      {/* Header and Filter Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-1 flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Buscar candidato por nombre, email o celular..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none transition-colors"
              />
            </div>

            {/* Vacancy Filter */}
            <div className="relative">
              <select
                value={selectedVacancyFilter}
                onChange={(e) => setSelectedVacancyFilter(e.target.value)}
                className="appearance-none bg-slate-950 text-white text-sm pl-4 pr-10 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-0 cursor-pointer min-w-[200px]"
              >
                <option value="all">Todas las vacantes</option>
                {vacancies.map(v => (
                  <option key={v.id} value={v.id}>{v.title}</option>
                ))}
              </select>
              <Filter className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Stage Filter */}
            <div className="relative">
              <select
                value={selectedStageFilter}
                onChange={(e) => setSelectedStageFilter(e.target.value)}
                className="appearance-none bg-slate-950 text-white text-sm pl-4 pr-10 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-0 cursor-pointer min-w-[180px]"
              >
                <option value="all">Todos los estados</option>
                {STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <Filter className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Advanced Filters */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showAdvancedFilters 
                  ? 'bg-indigo-950 border-indigo-800 text-indigo-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filtros Avanzados</span>
            </button>

            {/* Export to CSV Button */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Exportar candidatos filtrados a CSV"
            >
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </button>

            {/* Toggle Bulk Selection for Filtered */}
            {filteredCandidates.length > 0 && (
              <button
                onClick={() => {
                  const allFilteredIds = filteredCandidates.map(c => c.id);
                  const isAllSelected = allFilteredIds.every(id => selectedCandidateIds.includes(id));
                  if (isAllSelected) {
                    setSelectedCandidateIds(selectedCandidateIds.filter(id => !allFilteredIds.includes(id)));
                  } else {
                    const union = Array.from(new Set([...selectedCandidateIds, ...allFilteredIds]));
                    setSelectedCandidateIds(union);
                  }
                }}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Seleccionar o deseleccionar todos los candidatos actualmente filtrados"
              >
                <Check className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {filteredCandidates.every(c => selectedCandidateIds.includes(c.id)) ? 'Deseleccionar todos' : 'Seleccionar todos'}
                </span>
              </button>
            )}

            {/* Add Candidate Button */}
            <button
              onClick={() => setIsAddingCandidate(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Registrar Candidato
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters Panel */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-slate-900/60 rounded-2xl border border-slate-800">
                {/* Tag Segmenter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Filtrar por Etiqueta IA</label>
                  <div className="relative">
                    <select
                      value={selectedTagFilter}
                      onChange={(e) => setSelectedTagFilter(e.target.value)}
                      className="w-full appearance-none bg-slate-950 text-white text-sm pl-4 pr-10 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="all">Todas las etiquetas</option>
                      {['Alta Compatibilidad', 'Doc Verificada', 'Excelente Score', 'Ventas', 'ATC', 'SAP/ERP', 'Contratado', 'Entrevista Agendada'].map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                    <Sparkles className="w-4 h-4 text-indigo-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Date Segmenter */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fecha de Registro</label>
                  <div className="relative">
                    <select
                      value={selectedDateFilter}
                      onChange={(e) => setSelectedDateFilter(e.target.value)}
                      className="w-full appearance-none bg-slate-950 text-white text-sm pl-4 pr-10 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="all">Cualquier fecha</option>
                      <option value="today">Hoy (12 de Julio, 2026)</option>
                      <option value="yesterday">Ayer (11 de Julio, 2026)</option>
                      <option value="week">Últimos 7 días</option>
                      <option value="month">Último mes</option>
                      <option value="custom">Rango personalizado...</option>
                    </select>
                    <CalendarIcon className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Custom Date Inputs */}
                {selectedDateFilter === 'custom' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fecha de Inicio</label>
                      <input
                        type="date"
                        value={startDateFilter}
                        onChange={(e) => setStartDateFilter(e.target.value)}
                        className="w-full bg-slate-950 text-white text-sm px-4 py-2 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Fecha Fin</label>
                      <input
                        type="date"
                        value={endDateFilter}
                        onChange={(e) => setEndDateFilter(e.target.value)}
                        className="w-full bg-slate-950 text-white text-sm px-4 py-2 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </>
                )}

                {/* Reset Filters Quick Button */}
                {(selectedTagFilter !== 'all' || selectedDateFilter !== 'all' || selectedVacancyFilter !== 'all' || selectedStageFilter !== 'all' || searchTerm !== '') && (
                  <div className={`flex items-end ${selectedDateFilter === 'custom' ? 'col-span-1 md:col-span-2 lg:col-span-4 justify-end' : 'col-span-1 lg:col-span-2 justify-end'}`}>
                    <button
                      onClick={() => {
                        setSelectedTagFilter('all');
                        setSelectedDateFilter('all');
                        setStartDateFilter('');
                        setEndDateFilter('');
                        setSelectedVacancyFilter('all');
                        setSelectedStageFilter('all');
                        setSearchTerm('');
                      }}
                      className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-900/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Limpiar Filtros
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Kanban Pipeline Columns */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1200px] h-[calc(100vh-280px)]">
          {STAGES.map(stage => {
            const stageCandidates = filteredCandidates.filter(c => c.status === stage.id);
            return (
              <div key={stage.id} className="flex-1 flex flex-col bg-slate-900/30 rounded-2xl border border-slate-800/80 p-3 h-full overflow-hidden">
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      stage.id === 'activo' ? 'bg-emerald-500' : 
                      stage.id === 'no_contratado' ? 'bg-rose-500' : 
                      stage.id === 'entrevista' ? 'bg-pink-500' : 'bg-indigo-400'
                    }`}></span>
                    <span className="text-sm font-bold text-white font-display truncate">{stage.label}</span>
                  </div>
                  <span className="bg-slate-800/60 text-slate-400 text-xs font-semibold px-2 py-0.5 rounded-md font-mono">
                    {stageCandidates.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {stageCandidates.map(cand => {
                    const vac = vacancies.find(v => v.id === cand.vacancyId);
                    return (
                      <motion.div
                        layoutId={`card-${cand.id}`}
                        onClick={() => setSelectedCandidate(cand)}
                        key={cand.id}
                        className={`bg-slate-950 p-4 rounded-xl border transition-all cursor-pointer space-y-3 relative group ${
                          selectedCandidateIds.includes(cand.id) 
                            ? 'border-indigo-500 shadow-md shadow-indigo-500/5' 
                            : 'border-slate-800/80 hover:border-indigo-900/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{cand.name}</h4>
                            <span className="text-[11px] text-slate-500 block truncate font-medium uppercase font-display">{vac?.title || 'Vacante General'}</span>
                          </div>
                          <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="shrink-0 pt-0.5"
                          >
                            <input
                              type="checkbox"
                              checked={selectedCandidateIds.includes(cand.id)}
                              onChange={() => {
                                if (selectedCandidateIds.includes(cand.id)) {
                                  setSelectedCandidateIds(selectedCandidateIds.filter(id => id !== cand.id));
                                } else {
                                  setSelectedCandidateIds([...selectedCandidateIds, cand.id]);
                                }
                              }}
                              className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-800 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Candidate specs */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">
                            {cand.age} años
                          </span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {cand.source}
                          </span>
                        </div>

                        {/* Candidate tags */}
                        {getCandidateTags(cand).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {getCandidateTags(cand).map(tag => (
                              <span key={tag} className="text-[9px] font-semibold px-1.5 py-0.5 bg-indigo-950/50 text-indigo-300 border border-indigo-900/30 rounded-md">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Quick controls inside cards */}
                        <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-medium text-slate-400">{cand.recruiter}</span>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Directional fast-move buttons */}
                            {STAGES.findIndex(s => s.id === stage.id) < STAGES.length - 1 && (
                              <button
                                title="Avanzar etapa"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const idx = STAGES.findIndex(s => s.id === stage.id);
                                  moveCandidate(cand, STAGES[idx + 1].id as Candidate['status']);
                                }}
                                className="p-1 hover:bg-indigo-950/80 hover:text-indigo-400 rounded transition-colors"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {stageCandidates.length === 0 && (
                    <div className="h-full flex items-center justify-center text-center py-8 text-slate-600 text-xs border border-dashed border-slate-800/40 rounded-xl select-none">
                      Vacío
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slide-over Profile Detail Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCandidate(null)}
              className="absolute inset-0 bg-black"
            ></motion.div>

            {/* Content Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl h-full bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col z-10"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-900 bg-slate-900/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold font-display text-lg">
                    {selectedCandidate.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-display leading-tight">{selectedCandidate.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                        {vacancies.find(v => v.id === selectedCandidate.vacancyId)?.title || 'Vacante General'}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-500 font-mono">Registrado el {selectedCandidate.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      onSelectCandidateChat(selectedCandidate.id);
                      setSelectedCandidate(null);
                    }}
                    className="p-2 bg-indigo-950 text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 rounded-xl hover:bg-indigo-900/50 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    title="Ver Chat de WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" /> Simular Chat
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm(`¿Eliminar expediente de ${selectedCandidate.name}?`)) {
                        onDeleteCandidate(selectedCandidate.id);
                        setSelectedCandidate(null);
                      }
                    }}
                    className="p-2.5 bg-slate-900 hover:bg-rose-950/30 hover:text-rose-400 text-slate-400 border border-slate-800 rounded-xl transition-colors"
                    title="Eliminar candidato"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setSelectedCandidate(null)}
                    className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Candidate Tags badges */}
                {getCandidateTags(selectedCandidate).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-3 bg-indigo-950/25 rounded-2xl border border-indigo-900/30 shadow-inner">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1 w-full mb-1 font-display">
                      <Sparkles className="w-3 h-3 text-indigo-400" /> Etiquetas del Candidato
                    </span>
                    {getCandidateTags(selectedCandidate).map(tag => (
                      <span key={tag} className="text-xs font-semibold px-2.5 py-1 bg-indigo-950/60 text-indigo-300 border border-indigo-900/40 rounded-lg flex items-center gap-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Pipeline Progression Controls */}
                <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Fase del Embudo de Reclutamiento</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {STAGES.map(s => {
                      const isActive = selectedCandidate.status === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => moveCandidate(selectedCandidate, s.id as Candidate['status'])}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                            isActive 
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10' 
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900 hover:text-white'
                          }`}
                        >
                          {s.label.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recruiter Persona Controls */}
                <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Personalidad de Reclutador IA</h4>
                  <div className="space-y-2">
                    <select
                      value={selectedCandidate.recruiterPersona || 'auto'}
                      onChange={async (e) => {
                        const personaValue = e.target.value;
                        const updated = { ...selectedCandidate, recruiterPersona: personaValue as any };
                        setSelectedCandidate(updated);
                        onUpdateCandidate(updated);
                        await fetch('/api/candidates/update-persona', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ candidateId: selectedCandidate.id, recruiterPersona: personaValue })
                        });
                      }}
                      className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none cursor-pointer"
                    >
                      <option value="auto">✨ Selección Automática por IA (Basada en Vacante)</option>
                      <option value="sales">🎯 Reclutador de Ventas (Persuasivo y Enérgico)</option>
                      <option value="tech">💻 Reclutador Tecnológico (Lógico y Estructurado)</option>
                      <option value="support">🤝 Reclutador de Atención al Cliente (Empático y Paciente)</option>
                    </select>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      El chatbot adaptará dinámicamente su lenguaje, tono, enfoque de preguntas y vocabulario según esta personalidad.
                    </p>
                  </div>
                </div>

                {/* Candidate Information & Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/80 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Datos Personales</h4>
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <span>{selectedCandidate.phone}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span>{selectedCandidate.email}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-slate-500" />
                        <span>{selectedCandidate.age} años de edad</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span>{selectedCandidate.source} (Canal)</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/80 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Información Laboral</h4>
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 block uppercase">Experiencia previa declarada:</span>
                      <p className="text-xs text-slate-300 italic bg-slate-950 p-2.5 rounded-lg border border-slate-900/60 max-h-[85px] overflow-y-auto leading-relaxed">
                        "{selectedCandidate.experience || 'No registrada'}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Document Manager */}
                <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Expediente de Documentación (Validador IA)</h4>
                    <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-indigo-400 font-mono">
                      Seguimiento Automático Activo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'cv', label: 'Curriculum Vitae (CV)' },
                      { key: 'ine', label: 'Identificación Oficial (INE)' },
                      { key: 'domicilio', label: 'Comprobante de Domicilio' },
                      { key: 'curp', label: 'Cédula CURP' },
                    ].map(doc => {
                      const status = selectedCandidate.documents[doc.key as 'cv' | 'ine' | 'domicilio' | 'curp'] || 'pendiente';
                      const isCurrentlyAnalyzing = analyzingDocKey === doc.key;
                      return (
                        <div key={doc.key} className="flex flex-col bg-slate-950 rounded-xl border border-slate-900 overflow-hidden">
                          <div className="p-3 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-white block truncate">{doc.label}</span>
                              <span className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 uppercase ${
                                status === 'aprobado' ? 'text-emerald-400' : 
                                status === 'rechazado' ? 'text-rose-400' : 'text-amber-400'
                              }`}>
                                {status === 'aprobado' ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" /> : 
                                 status === 'rechazado' ? <XCircle className="w-3 h-3 flex-shrink-0" /> : <AlertCircle className="w-3 h-3 flex-shrink-0" />}
                                <span className="truncate">{status}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              {/* Hidden file input triggered via label */}
                              <label className={`p-1.5 rounded-lg border transition-colors cursor-pointer bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-800 flex items-center justify-center ${
                                isCurrentlyAnalyzing ? 'opacity-50 pointer-events-none' : ''
                              }`} title="Subir y analizar con IA (PDF, Imagen, Foto)">
                                {isCurrentlyAnalyzing ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5" />
                                )}
                                <input 
                                  type="file" 
                                  accept="application/pdf,image/*" 
                                  className="hidden" 
                                  disabled={analyzingDocKey !== null}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadAndAnalyzeDocument(doc.key as any, file);
                                  }}
                                />
                              </label>

                              {/* View AI Report Button */}
                              {selectedCandidate.documentAnalysis?.[doc.key] && (
                                <button
                                  onClick={() => setActiveAnalysisDoc(activeAnalysisDoc === doc.key ? null : doc.key)}
                                  className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
                                    activeAnalysisDoc === doc.key ? 'bg-indigo-950 border-indigo-800 text-indigo-400' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400'
                                  }`}
                                  title="Ver Análisis de IA"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                </button>
                              )}

                              <button
                                onClick={() => handleDocStatusChange(doc.key as any, 'aprobado')}
                                className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
                                  status === 'aprobado' ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-emerald-400'
                                }`}
                                title="Aprobar"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDocStatusChange(doc.key as any, 'rechazado')}
                                className={`p-1.5 rounded-lg border transition-colors flex items-center justify-center ${
                                  status === 'rechazado' ? 'bg-rose-950/80 border-rose-800/60 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-rose-400'
                                }`}
                                title="Rechazar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Loading Status Bar */}
                          {isCurrentlyAnalyzing && (
                            <div className="px-3 pb-3">
                              <div className="flex items-center justify-between text-[10px] text-indigo-400 font-semibold animate-pulse mb-1">
                                <span>Procesando archivo con Gemini IA...</span>
                                <span>Analizando formato...</span>
                              </div>
                              <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full animate-pulse w-3/4"></div>
                              </div>
                            </div>
                          )}

                          {/* Collapsible AI Analysis Report */}
                          <AnimatePresence>
                            {activeAnalysisDoc === doc.key && selectedCandidate.documentAnalysis?.[doc.key] && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-slate-900 bg-slate-950/50 p-3 text-xs space-y-2.5 overflow-hidden"
                              >
                                <div className="flex items-center justify-between pb-1 border-b border-slate-900">
                                  <span className="font-bold text-indigo-400 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 flex-shrink-0" /> Reporte de Análisis IA
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    Confianza: {selectedCandidate.documentAnalysis[doc.key].matchPercentage}%
                                  </span>
                                </div>

                                <p className="text-slate-300 leading-normal italic text-[11px] bg-slate-900/40 p-2 rounded-lg border border-slate-900/40">
                                  "{selectedCandidate.documentAnalysis[doc.key].summary}"
                                </p>

                                <div className="space-y-1.5 bg-slate-900/50 p-2.5 rounded-lg border border-slate-900">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Datos Extraídos:</span>
                                  {selectedCandidate.documentAnalysis[doc.key].detectedName && (
                                    <div className="flex justify-between py-0.5 border-b border-slate-900/50 pb-1">
                                      <span className="text-slate-400">Nombre en Doc:</span>
                                      <span className={`font-semibold ${selectedCandidate.documentAnalysis[doc.key].candidateNameMatches ? 'text-white' : 'text-rose-400'}`}>
                                        {selectedCandidate.documentAnalysis[doc.key].detectedName}
                                      </span>
                                    </div>
                                  )}

                                  {/* Render key-values of extractedInfo dynamically */}
                                  {Object.entries(selectedCandidate.documentAnalysis[doc.key].extractedInfo || {}).map(([infoKey, infoVal]) => {
                                    if (!infoVal) return null;
                                    const labels: { [k: string]: string } = {
                                      phone: 'Celular',
                                      email: 'Correo',
                                      address: 'Dirección',
                                      experienceYears: 'Experiencia',
                                      curp: 'CURP',
                                      ineClave: 'Clave Elector',
                                      documentDate: 'Vencimiento/Fecha'
                                    };
                                    const displayVal = Array.isArray(infoVal) ? infoVal.join(', ') : String(infoVal);
                                    return (
                                      <div key={infoKey} className="flex justify-between py-0.5 text-[11px]">
                                        <span className="text-slate-400">{labels[infoKey] || infoKey}:</span>
                                        <span className="text-white font-medium truncate max-w-[170px]" title={displayVal}>
                                          {displayVal}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Issues and validation errors if any */}
                                {selectedCandidate.documentAnalysis[doc.key].issues && selectedCandidate.documentAnalysis[doc.key].issues.length > 0 && (
                                  <div className="bg-rose-950/20 border border-rose-900/40 p-2 rounded-lg text-rose-300 space-y-1">
                                    <div className="flex items-center gap-1 font-bold text-[10px] uppercase text-rose-400">
                                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> Alertas Detectadas:
                                    </div>
                                    <ul className="list-disc pl-3.5 space-y-0.5 text-[11px]">
                                      {selectedCandidate.documentAnalysis[doc.key].issues.map((issue: string, idx: number) => (
                                        <li key={idx}>{issue}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <p className="text-[11px] text-slate-400 bg-slate-900/40 p-2.5 rounded-lg leading-normal">
                                  <span className="font-semibold text-slate-300 block mb-0.5">Dictamen de Reclutador IA:</span>
                                  {selectedCandidate.documentAnalysis[doc.key].notes}
                                </p>

                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-900/60 text-[10px] text-slate-500">
                                  <span className="truncate">
                                    Archivo: {selectedCandidate.documentAnalysis[doc.key].fileName}
                                  </span>
                                  <span>
                                    {new Date(selectedCandidate.documentAnalysis[doc.key].analyzedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Psychometric Profiler */}
                <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-400" />
                      <h4 className="text-sm font-bold text-white font-display">Análisis Psicocognitivo (Psicólogo IA)</h4>
                    </div>
                    <button
                      onClick={handleRunPsychologicalAnalysis}
                      disabled={isAnalyzing}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isAnalyzing
                          ? 'bg-purple-950/20 border-purple-900/40 text-purple-400 animate-pulse cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-600/10'
                      }`}
                    >
                      {isAnalyzing ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></span>
                          Analizando...
                        </>
                      ) : (
                        <>
                          <Brain className="w-3.5 h-3.5" />
                          Generar con IA
                        </>
                      )}
                    </button>
                  </div>

                  {selectedCandidate.psychoAnalysis ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-xs text-slate-400 uppercase">Perfil de Personalidad Sugerido</span>
                          <span className="text-sm font-bold text-white block">{selectedCandidate.psychoAnalysis.personality}</span>
                        </div>

                        <div className="bg-purple-950/40 text-purple-300 border border-purple-900/40 px-3 py-1.5 rounded-xl text-center">
                          <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider block">Compatibilidad</span>
                          <span className="text-xl font-bold font-display">{selectedCandidate.psychoAnalysis.compatibility}%</span>
                        </div>
                      </div>

                      {/* Radar bars */}
                      <div className="space-y-2.5">
                        {selectedCandidate.psychoAnalysis.traits.map(trait => (
                          <div key={trait.label} className="space-y-1">
                            <div className="flex justify-between text-xs text-slate-300">
                              <span>{trait.label}</span>
                              <span className="font-semibold">{trait.value}%</span>
                            </div>
                            <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                              <div 
                                className="h-full bg-purple-600 rounded-full"
                                style={{ width: `${trait.value}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-900/60 italic leading-relaxed">
                        "{selectedCandidate.psychoAnalysis.notes}"
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl space-y-3">
                      <p className="text-xs text-slate-500">Se requiere mantener una conversación por WhatsApp para calcular el perfil psicométrico de forma autónoma.</p>
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => {
                            onSelectCandidateChat(selectedCandidate.id);
                            setSelectedCandidate(null);
                          }}
                          className="text-xs font-semibold text-purple-400 hover:text-purple-300 underline"
                        >
                          Chatear con Candidato
                        </button>
                        <span className="text-slate-700 text-xs">•</span>
                        <button
                          onClick={handleRunPsychologicalAnalysis}
                          className="text-xs font-semibold text-white hover:text-indigo-400 cursor-pointer"
                        >
                          Forzar Análisis Vacío
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Technical Evaluation Score */}
                <div className="p-4 bg-slate-900/30 rounded-2xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white font-display">Evaluación Técnica (Evaluador IA)</h4>
                  </div>

                  {selectedCandidate.evaluation ? (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-900">
                          <span className="text-slate-500 text-[10px] uppercase block mb-0.5">Score de Habilidades</span>
                          <span className="text-base font-bold text-emerald-400 font-mono">{selectedCandidate.evaluation.technicalScore}/100</span>
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-900">
                          <span className="text-slate-500 text-[10px] uppercase block mb-0.5">Score Comportamental</span>
                          <span className="text-base font-bold text-emerald-400 font-mono">{selectedCandidate.evaluation.behavioralScore}/100</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Dictamen General:</span>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-white">{selectedCandidate.evaluation.grade}</span>
                          <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-emerald-900/40">APROBADO</span>
                        </div>
                        <p className="text-slate-400 text-xs mt-2 italic leading-relaxed pt-2 border-t border-slate-900">
                          "{selectedCandidate.evaluation.feedback}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                      No se han completado las preguntas de filtrado técnico para esta vacante.
                    </div>
                  )}
                </div>

                {/* Candidate Observations Log */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Observaciones del Reclutador</h4>
                  <textarea
                    rows={3}
                    placeholder="Escribe observaciones o comentarios clave sobre el candidato..."
                    defaultValue={selectedCandidate.observations || ''}
                    onBlur={(e) => handleSaveObservations(e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none leading-relaxed"
                  ></textarea>
                </div>

                {/* Agenda de Entrevistas Directa */}
                <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-pink-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">Agenda de Entrevista</h4>
                  </div>

                  {selectedCandidate.interviewDate ? (
                    <div className="bg-pink-950/20 border border-pink-900/30 p-3.5 rounded-xl space-y-2.5">
                      <div className="text-xs font-medium text-slate-300">
                        Tiene una entrevista agendada para:
                        <span className="block text-white font-bold text-sm mt-1">
                          {formatSlotSpanishLocal(selectedCandidate.interviewDate)}
                        </span>
                      </div>
                      <button
                        onClick={handleCancelSlot}
                        className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/30 border border-rose-900/50 text-rose-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Cancelar / Re-programar Cita
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        No hay cita agendada para este candidato. Selecciona un horario estipulado disponible para agendar la entrevista:
                      </p>

                      {interviewSchedule.customSlots.filter(s => s.available).length === 0 ? (
                        <div className="text-center py-4 border border-dashed border-slate-800 rounded-xl text-[11px] text-slate-500">
                          No hay horarios disponibles configurados en Automatizaciones.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <select
                            id="slot-booking-select"
                            className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-pink-600 cursor-pointer"
                            onChange={(e) => {
                              const slotId = e.target.value;
                              if (slotId) {
                                handleBookSlot(slotId);
                              }
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>Selecciona un horario disponible...</option>
                            {interviewSchedule.customSlots.filter(s => s.available).map(slot => (
                              <option key={slot.id} value={slot.id}>
                                {new Date(slot.dateTime).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} - {new Date(slot.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Candidate Form Modal */}
      <AnimatePresence>
        {isAddingCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingCandidate(false)}
              className="absolute inset-0 bg-black"
            ></motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-900 flex items-center justify-between bg-slate-900/20">
                <h3 className="text-base font-bold text-white font-display">Registrar Nuevo Expediente</h3>
                <button 
                  onClick={() => setIsAddingCandidate(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCandidateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase block">Nombre Completo *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={newCand.name}
                    onChange={e => setNewCand({ ...newCand, name: e.target.value })}
                    className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold uppercase block">Teléfono / WhatsApp *</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. +52 55 1234 5678"
                      value={newCand.phone}
                      onChange={e => setNewCand({ ...newCand, phone: e.target.value })}
                      className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold uppercase block">Edad (Años)</label>
                    <input
                      type="number"
                      placeholder="Ej. 26"
                      value={newCand.age}
                      onChange={e => setNewCand({ ...newCand, age: e.target.value })}
                      className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase block">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="Ej. juan.perez@test.com"
                    value={newCand.email}
                    onChange={e => setNewCand({ ...newCand, email: e.target.value })}
                    className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold uppercase block">Vacante Solicitada</label>
                    <select
                      value={newCand.vacancyId}
                      onChange={e => setNewCand({ ...newCand, vacancyId: e.target.value })}
                      className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none cursor-pointer"
                    >
                      {vacancies.map(v => (
                        <option key={v.id} value={v.id}>{v.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold uppercase block">Canal / Fuente</label>
                    <select
                      value={newCand.source}
                      onChange={e => setNewCand({ ...newCand, source: e.target.value })}
                      className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none cursor-pointer"
                    >
                      <option value="Indeed">Indeed</option>
                      <option value="Facebook Ads">Facebook Ads</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="WhatsApp Real">WhatsApp Real</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase block">Experiencia Declarada</label>
                  <textarea
                    rows={2}
                    placeholder="Resumen corto de puestos anteriores..."
                    value={newCand.experience}
                    onChange={e => setNewCand({ ...newCand, experience: e.target.value })}
                    className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none"
                  ></textarea>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase block">Observaciones Iniciales</label>
                  <textarea
                    rows={2}
                    placeholder="Cualquier nota inicial o detalle del reclutador..."
                    value={newCand.observations}
                    onChange={e => setNewCand({ ...newCand, observations: e.target.value })}
                    className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none"
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingCandidate(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl border border-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
                  >
                    Guardar Expediente
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Bar for Bulk Messaging */}
      <AnimatePresence>
        {selectedCandidateIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-45 bg-slate-900 border border-indigo-500/40 px-6 py-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-4 min-w-[320px] max-w-lg md:max-w-xl w-[90%]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold font-mono">
                {selectedCandidateIds.length}
              </div>
              <div>
                <p className="text-xs font-bold text-white">Candidatos seleccionados</p>
                <p className="text-[10px] text-slate-400">Listos para contacto masivo personalizado</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
              <button
                onClick={() => {
                  setBulkTemplateText(TEMPLATES[0].text);
                  setBulkChannel('whatsapp');
                  setBulkRecruiter('Sofía Ruiz');
                  setBulkMessageProgress('idle');
                  setIsBulkMessagingOpen(true);
                }}
                className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Enviar Mensaje
              </button>
              <button
                onClick={() => setSelectedCandidateIds([])}
                className="flex-1 sm:flex-none bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Message Modal */}
      <AnimatePresence>
        {isBulkMessagingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isSendingBulk) setIsBulkMessagingOpen(false);
              }}
              className="absolute inset-0 bg-black"
            ></motion.div>

            {/* Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-slate-950 text-white border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-900 bg-slate-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-900/40 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-display">Mensajería Masiva Personalizada</h3>
                    <p className="text-[11px] text-slate-400">Envía plantillas dinámicas a {selectedCandidateIds.length} candidatos elegidos</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBulkMessagingOpen(false)}
                  disabled={isSendingBulk}
                  className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {bulkMessageProgress === 'success' ? (
                /* Success View */
                <div className="p-8 text-center space-y-4 flex-1 overflow-y-auto">
                  <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-white font-display">¡Envío Masivo Completado!</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Se han personalizado y enviado correctamente los mensajes a los candidatos seleccionados.
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-900/20 text-xs text-emerald-400 font-medium inline-block mx-auto">
                    {bulkChannel === 'whatsapp' ? '✓ Enviados vía WhatsApp' : '✓ Enviados vía Correo Electrónico (Gmail)'}
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setIsBulkMessagingOpen(false);
                        setBulkMessageProgress('idle');
                      }}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              ) : (
                /* Main Configuration View */
                <div className="p-5 space-y-4 flex-1 overflow-y-auto font-sans">
                  {/* Channel Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Canal de Envío</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBulkChannel('whatsapp')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          bulkChannel === 'whatsapp'
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-sm'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Business
                      </button>
                      <button
                        type="button"
                        onClick={() => setBulkChannel('email')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          bulkChannel === 'email'
                            ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-400 shadow-sm'
                            : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Mail className="w-3.5 h-3.5" /> Correo Electrónico
                      </button>
                    </div>
                  </div>

                  {/* Template Presets */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Seleccionar Plantilla Predefinida</label>
                    <div className="flex flex-col gap-1.5">
                      {TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setBulkTemplateText(t.text)}
                          className="w-full text-left p-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all text-xs font-medium text-slate-300 flex items-center justify-between group cursor-pointer"
                        >
                          <span>{t.name}</span>
                          <span className="text-[10px] text-indigo-400 group-hover:translate-x-0.5 transition-transform font-bold uppercase tracking-wider">Cargar plantilla &rarr;</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recruiter Name signing */}
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold uppercase block text-[10px]">Reclutador Firmante</label>
                    <input
                      type="text"
                      placeholder="Ej. Sofía Ruiz"
                      value={bulkRecruiter}
                      onChange={e => setBulkRecruiter(e.target.value)}
                      className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>

                  {/* Message editor */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cuerpo del Mensaje</label>
                      <span className="text-[10px] text-slate-500 font-mono">Apoya: &#123;nombre&#125;, &#123;vacante&#125;, &#123;reclutador&#125;</span>
                    </div>
                    <textarea
                      rows={4}
                      value={bulkTemplateText}
                      onChange={e => setBulkTemplateText(e.target.value)}
                      className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none font-sans leading-relaxed"
                      placeholder="Escribe el mensaje aquí..."
                    ></textarea>
                  </div>

                  {/* Preview container */}
                  {selectedCandidateIds.length > 0 && (
                    <div className="bg-slate-900/50 rounded-xl border border-slate-800/80 p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Vista Previa Personalizada</span>
                        <span className="text-[10px] text-slate-500 font-medium">Ejemplo: {candidates.find(c => c.id === selectedCandidateIds[0])?.name || 'Cargando...'}</span>
                      </div>
                      <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-900 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                        {bulkChannel === 'email' && (
                          <div className="border-b border-slate-900 pb-1.5 mb-1.5 text-[10px] text-slate-500 font-mono">
                            <span className="font-semibold text-slate-400">Asunto:</span> Actualización de Postulación - {
                              (() => {
                                const cand = candidates.find(c => c.id === selectedCandidateIds[0]);
                                const vac = cand ? vacancies.find(v => v.id === cand.vacancyId) : null;
                                return vac ? vac.title : 'Vacante General';
                              })()
                            }
                          </div>
                        )}
                        {
                          (() => {
                            const cand = candidates.find(c => c.id === selectedCandidateIds[0]);
                            const vac = cand ? vacancies.find(v => v.id === cand.vacancyId) : null;
                            const vacancyTitle = vac ? vac.title : 'Vacante General';
                            return bulkTemplateText
                              .replace(/{nombre}/g, cand ? cand.name : 'Juan Pérez')
                              .replace(/{vacante}/g, vacancyTitle)
                              .replace(/{reclutador}/g, bulkRecruiter || 'Sofía Ruiz');
                          })()
                        }
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-900 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsBulkMessagingOpen(false)}
                      disabled={isSendingBulk}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl border border-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSendBulkMessages}
                      disabled={isSendingBulk || !bulkTemplateText.trim()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSendingBulk ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Enviar a {selectedCandidateIds.length} Candidatos</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
