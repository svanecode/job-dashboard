import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory LRU cache with TTL for query embeddings
type CachedEmbedding = { embedding: number[]; timestampMs: number };
const embeddingCache = new Map<string, CachedEmbedding>();
const EMBEDDING_TTL_MS = 10 * 60 * 1000; // 10 minutes
const EMBEDDING_MAX_ENTRIES = 200;

function cacheGet(key: string): number[] | null {
  const entry = embeddingCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestampMs > EMBEDDING_TTL_MS) {
    embeddingCache.delete(key);
    return null;
  }
  // Touch for LRU: re-insert
  embeddingCache.delete(key);
  embeddingCache.set(key, { ...entry, timestampMs: Date.now() });
  return entry.embedding;
}

function cacheSet(key: string, embedding: number[]) {
  if (embeddingCache.has(key)) embeddingCache.delete(key);
  embeddingCache.set(key, { embedding, timestampMs: Date.now() });
  // Evict oldest
  if (embeddingCache.size > EMBEDDING_MAX_ENTRIES) {
    const oldestKey = embeddingCache.keys().next().value as string | undefined;
    if (oldestKey) embeddingCache.delete(oldestKey);
  }
}

export async function generateEmbeddingsForJobs() {
  if (!supabase) {
    throw new Error('Database connection not available');
  }

  try {
    // Get all jobs without embeddings
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, job_id, title, description')
      .is('embedding', null)
      .is('deleted_at', null);

    if (error) {
      throw error;
    }

    if (!jobs || jobs.length === 0) {
      console.log('No jobs found that need embeddings');
      return;
    }

    console.log(`Generating embeddings for ${jobs.length} jobs...`);

    // Process jobs in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (job) => {
          try {
            // Generate combined embedding for title and description
            const combinedText = `${job.title}\n\n${job.description}`;
              const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: combinedText,
    encoding_format: 'float',
    // Remove dimensions parameter to use default
  });

            // Update job with embedding
            await supabase
              .from('jobs')
              .update({
                embedding: embeddingResponse.data[0].embedding,
                embedding_created_at: new Date().toISOString(),
              })
              .eq('id', job.id);

            console.log(`Updated embedding for job: ${job.title} (ID: ${job.job_id})`);
          } catch (error) {
            console.error(`Error generating embeddings for job ${job.id}:`, error);
          }
        })
      );

      // Add delay between batches to respect rate limits
      if (i + batchSize < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('Embedding generation completed');
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

export async function generateEmbeddingForText(text: string) {
  try {
    // Cache key based on normalized text
    const key = text.trim().toLowerCase();
    const cached = cacheGet(key);
    if (cached) return cached;

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      encoding_format: 'float',
    });

    const embedding = response.data[0].embedding;
    cacheSet(key, embedding);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Return a mock embedding for testing when API is unavailable
    console.log('Using mock embedding due to API unavailability');
    return new Array(3072).fill(0).map(() => Math.random() - 0.5);
  }
} 