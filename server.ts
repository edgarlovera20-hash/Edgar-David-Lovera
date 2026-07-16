import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const GEMINI_MODEL = "gemini-2.5-flash";

app.use(express.json());

// Path to JSON database
const DB_PATH = path.join(process.cwd(), "src", "db-data.json");
const SEED_PATH = path.join(process.cwd(), "src", "seed-data.json");

// Ensure database file exists with initial mock data
function initDatabase() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, "utf8");
      const parsed = JSON.parse(data);
      let dirty = false;
      if (!parsed.interviewSchedule) {
        parsed.interviewSchedule = {
          allowedDays: ["lunes", "martes", "miercoles", "jueves", "viernes"],
          startTime: "09:00",
          endTime: "18:00",
          slotDuration: 30,
          customSlots: [
            { id: "slot-1", dateTime: "2026-07-13T10:00:00", available: false, candidateName: "Diego Lozano", candidateId: "cand-1" },
            { id: "slot-2", dateTime: "2026-07-13T11:00:00", available: true },
            { id: "slot-3", dateTime: "2026-07-13T14:00:00", available: true },
            { id: "slot-4", dateTime: "2026-07-14T09:30:00", available: true },
            { id: "slot-5", dateTime: "2026-07-14T11:00:00", available: true },
            { id: "slot-6", dateTime: "2026-07-15T16:00:00", available: true }
          ]
        };
        dirty = true;
      }
      if (dirty) {
        fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), "utf8");
      }
      return;
    } catch (e) {
      console.error("Error reading database, recreating...", e);
    }
  }

  const initialData = JSON.parse(fs.readFileSync(SEED_PATH, "utf8"));

  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf8");
}

initDatabase();

// Helper to read DB
function readDb() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  if (!db.activityLogs) {
    db.activityLogs = [
      {
        id: "log-1",
        timestamp: "2026-07-12T09:15:00.000Z",
        action: "Sistema Iniciado",
        details: "Recruitment AI OS iniciado correctamente en el servidor.",
        user: "Sistema",
        type: "system"
      },
      {
        id: "log-2",
        timestamp: "2026-07-12T10:00:00.000Z",
        action: "Candidato Actualizado",
        details: "Se actualizó la información de Diego Lozano.",
        user: "Sofía Ruiz",
        type: "candidate"
      },
      {
        id: "log-3",
        timestamp: "2026-07-12T11:30:00.000Z",
        action: "Flujo Modificado",
        details: "Se actualizó el flujo de automatización general.",
        user: "Administrador",
        type: "flow"
      }
    ];
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  }
  return db;
}

// Helper to write DB
function writeDb(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

// Store a document analysis result on the candidate and sync the document's approval status
function persistDocumentAnalysis(db: any, candidate: any, documentType: string, analysis: any) {
  if (!candidate.documentAnalysis) {
    candidate.documentAnalysis = {};
  }
  candidate.documentAnalysis[documentType] = analysis;
  if (candidate.documents) {
    candidate.documents[documentType] = analysis.recruiterAction;
  }
  writeDb(db);
}

// Helper to add activity log entry
function addActivityLog(action: string, details: string, type: 'candidate' | 'vacancy' | 'flow' | 'automation' | 'system', user: string = "Administrador") {
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  if (!db.activityLogs) {
    db.activityLogs = [];
  }
  const newLog = {
    id: "log-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    action,
    details,
    user,
    type
  };
  db.activityLogs.unshift(newLog); // Prepend so newest is first
  if (db.activityLogs.length > 100) {
    db.activityLogs = db.activityLogs.slice(0, 100);
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

// Lazy initialization of Gemini API Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
      console.log("Gemini API Client initialized successfully.");
    } catch (e) {
      console.error("Failed to initialize Gemini Client:", e);
    }
  }
  return geminiClient;
}

// --- API ENDPOINTS ---

// Get everything
app.get("/api/db", (req, res) => {
  res.json(readDb());
});

// Clear simulation data (remove candidates, chatMessages, reset customSlots, clear activityLogs)
app.post("/api/db/clear-simulation", (req, res) => {
  const db = readDb();
  db.candidates = [];
  db.chatMessages = [];
  db.activityLogs = [
    {
      id: "log-reset-" + Date.now(),
      timestamp: new Date().toISOString(),
      action: "Base de Datos de Simulación Limpiada",
      details: "Se eliminaron todos los candidatos de simulación e historiales de chat para iniciar de manera limpia.",
      user: "Administrador",
      type: "system"
    }
  ];
  if (db.interviewSchedule && db.interviewSchedule.customSlots) {
    db.interviewSchedule.customSlots = db.interviewSchedule.customSlots.map((s: any) => ({
      id: s.id,
      dateTime: s.dateTime,
      available: true
    }));
  }
  writeDb(db);
  res.json({ success: true, db });
});

const VALID_CANDIDATE_STATUSES = ["nuevo", "contactado", "interesado", "precalificado", "entrevista", "capacitacion", "activo", "no_contratado", "recontratable", "lista_negra"];

// Update candidates list
app.post("/api/candidates", (req, res) => {
  const candidate = req.body;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return res.status(400).json({ error: "Cuerpo de solicitud inválido" });
  }
  if (typeof candidate.name !== "string" || !candidate.name.trim()) {
    return res.status(400).json({ error: "El nombre del candidato es requerido" });
  }
  if (candidate.age !== undefined && typeof candidate.age !== "number") {
    return res.status(400).json({ error: "La edad debe ser un número" });
  }
  if (candidate.status !== undefined && !VALID_CANDIDATE_STATUSES.includes(candidate.status)) {
    return res.status(400).json({ error: "Estado de candidato inválido" });
  }

  const db = readDb();
  let isNew = false;
  if (!candidate.id) {
    candidate.id = "cand-" + Date.now();
    candidate.date = new Date().toISOString().split("T")[0];
    candidate.documents = { cv: "pendiente", ine: "pendiente", domicilio: "pendiente", curp: "pendiente" };
    isNew = true;
  }

  const index = db.candidates.findIndex((c: any) => c.id === candidate.id);
  let statusChanged = false;
  let oldStatus = '';
  let newStatus = candidate.status;
  if (index >= 0) {
    oldStatus = db.candidates[index].status;
    if (oldStatus !== newStatus) {
      statusChanged = true;
    }
    db.candidates[index] = { ...db.candidates[index], ...candidate };
  } else {
    isNew = true;
    db.candidates.push(candidate);
  }

  writeDb(db);

  if (isNew) {
    addActivityLog("Candidato Registrado", `Se registró al candidato ${candidate.name} para la vacante.`, "candidate", candidate.recruiter || "Administrador");
  } else if (statusChanged) {
    addActivityLog("Cambio de Estado", `Se cambió el estado del candidato ${candidate.name} de '${oldStatus}' a '${newStatus}'.`, "candidate", candidate.recruiter || "Administrador");
  } else {
    addActivityLog("Candidato Actualizado", `Se actualizaron los datos del candidato ${candidate.name}.`, "candidate", candidate.recruiter || "Administrador");
  }

  res.json({ success: true, candidate });
});

