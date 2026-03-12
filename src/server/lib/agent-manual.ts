/**
 * Thin compatibility wrapper.
 * The actual doctrine now lives in pharos-doctrine.ts.
 */

export type { LiveDoctrineContext as LiveContext } from './pharos-doctrine';
export { buildPharosInstructionsMarkdown as buildAgentManual } from './pharos-doctrine';
