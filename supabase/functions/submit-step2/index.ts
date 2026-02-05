import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify step1 exists
    const step1Response = await fetch(`${supabaseUrl}/rest/v1/lead_intake_step1?id=eq.${step1_id}&select=id`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
    });

    const step1Data = await step1Response.json();
    if (!step1Data || step1Data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid token - intake not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert into database
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/lead_intake_step2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        step1_id,
        company: company.trim(),
        description_text: description_text.trim(),
        audio_path: audio_path || null,
        transcript_text: transcript_text || null,
        phone: phone?.trim() || null,
      }),
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('Database error:', errorText);
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
