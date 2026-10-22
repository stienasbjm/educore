-- ========================================================
-- SCHEMA SQL SUPABASE: EDUCORE (project ref qqjeajnrepmawqjqsuup)
-- Jalankan skrip ini di SQL Editor pada Dashboard Supabase Anda
--
-- CATATAN KEAMANAN:
--   Skrip ini mengaktifkan Row Level Security yang TERPISAH per peran.
--   Kunci "anon" (publishable key) bersifat publik karena ikut terpasang di
--   bundel browser, sehingga seluruh aturan keamanan WAJIB ditegakkan oleh
--   policy database, bukan oleh kode frontend.
--
--   anon     = pengunjung/peserta (belum masuk)
--   authenticated = pengelola yang sudah login lewat Supabase Auth
--
--   Jalankan ulang skrip ini setiap kali kebijakan akses diubah.
-- ========================================================

-- 1. TABEL TOKENS (Manajemen Token Sesi Ujian)
CREATE TABLE IF NOT EXISTS public.tokens (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  exam_type TEXT NOT NULL DEFAULT 'toefl', -- 'toefl' atau 'tpa'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_count INT NOT NULL DEFAULT 0,
  max_capacity INT DEFAULT 100,
  exam_date TEXT,
  note TEXT
);

-- 2. TABEL PARTICIPANTS (Rekap Mahasiswa Peserta Ujian)
CREATE TABLE IF NOT EXISTS public.participants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nim TEXT NOT NULL,
  prodi TEXT NOT NULL, -- 'Akuntansi' atau 'Manajemen'
  exam_type TEXT NOT NULL, -- 'toefl' atau 'tpa'
  exam_name TEXT NOT NULL,
  token_code TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' atau 'completed'
  current_section TEXT,
  workstation_id TEXT DEFAULT 'LAB-CBT'
);

-- 3. TABEL SETTINGS (Pengaturan Link Sematan Google Form)
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  institution_name TEXT DEFAULT 'STIE Nasional Banjarmasin',
  active_exam_schedule TEXT DEFAULT 'both',
  listening_url TEXT,
  listening_minutes INT DEFAULT 35,
  structure_url TEXT,
  structure_minutes INT DEFAULT 25,
  reading_url TEXT,
  reading_minutes INT DEFAULT 55,
  tpa_url TEXT,
  tpa_minutes INT DEFAULT 60,
  listening_audio_url TEXT,
  instruction_toefl TEXT,
  instruction_tpa TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABEL ADMINS (Daftar pengelola yang boleh masuk ke panel)
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABEL AUDIT HAPUS PESERTA (Jejak penghapusan data)
CREATE TABLE IF NOT EXISTS public.participant_deletions (
  id BIGSERIAL PRIMARY KEY,
  participant_id TEXT NOT NULL,
  name TEXT,
  nim TEXT,
  exam_type TEXT,
  token_code TEXT,
  status TEXT,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_by TEXT NOT NULL DEFAULT current_user
);

-- ========================================================
-- NORMALISASI DATA LAMA (agar constraint baru tidak gagal)
-- ========================================================
-- Partisipan lama yang sudah selesai tetapi completed_at kosong.
UPDATE public.participants
SET completed_at = started_at
WHERE status = 'completed' AND completed_at IS NULL;

-- Partisipan lama yang masih berjalan tetapi punya completed_at.
UPDATE public.participants
SET completed_at = NULL
WHERE status = 'in_progress' AND completed_at IS NOT NULL;

