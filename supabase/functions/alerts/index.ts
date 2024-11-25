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

    if (req.method === 'POST') {
      const { vehicleId, type, message } = await req.json();
      
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

      const { data: alert, error } = await supabaseClient
        .from('alerts')
        .insert([{ vehicle_id: vehicleId, type, message }])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ alert }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    } else {
      // GET request - fetch alerts
      const url = new URL(req.url);
      const vehicleId = url.searchParams.get('vehicleId');
      const type = url.searchParams.get('type');
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      let query = supabaseClient
        .from('alerts')
        .select('*, vehicles!inner(*)')
        .eq('vehicles.user_id', user.id);

      if (vehicleId) query = query.eq('vehicle_id', vehicleId);
      if (type) query = query.eq('type', type);
      if (startDate) query = query.gte('timestamp', startDate);
      if (endDate) query = query.lte('timestamp', endDate);

      const { data: alerts, error } = await query;
      if (error) throw error;

      return new Response(JSON.stringify({ alerts }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});