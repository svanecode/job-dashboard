import { generateEmbeddingsForJobs } from '../src/services/embeddingService.js';

async function main() {
  try {
    console.log('Starting embedding generation...');
    await generateEmbeddingsForJobs();
    console.log('Embedding generation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    process.exit(1);
  }
}

main(); 