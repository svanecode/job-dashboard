import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';
import { searchJobsSemantic } from '@/services/jobService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, searchType = 'hybrid', conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
    }

    // STEP 1: Let AI determine if this is a follow-up question or needs new job search
    const conversationContext = conversationHistory.length > 0 
      ? `\nTidligere samtale:\n${conversationHistory.map((msg: any, i: number) => 
          `${i + 1}. ${msg.role === 'user' ? 'Bruger' : 'Assistant'}: ${msg.content}`
        ).join('\n')}`
      : '';

    const strategyPrompt = `Du er en ekspert jobrådgiver. Vurder om brugerens spørgsmål kræver en ny job-søgning eller om det er et opfølgende spørgsmål om tidligere nævnte jobs.

SPØRGSMÅL: "${message}"

${conversationContext}

OPGAVE:
Vurder om dette er:
1. ET OPFØLGENDE SPØRGSMÅL - brugeren vil vide mere om tidligere nævnte jobs
2. EN NY SØGNING - brugeren søger efter nye jobs

REGLER:
OPFØLGENDE (kun hvis brugeren refererer til tidligere nævnte jobs):
- "fortæl mig mere" (om tidligere jobs)
- "om dem" (tidligere jobs)
- "om det" (tidligere jobs)
- "fortæl mig om de job" (tidligere jobs)
- "hvad med dem" (tidligere jobs)

NY SØGNING (hvis brugeren søger nye jobs eller nye kriterier):
- "hvad med [lokation]?" → NY SØGNING (ny lokation)
- "er der job i [lokation]?" → NY SØGNING (ny lokation)
- "søger [virksomhed]?" → NY SØGNING (ny virksomhed)
- "jobs i [branche]?" → NY SØGNING (ny branche)
- "hvad med [jobtype]?" → NY SØGNING (ny jobtype)
- "er der flere?" → NY SØGNING (flere jobs af samme type)

VIKTIGT: Hvis brugeren spørger om en ny lokation, virksomhed, branche eller jobtype → NY SØGNING

SVAR KUN:
- "OPFØLGENDE" hvis det er et opfølgende spørgsmål om tidligere jobs
- "NY_SØGNING" hvis det kræver en ny job-søgning`;

    console.log('Determining search strategy for:', message);
    
    const strategyResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: strategyPrompt }],
      max_tokens: 50,
      temperature: 0.1
    });

    const strategy = strategyResponse.choices[0]?.message?.content?.trim() || 'NY_SØGNING';
    console.log('AI determined strategy:', strategy);

    let candidateJobs: any[] = [];
    let selectedJobs: any[] = [];
    let response = 'Beklager, jeg kunne ikke generere et svar.';

    if (strategy === 'NY_SØGNING') {
      // STEP 2: Perform semantic search only
      console.log('Performing semantic search for:', message);
      
      try {
        const searchParams = {
          page: 1,
          pageSize: 20,
          matchThreshold: 0.0001, // Extremely low threshold to get results
          minScore: 1
        };

        const searchResults = await searchJobsSemantic(message, searchParams);

        if (searchResults && searchResults.data && searchResults.data.length > 0) {
          candidateJobs = searchResults.data;
          console.log(`Semantic search found ${candidateJobs.length} candidate jobs`);
        } else {
          console.log('Semantic search returned no results');
          // No fallback - let AI handle it with empty results
        }
      } catch (error) {
        console.error('Semantic search error:', error);
        // No fallback - let AI handle it with empty results
      }

      // STEP 3: Use AI to analyze and select relevant jobs
      if (candidateJobs.length > 0) {
        const jobDetails = candidateJobs.map((job, index) => `
Job ${index + 1}:
- Titel: ${job.title}
- Virksomhed: ${job.company}
- Lokation: ${job.location}
- Score: ${job.cfo_score}
- Relevans: ${job.similarity ? (job.similarity * 100).toFixed(1) + '%' : 'N/A'}
- Beskrivelse: ${job.description}
`).join('\n');

        const analysisPrompt = `Du er en ekspert jobrådgiver. Analyser følgende jobs baseret på spørgsmålet: "${message}"

${conversationContext}

VIKTIG KONTEKST:
Alle jobs i databasen handler om økonomi, finans, regnskab, controlling, etc. Når brugeren spørger om specifikke brancher (f.eks. "transportsektoren", "pharma", "IT"), så er alle økonomi-jobs relevante fordi:
- Alle virksomheder har brug for økonomi-folk
- Transport-firmaer har brug for økonomi-kontrollere
- Pharma-firmaer har brug for finans-folk
- Alle brancher har brug for regnskab og controlling

Her er ${candidateJobs.length} jobs fra databasen:

${jobDetails}

OPGAVE:
1. Analyser om spørgsmålet matcher nogle af job-annoncerne
2. Vælg de mest relevante jobs (0-5 stk) baseret på spørgsmålet
3. Giv et kort svar (maks 2-3 sætninger)

REGLER:
- Hvis der ER relevante jobs: Nævn dem med titel og virksomhed (IKKE job numre)
- Hvis der IKKE er relevante jobs: "Nej" + kort forklaring
- Nævn KUN jobs der faktisk er i listen ovenfor
- OPDIGT IKKE JOBS - kun brug jobs fra listen
- Vær præcis og konsistent
- Vær fleksibel: Alle økonomi-jobs kan være relevante for alle brancher

RETUR:
Giv kun et kort svar på dansk. Hvis ingen jobs er relevante, svar "Nej" + kort forklaring. Hvis der er relevante jobs, nævn dem med titel og virksomhed (IKKE job numre).

KRITISK: Du SKAL altid tilføje en linje med "RELEVANTE_JOBS: [numre]" efter dit svar hvis du nævner jobs. F.eks. "RELEVANTE_JOBS: 1,3,5" eller "RELEVANTE_JOBS: 8". Uden denne linje kan systemet ikke vise job-kortene.`;

        const analysisResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: analysisPrompt }],
          max_tokens: 300,
          temperature: 0.1
        });

        const rawResponse = analysisResponse.choices[0]?.message?.content || 'Beklager, jeg kunne ikke analysere jobs.';
        console.log('Raw AI response:', rawResponse);
        
        // Remove the "RELEVANTE_JOBS:" line from the response before showing to user
        response = rawResponse.replace(/RELEVANTE_JOBS:\s*[\d,\s]+/i, '').trim();
        
        // Parse job numbers from raw response (before cleaning)
        const jobNumbers = parseJobNumbersFromResponse(rawResponse);
        console.log('Parsed job numbers:', jobNumbers);
        
        if (jobNumbers.length > 0) {
          selectedJobs = jobNumbers.map(num => candidateJobs[num - 1]).filter(Boolean);
          console.log('Selected jobs:', selectedJobs.map(job => `${job.title} hos ${job.company}`));
        } else {
          console.log('No job numbers found in response');
        }
        
        console.log('AI selected', selectedJobs.length, 'relevant jobs out of', candidateJobs.length, 'candidates');
      } else {
        // No search results - let AI explain why and suggest alternatives
        const noResultsPrompt = `Du er en ekspert jobrådgiver. Brugeren søgte efter: "${message}"

${conversationContext}

OPGAVE:
Brugeren søgte efter jobs, men der blev ikke fundet nogen resultater. Forklar venligt hvorfor og giv forslag til alternativer.

REGLER:
- Vær hjælpsom og konstruktiv
- Forklar at alle jobs handler om økonomi/finans
- Foreslå alternative søgninger
- Vær positiv og opmuntrende

SVAR:
Giv et venligt svar på dansk der forklarer situationen og foreslår alternativer.`;

        const noResultsResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: noResultsPrompt }],
          max_tokens: 200,
          temperature: 0.1
        });

        response = noResultsResponse.choices[0]?.message?.content || 'Beklager, jeg kunne ikke finde nogen relevante jobs.';
      }
    } else {
      // STEP 4: Handle follow-up questions without new search
      console.log('Handling follow-up question without new search');
      
      const followUpPrompt = `Du er en ekspert jobrådgiver. Brugeren spørger om mere information om tidligere nævnte jobs.

SPØRGSMÅL: "${message}"

${conversationContext}

OPGAVE:
Giv detaljeret information om de jobs der blev nævnt i den tidligere samtale. Forklar:
- Hvad virksomheden laver
- Hvad jobbet indebærer
- Hvad der kræves af kandidaten
- Andre relevante detaljer

REGLER:
- Referer kun til jobs der blev nævnt i den tidligere samtale
- Giv konkret og detaljeret information
- Brug naturlig dansk
- Vær hjælpsom og informativ

SVAR:
Giv et detaljeret svar på dansk om de tidligere nævnte jobs.`;

      const followUpResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: followUpPrompt }],
        max_tokens: 400,
        temperature: 0.1
      });

      response = followUpResponse.choices[0]?.message?.content || 'Beklager, jeg kunne ikke give dig mere information.';
    }

    console.log('Final response - selected jobs:', selectedJobs.length);
    
    const res = NextResponse.json({
      response,
      similarJobs: selectedJobs,
      searchType,
      strategy
    });
    try {
      const ids = selectedJobs.map(j => j.id).filter(Boolean);
      if (ids.length > 0) {
        const cookieValue = encodeURIComponent(JSON.stringify(ids.slice(0, 20)));
        res.headers.set('Set-Cookie', `chat_selected_jobs=${cookieValue}; Path=/; Max-Age=900; SameSite=Lax`);
      }
    } catch {}
    return res;

  } catch (error) {
    console.error('Error in query endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to parse job numbers from AI response
function parseJobNumbersFromResponse(response: string): number[] {
  const jobNumbers: number[] = [];
  
  // First, look for "RELEVANTE_JOBS:" pattern (this is the primary format we want)
  const relevantJobsMatch = response.match(/RELEVANTE_JOBS:\s*([\d,\s]+)/i);
  if (relevantJobsMatch) {
    const numbersStr = relevantJobsMatch[1];
    const numbers = numbersStr.split(/[,\s]+/).map(num => parseInt(num.trim())).filter(num => !isNaN(num));
    jobNumbers.push(...numbers);
  } else {
    // Fallback: Look for patterns like "Job 1, 2" or "Job 1, 2, 3" or "Job 1 og 2"
    const jobPatterns = [
      /Job\s+(\d+)(?:\s*,\s*(\d+))?(?:\s*,\s*(\d+))?(?:\s*,\s*(\d+))?(?:\s*,\s*(\d+))?/gi,
      /Job\s+(\d+)\s+og\s+(\d+)/gi,
      /(\d+)\s*,\s*(\d+)/gi
    ];
    
    for (const pattern of jobPatterns) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        for (let i = 1; i < match.length; i++) {
          if (match[i]) {
            const num = parseInt(match[i]);
            if (num > 0 && num <= 20) { // Reasonable range
              jobNumbers.push(num);
            }
          }
        }
      }
    }
  }
  
  return [...new Set(jobNumbers)]; // Remove duplicates
}

// Helper function to generate embedding for query
async function generateEmbeddingForQuery(text: string): Promise<number[]> {
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