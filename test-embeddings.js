import { createClient } from '@supabase/supabase-js';

// Use the same environment variables as the app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmbeddings() {
  console.log('🔍 Checking embeddings in database...');
  
  try {
    // Check if jobs have embeddings
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, embedding, cfo_score')
      .is('deleted_at', null)
      .limit(10);
    
    if (error) {
      console.error('❌ Database error:', error);
      return;
    }
    
    console.log(`📊 Found ${jobs.length} jobs`);
    
    const jobsWithEmbeddings = jobs.filter(job => job.embedding !== null);
    const jobsWithoutEmbeddings = jobs.filter(job => job.embedding === null);
    
    console.log(`✅ Jobs with embeddings: ${jobsWithEmbeddings.length}`);
    console.log(`❌ Jobs without embeddings: ${jobsWithoutEmbeddings.length}`);
    
    if (jobsWithEmbeddings.length > 0) {
      console.log('\n📋 Sample jobs with embeddings:');
      jobsWithEmbeddings.slice(0, 3).forEach(job => {
        console.log(`- ${job.title} (CFO Score: ${job.cfo_score})`);
      });
    }
    
    if (jobsWithoutEmbeddings.length > 0) {
      console.log('\n📋 Sample jobs without embeddings:');
      jobsWithoutEmbeddings.slice(0, 3).forEach(job => {
        console.log(`- ${job.title} (CFO Score: ${job.cfo_score})`);
      });
    }
    
    // Test vector search function
    console.log('\n🔍 Testing vector search function...');
    const { data: vectorResults, error: vectorError } = await supabase.rpc('match_jobs_similarity', {
      query_embedding: new Array(1536).fill(0.1),
      match_threshold: 0.01,
      match_count: 5
    });
    
    if (vectorError) {
      console.error('❌ Vector search error:', vectorError);
    } else {
      console.log(`✅ Vector search found ${vectorResults?.length || 0} results`);
      if (vectorResults && vectorResults.length > 0) {
        console.log('📋 Sample vector results:');
        vectorResults.slice(0, 3).forEach(job => {
          console.log(`- ${job.title} (Similarity: ${job.similarity})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

checkEmbeddings(); 