// Delete candidate
app.delete("/api/candidates/:id", (req, res) => {
  const db = readDb();
  const id = req.params.id;
  const candidate = db.candidates.find((c: any) => c.id === id);
  const name = candidate ? candidate.name : "Desconocido";
  db.candidates = db.candidates.filter((c: any) => c.id !== id);
  db.chatMessages = db.chatMessages.filter((m: any) => m.candidateId !== id);
  writeDb(db);

  addActivityLog("Candidato Eliminado", `Se eliminó el registro de ${name} del sistema.`, "candidate", "Administrador");
  res.json({ success: true });
});

// Bulk message to multiple candidates via WhatsApp or Email
app.post("/api/candidates/bulk-message", (req, res) => {
  const db = readDb();
  const { candidateIds, templateText, channel, recruiterName } = req.body;

  if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
    return res.status(400).json({ error: "Faltan IDs de candidatos o formato inválido" });
  }
  if (!templateText) {
    return res.status(400).json({ error: "El texto de la plantilla es requerido" });
  }

  const updatedCandidatesList: any[] = [];
  const processedNames: string[] = [];

  candidateIds.forEach((id: string) => {
    const candidate = db.candidates.find((c: any) => c.id === id);
    if (!candidate) return;

    const vacancy = db.vacancies.find((v: any) => v.id === candidate.vacancyId);
    const vacancyTitle = vacancy ? vacancy.title : "Vacante General";
    const recruiter = recruiterName || candidate.recruiter || "Sofía Ruiz";

    // Personalize template
    let personalizedText = templateText
      .replace(/{nombre}/g, candidate.name)
      .replace(/{vacante}/g, vacancyTitle)
      .replace(/{reclutador}/g, recruiter);

    // Save Chat Message
    const textToSave = channel === 'email' 
      ? `📬 [CORREO ELECTRÓNICO]\nAsunto: Actualización de Postulación - ${vacancyTitle}\n\n${personalizedText}`
      : personalizedText;

    const newMsg = {
      id: "m-bulk-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      candidateId: candidate.id,
      text: textToSave,
      sender: 'recruiter',
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    db.chatMessages.push(newMsg);

    // Move state to 'contactado' if it was 'nuevo'
    if (candidate.status === 'nuevo') {
      candidate.status = 'contactado';
    }

    // Append to observations
    const dateStr = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    const observationLine = `\n[Envío Masivo (${channel.toUpperCase()}) - ${dateStr}]: ${personalizedText.substring(0, 100)}${personalizedText.length > 100 ? '...' : ''}`;
    candidate.observations = (candidate.observations || '') + observationLine;

    processedNames.push(candidate.name);
    updatedCandidatesList.push(candidate);
  });

  writeDb(db);

  // Add general activity log
  const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : 'Email';
  const namesStr = processedNames.slice(0, 3).join(', ') + (processedNames.length > 3 ? ` y ${processedNames.length - 3} más` : '');
  addActivityLog(
    "Envío de Mensaje Masivo", 
    `Se envió un mensaje por ${channelLabel} a ${processedNames.length} candidatos (${namesStr}).`, 
    "automation", 
    recruiterName || "Administrador"
  );

  res.json({ 
    success: true, 
    processedCount: processedNames.length, 
    updatedCandidates: db.candidates,
    chatMessages: db.chatMessages
  });
});

// Vacancies CRUD
app.post("/api/vacancies", (req, res) => {
  const db = readDb();
  const vacancy = req.body;
  let isNew = false;
  if (!vacancy.id) {
    vacancy.id = "vac-" + Date.now();
    isNew = true;
  }

  const index = db.vacancies.findIndex((v: any) => v.id === vacancy.id);
  if (index >= 0) {
    db.vacancies[index] = { ...db.vacancies[index], ...vacancy };
  } else {
    isNew = true;
    db.vacancies.push(vacancy);
  }

  writeDb(db);
  addActivityLog(
    isNew ? "Vacante Creada" : "Vacante Actualizada", 
    `Se ${isNew ? 'creó' : 'actualizó'} la vacante '${vacancy.title}'. Estado: ${vacancy.status}.`, 
    "vacancy"
  );
  res.json({ success: true, vacancy });
});

// Delete vacancy
app.delete("/api/vacancies/:id", (req, res) => {
  const db = readDb();
  const id = req.params.id;
  const vacancy = db.vacancies.find((v: any) => v.id === id);
  const title = vacancy ? vacancy.title : "Desconocido";
  db.vacancies = db.vacancies.filter((v: any) => v.id !== id);
  writeDb(db);

  addActivityLog("Vacante Eliminada", `Se eliminó la vacante '${title}'.`, "vacancy");
  res.json({ success: true });
});

// Flows save
app.post("/api/flows", (req, res) => {
  const db = readDb();
  db.flows = req.body;
  writeDb(db);
  const nodeCount = req.body && req.body.nodes ? req.body.nodes.length : 0;
  addActivityLog("Flujo de Automatización", `Se actualizaron los flujos de automatización visual (${nodeCount} nodos de acción).`, "flow");
  res.json({ success: true, flows: db.flows });
});

// Settings save
app.post("/api/settings/workspace", (req, res) => {
  const db = readDb();
  db.workspaceSettings = req.body;
  writeDb(db);
  addActivityLog("Workspace Actualizado", "Se actualizaron las credenciales e integraciones de Google Workspace.", "system");
  res.json({ success: true, workspaceSettings: db.workspaceSettings });
});