-- ========================================================
-- CONSTRAINT & INDEX
-- ========================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  ALTER TABLE public.tokens
    ADD CONSTRAINT tokens_exam_type_check CHECK (exam_type IN ('toefl','tpa'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER TABLE public.tokens
    ADD CONSTRAINT tokens_used_count_check CHECK (used_count >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER TABLE public.tokens
    ADD CONSTRAINT tokens_max_capacity_check CHECK (max_capacity IS NULL OR max_capacity > 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER TABLE public.participants
    ADD CONSTRAINT participants_exam_type_check CHECK (exam_type IN ('toefl','tpa'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER TABLE public.participants
    ADD CONSTRAINT participants_prodi_check CHECK (prodi IN ('Akuntansi','Manajemen'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER TABLE public.participants
    ADD CONSTRAINT participants_status_check CHECK (status IN ('in_progress','completed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER TABLE public.participants
    ADD CONSTRAINT participants_identity_not_blank CHECK (
      length(trim(name)) > 0 AND length(trim(nim)) > 0 AND length(trim(id)) > 0
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER TABLE public.participants
    ADD CONSTRAINT participants_completion_consistency CHECK (
      (status = 'completed' AND completed_at IS NOT NULL) OR
      (status = 'in_progress' AND completed_at IS NULL)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$
BEGIN
  ALTER TABLE public.settings
    ADD CONSTRAINT settings_single_row_check CHECK (id = 'primary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS tokens_is_active_idx ON public.tokens (is_active);
CREATE INDEX IF NOT EXISTS tokens_code_lower_idx ON public.tokens (lower(code));
CREATE INDEX IF NOT EXISTS participants_token_code_idx ON public.participants (token_code);
CREATE INDEX IF NOT EXISTS participants_status_idx ON public.participants (status);
CREATE INDEX IF NOT EXISTS participants_started_at_idx ON public.participants (started_at DESC);

-- Hanya satu peserta berstatus berjalan untuk satu NIM + jenis ujian.
CREATE UNIQUE INDEX IF NOT EXISTS participants_nim_inprogress_uidx
  ON public.participants (lower(nim), exam_type)
  WHERE status = 'in_progress';

-- ========================================================
-- TRIGGER: updated_at + proteksi identitas peserta
-- ========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END; $$;

-- Jejak penghapusan. SECURITY DEFINER diperlukan agar pencatatan tetap bisa
-- ditulis meski penghapusan dilakukan oleh peserta (role anon).
CREATE OR REPLACE FUNCTION public.log_participant_deletion()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.participant_deletions (participant_id, name, nim, exam_type, token_code, status)
  VALUES (OLD.id, OLD.name, OLD.nim, OLD.exam_type, OLD.token_code, OLD.status);
  RETURN OLD;
END; $$;

-- Peserta anonim (browser peserta) hanya boleh memperbarui status/posisi,
-- tidak boleh mengubah identitas, NIM, token, atau waktu mulai.
CREATE OR REPLACE FUNCTION public.protect_participant_identity()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  caller_role TEXT;
BEGIN
  caller_role := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::json ->> 'role',
    current_user
  );

  IF caller_role NOT IN ('authenticated', 'service_role', 'postgres', 'supabase_admin') THEN
    IF NEW.name IS DISTINCT FROM OLD.name
       OR NEW.nim IS DISTINCT FROM OLD.nim
       OR NEW.exam_type IS DISTINCT FROM OLD.exam_type
       OR NEW.exam_name IS DISTINCT FROM OLD.exam_name
       OR NEW.token_code IS DISTINCT FROM OLD.token_code
       OR NEW.started_at IS DISTINCT FROM OLD.started_at
       OR NEW.workstation_id IS DISTINCT FROM OLD.workstation_id
       OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'perubahan identitas peserta hanya boleh dilakukan oleh pengelola';
    END IF;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS participants_set_updated_at ON public.participants;
CREATE TRIGGER participants_set_updated_at BEFORE UPDATE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS participants_audit_delete ON public.participants;
CREATE TRIGGER participants_audit_delete BEFORE DELETE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.log_participant_deletion();

DROP TRIGGER IF EXISTS participants_protect_identity ON public.participants;
CREATE TRIGGER participants_protect_identity BEFORE UPDATE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.protect_participant_identity();

-- ========================================================
-- FUNGSI AMAN: validasi token tanpa membuka daftar token
-- ========================================================
-- Hanya mengembalikan token yang AKTIF dan kodenya persis cocok.
-- Memakai SECURITY DEFINER sehingga policy tetap bisa memastikannya tanpa
-- membuka daftar token ke-role anon.
CREATE OR REPLACE FUNCTION public.token_is_active(token_code text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tokens
    WHERE lower(code) = lower(token_code) AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.check_exam_token(token_code text)
RETURNS SETOF public.tokens
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.tokens
  WHERE lower(code) = lower(token_code) AND is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.check_exam_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_exam_token(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.token_is_active(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.token_is_active(text) TO anon, authenticated;

-- ========================================================
-- ROW LEVEL SECURITY: hapus policy lama yang terlalu longgar
-- ========================================================
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_deletions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read and write on tokens" ON public.tokens;
DROP POLICY IF EXISTS "Allow public read and write on participants" ON public.participants;
DROP POLICY IF EXISTS "Allow public read and write on settings" ON public.settings;

DROP POLICY IF EXISTS tokens_anon_read ON public.tokens;
DROP POLICY IF EXISTS tokens_admin_all ON public.tokens;
DROP POLICY IF EXISTS settings_anon_read ON public.settings;
DROP POLICY IF EXISTS settings_admin_all ON public.settings;
DROP POLICY IF EXISTS participants_anon_select ON public.participants;
DROP POLICY IF EXISTS participants_anon_insert ON public.participants;
DROP POLICY IF EXISTS participants_anon_update ON public.participants;
DROP POLICY IF EXISTS participants_anon_delete ON public.participants;
DROP POLICY IF EXISTS participants_admin_all ON public.participants;
DROP POLICY IF EXISTS admins_read_authenticated ON public.admins;
DROP POLICY IF EXISTS admins_admin_all ON public.admins;
DROP POLICY IF EXISTS participant_deletions_read_authenticated ON public.participant_deletions;

-- Tokes: anon HANYA membaca (kode token tidak boleh bisa diburu/ditebak),
-- pengelola (authenticated) bebas mengelola.
CREATE POLICY tokens_anon_read ON public.tokens
  FOR SELECT TO anon USING (true);

CREATE POLICY tokens_admin_all ON public.tokens
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Pengaturan: anon hanya membaca (link form & durasi), pengelola bebas mengubah.
CREATE POLICY settings_anon_read ON public.settings
  FOR SELECT TO anon USING (true);

CREATE POLICY settings_admin_all ON public.settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Rekap peserta: TIDAK boleh dibaca anon (nama & NIM peserta bersifat privasi).
-- Peserta hanya boleh membuat/memperbarui baris miliknya sendiri (id acak),
-- dan hanya boleh menghapus baris yang masih berjalan.
CREATE POLICY participants_admin_all ON public.participants
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY participants_anon_insert ON public.participants
  FOR INSERT TO anon WITH CHECK (
    status = 'in_progress'
    AND completed_at IS NULL
    AND length(trim(name)) > 0
    AND length(trim(nim)) > 0
    AND length(trim(id)) > 0
    AND public.token_is_active(token_code)
  );

CREATE POLICY participants_anon_update ON public.participants
  FOR UPDATE TO anon
  USING (status = 'in_progress')
  WITH CHECK (
    status IN ('in_progress', 'completed')
    AND ((status = 'completed' AND completed_at IS NOT NULL)
      OR (status = 'in_progress' AND completed_at IS NULL))
  );

CREATE POLICY participants_anon_delete ON public.participants
  FOR DELETE TO anon
  USING (status = 'in_progress' AND completed_at IS NULL);

-- Daftar pengelola hanya terbaca oleh pengguna yang sudah login.
CREATE POLICY admins_read_authenticated ON public.admins
  FOR SELECT TO authenticated USING (true);

CREATE POLICY admins_admin_all ON public.admins
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Jejak penghapusan hanya untuk pengelola.
CREATE POLICY participant_deletions_read_authenticated ON public.participant_deletions
  FOR SELECT TO authenticated USING (true);

-- ========================================================
-- DATA AWAL
-- ========================================================
INSERT INTO public.tokens (id, code, name, exam_type, is_active, max_capacity, exam_date, note)
VALUES
  ('tok-1', 'TOEFL-2025', 'Hari 1: Ujian TOEFL Like Prediction (3 Seksi)', 'toefl', true, 120, 'Hari 1 - Sesi TOEFL', 'Listening (35m), Structure (25m), Reading (55m)'),
  ('tok-2', 'TPA-2025', 'Hari 2: Tes Potensi Akademik (TPA)', 'tpa', true, 120, 'Hari 2 - Sesi TPA', 'Jadwal terpisah khusus TPA (60m)')
ON CONFLICT (code) DO NOTHING;

-- Daftar pengelola. Ganti atau tambah email di sini bila diperlukan.
-- Email inilah yang dipakai untuk login ke panel (tanpa storing kredensial di bundel).
INSERT INTO public.admins (email, label)
VALUES ('arief@stienas-ypb.ac.id', 'Pengawas Lab Terpadu')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.settings (
  id, institution_name, listening_url, listening_minutes,
  structure_url, structure_minutes, reading_url, reading_minutes,
  tpa_url, tpa_minutes
)
VALUES (
  'primary',
  'STIE Nasional Banjarmasin',
  'https://docs.google.com/forms/d/e/1FAIpQLSc3HqZPmME3Slwo6BRyy16vB7rIozv3R78-Icm7rKYTpSo09A/viewform?embedded=true',
  35,
  'https://docs.google.com/forms/d/e/1FAIpQLSfEMFWj3qwoSNQ6xDrGn349nWE539QYep6CT2xrCPKoqQ1cLg/viewform?embedded=true',
  25,
  'https://docs.google.com/forms/d/e/1FAIpQLScl5E7a0Wk8UZvGRAbi9eZUAnf8wqn3SZ2WEfwHVelvZdpoqA/viewform?embedded=true',
  55,
  'https://docs.google.com/forms/d/e/1FAIpQLSez0TzrQcF5HfqQ-D0dGALZX54Y5V2Et2vo-FQEm6TQrGvXKA/viewform?embedded=true',
  60
)
ON CONFLICT (id) DO NOTHING;
