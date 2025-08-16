// Cache buster utility for forcing browser cache refresh
// Bruger build ID fra environment variabler for konsistent cache-busting
export const CACHE_VERSION = process.env.NEXT_PUBLIC_CACHE_VERSION || 
                             process.env.NEXT_PUBLIC_BUILD_ID || 
                             `v${Date.now()}`;

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

// Funktion til at tjekke om cache skal opdateres
export function shouldRefreshCache(): boolean {
  return process.env.NEXT_PUBLIC_FORCE_REFRESH === 'true';
}

// Funktion til at få build information
export function getBuildInfo() {
  return {
    buildId: process.env.NEXT_PUBLIC_BUILD_ID,
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME,
    cacheVersion: CACHE_VERSION,
    forceRefresh: shouldRefreshCache()
  };
} 