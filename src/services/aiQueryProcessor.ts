import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

// Only create OpenAI client on server-side
const openai = typeof window === 'undefined' && process.env.OPENAI_API_KEY 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

interface DatabaseAnalysis {
  totalJobs: number;
  jobCategories: string[];
  companies: string[];
  locations: string[];
  commonTerms: string[];
}

interface SearchStrategy {
  method: 'semantic' | 'text' | 'hybrid' | 'direct';
  query: string;
  filters?: any;
  reason: string;
}

interface ProcessedQuery {
  original: string;
  processed: string;
  searchStrategy: SearchStrategy;
  relevantJobs?: any[];
  confidence: number;
  corrections: string[];
}

export class AIQueryProcessor {
  private databaseAnalysis: DatabaseAnalysis | null = null;

  async analyzeDatabase(): Promise<DatabaseAnalysis> {
    if (this.databaseAnalysis) {
      return this.databaseAnalysis;
    }

    try {
      // Get database statistics
      const { data: jobs, error } = await supabase
        ?.from('jobs')
        .select('title, company, location, description, cfo_score')
        .limit(1000);

      if (error || !jobs) {
        throw new Error('Failed to analyze database');
      }

      // Analyze job data
      const companies = [...new Set(jobs.map((job: any) => job.company).filter(Boolean))] as string[];
      const locations = [...new Set(jobs.map((job: any) => job.location).filter(Boolean))] as string[];
      
      // Extract common terms from titles and descriptions
      const allText = jobs.map((job: any) => `${job.title} ${job.description}`).join(' ');
      const words = allText.toLowerCase().match(/\b[a-zæøå]{3,}\b/g) || [];
      const wordCount = (words as string[]).reduce((acc: Record<string, number>, word: string) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const commonTerms = Object.entries(wordCount)
        .filter(([_, count]) => (count as number) > 5)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 50)
        .map(([word]) => word) as string[];

      // Categorize jobs
      const jobCategories = this.categorizeJobs(jobs);

      this.databaseAnalysis = {
        totalJobs: jobs.length,
        jobCategories,
        companies,
        locations,
        commonTerms
      };

      return this.databaseAnalysis;
    } catch (error) {
      console.error('Database analysis failed:', error);
      return {
        totalJobs: 0,
        jobCategories: [],
        companies: [],
        locations: [],
        commonTerms: []
      };
    }
  }

  private categorizeJobs(jobs: any[]): string[] {
    const categories = new Set<string>();
    
    jobs.forEach(job => {
      const title = job.title?.toLowerCase() || '';
      const description = job.description?.toLowerCase() || '';
      const company = job.company?.toLowerCase() || '';
      
      if (title.includes('cfo') || description.includes('cfo') || title.includes('økonomi')) {
        categories.add('finance');
      }
      if (title.includes('it') || description.includes('it') || title.includes('software')) {
        categories.add('technology');
      }
      if (company.includes('kommune') || company.includes('region')) {
        categories.add('public');
      }
      if (title.includes('salg') || description.includes('salg')) {
        categories.add('sales');
      }
      if (title.includes('hr') || description.includes('hr') || title.includes('personal')) {
        categories.add('hr');
      }
      if (title.includes('marketing') || description.includes('marketing')) {
        categories.add('marketing');
      }
      if (title.includes('produktion') || description.includes('produktion')) {
        categories.add('production');
      }
    });

    return Array.from(categories);
  }

  async processQuery(query: string): Promise<ProcessedQuery> {
    try {
      // Check if OpenAI is available
      if (!openai) {
        console.log('OpenAI not available, using fallback processing');
        return this.fallbackProcessing(query);
      }

      // Analyze database first
      const dbAnalysis = await this.analyzeDatabase();
      
      // Create system prompt with database context
      const systemPrompt = this.createSystemPrompt(dbAnalysis);
      
      // Process query with AI
      const model = process.env.OPENAI_MODEL || 'gpt-4.1';
      let response: string | undefined;
      try {
        const resp = await openai.responses.create({
          model,
          instructions: systemPrompt,
          input: `Process this query: "${query}"`,
          max_output_tokens: 400,
        });
        response = (resp as any).output_text ?? extractResponseText(resp);
      } catch (err: any) {
        const code = err?.code || err?.status;
        if (code === 'model_not_found' || code === 404) {
          const resp = await openai.responses.create({
            model: 'gpt-5',
            instructions: systemPrompt,
            input: `Process this query: "${query}"`,
            max_output_tokens: 400,
          });
          response = (resp as any).output_text ?? extractResponseText(resp);
        } else {
          throw err;
        }
      }

      if (!response) {
        throw new Error('No response from AI');
      }

      // Parse AI response
      const parsed = this.parseAIResponse(response, query);
      
      // If AI suggests direct search, execute it
      if (parsed.searchStrategy.method === 'direct' && parsed.searchStrategy.query) {
        const relevantJobs = await this.executeDirectSearch(parsed.searchStrategy.query);
        parsed.relevantJobs = relevantJobs;
      }

      return parsed;
    } catch (error) {
      console.error('AI query processing failed:', error);
      // Fallback to basic processing
      return this.fallbackProcessing(query);
    }
  }

