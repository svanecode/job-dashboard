// Cache buster utility for forcing browser cache refresh
export const CACHE_VERSION = 'v0.2.0-' + Date.now();

// Generate cache busted URLs for static assets
export function getCacheBustedUrl(path: string): string {
  if (path.startsWith('http')) return path;
  
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}v=${CACHE_VERSION}`;
}

// Cache buster for CSS and JS files
export function getAssetUrl(path: string): string {
  return getCacheBustedUrl(path);
}

// Cache buster for images
export function getImageUrl(path: string): string {
  return getCacheBustedUrl(path);
}

// Cache buster for API calls
export function getApiUrl(path: string): string {
  return getCacheBustedUrl(path);
} 