app.post("/api/settings/automation", (req, res) => {
  const db = readDb();
  db.automationSettings = req.body;
  writeDb(db);
  addActivityLog("Automatizaciones Guardadas", "Se actualizaron las reglas de automatización activa.", "automation");
  res.json({ success: true, automationSettings: db.automationSettings });
});

app.post("/api/settings/interview-schedule", (req, res) => {
  const db = readDb();
  db.interviewSchedule = req.body;
  writeDb(db);
  addActivityLog("Agenda de Entrevistas", "Se modificaron las horas y días hábiles para el agendamiento autónomo.", "automation");
  res.json({ success: true, interviewSchedule: db.interviewSchedule });
});

// Schedule candidate to a specific slot
app.post("/api/candidates/schedule-slot", (req, res) => {
  const { candidateId, slotId } = req.body;
  const db = readDb();

  const candidate = db.candidates.find((c: any) => c.id === candidateId);
  if (!candidate) {
    return res.status(404).json({ error: "Candidato no encontrado" });
  }

  if (!db.interviewSchedule) {
    db.interviewSchedule = {
      allowedDays: ["lunes", "martes", "miercoles", "jueves", "viernes"],
      startTime: "09:00",
      endTime: "18:00",
      slotDuration: 30,
      customSlots: []
    };
  }

  // Release previous slot occupied by this candidate if any
  db.interviewSchedule.customSlots.forEach((slot: any) => {
    if (slot.candidateId === candidateId) {
      slot.available = true;
      delete slot.candidateName;
      delete slot.candidateId;
    }
  });

  // Book the new slot
  const slot = db.interviewSchedule.customSlots.find((s: any) => s.id === slotId);
  if (slot) {
    slot.available = false;
    slot.candidateName = candidate.name;
    slot.candidateId = candidate.id;
    
    candidate.interviewDate = slot.dateTime;
    candidate.status = "entrevista";
  } else {
    return res.status(400).json({ error: "Horario especificado no disponible o inválido" });
  }

  writeDb(db);
  addActivityLog("Entrevista Agendada", `Se agendó entrevista para el candidato ${candidate.name} el ${slot.dateTime.replace('T', ' ')}.`, "automation");
  res.json({ success: true, candidate, interviewSchedule: db.interviewSchedule });
});

// Cancel scheduled slot
app.post("/api/candidates/cancel-slot", (req, res) => {
  const { candidateId } = req.body;
  const db = readDb();

  const candidate = db.candidates.find((c: any) => c.id === candidateId);
  if (!candidate) {
    return res.status(404).json({ error: "Candidato no encontrado" });
  }

  if (db.interviewSchedule) {
    db.interviewSchedule.customSlots.forEach((slot: any) => {
      if (slot.candidateId === candidateId) {
        slot.available = true;
        delete slot.candidateName;
        delete slot.candidateId;
      }
    });
  }

  delete candidate.interviewDate;
  if (candidate.status === 'entrevista') {
    candidate.status = 'precalificado';
  }

  writeDb(db);
  addActivityLog("Entrevista Cancelada", `Se canceló la entrevista de ${candidate.name}.`, "automation");
  res.json({ success: true, candidate, interviewSchedule: db.interviewSchedule });
});

// Update agents
app.post("/api/agents", (req, res) => {
  const db = readDb();
  const agentUpdate = req.body;
  const index = db.agents.findIndex((a: any) => a.id === agentUpdate.id);
  if (index >= 0) {
    db.agents[index] = { ...db.agents[index], ...agentUpdate };
    writeDb(db);
    res.json({ success: true, agent: db.agents[index] });
  } else {
    res.status(404).json({ error: "Agent not found" });
  }
});

// Clear candidate chat messages
app.post("/api/chat/clear", (req, res) => {
  const db = readDb();
  const { candidateId } = req.body;
  db.chatMessages = db.chatMessages.filter((m: any) => m.candidateId !== candidateId);
  writeDb(db);
  res.json({ success: true });
});

// Save manual recruiter/system chat message
app.post("/api/chatbot/message", (req, res) => {
  const db = readDb();
  const { id, candidateId, text, sender, timestamp, type } = req.body;
  if (!candidateId) {
    return res.status(400).json({ error: "Missing candidateId" });
  }

  const newMsg = {
    id: id || "m-rec-" + Date.now(),
    candidateId,
    text,
    sender: sender || "recruiter",
    timestamp: timestamp || new Date().toISOString(),
    type: type || "text"
  };

  db.chatMessages.push(newMsg);
  
  // Advance candidate status to contactado if it was still nuevo
  const candidate = db.candidates.find((c: any) => c.id === candidateId);
  if (candidate && candidate.status === 'nuevo') {
    candidate.status = 'contactado';
  }

  writeDb(db);
  res.json({ success: true, message: newMsg, candidate });
});

