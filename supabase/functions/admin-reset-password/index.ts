// ============================================================================
// Edge Function: admin-reset-password
// ----------------------------------------------------------------------------
// Permite que un usuario con rol SUPERADMIN fije una nueva contraseña para
// cualquier usuario de la plataforma (p. ej. si se ha quedado bloqueado),
// sin necesidad de que el usuario tenga acceso a su email.
//
// Usa la Service Role Key (secreta, disponible automáticamente dentro de las
// Edge Functions de Supabase como variable de entorno) para llamar a la Admin
// API de Supabase Auth. Esta clave NUNCA debe exponerse en el frontend.
//
// Seguridad: antes de tocar nada, se verifica que quien llama:
//   1. Tiene una sesión válida (token en el header Authorization).
//   2. Tiene role = 'SUPERADMIN' en la tabla `profiles`.
// ============================================================================

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Método no permitido');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No autorizado: falta sesión.');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Cliente "de quien llama": usa su propio JWT, respeta RLS.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !user) throw new Error('Sesión inválida o caducada.');

    const { data: callerProfile, error: profileErr } = await callerClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileErr || !callerProfile || callerProfile.role !== 'SUPERADMIN') {
      throw new Error('Solo un Super Administrador puede resetear contraseñas.');
    }

    const { userId, newPassword } = await req.json();
    if (!userId || typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new Error('Faltan datos: se requiere userId y una contraseña de al menos 8 caracteres.');
    }

    // Cliente con privilegios de administrador (Service Role) — solo aquí,
    // solo tras superar la comprobación de rol de arriba.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { error: resetErr } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (resetErr) throw resetErr;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
