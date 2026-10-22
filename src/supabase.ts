import { createClient } from '@supabase/supabase-js';
import type { ExamToken, ParticipantRecord, EmbedSettings } from './types';
import { StorageService } from './storage';

export const SUPABASE_URL = 'https://qqjeajnrepmawqjqsuup.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_i2LzkWSxYnbXpoRjZfJ_gw_-CzvDEVv';

// Fallback opsional. Hanya terisi bila variabel env tersebut memang diisi
// saat proses build. Nilai kosong = tidak ada identitas pengelola yang ikut
// terpublikasi di bundel browser.
const LEGACY_ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL?.trim().toLowerCase() ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type AdminAuthErrorCode =
  | 'not-configured'
  | 'invalid-credentials'
  | 'email-not-confirmed'
  | 'service-unavailable'
  | 'not-authorized'
  | 'registry-missing';

export class AdminAuthError extends Error {
  constructor(readonly code: AdminAuthErrorCode) {
    super(code);
    this.name = 'AdminAuthError';
  }
}

type AuthUserLike = {
  email?: string;
  app_metadata?: Record<string, unknown> | null;
};

export type AdminIdentityCheck = {
  isAdmin: boolean;
  registryAvailable: boolean;
};

const mapTokenRow = (row: Record<string, unknown>): ExamToken => ({
  id: row.id as string,
  code: row.code as string,
  name: row.name as string,
  examType: row.exam_type as ExamToken['examType'],
  isActive: row.is_active as boolean,
  createdAt: row.created_at as string,
  usedCount: (row.used_count as number) || 0,
  maxCapacity: row.max_capacity as number | undefined,
  examDate: row.exam_date as string | undefined,
  note: row.note as string | undefined,
});

export const SupabaseService = {
  /**
   * Menentukan apakah pengguna yang sudah login berhak membuka panel.
   * Urutan prioritas:
   *  1. app_metadata.role = 'admin' (diset di Supabase Dashboard)
   *  2. email terdaftar pada tabel `admins` (dibuat oleh supabase_schema.sql)
   *  3. fallback legacy VITE_ADMIN_EMAIL (hanya bila diisi saat build)
   */
  async checkAdminIdentity(user: AuthUserLike | null | undefined): Promise<AdminIdentityCheck> {
    if (!user) return { isAdmin: false, registryAvailable: true };
    if (user.app_metadata?.role === 'admin') return { isAdmin: true, registryAvailable: true };

    const email = (user.email ?? '').trim().toLowerCase();
    if (!email) return { isAdmin: false, registryAvailable: true };
    if (LEGACY_ADMIN_EMAIL && email === LEGACY_ADMIN_EMAIL) {
      return { isAdmin: true, registryAvailable: true };
    }

    const { data, error } = await supabase
      .from('admins')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.warn('Daftar pengelola (tabel admins) tidak dapat dibaca:', error);
      return { isAdmin: false, registryAvailable: false };
    }

    return { isAdmin: !!data, registryAvailable: true };
  },

  async restoreAdminSession(): Promise<boolean> {
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

      const identity = await SupabaseService.checkAdminIdentity(userData.user);
      if (!identity.isAdmin) {
        if (!identity.registryAvailable) {
          await supabase.auth.signOut();
        }
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Supabase admin session restore failed:', error);
      return false;
    }
  },

  async signInAdmin(email: string, password: string): Promise<void> {
    const identifier = email.trim().toLowerCase();
    if (!identifier || !identifier.includes('@')) {
      throw new AdminAuthError('invalid-credentials');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
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

    const identity = await SupabaseService.checkAdminIdentity(data.user);
    if (!identity.isAdmin) {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) console.error('Supabase sign-out after admin identity mismatch failed:', signOutError);
      throw new AdminAuthError(identity.registryAvailable ? 'not-authorized' : 'registry-missing');
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

  /**
   * Validasi token sesi secara aman. Memakai fungsi database
   * `check_exam_token` sehingga daftar token tidak pernah bisa dibaca atau
   * ditebak oleh pengunjung. Bila fungsi belum tersedia (SQL belum
   * dijalankan),fallsback ke daftar token lokal.
   */
  async findActiveToken(code: string): Promise<{ token: ExamToken | null; source: 'server' | 'local' }> {
    const clean = code.trim();
    if (!clean) return { token: null, source: 'server' };

    try {
      const { data, error } = await supabase.rpc('check_exam_token', { token_code: clean });
      if (!error) {
        const row = Array.isArray(data) ? data[0] : data;
        if (row) return { token: mapTokenRow(row as Record<string, unknown>), source: 'server' };
        return { token: null, source: 'server' };
      }
      console.warn('Fungsi check_exam_token belum tersedia, memakai daftar token lokal:', error);
    } catch (err) {
      console.warn('Fungsi check_exam_token gagal, memakai daftar token lokal:', err);
    }

    return { token: StorageService.findTokenByCode(clean) ?? null, source: 'local' };
  },

  // PARTICIPANTS SYNC
  async fetchParticipants(): Promise<ParticipantRecord[] | null> {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('started_at', { ascending: false });

      if (error || !data) return null;

      return data
        .filter((row) => typeof row.id === 'string' && typeof row.nim === 'string' && row.nim.trim() !== '')
        .map((row) => ({
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

  /**
   * Menjalankan mutasi peserta lewat Edge Function bila tersedia.
   * Mengembalikan:
   *   true  = berhasil
   *   false = ditolak server
   *   null  = Edge Function belum ter-deploy -> pakai jalur tabel langsung
   */
  async invokeParticipantMutation(payload: Record<string, unknown>): Promise<boolean | null> {
    try {
      const { error } = await supabase.functions.invoke('participant-mutations', { body: payload });
      if (!error) return true;
      console.warn('Edge Function participant-mutations belum aktif:', error);
      return null;
    } catch (err) {
      console.warn('Edge Function participant-mutations tidak dapat dipanggil:', err);
      return null;
    }
  },

  async upsertParticipant(record: ParticipantRecord): Promise<boolean> {
    const viaFunction = await SupabaseService.invokeParticipantMutation({
      action: 'upsert',
      record,
    });
    if (viaFunction !== null) return viaFunction;

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
    const viaFunction = await SupabaseService.invokeParticipantMutation({ action: 'clear' });
    if (viaFunction !== null) return viaFunction;

    try {
      const { error } = await supabase.from('participants').delete().neq('id', '0');
      return !error;
    } catch {
      return false;
    }
  },

  async deleteParticipant(id: string): Promise<boolean> {
    const viaFunction = await SupabaseService.invokeParticipantMutation({ action: 'delete', id });
    if (viaFunction !== null) return viaFunction;

    try {
      const { error } = await supabase.from('participants').delete().eq('id', id);
      if (error) {
        console.warn('Supabase deleteParticipant failed:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Supabase deleteParticipant failed:', err);
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

      return data.map((row) => mapTokenRow(row as Record<string, unknown>));
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
            url: data.listening_url || '',
            minutes: data.listening_minutes || 35,
            questionCount: 50,
          },
          structure: {
            key: 'structure',
            name: 'Section 2: Structure and Written Expression',
            shortName: 'Structure',
            url: data.structure_url || '',
            minutes: data.structure_minutes || 25,
            questionCount: 40,
          },
          reading: {
            key: 'reading',
            name: 'Section 3: Reading Comprehension Questions',
            shortName: 'Reading',
            url: data.reading_url || '',
            minutes: data.reading_minutes || 55,
            questionCount: 50,
          },
        },
        tpa: {
          name: 'Tes Potensi Akademik (TPA) Terpadu',
          url: data.tpa_url || '',
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
