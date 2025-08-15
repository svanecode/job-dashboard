# KPMG CFO Interim Dashboard

Et moderne dashboard bygget med Next.js og Tailwind CSS til KPMG chefer, der hjælper med at finde virksomheder der har behov for CFO Interim Assistance baseret på jobopslag.

## 🎯 Formål

Dashboardet giver cheferne mulighed for at:
- Se hvilke virksomheder der akut har brug for hjælp (score 3)
- Filtrere jobopslag efter score, lokation og fritekst
- Læse opslagets detaljer uden at forlade siden
- Trykke sig videre til opslaget

## 🚀 Funktioner

### 📊 Oversigt
- **🔥 Akut behov**: Antal jobs med score 3
- **📈 Høj prioritet**: Antal jobs med score 2  
- **📋 Total jobs**: Antal jobs i alt

### 🔍 Søge og filtrering
- **Fritekst søgning** i titel, firma, beskrivelse og lokation
- **Real-time søgning** med debouncing (500ms)
- **URL-synkronisering** for delbare søgninger
- Filtrering efter lokation
- Filtrering efter score (0-3)
- Nulstil filtre funktion

### 📋 Jobtabel
- Kolonner: Score, Firma, Titel, Lokation, Dato, Link
- Sortering: score DESC, dato DESC
- Klik på række åbner detaljer
- Responsivt design

### 📝 Jobdetaljer
- Modal med fuldt jobopslag
- Knapper: "Åbn opslag", "Send til CRM", "Luk"
- Responsivt design

## 🎨 Design

- **Farver**: 
  - Grøn = Score 3 (Akut)
  - Gul = Score 2 (Høj)
  - Grå = Score 1 (Medium)
  - Rød = Score 0 (Lav)
- **Responsivt**: Fungerer på desktop og mobil
- **Moderne UI**: Brug af Tailwind CSS

## 🛠️ Teknisk Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **TypeScript**: Fuldt type-sikret
- **Mock Data**: 10 jobopslag lokalt (kan skiftes til Supabase)

## 📦 Installation

1. Klon projektet:
```bash
git clone <repository-url>
cd job-dashboard
```

2. Installer dependencies:
```bash
npm install
```

3. Start udviklingsserveren:
```bash
npm run dev
```

4. Åbn [http://localhost:3000](http://localhost:3000) i din browser

## 🗄️ Supabase Setup

For at bruge Supabase som database:

1. Følg guiden i [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
2. Opret en `.env.local` fil med dine Supabase credentials
3. Kør SQL scriptet i `supabase/schema.sql`
4. Dashboardet vil automatisk bruge Supabase i stedet for mock data

## 📁 Projektstruktur

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx           # Hovedside
│   └── globals.css        # Global styling
├── components/
│   ├── FilterBar.tsx      # Søge og filtrering
│   ├── JobModal.tsx       # Jobdetaljer modal
│   ├── JobTable.tsx       # Jobtabel
│   ├── ResultsCount.tsx   # Resultat tæller
│   ├── ScoreBadge.tsx     # Score badge komponent
│   ├── SearchInput.tsx    # Søgefelt komponent
│   └── StatsOverview.tsx  # Statistik oversigt
├── data/
│   └── mockJobs.ts        # Mock job data
├── lib/
│   └── supabase.ts        # Supabase klient
├── services/
│   └── jobService.ts      # Database service
├── store/
│   └── jobStore.ts        # Zustand store
└── types/
    └── job.ts             # TypeScript typer
```

## 🔧 Udvikling

### Tilføj nye jobs
Rediger `src/data/mockJobs.ts` og tilføj nye job objekter med følgende struktur:

```typescript
{
  id: string;
  title: string;
  company: string;
  location: string;
  publication_date: string;
  description: string;
  score: 0 | 1 | 2 | 3;
  job_url: string;
}
```

### Tilføj nye filtre
1. Opdater `JobFilters` interface i `src/types/job.ts`
2. Tilføj filter logik i `src/store/jobStore.ts`
3. Opdater `FilterBar` komponenten

## 🚀 Deployment

Projektet kan deployes på Vercel, Netlify eller andre Next.js kompatible platforme:

```bash
npm run build
npm start
```

## 📝 TODO

- [x] Integrer med Supabase database
- [ ] Tilføj CRM integration
- [ ] Implementer bruger authentication
- [ ] Tilføj eksport funktionalitet
- [ ] Tilføj notifikationer
- [ ] Implementer caching
- [ ] Tilføj unit tests
- [ ] Tilføj admin panel til job management

## 🤝 Bidrag

1. Fork projektet
2. Opret en feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit dine ændringer (`git commit -m 'Add some AmazingFeature'`)
4. Push til branchen (`git push origin feature/AmazingFeature`)
5. Opret en Pull Request

## 📄 Licens

Dette projekt er lavet for KPMG og er ikke offentligt tilgængeligt.
