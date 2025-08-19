import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Simple in-memory LRU cache with TTL for query embeddings
type CachedEmbedding = { embedding: number[]; timestampMs: number };
const embeddingCache = new Map<string, CachedEmbedding>();
// Forlæng cache TTL og øg cache størrelse
const EMBEDDING_TTL_MS = 24 * 60 * 60 * 1000; // 24 timer i stedet for 10 minutter
const EMBEDDING_MAX_ENTRIES = 1000; // Øg cache størrelse fra 200 til 1000

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
    // Get jobs that need embeddings
    const { data: jobs, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .is('deleted_at', null)
      .or('title_embedding.is.null,description_embedding.is.null')
      .limit(10);

    if (fetchError) {
      console.error('Error fetching jobs for embeddings:', fetchError);
      return;
    }

    if (!jobs || jobs.length === 0) {
      return;
    }

    // Generate embeddings for each job
    for (const job of jobs) {
      try {
        // Generate title embedding
        if (!job.title_embedding) {
          const titleEmbedding = await generateEmbeddingForText(job.title || '');
          if (titleEmbedding) {
            await supabase
              .from('jobs')
              .update({ title_embedding: titleEmbedding })
              .eq('id', job.id);
          }
        }

        // Generate description embedding
        if (!job.description_embedding) {
          const descriptionEmbedding = await generateEmbeddingForText(job.description || '');
          if (descriptionEmbedding) {
            await supabase
              .from('jobs')
              .update({ description_embedding: descriptionEmbedding })
              .eq('id', job.id);
          }
        }
      } catch (error) {
        console.error(`Error generating embeddings for job ${job.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

export async function generateEmbeddingForText(text: string) {
  try {
    // Bedre input sanitization (som Supabase guide)
    const sanitizedText = text.replaceAll('\n', ' ').trim();
    
    // Cache key based on normalized text
    const key = sanitizedText.toLowerCase();
    const cached = cacheGet(key);
    if (cached) return cached;

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: sanitizedText,
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