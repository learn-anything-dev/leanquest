import type { Region } from '../../core/types';
import { global } from './global';
import { ph } from './ph';

// To add a local food pack: create <id>.ts exporting a Region (see ph.ts), register it here,
// and map a country to it in data/countries.ts (packFor).
export const REGIONS: Region[] = [ph, global];

export function getRegion(id: string): Region {
  return REGIONS.find((r) => r.id === id) ?? global;
}
