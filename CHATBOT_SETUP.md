# Chatbot Setup Guide

Denne guide forklarer hvordan du sætter chatbot-funktionaliteten op i job-dashboard projektet.

## Arkitektur

Chatbot'en følger denne arkitektur:

1. **Frontend (Next.js)**: En moderne chat UI med React Hook Form + Tailwind CSS
2. **API Route (/api/query)**: Modtager prompts og bruger OpenAI embeddings
3. **Backend Query (Supabase + pgvector)**: Cosine similarity search i job-databasen
4. **Svaropsummering**: GPT genererer svar baseret på relevante job-matches

## Setup Instruktioner

### 1. Environment Variables

Tilføj følgende environment variables til din `.env.local` fil:

```bash
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Supabase (hvis ikke allerede konfigureret)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup

Din eksisterende tabel-struktur er allerede klar med:
- Vector extension aktiveret
- `embedding` felt i jobs tabellen
- Vector index på embedding feltet
- Alle nødvendige indexes for performance

Ingen yderligere database setup er nødvendig.

### 3. Install Dependencies

```bash
npm install openai
```

### 4. Embeddings Status

Embeddings genereres automatisk under din scraping-proces, så alle jobs i databasen har embeddings. Ingen manuel embedding generation er nødvendig.

Hvis du har brug for at generere embeddings manuelt (f.eks. for ældre jobs), kan du bruge:

#### Metode 1: Via API
```bash
curl -X POST http://localhost:3000/api/generate-embeddings \
  -H "Authorization: Bearer your_secret_token" \
  -H "Content-Type: application/json"
```

#### Metode 2: Via Script
```bash
npm run generate-embeddings
```

### 5. Test Chatbot

1. Start development server: `npm run dev`
2. Åbn applikationen i browser
3. Klik på chat-ikonet i nederste venstre hjørne
4. Test med spørgsmål som:
   - "Find CFO stillinger"
   - "Interim jobs i København"
   - "Jobs med høj CFO score"
   - "Fintech stillinger"

## Komponenter

### ChatBot.tsx
Hovedkomponenten der håndterer chat UI og interaktion.

### chatStore.ts
Zustand store til at håndtere chat state og messages.

### /api/query/route.ts
API endpoint der:
1. Genererer embeddings for bruger-input
2. Søger efter lignende jobs i Supabase
3. Bruger GPT til at generere svar

### embeddingService.ts
Service til at generere embeddings for jobs.

## Features

- ✅ Moderne chat UI med Tailwind CSS
- ✅ Real-time message handling
- ✅ Loading states og error handling
- ✅ Vector similarity search
- ✅ GPT-powered responses
- ✅ Responsive design
- ✅ Keyboard navigation (Enter to send)
- ✅ Message history
- ✅ Similar jobs preview

## Troubleshooting

### Chatbot svarer ikke
- Verificer at embeddings eksisterer i databasen
- Tjek API routes fungerer
- Tjek browser console for fejl
- Verificer OpenAI API key er korrekt

### Performance issues
- Vector similarity search er optimeret med indexes
- Monitor OpenAI API usage for embedding generation
- Overvej caching af ofte brugte queries

## Sikkerhed

- Embedding generation endpoint kræver authorization
- Overvej at tilføje rate limiting
- Monitor API usage og costs
- Valider input på server-side

## Fremtidige Forbedringer

- [ ] Conversation memory
- [ ] Job recommendations
- [ ] Advanced filtering via chat
- [ ] Export chat history
- [ ] Multi-language support
- [ ] Voice input/output 