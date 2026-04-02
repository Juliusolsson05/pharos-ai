
import type { RenderedSymbol } from '../types';

export type DeckIconDefinition = {
  id: string;
  url: string;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  mask: false;
};

export function toDeckIcon(rendered: RenderedSymbol): DeckIconDefinition {
  return {
    id: rendered.id,
    url: rendered.url,
    width: rendered.width,
    height: rendered.height,
    anchorX: rendered.anchorX,
    anchorY: rendered.anchorY,
    mask: false,
  };
}
