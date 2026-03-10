import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface NearbyDropsRequest {
  latitude: number;
  longitude: number;
  radius_meters: number;
  wallet_address?: string;
}

interface NearbyDropRow {
  id: string;
  on_chain_address: string;
  creator_wallet: string;
  title: string;
  description: string | null;
  location: string;
  geohash: string;
  rarity_tier: number;
  asset_type: number;
  asset_amount: number;
  mint_address: string | null;
  max_claims: number;
  current_claims: number;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  distance_meters: number;
  already_claimed: boolean;
}

interface NearbyDropsResponse {
  drops: NearbyDropRow[];
  meta: {
    total: number;
    latitude: number;
    longitude: number;
    radius_meters: number;
  };
}

type FallbackDropRow = Omit<NearbyDropRow, 'distance_meters' | 'already_claimed'>;

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: NearbyDropsRequest;
  try {
    body = (await req.json()) as NearbyDropsRequest;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { latitude, longitude, radius_meters, wallet_address } = body;

  // Validate inputs
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return new Response(JSON.stringify({ error: 'Invalid latitude or longitude' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const clampedRadius = Math.min(typeof radius_meters === 'number' ? radius_meters : 2000, 5000);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // PostGIS geospatial query with optional already-claimed check
  const walletParam = wallet_address ?? '';

  const { data, error } = await supabase.rpc('get_nearby_drops', {
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_meters: clampedRadius,
    p_wallet_address: walletParam,
  });

  if (error) {
    // Fallback: direct query if RPC not available
    const { data: fallback, error: fallbackError } = await supabase
      .from('drops')
      .select('*')
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .limit(50);

    if (fallbackError) {
      return new Response(JSON.stringify({ error: fallbackError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const drops = ((fallback ?? []) as FallbackDropRow[]).map((row) => ({
      ...row,
      distance_meters: 0,
      already_claimed: false,
    }));

    const response: NearbyDropsResponse = {
      drops,
      meta: { total: drops.length, latitude, longitude, radius_meters: clampedRadius },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }

  const response: NearbyDropsResponse = {
    drops: (data as NearbyDropRow[]) ?? [],
    meta: {
      total: ((data as NearbyDropRow[]) ?? []).length,
      latitude,
      longitude,
      radius_meters: clampedRadius,
    },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
});
