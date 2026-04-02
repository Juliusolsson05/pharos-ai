
# Frontend Symbology Mini-Package

This folder is a starter implementation for a real symbology library, not just another bag of icon helpers.

## What it does

- Keeps military-standard icon definitions in a searchable catalog
- Resolves business/domain objects into icon choices through explicit rules
- Preserves fallback chains and human-readable reasoning
- Renders icons through one shared renderer
- Adapts rendered output to DeckGL cleanly
- Supports non-military thematic icons in the same system

## Why this structure

Your current code mixes four different concerns:

1. military-standard knowledge
2. provider-specific data rules
3. rendering/caching
4. UI legend behavior

That works for a beta map, but it becomes brittle when more layers and more icon families appear. This package splits those concerns so they can evolve independently.

## Recommended placement

Use one of these long-term homes:

- `src/lib/symbology/` if you want it app-wide
- `packages/symbology/` later if you move toward a monorepo

## Recommended next steps

1. Replace hard-coded icon constants with catalog entries
2. Route each current layer through `resolveCurrentAppSymbol`
3. Replace direct `milsymbol` calls in map layers with `renderSymbolEntry`
4. Add a proper panel route for `SymbolExplorer`
5. Later: generate a full normalized catalog from `mil-std-2525`
