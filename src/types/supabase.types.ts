/**
 * Auto-generated Supabase database schema types.
 * Re-run `supabase gen types typescript` to regenerate.
 */
export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      drops: {
        Row: {
          id: string;
          on_chain_address: string;
          creator_wallet: string;
          title: string;
          description: string | null;
          /** PostGIS geography point — returned as WKT or GeoJSON by PostgREST */
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
        };
        Insert: {
          id?: string;
          on_chain_address: string;
          creator_wallet: string;
          title: string;
          description?: string | null;
          location: string;
          geohash: string;
          rarity_tier: number;
          asset_type: number;
          asset_amount: number;
          mint_address?: string | null;
          max_claims: number;
          current_claims?: number;
          expires_at: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['drops']['Insert']>;
        Relationships: [];
      };
      claims: {
        Row: {
          id: string;
          drop_id: string;
          drop_on_chain_address: string;
          claimer_wallet: string;
          tx_signature: string;
          distance_meters: number;
          claimed_at: string;
        };
        Insert: {
          id?: string;
          drop_id: string;
          drop_on_chain_address: string;
          claimer_wallet: string;
          tx_signature: string;
          distance_meters: number;
          claimed_at?: string;
        };
        Update: Partial<Database['public']['Tables']['claims']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type DropsRow = Database['public']['Tables']['drops']['Row'];
export type ClaimsRow = Database['public']['Tables']['claims']['Row'];
