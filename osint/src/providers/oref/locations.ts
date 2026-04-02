// Known OREF area → approximate coordinates mapping.
// OREF alerts reference area names, not coordinates.
// This is a subset covering major areas — extend as needed.
const AREA_COORDS: Record<string, [number, number]> = {
  'תל אביב - מרכז העיר': [34.7818, 32.0853],
  'תל אביב - דרום העיר': [34.7700, 32.0600],
  'חיפה - כרמל ועיר תחתית': [34.9896, 32.7940],
  'באר שבע': [34.7913, 31.2518],
  'ירושלים': [35.2137, 31.7683],
  'אשדוד': [34.6500, 31.8000],
  'אשקלון': [34.5667, 31.6667],
  'נתניה': [34.8600, 32.3300],
  'הרצליה': [34.7900, 32.1600],
  'רמת גן': [34.8100, 32.0700],
  'פתח תקוה': [34.8800, 32.0900],
  'חולון': [34.7800, 32.0100],
  'ראשון לציון': [34.7900, 31.9600],
  'רחובות': [34.8100, 31.8900],
  'נתיבות': [34.5900, 31.4200],
  'שדרות': [34.5900, 31.5200],
  'עוטף עזה': [34.4500, 31.4000],
  'קריית שמונה': [35.5700, 33.2100],
  'צפת': [35.5000, 32.9700],
  'טבריה': [35.5300, 32.7900],
  'עפולה': [35.2900, 32.6100],
  'אילת': [34.9500, 29.5600],
  'מודיעין': [35.0100, 31.8900],
  'כפר סבא': [34.9100, 32.1700],
  'רעננה': [34.8700, 32.1800],
};

/**
 * Try to resolve an OREF area name to approximate coordinates.
 * Returns null if the area is unknown.
 */
export function resolveAreaCoords(area: string): [number, number] | null {
  // Exact match
  if (AREA_COORDS[area]) return AREA_COORDS[area];

  // Partial match
  for (const [name, coords] of Object.entries(AREA_COORDS)) {
    if (area.includes(name) || name.includes(area)) return coords;
  }

  return null;
}
