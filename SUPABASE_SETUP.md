# Supabase Setup Guide

Denne guide hjælper dig med at opsætte Supabase til KPMG CFO Interim Dashboard.

## 🚀 Trin 1: Opret Supabase Projekt

1. Gå til [supabase.com](https://supabase.com)
2. Klik "Start your project"
3. Log ind eller opret en konto
4. Klik "New Project"
5. Vælg din organisation
6. Udfyld projekt detaljer:
   - **Name**: `kpmg-cfo-dashboard`
   - **Database Password**: Vælg et sikkert password
   - **Region**: Vælg den region der er tættest på dig
7. Klik "Create new project"

## 🗄️ Trin 2: Database Schema

Din eksisterende database struktur er allerede korrekt! Du har:

```sql
create table public.jobs (
  id bigserial not null,
  job_id text not null,
  title text null,
  job_url text null,
  company text null,
  company_url text null,
  location text null,
  publication_date date null,
  description text null,
  created_at timestamp with time zone null default now(),
  deleted_at timestamp with time zone null,
  cfo_score integer null,
  scored_at timestamp with time zone null,
  job_info timestamp with time zone null,
  last_seen timestamp with time zone null,
  constraint jobs_pkey primary key (id),
  constraint jobs_job_id_key unique (job_id),
  constraint jobs_cfo_score_check check (
    (
      (cfo_score >= 0)
      and (cfo_score <= 3)
    )
  )
);
```

Dashboardet er nu konfigureret til at arbejde med din eksisterende struktur.

## 🔑 Trin 3: Få API Nøgler

1. Gå til **Settings** → **API** i dit Supabase dashboard
2. Kopier følgende værdier:
   - **Project URL** (f.eks. `https://your-project.supabase.co`)
   - **anon public** key

## ⚙️ Trin 4: Konfigurer Environment Variables

1. Opret en `.env.local` fil i roden af dit projekt
2. Tilføj følgende variabler:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**⚠️ Vigtigt**: Erstat `your-project` og `your-anon-key-here` med dine faktiske værdier.

## 🧪 Trin 5: Test Forbindelsen

1. Start udviklingsserveren:
   ```bash
   npm run dev
   ```

2. Åbn browser på `http://localhost:3000`
3. Dashboardet skulle nu vise data fra Supabase i stedet for mock data

## 🔒 RLS (Row Level Security)

Hvis du vil aktivere Row Level Security:

1. Gå til **Authentication** → **Policies** i Supabase dashboard
2. Vælg `jobs` tabellen
3. Klik "New Policy"
4. Vælg "Enable read access to everyone"
5. Klik "Review" og "Save policy"

## 📊 Database Struktur

### Jobs Tabel

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| `id` | BIGSERIAL | Primærnøgle (auto-genereret) |
| `job_id` | TEXT | Unik job ID |
| `title` | TEXT | Job titel |
| `job_url` | TEXT | Link til jobopslag |
| `company` | TEXT | Virksomhedsnavn |
| `company_url` | TEXT | Link til virksomhed |
| `location` | TEXT | Job lokation |
| `publication_date` | DATE | Publiceringsdato |
| `description` | TEXT | Job beskrivelse |
| `created_at` | TIMESTAMP | Oprettelsesdato |
| `deleted_at` | TIMESTAMP | Sletningsdato (soft delete) |
| `cfo_score` | INTEGER | Prioritet score (0-3) |
| `scored_at` | TIMESTAMP | Dato for scoring |
| `job_info` | TIMESTAMP | Job info timestamp |
| `last_seen` | TIMESTAMP | Sidst set |

### Indekser

- `idx_jobs_job_id`: For hurtig søgning efter job ID
- `idx_jobs_company`: For hurtig søgning efter virksomhed
- `idx_jobs_publication_date`: For hurtig sortering efter dato
- `idx_jobs_deleted_at`: For soft delete funktionalitet
- `idx_jobs_cfo_score`: For hurtig sortering efter score
- `idx_jobs_scored_at`: For scoring tracking
- `idx_jobs_high_priority`: For hurtig søgning efter score 3
- `idx_jobs_last_seen`: For last seen tracking

## 🛠️ Fejlfinding

### Fejl: "Invalid API key"
- Tjek at du har kopieret den rigtige anon key
- Sørg for at `.env.local` filen er i projektets rod

### Fejl: "Connection failed"
- Tjek at Supabase URL er korrekt
- Sørg for at dit Supabase projekt er aktivt

### Ingen data vises
- Tjek at SQL scriptet er kørt korrekt
- Gå til **Table Editor** i Supabase og tjek at `jobs` tabellen indeholder data

## 🔄 Opdatering af Data

For at opdatere eller tilføje nye jobs:

1. **Via Supabase Dashboard:**
   - Gå til **Table Editor** → **jobs**
   - Klik "Insert row" for at tilføje nye jobs

2. **Via SQL:**
   - Gå til **SQL Editor**
   - Kør INSERT statements

3. **Via API:**
   - Brug `jobService.createJob()` funktionen i koden

## 📈 Performance Tips

- Alle forespørgsler bruger indekser for optimal performance
- Data caches automatisk i Zustand store
- Loading states vises under data hentning
- Error handling er implementeret for alle API kald

## 🔐 Sikkerhed

- Kun læseadgang er nødvendig for dashboardet
- Anon key er sikker at bruge i frontend (kun læseadgang)
- Hvis du tilføjer skriveadgang, brug service role key i backend 

# Supabase Vector Search Setup

For at få chatbot'en til at fungere korrekt, skal du køre følgende SQL i Supabase SQL Editor:

## 1. Kør Vector Search Function

```sql
-- Create function for similarity search with your table structure
CREATE OR REPLACE FUNCTION match_jobs_similarity(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  job_id text,
  title text,
  company text,
  location text,
  publication_date date,
  description text,
  cfo_score integer,
  job_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    jobs.id,
    jobs.job_id,
    jobs.title,
    jobs.company,
    jobs.location,
    jobs.publication_date,
    jobs.description,
    jobs.cfo_score,
    jobs.job_url,
    1 - (jobs.embedding <=> query_embedding) as similarity
  FROM jobs
  WHERE jobs.embedding IS NOT NULL
    AND jobs.deleted_at IS NULL
    AND jobs.cfo_score >= 1
    AND 1 - (jobs.embedding <=> query_embedding) > match_threshold
  ORDER BY jobs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## 2. Test Function

Efter du har kørt funktionen, kan du teste den med:

```sql
-- Test the function (dette vil returnere top 5 jobs baseret på similarity)
SELECT * FROM match_jobs_similarity(
  '[0.1, 0.2, 0.3, ...]'::vector(1536), -- Dette er bare et eksempel embedding
  0.5, -- threshold
  5    -- count
);
```

## 3. Verificer Setup

Tjek at:
- Vector extension er aktiveret
- Embedding index eksisterer
- Jobs har embeddings

```sql
-- Check if vector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check embedding index
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'jobs' AND indexname LIKE '%embedding%';

-- Check if jobs have embeddings
SELECT COUNT(*) as total_jobs, 
       COUNT(embedding) as jobs_with_embeddings 
FROM jobs 
WHERE deleted_at IS NULL;
```

## 4. Fejlfinding

Hvis du får fejl:

1. **Vector extension ikke aktiveret**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **Embedding index mangler**:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_jobs_embedding_vector 
   ON jobs USING ivfflat (embedding vector_cosine_ops) 
   WITH (lists = 100);
   ```

3. **Function permissions**:
   ```sql
   GRANT EXECUTE ON FUNCTION match_jobs_similarity TO anon;
   GRANT EXECUTE ON FUNCTION match_jobs_similarity TO authenticated;
   ```

Efter du har kørt denne SQL, skulle chatbot'en fungere perfekt! 🎉 