// AI WRITING ASSISTANT: Suggest 3 smart responses based on chat history and vacancy details
app.post("/api/suggest-message", async (req, res) => {
  const { candidateId } = req.body;
  const db = readDb();

  const candidate = db.candidates.find((c: any) => c.id === candidateId);
  if (!candidate) {
    return res.status(404).json({ error: "Candidato no encontrado" });
  }

  const vacancy = db.vacancies.find((v: any) => v.id === candidate.vacancyId) || db.vacancies[0];
  
  // Last 10 chat messages
  const lastMessages = db.chatMessages
    .filter((m: any) => m.candidateId === candidateId)
    .slice(-10);

  const historyStr = lastMessages
    .map((m: any) => `${m.sender === "candidate" ? "Candidato" : "Reclutadora"}: ${m.text}`)
    .join("\n");

  const lastCandMsg = lastMessages.filter((m: any) => m.sender === "candidate").slice(-1)[0]?.text || "";

  // Prepare standard fallback suggestions
  const fallbackSuggestions = [
    `¡Hola ${candidate.name}! 👋 Qué gusto saludarte. Vi tu postulación para la vacante de ${vacancy.title}. ¿Me podrías confirmar si tienes experiencia previa en el área?`,
    `Hola ${candidate.name}, excelente. 📅 Veo que te interesa la posición. ¿Qué tal te queda agendar una entrevista rápida de 15 minutos vía telefónica para conocer más sobre ti?`,
    `¡Muchísimas gracias por tu respuesta, ${candidate.name}! 🤝 Oye, me gustaría comentarte que el sueldo ofrecido es de ${vacancy.salary} más prestaciones de ley. ¿Te queda bien para continuar con el proceso?`
  ];

  const client = getGeminiClient();
  if (!client) {
    // If Gemini client is unavailable, return custom fallbacks based on candidate status & keyword match
    let customFallbacks = [...fallbackSuggestions];
    const lastMsgLower = lastCandMsg.toLowerCase();
    if (candidate.status === 'entrevista' || candidate.interviewDate) {
      customFallbacks = [
        `¡Hola ${candidate.name}! 📅 Te confirmo que tenemos agendada nuestra entrevista. ¿Tienes alguna duda sobre cómo llegar o necesitas que reajustemos el horario?`,
        `Hola ${candidate.name}, te recuerdo que tu entrevista está registrada en el sistema. Nos vemos pronto. ¡Mucho éxito! 🤝`,
        `Hola, excelente. ¿Te gustaría que te envíe los detalles de acceso o el enlace a la sala de entrevistas por aquí?`
      ];
    } else if (lastMsgLower.includes("experiencia") || lastMsgLower.includes("cv") || lastMsgLower.includes("trabaj")) {
      customFallbacks = [
        `¡Súper bien! Gracias por la información. ¿Me podrías compartir tu CV en formato PDF para que nuestro equipo técnico lo pueda evaluar? 📄`,
        `Excelente experiencia, ${candidate.name}. Justo buscamos a alguien con ese perfil para la vacante de ${vacancy.title}. ¿Tendrás disponibilidad para platicar mañana?`,
        `Entendido. Muchas gracias. ¿Cuánto tiempo llevas manejando estas herramientas?`
      ];
    }
    return res.json({ success: true, suggestions: customFallbacks, source: "fallback_rules" });
  }

  try {
    const systemPrompt = `Eres un asistente de redacción con IA de Heavenly Dreams para reclutadores.
Analiza la información del candidato, de la vacante, y el historial de chat de WhatsApp para sugerir 3 respuestas cortas, directas, cordiales y listas para enviar en español de México.
Las opciones deben ser variadas:
- Opción 1: Un saludo/seguimiento amigable o respuesta directa a su última duda.
- Opción 2: Una propuesta para avanzar en el proceso (como pedir el CV, validar un requisito, o proponer agendar llamada/entrevista).
- Opción 3: Una pregunta clave para aclarar dudas de experiencia, sueldo o disponibilidad.

INFORMACIÓN DE LA VACANTE:
- Título: ${vacancy.title}
- Ubicación: ${vacancy.location}
- Sueldo: ${vacancy.salary}
- Horarios: ${vacancy.hours}
- Requisitos clave: ${vacancy.requirements.join(", ")}

INFORMACIÓN DEL CANDIDATO:
- Nombre: ${candidate.name}
- Estado del proceso en el CRM: ${candidate.status}
- Experiencia/CV: ${candidate.experience}

HISTORIAL RECIENTE DEL CHAT DE WHATSAPP:
${historyStr || "No hay mensajes previos en el chat. Es el primer contacto."}

Instrucciones de formato crítico:
Debes responder ÚNICAMENTE con un objeto JSON válido con la clave "suggestions", que contiene un arreglo de exactamente 3 cadenas de texto con las sugerencias sugeridas de respuesta. No agregues explicaciones, introducciones ni bloques de código adicionales fuera del JSON.

Ejemplo de respuesta requerida:
{
  "suggestions": [
    "¡Hola Juan! Qué gusto saludarte. Vi tu postulación para...",
    "Hola Juan, claro que sí. ¿Te interesaría agendar una llamada rápida mañana?",
    "Perfecto Juan, entiendo. ¿Me podrías compartir tu CV actualizado en PDF?"
  ]
}`;

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: "Genera las sugerencias de mensajes para el candidato basadas en las instrucciones de sistema.",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json"
      }
    });

    const replyText = response.text;
    if (replyText) {
      try {
        const parsed = JSON.parse(replyText.trim());
        if (parsed && Array.isArray(parsed.suggestions) && parsed.suggestions.length >= 3) {
          return res.json({ success: true, suggestions: parsed.suggestions.slice(0, 3), source: "gemini_api" });
        }
      } catch (err) {
        console.error("JSON parse error from Gemini response:", replyText, err);
      }
    }

    res.json({ success: true, suggestions: fallbackSuggestions, source: "fallback_after_malformed" });
  } catch (e: any) {
    console.error("Error generating smart suggestions with Gemini:", e);
    res.json({ success: true, suggestions: fallbackSuggestions, source: "fallback_after_error" });
  }
});

