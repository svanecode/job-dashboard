import { NextRequest, NextResponse } from 'next/server';
import { generateEmbeddingsForJobs } from '@/services/embeddingService';

export async function POST(request: NextRequest) {
  try {
    // Check for authorization (you might want to add proper auth here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Start the embedding generation process
    await generateEmbeddingsForJobs();

    return NextResponse.json({ 
      message: 'Embeddings generated successfully',
      status: 'completed'
    });

  } catch (error) {
    console.error('Error generating embeddings:', error);
    return NextResponse.json({ 
      error: 'Failed to generate embeddings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 