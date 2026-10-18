export type ExamType = 'toefl' | 'tpa';

export type ToeflSectionKey = 'listening' | 'structure' | 'reading';

export type ProdiType = 'Akuntansi' | 'Manajemen';

export type ToeflSectionConfig = {
  key: ToeflSectionKey;
  name: string;
  shortName: string;
  url: string;
  minutes: number;
  questionCount: number;
};

export type TpaConfig = {
  name: string;
  url: string;
  minutes: number;
  questionCount: number;
};

export type ExamToken = {
  id: string;
  code: string;
  name: string;
  examType: ExamType; // strictly segregated: toefl on one day, tpa on another
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
  usedCount: number;
  maxCapacity?: number;
  examDate?: string;
  note?: string;
};

export type ParticipantRecord = {
  id: string;
  name: string;
  nim: string;
  prodi: ProdiType;
  examType: ExamType;
  examName: string;
  tokenCode: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed';
  currentSection?: string;
  workstationId: string;
};

export type EmbedSettings = {
  institutionName: string;
  toeflSections: {
    listening: ToeflSectionConfig;
    structure: ToeflSectionConfig;
    reading: ToeflSectionConfig;
  };
  tpa: TpaConfig;
  listeningAudioUrl?: string;
  instructionToefl: string;
  instructionTpa: string;
  activeExamSchedule: 'toefl' | 'tpa' | 'both';
};
