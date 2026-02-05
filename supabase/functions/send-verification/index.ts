import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create a simple token with expiry
function createToken(email: string, code: string): string {
  const payload = {
    email,
    code,
    exp: Date.now() + 10 * 60 * 1000, // 10 minutes
  };
  return btoa(JSON.stringify(payload));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate verification code
    const code = generateCode();
    const token = createToken(email, code);

    // Send email via Resend (or your email provider)
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (RESEND_API_KEY) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'OneCallA <noreply@onecalla.com>',
          to: email,
          subject: `Your verification code: ${code}`,
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #0B0F1A; margin-bottom: 16px;">Verify your email</h2>
              <p style="color: #6B7280; margin-bottom: 24px;">Enter this code to continue:</p>
              <div style="background: #F7F7FB; border-radius: 12px; padding: 24px; text-align: center;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #6C5CE7;">${code}</span>
              </div>
              <p style="color: #9CA3AF; font-size: 14px; margin-top: 24px;">This code expires in 10 minutes.</p>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error('Failed to send email:', await emailResponse.text());
        // Continue anyway for development - token still works
      }
    } else {
      // Development mode - log the code
      console.log(`[DEV] Verification code for ${email}: ${code}`);
    }

    return new Response(
      JSON.stringify({ ok: true, token }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
