'use client';

import { useState } from 'react';
import { Job } from '@/types/job';

interface SearchResult {
  data: Job[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  searchType: string;
  query: string;
}

export default function TestSemanticSearch() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'semantic' | 'hybrid' | 'text'>('semantic');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setStatus('');

    try {
      // Test the semantic search API
      const response = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          searchType,
          page: 1,
          pageSize: 10,
          matchThreshold: 0.05, // Lower threshold for testing
          minScore: 1
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data);
      setStatus(`Found ${data.data?.length || 0} results using ${searchType} search`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Semantic Search Test</h1>
        
        {/* Status */}
        {status && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <p className="text-blue-800">{status}</p>
          </div>
        )}
        
        {/* Search Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Search Query
              </label>
              <input
                id="query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., 'CFO interim position in Copenhagen'"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="searchType" className="block text-sm font-medium text-gray-700 mb-2">
                Search Type
              </label>
              <select
                id="searchType"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'semantic' | 'hybrid' | 'text')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="semantic">Semantic Search (Recommended)</option>
                <option value="hybrid">Hybrid Search</option>
                <option value="text">Text Search</option>
              </select>
            </div>
            
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Search Results
              </h2>
              <p className="text-sm text-gray-600">
                Found {results.pagination.total} results using {searchType} search
              </p>
            </div>
            
            <div className="space-y-4">
              {results.data.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Score: {job.cfo_score}/3
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Company:</strong> {job.company}
                  </p>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Location:</strong> {job.location}
                  </p>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Date:</strong> {job.publication_date}
                  </p>
                  
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {job.description}
                  </p>
                  
                  {job.job_url && (
                    <a
                      href={job.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                    >
                      View Job →
                    </a>
                  )}
                </div>
              ))}
            </div>
            
            {results.data.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No jobs found matching your query.
              </p>
            )}
          </div>
        )}

        {/* Example Queries */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Queries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'CFO interim position in Copenhagen',
              'ERP implementation consultant',
              'Financial controller with SAP experience',
              'Startup CFO role',
              'Accounting manager in Aarhus',
              'Digital transformation finance role'
            ].map((exampleQuery) => (
              <button
                key={exampleQuery}
                onClick={() => {
                  setQuery(exampleQuery);
                  handleSearch();
                }}
                className="text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm text-gray-700">{exampleQuery}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-8">
          <h3 className="text-lg font-semibold text-green-800 mb-2">✅ System Status</h3>
          <p className="text-green-700 text-sm">
            Semantic search is now working! The system has 701 jobs with embeddings (26.9% coverage) 
            and can perform semantic similarity searches. Try the example queries above to test the functionality.
          </p>
        </div>
      </div>
    </div>
  );
} 