# LOOT DROP — GitHub Copilot Instructions

## Project Context
LOOT DROP is a GPS-based on-chain asset scavenger hunt mobile app for the 
Solana Mobile Seeker device, targeting the Solana dApp Store.

## Tech Stack
- React Native (Expo SDK 51, bare workflow)
- TypeScript (strict mode)
- Solana Mobile Wallet Adapter (MWA) v2
- @solana/web3.js v1.x
- Anchor framework (Rust) for on-chain program
- React Navigation v6 + Expo Router v3
- React Native Maps (Google Maps on Android)
- Zustand for global state
- TanStack Query v5 for server state
- NativeWind v4 (Tailwind for React Native)
- Expo Location API for GPS
- Supabase (Postgres + PostGIS + Realtime + Edge Functions)
- Metaplex Umi + Token Metadata for NFTs

## Architecture Rules
1. Every component is a typed functional component with explicit props interface
2. Custom hooks handle ALL business logic (components are pure UI)
3. On-chain program is source of truth; Supabase is for metadata only
4. Android-first (Seeker device). iOS secondary.
5. All wallet interactions must use MWA — never store private keys
6. Secrets via expo-constants / environment variables only
7. JSDoc on every exported function and hook

## Folder Structure
```
src/
├── components/     ← Pure UI components
├── hooks/          ← All business logic
├── program/        ← Anchor IDL + instruction builders
├── services/       ← Supabase, Helius, geohash
├── stores/         ← Zustand global state
├── types/          ← TypeScript interfaces
├── constants/      ← Config values
└── utils/          ← Pure utility functions
```

## Key Files
- `src/types/drop.types.ts` — core domain types
- `src/constants/rarity.ts` — rarity tiers, radii, colors
- `src/hooks/useClaimDrop.ts` — claim orchestration (most critical hook)
- `src/program/instructions/claimDrop.ts` — Anchor instruction builder
- `app/(tabs)/map.tsx` — hero screen
