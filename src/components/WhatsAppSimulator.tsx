import React, { useState, useEffect, useRef } from 'react';
import { Candidate, ChatMessage, AIAgent } from '../types';
import { 
  Send, Search, Smartphone, Shield, Wifi, WifiOff, RefreshCw, 
  Trash2, Play, Users, MessageSquare, Image, File, MapPin, 
  Mic, Bot, Check, CheckCheck, Sparkles, SendHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WhatsAppSimulatorProps {
  candidates: Candidate[];
  chatMessages: ChatMessage[];
  agents: AIAgent[];
  onSendMessage: (candidateId: string, text: string, sender: ChatMessage['sender'], type?: ChatMessage['type']) => Promise<void>;
  onClearChat: (candidateId: string) => void;
  selectedCandidateId: string | null;
  onSelectCandidate: (candidateId: string) => void;
}

export default function WhatsAppSimulator({
  candidates,
  chatMessages,
  agents,
  onSendMessage,
  onClearChat,
  selectedCandidateId,
  onSelectCandidate
}: WhatsAppSimulatorProps) {
  const [activeTab, setActiveTab] = useState<'chats' | 'baileys' | 'campaigns'>('chats');
  const [activeAgentId, setActiveAgentId] = useState('agent-recruiter');
  const [candidateInput, setCandidateInput] = useState('');
  const [recruiterInput, setRecruiterInput] = useState('');
  const [messageSender, setMessageSender] = useState<'candidate' | 'recruiter'>('recruiter');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Baileys Session states
  const [baileysSessions, setBaileysSessions] = useState([
    { id: 'sess-1', name: 'Heavenly Dreams Principal', phone: '+52 55 8888 7777', status: 'connected', logs: ['Iniciado en puerto 3000', 'Sesión Baileys cargada', 'Escucha de eventos activa'] },
    { id: 'sess-2', name: 'Campaña Nocturna', phone: '+52 55 4444 3333', status: 'connected', logs: ['Iniciado', 'Conectado'] },
  ]);
  const [qrSimulated, setQrSimulated] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Campaigns state
  const [campaignText, setCampaignText] = useState('¡Hola! 💤 Te contactamos de Heavenly Dreams. Vimos tu perfil interesante para nuestra vacante de ventas. ¿Te gustaría agendar una llamada rápida de 5 minutos hoy?');
  const [campaignRecipients, setCampaignRecipients] = useState<string[]>([]);
  const [campaignLogs, setCampaignLogs] = useState<string[]>([]);
  const [isSendingCampaign, setIsSendingCampaign] = useState(false);

  // Handle active candidate selection fallback
  const activeCandId = selectedCandidateId || (candidates[0]?.id || null);
  const activeCandidate = candidates.find(c => c.id === activeCandId) || null;

  // Filter messages for active candidate
  const activeMessages = chatMessages.filter(m => m.candidateId === activeCandId);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // Load AI Suggested Responses for Recruiter
  const loadSuggestions = async (candId: string | null) => {
    if (!candId) return;
    setLoadingSuggestions(true);
    try {
      const response = await fetch('/api/suggest-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candId })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.suggestions) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (err) {
      console.error("Failed to load suggested messages:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Trigger suggestions load on active candidate change
  useEffect(() => {
    if (activeCandId) {
      loadSuggestions(activeCandId);
    }
  }, [activeCandId]);

  const handleSimulateSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandId) return;

    if (messageSender === 'candidate') {
      if (!candidateInput.trim()) return;
      const textToSend = candidateInput;
      setCandidateInput('');
      // Send candidate message
      await onSendMessage(activeCandId, textToSend, 'candidate', 'text');
      // Instantly simulate typing and trigger AI Auto-response
      triggerAIResponse(activeCandId, textToSend);
    } else {
      if (!recruiterInput.trim()) return;
      const textToSend = recruiterInput;
      setRecruiterInput('');
      // Send recruiter message
      await onSendMessage(activeCandId, textToSend, 'recruiter', 'text');
      // Refresh suggestions after sending recruiter message
      setTimeout(() => loadSuggestions(activeCandId), 500);
    }
  };

  const triggerAIResponse = async (candId: string, text: string) => {
    // We send request to our backend chatbot api
    try {
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candId,
          text: text,
          activeAgentId: activeAgentId
        })
      });
      if (response.ok) {
        // Parent will refetch messages automatically via the main fetch trigger
        // Just trigger a soft state reload or let parent poll. Let's make sure parent reloads.
        const data = await response.json();
        // Since we are running on a full-stack server and writing to src/db-data.json,
        // we call onSendMessage with nothing or trigger a silent refresh in App.tsx
        // Let's pass a dummy message send with no text to trigger a reload in App.tsx!
        await onSendMessage(candId, "", "system", "text");
        // Reload suggestions after the AI reply is generated!
        loadSuggestions(candId);
      }
    } catch (err) {
      console.error("Failed to generate AI chat reply:", err);
    }
  };

  const generateNewBaileysQr = () => {
    setIsGeneratingQr(true);
    setQrSimulated(null);
    setTimeout(() => {
      // Set simulated base64 or custom string
      setQrSimulated('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=baileys-session-active-' + Date.now());
      setIsGeneratingQr(false);
    }, 1500);
  };

  const handleConnectSessionSimulated = () => {
    if (!qrSimulated) return;
    const newSession = {
      id: 'sess-' + Date.now(),
      name: 'Nueva Sesión Baileys ' + (baileysSessions.length + 1),
      phone: '+52 55 ' + Math.floor(10000000 + Math.random() * 90000000),
      status: 'connected',
      logs: ['Escaneado exitoso', 'Sesión Baileys activada', 'Conectado a la red de WhatsApp']
    };
    setBaileysSessions([...baileysSessions, newSession]);
    setQrSimulated(null);
  };

  const runCampaignSimulated = () => {
    if (campaignRecipients.length === 0) {
      alert('Por favor selecciona al menos un destinatario.');
      return;
    }
    setIsSendingCampaign(true);
    setCampaignLogs([]);

    let index = 0;
    const interval = setInterval(() => {
      if (index >= campaignRecipients.length) {
        clearInterval(interval);
        setIsSendingCampaign(false);
        setCampaignLogs(prev => [...prev, '✨ Campaña masiva completada con éxito.']);
        return;
      }

      const candId = campaignRecipients[index];
      const cand = candidates.find(c => c.id === candId);
      if (cand) {
        onSendMessage(candId, campaignText, 'bot', 'text');
        setCampaignLogs(prev => [...prev, `[ENVIADO] Mensaje enviado a ${cand.name} (${cand.phone})`]);
      }
      index++;
    }, 1200);
  };

  const toggleRecipient = (id: string) => {
    if (campaignRecipients.includes(id)) {
      setCampaignRecipients(campaignRecipients.filter(r => r !== id));
    } else {
      setCampaignRecipients([...campaignRecipients, id]);
    }
  };

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden h-[calc(100vh-140px)]" id="whatsapp-view">
      
      {/* Left sidebar: Navigation Tabs & List */}
      <div className="border-r border-slate-800 flex flex-col bg-slate-950/80">
        
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-800 text-xs text-center">
          {[
            { id: 'chats', label: 'Chats', icon: MessageSquare },
            { id: 'baileys', label: 'Sesión', icon: Smartphone },
            { id: 'campaigns', label: 'Masivos', icon: Users },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 font-bold border-b-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                activeTab === tab.id 
                  ? 'border-indigo-500 text-white bg-slate-900/30' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content: Chats list */}
        {activeTab === 'chats' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-slate-800/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar chat..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Candidates list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-900/40">
              {filteredCandidates.map(cand => {
                const isSelected = cand.id === activeCandId;
                const lastMsg = chatMessages.filter(m => m.candidateId === cand.id).slice(-1)[0];
                return (
                  <div
                    key={cand.id}
                    onClick={() => onSelectCandidate(cand.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                      isSelected ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs uppercase shrink-0 border border-slate-700">
                      {cand.name.substring(0, 2)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-xs font-semibold text-white truncate pr-2">{cand.name}</h4>
                        <span className="text-[9px] text-slate-500 shrink-0 font-mono">
                          {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {lastMsg ? lastMsg.text : 'Conversación vacía.'}
                      </p>
                      <span className="inline-block bg-slate-900 text-slate-500 text-[8px] font-semibold px-1.5 py-0.5 rounded border border-slate-800 uppercase mt-1">
                        {cand.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab content: Baileys connections */}
        {activeTab === 'baileys' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white font-display">WhatsApp Baileys (Multi-Sesión)</h4>
              <p className="text-[10px] text-slate-400">Conecta tu cuenta escaneando el código QR simulado.</p>
            </div>

            {/* Active Sessions */}
            <div className="space-y-2.5">
              {baileysSessions.map(sess => (
                <div key={sess.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white block">{sess.name}</span>
                    <span className="flex items-center gap-1 text-[9px] text-emerald-400 uppercase font-mono font-bold">
                      <Wifi className="w-3 h-3" /> Conectado
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block font-mono">{sess.phone}</span>

                  <div className="bg-slate-900 p-2 rounded text-[8px] font-mono text-slate-400 max-h-20 overflow-y-auto space-y-0.5">
                    {sess.logs.map((log, idx) => (
                      <div key={idx}>&gt; {log}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* QR Code Sim */}
            <div className="pt-3 border-t border-slate-900 space-y-3 text-center">
              <button
                onClick={generateNewBaileysQr}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Vincular Nuevo Dispositivo
              </button>

              <AnimatePresence>
                {isGeneratingQr && (
                  <div className="flex items-center justify-center py-6 text-slate-500 text-xs">
                    Generando código QR seguro...
                  </div>
                )}

                {qrSimulated && !isGeneratingQr && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 bg-white rounded-xl inline-block mx-auto cursor-pointer"
                    onClick={handleConnectSessionSimulated}
                    title="Click para simular escaneo de QR"
                  >
                    <img src={qrSimulated} alt="QR Code Scanner" className="w-32 h-32" />
                    <span className="text-[9px] text-slate-500 font-bold block mt-2 uppercase font-display">Haz click para simular escaneo</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Tab content: Campaigns */}
        {activeTab === 'campaigns' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white font-display">Envío Masivo Controlado</h4>
              <p className="text-[10px] text-slate-400">Difunde mensajes automáticos respetando retardos anti-bloqueo.</p>
            </div>

            {/* Template input */}
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase block">Plantilla de Mensaje</span>
              <textarea
                rows={3}
                value={campaignText}
                onChange={e => setCampaignText(e.target.value)}
                className="w-full bg-slate-950 text-white text-[11px] p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600"
              ></textarea>
            </div>

            {/* Recipients checkboxes */}
            <div className="space-y-2">
              <span className="text-slate-400 font-semibold uppercase block">Destinatarios ({campaignRecipients.length})</span>
              <div className="bg-slate-950 rounded-xl border border-slate-850 p-2.5 max-h-32 overflow-y-auto space-y-1.5">
                {candidates.map(cand => {
                  const isChecked = campaignRecipients.includes(cand.id);
                  return (
                    <label key={cand.id} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleRecipient(cand.id)}
                        className="rounded border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-slate-300 text-[10px] truncate">{cand.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Execute */}
            <button
              onClick={runCampaignSimulated}
              disabled={isSendingCampaign}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" /> {isSendingCampaign ? 'Enviando...' : 'Iniciar Difusión'}
            </button>

            {/* Log status */}
            {campaignLogs.length > 0 && (
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-850 space-y-1 max-h-24 overflow-y-auto font-mono text-[8px] text-slate-400">
                {campaignLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Center & Right column: Active Chat box */}
      <div className="lg:col-span-3 flex flex-col h-full bg-slate-950/25">
        
        {activeCandidate ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Candidate Header & Agent Selector */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-sm border border-slate-700 uppercase">
                  {activeCandidate.name.substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{activeCandidate.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400 font-mono">{activeCandidate.phone}</span>
                    <span className="text-slate-600 text-[10px]">•</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                      activeCandidate.recruiterPersona === 'sales'
                        ? 'bg-amber-950/40 border-amber-800/40 text-amber-400'
                        : activeCandidate.recruiterPersona === 'tech'
                        ? 'bg-cyan-950/40 border-cyan-800/40 text-cyan-400'
                        : activeCandidate.recruiterPersona === 'support'
                        ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                        : 'bg-indigo-950/40 border-indigo-800/40 text-indigo-400'
                    }`}>
                      {activeCandidate.recruiterPersona === 'sales'
                        ? '🎯 Persona: Ventas'
                        : activeCandidate.recruiterPersona === 'tech'
                        ? '💻 Persona: Tech'
                        : activeCandidate.recruiterPersona === 'support'
                        ? '🤝 Persona: ATC'
                        : '✨ Persona: IA Auto'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specialized AI Agent drop-down */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Agente Activo:</span>
                <div className="relative">
                  <select
                    value={activeAgentId}
                    onChange={e => setActiveAgentId(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-white text-xs px-3 py-1.5 pr-8 rounded-lg focus:outline-none focus:border-indigo-600 cursor-pointer appearance-none min-w-[150px]"
                  >
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.avatar} {a.name}
                      </option>
                    ))}
                  </select>
                  <Bot className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  onClick={() => {
                    if (confirm(`¿Borrar historial del chat de ${activeCandidate.name}?`)) {
                      onClearChat(activeCandidate.id);
                    }
                  }}
                  className="p-1.5 hover:bg-slate-900 text-slate-500 hover:text-rose-400 rounded-lg transition-colors border border-transparent hover:border-slate-800"
                  title="Borrar chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40 relative">
              {/* Overlay watermarks mimicking WhatsApp */}
              <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none z-0"></div>

              <div className="relative z-10 space-y-3">
                <div className="text-center">
                  <span className="bg-slate-900/80 text-slate-400 text-[10px] px-3 py-1 rounded-full border border-slate-800">
                    Cifrado de extremo a extremo simulado vía Baileys
                  </span>
                </div>

                {activeMessages.map(m => {
                  const isUser = m.sender === 'candidate';
                  const isAgent = m.sender !== 'candidate' && m.sender !== 'bot';
                  
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] p-3 rounded-2xl text-xs space-y-1 relative shadow-md ${
                          isUser 
                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                            : isAgent
                            ? 'bg-purple-950/80 text-purple-100 border border-purple-900/40 rounded-tl-none'
                            : 'bg-slate-900 text-slate-100 border border-slate-800/80 rounded-tl-none'
                        }`}
                      >
                        {/* Sender metadata inside Agent bubbles */}
                        {isAgent && (
                          <span className="text-[9px] font-bold text-purple-300 uppercase tracking-wide block mb-1">
                            {agents.find(a => a.id.includes(m.sender))?.name || m.sender.toUpperCase()} IA
                          </span>
                        )}

                        <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        
                        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400/80 select-none">
                          <span className="font-mono">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isUser ? (
                            <CheckCheck className="w-3.5 h-3.5 text-indigo-300" />
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Footer for simulation */}
            <div className="p-4 bg-slate-950/90 border-t border-slate-800 shrink-0">
              <form onSubmit={handleSimulateSend} className="space-y-4">
                
                {/* Sender Identity Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setMessageSender('recruiter')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        messageSender === 'recruiter'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      👤 Responder como Reclutador
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessageSender('candidate')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        messageSender === 'candidate'
                          ? 'bg-purple-950 text-purple-300 border border-purple-900/40'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      💬 Simular como Candidato
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-500 italic">
                    {messageSender === 'recruiter' 
                      ? 'Mensaje manual oficial o sugerencias de IA' 
                      : 'Simular mensaje entrante del postulante'}
                  </span>
                </div>

                {/* AI Writing Assistant Section */}
                {messageSender === 'recruiter' && (
                  <div className="bg-slate-900/40 rounded-xl border border-indigo-900/30 p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-indigo-400">
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        <span className="text-[11px] font-bold uppercase tracking-wider font-display">Asistente de Redacción con IA</span>
                      </div>
                      <button
                        type="button"
                        disabled={loadingSuggestions}
                        onClick={() => loadSuggestions(activeCandId)}
                        className="text-[9px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 font-bold cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${loadingSuggestions ? 'animate-spin' : ''}`} /> Regenerar sugerencias
                      </button>
                    </div>

                    {loadingSuggestions ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 py-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="h-14 bg-slate-950/60 rounded-lg border border-slate-800/40 animate-pulse flex items-center justify-center">
                            <span className="text-[9px] text-slate-600">Redactando opción {i}...</span>
                          </div>
                        ))}
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setRecruiterInput(sug)}
                            className="text-left p-2.5 bg-slate-950/80 hover:bg-indigo-950/40 text-slate-300 hover:text-white rounded-lg border border-slate-800 hover:border-indigo-500/30 transition-all text-[10px] leading-relaxed cursor-pointer flex flex-col justify-between group h-full relative"
                          >
                            <span className="line-clamp-3">{sug}</span>
                            <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-900/60 w-full text-[8px] text-slate-500 group-hover:text-indigo-400 font-mono">
                              <span>Sugerencia {idx + 1}</span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity font-bold">Usar &rarr;</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-[10px] text-slate-500">
                        Sube un historial de chat para recibir recomendaciones contextuales.
                      </div>
                    )}
                  </div>
                )}

                {/* Simulated Quick Replies & Attachments */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {[
                      { icon: Image, label: 'Imagen' },
                      { icon: File, label: 'PDF' },
                      { icon: MapPin, label: 'Ubicación' },
                    ].map(att => (
                      <button
                        key={att.label}
                        type="button"
                        onClick={() => {
                          onSendMessage(
                            activeCandId!, 
                            `[Enviado: ${att.label} de prueba]`, 
                            messageSender, 
                            att.label.toLowerCase() as any
                          );
                        }}
                        className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 flex items-center gap-1 transition-all"
                      >
                        <att.icon className="w-3.5 h-3.5" />
                        <span>{att.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Quick replies for candidate / recruiter */}
                  <div className="flex items-center gap-1.5">
                    {messageSender === 'candidate' ? (
                      [
                        'Hola, me interesa la vacante',
                        'Sí, tengo experiencia',
                        'Lunes a las 11 AM me queda bien'
                      ].map(qr => (
                        <button
                          key={qr}
                          type="button"
                          onClick={() => setCandidateInput(qr)}
                          className="px-2.5 py-1.5 bg-purple-950/40 hover:bg-purple-950/80 text-purple-300 rounded-lg border border-purple-900/30 transition-all font-medium truncate max-w-[120px] sm:max-w-none"
                        >
                          "{qr}"
                        </button>
                      ))
                    ) : (
                      [
                        '¡Hola! Recibimos tu postulación',
                        '¿Tienes disponibilidad para llamada?',
                        '¿Me compartes tu CV por favor?'
                      ].map(qr => (
                        <button
                          key={qr}
                          type="button"
                          onClick={() => setRecruiterInput(qr)}
                          className="px-2.5 py-1.5 bg-indigo-950/40 hover:bg-indigo-950/80 text-indigo-300 rounded-lg border border-indigo-900/30 transition-all font-medium truncate max-w-[120px] sm:max-w-none"
                        >
                          "{qr}"
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Main typing bar */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    {messageSender === 'candidate' ? (
                      <input
                        type="text"
                        placeholder="Escribe un mensaje para simular respuesta del candidato..."
                        value={candidateInput}
                        onChange={e => setCandidateInput(e.target.value)}
                        className="w-full bg-slate-900 text-white text-xs pl-4 pr-10 py-3.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600 leading-normal"
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="Escribe un mensaje manual del reclutador (o selecciona una sugerencia de IA)..."
                        value={recruiterInput}
                        onChange={e => setRecruiterInput(e.target.value)}
                        className="w-full bg-slate-900 text-white text-xs pl-4 pr-10 py-3.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600 leading-normal"
                      />
                    )}
                    
                    {messageSender === 'candidate' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeMessages.length > 0) {
                            const lastUserText = activeMessages.filter(m => m.sender === 'candidate').slice(-1)[0]?.text || "Hola";
                            triggerAIResponse(activeCandId!, lastUserText);
                          } else {
                            triggerAIResponse(activeCandId!, "Hola, vi la vacante");
                          }
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 bg-indigo-950 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/40 rounded transition-colors"
                        title="Forzar respuesta de IA autónoma"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
                    title={messageSender === 'candidate' ? "Enviar como candidato" : "Enviar como reclutador"}
                  >
                    <SendHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center text-slate-500">
            <MessageSquare className="w-16 h-16 text-slate-800 mb-4" />
            <p className="text-sm font-semibold text-slate-400">Sin chats disponibles</p>
            <p className="text-xs text-slate-600 mt-1 max-w-sm">Registra un nuevo candidato en el CRM para chatear y simular interacciones.</p>
          </div>
        )}

      </div>

    </div>
  );
}
