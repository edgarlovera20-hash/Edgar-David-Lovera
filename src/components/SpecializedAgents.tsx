import React, { useState } from 'react';
import { AIAgent } from '../types';
import { 
  Bot, ShieldAlert, Edit3, MessageSquare, Sparkles, Send, 
  UserCheck, AlertTriangle, Play, HelpCircle, Save, CheckCircle2 
} from 'lucide-react';
import { motion } from 'motion/react';

interface SpecializedAgentsProps {
  agents: AIAgent[];
  onSaveAgent: (agent: AIAgent) => void;
}

export default function SpecializedAgents({ agents, onSaveAgent }: SpecializedAgentsProps) {
  const [selectedAgent, setSelectedAgent] = useState<AIAgent>(agents[0]);
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [editedInstructions, setEditedInstructions] = useState(selectedAgent.systemInstruction);

  // Playground State
  const [playgroundAgentId, setPlaygroundAgentId] = useState(selectedAgent.id);
  const [playgroundInput, setPlaygroundInput] = useState('');
  const [playgroundChat, setPlaygroundChat] = useState<{ sender: 'user' | 'agent'; text: string; timestamp: Date }[]>([
    { sender: 'agent', text: '¡Hola! Soy Sofía, reclutadora con más de 15 años de experiencia. ¿Qué tal va tu búsqueda de empleo hoy?', timestamp: new Date() }
  ]);
  const [isPlaygroundTyping, setIsPlaygroundTyping] = useState(false);

  const handleSelectAgent = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setEditedInstructions(agent.systemInstruction);
    setIsEditingInstructions(false);
  };

  const handleSaveInstructions = () => {
    const updatedAgent = { ...selectedAgent, systemInstruction: editedInstructions };
    onSaveAgent(updatedAgent);
    setSelectedAgent(updatedAgent);
    setIsEditingInstructions(false);
  };

  const handlePlaygroundSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playgroundInput.trim()) return;

    const userMsg = playgroundInput;
    setPlaygroundInput('');
    setPlaygroundChat(prev => [...prev, { sender: 'user', text: userMsg, timestamp: new Date() }]);
    setIsPlaygroundTyping(true);

    try {
      const response = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: 'playground-temp',
          text: userMsg,
          activeAgentId: playgroundAgentId
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Get the response
        setPlaygroundChat(prev => [...prev, { 
          sender: 'agent', 
          text: data.reply || 'Sin respuesta del agente.', 
          timestamp: new Date() 
        }]);
      } else {
        throw new Error("API error");
      }
    } catch (err) {
      // Fallback
      setPlaygroundChat(prev => [...prev, { 
        sender: 'agent', 
        text: '¡Hola! Disculpa, estoy teniendo un detalle técnico con mi conexión de red. ¿Me podrías repetir tu duda o comentario?', 
        timestamp: new Date() 
      }]);
    } finally {
      setIsPlaygroundTyping(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="specialized-agents-view">
      
      {/* Left panel: list of 12 agents */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-4 space-y-4 lg:col-span-1">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white font-display">Agentes Especializados</h3>
          <p className="text-[10px] text-slate-500">Haz click en un agente para ver sus instrucciones de sistema o reconfigurar su comportamiento.</p>
        </div>

        <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {agents.map(a => {
            const isSelected = selectedAgent.id === a.id;
            return (
              <div
                key={a.id}
                onClick={() => handleSelectAgent(a)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-indigo-500 bg-indigo-950/20' 
                    : 'border-slate-800/60 bg-slate-950/40 hover:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                    {a.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white font-display">{a.name}</h4>
                    <span className="text-[9px] text-slate-400 block truncate max-w-[150px]">{a.role}</span>
                  </div>
                </div>

                <span className={`w-2 h-2 rounded-full ${(a.active !== false) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center panel: active agent details */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between lg:col-span-1 space-y-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedAgent.avatar}</span>
              <div>
                <h3 className="text-sm font-bold text-white font-display">{selectedAgent.name}</h3>
                <span className="text-[10px] text-indigo-400 font-mono tracking-wider font-semibold uppercase">{selectedAgent.role}</span>
              </div>
            </div>

            <button
              onClick={() => setIsEditingInstructions(!isEditingInstructions)}
              className="p-1.5 bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 rounded-lg flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {isEditingInstructions ? (
              <div className="space-y-3">
                <span className="text-slate-400 font-semibold uppercase block">Instrucciones de Sistema (System Prompt)</span>
                <textarea
                  rows={14}
                  value={editedInstructions}
                  onChange={e => setEditedInstructions(e.target.value)}
                  className="w-full bg-slate-950 text-white text-[11px] p-3 rounded-xl border border-slate-850 focus:outline-none focus:border-indigo-600 font-mono leading-normal"
                ></textarea>
                <button
                  onClick={handleSaveInstructions}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Guardar Prompt de Agente
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold uppercase block">Directiva Base</span>
                  <p className="text-slate-300 bg-slate-950/80 p-3 rounded-xl border border-slate-900/60 italic leading-relaxed text-[11px]">
                    "{selectedAgent.systemInstruction.split('\n')[0]}"
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold uppercase block">Instrucciones Completas</span>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 max-h-[300px] overflow-y-auto font-mono text-[10px] text-slate-400 whitespace-pre-wrap leading-relaxed">
                    {selectedAgent.systemInstruction}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Operational State summary */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500">Tasa de precisión asignada</span>
          <span className="bg-indigo-950 text-indigo-400 font-mono font-bold px-2 py-0.5 rounded border border-indigo-900/40">
            99.8% Apto
          </span>
        </div>
      </div>

      {/* Right panel: Playground simulator to test any agent */}
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between lg:col-span-1 h-[calc(100vh-140px)] min-h-[400px]">
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Selector */}
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-slate-400 font-bold font-display text-xs flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" /> Playground de Pruebas
            </span>

            <select
              value={playgroundAgentId}
              onChange={e => {
                setPlaygroundAgentId(e.target.value);
                const ag = agents.find(a => a.id === e.target.value);
                setPlaygroundChat([
                  { sender: 'agent', text: `¡Hola! Soy ${ag?.name || 'el agente'}, especializado como ${ag?.role}. ¿En qué te puedo apoyar el día de hoy?`, timestamp: new Date() }
                ]);
              }}
              className="bg-slate-950 border border-slate-850 text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.avatar} {a.name}</option>
              ))}
            </select>
          </div>

          {/* Playground Chat area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1 text-xs">
            {playgroundChat.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-xl max-w-[85%] leading-relaxed whitespace-pre-wrap ${
                  m.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-950 text-slate-200 border border-slate-850 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {isPlaygroundTyping && (
              <div className="flex justify-start">
                <div className="p-3 rounded-xl bg-slate-950 text-slate-500 border border-slate-850 animate-pulse font-mono text-[10px]">
                  Pensando respuesta con Gemini 2.5 Pro...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <form onSubmit={handlePlaygroundSend} className="pt-3 border-t border-slate-800 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Pregúntame lo que quieras para probar mi tono..."
              value={playgroundInput}
              onChange={e => setPlaygroundInput(e.target.value)}
              className="w-full bg-slate-950 text-white text-xs pl-4 pr-12 py-3.5 rounded-xl border border-slate-850 focus:outline-none focus:border-indigo-600 leading-normal"
            />
            <button
              type="submit"
              disabled={isPlaygroundTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

      </div>

    </div>
  );
}
