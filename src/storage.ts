import type {
  EmbedSettings,
  ExamRecoverySession,
  ExamToken,
  ExamType,
  ParticipantRecord,
  ToeflSectionKey,
} from './types';

const STORAGE_KEYS = {
  TOKENS: 'toefl_tpa_tokens_v4',
  PARTICIPANTS: 'toefl_tpa_participants_v4',
  SETTINGS: 'toefl_tpa_settings_v4',
  THEME: 'toefl_theme_mode',
  EXAM_SESSION: 'educore_exam_session_v1',
};

const TOEFL_SECTIONS: ToeflSectionKey[] = ['listening', 'structure', 'reading'];

function isToeflSectionKey(value: unknown): value is ToeflSectionKey {
  return typeof value === 'string' && TOEFL_SECTIONS.includes(value as ToeflSectionKey);
}

function isParticipantRecord(value: unknown): value is ParticipantRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<ParticipantRecord>;
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.nim === 'string' &&
    (record.prodi === 'Akuntansi' || record.prodi === 'Manajemen') &&
    (record.examType === 'toefl' || record.examType === 'tpa') &&
    typeof record.examName === 'string' &&
    typeof record.tokenCode === 'string' &&
    typeof record.startedAt === 'string' &&
    (record.status === 'in_progress' || record.status === 'completed') &&
    typeof record.workstationId === 'string'
  );
}

function isExamToken(value: unknown): value is ExamToken {
  if (!value || typeof value !== 'object') return false;
  const token = value as Partial<ExamToken>;
  return (
    typeof token.id === 'string' &&
    typeof token.code === 'string' &&
    typeof token.name === 'string' &&
    (token.examType === 'toefl' || token.examType === 'tpa') &&
    typeof token.isActive === 'boolean' &&
    typeof token.createdAt === 'string' &&
    typeof token.usedCount === 'number'
  );
}

function isExamRecoverySession(value: unknown): value is ExamRecoverySession {
  if (!value || typeof value !== 'object') return false;
  const session = value as Partial<ExamRecoverySession>;
  return (
    session.version === 1 &&
    isParticipantRecord(session.participant) &&
    isExamToken(session.token) &&
    session.participant.examType === session.token.examType &&
    session.participant.tokenCode === session.token.code &&
    isToeflSectionKey(session.currentToeflSection) &&
    Array.isArray(session.completedSections) &&
    session.completedSections.every(isToeflSectionKey) &&
    typeof session.sectionEndsAt === 'number' &&
    Number.isFinite(session.sectionEndsAt)
  );
}

// Direct mapping of the user's Google Form shortlinks to their direct embeddable URLs
const SHORTLINK_MAP: Record<string, string> = {
  'Y6J9KLAwgf1q9G99A': 'https://docs.google.com/forms/d/e/1FAIpQLSc3HqZPmME3Slwo6BRyy16vB7rIozv3R78-Icm7rKYTpSo09A/viewform',
  'tUGoEF4SabpBMDTz9': 'https://docs.google.com/forms/d/e/1FAIpQLSfEMFWj3qwoSNQ6xDrGn349nWE539QYep6CT2xrCPKoqQ1cLg/viewform',
  'JMkfEu3fnXEmwpFx7': 'https://docs.google.com/forms/d/e/1FAIpQLScl5E7a0Wk8UZvGRAbi9eZUAnf8wqn3SZ2WEfwHVelvZdpoqA/viewform',
  'aNpTpu7WDRNtN4af6': 'https://docs.google.com/forms/d/e/1FAIpQLSez0TzrQcF5HfqQ-D0dGALZX54Y5V2Et2vo-FQEm6TQrGvXKA/viewform',
};

const DEFAULT_TOKENS: ExamToken[] = [
  {
    id: 'tok-1',
    code: 'TOEFL-2025',
    name: 'Hari 1: Ujian TOEFL Like Prediction (3 Seksi)',
    examType: 'toefl',
    isActive: true,
    createdAt: new Date().toISOString(),
    usedCount: 24,
    maxCapacity: 120,
    examDate: 'Hari 1 - Sesi TOEFL',
    note: 'Meliputi 3 Seksi: Listening (35m), Structure (25m), Reading (55m)',
  },
  {
    id: 'tok-2',
    code: 'TPA-2025',
    name: 'Hari 2: Tes Potensi Akademik (TPA)',
    examType: 'tpa',
    isActive: true,
    createdAt: new Date().toISOString(),
    usedCount: 19,
    maxCapacity: 120,
    examDate: 'Hari 2 - Sesi TPA',
    note: 'Jadwal terpisah khusus Tes Potensi Akademik (60m)',
  },
  {
    id: 'tok-3',
    code: 'TOEFL-SESI2',
    name: 'Hari 1: Sesi Siang TOEFL Like Prediction',
    examType: 'toefl',
    isActive: true,
    createdAt: new Date().toISOString(),
    usedCount: 0,
    maxCapacity: 100,
    examDate: 'Hari 1 - Sesi 2',
    note: 'Sesi cadangan hari pertama',
  },
  {
    id: 'tok-4',
    code: 'TPA-SUSULAN',
    name: 'Hari 2: Sesi Susulan TPA (Non-Aktif)',
    examType: 'tpa',
    isActive: false,
    createdAt: new Date().toISOString(),
    usedCount: 0,
    maxCapacity: 30,
    examDate: 'Hari 2 - Susulan',
    note: 'Status terkunci sampai diaktifkan pengawas',
  },
];

