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

## 🗄️ Trin 2: Opret Database Schema

1. Gå til **SQL Editor** i dit Supabase dashboard
2. Kopier indholdet fra `supabase/schema.sql`
3. Kør SQL scriptet for at oprette tabellen og indsætte sample data

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
| `id` | UUID | Primærnøgle (auto-genereret) |
| `title` | TEXT | Job titel |
| `company` | TEXT | Virksomhedsnavn |
| `location` | TEXT | Job lokation |
| `publication_date` | DATE | Publiceringsdato |
| `description` | TEXT | Job beskrivelse |
| `score` | INTEGER | Prioritet score (0-3) |
| `job_url` | TEXT | Link til jobopslag |
| `created_at` | TIMESTAMP | Oprettelsesdato |
| `updated_at` | TIMESTAMP | Sidste opdatering |

### Indekser

- `idx_jobs_score`: For hurtig sortering efter score
- `idx_jobs_publication_date`: For hurtig sortering efter dato
- `idx_jobs_location`: For hurtig søgning efter lokation
- `idx_jobs_company`: For hurtig søgning efter virksomhed

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