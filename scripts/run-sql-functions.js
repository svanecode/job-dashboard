require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('SUPABASE_KEY:', supabaseKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQLFunctions() {
  console.log('🚀 Running SQL functions...\n');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('supabase/semantic_search_official.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim().length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      try {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}`);
        console.log(`Statement: ${statement.substring(0, 100)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
      }
    }
    
    console.log('\n🎉 SQL functions execution completed!');
    
  } catch (error) {
    console.error('❌ Error reading SQL file:', error);
  }
}

// Run the script
if (require.main === module) {
  runSQLFunctions().catch(console.error);
}

module.exports = {
  runSQLFunctions
}; 