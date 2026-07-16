/**
 * Validation d'email pratique (format).
 * Ne garantit pas que la boîte existe, mais rejette les saisies évidemment invalides
 * (absence de @, de domaine, d'extension). À revérifier côté serveur en production.
 */
export function isValidEmail(email: string): boolean {
  const e = email.trim();
  if (e.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}
