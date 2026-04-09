
import ms from 'milsymbol';

import type {
  MilsymbolCode2525D,
  RenderStyle,
  RenderedSymbol,
  StandardIdentity,
  SymbolDefinition,
  SymbolEntry,
} from '../types';
import { STANDARD_IDENTITY_DIGITS } from '../types';

const DEFAULT_STYLE: Required<RenderStyle> = {
  intrinsicSize: 18,
  strokeWidth: 4,
  outlineWidth: 3,
  outlineColor: 'white',
  fill: true,
  frame: true,
  icon: true,
  monoColor: '',
  accentColor: '#4C90F0',
};

const renderCache = new Map<string, RenderedSymbol>();

function normalizeStyle(style?: RenderStyle): Required<RenderStyle> {
  return {
    ...DEFAULT_STYLE,
    ...(style ?? {}),
  };
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function buildSidc(code: MilsymbolCode2525D, identity: StandardIdentity): string {
  const version = code.versionCode ?? '10';
  const standardIdentity = STANDARD_IDENTITY_DIGITS[identity];
  const symbolSet = code.symbolSetCode;
  const status = code.statusCode ?? '0';
  const hqTaskDummy = code.hqTaskDummyCode ?? '0';
  const amplifierDescriptor = code.amplifierDescriptorCode ?? '00';
  const entity = code.entityCode;
  const entityType = code.entityTypeCode ?? '00';
  const entitySubtype = code.entitySubtypeCode ?? '00';
  const modifier1 = code.modifier1Code ?? '00';
  const modifier2 = code.modifier2Code ?? '00';

  return [
    version,
    standardIdentity,
    symbolSet,
    status,
    hqTaskDummy,
    amplifierDescriptor,
    entity,
    entityType,
    entitySubtype,
    modifier1,
    modifier2,
  ].join('');
}

function renderMilsymbol(
  entry: SymbolEntry,
  identity: StandardIdentity,
  style?: RenderStyle,
): RenderedSymbol {
  const normalized = normalizeStyle(style);
  const definition = entry.definition;

  if (definition.kind !== 'milsymbol') {
    throw new Error(`Expected milsymbol definition for ${entry.id}`);
  }

  const sidc = buildSidc(definition.code, identity);
  const cacheKey = JSON.stringify({
    id: entry.id,
    sidc,
    style: normalized,
    kind: 'milsymbol',
  });

  const cached = renderCache.get(cacheKey);
  if (cached) return cached;

  const monoColor = definition.render?.monoColor ?? normalized.monoColor;

  const opts: Record<string, unknown> = {
    size: normalized.intrinsicSize,
    fill: definition.render?.fill ?? normalized.fill,
    frame: definition.render?.frame ?? normalized.frame,
    icon: definition.render?.icon ?? normalized.icon,
    outlineWidth: normalized.outlineWidth,
    outlineColor: normalized.outlineColor,
    strokeWidth: normalized.strokeWidth,
  };

  if (monoColor) {
    opts.monoColor = monoColor;
  }

  const symbol = new ms.Symbol(sidc, opts);

  const svg = symbol.asSVG();
  const size = symbol.getSize();
  const anchor = symbol.getAnchor();

  const rendered: RenderedSymbol = {
    id: `${entry.id}:${sidc}`,
    sidc,
    url: svgToDataUrl(svg),
    width: Math.ceil(size.width),
    height: Math.ceil(size.height),
    anchorX: Math.ceil(anchor.x),
    anchorY: Math.ceil(anchor.y),
    label: entry.label,
    plainLabel: entry.plainLabel,
    description: entry.description,
  };

  renderCache.set(cacheKey, rendered);
  return rendered;
}

function renderSvg(entry: SymbolEntry, style?: RenderStyle): RenderedSymbol {
  const normalized = normalizeStyle(style);
  const definition = entry.definition;

  if (definition.kind !== 'svg') {
    throw new Error(`Expected svg definition for ${entry.id}`);
  }

  const cacheKey = JSON.stringify({
    id: entry.id,
    style: normalized,
    kind: 'svg',
  });

  const cached = renderCache.get(cacheKey);
  if (cached) return cached;

  const rendered: RenderedSymbol = {
    id: entry.id,
    url: svgToDataUrl(definition.svg(normalized.accentColor)),
    width: definition.width,
    height: definition.height,
    anchorX: definition.anchorX ?? Math.round(definition.width / 2),
    anchorY: definition.anchorY ?? Math.round(definition.height / 2),
    label: entry.label,
    plainLabel: entry.plainLabel,
    description: entry.description,
  };

  renderCache.set(cacheKey, rendered);
  return rendered;
}

export function renderSymbolEntry(
  entry: SymbolEntry,
  identity: StandardIdentity = 'unknown',
  style?: RenderStyle,
): RenderedSymbol {
  const definition: SymbolDefinition = entry.definition;
  return definition.kind === 'milsymbol'
    ? renderMilsymbol(entry, identity, style)
    : renderSvg(entry, style);
}

export function explainSidc(entry: SymbolEntry, identity: StandardIdentity = 'unknown'): string | undefined {
  if (entry.definition.kind !== 'milsymbol') return undefined;
  return buildSidc(entry.definition.code, identity);
}

export function clearSymbolRenderCache() {
  renderCache.clear();
}
