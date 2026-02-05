import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { decode as base64Decode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { step1_id, audio_base64, audio_mime } = await req.json();

    // Validate required fields
    if (!step1_id || !audio_base64 || !audio_mime) {
      return new Response(
        JSON.stringify({ error: 'step1_id, audio_base64, and audio_mime are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Decode audio from base64
    const audioData = base64Decode(audio_base64);

    // Determine file extension from mime type
    const extMap: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp4': 'mp4',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
    };
    const ext = extMap[audio_mime] || 'webm';

    // Upload to storage using REST API
    const timestamp = Date.now();
    const audioPath = `${step1_id}/${timestamp}.${ext}`;

    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/voice-intake/${audioPath}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': audio_mime,
        },
        body: audioData,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Storage upload error:', errorText);
      throw new Error('Failed to store audio');
    }

    // Call OpenAI Whisper API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Create form data for OpenAI
    const formData = new FormData();
    const audioBlob = new Blob([audioData], { type: audio_mime });
    formData.append('file', audioBlob, `audio.${ext}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error('OpenAI Whisper error:', errorText);
      throw new Error('Transcription failed');
    }

    const whisperResult = await whisperResponse.json();
    const transcriptText = whisperResult.text || '';

    return new Response(
      JSON.stringify({
        transcript_text: transcriptText,
        audio_path: audioPath,
      }),
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
