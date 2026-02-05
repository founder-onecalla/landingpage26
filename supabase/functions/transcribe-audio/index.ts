import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Upload to storage
    const timestamp = Date.now();
    const audioPath = `${step1_id}/${timestamp}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('voice-intake')
      .upload(audioPath, audioData, {
        contentType: audio_mime,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
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
