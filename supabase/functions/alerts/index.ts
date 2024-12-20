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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth user
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

    // Handle POST requests for creating alerts
    if (req.method === 'POST') {
      const { vehicleId, type, message } = await req.json();

      if (!vehicleId || !type || !message) {
        return new Response(
          JSON.stringify({ 
            error: 'Missing required fields',
            details: 'vehicleId, type, and message are required' 
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
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

    // Handle GET requests for fetching alerts
    const { data: alerts, error: fetchError } = await supabaseClient
      .from('alerts')
      .select('*')
      .eq('resolved', false)
      .order('timestamp', { ascending: false });

    if (fetchError) {
      console.error('Error fetching alerts:', fetchError);
      throw fetchError;
    }

    // Ensure we have data to return, even if it's an empty array
    return new Response(
      JSON.stringify({ alerts: alerts || [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in alerts function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});