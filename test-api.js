const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: 'Gu28HkJ7veybeLBRTAvLcxzn6mLRCbjc1etnPEIhwYEBDw4uJFD30moWSqxcHE0uFJm2FAb95YT3BlbkFJd_S5zz3hac8T8dr11Ybppp4tEVN_S804bTzw-WiOt1PdT94ObZq4e_0-bbUcTLoWimA6gfaLsA',
});

async function testAPI() {
  try {
    console.log('Testing OpenAI API...');
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: 'test',
      encoding_format: 'float',
    });
    console.log('✅ API key works!');
    console.log('Embedding length:', response.data[0].embedding.length);
  } catch (error) {
    console.error('❌ API key error:', error.message);
  }
}

testAPI(); 