const DEFAULT_SETTINGS: EmbedSettings = {
  institutionName: 'STIE Nasional Banjarmasin',
  activeExamSchedule: 'both',
  listeningAudioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  instructionToefl: 'Ujian TOEFL Like terdiri dari 3 seksi berurutan: Listening Comprehension (35 menit), Structure & Written Expression (25 menit), dan Reading Comprehension (55 menit). Waktu akan berjalan otomatis.',
  instructionTpa: 'Ujian Tes Potensi Akademik (TPA) dilaksanakan pada jadwal terpisah dengan durasi 60 menit. Jawablah soal kemampuan verbal, numerik, dan penalaran logika sebaik-baiknya.',
  toeflSections: {
    listening: {
      key: 'listening',
      name: 'Section 1: Listening Comprehension Questions',
      shortName: 'Listening',
      url: 'https://docs.google.com/forms/d/e/1FAIpQLSc3HqZPmME3Slwo6BRyy16vB7rIozv3R78-Icm7rKYTpSo09A/viewform?embedded=true',
      minutes: 35,
      questionCount: 50,
    },
    structure: {
      key: 'structure',
      name: 'Section 2: Structure and Written Expression',
      shortName: 'Structure',
      url: 'https://docs.google.com/forms/d/e/1FAIpQLSfEMFWj3qwoSNQ6xDrGn349nWE539QYep6CT2xrCPKoqQ1cLg/viewform?embedded=true',
      minutes: 25,
      questionCount: 40,
    },
    reading: {
      key: 'reading',
      name: 'Section 3: Reading Comprehension Questions',
      shortName: 'Reading',
      url: 'https://docs.google.com/forms/d/e/1FAIpQLScl5E7a0Wk8UZvGRAbi9eZUAnf8wqn3SZ2WEfwHVelvZdpoqA/viewform?embedded=true',
      minutes: 55,
      questionCount: 50,
    },
  },
  tpa: {
    name: 'Tes Potensi Akademik (TPA) Terpadu',
    url: 'https://docs.google.com/forms/d/e/1FAIpQLSez0TzrQcF5HfqQ-D0dGALZX54Y5V2Et2vo-FQEm6TQrGvXKA/viewform?embedded=true',
    minutes: 60,
    questionCount: 60,
  },
};

// Tidak ada data peserta bawaan. Rekap harus hanya berisi peserta yang benar-benar
// mendaftar, supaya data salah input mudah dikenali dan dapat dihapus manual.
const DEFAULT_PARTICIPANTS: ParticipantRecord[] = [];

