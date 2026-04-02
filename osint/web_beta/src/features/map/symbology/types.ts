
export type StandardIdentity =
  | 'unknown'
  | 'assumedFriend'
  | 'friendly'
  | 'neutral'
  | 'suspect'
  | 'hostile';

export type SymbolSet =
  | 'air'
  | 'land-installation'
  | 'sea-surface'
  | 'sea-subsurface'
  | 'activities'
  | 'theme';

export type MilsymbolCode2525D = {
  /**
   * Digits 5-6 of the MIL-STD-2525D SIDC.
   * Examples:
   * - 01 = Air
   * - 20 = Land Installation
   * - 30 = Sea Surface
   * - 35 = Sea Subsurface
   * - 40 = Activities
   */
  symbolSetCode: string;
  /** Digits 11-12 */
  entityCode: string;
  /** Digits 13-14 */
  entityTypeCode?: string;
  /** Digits 15-16 */
  entitySubtypeCode?: string;
  /** Digits 17-18 */
  modifier1Code?: string;
  /** Digits 19-20 */
  modifier2Code?: string;
  /** Digit 7 */
  statusCode?: string;
  /** Digit 8 */
  hqTaskDummyCode?: string;
  /** Digits 9-10 */
  amplifierDescriptorCode?: string;
  /** Digits 1-2. Default: 10 (2525D) */
  versionCode?: string;
};

export type MilsymbolDefinition = {
  kind: 'milsymbol';
  code: MilsymbolCode2525D;
  /**
   * Optional render defaults. These are presentation settings,
   * not semantic identity.
   */
  render?: {
    frame?: boolean;
    icon?: boolean;
    fill?: boolean;
    monoColor?: string;
  };
  defaultIdentity?: StandardIdentity;
  supportedIdentities?: StandardIdentity[];
};

export type SvgDefinition = {
  kind: 'svg';
  width: number;
  height: number;
  anchorX?: number;
  anchorY?: number;
  svg: (accent: string) => string;
};

export type SymbolDefinition = MilsymbolDefinition | SvgDefinition;

export type SymbolEntry = {
  id: string;
  symbolSet: SymbolSet;
  label: string;
  plainLabel: string;
  description: string;
  keywords: string[];
  tags?: string[];
  definition: SymbolDefinition;
  /**
   * Optional domain hints used for search, analytics, and map hover.
   * These are your business concepts, not military-standard concepts.
   */
  aliases?: string[];
};

export type ResolutionReason = {
  ruleId: string;
  title: string;
  detail: string;
};

export type ResolutionResult = {
  entry: SymbolEntry;
  identity: StandardIdentity;
  confidence: number;
  reason: ResolutionReason;
  fallbackChain: string[];
};

export type RenderStyle = {
  /**
   * Large intrinsic SVG size reduces blur when IconLayer later scales the icon.
   * 72-128 works well for line-art symbols.
   */
  intrinsicSize?: number;
  strokeWidth?: number;
  outlineWidth?: number;
  outlineColor?: string;
  fill?: boolean;
  frame?: boolean;
  icon?: boolean;
  monoColor?: string;
  accentColor?: string;
};

export type RenderedSymbol = {
  id: string;
  url: string;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  label: string;
  plainLabel: string;
  description: string;
  sidc?: string;
};

export type SearchResult = {
  entry: SymbolEntry;
  score: number;
  highlights: string[];
};

export type ExplorerCard = {
  entry: SymbolEntry;
  preview: RenderedSymbol;
  hoverLabel: string;
};

export const STANDARD_IDENTITY_DIGITS: Record<StandardIdentity, string> = {
  unknown: '01',
  assumedFriend: '02',
  friendly: '03',
  neutral: '04',
  suspect: '05',
  hostile: '06',
};
