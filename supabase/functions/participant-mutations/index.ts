// ========================================================
// Edge Function: participant-mutations
// Menjalankan perubahan data peserta di sisi server memakai service-role key,
// sehingga tabel `participants` bisa dikunci penuh dari akses anon.
//
// Deploy:
//   supabase login
//   supabase link --project-ref qqjeajnrepmawqjqsuup
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
//   supabase functions deploy participant-mutations --project-ref qqjeajnrepmawqjqsuup
//
// Catatan: frontend EduCore otomatis memakai Edge Function bila tersedia dan
// jatuh ke penulisan tabel langsung bila fungsi belum di-deploy.
// ========================================================

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });

/** Mengcek apakah pemohon adalah pengelola yang sah. */
async function isAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return false;

  const email = (data.user.email ?? '').trim().toLowerCase();
  if (!email) return false;
  if (data.user.app_metadata?.role === 'admin') return true;

  const { data: adminRow, error: adminError } = await service
    .from('admins')
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (adminError) return false;
  return !!adminRow;
}

const isFilled = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const admin = await isAdmin(req);

  switch (body?.action) {
    case 'validate-token': {
      const code = body.code;
      if (!isFilled(code)) return json({ error: 'invalid_token_code' }, 400);

      const { data: token, error } = await service
        .from('tokens')
        .select('id, code, name, exam_type, is_active, created_at, used_count, max_capacity, exam_date, note')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
      if (error) return json({ error: 'token_lookup_failed' }, 503);
      if (!token) return json({ token: null });

      return json({
        token: {
          id: token.id,
          code: token.code,
          name: token.name,
          exam_type: token.exam_type,
          is_active: token.is_active,
          created_at: token.created_at,
          used_count: token.used_count ?? 0,
          max_capacity: token.max_capacity,
          exam_date: token.exam_date,
          note: token.note,
        },
      });
    }

    case 'upsert': {
      const record = body.record as Record<string, unknown> | undefined;
      if (
        !record ||
        !isFilled(record.id) ||
        !isFilled(record.name) ||
        !isFilled(record.nim) ||
        !isFilled(record.tokenCode) ||
        !isFilled(record.examType) ||
        !isFilled(record.examName) ||
        !isFilled(record.startedAt) ||
        !isFilled(record.status)
      ) {
        return json({ error: 'invalid_record' }, 400);
      }

      if (!['Akuntansi', 'Manajemen'].includes(record.prodi as string)
        || !['toefl', 'tpa'].includes(record.examType as string)
        || !['in_progress', 'completed'].includes(record.status as string)) {
        return json({ error: 'invalid_record_values' }, 400);
      }

      const { data: existing, error: existingError } = await service
        .from('participants')
        .select('id, name, nim, prodi, exam_type, exam_name, token_code, started_at, status, completed_at, workstation_id')
        .eq('id', record.id)
        .maybeSingle();
      if (existingError) return json({ error: 'participant_lookup_failed' }, 503);

      if (!admin && existing) {
        // The browser may update progress and finish its own row, but may not
        // rewrite identity, token, start time, or workstation ownership.
        const immutableMatches = existing.name === record.name
          && existing.nim === record.nim
          && existing.prodi === record.prodi
          && existing.exam_type === record.examType
          && existing.exam_name === record.examName
          && existing.token_code === record.tokenCode
          && existing.started_at === record.startedAt
          && existing.workstation_id === record.workstationId;
        if (!immutableMatches || existing.status === 'completed') {
          return json({ error: 'participant_identity_mismatch' }, 403);
        }
      }

      // New participant rows can only be started with an active token. A
      // completion is accepted only as a transition of an existing row.
      if (!existing && (!admin || record.status !== 'in_progress')) {
        return json({ error: 'invalid_participant_transition' }, 403);
      }
      if (!existing) {
        const { data: token, error: tokenError } = await service
          .from('tokens')
          .select('code, is_active, exam_type, used_count, max_capacity')
          .eq('code', record.tokenCode)
          .maybeSingle();
        if (tokenError || !token || !token.is_active || token.exam_type !== record.examType) {
          return json({ error: 'invalid_token' }, 403);
        }
        if (token.max_capacity && token.used_count >= token.max_capacity) {
          return json({ error: 'token_capacity_reached' }, 409);
        }
      }
      if (record.status === 'completed' && !record.completedAt) {
        return json({ error: 'completed_at_required' }, 400);
      }
      if (record.status === 'in_progress' && record.completedAt) {
        return json({ error: 'invalid_completion_state' }, 400);
      }

      const row = {
        id: record.id as string,
        name: record.name as string,
        nim: record.nim as string,
        prodi: record.prodi as string,
        exam_type: record.examType as string,
        exam_name: record.examName as string,
        token_code: record.tokenCode as string,
        started_at: record.startedAt as string,
        completed_at: (record.completedAt as string | undefined) ?? null,
        status: record.status as string,
        current_section: (record.currentSection as string | undefined) ?? null,
        workstation_id: (record.workstationId as string | undefined) ?? 'LAB-CBT',
      };

      const { error } = await service.from('participants').upsert([row], { onConflict: 'id' });
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    case 'delete': {
      const id = body.id;
      if (!isFilled(id)) return json({ error: 'invalid_id' }, 400);

      if (!admin) {
        const { data: existing } = await service
          .from('participants')
          .select('status, completed_at')
          .eq('id', id)
          .maybeSingle();

        if (!existing || existing.status !== 'in_progress' || existing.completed_at) {
          return json({ error: 'forbidden_delete' }, 403);
        }
      }

      const { error } = await service.from('participants').delete().eq('id', id);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    case 'clear': {
      if (!admin) return json({ error: 'admin_required' }, 403);
      const { error } = await service.from('participants').delete().neq('id', '0');
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true });
    }

    default:
      return json({ error: 'unknown_action' }, 400);
  }
});
