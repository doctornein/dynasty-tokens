/**
 * Maps old p001-style IDs to new bdl-{id} IDs for the original 100 players.
 * Used to ensure existing users' localStorage cards still resolve correctly
 * after migration to live NBA data.
 *
 * Keys: legacy ID (e.g. "p001")
 * Values: new balldontlie-based ID (e.g. "bdl-123")
 *
 * This map will be populated once the first live generation runs and
 * we know the balldontlie IDs for the original 100 players. Until then,
 * legacy IDs are still present in generated/players.json as-is.
 */
export const legacyIdMap: Record<string, string> = {
  // Will be populated after first live data generation.
  // For now, the seed players.json still uses p001-style IDs,
  // so no mapping is needed until we switch to bdl- IDs.
};

/**
 * Resolve a player ID that may be a legacy p001-style ID to its
 * current form. Returns the input unchanged if no mapping exists.
 */
export function resolveLegacyId(id: string): string {
  return legacyIdMap[id] ?? id;
}
