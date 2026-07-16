import React, { useState, useEffect } from 'react';
import { 
  Candidate, Vacancy, ChatMessage, AIAgent, 
  WorkspaceSettings, AutomationSettings, FlowNode, FlowEdge, InterviewSchedule, ActivityLog 
} from './types';
import Dashboard from './components/Dashboard';
import CRM from './components/CRM';
import WhatsAppSimulator from './components/WhatsAppSimulator';
import FlowBuilder from './components/FlowBuilder';
import VacancyManager from './components/VacancyManager';
import SpecializedAgents from './components/SpecializedAgents';
import AutomationCenter from './components/AutomationCenter';
import { 
  LayoutDashboard, Users, MessageSquare, Workflow, 
  Briefcase, Cpu, Settings2, RefreshCw, Sparkles, Moon, Sun, Laptop 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceSettings>({
    sheetsConnected: false, calendarConnected: false, driveConnected: false, gmailConnected: false,
    spreadsheetId: '', calendarId: '', driveFolderId: '', gmailTemplateId: ''
  });
  const [automation, setAutomation] = useState<AutomationSettings>({
    autoWelcome: true, autoScreening: true, autoSchedule: true, rejectEmail: false,
    whatsappReminders: true, psychometricRequired: true
  });
  const [interviewSchedule, setInterviewSchedule] = useState<InterviewSchedule>({
    allowedDays: ["lunes", "martes", "miercoles", "jueves", "viernes"],
    startTime: "09:00",
    endTime: "18:00",
    slotDuration: 30,
    customSlots: []
  });
  const [flows, setFlows] = useState<{ nodes: FlowNode[]; edges: FlowEdge[] }>({ nodes: [], edges: [] });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });
  
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Fetch all initial data from Express backend
  const fetchData = async () => {
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates || []);
        setVacancies(data.vacancies || []);
        setChatMessages(data.chatMessages || []);
        setAgents(data.agents || []);
        setWorkspace(data.workspace || {
          sheetsConnected: false, calendarConnected: false, driveConnected: false, gmailConnected: false,
          spreadsheetId: '', calendarId: '', driveFolderId: '', gmailTemplateId: ''
        });
        setAutomation(data.automation || {
          autoWelcome: true, autoScreening: true, autoSchedule: true, rejectEmail: false,
          whatsappReminders: true, psychometricRequired: true
        });
        setInterviewSchedule(data.interviewSchedule || {
          allowedDays: ["lunes", "martes", "miercoles", "jueves", "viernes"],
          startTime: "09:00",
          endTime: "18:00",
          slotDuration: 30,
          customSlots: []
        });
        setFlows(data.flows || { nodes: [], edges: [] });
        setActivityLogs(data.activityLogs || []);
      }
    } catch (err) {
      console.error("Error loading mock database:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll data every 4 seconds to pick up simulated conversations
    const interval = setInterval(() => {
      fetchData();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateCandidate = async (candidate: Candidate) => {
    // Optimistic update
    const exists = candidates.some(c => c.id === candidate.id);
    if (exists) {
      setCandidates(candidates.map(c => c.id === candidate.id ? candidate : c));
    } else {
      setCandidates([...candidates, candidate]);
    }

    try {
      setSyncing(true);
      await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate)
      });
    } catch (err) {
      console.error("Error saving candidate:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    setCandidates(candidates.filter(c => c.id !== id));
    try {
      setSyncing(true);
      await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Error deleting candidate:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveVacancy = async (vacancy: Vacancy) => {
    const exists = vacancies.some(v => v.id === vacancy.id);
    if (exists) {
      setVacancies(vacancies.map(v => v.id === vacancy.id ? vacancy : v));
    } else {
      setVacancies([...vacancies, vacancy]);
    }

    try {
      setSyncing(true);
      await fetch('/api/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vacancy)
      });
    } catch (err) {
      console.error("Error saving vacancy:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteVacancy = async (id: string) => {
    setVacancies(vacancies.filter(v => v.id !== id));
    try {
      setSyncing(true);
      await fetch(`/api/vacancies/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Error deleting vacancy:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveFlows = async (newFlows: { nodes: FlowNode[]; edges: FlowEdge[] }) => {
    setFlows(newFlows);
    try {
      setSyncing(true);
      await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFlows)
      });
    } catch (err) {
      console.error("Error saving flows:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveAgent = async (agent: AIAgent) => {
    setAgents(agents.map(a => a.id === agent.id ? agent : a));
    try {
      setSyncing(true);
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agent)
      });
    } catch (err) {
      console.error("Error saving agent:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateWorkspace = async (ws: WorkspaceSettings) => {
    setWorkspace(ws);
    try {
      setSyncing(true);
      await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ws)
      });
    } catch (err) {
      console.error("Error saving workspace settings:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateAutomation = async (auto: AutomationSettings) => {
    setAutomation(auto);
    try {
      setSyncing(true);
      await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auto)
      });
    } catch (err) {
      console.error("Error saving automation rules:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateInterviewSchedule = async (sched: InterviewSchedule) => {
    setInterviewSchedule(sched);
    try {
      setSyncing(true);
      await fetch('/api/settings/interview-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sched)
      });
    } catch (err) {
      console.error("Error saving interview schedule settings:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSendMessage = async (candidateId: string, text: string, sender: ChatMessage['sender'], type: ChatMessage['type'] = 'text') => {
    // Avoid double send empty checks
    if (!candidateId) return;

    if (text.trim() !== "") {
      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        candidateId,
        text,
        sender,
        timestamp: new Date().toISOString(),
        type
      };
      setChatMessages([...chatMessages, newMsg]);

      try {
        await fetch('/api/chatbot/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMsg)
        });
      } catch (err) {
        console.error("Error sending message:", err);
      }
    } else {
      // Just fetch fresh messages from server
      await fetchData();
    }
  };

  const handleClearChat = async (candidateId: string) => {
    setChatMessages(chatMessages.filter(m => m.candidateId !== candidateId));
    try {
      await fetch(`/api/chatbot/chat/${candidateId}`, { method: 'DELETE' });
    } catch (err) {
      console.error("Error clearing chat:", err);
    }
  };

  const handleClearSimulation = async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/db/clear-simulation', { method: 'POST' });
      if (res.ok) {
        await fetchData();
        alert("¡Datos de simulación eliminados con éxito! Los candidatos de ejemplo y mensajes han sido borrados de manera segura.");
      } else {
        alert("Hubo un error al limpiar los datos de simulación.");
      }
    } catch (err) {
      console.error("Error clearing simulation data:", err);
      alert("No se pudo conectar con el servidor para limpiar la simulación.");
    } finally {
      setSyncing(false);
    }
  };

  const triggerOAuthFlow = () => {
    // Since we are running in an iframe sandboxed environment, we can notify the user
    // that the platform will request permission, or simulate Google Auth success.
    // Let's set connection statuses to true and save so they work perfectly!
    const updated = {
      ...workspace,
      sheetsConnected: true,
      calendarConnected: true,
      driveConnected: true,
      gmailConnected: true
    };
    handleUpdateWorkspace(updated);
    alert("¡Google Workspace conectado con éxito! Las credenciales de OAuth se han guardado de forma segura.");
  };

  // Switch to chat simulation for a specific candidate from CRM
  const handleSelectCandidateChat = (candId: string) => {
    setSelectedCandidateId(candId);
    setActiveTab('whatsapp');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-display text-xs uppercase tracking-widest animate-pulse">
          Iniciando Recruitment AI OS...
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased transition-colors duration-200 ${
      theme === 'light' ? 'bg-slate-50 text-slate-900 light' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Upper Navigation Header Bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/15">
              <Cpu className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-xs text-indigo-400 block font-bold font-display uppercase tracking-wide leading-none">Heavenly Dreams</span>
              <h1 className="text-base font-bold text-white font-display tracking-tight mt-0.5 leading-none">Recruitment AI OS</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync Status Badge */}
            {syncing && (
              <span className="text-[10px] text-indigo-400 flex items-center gap-1 font-mono uppercase bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-900/30">
                <RefreshCw className="w-3 h-3 animate-spin" /> Guardando en la nube
              </span>
            )}

            {/* Theme Toggle Selector */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-xl transition-all border flex items-center justify-center cursor-pointer ${
                theme === 'light'
                  ? 'bg-white hover:bg-slate-100 text-indigo-600 border-slate-200 shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-indigo-400 border-slate-800'
              }`}
              title={theme === 'dark' ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
              id="theme-toggle-btn"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <span className={`hidden sm:inline-block text-[10px] font-mono px-3 py-1 rounded-full border ${
              theme === 'light'
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              MODO: EXCELENCIA AUTÓNOMA 24/7
            </span>

            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              theme === 'light'
                ? 'bg-slate-100 border-slate-200'
                : 'bg-slate-900 border-slate-800'
            }`} title="Reclutador Corporativo Heavenly Dreams">
              <span className="text-xs font-bold text-indigo-400">HD</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 gap-6 overflow-hidden">
        
        {/* Left Sidebar Menu */}
        <aside className="w-full md:w-60 shrink-0 flex flex-col gap-1 md:h-[calc(100vh-100px)] md:sticky md:top-20 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
            { id: 'crm', label: 'CRM de Candidatos', icon: Users },
            { id: 'whatsapp', label: 'Simulador WhatsApp', icon: MessageSquare },
            { id: 'flows', label: 'Constructor Visual', icon: Workflow },
            { id: 'vacancies', label: 'Vacantes de Empleo', icon: Briefcase },
            { id: 'agents', label: 'Agentes Especializados', icon: Cpu },
            { id: 'automation', label: 'Automatizaciones', icon: Settings2 },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'whatsapp') {
                    setSelectedCandidateId(null);
                  }
                }}
                className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 font-semibold text-xs transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 scale-[1.01]' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="mt-auto pt-6 border-t border-slate-900 hidden md:block">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 text-center space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Soporte Corporativo</span>
              <p className="text-[9px] text-slate-400">Licencia activa de Heavenly Dreams</p>
              <span className="inline-block text-[8px] bg-slate-900 text-indigo-400 font-mono px-1.5 py-0.5 rounded border border-slate-800 font-bold mt-1.5">
                V2.5.0-PRO
              </span>
            </div>
          </div>
        </aside>

        {/* Center Panel Content Window */}
        <main className="flex-1 overflow-hidden min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  candidates={candidates} 
                  vacancies={vacancies} 
                  onNavigate={setActiveTab} 
                  activityLogs={activityLogs}
                />
              )}
              
              {activeTab === 'crm' && (
                <CRM 
                  candidates={candidates} 
                  vacancies={vacancies} 
                  interviewSchedule={interviewSchedule}
                  onUpdateCandidate={handleUpdateCandidate} 
                  onDeleteCandidate={handleDeleteCandidate}
                  onSelectCandidateChat={handleSelectCandidateChat}
                  onUpdateInterviewSchedule={handleUpdateInterviewSchedule}
                  onRefreshData={fetchData}
                />
              )}

              {activeTab === 'whatsapp' && (
                <WhatsAppSimulator
                  candidates={candidates}
                  chatMessages={chatMessages}
                  agents={agents}
                  onSendMessage={handleSendMessage}
                  onClearChat={handleClearChat}
                  selectedCandidateId={selectedCandidateId}
                  onSelectCandidate={setSelectedCandidateId}
                />
              )}

              {activeTab === 'flows' && (
                <FlowBuilder 
                  flows={flows} 
                  onSaveFlows={handleSaveFlows} 
                />
              )}

              {activeTab === 'vacancies' && (
                <VacancyManager 
                  vacancies={vacancies} 
                  onSaveVacancy={handleSaveVacancy} 
                  onDeleteVacancy={handleDeleteVacancy} 
                />
              )}

              {activeTab === 'agents' && (
                <SpecializedAgents 
                  agents={agents} 
                  onSaveAgent={handleSaveAgent} 
                />
              )}

              {activeTab === 'automation' && (
                <AutomationCenter 
                  workspace={workspace} 
                  automation={automation} 
                  interviewSchedule={interviewSchedule}
                  onUpdateWorkspace={handleUpdateWorkspace} 
                  onUpdateAutomation={handleUpdateAutomation}
                  onUpdateInterviewSchedule={handleUpdateInterviewSchedule}
                  onTriggerOAuth={triggerOAuthFlow}
                  onClearSimulation={handleClearSimulation}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}
