import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decode as base64Decode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Verify HMAC-based token
async function verifyToken(token: string, secret: string): Promise<{ step1_id: string; exp: number } | null> {
  try {
    const [dataBase64, signatureBase64] = token.split('.');
    if (!dataBase64 || !signatureBase64) return null;

    const encoder = new TextEncoder();
    const data = new TextDecoder().decode(base64Decode(dataBase64));
    const signature = base64Decode(signatureBase64);

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
    if (!isValid) return null;

    const payload = JSON.parse(data);

    // Check expiration
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch (e) {
    console.error('Token verification error:', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, company, description_text, audio_path, transcript_text, phone } = await req.json();

    // Validate required fields
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!company || !company.trim()) {
      return new Response(
        JSON.stringify({ error: 'Company is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!description_text || !description_text.trim()) {
      return new Response(
        JSON.stringify({ error: 'Description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token
    const tokenSecret = Deno.env.get('INTAKE_TOKEN_SECRET');
    if (!tokenSecret) {
      throw new Error('INTAKE_TOKEN_SECRET is not configured');
    }

    const payload = await verifyToken(token, tokenSecret);
    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { step1_id } = payload;

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify step1 exists
    const { data: step1, error: step1Error } = await supabase
      .from('lead_intake_step1')
      .select('id')
      .eq('id', step1_id)
      .single();

    if (step1Error || !step1) {
      return new Response(
        JSON.stringify({ error: 'Invalid token - intake not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert into database
    const { error: dbError } = await supabase
      .from('lead_intake_step2')
      .insert({
        step1_id,
        company: company.trim(),
        description_text: description_text.trim(),
        audio_path: audio_path || null,
        transcript_text: transcript_text || null,
        phone: phone?.trim() || null,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save data');
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
