require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('SUPABASE_KEY:', supabaseKey ? 'Set' : 'Missing');
console.log('OPENAI_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
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
      model: 'text-embedding-3-large',
      input: text,
      encoding_format: 'float',
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

async function testSemanticSearch() {
  console.log('🧪 Testing Semantic Search Functions...\n');

  const cliQuery = process.argv.slice(2).join(' ').trim();
  const testQueries = cliQuery ? [cliQuery] : [
    'CFO interim københavn',
    'logistikvirksomheder',
    'pharma økonomi',
    'controller SAP',
    'økonomichef aarhus'
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Testing query: "${query}"`);
    
    try {
      // Generate embedding for the query
      const embedding = await generateEmbedding(query);
      console.log('✅ Generated embedding successfully');

      // Test semantic search
      const { data: semanticResults, error: semanticError } = await supabase.rpc('match_jobs_semantic', {
        query_embedding: embedding,
        match_threshold: 0.05,
        match_count: 10,
        min_score: 1
      });

      if (semanticError) {
        console.error('❌ Semantic search error:', semanticError);
      } else {
        console.log(`✅ Semantic search found ${semanticResults?.length || 0} results`);
        if (semanticResults && semanticResults.length > 0) {
          semanticResults.forEach((job, index) => {
            console.log(`  ${index + 1}. ${job.title} (${job.company}) - Similarity: ${(job.similarity * 100).toFixed(1)}%`);
          });
        }
      }

      // Test hybrid search
      const { data: hybridResults, error: hybridError } = await supabase.rpc('match_jobs_hybrid', {
        query_embedding: embedding,
        search_text: query,
        match_threshold: 0.05,
        match_count: 10,
        min_score: 1
      });

      if (hybridError) {
        console.error('❌ Hybrid search error:', hybridError);
      } else {
        console.log(`✅ Hybrid search found ${hybridResults?.length || 0} results`);
        if (hybridResults && hybridResults.length > 0) {
          hybridResults.forEach((job, index) => {
            console.log(`  ${index + 1}. ${job.title} (${job.company}) - Similarity: ${(job.similarity * 100).toFixed(1)}%`);
          });
        }
      }

      // Test text search
      const { data: textResults, error: textError } = await supabase.rpc('match_jobs_text', {
        search_text: query,
        match_count: 10,
        min_score: 1
      });

      if (textError) {
        console.error('❌ Text search error:', textError);
      } else {
        console.log(`✅ Text search found ${textResults?.length || 0} results`);
        if (textResults && textResults.length > 0) {
          textResults.forEach((job, index) => {
            console.log(`  ${index + 1}. ${job.title} (${job.company}) - Similarity: ${(job.similarity * 100).toFixed(1)}%`);
          });
        }
      }

    } catch (error) {
      console.error('❌ Error testing query:', error);
    }
  }

  console.log('\n🎉 Semantic search testing completed!');
}

async function testJobRecommendations() {
  console.log('\n🧪 Testing Job Recommendations...\n');

  try {
    // Get a sample job ID
    const { data: sampleJobs, error: sampleError } = await supabase
      .from('jobs')
      .select('job_id, title, company')
      .is('deleted_at', null)
      .gte('cfo_score', 1)
      .limit(1);

    if (sampleError) {
      console.error('❌ Error getting sample job:', sampleError);
      return;
    }

    if (sampleJobs && sampleJobs.length > 0) {
      const sampleJob = sampleJobs[0];
      console.log(`📝 Testing recommendations for job: "${sampleJob.title}" (${sampleJob.company})`);

      const { data: recommendations, error: recError } = await supabase.rpc('get_job_recommendations', {
        job_id_param: sampleJob.job_id,
        match_count: 3,
        min_score: 1
      });

      if (recError) {
        console.error('❌ Job recommendations error:', recError);
      } else {
        console.log(`✅ Found ${recommendations?.length || 0} recommendations`);
        if (recommendations && recommendations.length > 0) {
          recommendations.forEach((job, index) => {
            console.log(`  ${index + 1}. ${job.title} (${job.company}) - Similarity: ${(job.similarity * 100).toFixed(1)}%`);
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Error testing job recommendations:', error);
  }
}

async function checkEmbeddings() {
  console.log('\n🔍 Checking Embeddings Status...\n');

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
    console.error('❌ Error checking embeddings:', error);
  }
}

async function main() {
  console.log('🚀 Starting Semantic Search Tests...\n');

  await checkEmbeddings();
  await testSemanticSearch();
  await testJobRecommendations();

  console.log('\n✨ All tests completed!');
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testSemanticSearch,
  testJobRecommendations,
  checkEmbeddings
}; 