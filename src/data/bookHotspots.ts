import type { InteractiveHotspot } from '../types';
import { unit1Hotspots } from './unit1Hotspots';
import { unit2Hotspots } from './unit2Hotspots';

export const allBookHotspots: InteractiveHotspot[] = [...unit1Hotspots, ...unit2Hotspots];

export function getHotspotsForPage(page: number): InteractiveHotspot[] {
  return allBookHotspots.filter((h) => h.page === page);
}

export function getHotspotById(id: string | null | undefined): InteractiveHotspot | undefined {
  if (!id) return undefined;
  return allBookHotspots.find((h) => h.id === id);
}

export function getPagesWithHotspots(): number[] {
  return Array.from(new Set(allBookHotspots.map((h) => h.page))).sort((a, b) => a - b);
}
