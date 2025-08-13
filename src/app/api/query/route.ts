import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';
import { searchJobsSemantic, searchJobsText } from '@/services/jobService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Prefer gpt-5 everywhere (som du foretrækker) via Responses API
async function chatComplete(params: { messages: { role: 'system' | 'user' | 'assistant'; content: string }[]; maxTokens: number }) {
  const systemInstructions = params.messages
    .filter(m => m.role === 'system')
    .map(m => m.content)
    .join('\n\n');
  const inputText = params.messages
    .filter(m => m.role !== 'system')
    .map(m => m.content)
    .join('\n\n');
  try {
    const resp = await openai.responses.create({
      model: 'gpt-4.1',
      instructions: systemInstructions || undefined,
      input: inputText,
      max_output_tokens: params.maxTokens,
    });
    const content = (resp as any).output_text ?? extractResponseText(resp);
    return { choices: [{ message: { content } }] } as any;
  } catch (err: any) {
    console.error('gpt-4.1 responses API failed, trying fallback:', err);
    const resp = await openai.responses.create({
      model: 'gpt-5',
      instructions: systemInstructions || undefined,
      input: inputText,
      max_output_tokens: params.maxTokens,
    });
    const content = (resp as any).output_text ?? extractResponseText(resp);
    return { choices: [{ message: { content } }] } as any;
  }
}

