import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encode as base64Encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email copy - locked per spec
const EMAIL_SUBJECT = 'One quick step so we can handle your call';
const EMAIL_HEADLINE = 'One quick step so we can handle your call';
const EMAIL_BODY = 'Thanks for reaching out. We just need a few more details to get your call handled.';
const EMAIL_BUTTON = 'Complete 2-minute intake';
const EMAIL_EXPIRY = 'This link expires in 7 days.';

// Simple HMAC-based token signing
async function signToken(payload: object, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = JSON.stringify(payload);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureBase64 = base64Encode(new Uint8Array(signature));
  const dataBase64 = base64Encode(encoder.encode(data));
  return `${dataBase64}.${signatureBase64}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, call_types, avoided_call_text, utm_source, utm_campaign } = await req.json();

    // Validate required fields
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert into database
    const { data: step1, error: dbError } = await supabase
      .from('lead_intake_step1')
      .insert({
        email,
        call_types: call_types || [],
        avoided_call_text: avoided_call_text || null,
        utm_source: utm_source || null,
        utm_campaign: utm_campaign || null,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save data');
    }

    // Generate signed token (expires in 7 days)
    const tokenSecret = Deno.env.get('INTAKE_TOKEN_SECRET');
    if (!tokenSecret) {
      throw new Error('INTAKE_TOKEN_SECRET is not configured');
    }

    const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    const tokenPayload = {
      step1_id: step1.id,
      exp: expiration,
    };
    const token = await signToken(tokenPayload, tokenSecret);

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'http://localhost:3333';
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'concierge@onecalla.com';
    const intakeUrl = `${appBaseUrl}/details?t=${encodeURIComponent(token)}`;

    // Minimal email template - white background, single accent color, locked copy
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${EMAIL_SUBJECT}</title>
</head>
<body style="font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #0B0F1A; background-color: #FFFFFF; margin: 0; padding: 0;">
  <div style="max-width: 480px; margin: 0 auto; padding: 48px 24px;">
    <h1 style="font-size: 24px; font-weight: 600; margin: 0 0 16px 0; color: #0B0F1A;">
      ${EMAIL_HEADLINE}
    </h1>
    <p style="font-size: 16px; margin: 0 0 24px 0; color: #0B0F1A;">
      ${EMAIL_BODY}
    </p>
    <a href="${intakeUrl}" style="display: inline-block; background-color: #6C5CE7; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">
      ${EMAIL_BUTTON}
    </a>
    <p style="font-size: 13px; color: #6B7280; margin: 32px 0 0 0;">
      ${EMAIL_EXPIRY}
    </p>
  </div>
</body>
</html>`;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: email,
        subject: EMAIL_SUBJECT,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Resend error:', errorText);
      // Don't fail the request if email fails, data is already saved
    }

    // Return token so frontend can build the inline link
    return new Response(
      JSON.stringify({ ok: true, token }),
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
