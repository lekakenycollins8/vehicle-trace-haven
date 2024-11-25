import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    if (req.method === 'POST') {
      const body = await req.json();
      const { vehicleId, type, message } = body;

      if (!vehicleId || !type || !message) {
        throw new Error('Missing required fields');
      }

      // Verify vehicle belongs to user
      const { data: vehicle, error: vehicleError } = await supabaseClient
        .from('vehicles')
        .select('id')
        .eq('id', vehicleId)
        .eq('user_id', user.id)
        .single();

      if (vehicleError || !vehicle) {
        throw new Error('Vehicle not found or unauthorized');
      }

      const { data: alert, error: insertError } = await supabaseClient
        .from('alerts')
        .insert({
          vehicle_id: vehicleId,
          type,
          message,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database error:', insertError);
        throw insertError;
      }

      return new Response(
        JSON.stringify({ alert }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201,
        }
      );
    }

    // GET request - fetch alerts
    const { data: alerts, error: fetchError } = await supabaseClient
      .from('alerts')
      .select('*, vehicles!inner(*)')
      .eq('vehicles.user_id', user.id)
      .order('timestamp', { ascending: false });

    if (fetchError) {
      console.error('Database error:', fetchError);
      throw fetchError;
    }

    return new Response(
      JSON.stringify({ alerts: alerts || [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status || 500,
      }
    );
  }
});