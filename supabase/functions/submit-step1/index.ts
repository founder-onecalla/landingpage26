import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, call_types, avoided_call_text, company, description_text, utm_source, utm_campaign } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Insert using REST API directly
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/lead_intake_step1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        email,
        call_types: call_types || [],
        avoided_call_text: avoided_call_text || null,
        company: company || null,
        description_text: description_text || null,
        utm_source: utm_source || null,
        utm_campaign: utm_campaign || null,
      }),
    });

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text();
      console.error('Database error:', errorText);
      throw new Error('Failed to save data');
    }

    const result = await insertResponse.json();

    return new Response(
      JSON.stringify({ ok: true, id: result[0]?.id }),
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
