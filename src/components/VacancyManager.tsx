import React, { useState } from 'react';
import { Vacancy } from '../types';
import { 
  Plus, Edit2, Copy, Pause, Play, Archive, Trash2, 
  Search, Briefcase, DollarSign, Clock, MapPin, Users, 
  ListOrdered, CheckCircle2, AlertCircle, X, ChevronRight, Download, Upload 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VacancyManagerProps {
  vacancies: Vacancy[];
  onSaveVacancy: (vacancy: Vacancy) => void;
  onDeleteVacancy: (id: string) => void;
}

export default function VacancyManager({ vacancies, onSaveVacancy, onDeleteVacancy }: VacancyManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedLocFilter, setSelectedLocFilter] = useState('all');

  const getVacancyDept = (v: Partial<Vacancy>) => {
    if (v.department) return v.department;
    const titleLower = (v.title || '').toLowerCase();
    if (titleLower.includes("asesor") || titleLower.includes("venta")) return "Ventas";
    if (titleLower.includes("almacén") || titleLower.includes("supervisor")) return "Logística";
    if (titleLower.includes("telefónico") || titleLower.includes("atc") || titleLower.includes("servicio")) return "Atención al Cliente";
    return "Administración";
  };

  // Form State
  const [formState, setFormState] = useState<Partial<Vacancy>>({
    title: '',
    department: '',
    salary: '',
    hours: '',
    benefits: [''],
    requirements: [''],
    experienceRequired: '',
    location: '',
    openPositions: 1,
    screeningQuestions: [''],
    status: 'active'
  });

  const openEditModal = (vac: Vacancy | null) => {
    if (vac) {
      setFormState({ ...vac, department: vac.department || getVacancyDept(vac) });
    } else {
      setFormState({
        title: '',
        department: '',
        salary: '',
        hours: '',
        benefits: [''],
        requirements: [''],
        experienceRequired: '',
        location: '',
        openPositions: 1,
        screeningQuestions: [''],
        status: 'active'
      });
    }
    setIsEditing(true);
  };

  const handleAddField = (field: 'benefits' | 'requirements' | 'screeningQuestions') => {
    const arr = [...(formState[field] || [])];
    arr.push('');
    setFormState({ ...formState, [field]: arr });
  };

  const handleRemoveField = (field: 'benefits' | 'requirements' | 'screeningQuestions', index: number) => {
    const arr = [...(formState[field] || [])];
    arr.splice(index, 1);
    setFormState({ ...formState, [field]: arr });
  };

  const handleFieldChange = (field: 'benefits' | 'requirements' | 'screeningQuestions', index: number, value: string) => {
    const arr = [...(formState[field] || [])];
    arr[index] = value;
    setFormState({ ...formState, [field]: arr });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title || !formState.salary) return;

    // Filter out empty lines
    const benefits = (formState.benefits || []).filter(b => b.trim() !== '');
    const requirements = (formState.requirements || []).filter(r => r.trim() !== '');
    const screeningQuestions = (formState.screeningQuestions || []).filter(q => q.trim() !== '');

    const finalVacancy: Vacancy = {
      id: formState.id || `vac-${Date.now()}`,
      title: formState.title,
      department: formState.department || getVacancyDept(formState),
      salary: formState.salary,
      hours: formState.hours || 'Tiempo Completo',
      benefits,
      requirements,
      experienceRequired: formState.experienceRequired || 'No indispensable',
      location: formState.location || 'Polanco, CDMX',
      openPositions: Number(formState.openPositions) || 1,
      screeningQuestions,
      status: formState.status || 'active'
    };

    onSaveVacancy(finalVacancy);
    setIsEditing(false);
  };

  const duplicateVacancy = (vac: Vacancy) => {
    const duplicated: Vacancy = {
      ...vac,
      id: `vac-${Date.now()}`,
      title: `${vac.title} (Copia)`,
      status: 'active'
    };
    onSaveVacancy(duplicated);
  };

  const toggleVacancyStatus = (vac: Vacancy) => {
    const newStatus: Vacancy['status'] = vac.status === 'active' ? 'paused' : 'active';
    onSaveVacancy({ ...vac, status: newStatus });
  };

  const archiveVacancy = (vac: Vacancy) => {
    onSaveVacancy({ ...vac, status: 'archived' });
  };

  const exportCsv = () => {
    const headers = ['ID', 'Titulo', 'Sueldo', 'Horario', 'Ubicacion', 'Puestos', 'Estatus'];
    const rows = vacancies.map(v => [v.id, v.title, v.salary, v.hours, v.location, v.openPositions, v.status]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join('\n');
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", "heavenly_dreams_vacantes.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Dynamically extract unique departments and locations
  const allDepts = Array.from(new Set(vacancies.map(v => getVacancyDept(v))));
  const allLocs = Array.from(new Set(vacancies.map(v => v.location).filter(Boolean)));

  const filteredVacancies = vacancies.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          getVacancyDept(v).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDeptFilter === 'all' || getVacancyDept(v) === selectedDeptFilter;
    const matchesLoc = selectedLocFilter === 'all' || v.location === selectedLocFilter;
    return matchesSearch && matchesDept && matchesLoc;
  });

  return (
    <div className="space-y-6" id="vacancies-view">
      
      {/* Top Controls */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-1 flex-col lg:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar vacante por puesto, departamento o ubicación..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none transition-colors"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={selectedDeptFilter}
              onChange={e => setSelectedDeptFilter(e.target.value)}
              className="appearance-none bg-slate-950 text-white text-sm pl-4 pr-10 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none cursor-pointer min-w-[180px]"
            >
              <option value="all">Todos los dptos.</option>
              {allDepts.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <Briefcase className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Location Filter */}
          <div className="relative">
            <select
              value={selectedLocFilter}
              onChange={e => setSelectedLocFilter(e.target.value)}
              className="appearance-none bg-slate-950 text-white text-sm pl-4 pr-10 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none cursor-pointer min-w-[180px]"
            >
              <option value="all">Todas las ubicaciones</option>
              {allLocs.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <MapPin className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
          
          <button
            onClick={() => openEditModal(null)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Crear Vacante
          </button>
        </div>
      </div>

      {/* Vacancy Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVacancies.map(vac => {
          const isClosed = vac.status === 'archived';
          const isPaused = vac.status === 'paused';

          return (
            <div
              key={vac.id}
              className={`p-5 rounded-2xl border bg-slate-900/40 space-y-4 shadow-xl flex flex-col justify-between relative overflow-hidden group ${
                isClosed ? 'border-slate-900 opacity-60' : isPaused ? 'border-amber-900/40' : 'border-slate-800 hover:border-indigo-950/60'
              }`}
            >
              {/* Absolute side glowing border */}
              <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                isClosed ? 'bg-slate-800' : isPaused ? 'bg-amber-500' : 'bg-indigo-500'
              }`}></div>

              <div className="space-y-3.5">
                {/* Title & Badge */}
                <div className="flex justify-between items-start gap-4 pl-1.5">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors font-display line-clamp-1">{vac.title}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-500 font-mono">ID: {vac.id}</span>
                      <span className="h-1 w-1 bg-slate-700 rounded-full"></span>
                      <span className="text-[10px] text-indigo-400 font-medium">{vac.department || getVacancyDept(vac)}</span>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border tracking-wider font-mono shrink-0 ${
                    isClosed ? 'bg-slate-950 border-slate-800 text-slate-500' :
                    isPaused ? 'bg-amber-950/50 border-amber-900/50 text-amber-400' : 'bg-emerald-950/50 border-emerald-900/50 text-emerald-400'
                  }`}>
                    {vac.status === 'active' ? 'Activo' : vac.status === 'paused' ? 'Pausado' : 'Archivado'}
                  </span>
                </div>

                {/* Specs */}
                <div className="space-y-2 text-xs text-slate-300 pl-1.5">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="font-semibold text-slate-200">{vac.salary}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">{vac.hours}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{vac.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{vac.openPositions} plazas disponibles</span>
                  </div>
                </div>

                {/* Quick screening counts */}
                <div className="pt-3 border-t border-slate-900 pl-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block mb-1.5">Filtro Técnico</span>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-900/80 text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="truncate">{vac.screeningQuestions.length} preguntas de filtrado</span>
                    <ListOrdered className="w-4 h-4 text-slate-600 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Card Action Controls */}
              <div className="pt-4 border-t border-slate-950 flex items-center justify-between gap-1 pl-1.5 shrink-0">
                <button
                  onClick={() => openEditModal(vac)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Editar Vacante"
                >
                  <Edit2 className="w-3 h-3" /> Editar
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleVacancyStatus(vac)}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-colors cursor-pointer"
                    title={vac.status === 'active' ? 'Pausar Vacante' : 'Activar Vacante'}
                  >
                    {vac.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => duplicateVacancy(vac)}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-colors cursor-pointer"
                    title="Duplicar Vacante"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {vac.status !== 'archived' && (
                    <button
                      onClick={() => archiveVacancy(vac)}
                      className="p-1.5 bg-slate-950 hover:bg-rose-950/30 hover:text-rose-400 text-slate-400 rounded-lg border border-slate-800 transition-colors cursor-pointer"
                      title="Archivar"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {isClosed && (
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar definitivamente esta vacante?')) {
                          onDeleteVacancy(vac.id);
                        }
                      }}
                      className="p-1.5 bg-slate-950 hover:bg-rose-950/30 hover:text-rose-400 text-slate-500 hover:border-slate-800 rounded-lg border border-slate-900 transition-colors cursor-pointer"
                      title="Eliminar de verdad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Editing / Creating Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-black"
            ></motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-900 flex items-center justify-between bg-slate-900/20">
                <h3 className="text-base font-bold text-white font-display">
                  {formState.id ? 'Editar Vacante' : 'Crear Nueva Vacante'}
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                
                {/* Title & Department */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold uppercase block">Título de la Vacante *</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. Asesor de Descanso Premium"
                      value={formState.title || ''}
                      onChange={e => setFormState({ ...formState, title: e.target.value })}
                      className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold uppercase block">Departamento *</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. Ventas, Logística, Atención al Cliente"
                      value={formState.department || ''}
                      onChange={e => setFormState({ ...formState, department: e.target.value })}
                      className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Salary & Location */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold uppercase block">Sueldo / Ofrecimiento *</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. $15,000 MXN + comisiones"
                      value={formState.salary || ''}
                      onChange={e => setFormState({ ...formState, salary: e.target.value })}
                      className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold uppercase block">Ubicación</label>
                    <input
                      type="text"
                      placeholder="Ej. Polanco, CDMX"
                      value={formState.location || ''}
                      onChange={e => setFormState({ ...formState, location: e.target.value })}
                      className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Hours & Positions */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold uppercase block">Horario laboral</label>
                    <input
                      type="text"
                      placeholder="Ej. Lunes a Domingo, 11 AM a 8 PM"
                      value={formState.hours || ''}
                      onChange={e => setFormState({ ...formState, hours: e.target.value })}
                      className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400 font-semibold uppercase block">Plazas Disponibles</label>
                    <input
                      type="number"
                      value={formState.openPositions || 1}
                      onChange={e => setFormState({ ...formState, openPositions: parseInt(e.target.value) })}
                      className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Requirements (Dynamic List) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-400 font-semibold uppercase">Requisitos de la Vacante</label>
                    <button
                      type="button"
                      onClick={() => handleAddField('requirements')}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(formState.requirements || []).map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={req}
                          placeholder={`Requisito ${idx + 1}`}
                          onChange={e => handleFieldChange('requirements', idx, e.target.value)}
                          className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveField('requirements', idx)}
                          className="p-2 hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Benefits (Dynamic List) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-400 font-semibold uppercase">Prestaciones & Beneficios</label>
                    <button
                      type="button"
                      onClick={() => handleAddField('benefits')}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(formState.benefits || []).map((ben, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={ben}
                          placeholder={`Prestación ${idx + 1}`}
                          onChange={e => handleFieldChange('benefits', idx, e.target.value)}
                          className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveField('benefits', idx)}
                          className="p-2 hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Screening Questions (Dynamic List) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-400 font-semibold uppercase">Preguntas Filtro de Reclutador IA</label>
                    <button
                      type="button"
                      onClick={() => handleAddField('screeningQuestions')}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(formState.screeningQuestions || []).map((q, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={q}
                          placeholder={`Pregunta Filtro ${idx + 1}`}
                          onChange={e => handleFieldChange('screeningQuestions', idx, e.target.value)}
                          className="w-full bg-slate-950 text-white text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveField('screeningQuestions', idx)}
                          className="p-2 hover:bg-rose-950/30 text-slate-500 hover:text-rose-400 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-900 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl border border-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
                  >
                    {formState.id ? 'Guardar Cambios' : 'Lanzar Vacante'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
