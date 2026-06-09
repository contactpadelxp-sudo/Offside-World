/**
 * Validates a Belgian phone number.
 * Accepted formats:
 *   +32 4XX XX XX XX  (mobile)
 *   +32 2 XXX XX XX   (landline Brussels)
 *   +32 XX XX XX XX   (landline other)
 *   04XX XX XX XX     (mobile local)
 *   04XX/XX.XX.XX     (mobile with separators)
 *   02 XXX XX XX      (landline local)
 * Spaces, dots, slashes, dashes are ignored.
 */
export function validateBelgianPhone(raw: string): { valid: boolean; error?: string } {
  // Strip all formatting characters
  const cleaned = raw.replace(/[\s.\-/()]/g, "");

  if (!cleaned) {
    return { valid: false, error: "Le numéro de téléphone est requis." };
  }

  // International format: +32...
  if (cleaned.startsWith("+32")) {
    const rest = cleaned.slice(3);
    // Belgian numbers after +32 should be 8 or 9 digits
    if (!/^\d{8,9}$/.test(rest)) {
      return { valid: false, error: "Format belge invalide. Ex. : +32 470 12 34 56" };
    }
    return { valid: true };
  }

  // International format: 0032...
  if (cleaned.startsWith("0032")) {
    const rest = cleaned.slice(4);
    if (!/^\d{8,9}$/.test(rest)) {
      return { valid: false, error: "Format belge invalide. Ex. : 0032 470 12 34 56" };
    }
    return { valid: true };
  }

  // Local format: 0...
  if (cleaned.startsWith("0")) {
    // Belgian local numbers: 9 or 10 digits (including leading 0)
    if (!/^0\d{8,9}$/.test(cleaned)) {
      return { valid: false, error: "Format belge invalide. Ex. : 0470 12 34 56" };
    }
    return { valid: true };
  }

  return { valid: false, error: "Le numéro doit commencer par 0 ou +32. Ex. : 0470 12 34 56" };
}
