import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
    
    // Create verification link
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://limitedtrial.onecalla.com';
    const verificationLink = `${SITE_URL}/verify?token=${token}`;

    if (RESEND_API_KEY) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'OneCalla <noreply@onecalla.com>',
          to: email,
          subject: 'Verify your email',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="color: #0B0F1A; font-size: 24px; font-weight: 600; margin-bottom: 16px;">Verify your email</h1>
              <p style="color: #6B7280; font-size: 16px; line-height: 1.5; margin-bottom: 32px;">Click the button below to confirm your email and complete your submission.</p>
              <a href="${verificationLink}" style="display: inline-block; background: #6C5CE7; color: #FFFFFF; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px;">Verify my email</a>
              <p style="color: #9CA3AF; font-size: 14px; margin-top: 32px;">This link expires in 24 hours.</p>
            </div>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error('Failed to send email:', await emailResponse.text());
      }
    } else {
      // Development mode - log the link
      console.log(`[DEV] Verification link for ${email}: ${verificationLink}`);
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
