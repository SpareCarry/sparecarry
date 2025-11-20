// Supabase Edge Function: Create Match
// POST /functions/v1/create-match

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { request_id } = body

    if (!request_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: request_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify request exists and is open
    const { data: request, error: requestError } = await supabaseClient
      .from('requests')
      .select('*')
      .eq('id', request_id)
      .single()

    if (requestError || !request) {
      return new Response(
        JSON.stringify({ error: 'Request not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (request.status !== 'open') {
      return new Response(
        JSON.stringify({ error: 'Request is not open for matching' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if match already exists
    const { data: existingMatch } = await supabaseClient
      .from('matches')
      .select('id')
      .eq('request_id', request_id)
      .eq('traveler_id', user.id)
      .single()

    if (existingMatch) {
      return new Response(
        JSON.stringify({ error: 'Match already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create match
    const { data: match, error } = await supabaseClient
      .from('matches')
      .insert({
        request_id,
        traveler_id: user.id,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update request status to 'matched'
    await supabaseClient
      .from('requests')
      .update({ status: 'matched' })
      .eq('id', request_id)

    return new Response(
      JSON.stringify({ data: match }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

