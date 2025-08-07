require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function generateEmbeddingsForJobs() {
  console.log('🚀 Starting embedding generation...\n');

  try {
    // Get all jobs without embeddings
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, job_id, title, description')
      .is('embedding', null)
      .is('deleted_at', null);

    if (error) {
      console.error('❌ Error fetching jobs:', error);
      return;
    }

    if (!jobs || jobs.length === 0) {
      console.log('✅ No jobs found that need embeddings');
      return;
    }

    console.log(`📝 Found ${jobs.length} jobs that need embeddings`);

    // Process jobs in batches to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      
      console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jobs.length / batchSize)}`);
      
      await Promise.all(
        batch.map(async (job) => {
          try {
            // Generate combined embedding for title and description
            const combinedText = `${job.title || ''}\n\n${job.description || ''}`;
            
            if (!combinedText.trim()) {
              console.log(`⚠️  Skipping job ${job.job_id} - no content to embed`);
              return;
            }

            const embedding = await generateEmbedding(combinedText);

            // Update job with embedding
            const { error: updateError } = await supabase
              .from('jobs')
              .update({
                embedding: embedding,
                embedding_created_at: new Date().toISOString(),
              })
              .eq('id', job.id);

            if (updateError) {
              console.error(`❌ Error updating job ${job.job_id}:`, updateError);
            } else {
              console.log(`✅ Updated embedding for job: ${job.title} (ID: ${job.job_id})`);
            }
          } catch (error) {
            console.error(`❌ Error generating embedding for job ${job.job_id}:`, error);
          }
        })
      );

      // Add delay between batches to respect rate limits
      if (i + batchSize < jobs.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n🎉 Embedding generation completed!');
    
    // Check final status
    await checkEmbeddingStatus();
    
  } catch (error) {
    console.error('❌ Error generating embeddings:', error);
  }
}

async function checkEmbeddingStatus() {
  console.log('\n📊 Checking embedding status...');
  
  try {
    // Count jobs with embeddings
    const { count: withEmbeddings, error: withError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null)
      .is('deleted_at', null);

    if (withError) {
      console.error('❌ Error counting jobs with embeddings:', withError);
    } else {
      console.log(`✅ Jobs with embeddings: ${withEmbeddings}`);
    }

    // Count jobs without embeddings
    const { count: withoutEmbeddings, error: withoutError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .is('embedding', null)
      .is('deleted_at', null);

    if (withoutError) {
      console.error('❌ Error counting jobs without embeddings:', withoutError);
    } else {
      console.log(`⚠️  Jobs without embeddings: ${withoutEmbeddings}`);
    }

    // Total jobs
    const { count: totalJobs, error: totalError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    if (totalError) {
      console.error('❌ Error counting total jobs:', totalError);
    } else {
      console.log(`📊 Total jobs: ${totalJobs}`);
      if (withEmbeddings && totalJobs) {
        const percentage = ((withEmbeddings / totalJobs) * 100).toFixed(1);
        console.log(`📈 Embedding coverage: ${percentage}%`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking embedding status:', error);
  }
}

// Run the script
if (require.main === module) {
  generateEmbeddingsForJobs().catch(console.error);
}

module.exports = {
  generateEmbeddingsForJobs,
  checkEmbeddingStatus
}; 
main(); 