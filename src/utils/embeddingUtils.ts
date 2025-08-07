import { generateEmbeddingForText } from '@/services/embeddingService';

export async function generateJobEmbeddings(title: string, description: string) {
  try {
    const combinedText = `${title}\n\n${description}`;
    const embedding = await generateEmbeddingForText(combinedText);

    return {
      embedding: embedding
    };
  } catch (error) {
    console.error('Error generating job embeddings:', error);
    throw error;
  }
}

export function validateEmbedding(embedding: number[]): boolean {
  if (!Array.isArray(embedding)) return false;
  if (embedding.length !== 1536) return false;
  if (!embedding.every(val => typeof val === 'number' && !isNaN(val))) return false;
  return true;
}

export async function updateJobEmbeddings(jobId: string, title: string, description: string) {
  const { supabase } = await import('@/lib/supabase');
  
  if (!supabase) {
    throw new Error('Database connection not available');
  }

  try {
    const embeddings = await generateJobEmbeddings(title, description);
    
    const { error } = await supabase
      .from('jobs')
      .update({
        embedding: embeddings.embedding,
        embedding_created_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating job embeddings:', error);
    throw error;
  }
} 