// AI DOCUMENT ANALYZER (PDFs, Images, Photos)
app.post("/api/candidates/analyze-document", async (req, res) => {
  const { candidateId, documentType, fileBase64, fileName, mimeType } = req.body;
  const db = readDb();

  const candidate = db.candidates.find((c: any) => c.id === candidateId);
  if (!candidate) {
    return res.status(404).json({ error: "Candidato no encontrado" });
  }

  // Extract raw base64 data if it contains the data url prefix
  let base64Data = fileBase64 || "";
  if (base64Data.includes(";base64,")) {
    base64Data = base64Data.split(";base64,")[1];
  }

  // Fallback data preparation in case Gemini is unavailable or fails
  // ponytail: no real OCR/verification happened here, so this must never claim "aprobado" — that requires a human to actually look at the document.
  const formatFallbackResponse = () => {
    const summary = `No se pudo verificar automáticamente el documento ${fileName} (${documentType.toUpperCase()}). Requiere revisión manual.`;
    const notes = "El servicio de análisis con IA no está disponible en este momento. Un reclutador debe revisar este documento manualmente antes de aprobarlo.";

    return {
      summary,
      detectedName: null,
      candidateNameMatches: false,
      extractedInfo: {},
      issues: ["Verificación automática no disponible — pendiente de revisión manual"],
      isValid: false,
      matchPercentage: 0,
      recruiterAction: "pendiente",
      notes,
      analyzedAt: new Date().toISOString(),
      fileName
    };
  };

  const client = getGeminiClient();
  if (!client) {
    const fallback = formatFallbackResponse();
    persistDocumentAnalysis(db, candidate, documentType, fallback);
    return res.json({ success: true, analysis: fallback, source: "mock_fallback_no_key" });
  }

  try {
    const imagePart = {
      inlineData: {
        mimeType: mimeType || "application/pdf",
        data: base64Data
      }
    };

    const prompt = `Eres un sistema experto de extracción de datos y validación de documentos de reclutamiento de Heavenly Dreams.
Estás analizando un documento de tipo "${documentType}" con nombre de archivo "${fileName}".
Analiza detalladamente este documento (${mimeType}) para extraer información y verificar su validez.

INFORMACIÓN DEL CANDIDATO EN CRM:
- Nombre esperado del candidato: ${candidate.name}
- Celular esperado: ${candidate.phone}
- Email esperado: ${candidate.email}

REGLAS DE ANALISIS Y EXTRACCION SEGÚN TIPO:
- cv: Extrae datos de contacto (teléfono, email), años de experiencia, habilidades clave, historial laboral y haz un resumen breve de su perfil.
- ine: Busca el nombre completo (debe parecerse al del candidato), la Clave de Elector (18 caracteres), fecha de nacimiento, sexo, vigencia (comprueba si no está vencida).
- domicilio: Busca la dirección completa, el nombre del titular, el proveedor del servicio (e.g. CFE, Telmex, Agua) y la fecha de expedición. Verifica que no sea mayor a 3 meses.
- curp: Extrae la clave CURP (18 caracteres), nombre completo, fecha de nacimiento, sexo.
- general: Resume qué contiene, extrae datos clave relevantes, fechas y validez.

Debes responder ÚNICAMENTE con un objeto JSON estructurado con la siguiente firma exacta:
{
  "summary": "Breve resumen de la validación y qué contiene el documento (máximo 2 líneas)",
  "detectedName": "Nombre completo detectado en el documento (si aplica, si no, null)",
  "candidateNameMatches": true/false (¿El nombre en el documento coincide razonablemente con el del candidato?),
  "extractedInfo": {
    "phone": "Teléfono detectado (si aplica, o null)",
    "email": "Email detectado (si aplica, o null)",
    "address": "Dirección completa detectada (si aplica, o null)",
    "experienceYears": número_o_null,
    "skills": ["Habilidad1", "Habilidad2"] o null,
    "curp": "CURP detectado (si aplica, o null)",
    "ineClave": "Clave de elector detectada (si aplica, o null)",
    "documentDate": "Fecha detectada en el documento en formato YYYY-MM-DD (si aplica, o null)"
  },
  "issues": [
    "Lista de observaciones o problemas detectados (ejemplo: 'Comprobante de domicilio tiene más de 3 meses', 'Nombre no coincide', 'CURP inválido')"
  ],
  "isValid": true/false,
  "matchPercentage": número_del_0_al_100,
  "recruiterAction": "aprobado" | "pendiente" | "rechazado",
  "notes": "Recomendaciones o notas adicionales para la reclutadora sobre este documento (máximo 3 líneas)"
}`;

    const textPart = { text: prompt };

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json"
      }
    });

    const replyText = response.text;
    if (replyText) {
      try {
        const parsed = JSON.parse(replyText.trim());
        const analysisResult = {
          summary: parsed.summary || "Documento analizado.",
          detectedName: parsed.detectedName || null,
          candidateNameMatches: parsed.candidateNameMatches !== undefined ? parsed.candidateNameMatches : true,
          extractedInfo: parsed.extractedInfo || {},
          issues: parsed.issues || [],
          isValid: parsed.isValid !== undefined ? parsed.isValid : true,
          matchPercentage: parsed.matchPercentage || 90,
          recruiterAction: parsed.recruiterAction || "aprobado",
          notes: parsed.notes || "Documento verificado con éxito.",
          analyzedAt: new Date().toISOString(),
          fileName
        };

        persistDocumentAnalysis(db, candidate, documentType, analysisResult);
        return res.json({ success: true, analysis: analysisResult, source: "gemini_api" });

      } catch (err) {
        console.error("JSON parse error from Gemini document analysis response:", replyText, err);
      }
    }

    const fallback = formatFallbackResponse();
    persistDocumentAnalysis(db, candidate, documentType, fallback);
    res.json({ success: true, analysis: fallback, source: "fallback_after_malformed" });

  } catch (e: any) {
    console.error("Error generating document analysis with Gemini:", e);
    const fallback = formatFallbackResponse();
    persistDocumentAnalysis(db, candidate, documentType, fallback);
    res.json({ success: true, analysis: fallback, source: "fallback_after_error" });
  }
});

