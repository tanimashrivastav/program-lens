/**
 * Generates a URL-friendly slug from program and university name.
 *
 * Examples:
 *   "University of Washington", "MS Information Systems" → "uw-ms-information-systems"
 *   "MIT", "Computer Science PhD"                        → "mit-computer-science-phd"
 */
export function generateSlug(universityName: string, programName: string): string {
  const combined = `${universityName} ${programName}`

  return combined
    .toLowerCase()
    .replace(/university of (\w+)/i, (_, name) => name)  // "University of Washington" → "washington"
    .replace(/[^a-z0-9\s-]/g, '')                         // remove special chars
    .trim()
    .replace(/\s+/g, '-')                                  // spaces to hyphens
    .replace(/-+/g, '-')                                   // collapse multiple hyphens
    .slice(0, 80)                                          // max length
}

/**
 * Appends a short suffix to make a slug unique when a collision is detected.
 * e.g. "uw-ms-cs" → "uw-ms-cs-2"
 */
export function makeSlugUnique(slug: string, suffix: number): string {
  return `${slug}-${suffix}`
}
