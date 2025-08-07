import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Return a mock embedding for testing when API is unavailable
    console.log('Using mock embedding due to API unavailability');
    return new Array(3072).fill(0).map(() => Math.random() - 0.5);
  }
} 