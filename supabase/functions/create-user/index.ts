import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // Check if the user is an ADMIN
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();

        if (profile?.role !== 'ADMIN') {
            return new Response(JSON.stringify({ error: 'Forbidden: Admins only' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            })
        }

        const { email, password, name, role } = await req.json()

        // Create Supabase Admin client to create user
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Create auth user
        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role }
        })

        if (createUserError) {
            return new Response(JSON.stringify({ error: createUserError.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        // 2. Create of profile in public table
        // Since we manually manage this, we insert it here.
        if (newUser.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .insert([
                    { id: newUser.user.id, name, role }
                ])

            if (profileError) {
                return new Response(JSON.stringify({ error: "User created but profile failed: " + profileError.message }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400
                })
            }
        }

        return new Response(
            JSON.stringify(newUser),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