// Robust extractor for OpenAI Responses API
function extractResponseText(resp: any): string {
  try {
    if (!resp) return '';
    if (typeof resp.output_text === 'string' && resp.output_text.length > 0) return resp.output_text;
    const output = resp.output || resp.outputs || [];
    const parts: string[] = [];
    for (const item of output) {
      const content = item?.content || [];
      for (const c of content) {
        const txt = c?.text?.value || c?.text || c?.content || '';
        if (typeof txt === 'string') parts.push(txt);
      }
    }
    return parts.join('\n').trim();
  } catch {
    return '';
  }
}

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
    
    const strategyResponse = await chatComplete({
      messages: [{ role: 'user', content: strategyPrompt }],
      maxTokens: 50
    });

    const strategy = strategyResponse.choices[0]?.message?.content?.trim() || 'NY_SØGNING';
    console.log('AI determined strategy:', strategy);

    let candidateJobs: any[] = [];
    let selectedJobs: any[] = [];
    let response = 'Beklager, jeg kunne ikke generere et svar.';

    if (strategy === 'NY_SØGNING') {
      // STEP 2: Perform semantic search with improved parameters
      console.log('Performing semantic search for:', message);
      
      try {
        const searchParams = {
          page: 1,
          pageSize: 20,           // Giv modellen 20 kandidater
          matchThreshold: 0.3,    // Tilbage til 0.3 (bedre coverage)
          minScore: 1,
          minContentLength: 0     // Midlertidigt deaktiveret - alle jobs har tomme beskrivelser
        };

        const searchResults = await searchJobsSemantic(message, searchParams);

        if (searchResults && searchResults.data && searchResults.data.length > 0) {
          candidateJobs = searchResults.data;
          
          // With the new match_jobs_semantic_perfect function, all results should have descriptions
          const isSemanticResults = candidateJobs.some((job: any) => job.similarity !== undefined);
          const hasDescriptions = candidateJobs.every((job: any) => job.description && job.description.length > 0);
          
          if (isSemanticResults && !hasDescriptions) {
            console.log('Warning: Some semantic results still missing descriptions - check RPC function');
          }
          
          // Augment with text search to catch spelling variations/explicit mentions
          try {
            const textTop = await searchJobsText(message, { page: 1, pageSize: 30, minScore: 1 });
            if (textTop?.data?.length) {
              const seen = new Set(candidateJobs.map((j: any) => j.id));
              for (const j of textTop.data) {
                if (!seen.has((j as any).id)) {
                  candidateJobs.push(j);
                  seen.add((j as any).id);
                }
              }
            }
          } catch {}
          
          // Generic re-ranking: prioritize candidates that include the query keywords in company/title/description
          const keywords = extractQueryKeywords(message);
          if (keywords.length > 0) {
            const reRanked = reRankByKeywords(candidateJobs, keywords);
            // If we have at least one keyword hit, keep the re-ranked list; otherwise retain original order
            const hasHits = reRanked.some(j => (j as any).__kwHits && (j as any).__kwHits > 0);
            if (hasHits) {
              candidateJobs = reRanked.map(j => {
                const { __kwHits, __kwScore, ...rest } = j as any; // remove temp markers
                return rest;
              });
            }
          }
          console.log(`Search found ${candidateJobs.length} candidate jobs (semantic: ${isSemanticResults}, descriptions: ${hasDescriptions})`);
        } else {
          console.log('Search returned no results');
          // No fallback - let AI handle it with empty results
        }
      } catch (error) {
        console.error('Semantic search error:', error);
        // No fallback - let AI handle it with empty results
      }

      // STEP 3: Use AI to analyze and select relevant jobs
      if (candidateJobs.length > 0) {
        // Use deterministic top-N (post semantic + keyword re-rank) for token budget
        const MAX_ITEMS_FOR_MODEL = 20; // Giv modellen 20 kandidater at vælge imellem
        const kwords = extractQueryKeywords(message).map(k => k.toLowerCase());
        const hits = (j: any) => {
          const hay = `${j.company || ''} ${j.title || ''} ${j.description || ''}`.toLowerCase();
          return kwords.reduce((n, k) => n + (hay.includes(k) ? 1 : 0), 0);
        };
        const kwFocused = kwords.length > 0 ? candidateJobs.filter(j => hits(j) > 0) : [];
        const basePool = kwFocused.length >= 2 ? kwFocused : candidateJobs;
        const itemsForModel = basePool.slice(0, Math.min(MAX_ITEMS_FOR_MODEL, basePool.length));
        
        // Debug: Log job data to see what fields are available
        console.log('Debug: Job data for AI analysis:', itemsForModel.map(job => ({
          title: job.title,
          company: job.company,
          location: job.location,
          cfo_score: job.cfo_score,
          similarity: job.similarity,
          description: job.description,
          descriptionLength: job.description?.length || 0
        })));

        // Check if all jobs have empty descriptions
        const allJobsHaveEmptyDescriptions = itemsForModel.every(job => !job.description || job.description.length === 0);
        
        // Forbedret prompt der prioriterer relevans bedre
        const analysisPrompt = `Du er en ekspert jobrådgiver der skal vurdere relevans af jobs baseret på brugerens spørgsmål.

REGLER:
- Brug kun information fra de givne job-annoncer
- Vurder relevans baseret på: jobtitel, virksomhed, beskrivelse og lokation
- Prioriter jobs der direkte matcher brugerens spørgsmål
- Vær beslutningsorienteret og kortfattet
 - Hvis der findes jobs med score 2 eller 3, må du ikke vælge jobs med score 1

RELEVANSVURDERING:
1. **Direkte match**: Jobtitel, virksomhed eller beskrivelse indeholder direkte nøgleord fra spørgsmålet
2. **Relateret match**: Jobtitel, virksomhed eller beskrivelse indeholder relaterede termer
3. **Indirekte match**: Kun generelle økonomi/finans termer uden specifik relevans

Context jobs:
${itemsForModel.map((job, index) => `
Job ${index + 1}:
- Titel: ${job.title}
- Virksomhed: ${job.company}
- Lokation: ${job.location}
- Score: ${job.cfo_score}
- Semantisk relevans: ${job.similarity ? (job.similarity * 100).toFixed(1) + '%' : 'N/A'}
- Beskrivelse: ${job.description || 'Ingen beskrivelse tilgængelig'}
`).join('\n')}

Spørgsmål: "${message}"

${conversationContext}

OPGAVE:
1. Analyser hvert job for relevans til brugerens spørgsmål
2. Prioriter jobs baseret på direkte match → relateret match → indirekte match
3. Vælg 2-5 mest relevante jobs (minimum 2 hvis relevante)
4. Giv et kort svar der forklarer hvorfor disse jobs er relevante

SVAR FORMAT:
[Dit svar om relevante jobs]

RELEVANTE_JOBS: [numre]

EKSEMPEL:
Jeg fandt relevante jobs indenfor bilbranchen: Økonomiassistent hos Pedersen & Nielsen Automobilforretning og Økonomielev hos Uggerhøj Biler.

RELEVANTE_JOBS: 1, 2`;

        const analysisResponse = await chatComplete({
          messages: [
            { role: 'system', content: 'Du er en ekspert jobrådgiver. Du SKAL returnere dit svar i dette format: [Dit svar] RELEVANTE_JOBS: [numre]. Analyser relevans grundigt og prioriter jobs baseret på direkte match med brugerens spørgsmål. Vælg minimum 2 jobs hvis relevante.' },
            { role: 'user', content: analysisPrompt }
          ],
          maxTokens: 500
        });

        const rawResponse = analysisResponse.choices[0]?.message?.content || '';
        console.log('Raw AI response:', rawResponse);
        
        // Remove the "RELEVANTE_JOBS:" line from the response before showing to user
        response = rawResponse.replace(/RELEVANTE_JOBS:\s*[\d,\s]+/i, '').trim();
        
        // Parse job numbers from raw response (before cleaning)
        const jobNumbers = parseJobNumbersFromResponse(rawResponse);
        console.log('Parsed job numbers:', jobNumbers);
        
        if (jobNumbers.length > 0) {
          // Map to the randomized, truncated list we showed the model
          selectedJobs = jobNumbers.map(num => itemsForModel[num - 1]).filter(Boolean);
          console.log('Selected jobs:', selectedJobs.map(job => `${job.title} hos ${job.company}`));
          // If model only returned RELEVANTE_JOBS line (cleaned text empty), build a short summary
          if (!response || response.length === 0) {
            response = buildFallbackSummary(message, selectedJobs);
          }
        } else {
          console.log('No job numbers found in response');
          // Fallback: pick top jobs deterministically (keywords + similarity + score + recency)
          const keywords = extractQueryKeywords(message);
          selectedJobs = pickTopJobs(candidateJobs, 3, keywords);
          if (selectedJobs.length > 0) {
            response = buildFallbackSummary(message, selectedJobs);
          }
        }

        // Enforce score policy: if any candidates have score >=2, drop score 1 from selection and top-up
        const beforeIds = new Set(selectedJobs.map(j => j.id));
        const enforced = enforceCfoScorePriority(selectedJobs, candidateJobs);
        const changed = enforced.length !== selectedJobs.length || enforced.some(j => !beforeIds.has(j.id));
        if (changed) {
          selectedJobs = enforced;
          response = buildFallbackSummary(message, selectedJobs);
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

        const noResultsResponse = await chatComplete({
          messages: [{ role: 'user', content: noResultsPrompt }],
          maxTokens: 200
        });

        response = noResultsResponse.choices[0]?.message?.content || 'Beklager, jeg kunne ikke finde nogen relevante jobs.';
      }
    } else {
      // STEP 4: Handle follow-up questions with improved prompt
      console.log('Handling follow-up question without new search');
      
      const followUpPrompt = `Du er en entusiastisk jobrådgiver der elsker at hjælpe folk!

SPØRGSMÅL: "${message}"

TIDLIGERE SAMTALE:
${conversationContext}

OPGAVE:
- Forstå brugerens hensigt ud fra spørgsmålet og den tidligere liste af jobs
- Svar beslutningsorienteret og kort (maks 2-4 sætninger i alt)
- Hvis brugeren beder om prioritering, vælg det bedst egnede job og forklar hvorfor
- Giv kompakte sammenligninger frem for lange beskrivelser

REGLER:
- Brug kun de jobs, der er nævnt i den tidligere samtale
- Ingen lange oplistninger eller gentagelser
- Fokus på relevans og anbefaling
- Skriv på naturligt dansk
- Vær entusiastisk og hjælpsom`;

      const followUpResponse = await chatComplete({
        messages: [{ role: 'user', content: followUpPrompt }],
        maxTokens: 400
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

// Enforce policy: never return score 1 if any score >= 2 exists among candidates
function enforceCfoScorePriority(selected: any[], candidates: any[]): any[] {
  if (!Array.isArray(selected) || selected.length === 0) return [];
  const hasHigh = Array.isArray(candidates) && candidates.some(j => (j?.cfo_score ?? 0) >= 2);
  if (!hasHigh) return selected;
  const filtered = selected.filter(j => (j?.cfo_score ?? 0) >= 2);
  if (filtered.length === selected.length) return selected;
  // Top-up with highest-ranked >=2 from candidates not already selected
  const takenIds = new Set(filtered.map(j => j.id));
  for (const j of candidates) {
    if ((j?.cfo_score ?? 0) >= 2 && !takenIds.has(j.id)) {
      filtered.push(j);
      takenIds.add(j.id);
      if (filtered.length >= selected.length) break;
    }
  }
  // If still short, keep filtered as-is (better to show fewer than include score 1)
  return filtered;
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

// Pick top N jobs prioritizing CFO score, then recency (publication_date), then company/title
function pickTopJobs(jobs: any[], count: number, keywords?: string[]): any[] {
  if (!Array.isArray(jobs) || jobs.length === 0) return [];
  const kws = (keywords || [])
    .map(k => k.toLowerCase())
    .flatMap(k => [k, k.slice(0, 5)])
    .filter(k => k.length >= 3);
  const kwHits = (j: any) => {
    const hay = `${j.company || ''} ${j.title || ''} ${j.description || ''}`.toLowerCase();
    return kws.reduce((n, k) => n + (hay.includes(k) ? 1 : 0), 0);
  };
  const withHits = kws.length > 0 ? jobs.filter(j => kwHits(j) > 0) : jobs.slice();
  const pool = withHits.length > 0 ? withHits : jobs.slice();
  const ranked = pool.sort((a, b) => {
    const kwDiff = (kwHits(b) - kwHits(a));
    if (kwDiff !== 0) return kwDiff;
    const scoreDiff = (b.cfo_score ?? 0) - (a.cfo_score ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    const da = new Date(a.publication_date || 0).getTime();
    const db = new Date(b.publication_date || 0).getTime();
    if (db !== da) return db - da;
    return String(a.company || '').localeCompare(String(b.company || '')) || String(a.title || '').localeCompare(String(b.title || ''));
  });
  return ranked.slice(0, Math.max(0, count));
}

// Build a short fallback summary referencing selected jobs
function buildFallbackSummary(query: string, jobs: any[]): string {
  const lines: string[] = [];
  if (jobs.length === 0) {
    return 'Jeg fandt ingen oplagte matches.';
  }
  const mentions = jobs.slice(0, 3).map((j: any) => `${j.title} hos ${j.company}`).join(', ');
  lines.push(`Jeg fandt relevante bud for "${query}": ${mentions}.`);
  return lines.join('\n');
}

// Extract sector/industry keywords to narrow result set
function extractIndustryKeywords(text: string): string[] {
  const t = (text || '').toLowerCase();
  const domains: Record<string, string[]> = {
    pharma: ['pharma', 'farmaceut', 'farmaceutisk', 'farmaci', 'lægemiddel', 'life science', 'biotek', 'biotech', 'medico', 'medtech', 'klinisk', 'regulatory'],
    transport: ['transport', 'shipping', 'logistik', 'spedition'],
    it: ['it', 'software', 'saas', 'tech', 'teknologi'],
    offentlig: ['offentlig', 'kommune', 'region', 'stat']
  };
  const hits: string[] = [];
  for (const kws of Object.values(domains)) {
    if (kws.some(k => t.includes(k))) hits.push(...kws);
  }
  return Array.from(new Set(hits));
}

// Extract simple keywords from user query (letters and numbers, length >= 3)
function extractQueryKeywords(text: string): string[] {
  const words = (text || '').toLowerCase().match(/[a-zæøå0-9]{3,}/gi) || [];
  // Deduplicate
  return Array.from(new Set(words));
}

// Re-rank jobs by keyword presence in company/title/description
function reRankByKeywords(jobs: any[], keywords: string[]): any[] {
  const kws = keywords
    .map(k => k.toLowerCase())
    .flatMap(k => [k, k.slice(0, 5)])
    .filter(k => k.length >= 3);
  const scoreJob = (j: any) => {
    const hay = `${j.company || ''} ${j.title || ''} ${j.description || ''}`.toLowerCase();
    let hits = 0;
    for (const k of kws) {
      if (hay.includes(k)) hits += 1;
    }
    // Weight: keyword hits first, then existing cfo_score, then recency
    const recency = new Date(j.publication_date || 0).getTime() / 1e13; // small weight
    const score = hits * 10 + (j.cfo_score ?? 0) * 2 + recency;
    return { ...j, __kwHits: hits, __kwScore: score };
  };
  return jobs.map(scoreJob).sort((a, b) => (b.__kwScore ?? 0) - (a.__kwScore ?? 0));
}

// Simple Fisher-Yates shuffle
function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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