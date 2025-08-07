# Gemte Jobs og Kommentarer Setup

Denne guide beskriver hvordan man sætter op og bruger funktionaliteten til at gemme jobs og skrive kommentarer for konsulentfirmaet.

## 🗄️ Database Setup

### 1. Kør SQL Schema

Kør følgende SQL kommandoer i din Supabase database:

```sql
-- Kør saved_jobs_schema.sql filen
-- Dette opretter tabellerne saved_jobs og job_comments
```

### 2. Tabeller

#### saved_jobs tabel
- `id`: Unikt ID for den gemte job
- `user_id`: Bruger ID (fra auth)
- `job_id`: Reference til job i jobs tabellen
- `saved_at`: Tidspunkt job blev gemt
- `notes`: Brugerens noter til jobbet
- `created_at` / `updated_at`: Timestamps

#### job_comments tabel
- `id`: Unikt ID for kommentaren
- `user_id`: Bruger ID (fra auth)
- `job_id`: Reference til job i jobs tabellen
- `comment`: Kommentar tekst
- `created_at` / `updated_at`: Timestamps

## 🚀 Funktioner

### Gem Jobs
- Klik på "Gem job" knappen i job modal
- Jobs gemmes til din personlige liste
- Duplikat jobs forhindres automatisk

### Se Gemte Jobs
- Klik på bruger menu (øverste højre hjørne)
- Vælg "Gemte jobs"
- Modal åbner med liste over alle gemte jobs

### Rediger Job Detaljer
- Vælg et job fra listen
- Rediger noter til jobbet
- Ændringer gemmes automatisk

### Kommentarer
- Tilføj kommentarer til specifikke jobs
- Se alle kommentarer fra teamet for et job
- Kommentarer er synlige for alle brugere
- Slet kommentarer du ikke længere ønsker



## 📱 UI Komponenter

### SavedJobsModal
- Split-view design med job liste og detaljer
- Responsivt design der fungerer på alle enheder
- Real-time opdateringer

### JobModal Integration
- "Gem job" knap tilføjet til job modal
- Visuel feedback når job gemmes
- Loading states og error handling

### UserMenu Integration
- "Gemte jobs" link i bruger menu
- Tæller viser antal gemte jobs

## 🔧 API Endpoints

### Saved Jobs
- `GET /api/saved-jobs` - Hent alle gemte jobs for bruger
- `POST /api/saved-jobs` - Gem et nyt job
- `PUT /api/saved-jobs/[id]` - Opdater gemt job
- `DELETE /api/saved-jobs/[id]` - Slet gemt job

### Comments
- `GET /api/job-comments?job_id=X` - Hent kommentarer for job (synlige for alle)
- `POST /api/job-comments` - Tilføj ny kommentar
- `PUT /api/job-comments/[id]` - Opdater kommentar
- `DELETE /api/job-comments/[id]` - Slet kommentar

## 🛡️ Sikkerhed

- Alle endpoints kræver authentication
- Brugere kan kun se og redigere deres egne data
- SQL injection beskyttelse via Supabase
- CSRF beskyttelse via Next.js

## 📊 Performance

- Indekser på alle nødvendige kolonner
- Pagination understøttet
- Caching via Supabase
- Optimerede queries med joins

## 🎨 Design

- Konsistent med eksisterende design system
- Glassmorphism effekter
- Smooth animations med Framer Motion
- Responsivt design
- Accessibility understøttet

## 🔄 Workflow

1. **Find job** - Søg og filtrer jobs
2. **Gem job** - Klik "Gem job" i job modal
3. **Noter** - Tilføj personlige noter
4. **Kommenter** - Del kommentarer med teamet
5. **Overvåg** - Hold øje med jobmarkedet

## 🚨 Fejlhåndtering

- Network fejl vises til brugeren
- Loading states for alle async operationer
- Graceful degradation hvis database ikke er tilgængelig
- Validation på alle inputs

## 📈 Fremtidige Forbedringer

- [ ] Export gemte jobs til CSV/PDF
- [ ] Email notifikationer for job deadlines
- [ ] Integration med kalender
- [ ] Bulk operationer (slet flere jobs)
- [ ] Avancerede filtre for gemte jobs
- [ ] Statistiker over ansøgningsproces 