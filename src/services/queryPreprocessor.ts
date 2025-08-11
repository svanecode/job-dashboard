import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PreprocessedQuery {
  originalQuery: string;
  processedQuery: string;
  corrections: string[];
  suggestions: string[];
  confidence: number;
}

/**
 * AI-powered query preprocessing that handles:
 * - Spelling corrections
 * - Abbreviation expansion
 * - Query optimization
 * - Danish language support
 */
export async function preprocessQueryWithAI(
  query: string,
  context: string = "job search in Denmark"
): Promise<PreprocessedQuery> {
  if (!query || query.trim().length === 0) {
    return {
      originalQuery: query,
      processedQuery: query,
      corrections: [],
      suggestions: [],
      confidence: 0
    };
  }

  try {
    const prompt = `Du er en dansk stave- og grammatikhjælper. Din opgave er KUN at rette stavefejl, små grammatiske fejl og udvide meget almindelige forkortelser (fx "kbh" → "københavn"). Du må IKKE tilføje domænespecifikke ord, jobtitler, branchesynonymer eller ekstra begreber.

ORIGINAL QUERY: "${query}"

REGLER:
1) Ret kun stave/grammatik og BASALE forkortelser.
2) Bevar meningen 1:1. Tilføj ikke nye ord, titler, brancher eller kvalitets-/proces-udtryk.
3) Ingen omskrivning/optimering af indhold – kun minimal korrektion.

SVAR FORMAT (JSON):
{
  "correctedQuery": "den korrigerede query (kun minimal rettelse)",
  "corrections": ["liste af rettelser der blev lavet"],
  "suggestions": [],
  "confidence": 0.95
}

SVAR KUN MED JSON:`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-5-chat',
      messages: [
        {
          role: 'system',
          content: 'Du er en ekspert i dansk job-søgning og tekstbehandling. Svar altid med gyldig JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse JSON response
    const parsed = JSON.parse(response);
    
    return {
      originalQuery: query,
      processedQuery: parsed.correctedQuery || query,
      corrections: parsed.corrections || [],
      suggestions: parsed.suggestions || [],
      confidence: parsed.confidence || 0.5
    };

  } catch (error) {
    console.error('AI preprocessing failed:', error);
    
    // Fallback to basic preprocessing
    return {
      originalQuery: query,
      processedQuery: query,
      corrections: [],
      suggestions: ['AI preprocessing ikke tilgængelig'],
      confidence: 0.1
    };
  }
}

/**
 * Fallback preprocessing when AI is not available
 */
export function preprocessQueryFallback(query: string): PreprocessedQuery {
  const corrections: string[] = [];
  const suggestions: string[] = [];
  let processedQuery = query.toLowerCase();

  // Basic abbreviation handling
  // Kun meget almindelige og sikre forkortelser – ingen domæneudvidelser
  const abbreviations: Record<string, string> = {
    'kbh': 'københavn',
    'køb': 'københavn',
    'århus': 'aarhus',
    'aarhus': 'aarhus',
    'odense': 'odense',
    'aalborg': 'aalborg'
  };

  // Apply corrections
  Object.entries(abbreviations).forEach(([abbr, full]) => {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    if (regex.test(processedQuery)) {
      processedQuery = processedQuery.replace(regex, full);
      corrections.push(`${abbr} → ${full}`);
    }
  });

  // No grammar/spelling corrections to avoid latency and unintended changes

  return {
    originalQuery: query,
    processedQuery: processedQuery.trim(),
    corrections,
    suggestions: ['Brug AI preprocessing for bedre resultater'],
    confidence: 0.3
  };
}

/**
 * Main preprocessing function that tries AI first, then falls back
 */
export async function preprocessQuery(query: string): Promise<PreprocessedQuery> {
  // Skip AI preprocessing entirely for performance; do only lightweight local handling
  return preprocessQueryFallback(query);
} 