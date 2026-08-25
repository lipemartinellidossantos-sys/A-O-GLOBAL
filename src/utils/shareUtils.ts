/**
 * Helper utility to resolve the public standalone URL for Google AI Studio applications.
 * 
 * In Google AI Studio:
 * - `ais-dev-...`: Private development container URL (only accessible by the project author).
 * - `ais-pre-...`: Public shared application preview URL (accessible by any user/collaborator in fullscreen without source code or login).
 */

export function getPublicShareUrl(): string {
  if (typeof window === 'undefined') return '';

  const origin = window.location.origin;

  // Convert dev container URL to public preview URL
  if (origin.includes('ais-dev-')) {
    return origin.replace('ais-dev-', 'ais-pre-');
  }

  return origin;
}

export function getDevContainerUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}
