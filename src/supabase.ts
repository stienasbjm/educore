import { createClient } from '@supabase/supabase-js';
import type { ExamToken, ParticipantRecord, EmbedSettings } from './types';

export const SUPABASE_URL = 'https://qqjeajnrepmawqjqsuup.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_i2LzkWSxYnbXpoRjZfJ_gw_-CzvDEVv';
const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME?.trim() ?? '';
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL?.trim().toLowerCase() ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export class AdminAuthError extends Error {
  constructor(readonly code: 'not-configured' | 'invalid-credentials' | 'email-not-confirmed' | 'service-unavailable') {
    super(code);
    this.name = 'AdminAuthError';
  }
}

export const SupabaseService = {
  async restoreAdminSession(): Promise<boolean> {
    if (!ADMIN_EMAIL) return false;

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn('Supabase admin session restore failed:', sessionError);
        return false;
      }

      if (!sessionData.session) return false;

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.warn('Supabase could not validate the saved admin session:', userError);
        return false;
      }
      return userData.user.email?.trim().toLowerCase() === ADMIN_EMAIL;
    } catch (error) {
      console.warn('Supabase admin session restore failed:', error);
      return false;
    }
  },

  async signInAdmin(username: string, password: string): Promise<void> {
    if (!ADMIN_USERNAME || !ADMIN_EMAIL) {
      throw new AdminAuthError('not-configured');
    }

    if (username.trim() !== ADMIN_USERNAME) {
      throw new AdminAuthError('invalid-credentials');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    });

    if (error) {
      if (error.code === 'email_not_confirmed' || error.code === 'email_not_verified') {
        throw new AdminAuthError('email-not-confirmed');
      }
      if (error.status === 400 || error.status === 401) {
        throw new AdminAuthError('invalid-credentials');
      }
      throw new AdminAuthError('service-unavailable');
    }

    if (data.user.email?.toLowerCase() !== ADMIN_EMAIL) {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) console.error('Supabase sign-out after admin identity mismatch failed:', signOutError);
      throw new AdminAuthError('invalid-credentials');
    }
  },

  async signOutAdmin(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Check connection status
  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('tokens').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        // Table might not exist or network error
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // PARTICIPANTS SYNC
  async fetchParticipants(): Promise<ParticipantRecord[] | null> {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('started_at', { ascending: false });

      if (error || !data) return null;

      return data.map((row) => ({
        id: row.id,
        name: row.name,
        nim: row.nim,
        prodi: row.prodi,
        examType: row.exam_type,
        examName: row.exam_name,
        tokenCode: row.token_code,
        startedAt: row.started_at,
        completedAt: row.completed_at || undefined,
        status: row.status,
        currentSection: row.current_section || undefined,
        workstationId: row.workstation_id || 'LAB-CBT',
      }));
    } catch (err) {
      console.warn('Supabase fetchParticipants fallback to local:', err);
      return null;
    }
  },

  async upsertParticipant(record: ParticipantRecord): Promise<boolean> {
    try {
      const { error } = await supabase.from('participants').upsert(
        [
          {
            id: record.id,
            name: record.name,
            nim: record.nim,
            prodi: record.prodi,
            exam_type: record.examType,
            exam_name: record.examName,
            token_code: record.tokenCode,
            started_at: record.startedAt,
            completed_at: record.completedAt || null,
            status: record.status,
            current_section: record.currentSection || null,
            workstation_id: record.workstationId,
          },
        ],
        { onConflict: 'id' },
      );
      if (error) {
        console.warn('Supabase upsertParticipant failed; participant remains saved locally:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase upsertParticipant failed; participant remains saved locally:', err);
      return false;
    }
  },

  async clearParticipants(): Promise<boolean> {
    try {
      const { error } = await supabase.from('participants').delete().neq('id', '0');
      return !error;
    } catch {
      return false;
    }
  },

  // TOKENS SYNC
  async fetchTokens(): Promise<ExamToken[] | null> {
    try {
      const { data, error } = await supabase
        .from('tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return null;

      return data.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        examType: row.exam_type,
        isActive: row.is_active,
        createdAt: row.created_at,
        usedCount: row.used_count || 0,
        maxCapacity: row.max_capacity,
        examDate: row.exam_date,
        note: row.note,
      }));
    } catch (err) {
      console.warn('Supabase fetchTokens fallback to local:', err);
      return null;
    }
  },

  async upsertToken(token: ExamToken): Promise<boolean> {
    try {
      const { error } = await supabase.from('tokens').upsert([
        {
          id: token.id,
          code: token.code,
          name: token.name,
          exam_type: token.examType,
          is_active: token.isActive,
          created_at: token.createdAt,
          used_count: token.usedCount,
          max_capacity: token.maxCapacity,
          exam_date: token.examDate,
          note: token.note,
        },
      ]);
      return !error;
    } catch (err) {
      console.warn('Supabase upsertToken error:', err);
      return false;
    }
  },

  async deleteToken(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('tokens').delete().eq('id', id);
      return !error;
    } catch {
      return false;
    }
  },

  // SETTINGS SYNC
  async fetchSettings(): Promise<EmbedSettings | null> {
    try {
      const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle();
      if (error || !data) return null;

      return {
        institutionName: data.institution_name || 'STIE Nasional Banjarmasin',
        activeExamSchedule: data.active_exam_schedule || 'both',
        listeningAudioUrl: data.listening_audio_url || '',
        instructionToefl: data.instruction_toefl || '',
        instructionTpa: data.instruction_tpa || '',
        toeflSections: {
          listening: {
            key: 'listening',
            name: 'Section 1: Listening Comprehension Questions',
            shortName: 'Listening',
            url: data.listening_url,
            minutes: data.listening_minutes || 35,
            questionCount: 50,
          },
          structure: {
            key: 'structure',
            name: 'Section 2: Structure and Written Expression',
            shortName: 'Structure',
            url: data.structure_url,
            minutes: data.structure_minutes || 25,
            questionCount: 40,
          },
          reading: {
            key: 'reading',
            name: 'Section 3: Reading Comprehension Questions',
            shortName: 'Reading',
            url: data.reading_url,
            minutes: data.reading_minutes || 55,
            questionCount: 50,
          },
        },
        tpa: {
          name: 'Tes Potensi Akademik (TPA) Terpadu',
          url: data.tpa_url,
          minutes: data.tpa_minutes || 60,
          questionCount: 60,
        },
      };
    } catch {
      return null;
    }
  },

  async saveSettings(settings: EmbedSettings): Promise<boolean> {
    try {
      const { error } = await supabase.from('settings').upsert([
        {
          id: 'primary',
          institution_name: settings.institutionName,
          active_exam_schedule: settings.activeExamSchedule,
          listening_audio_url: settings.listeningAudioUrl,
          instruction_toefl: settings.instructionToefl,
          instruction_tpa: settings.instructionTpa,
          listening_url: settings.toeflSections.listening.url,
          listening_minutes: settings.toeflSections.listening.minutes,
          structure_url: settings.toeflSections.structure.url,
          structure_minutes: settings.toeflSections.structure.minutes,
          reading_url: settings.toeflSections.reading.url,
          reading_minutes: settings.toeflSections.reading.minutes,
          tpa_url: settings.tpa.url,
          tpa_minutes: settings.tpa.minutes,
        },
      ]);
      return !error;
    } catch {
      return false;
    }
  },
};
