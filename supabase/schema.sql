-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  publication_date DATE NOT NULL,
  description TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 3),
  job_url TEXT NOT NULL,
  title_embedding vector(1536),
  description_embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(score DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_publication_date ON jobs(publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);

-- Create vector indexes for similarity search
CREATE INDEX IF NOT EXISTS idx_jobs_title_embedding ON jobs USING ivfflat (title_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_jobs_description_embedding ON jobs USING ivfflat (description_embedding vector_cosine_ops) WITH (lists = 100);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_jobs_updated_at 
  BEFORE UPDATE ON jobs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function for similarity search
CREATE OR REPLACE FUNCTION match_jobs(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  company TEXT,
  location TEXT,
  publication_date DATE,
  description TEXT,
  score INTEGER,
  job_url TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    jobs.id,
    jobs.title,
    jobs.company,
    jobs.location,
    jobs.publication_date,
    jobs.description,
    jobs.score,
    jobs.job_url,
    1 - (jobs.title_embedding <=> query_embedding) as similarity
  FROM jobs
  WHERE jobs.title_embedding IS NOT NULL
    AND 1 - (jobs.title_embedding <=> query_embedding) > match_threshold
  UNION ALL
  SELECT
    jobs.id,
    jobs.title,
    jobs.company,
    jobs.location,
    jobs.publication_date,
    jobs.description,
    jobs.score,
    jobs.job_url,
    1 - (jobs.description_embedding <=> query_embedding) as similarity
  FROM jobs
  WHERE jobs.description_embedding IS NOT NULL
    AND 1 - (jobs.description_embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Insert sample data
INSERT INTO jobs (title, company, location, publication_date, description, score, job_url) VALUES
(
  'CFO Interim - Akut behov for økonomisk ledelse',
  'TechStart A/S',
  'København',
  '2024-01-15',
  'Vi søger en erfaren CFO til at overtage den økonomiske ledelse på interim basis. Virksomheden står over for en kritisk fase med investorforhandlinger og har brug for øjeblikkelig assistance. Ansvar inkluderer: Økonomisk rapportering, budgettering, investor relations, og strategisk økonomisk planlægning. Vi har brug for en person der kan starte omgående.',
  3,
  'https://example.com/job/1'
),
(
  'Interim CFO til vækstvirksomhed',
  'GreenEnergy Solutions',
  'Aarhus',
  '2024-01-14',
  'Vækstvirksomhed i grøn energi søger interim CFO til at støtte den næste fase af udviklingen. Fokus på: Økonomisk modellering, fundraising, og opskalering af økonomifunktionen. Vi forventer at du kan bidrage til både den daglige drift og den strategiske udvikling.',
  3,
  'https://example.com/job/2'
),
(
  'CFO til familieejet virksomhed',
  'Nordic Manufacturing',
  'Odense',
  '2024-01-13',
  'Familieejet produktionsvirksomhed søger CFO til at modernisere økonomifunktionen. Opgaver inkluderer: Implementering af nye økonomiske systemer, procesoptimering, og forberedelse til generationsskifte. Vi søger en person med erfaring i familieejede virksomheder.',
  2,
  'https://example.com/job/3'
),
(
  'Interim Financial Controller',
  'Digital Agency Copenhagen',
  'København',
  '2024-01-12',
  'Digitalt bureau søger interim financial controller til at styrke den økonomiske funktion. Ansvar for: Månedsrapportering, budgettering, og økonomisk analyse. Vi har brug for en person der kan arbejde selvstændigt og bidrage til forbedringer af økonomiske processer.',
  2,
  'https://example.com/job/4'
),
(
  'CFO til startup i fintech',
  'FinTech Innovations',
  'København',
  '2024-01-11',
  'Fintech startup søger CFO til at bygge økonomifunktionen fra bunden. Du vil være ansvarlig for: Økonomisk strategi, compliance, investor relations, og fundraising. Vi søger en person med erfaring i fintech og regulerede miljøer.',
  2,
  'https://example.com/job/5'
),
(
  'Interim CFO til international virksomhed',
  'Global Trading Co',
  'Aarhus',
  '2024-01-10',
  'International handelsvirksomhed søger interim CFO til at håndtere komplekse økonomiske udfordringer. Ansvar inkluderer: International økonomisk rapportering, valutahåndtering, og compliance. Vi har brug for en person med international erfaring.',
  1,
  'https://example.com/job/6'
),
(
  'Financial Controller til retail',
  'Nordic Retail Group',
  'Odense',
  '2024-01-09',
  'Retail virksomhed søger financial controller til at styrke den økonomiske funktion. Opgaver: Månedsrapportering, lagerstyring, og økonomisk analyse. Vi søger en person med erfaring i retail og detailhandel.',
  1,
  'https://example.com/job/7'
),
(
  'CFO til nonprofit organisation',
  'Charity Foundation',
  'København',
  '2024-01-08',
  'Nonprofit organisation søger CFO til at styrke den økonomiske funktion. Ansvar for: Budgettering, donor relations, og økonomisk rapportering. Vi søger en person med erfaring i nonprofit sektoren.',
  1,
  'https://example.com/job/8'
),
(
  'Interim Financial Manager',
  'Consulting Partners',
  'Aarhus',
  '2024-01-07',
  'Konsulentvirksomhed søger interim financial manager til at håndtere den økonomiske funktion. Opgaver: Projektregnskab, fakturering, og økonomisk rapportering. Vi har brug for en person der kan arbejde fleksibelt.',
  0,
  'https://example.com/job/9'
),
(
  'Financial Controller til service virksomhed',
  'Service Solutions',
  'Odense',
  '2024-01-06',
  'Service virksomhed søger financial controller til at styrke den økonomiske funktion. Ansvar for: Månedsrapportering, budgettering, og økonomisk analyse. Vi søger en person med god kommunikationsevne.',
  0,
  'https://example.com/job/10'
)
ON CONFLICT DO NOTHING; 