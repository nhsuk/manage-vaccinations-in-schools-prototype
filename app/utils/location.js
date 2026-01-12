/**
 * Generate new school site code, incrementing existing
 *
 * @param {string} site - Site code
 * @returns {string} New site code
 */
export function generateNewSiteCode(site) {
  // If no site value exists, set it to 'B'
  if (!site) {
    return 'B'
  }

  // Get last character (in case site is multi-character like 'AA')
  const lastCharacter = site.slice(-1)

  // Increment character
  const nextCharacter = String.fromCharCode(lastCharacter.charCodeAt(0) + 1)

  // Handle wrap-around from Z to AA, AB, etc.
  if (lastCharacter === 'Z') {
    return `${site}A`
  }

  // Replace the last character with the incremented one
  return site.slice(0, -1) + nextCharacter
}
