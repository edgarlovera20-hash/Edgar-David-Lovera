import React, { useState, useRef } from 'react';
import { FlowNode, FlowEdge } from '../types';
import { 
  Plus, Save, ArrowDown, ChevronRight, Settings, Trash, 
  Download, Upload, Play, MessageSquare, HelpCircle, Bot, 
  Calendar, FileText, Mail, Smartphone, Globe, Code, CheckCircle, HelpCircle as HelpIcon
} from 'lucide-react';
import { motion } from 'motion/react';

interface FlowBuilderProps {
  flows: { nodes: FlowNode[]; edges: FlowEdge[] };
  onSaveFlows: (flows: { nodes: FlowNode[]; edges: FlowEdge[] }) => void;
}

const NODE_TYPES = [
  { type: 'start', label: 'Inicio (Trigger)', color: 'border-emerald-500 bg-emerald-950/40 text-emerald-300', icon: Play },
  { type: 'message', label: 'Enviar Mensaje', color: 'border-blue-500 bg-blue-950/40 text-blue-300', icon: MessageSquare },
  { type: 'question', label: 'Hacer Pregunta', color: 'border-amber-500 bg-amber-950/40 text-amber-300', icon: HelpCircle },
  { type: 'ia', label: 'Análisis IA (Gemini)', color: 'border-purple-500 bg-purple-950/40 text-purple-300', icon: Bot },
  { type: 'condition', label: 'Condición', color: 'border-pink-500 bg-pink-950/40 text-pink-300', icon: HelpIcon },
  { type: 'wait', label: 'Esperar Respuesta', color: 'border-slate-500 bg-slate-900/40 text-slate-300', icon: ChevronRight },
  { type: 'sheets', label: 'Google Sheets CRM', color: 'border-emerald-600 bg-emerald-950/20 text-emerald-400', icon: FileText },
  { type: 'calendar', label: 'Google Calendar', color: 'border-cyan-500 bg-cyan-950/40 text-cyan-300', icon: Calendar },
  { type: 'drive', label: 'Google Drive', color: 'border-yellow-600 bg-yellow-950/20 text-yellow-400', icon: FileText },
  { type: 'gmail', label: 'Enviar Gmail', color: 'border-rose-500 bg-rose-950/40 text-rose-300', icon: Mail },
  { type: 'whatsapp', label: 'Enviar WhatsApp', color: 'border-emerald-400 bg-emerald-950/40 text-emerald-300', icon: Smartphone },
  { type: 'webhook', label: 'Webhook HTTP', color: 'border-teal-500 bg-teal-950/40 text-teal-300', icon: Globe },
  { type: 'api', label: 'Llamar API Externa', color: 'border-indigo-500 bg-indigo-950/40 text-indigo-300', icon: Code },
  { type: 'end', label: 'Finalizar Flujo', color: 'border-red-500 bg-red-950/40 text-red-300', icon: CheckCircle },
];

