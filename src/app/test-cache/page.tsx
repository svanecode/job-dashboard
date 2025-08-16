import { getBuildInfo, CACHE_VERSION } from '@/utils/cacheBuster';

export default function TestCachePage() {
  const buildInfo = getBuildInfo();
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Cache Test Side</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Build Information</h2>
        <div className="space-y-2">
          <p><strong>Build ID:</strong> {buildInfo.buildId || 'Ikke sat'}</p>
          <p><strong>Build Time:</strong> {buildInfo.buildTime || 'Ikke sat'}</p>
          <p><strong>Cache Version:</strong> {buildInfo.cacheVersion}</p>
          <p><strong>Force Refresh:</strong> {buildInfo.forceRefresh ? 'Ja' : 'Nej'}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Cache Test</h2>
        <p className="mb-4">
          Denne side hjælper dig med at teste cache-systemet. 
          Opdater siden og tjek om indholdet ændres.
        </p>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>Timestamp:</strong> {new Date().toLocaleString('da-DK')}</p>
          <p><strong>Random ID:</strong> {Math.random().toString(36).substring(7)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Cache Busting URLs</h2>
        <div className="space-y-2">
          <p><strong>CSS Test:</strong> <code>/styles.css?v={CACHE_VERSION}</code></p>
          <p><strong>JS Test:</strong> <code>/script.js?v={CACHE_VERSION}</code></p>
          <p><strong>Image Test:</strong> <code>/image.jpg?v={CACHE_VERSION}</code></p>
        </div>
      </div>
    </div>
  );
} 