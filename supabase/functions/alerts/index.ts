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
      let body;
      try {
        body = await req.json();
      } catch (e) {
        console.error('JSON parse error:', e);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid JSON in request body',
            details: e.message 
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
          }
        );
      }

      const { vehicleId, type, message } = body;

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

      // Verify vehicle belongs to user
      const { data: vehicle, error: vehicleError } = await supabaseClient
        .from('vehicles')
        .select('id')
        .eq('id', vehicleId)
        .eq('user_id', user.id)
        .single();

      if (vehicleError || !vehicle) {
        return new Response(
          JSON.stringify({ 
            error: 'Vehicle not found or unauthorized',
            details: vehicleError?.message 
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403
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
        console.error('Database error:', insertError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create alert',
            details: insertError.message 
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        );
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
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch alerts',
          details: fetchError.message 
        }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }

    return new Response(
      JSON.stringify({ alerts: alerts || [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || 'Unknown error'
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});