  private createSystemPrompt(dbAnalysis: DatabaseAnalysis): string {
    return `Du er en intelligent job søge assistent med adgang til en database med ${dbAnalysis.totalJobs} jobs.

DATABASE INFORMATION:
- Job kategorier: ${dbAnalysis.jobCategories.join(', ')}
- Virksomheder: ${dbAnalysis.companies.slice(0, 20).join(', ')} (og ${dbAnalysis.companies.length - 20} flere)
- Lokationer: ${dbAnalysis.locations.slice(0, 20).join(', ')} (og ${dbAnalysis.locations.length - 20} flere)
- Almindelige termer: ${dbAnalysis.commonTerms.slice(0, 30).join(', ')}

OPGAVE:
Analyser brugerens forespørgsel og vælg den bedste søgestrategi. Du skal returnere et JSON objekt med følgende struktur:

{
  "processed_query": "den optimerede søgetekst",
  "search_strategy": {
    "method": "semantic|text|hybrid|direct",
    "query": "den faktiske søgetekst",
    "reason": "forklaring af hvorfor denne metode valgtes"
  },
  "corrections": ["liste af rettelser"],
  "confidence": 0.95,
  "direct_search": false
}

// Robust extractor for OpenAI Responses API
function extractResponseText(resp: any): string {
  try {
    if (!resp) return '';
    if (typeof resp.output_text === 'string' && resp.output_text.length > 0) return resp.output_text;
    const output = (resp as any).output || (resp as any).outputs || [];
    const parts: string[] = [];
    for (const item of output) {
      const content = (item as any)?.content || [];
      for (const c of content) {
        const txt = (c as any)?.text?.value || (c as any)?.text || (c as any)?.content || '';
        if (typeof txt === 'string') parts.push(txt);
      }
    }
    return parts.join('\n').trim();
  } catch {
    return '';
  }
}

SØGEMETODER:
- "semantic": For komplekse forespørgsler der kræver forståelse af mening
- "text": For simple søgninger efter specifikke termer (anbefalet for specifikke nøgleord som "ERP", "kommuner", "novo")
- "hybrid": Kombination af semantic og text søgning
- "direct": Hvis du kan identificere specifikke jobs direkte fra databasen

VIKTIGT: Hvis brugeren søger efter specifikke termer som "ERP", "kommuner", "novo nordisk", "tøjfirmaer", brug "text" søgning for at få de mest relevante resultater.

RETURNER KUN JSON - ingen ekstra tekst.`;
  }

  private parseAIResponse(response: string, originalQuery: string): ProcessedQuery {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        original: originalQuery,
        processed: parsed.processed_query || originalQuery,
        searchStrategy: parsed.search_strategy || {
          method: 'hybrid',
          query: parsed.processed_query || originalQuery,
          reason: 'Fallback to hybrid search'
        },
        confidence: parsed.confidence || 0.8,
        corrections: parsed.corrections || []
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.fallbackProcessing(originalQuery);
    }
  }

  private async executeDirectSearch(query: string): Promise<any[]> {
    try {
      const { data: jobs, error } = await supabase
        ?.from('jobs')
        .select('*')
        .or(`title.ilike.%${query}%,company.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10);

      if (error || !jobs) {
        return [];
      }

      return jobs;
    } catch (error) {
      console.error('Direct search failed:', error);
      return [];
    }
  }

  private fallbackProcessing(query: string): ProcessedQuery {
    // Minimal og neutral fallback uden hardcoded domæner
    const processed = query.trim();
    return {
      original: query,
      processed,
      searchStrategy: {
        method: 'hybrid',
        query: processed,
        reason: 'Neutral fallback uden domæneantagelser'
      },
      confidence: 0.7,
      corrections: []
    };
  }
}

// Helper to extract plain text from Responses API payloads
function extractResponseText(resp: any): string {
  try {
    if (!resp) return '';
    if (typeof resp.output_text === 'string' && resp.output_text.length > 0) return resp.output_text;
    const output = (resp as any).output || (resp as any).outputs || [];
    const parts: string[] = [];
    for (const item of output) {
      const content = (item as any)?.content || [];
      for (const c of content) {
        const txt = (c as any)?.text?.value || (c as any)?.text || (c as any)?.content || '';
        if (typeof txt === 'string') parts.push(txt);
      }
    }
    return parts.join('\n').trim();
  } catch {
    return '';
  }
}

export const aiQueryProcessor = new AIQueryProcessor(); 