import WebSocket from 'ws';

import { config } from '../../config.js';
import { prisma } from '../../db.js';
import { toJson } from '../../lib/json.js';
import type { StreamHandle } from '../types.js';

// --- Types ---

type VesselPosition = {
  mmsi: string;
  shipName: string;
  lat: number;
  lon: number;
  speed: number;
  heading: number;
  shipType: number;
  destination: string;
  raw: Record<string, unknown>;
};

// --- State ---

let socket: WebSocket | null = null;
let vessels = new Map<string, VesselPosition>();
let connected = false;
let lastFlushAt = 0;
let totalMessages = 0;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

// ME bounding boxes: Persian Gulf + Arabian Sea, Red Sea, Eastern Med
const BOUNDING_BOXES = [
  [[10, 25], [45, 70]],
  [[12, 30], [35, 45]],
  [[30, 25], [42, 37]],
];

const SOURCE = 'aisstream';

// --- Connection ---

function connect() {
  if (!config.aisstream.apiKey) return;

  console.log('[ais] Connecting to aisstream.io...');
  socket = new WebSocket('wss://stream.aisstream.io/v0/stream');

  socket.onopen = () => {
    connected = true;
    console.log('[ais] Connected, subscribing to ME region');
    socket!.send(JSON.stringify({
      Apikey: config.aisstream.apiKey,
      BoundingBoxes: BOUNDING_BOXES,
      FilterMessageTypes: ['PositionReport'],
    }));
  };

  socket.onmessage = (event) => {
    totalMessages++;
    try {
      const data = JSON.parse(String(event.data));
      const meta = data.MetaData || {};
      const pos = data.Message?.PositionReport;
      if (!pos) return;

      const mmsi = String(meta.MMSI || '');
      if (!mmsi) return;

      const lat = pos.Latitude;
      const lon = pos.Longitude;
      if (!isFinite(lat) || !isFinite(lon)) return;

      vessels.set(mmsi, {
        mmsi,
        shipName: (meta.ShipName || '').trim(),
        lat,
        lon,
        speed: pos.Sog ?? 0,
        heading: pos.TrueHeading ?? pos.Cog ?? 0,
        shipType: meta.ShipType ?? 0,
        destination: (meta.Destination || '').trim(),
        raw: data,
      });
    } catch {
      // Skip malformed messages
    }
  };

  socket.onclose = () => {
    connected = false;
    console.log('[ais] Disconnected');
    scheduleReconnect();
  };

  socket.onerror = () => {
    // onclose will fire after this
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 5000);
}

// --- DB Flush ---

async function flush() {
  const batch = [...vessels.values()];
  if (batch.length === 0) return;

  vessels.clear();
  const now = new Date();
  lastFlushAt = Date.now();

  // Upsert vessel positions
  let stored = 0;
  for (const v of batch) {
    try {
      await prisma.aisPosition.upsert({
        where: { mmsi: v.mmsi },
        create: {
          mmsi: v.mmsi,
          shipName: v.shipName || null,
          lat: v.lat,
          lon: v.lon,
          speed: v.speed,
          heading: v.heading,
          shipType: v.shipType,
          destination: v.destination || null,
          raw: toJson(v.raw),
          lastSeen: now,
        },
        update: {
          shipName: v.shipName || null,
          lat: v.lat,
          lon: v.lon,
          speed: v.speed,
          heading: v.heading,
          shipType: v.shipType,
          destination: v.destination || null,
          raw: toJson(v.raw),
          lastSeen: now,
        },
      });
      stored++;
    } catch {
      // Skip individual failures
    }
  }

  // Derive map features
  await prisma.mapFeature.deleteMany({ where: { source: SOURCE } });

  const features = batch.map((v) => ({
    featureType: 'ASSET',
    sourceEventId: `ais-${v.mmsi}`,
    actor: classifyActor(v),
    priority: 'P3',
    category: 'MARITIME',
    type: classifyType(v.shipType),
    status: v.speed > 0.5 ? 'ACTIVE' : 'ANCHORED',
    timestamp: now,
    geometry: { position: [v.lon, v.lat] },
    properties: {
      name: v.shipName || v.mmsi,
      mmsi: v.mmsi,
      speed: v.speed,
      heading: v.heading,
      destination: v.destination,
      shipType: v.shipType,
    },
    source: SOURCE,
  }));

  if (features.length > 0) {
    await prisma.mapFeature.createMany({ data: features });
  }

  // Update source sync
  await prisma.sourceSync.upsert({
    where: { source: SOURCE },
    create: { source: SOURCE, lastRunAt: now, lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
    update: { lastRunAt: now, lastRunStatus: 'ok', lastRunCount: stored, totalEvents: stored },
  });

  console.log(`[ais] Flush: ${stored} vessels written`);
}

// --- Ship type classification ---

// AIS ship type codes: https://api.vtexplorer.com/docs/ref-aistypes.html
function classifyType(shipType: number): string {
  if (shipType >= 60 && shipType <= 69) return 'PASSENGER';
  if (shipType >= 70 && shipType <= 79) return 'CARGO';
  if (shipType >= 80 && shipType <= 89) return 'TANKER';
  if (shipType >= 40 && shipType <= 49) return 'HIGH_SPEED';
  if (shipType >= 50 && shipType <= 59) return 'PILOT_VESSEL';
  if (shipType === 35) return 'MILITARY';
  if (shipType >= 30 && shipType <= 39) return 'FISHING';
  return 'OTHER';
}

function classifyActor(v: VesselPosition): string {
  const name = v.shipName.toUpperCase();
  if (name.includes('NATO') || name.includes('WARSHIP')) return 'NATO';
  if (name.includes('NAVY') || name.includes('MILITARY')) return 'MILITARY';
  if (v.shipType === 35) return 'MILITARY';
  return v.shipName || v.mmsi;
}

// --- Stream handle ---

export const stream: StreamHandle = {
  name: 'ais',
  enabled: () => !!config.aisstream.apiKey,

  start() {
    connect();
    flushTimer = setInterval(() => {
      flush().catch((e) => console.error('[ais] Flush error:', e));
    }, config.aisstream.flushInterval);
  },

  stop() {
    if (flushTimer) clearInterval(flushTimer);
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (socket) socket.close();
    flush().catch(() => {});
  },

  status() {
    return {
      connected,
      vesselBuffer: vessels.size,
      totalMessages,
      lastFlushAt: lastFlushAt ? new Date(lastFlushAt).toISOString() : null,
    };
  },
};
