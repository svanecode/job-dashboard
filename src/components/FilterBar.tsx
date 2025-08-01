'use client';
import { useJobStore } from '@/store/jobStore';

export default function FilterBar() {
  const { filters, setFilters, resetFilters } = useJobStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, searchText: e.target.value });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, location: e.target.value });
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const score = e.target.value === '' ? undefined : parseInt(e.target.value);
    setFilters({ ...filters, score });
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">Filtrer og søg</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-1">
            Søg
          </label>
          <input
            type="text"
            id="search"
            placeholder="Søg i titel, firma eller beskrivelse..."
            value={filters.searchText || ''}
            onChange={handleSearchChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
          />
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
            Lokation
          </label>
          <input
            type="text"
            id="location"
            placeholder="F.eks. København, Aarhus..."
            value={filters.location || ''}
            onChange={handleLocationChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
          />
        </div>
        
        <div>
          <label htmlFor="score" className="block text-sm font-medium text-gray-300 mb-1">
            Score
          </label>
          <select
            id="score"
            value={filters.score?.toString() || ''}
            onChange={handleScoreChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
          >
            <option value="">Alle scores</option>
            <option value="3">🔥 Akut (3)</option>
            <option value="2">📈 Høj (2)</option>
            <option value="1">📋 Medium (1)</option>
            <option value="0">❌ Lav (0)</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={resetFilters}
            className="w-full px-4 py-2 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors"
          >
            Nulstil filtre
          </button>
        </div>
      </div>
    </div>
  );
} 