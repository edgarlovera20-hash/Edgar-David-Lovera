/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Candidate {
  id: string;
  name: string;
  phone: string;
  email: string;
  age: number;
  vacancyId: string;
  experience: string;
  status: 'nuevo' | 'contactado' | 'interesado' | 'precalificado' | 'entrevista' | 'capacitacion' | 'activo' | 'no_contratado' | 'recontratable' | 'lista_negra';
  source: string;
  recruiter: string;
  date: string;
  interviewDate?: string;
  observations?: string;
  recruiterPersona?: 'auto' | 'tech' | 'sales' | 'support';
  documents: {
    cv?: 'pendiente' | 'aprobado' | 'rechazado';
    ine?: 'pendiente' | 'aprobado' | 'rechazado';
    domicilio?: 'pendiente' | 'aprobado' | 'rechazado';
    curp?: 'pendiente' | 'aprobado' | 'rechazado';
  };
  psychoAnalysis?: {
    personality: string;
    compatibility: number;
    traits: { label: string; value: number }[];
    notes: string;
  };
  evaluation?: {
    technicalScore: number;
    behavioralScore: number;
    grade: string;
    feedback: string;
  };
  documentAnalysis?: {
    [key: string]: {
      summary: string;
      detectedName?: string;
      extractedInfo?: any;
      issues: string[];
      isValid: boolean;
      matchPercentage?: number;
      recruiterAction?: string;
      notes?: string;
      analyzedAt: string;
      fileName: string;
    };
  };
}

export interface Vacancy {
  id: string;
  title: string;
  salary: string;
  hours: string;
  benefits: string[];
  requirements: string[];
  experienceRequired: string;
  location: string;
  openPositions: number;
  screeningQuestions: string[];
  status: 'active' | 'paused' | 'archived';
  department?: string;
}

export interface ChatMessage {
  id: string;
  candidateId: string;
  sender: 'candidate' | 'bot' | 'system' | 'scheduler' | 'documentation' | 'psychologist' | 'recruiter';
  text: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'pdf' | 'location';
  mediaUrl?: string;
}

export interface FlowNode {
  id: string;
  type: 'start' | 'message' | 'question' | 'ia' | 'condition' | 'wait' | 'sheets' | 'calendar' | 'drive' | 'gmail' | 'whatsapp' | 'webhook' | 'api' | 'end';
  label: string;
  x: number;
  y: number;
  config: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  description: string;
  systemInstruction: string;
  systemInstructions?: string; // Support alias
  promptTemplate: string;
  active?: boolean; // Active state
  stats: {
    calls: number;
    accuracy: number;
  };
}

export interface WorkspaceSettings {
  driveConnected: boolean;
  sheetsConnected: boolean;
  calendarConnected: boolean;
  gmailConnected: boolean;
  docsConnected?: boolean;
  mapsConnected?: boolean;
  contactsConnected?: boolean;
  spreadsheetId?: string;
  calendarId?: string;
  driveFolderId?: string;
  gmailTemplateId?: string;
}

export interface AutomationSettings {
  confirmInterviews?: boolean;
  autoReminders?: boolean;
  requestMissingDocs?: boolean;
  detectDuplicates?: boolean;
  matchBestVacancy?: boolean;
  dailyReports?: boolean;
  autoWelcome?: boolean;
  autoScreening?: boolean;
  autoSchedule?: boolean;
  rejectEmail?: boolean;
  whatsappReminders?: boolean;
  psychometricRequired?: boolean;
}

export interface InterviewSlot {
  id: string;
  dateTime: string;
  available: boolean;
  candidateName?: string;
  candidateId?: string;
}

export interface InterviewSchedule {
  allowedDays: string[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  customSlots: InterviewSlot[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
  type: 'candidate' | 'vacancy' | 'flow' | 'automation' | 'system';
}

