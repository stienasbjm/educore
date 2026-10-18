-- ========================================================
-- SCHEMA SQL SUPABASE: EDUCORE (project ref qqjeajnrepmawqjqsuup)
-- Jalankan skrip ini di SQL Editor pada Dashboard Supabase Anda
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) & Policies
-- Membuka akses baca dan tulis anonim agar webapp portal CAT dapat langsung membaca dan menulis data
ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read and write on tokens" ON public.tokens
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read and write on participants" ON public.participants
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read and write on settings" ON public.settings
  FOR ALL USING (true) WITH CHECK (true);

-- Data Awal Sesi Token
INSERT INTO public.tokens (id, code, name, exam_type, is_active, max_capacity, exam_date, note)
VALUES 
  ('tok-1', 'TOEFL-2025', 'Hari 1: Ujian TOEFL Like Prediction (3 Seksi)', 'toefl', true, 120, 'Hari 1 - Sesi TOEFL', 'Listening (35m), Structure (25m), Reading (55m)'),
  ('tok-2', 'TPA-2025', 'Hari 2: Tes Potensi Akademik (TPA)', 'tpa', true, 120, 'Hari 2 - Sesi TPA', 'Jadwal terpisah khusus TPA (60m)')
ON CONFLICT (code) DO NOTHING;

-- Data Awal Link Sematan
INSERT INTO public.settings (
  id,
  institution_name,
  listening_url,
  listening_minutes,
  structure_url,
  structure_minutes,
  reading_url,
  reading_minutes,
  tpa_url,
  tpa_minutes
) VALUES (
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
) ON CONFLICT (id) DO NOTHING;
