import React, { useState } from 'react';
import { WorkspaceSettings, AutomationSettings, InterviewSchedule, InterviewSlot } from '../types';
import { 
  Check, CheckCircle2, AlertCircle, RefreshCw, Smartphone, 
  Database, Shield, ToggleLeft, ToggleRight, Settings, ExternalLink,
  Calendar, FileSpreadsheet, HardDrive, Mail, Map, Sparkles,
  PlusCircle, Trash2
} from 'lucide-react';
import { motion } from 'motion/react';

interface AutomationCenterProps {
  workspace: WorkspaceSettings;
  automation: AutomationSettings;
  interviewSchedule: InterviewSchedule;
  onUpdateWorkspace: (settings: WorkspaceSettings) => void;
  onUpdateAutomation: (settings: AutomationSettings) => void;
  onUpdateInterviewSchedule: (schedule: InterviewSchedule) => void;
  onTriggerOAuth: () => void;
  onClearSimulation?: () => void;
}

export default function AutomationCenter({ 
  workspace, 
  automation, 
  interviewSchedule,
  onUpdateWorkspace, 
  onUpdateAutomation,
  onUpdateInterviewSchedule,
  onTriggerOAuth,
  onClearSimulation
}: AutomationCenterProps) {
  
  const handleToggleAutomation = (key: keyof AutomationSettings) => {
    onUpdateAutomation({
      ...automation,
      [key]: !automation[key]
    });
  };

  const handleUpdateConfig = (key: keyof WorkspaceSettings, value: string) => {
    onUpdateWorkspace({
      ...workspace,
      [key]: value
    });
  };

  const [newSlotDateTime, setNewSlotDateTime] = useState<string>('');

  const handleToggleDay = (day: string) => {
    const isAllowed = interviewSchedule.allowedDays.includes(day);
    const updatedDays = isAllowed
      ? interviewSchedule.allowedDays.filter(d => d !== day)
      : [...interviewSchedule.allowedDays, day];
    
    onUpdateInterviewSchedule({
      ...interviewSchedule,
      allowedDays: updatedDays
    });
  };

  const handleChangeTime = (field: 'startTime' | 'endTime', value: string) => {
    onUpdateInterviewSchedule({
      ...interviewSchedule,
      [field]: value
    });
  };

  const handleChangeDuration = (value: number) => {
    onUpdateInterviewSchedule({
      ...interviewSchedule,
      slotDuration: value
    });
  };

  const handleAddCustomSlot = () => {
    if (!newSlotDateTime) {
      alert("Por favor selecciona una fecha y hora válida.");
      return;
    }

    const newSlot = {
      id: "slot-" + Date.now(),
      dateTime: newSlotDateTime,
      available: true
    };

    onUpdateInterviewSchedule({
      ...interviewSchedule,
      customSlots: [...interviewSchedule.customSlots, newSlot]
    });
    setNewSlotDateTime('');
  };

  const handleRemoveSlot = (slotId: string) => {
    onUpdateInterviewSchedule({
      ...interviewSchedule,
      customSlots: interviewSchedule.customSlots.filter(s => s.id !== slotId)
    });
  };

  const formatSlotSpanishLocal = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const dayName = days[date.getDay()];
      const dayNum = date.getDate();
      const monthName = months[date.getMonth()];
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${dayName}, ${dayNum} de ${monthName} - ${hours}:${minutes} hs`;
    } catch (e) {
      return isoStr;
    }
  };

  const syncGoogleSheetsSimulated = () => {
    alert("Iniciando sincronización con Google Sheets... ¡Se han sincronizado 4 candidatos nuevos!");
  };

  const syncGoogleCalendarSimulated = () => {
    alert("Sincronizando Google Calendar... Se detectaron 2 entrevistas agendadas por la IA.");
  };

  return (
    <div className="space-y-6" id="automation-center-view">
      
      {/* Top Welcome Banner */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white font-display">Centro de Automatizaciones & Workspace</h3>
          <p className="text-xs text-slate-400">Controla la sincronización con Google Workspace, configuraciones de webhook y reglas de negocio.</p>
        </div>

        <button
          onClick={onTriggerOAuth}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" /> Vincular Google Workspace OAuth
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Google Workspace API integrations status */}
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5 lg:col-span-2 space-y-5">
          <h4 className="text-sm font-bold text-white font-display flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" /> Integraciones Google Cloud
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { 
                name: 'Google Sheets CRM', 
                desc: 'Sincronización bidireccional de expedientes', 
                icon: FileSpreadsheet, 
                connected: workspace.sheetsConnected, 
                sync: syncGoogleSheetsSimulated,
                sheetId: (workspace as any).spreadsheetId,
                configKey: 'spreadsheetId',
                placeholder: 'ID de la hoja de cálculo de Google Sheets'
              },
              { 
                name: 'Google Calendar API', 
                desc: 'Agenda automática de entrevistas para reclutadores', 
                icon: Calendar, 
                connected: workspace.calendarConnected, 
                sync: syncGoogleCalendarSimulated,
                sheetId: (workspace as any).calendarId,
                configKey: 'calendarId',
                placeholder: 'ID del calendario o "primary"'
              },
              { 
                name: 'Google Drive Drive', 
                desc: 'Guardado autónomo de documentos de candidatos', 
                icon: HardDrive, 
                connected: workspace.driveConnected, 
                sync: () => alert("Sincronizando carpetas de Google Drive..."),
                sheetId: (workspace as any).driveFolderId,
                configKey: 'driveFolderId',
                placeholder: 'ID de la carpeta raíz de Google Drive'
              },
              { 
                name: 'Gmail Send Automation', 
                desc: 'Envíos de notificaciones, bienvenidas y rechazos', 
                icon: Mail, 
                connected: workspace.gmailConnected, 
                sync: () => alert("Sincronizando plantillas de correo..."),
                sheetId: (workspace as any).gmailTemplateId,
                configKey: 'gmailTemplateId',
                placeholder: 'ID de plantilla de correo Gmail'
              }
            ].map(int => (
              <div key={int.name} className="p-4 bg-slate-950 rounded-2xl border border-slate-900 flex flex-col justify-between space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 text-indigo-400">
                      <int.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{int.name}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5 leading-relaxed">{int.desc}</span>
                    </div>
                  </div>

                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wide border shrink-0 ${
                    int.connected ? 'bg-emerald-950/40 border-emerald-900/40 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    {int.connected ? 'Conectado' : 'Pendiente'}
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={int.sheetId || ''}
                    placeholder={int.placeholder}
                    onChange={e => handleUpdateConfig(int.configKey as any, e.target.value)}
                    className="w-full bg-slate-900 text-white text-[11px] p-2.5 rounded-xl border border-slate-850 focus:outline-none"
                  />
                  
                  {int.connected && (
                    <button
                      onClick={int.sync}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 animate-spin" /> Sincronizar ahora
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Location Grounding & Maps config */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-900 space-y-3">
            <h5 className="text-xs font-bold text-white font-display flex items-center gap-1.5">
              <Map className="w-4 h-4 text-indigo-400" /> Grounding de Ubicación (Google Maps Platform)
            </h5>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Permite que la Inteligencia Artificial valide si la dirección declarada por el candidato está en cobertura para las rutas de transporte empresarial de Heavenly Dreams de manera autónoma.
            </p>

            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Polanco, Miguel Hidalgo, Ciudad de México, CDMX"
                defaultValue="Corporativo Heavenly Dreams - CDMX"
                className="flex-1 bg-slate-900 text-white text-xs p-3 rounded-xl border border-slate-850 focus:outline-none"
              />
              <button 
                onClick={() => alert("Ubicación de corporativo de Heavenly Dreams configurada correctamente. La IA validará la cobertura en base a un radio de 15 km.")}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Actualizar Georreferencia
              </button>
            </div>
          </div>
        </div>

        {/* Automation Business Rules */}
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5 space-y-4">
          <h4 className="text-sm font-bold text-white font-display flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-400" /> Reglas de Negocio
          </h4>

          <div className="space-y-4">
            {[
              { 
                key: 'autoWelcome', 
                title: 'Bienvenida automática por WhatsApp', 
                desc: 'Saluda al candidato de manera instantánea cuando ingresa de Indeed o Facebook Ads.' 
              },
              { 
                key: 'autoScreening', 
                title: 'Filtrado Técnico Autónomo (Evaluador)', 
                desc: 'Sofía e Iván de manera automática iniciarán preguntas técnicas de filtrado.' 
              },
              { 
                key: 'autoSchedule', 
                title: 'Agendamiento Autónomo (Scheduler)', 
                desc: 'Permite que la IA agende de forma directa entrevistas en los horarios disponibles del reclutador.' 
              },
              { 
                key: 'rejectEmail', 
                title: 'Envío de correos de agradecimiento', 
                desc: 'Envía un correo amable y formal a candidatos rechazados al moverlos en el CRM.' 
              },
              { 
                key: 'whatsappReminders', 
                title: 'Recordatorio WhatsApp previo cita', 
                desc: 'Envía recordatorios de manera autónoma 2 horas antes de la entrevista.' 
              },
              { 
                key: 'psychometricRequired', 
                title: 'Validación Psicométrica Requerida', 
                desc: 'Calcula el perfil de personalidad antes de precalificar al candidato.' 
              }
            ].map(rule => {
              const active = automation[rule.key as keyof AutomationSettings];
              return (
                <div key={rule.key} className="flex items-start justify-between gap-4 p-2 bg-slate-950/30 rounded-xl hover:bg-slate-950/70 transition-all border border-transparent hover:border-slate-850">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 block leading-tight">{rule.title}</span>
                    <span className="text-[10px] text-slate-500 block leading-relaxed">{rule.desc}</span>
                  </div>

                  <button
                    onClick={() => handleToggleAutomation(rule.key as any)}
                    className="p-1 text-indigo-400 hover:text-indigo-300 transition-transform cursor-pointer"
                  >
                    {active ? (
                      <ToggleRight className="w-9 h-9 text-indigo-500" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-slate-600" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* SECCIÓN DE AGENDA DE ENTREVISTAS */}
      <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-950/40 text-pink-400 border border-pink-900/40 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Estipular Días y Horarios para Entrevistas</h3>
              <p className="text-xs text-slate-400">Fija los rangos de disponibilidad y crea espacios específicos para que los candidatos agenden con la IA.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Col 1: Configuración de Rangos Semanales */}
          <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
            <span className="text-xs font-bold text-white uppercase font-display tracking-wider block font-semibold">1. Disponibilidad Semanal</span>
            
            <div className="space-y-2.5">
              <label className="text-[10px] text-slate-500 uppercase font-semibold block">Días Permitidos</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'lunes', label: 'Lunes' },
                  { id: 'martes', label: 'Martes' },
                  { id: 'miercoles', label: 'Miércoles' },
                  { id: 'jueves', label: 'Jueves' },
                  { id: 'viernes', label: 'Viernes' },
                  { id: 'sabado', label: 'Sábado' },
                  { id: 'domingo', label: 'Domingo' }
                ].map(day => {
                  const checked = interviewSchedule.allowedDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      onClick={() => handleToggleDay(day.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all flex items-center justify-between cursor-pointer ${
                        checked 
                          ? 'bg-pink-950/30 text-pink-400 border-pink-900/50' 
                          : 'bg-slate-900/40 text-slate-500 border-slate-800/60 hover:text-slate-300'
                      }`}
                    >
                      <span>{day.label}</span>
                      {checked && <Check className="w-3.5 h-3.5 text-pink-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-semibold block">Hora de Inicio</label>
                <input 
                  type="time" 
                  value={interviewSchedule.startTime}
                  onChange={e => handleChangeTime('startTime', e.target.value)}
                  className="w-full bg-slate-905 text-white text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-pink-600"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 uppercase font-semibold block">Hora de Fin</label>
                <input 
                  type="time" 
                  value={interviewSchedule.endTime}
                  onChange={e => handleChangeTime('endTime', e.target.value)}
                  className="w-full bg-slate-905 text-white text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-pink-600"
                />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-[10px] text-slate-500 uppercase font-semibold block">Duración de Entrevista</label>
              <select
                value={interviewSchedule.slotDuration}
                onChange={e => handleChangeDuration(Number(e.target.value))}
                className="w-full bg-slate-900 text-white text-xs p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-pink-600 cursor-pointer"
              >
                <option value={15}>15 Minutos</option>
                <option value={30}>30 Minutos</option>
                <option value={45}>45 Minutos</option>
                <option value={60}>1 Hora</option>
              </select>
            </div>
          </div>

          {/* Col 2 & 3: Lista de Slots Específicos & Creador */}
          <div className="lg:col-span-2 space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-900 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-900 pb-3">
              <span className="text-xs font-bold text-white uppercase font-display tracking-wider block font-semibold">2. Espacios de Entrevista Estipulados (Slots)</span>
              
              {/* Inline slot generator */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="datetime-local"
                  value={newSlotDateTime}
                  onChange={e => setNewSlotDateTime(e.target.value)}
                  className="bg-slate-900 text-white text-xs p-2 rounded-xl border border-slate-800 focus:outline-none focus:border-pink-600 [color-scheme:dark]"
                />
                <button
                  onClick={handleAddCustomSlot}
                  className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Añadir Horario
                </button>
              </div>
            </div>

            {/* Slots Grid/List */}
            <div className="flex-1 overflow-y-auto max-h-[300px] min-h-[220px] space-y-2 pr-1 custom-scrollbar">
              {interviewSchedule.customSlots.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-600">
                  <Calendar className="w-8 h-8 mb-2 text-slate-700" />
                  <p className="text-xs font-semibold">No hay horarios estipulados todavía.</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">Usa el selector de arriba para añadir días y horas específicas para las entrevistas.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {interviewSchedule.customSlots.map(slot => (
                    <div 
                      key={slot.id} 
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        slot.available 
                          ? 'bg-slate-950 border-slate-900 hover:border-slate-800' 
                          : 'bg-purple-950/20 border-purple-900/30'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {formatSlotSpanishLocal(slot.dateTime)}
                          </span>
                        </div>
                        {slot.available ? (
                          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block font-semibold">🟢 Disponible</span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider block font-semibold">🟣 Reservado</span>
                            <span className="text-[10px] text-slate-400 block truncate font-medium mt-0.5">
                              Candidato: <span className="text-slate-200 font-bold">{slot.candidateName}</span>
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleRemoveSlot(slot.id)}
                        className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-950/20 rounded-lg transition-all"
                        title="Eliminar este horario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mantenimiento de Datos / Datos de Simulación */}
        {onClearSimulation && (
          <div className="bg-slate-900/40 rounded-2xl border border-rose-950/40 p-5 mt-6 space-y-4">
            <h4 className="text-sm font-bold text-white font-display flex items-center gap-2 text-rose-400">
              <Database className="w-4 h-4 text-rose-400" /> Mantenimiento & Datos de Simulación
            </h4>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-rose-950/10 p-4 rounded-xl border border-rose-900/20">
              <div className="space-y-1 max-w-2xl">
                <span className="text-xs font-bold text-slate-200 block">Eliminar registros de ejemplo</span>
                <span className="text-[11px] text-slate-400 block leading-relaxed">
                  Esta acción eliminará de forma permanente todos los candidatos de prueba (como Diego, Mariana, Carlos), los historiales de conversación simulados en WhatsApp y los registros de actividad para que puedas comenzar a trabajar con tus candidatos reales desde un sistema limpio.
                </span>
              </div>

              <button
                onClick={() => {
                  if (confirm("¿Estás seguro de que deseas eliminar permanentemente todos los candidatos de simulación y chats? Esta acción no se puede deshacer y limpiará el sistema para uso real.")) {
                    onClearSimulation();
                  }
                }}
                className="px-5 py-2.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-800/40 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap self-start md:self-center shrink-0"
              >
                Eliminar Datos de Simulación
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