export function formatEmbedUrl(rawUrl: string): string {
  if (!rawUrl || !rawUrl.trim()) return '';
  let url = rawUrl.trim();

  // If user entered a Google Form shortlink like https://forms.gle/XYZ
  for (const [key, target] of Object.entries(SHORTLINK_MAP)) {
    if (url.includes(key)) {
      return `${target}?embedded=true`;
    }
  }

  // If already embedded
  if (url.includes('embedded=true')) return url;

  // If it's a standard viewform url
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}embedded=true`;
}

export const StorageService = {
  getTheme(): 'dark' | 'light' {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    return stored === 'light' ? 'light' : 'dark';
  },

  setTheme(theme: 'dark' | 'light'): void {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  getTokens(): ExamToken[] {
    const stored = localStorage.getItem(STORAGE_KEYS.TOKENS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(DEFAULT_TOKENS));
      return DEFAULT_TOKENS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_TOKENS;
    }
  },

  saveTokens(tokens: ExamToken[]): void {
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
  },

  findTokenByCode(code: string): ExamToken | undefined {
    const tokens = this.getTokens();
    const clean = code.trim().toUpperCase();
    return tokens.find((t) => t.code.trim().toUpperCase() === clean);
  },

  toggleTokenStatus(tokenId: string): ExamToken[] {
    const tokens = this.getTokens().map((t) => (t.id === tokenId ? { ...t, isActive: !t.isActive } : t));
    this.saveTokens(tokens);
    return tokens;
  },

  saveToken(token: ExamToken): ExamToken[] {
    const tokens = this.getTokens();
    const idx = tokens.findIndex((t) => t.id === token.id);
    if (idx >= 0) {
      tokens[idx] = token;
    } else {
      tokens.unshift(token);
    }
    this.saveTokens(tokens);
    return tokens;
  },

  deleteToken(tokenId: string): ExamToken[] {
    const tokens = this.getTokens().filter((t) => t.id !== tokenId);
    this.saveTokens(tokens);
    return tokens;
  },

  incrementTokenUsage(tokenCode: string): void {
    const tokens = this.getTokens().map((t) => {
      if (t.code.toUpperCase() === tokenCode.toUpperCase()) {
        return { ...t, usedCount: (t.usedCount || 0) + 1 };
      }
      return t;
    });
    this.saveTokens(tokens);
  },

  decrementTokenUsage(tokenCode: string): void {
    const tokens = this.getTokens().map((t) => {
      if (t.code.toUpperCase() === tokenCode.toUpperCase()) {
        return { ...t, usedCount: Math.max(0, (t.usedCount || 0) - 1) };
      }
      return t;
    });
    this.saveTokens(tokens);
  },

  getParticipants(): ParticipantRecord[] {
    const stored = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
    if (!stored) return DEFAULT_PARTICIPANTS;
    try {
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed)) return DEFAULT_PARTICIPANTS;
      // Abaikan baris rusak agar rekap tidak ikut error saat dirender.
      return parsed.filter(isParticipantRecord);
    } catch {
      return DEFAULT_PARTICIPANTS;
    }
  },

  saveParticipants(records: ParticipantRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(records));
  },

  findParticipantByNim(nim: string, examType: ExamType): ParticipantRecord | undefined {
    const clean = nim.trim().toLowerCase();
    return this.getParticipants().find(
      (participant) =>
        participant.nim.trim().toLowerCase() === clean && participant.examType === examType,
    );
  },

  addParticipant(record: Omit<ParticipantRecord, 'id'>): ParticipantRecord {
    const participants = this.getParticipants();
    const newRecord: ParticipantRecord = {
      ...record,
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    participants.unshift(newRecord);
    this.saveParticipants(participants);
    this.incrementTokenUsage(record.tokenCode);
    return newRecord;
  },

  updateParticipantSection(recordId: string, currentSection: string): void {
    const participants = this.getParticipants();
    const idx = participants.findIndex((p) => p.id === recordId);
    if (idx >= 0) {
      participants[idx].currentSection = currentSection;
      this.saveParticipants(participants);
    }
  },

  completeParticipantExam(recordId: string, finalSection = 'Selesai Seluruh Ujian'): ParticipantRecord | undefined {
    const participants = this.getParticipants();
    const idx = participants.findIndex((p) => p.id === recordId);
    if (idx >= 0) {
      participants[idx] = {
        ...participants[idx],
        status: 'completed',
        completedAt: new Date().toISOString(),
        currentSection: finalSection,
      };
      this.saveParticipants(participants);
      return participants[idx];
    }
    return undefined;
  },

  getExamSession(): ExamRecoverySession | null {
    const stored = localStorage.getItem(STORAGE_KEYS.EXAM_SESSION);
    if (!stored) return null;

    try {
      const parsed: unknown = JSON.parse(stored);
      if (isExamRecoverySession(parsed)) return parsed;
    } catch {
      // A malformed local session must not prevent the login screen from loading.
    }

    localStorage.removeItem(STORAGE_KEYS.EXAM_SESSION);
    return null;
  },

  saveExamSession(session: ExamRecoverySession): void {
    localStorage.setItem(STORAGE_KEYS.EXAM_SESSION, JSON.stringify(session));
  },

  clearExamSession(): void {
    localStorage.removeItem(STORAGE_KEYS.EXAM_SESSION);
  },

  clearParticipants(): void {
    this.saveParticipants([]);
  },

  deleteParticipant(id: string): ParticipantRecord | undefined {
    const participants = this.getParticipants();
    const removed = participants.find((p) => p.id === id);
    if (!removed) return undefined;
    this.saveParticipants(participants.filter((p) => p.id !== id));
    // Usage token ikut turun supaya kolom "Pakai" tetap akurat setelah data dihapus.
    this.decrementTokenUsage(removed.tokenCode);
    return removed;
  },

  getStationId(): string {
    return import.meta.env.VITE_STATION_ID?.trim() || 'LAB-CBT';
  },

  getSettings(): EmbedSettings {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      const parsed: unknown = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;
      const saved = parsed as Partial<EmbedSettings>;
      // Merge per bagian: data lama yang tidak lengkap tidak boleh membuat
      // embedSettings.toeflSections.<seksi> menjadi undefined.
      return {
        ...DEFAULT_SETTINGS,
        ...saved,
        toeflSections: {
          listening: { ...DEFAULT_SETTINGS.toeflSections.listening, ...saved.toeflSections?.listening },
          structure: { ...DEFAULT_SETTINGS.toeflSections.structure, ...saved.toeflSections?.structure },
          reading: { ...DEFAULT_SETTINGS.toeflSections.reading, ...saved.toeflSections?.reading },
        },
        tpa: { ...DEFAULT_SETTINGS.tpa, ...saved.tpa },
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: EmbedSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

};