export default function FlowBuilder({ flows, onSaveFlows }: FlowBuilderProps) {
  const [nodes, setNodes] = useState<FlowNode[]>(flows.nodes);
  const [edges, setEdges] = useState<FlowEdge[]>(flows.edges);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  
  // Drag node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Connection state
  const [connectingSource, setConnectingSource] = useState<string | null>(null);

  const handleMouseDown = (node: FlowNode, e: React.MouseEvent) => {
    // Avoid double trigger if clicking on inputs/buttons inside node
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return;
    
    setDraggingNodeId(node.id);
    setSelectedNode(node);
    
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId) return;

    setNodes(prevNodes => 
      prevNodes.map(node => {
        if (node.id === draggingNodeId) {
          // Keep node constraints inside sensible canvas coords
          const newX = Math.max(20, e.clientX - dragOffset.x);
          const newY = Math.max(20, e.clientY - dragOffset.y);
          return { ...node, x: newX, y: newY };
        }
        return node;
      })
    );
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  const addNode = (type: FlowNode['type']) => {
    const nodeTypeObj = NODE_TYPES.find(n => n.type === type);
    const newNode: FlowNode = {
      id: `${type}-${Date.now()}`,
      type,
      label: nodeTypeObj ? nodeTypeObj.label : 'Nuevo Bloque',
      x: 150 + Math.random() * 100,
      y: 150 + Math.random() * 100,
      config: type === 'message' ? { message: '¡Hola! ¿Cómo estás?' } : {}
    };

    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
  };

  const deleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    setEdges(edges.filter(e => e.source !== id && e.target !== id));
    if (selectedNode?.id === id) {
      setSelectedNode(null);
    }
  };

  const updateNodeLabel = (id: string, label: string) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, label } : n));
    if (selectedNode?.id === id) {
      setSelectedNode({ ...selectedNode, label });
    }
  };

  const updateNodeConfig = (id: string, key: string, value: any) => {
    setNodes(nodes.map(n => {
      if (n.id === id) {
        return { ...n, config: { ...n.config, [key]: value } };
      }
      return n;
    }));
    if (selectedNode?.id === id) {
      setSelectedNode({ ...selectedNode, config: { ...selectedNode.config, [key]: value } });
    }
  };

  const handleStartConnection = (sourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectingSource(sourceId);
  };

  const handleEndConnection = (targetId: string) => {
    if (connectingSource && connectingSource !== targetId) {
      // Avoid duplicate edges
      const edgeExists = edges.some(e => e.source === connectingSource && e.target === targetId);
      if (!edgeExists) {
        const newEdge: FlowEdge = {
          id: `edge-${connectingSource}-${targetId}`,
          source: connectingSource,
          target: targetId,
          label: nodes.find(n => n.id === connectingSource)?.type === 'condition' ? 'Opción' : undefined
        };
        setEdges([...edges, newEdge]);
      }
    }
    setConnectingSource(null);
  };

  const deleteEdge = (edgeId: string) => {
    setEdges(edges.filter(e => e.id !== edgeId));
  };

  const updateEdgeLabel = (edgeId: string, label: string) => {
    setEdges(edges.map(e => e.id === edgeId ? { ...e, label } : e));
  };

  const saveFlow = () => {
    onSaveFlows({ nodes, edges });
  };

  const exportFlow = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "heavenly_dreams_flow.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col lg:flex-row rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden h-[calc(100vh-140px)]" id="flow-builder-view">
      
      {/* Toolbox: Available Blocks */}
      <div className="w-full lg:w-64 border-r border-slate-800 bg-slate-950/80 p-4 flex flex-col overflow-y-auto space-y-4 shrink-0">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white font-display">Constructor de Flujos</h3>
          <p className="text-[10px] text-slate-500">Arrastra o haz click en los bloques para armar tu flujo de RH.</p>
        </div>

        <div className="space-y-2">
          {NODE_TYPES.map(n => (
            <button
              key={n.type}
              onClick={() => addNode(n.type as any)}
              className="w-full text-left p-2.5 rounded-xl border border-slate-800 hover:border-indigo-600 bg-slate-900/40 hover:bg-slate-900 text-slate-300 flex items-center gap-2.5 transition-all cursor-pointer text-xs group"
            >
              <div className={`p-1.5 rounded-lg border ${n.color} transition-colors group-hover:scale-105`}>
                <n.icon className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold">{n.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Canvas Area */}
      <div 
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 bg-slate-950 relative overflow-hidden h-[400px] lg:h-full grid-bg cursor-grab select-none active:cursor-grabbing"
      >
        {/* Floating Controls Bar */}
        <div className="absolute top-4 left-4 z-20 flex gap-2">
          <button
            onClick={saveFlow}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-indigo-600/10"
          >
            <Save className="w-3.5 h-3.5" /> Guardar Flujo
          </button>
          <button
            onClick={exportFlow}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>

        {/* Connections SVG Drawing Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
            </marker>
          </defs>

          {/* Render Active Beziers for connected edges */}
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            // Compute port endpoints
            const x1 = sourceNode.x + 190;
            const y1 = sourceNode.y + 35;
            const x2 = targetNode.x;
            const y2 = targetNode.y + 35;

            // Professional cubic bezier string
            const pathString = `M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`;

            return (
              <g key={edge.id} className="pointer-events-auto">
                <path
                  d={pathString}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="2"
                  markerEnd="url(#arrow)"
                  className="hover:stroke-rose-500 transition-colors cursor-pointer"
                  onClick={() => {
                    if (confirm('¿Eliminar esta conexión?')) {
                      deleteEdge(edge.id);
                    }
                  }}
                  title="Click para borrar conexión"
                />
              </g>
            );
          })}
        </svg>

        {/* Nodes layer */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {nodes.map(node => {
            const isSelected = selectedNode?.id === node.id;
            const nodeTypeObj = NODE_TYPES.find(n => n.type === node.type);
            const NodeIcon = nodeTypeObj ? nodeTypeObj.icon : MessageSquare;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDown(node, e)}
                onMouseUp={() => handleEndConnection(node.id)}
                style={{ left: node.x, top: node.y }}
                className={`absolute w-48 bg-slate-900 border rounded-xl shadow-xl pointer-events-auto cursor-grab active:cursor-grabbing transition-shadow flex flex-col p-3 space-y-2 ${
                  isSelected ? 'border-indigo-500 shadow-indigo-600/10 scale-[1.02]' : 'border-slate-800'
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                  <div className={`p-1 rounded-lg border ${nodeTypeObj?.color || 'border-slate-700 bg-slate-800'}`}>
                    <NodeIcon className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={node.label}
                    onChange={(e) => updateNodeLabel(node.id, e.target.value)}
                    className="bg-transparent text-white text-[11px] font-bold focus:outline-none focus:bg-slate-950/40 px-1 py-0.5 rounded flex-1 truncate"
                  />
                </div>

                {/* Body metadata */}
                <div className="text-[9px] text-slate-500 truncate italic">
                  {node.type === 'message' && node.config.message}
                  {node.type === 'question' && node.config.question}
                  {node.type === 'ia' && 'Cerebro Gemini Activo'}
                  {node.type === 'calendar' && 'Google Calendar API'}
                  {node.type === 'sheets' && 'Google Sheets CRM Sync'}
                  {node.type === 'drive' && 'Drive Almacenamiento'}
                  {node.type === 'gmail' && 'Gmail Send Auto'}
                </div>

                {/* Ports (Left input, Right Output) */}
                <div className="flex justify-between items-center pt-1 mt-1 text-[9px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700"></div>
                    <span>In</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span>Out</span>
                    <button
                      onMouseDown={(e) => handleStartConnection(node.id, e)}
                      className="w-3.5 h-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 cursor-crosshair active:scale-95 transition-transform"
                      title="Haz drag para conectar con otro nodo"
                    ></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Node Inspector Settings Panel (Right side) */}
      <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/80 p-5 flex flex-col overflow-y-auto space-y-5 shrink-0 text-xs">
        {selectedNode ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-indigo-950 text-indigo-400 font-bold px-2 py-0.5 rounded uppercase border border-indigo-900/50">
                Propiedades
              </span>
              <button
                onClick={() => deleteNode(selectedNode.id)}
                className="p-1.5 hover:bg-rose-950/30 hover:text-rose-400 text-slate-500 border border-transparent hover:border-slate-800 rounded-lg transition-all"
                title="Eliminar este bloque"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase block">ID de Bloque</span>
              <span className="text-[10px] text-slate-600 block font-mono">{selectedNode.id}</span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-semibold uppercase block">Etiqueta</label>
              <input
                type="text"
                value={selectedNode.label}
                onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
                className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600"
              />
            </div>

            {/* Custom attributes depending on type */}
            {selectedNode.type === 'message' && (
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase block">Mensaje de WhatsApp</label>
                <textarea
                  rows={4}
                  value={selectedNode.config.message || ''}
                  onChange={(e) => updateNodeConfig(selectedNode.id, 'message', e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600 leading-relaxed"
                ></textarea>
              </div>
            )}

            {selectedNode.type === 'question' && (
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase block">Pregunta de Filtrado</label>
                <textarea
                  rows={4}
                  value={selectedNode.config.question || ''}
                  onChange={(e) => updateNodeConfig(selectedNode.id, 'question', e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600 leading-relaxed"
                ></textarea>
              </div>
            )}

            {selectedNode.type === 'ia' && (
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase block">Directiva de Prompt (Analista)</label>
                <textarea
                  rows={4}
                  value={selectedNode.config.prompt || ''}
                  onChange={(e) => updateNodeConfig(selectedNode.id, 'prompt', e.target.value)}
                  className="w-full bg-slate-950 text-white text-[11px] p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600 font-mono leading-normal"
                ></textarea>
              </div>
            )}

            {selectedNode.type === 'condition' && (
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase block">Criterio de Decisión</label>
                <input
                  type="text"
                  value={selectedNode.config.criteria || ''}
                  onChange={(e) => updateNodeConfig(selectedNode.id, 'criteria', e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>
            )}

            {selectedNode.type === 'calendar' && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase block">Google Calendar ID</label>
                  <input
                    type="text"
                    value={selectedNode.config.calendarId || 'primary'}
                    onChange={(e) => updateNodeConfig(selectedNode.id, 'calendarId', e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase block">Duración (Minutos)</label>
                  <input
                    type="number"
                    value={selectedNode.config.duration || 30}
                    onChange={(e) => updateNodeConfig(selectedNode.id, 'duration', parseInt(e.target.value))}
                    className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {selectedNode.type === 'gmail' && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase block">Asunto de Correo</label>
                  <input
                    type="text"
                    value={selectedNode.config.subject || ''}
                    onChange={(e) => updateNodeConfig(selectedNode.id, 'subject', e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold uppercase block">Mensaje / Cuerpo</label>
                  <textarea
                    rows={4}
                    value={selectedNode.config.body || ''}
                    onChange={(e) => updateNodeConfig(selectedNode.id, 'body', e.target.value)}
                    className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600 leading-normal"
                  ></textarea>
                </div>
              </div>
            )}

            {selectedNode.type === 'webhook' && (
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase block">Webhook URL de Destino</label>
                <input
                  type="text"
                  placeholder="https://api.empresa.com/recruitment"
                  value={selectedNode.config.url || ''}
                  onChange={(e) => updateNodeConfig(selectedNode.id, 'url', e.target.value)}
                  className="w-full bg-slate-950 text-white text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>
            )}
            
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 space-y-2">
            <Settings className="w-10 h-10 mx-auto text-slate-850" />
            <p className="font-semibold text-xs text-slate-400">Inspector de Bloques</p>
            <p className="text-[10px] text-slate-600 leading-relaxed max-w-[200px] mx-auto">
              Selecciona o doble-cliquea un bloque en el lienzo para configurar sus parámetros de ejecución.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
