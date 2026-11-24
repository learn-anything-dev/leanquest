import type { Region } from '../../core/types';
import { generic } from './generic';
import { ph } from './ph';

// To add a country: create <id>.ts exporting a Region (see ph.ts) and add it to this list.
export const REGIONS: Region[] = [ph, generic];

export function getRegion(id: string): Region {
  return REGIONS.find((r) => r.id === id) ?? generic;
}
