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
    const prompt = `Du er en ekspert i dansk job-søgning og tekstbehandling. Din opgave er at forbedre en søgequery til et job-søgningssystem.

ORIGINAL QUERY: "${query}"

KONTEKST: ${context}

OPGAVER:
1. Ret stavefejl og grammatikfejl
2. Udvid forkortelser (f.eks. "nordk" → "nordisk", "cfo" → "chief financial officer")
3. Tilføj relevante synonymer og relaterede termer
4. Optimér queryen til job-søgning
5. Bevar den oprindelige mening

SVAR FORMAT (JSON):
{
  "correctedQuery": "den korrekte og udvidede query",
  "corrections": ["liste af rettelser der blev lavet"],
  "suggestions": ["liste af forbedringsforslag"],
  "confidence": 0.95
}

EKSEMPLER:
- "søger novo nordk" → "novo nordisk"
- "cfo stilling" → "chief financial officer stilling"
- "økonomi job" → "økonomi regnskab finans job"

SVAR KUN MED JSON:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Du er en ekspert i dansk job-søgning og tekstbehandling. Svar altid med gyldig JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.1,
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
  const abbreviations: Record<string, string> = {
    'nordk': 'nordisk',
    'novo': 'novo nordisk',
    'cfo': 'chief financial officer',
    'cto': 'chief technology officer',
    'ceo': 'chief executive officer',
    'hr': 'human resources',
    'it': 'information technology',
    'erp': 'enterprise resource planning',
    'crm': 'customer relationship management',
    'bi': 'business intelligence',
    'fp&a': 'financial planning and analysis',
    'ap': 'accounts payable',
    'ar': 'accounts receivable',
    'gl': 'general ledger',
    'kpi': 'key performance indicator',
    'roi': 'return on investment',
    'køb': 'københavn',
    'kbh': 'københavn',
    'århus': 'aarhus',
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

  // Basic spelling corrections
  const spellingCorrections: Record<string, string> = {
    'søger': 'søger',
    'leder': 'leder',
    'ønsker': 'ønsker',
    'arbejde': 'arbejde',
    'stilling': 'stilling',
    'job': 'job',
    'karriere': 'karriere'
  };

  Object.entries(spellingCorrections).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    if (regex.test(processedQuery)) {
      processedQuery = processedQuery.replace(regex, correct);
      corrections.push(`${wrong} → ${correct}`);
    }
  });

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
  try {
    // Try AI preprocessing first
    return await preprocessQueryWithAI(query);
  } catch (error) {
    console.log('AI preprocessing failed, using fallback:', error);
    // Fallback to basic preprocessing
    return preprocessQueryFallback(query);
  }
} 