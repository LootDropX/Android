-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- drops table
-- ============================================================
CREATE TABLE IF NOT EXISTS drops (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  on_chain_address    text         UNIQUE NOT NULL,
  creator_wallet      text         NOT NULL,
  title               text         NOT NULL,
  description         text,
  location            geography(POINT, 4326) NOT NULL,
  geohash             text         NOT NULL,
  rarity_tier         smallint     NOT NULL CHECK (rarity_tier BETWEEN 0 AND 3),
  asset_type          smallint     NOT NULL,
  asset_amount        bigint       NOT NULL,
  mint_address        text,
  max_claims          smallint     NOT NULL,
  current_claims      smallint     NOT NULL DEFAULT 0,
  expires_at          timestamptz  NOT NULL,
  is_active           boolean      NOT NULL DEFAULT true,
  created_at          timestamptz  NOT NULL DEFAULT now()
);

-- Spatial index for proximity queries
CREATE INDEX idx_drops_location ON drops USING GIST(location);

-- Compound index for active/expiry filtering
CREATE INDEX idx_drops_active_expiry ON drops (is_active, expires_at);

-- Index for geohash-based queries
CREATE INDEX idx_drops_geohash ON drops (geohash);

-- ============================================================
-- claims table
-- ============================================================
CREATE TABLE IF NOT EXISTS claims (
  id                    uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id               uuid         REFERENCES drops(id) ON DELETE CASCADE,
  drop_on_chain_address text         NOT NULL,
  claimer_wallet        text         NOT NULL,
  tx_signature          text         UNIQUE NOT NULL,
  distance_meters       float        NOT NULL,
  claimed_at            timestamptz  NOT NULL DEFAULT now(),
  UNIQUE (drop_id, claimer_wallet)
);

CREATE INDEX idx_claims_claimer ON claims (claimer_wallet);
CREATE INDEX idx_claims_drop_id ON claims (drop_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Drops: publicly readable
CREATE POLICY "drops_public_read" ON drops
  FOR SELECT USING (true);

-- Claims: publicly readable
CREATE POLICY "claims_public_read" ON claims
  FOR SELECT USING (true);

-- Inserts require service_role (backend validates on-chain state first)
CREATE POLICY "drops_service_insert" ON drops
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "claims_service_insert" ON claims
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
