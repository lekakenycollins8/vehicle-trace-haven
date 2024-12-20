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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid token');
    }

    // Parse query parameters
    const url = new URL(req.url);
    const vehicleId = url.searchParams.get('vehicleId');
    const startTime = url.searchParams.get('startTime');
    const endTime = url.searchParams.get('endTime');

    let query = supabaseClient
      .from('positions')
      .select('*, vehicles!inner(*)')
      .eq('vehicles.user_id', user.id);

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId);
    }
    if (startTime) {
      query = query.gte('timestamp', startTime);
    }
    if (endTime) {
      query = query.lte('timestamp', endTime);
    }

    const { data: positions, error } = await query;
    if (error) throw error;

    return new Response(JSON.stringify({ positions }), {
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