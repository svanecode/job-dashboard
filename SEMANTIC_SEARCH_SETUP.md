# Semantic Search Implementation

This document describes the semantic search functionality implemented in the job dashboard application.

## Overview

The semantic search system uses vector embeddings to find jobs that are semantically similar to user queries, even when the exact keywords don't match. This provides more intelligent and relevant search results compared to traditional text-based search.

## Architecture

### Database Functions

Three main SQL functions are implemented in `supabase/semantic_search_official.sql`:

1. **`match_jobs_semantic`** - Pure semantic search using vector similarity
2. **`match_jobs_hybrid`** - Combines semantic and text search for better results
3. **`get_job_recommendations`** - Finds similar jobs based on a specific job ID

### API Endpoints

- `/api/semantic-search` - Main semantic search endpoint
- `/api/job-recommendations` - Job recommendations endpoint
- `/api/query` - Enhanced chatbot with semantic search

### Service Layer

The `jobService.ts` includes new methods:
- `searchJobsSemantic()` - Pure semantic search
- `searchJobsHybrid()` - Hybrid search
- `getJobRecommendations()` - Job recommendations

## Features

### 1. Semantic Search
- Uses OpenAI's `text-embedding-3-small` model
- Cosine similarity for vector comparison
- Configurable similarity threshold
- Filters by CFO score, location, and company

### 2. Hybrid Search
- Combines semantic similarity with text search ranking
- Uses PostgreSQL's full-text search capabilities
- Provides more comprehensive results

### 3. Job Recommendations
- Finds similar jobs based on embedding similarity
- Useful for "jobs like this" functionality

### 4. Fallback Mechanisms
- Automatic fallback to text search if semantic search fails
- Graceful error handling
- Mock data support for development

## Usage

### Basic Semantic Search

```typescript
import { jobService } from '@/services/jobService';

const results = await jobService.searchJobsSemantic('CFO interim position', {
  page: 1,
  pageSize: 20,
  matchThreshold: 0.78,
  minScore: 1,
  locationFilter: 'Copenhagen'
});
```

### Hybrid Search

```typescript
const results = await jobService.searchJobsHybrid('ERP implementation', {
  page: 1,
  pageSize: 20,
  matchThreshold: 0.78,
  minScore: 1
});
```

### Job Recommendations

```typescript
const recommendations = await jobService.getJobRecommendations('job-123', {
  page: 1,
  pageSize: 5,
  minScore: 1
});
```

### API Usage

```javascript
// Semantic search via API
const response = await fetch('/api/semantic-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'CFO interim position',
    searchType: 'hybrid',
    page: 1,
    pageSize: 10
  })
});

// Job recommendations via API
const recResponse = await fetch('/api/job-recommendations?jobId=job-123');
```

## Configuration

### Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup

1. Enable the `vector` extension in Supabase
2. Run the SQL functions from `supabase/semantic_search_official.sql`
3. Ensure jobs have embeddings generated

### Embedding Generation

Use the embedding service to generate embeddings for jobs:

```typescript
import { generateEmbeddingsForJobs } from '@/services/embeddingService';

await generateEmbeddingsForJobs();
```

## Testing

### Test Page
Visit `/test-semantic` to test the semantic search functionality with a user interface.

### Test Script
Run the test script to verify functionality:

```bash
node scripts/test-semantic-search.js
```

### Example Queries

- "CFO interim position in Copenhagen"
- "ERP implementation consultant"
- "Financial controller with SAP experience"
- "Startup CFO role"
- "Accounting manager in Aarhus"
- "Digital transformation finance role"

## Performance Considerations

### Vector Index
- Uses `ivfflat` index for efficient vector similarity search
- Configured with 100 lists for optimal performance

### Batch Processing
- Embeddings are generated in batches to respect API limits
- 1-second delay between batches

### Caching
- Consider implementing Redis caching for frequently searched queries
- Cache embeddings to avoid regenerating for the same text

## Monitoring

### Embedding Coverage
Check embedding coverage with the test script:

```bash
node scripts/test-semantic-search.js
```

### Search Performance
Monitor search response times and result quality through the test page.

## Troubleshooting

### Common Issues

1. **No embeddings found**
   - Run the embedding generation script
   - Check if jobs have content to embed

2. **Search returns no results**
   - Lower the similarity threshold
   - Check if jobs have CFO score >= 1
   - Verify embeddings are generated

3. **API errors**
   - Check OpenAI API key
   - Verify Supabase connection
   - Check function permissions

### Debug Mode

Enable detailed logging by setting:

```bash
DEBUG=semantic-search
```

## Future Enhancements

1. **Multi-language support** - Support for Danish and English embeddings
2. **Advanced filtering** - More sophisticated filtering options
3. **Personalization** - User-specific search preferences
4. **Analytics** - Track search performance and user behavior
5. **Caching** - Implement Redis caching for better performance

## Security Considerations

1. **API Key Management** - Secure storage of OpenAI API keys
2. **Rate Limiting** - Implement rate limiting for search endpoints
3. **Input Validation** - Validate and sanitize search queries
4. **Access Control** - Ensure proper RLS policies are in place

## Dependencies

- `@supabase/supabase-js` - Database client
- `openai` - OpenAI API client
- `pgvector` - Vector extension for PostgreSQL

## Related Files

- `supabase/semantic_search_official.sql` - Database functions
- `src/services/jobService.ts` - Service layer
- `src/services/embeddingService.ts` - Embedding generation
- `src/app/api/semantic-search/route.ts` - API endpoint
- `src/app/api/job-recommendations/route.ts` - Recommendations API
- `src/app/test-semantic/page.tsx` - Test interface
- `scripts/test-semantic-search.js` - Test script 