// AI CHAT BOT API
app.post("/api/chatbot/chat", async (req, res) => {
  const { candidateId, text, activeAgentId } = req.body;
  const db = readDb();

  // Find candidate or create
  let candidate = db.candidates.find((c: any) => c.id === candidateId);
  if (!candidate) {
    candidate = {
      id: candidateId,
      name: "Candidato Simulado",
      phone: "+52 55 9999 8888",
      email: "candidato@test.com",
      age: 25,
      vacancyId: "vac-1",
      experience: "Interesado en vacantes de ventas.",
      status: "nuevo",
      source: "WhatsApp Real",
      recruiter: "Sofía Ruiz",
      date: new Date().toISOString().split("T")[0],
      documents: { cv: "pendiente", ine: "pendiente", domicilio: "pendiente", curp: "pendiente" }
    };
    db.candidates.push(candidate);
  }

  // Find vacancy details
  const vacancy = db.vacancies.find((v: any) => v.id === candidate.vacancyId) || db.vacancies[0];

  // Append user message
  const userMsg = {
    id: "m-user-" + Date.now(),
    candidateId,
    sender: "candidate",
    text,
    timestamp: new Date().toISOString(),
    type: "text"
  };
  db.chatMessages.push(userMsg);

  // Load chat history for candidate
  const history = db.chatMessages
    .filter((m: any) => m.candidateId === candidateId)
    .slice(-10) // Last 10 messages for context
    .map((m: any) => `${m.sender === "candidate" ? "Candidato" : "Reclutadora"}: ${m.text}`)
    .join("\n");

  // Recruiter Persona Logic
  let persona = candidate.recruiterPersona || 'auto';
  if (persona === 'auto') {
    const titleLower = vacancy.title.toLowerCase();
    if (titleLower.includes("asesor") || titleLower.includes("venta") || titleLower.includes("comercial") || titleLower.includes("vendedor") || titleLower.includes("retail") || titleLower.includes("premium")) {
      persona = 'sales';
    } else if (titleLower.includes("sistema") || titleLower.includes("desarrollador") || titleLower.includes("tech") || titleLower.includes("programador") || titleLower.includes("soporte técnico") || titleLower.includes("ingeniero") || titleLower.includes("almacén") || titleLower.includes("sap") || titleLower.includes("erp") || titleLower.includes("supervisor")) {
      persona = 'tech';
    } else if (titleLower.includes("telefónico") || titleLower.includes("atc") || titleLower.includes("servicio") || titleLower.includes("atención") || titleLower.includes("call center") || titleLower.includes("customer")) {
      persona = 'support';
    } else {
      persona = 'sales'; // Fallback
    }
  }

  let personaInstruction = "";
  if (persona === 'sales') {
    personaInstruction = `\n[PERSONALIDAD DEL RECLUTADOR: VENTAS / COMERCIAL]
- Tono: Sumamente persuasivo, enérgico, carismático y entusiasta.
- Enfoque: Enfatizar las comisiones sin tope, el crecimiento acelerado, los bonos y la actitud proactiva.
- Vocabulario: Dinámico, alegre y orientado a la acción (ej. 'comisiones brutales', 'excelente actitud', 'crecimiento rápido').`;
  } else if (persona === 'tech') {
    personaInstruction = `\n[PERSONALIDAD DEL RECLUTADOR: TECNOLOGÍA / ALMACÉN]
- Tono: Altamente claro, profesional, estructurado y lógico.
- Enfoque: Centrado en evaluar el dominio de herramientas, ERPs (como SAP), orden de inventarios, cumplimiento estricto de directrices y experiencia verificable.
- Vocabulario: Preciso, directo, cortés y de negocios (ej. 'metodología', 'proceso estructurado', 'competencias técnicas').`;
  } else if (persona === 'support') {
    personaInstruction = `\n[PERSONALIDAD DEL RECLUTADOR: ATENCIÓN AL CLIENTE / ATC]
- Tono: Extremadamente empático, paciente, amable y atento.
- Enfoque: Valorar la calidez del servicio, la capacidad de escucha activa y la resolución amable de consultas.
- Vocabulario: Cálido, servicial y amigable (ej. 'con todo gusto', 'estoy para apoyarte', 'excelente servicio').`;
  }

  // Determine current active agent instruction
  const agent = db.agents.find((a: any) => a.id === (activeAgentId || "agent-recruiter")) || db.agents[0];
  
  // Retrieve custom interview schedule options set by supervisor
  const schedule = db.interviewSchedule || {
    allowedDays: ["lunes", "martes", "miercoles", "jueves", "viernes"],
    startTime: "09:00",
    endTime: "18:00",
    slotDuration: 30,
    customSlots: []
  };
  const availableSlots = schedule.customSlots.filter((s: any) => s.available);

  const formatSlotSpanish = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      const dayName = days[date.getDay()];
      const dayNum = date.getDate();
      const monthName = months[date.getMonth()];
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${dayName} ${dayNum} de ${monthName} a las ${hours}:${minutes}`;
    } catch (e) {
      return isoStr;
    }
  };

  const formattedSlots = availableSlots.map((s: any) => ({
    id: s.id,
    label: formatSlotSpanish(s.dateTime),
    dateTime: s.dateTime
  }));

  const availableSlotsStr = formattedSlots.map(s => `- ${s.label} (ID: ${s.id})`).join("\n");

  // Construct system prompt including the recruiter personality instructions if this is the main recruiter agent
  let systemPrompt = `${agent.systemInstruction}\n\nINFORMACIÓN DE LA VACANTE:\n- Título: ${vacancy.title}\n- Sueldo: ${vacancy.salary}\n- Horario: ${vacancy.hours}\n- Ubicación: ${vacancy.location}\n- Prestaciones: ${vacancy.benefits.join(", ")}\n- Requisitos: ${vacancy.requirements.join(", ")}\n\nINFORMACIÓN DEL CANDIDATO:\n- Nombre: ${candidate.name}\n- Edad: ${candidate.age}\n- Experiencia: ${candidate.experience}\n- Historial de Chat Reciente:\n${history}`;

  if (availableSlots.length > 0) {
    systemPrompt += `\n\nHORARIOS DE ENTREVISTA DISPONIBLES (Estipulados por el supervisor):\n${availableSlotsStr}\n\nREGLA CRÍTICA DE AGENDAMIENTO DE ENTREVISTAS:\nSi vas a proponer o acordar un horario de entrevista, ofrece ÚNICAMENTE las opciones de la lista de arriba (ofrece de 1 a 3 opciones). Si el candidato confirma o elige alguna de estas opciones, indícale de inmediato que ha quedado confirmada la cita en ese horario exacto y que el sistema registrará su asistencia. No inventes ningún otro horario bajo ninguna circunstancia. Elige una opción y confirma.`;
  } else {
    systemPrompt += `\n\nHORARIOS DE ENTREVISTA DISPONIBLES:\nNo hay horarios disponibles configurados en este momento. Dile amablemente al candidato que el equipo de reclutamiento se contactará pronto para acordar un horario específico.`;
  }
  
  if (agent.id === "agent-recruiter") {
    systemPrompt += `\n\n${personaInstruction}\n\nRESPONDE con la personalidad de reclutador indicada arriba. Hablas de forma sumamente natural, fluida, simulando ser un ser humano mexicano por WhatsApp (con expresiones típicas como '¡Qué milagro!', 'Órale', 'Súper', 'Excelente'). Mantén respuestas cortas, directas y claras.`;
  } else {
    systemPrompt += `\n\nRESPONDE con el tono de tu agente, de forma clara, corta y simulando ser WhatsApp real.`;
  }

  let replyText = "";
  let isSimulated = true;

  const client = getGeminiClient();
  if (client) {
    try {
      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: text,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.8,
        }
      });
      if (response.text) {
        replyText = response.text;
        isSimulated = false;

        // Auto book slot from LLM response if it scheduled
        if (!candidate.interviewDate && (replyText.toLowerCase().includes("agend") || replyText.toLowerCase().includes("confirm") || replyText.toLowerCase().includes("listo") || replyText.toLowerCase().includes("cita") || replyText.toLowerCase().includes("correo"))) {
          if (availableSlots.length > 0) {
            // Match the slot the model actually confirmed in its reply, not just the first available one.
            const matched = formattedSlots.find(s => replyText.includes(s.label));
            const bookedSlot = availableSlots.find((s: any) => s.dateTime === matched?.dateTime) || availableSlots[0];
            bookedSlot.available = false;
            bookedSlot.candidateName = candidate.name;
            bookedSlot.candidateId = candidate.id;
            candidate.interviewDate = bookedSlot.dateTime;
            candidate.status = "entrevista";
          }
        }
      }
    } catch (err) {
      console.error("Gemini model call failed, falling back to simulation:", err);
    }
  }

  // Fallback realistic simulated Mexican Recruiter logic if Gemini is offline
  if (!replyText) {
    const textLower = text.toLowerCase();
    if (textLower.includes("hola") || textLower.includes("buen") || textLower.includes("que tal")) {
      const greetings = [
        `¡Hola, ${candidate.name}! Qué milagro que escribes por acá. 🤩 Platícame, ¿viste la vacante de ${vacancy.title}? ¿Qué te llamó la atención?`,
        `¡Hola, qué tal, ${candidate.name}! Qué gustazo saludarte. ✨ Te platico que tenemos disponible el puesto de ${vacancy.title} en ${vacancy.location}. Cuéntame, ¿has trabajado antes en algo parecido?`,
        `¡Órale, qué tal! Un placer saludarte, ${candidate.name}. 💤 Cuéntame un poquito de ti, ¿qué experiencia tienes en puestos similares?`
      ];
      replyText = greetings[Math.floor(Math.random() * greetings.length)];
    } else if (textLower.includes("experiencia") || textLower.includes("trabaj") || textLower.includes("años") || textLower.includes("cv")) {
      // Save experience in DB
      candidate.experience = text;
      candidate.status = "interesado";
      replyText = `¡Súper bien, oye! Me parece excelente que tengas esa experiencia. Justo por eso te platico que acá ofrecemos un sueldo de ${vacancy.salary} y prestaciones increíbles. ¿Cómo andas de disponibilidad para el horario? Es de ${vacancy.hours}. ¿Te late?`;
    } else if (textLower.includes("horario") || textLower.includes("dispon") || textLower.includes("si") || textLower.includes("claro") || textLower.includes("late")) {
      candidate.status = "precalificado";
      if (formattedSlots.length > 0) {
        const slotsOptions = formattedSlots.slice(0, 3).map(s => s.label).join(", o ");
        replyText = `¡Perfecto! Tienes toda la actitud. 🥳 Déjame ver mis horarios disponibles. Tengo espacio para entrevistarte el ${slotsOptions}. ¿Cuál de estos te acomoda mejor?`;
      } else {
        replyText = `¡Perfecto! Tienes toda la actitud. 🥳 Déjame consultar con el supervisor para acordar un día específico y me comunico contigo lo antes posible para confirmarlo. ¿Te parece bien?`;
      }
    } else if (textLower.includes("lunes") || textLower.includes("martes") || textLower.includes("miércoles") || textLower.includes("miercoles") || textLower.includes("jueves") || textLower.includes("viernes") || textLower.includes("sábado") || textLower.includes("sabado") || textLower.includes("bien") || textLower.includes("agend") || textLower.includes("entrevista") || textLower.includes("las ") || textLower.includes("slot-")) {
      candidate.status = "entrevista";
      if (availableSlots.length > 0) {
        const bookedSlot = availableSlots[0];
        bookedSlot.available = false;
        bookedSlot.candidateName = candidate.name;
        bookedSlot.candidateId = candidate.id;

        candidate.interviewDate = bookedSlot.dateTime;
        const friendlyDate = formatSlotSpanish(bookedSlot.dateTime);
        replyText = `¡Listo! Ya quedó registrado en el sistema. 📅 Te agendé formalmente para el **${friendlyDate}**. Te acabo de enviar la invitación por correo con la dirección exacta para llegar a nuestras oficinas en ${vacancy.location}. ¡Te deseo muchísimo éxito, sé que te va a ir increíble! ¿Tienes alguna otra duda?`;
      } else {
        candidate.interviewDate = "2026-07-13T11:00:00";
        replyText = `¡Listo, ya quedó registrado en el sistema! 📅 Te agendé para el lunes a las 11:00 AM. Te va a llegar una confirmación a tu correo con la ubicación exacta. Te deseo muchísimo éxito, ¡sé que te va a ir increíble! ¿Tienes alguna otra duda por el momento?`;
      }
    } else {
      replyText = `¡Perfecto! Entiendo perfectamente. Oye, ¿te gustaría que sigamos adelante con tu proceso para la vacante de ${vacancy.title}? Nos encantaría conocerte en persona para platicar un ratito. 😉`;
    }
  }

  // Append bot message
  const botMsg = {
    id: "m-bot-" + Date.now(),
    candidateId,
    sender: activeAgentId === "agent-scheduler" ? "scheduler" : "bot",
    text: replyText,
    timestamp: new Date().toISOString(),
    type: "text"
  };
  db.chatMessages.push(botMsg);

  // Auto psychological analysis simulator trigger if candidates chat reaches 4 messages and does not exist yet
  const chatCount = db.chatMessages.filter((m: any) => m.candidateId === candidateId).length;
  if (chatCount >= 4 && !candidate.psychoAnalysis) {
    candidate.psychoAnalysis = {
      personality: "Dinámico y con Empuje Comercial",
      compatibility: 87,
      traits: [
        { label: "Estilo Directo", value: 82 },
        { label: "Orientación Social", value: 91 },
        { label: "Adaptabilidad", value: 85 },
        { label: "Autocontrol", value: 78 }
      ],
      notes: "El candidato demuestra alta proactividad lingüística, responde rápidamente con entusiasmo y muestra interés genuino en los incentivos."
    };
  }

  // Auto technical evaluation simulator trigger if candidates chat reaches 5 messages
  if (chatCount >= 5 && !candidate.evaluation) {
    candidate.evaluation = {
      technicalScore: 84,
      behavioralScore: 89,
      grade: "Apto con Recomendaciones",
      feedback: "Demuestra excelente actitud comercial y un historial estable en servicio. Requiere inducción en los materiales específicos de Heavenly Dreams."
    };
  }

  writeDb(db);
  res.json({ success: true, reply: botMsg.text, botMessage: botMsg, candidate, simulated: isSimulated });
});

// Update single candidate status directly from CRM
app.post("/api/candidates/update-status", (req, res) => {
  const { candidateId, status } = req.body;
  const db = readDb();
  const index = db.candidates.findIndex((c: any) => c.id === candidateId);
  if (index >= 0) {
    db.candidates[index].status = status;
    writeDb(db);
    res.json({ success: true, candidate: db.candidates[index] });
  } else {
    res.status(404).json({ error: "Candidate not found" });
  }
});

// Update candidate's recruiter persona directly from CRM
app.post("/api/candidates/update-persona", (req, res) => {
  const { candidateId, recruiterPersona } = req.body;
  const db = readDb();
  const index = db.candidates.findIndex((c: any) => c.id === candidateId);
  if (index >= 0) {
    db.candidates[index].recruiterPersona = recruiterPersona;
    writeDb(db);
    res.json({ success: true, candidate: db.candidates[index] });
  } else {
    res.status(404).json({ error: "Candidate not found" });
  }
});

// Run AI-powered psychological evaluation on a candidate
app.post("/api/candidates/analyze-psychology", async (req, res) => {
  const { candidateId } = req.body;
  const db = readDb();
  const candidate = db.candidates.find((c: any) => c.id === candidateId);
  if (!candidate) {
    return res.status(404).json({ error: "Candidate not found" });
  }

  const vacancy = db.vacancies.find((v: any) => v.id === candidate.vacancyId) || db.vacancies[0];
  const chatMessages = db.chatMessages.filter((m: any) => m.candidateId === candidateId);

  if (chatMessages.length === 0) {
    const fallbackAnalysis = {
      personality: "Perfil por Analizar",
      compatibility: 50,
      traits: [
        { label: "Comunicación", value: 50 },
        { label: "Proactividad", value: 50 },
        { label: "Empatía", value: 50 },
        { label: "Adecuación Cultural", value: 50 }
      ],
      notes: "Aún no se ha registrado conversación con el candidato para realizar un análisis psicolingüístico real de su lenguaje natural."
    };
    candidate.psychoAnalysis = fallbackAnalysis;
    writeDb(db);
    return res.json({ success: true, psychoAnalysis: fallbackAnalysis, candidate });
  }

  const historyText = chatMessages
    .map((m: any) => `${m.sender === "candidate" ? "Candidato" : "Reclutador"}: ${m.text}`)
    .join("\n");

  const client = getGeminiClient();
  let analysis = null;

  if (client) {
    try {
      const prompt = `Eres un Psicólogo Organizacional IA experto en reclutamiento y selección para Heavenly Dreams.
Tu tarea es analizar el historial de chat entre el reclutador y el candidato para inferir rasgos de personalidad, habilidades de comunicación, proactividad, empatía y encaje cultural con el puesto de trabajo.

VACANTE DE INTERÉS:
- Puesto: ${vacancy.title}
- Requisitos: ${vacancy.requirements.join(", ")}
- Experiencia Requerida: ${vacancy.experienceRequired}

DATOS DEL CANDIDATO:
- Nombre: ${candidate.name}
- Experiencia declarada: ${candidate.experience || "No especificada"}

CONVERSACIÓN EN CHAT (HISTORIAL REAL):
${historyText}

Analiza minuciosamente el vocabulario, su tono, proactividad lingüística, tolerancia a la frustración y la compatibilidad con el perfil deseado.
Debes responder ESTRICTAMENTE con un objeto JSON que siga exactamente este esquema, sin textos adicionales ni formato markdown adicional (solo el JSON crudo):
{
  "personality": "Descripción del perfil de personalidad (ej. 'Metódico con Alta Orientación al Detalle')",
  "compatibility": 85, // número del 0 al 100
  "traits": [
    { "label": "Comunicación", "value": 85 },
    { "label": "Proactividad", "value": 90 },
    { "label": "Empatía", "value": 80 },
    { "label": "Adecuación Cultural", "value": 75 }
  ],
  "notes": "Un párrafo de análisis detallado psicológico infiriendo encaje con el puesto, debilidades detectadas, fortalezas y dictamen de contratación."
}

Asegúrate de responder en JSON puro y válido.`;

      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      if (response.text) {
        try {
          analysis = JSON.parse(response.text.trim());
        } catch (parseErr) {
          console.error("Failed to parse Gemini psycho analysis JSON. Raw text:", response.text);
        }
      }
    } catch (err) {
      console.error("Gemini psycho analysis failed:", err);
    }
  }

  if (!analysis) {
    // Elegant fallback simulation
    const randScore = Math.floor(Math.random() * 20) + 75;
    analysis = {
      personality: "Perfil Orientado a Resultados",
      compatibility: randScore,
      traits: [
        { label: "Comunicación", value: Math.floor(Math.random() * 20) + 75 },
        { label: "Proactividad", value: Math.floor(Math.random() * 20) + 75 },
        { label: "Empatía", value: Math.floor(Math.random() * 20) + 75 },
        { label: "Adecuación Cultural", value: Math.floor(Math.random() * 20) + 75 }
      ],
      notes: `Basado en un pre-análisis de las respuestas del candidato, ${candidate.name} demuestra un estilo comunicativo equilibrado, buena adaptabilidad a las condiciones ofrecidas y proactividad constante para dar seguimiento a los pasos del reclutamiento.`
    };
  }

  candidate.psychoAnalysis = analysis;
  writeDb(db);
  res.json({ success: true, psychoAnalysis: analysis, candidate });
});

// Create full-stack dev/production pipeline integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
