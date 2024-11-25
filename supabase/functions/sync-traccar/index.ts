import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch data from Traccar API
    const traccarUrl = Deno.env.get('TRACCAR_API_URL');
    const traccarToken = Deno.env.get('TRACCAR_API_TOKEN');

    // Fetch positions from Traccar
    const positionsResponse = await fetch(`${traccarUrl}/positions`, {
      headers: {
        'Authorization': `Bearer ${traccarToken}`,
      },
    });

    if (!positionsResponse.ok) {
      throw new Error(`Traccar API error: ${positionsResponse.statusText}`);
    }

    const positions = await positionsResponse.json();

    // Update positions in Supabase
    for (const position of positions) {
      const { data, error } = await supabaseClient
        .from('positions')
        .upsert({
          vehicle_id: position.deviceId,
          latitude: position.latitude,
          longitude: position.longitude,
          speed: position.speed,
          timestamp: position.fixTime,
        });

      if (error) {
        console.error('Error updating position:', error);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});