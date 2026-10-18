import type { EmbedSettings, ExamToken, ParticipantRecord } from './types';

const STORAGE_KEYS = {
  TOKENS: 'toefl_tpa_tokens_v4',
  PARTICIPANTS: 'toefl_tpa_participants_v4',
  SETTINGS: 'toefl_tpa_settings_v4',
  THEME: 'toefl_theme_mode',
};

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

const DEFAULT_PARTICIPANTS: ParticipantRecord[] = [
  {
    id: 'p-1',
    name: 'Muhammad Farhan Kurniawan',
    nim: '2110112044',
    prodi: 'Manajemen',
    examType: 'toefl',
    examName: 'TOEFL Like Prediction (3 Seksi)',
    tokenCode: 'TOEFL-2025',
    startedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    status: 'completed',
    currentSection: 'Selesai (Section 1-3)',
    workstationId: 'WS-LAB-01',
  },
  {
    id: 'p-2',
    name: 'Siti Nurhaliza',
    nim: '2110112089',
    prodi: 'Akuntansi',
    examType: 'toefl',
    examName: 'TOEFL Like Prediction (3 Seksi)',
    tokenCode: 'TOEFL-2025',
    startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    status: 'completed',
    currentSection: 'Selesai (Section 1-3)',
    workstationId: 'WS-LAB-02',
  },
  {
    id: 'p-3',
    name: 'Ahmad Rizky Pratama',
    nim: '2110113012',
    prodi: 'Manajemen',
    examType: 'tpa',
    examName: 'Tes Potensi Akademik (TPA)',
    tokenCode: 'TPA-2025',
    startedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    status: 'completed',
    currentSection: 'Selesai (TPA)',
    workstationId: 'WS-LAB-05',
  },
  {
    id: 'p-4',
    name: 'Dinda Ayu Maharani',
    nim: '2110112105',
    prodi: 'Akuntansi',
    examType: 'tpa',
    examName: 'Tes Potensi Akademik (TPA)',
    tokenCode: 'TPA-2025',
    startedAt: new Date(Date.now() - 1800000).toISOString(),
    completedAt: undefined,
    status: 'in_progress',
    currentSection: 'Pengerjaan TPA',
    workstationId: 'WS-LAB-07',
  },
];

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

  getParticipants(): ParticipantRecord[] {
    const stored = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(DEFAULT_PARTICIPANTS));
      return DEFAULT_PARTICIPANTS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_PARTICIPANTS;
    }
  },

  saveParticipants(records: ParticipantRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(records));
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

  completeParticipantExam(recordId: string): ParticipantRecord | undefined {
    const participants = this.getParticipants();
    const idx = participants.findIndex((p) => p.id === recordId);
    if (idx >= 0) {
      participants[idx] = {
        ...participants[idx],
        status: 'completed',
        completedAt: new Date().toISOString(),
        currentSection: 'Selesai Seluruh Ujian',
      };
      this.saveParticipants(participants);
      return participants[idx];
    }
    return undefined;
  },

  clearParticipants(): void {
    this.saveParticipants([]);
  },

  getSettings(): EmbedSettings {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.toeflSections || !parsed.toeflSections.listening) {
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: EmbedSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  exportParticipantsToCSV(): boolean {
    const participants = this.getParticipants();
    if (participants.length === 0) {
      return false;
    }

    const headers = [
      'No',
      'Nama Mahasiswa',
      'NIM',
      'Program Studi',
      'Jenis Ujian',
      'Token Digunakan',
      'Waktu Mulai',
      'Waktu Selesai',
      'Status Pengerjaan',
      'Posisi Seksi',
      'Workstation / Lab',
    ];

    const rows = participants.map((p, index) => [
      index + 1,
      `"${p.name.replace(/"/g, '""')}"`,
      `'${p.nim}`,
      `"${p.prodi}"`,
      `"${p.examName}"`,
      `"${p.tokenCode}"`,
      `"${new Date(p.startedAt).toLocaleString('id-ID')}"`,
      p.completedAt ? `"${new Date(p.completedAt).toLocaleString('id-ID')}"` : '"Sedang Mengerjakan"',
      p.status === 'completed' ? '"Selesai"' : '"Sedang Mengerjakan"',
      `"${p.currentSection || '-'}"`,
      `"${p.workstationId || 'LAB-CBT'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Ujian_CAT_${now}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  },
};
