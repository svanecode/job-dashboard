# Cache System - Job Dashboard

## Oversigt

Dette projekt bruger et intelligent cache-system, der kombinerer Next.js's indbyggede caching med et custom cache-busting system. Dette sikrer, at brugere altid får den nyeste version af applikationen uden behov for hard refresh.

## Hvordan det fungerer

### 1. Cache-Busting System

- **`scripts/build-cache-buster.js`**: Genererer et unikt build ID hver gang du bygger projektet
- **`src/utils/cacheBuster.ts`**: Utility funktioner til at tilføje cache-busting til statiske filer
- **`public/build-info.json`**: Indeholder build information til debugging

### 2. Intelligente Cache-Strategier

- **API Routes**: Ingen cache (altid frisk data)
- **Statiske filer**: Lang cache (1 år) med cache-busting
- **Dynamiske sider**: Kort cache (5 minutter) med mulighed for force refresh
- **Andre sider**: Standard cache (1 time)

### 3. Middleware Integration

`src/middleware.ts` håndterer cache-headers dynamisk baseret på:
- Indholdstype (API, statisk, dynamisk)
- Build ID og cache version
- Force refresh flag

## Kommandoer

```bash
# Normal build med cache-busting
npm run build

# Kun cache-buster
npm run cache-buster

# Build med cache-buster
npm run build:cache-buster
```

## Environment Variabler

Cache-systemet bruger følgende environment variabler:

```bash
NEXT_PUBLIC_BUILD_ID=v0.2.0-1234567890-abc123
NEXT_PUBLIC_BUILD_TIME=2024-01-15T10:30:00.000Z
NEXT_PUBLIC_CACHE_VERSION=v0.2.0-1234567890-abc123
NEXT_PUBLIC_FORCE_REFRESH=true
```

## Testing

Besøg `/test-cache` for at se:
- Build information
- Cache version
- Force refresh status
- Cache-busting URLs

## Troubleshooting

### Problem: Brugere ser ikke opdateringer
**Løsning**: Kør `npm run build` for at generere nyt build ID

### Problem: For meget caching
**Løsning**: Tjek at `NEXT_PUBLIC_FORCE_REFRESH=true` er sat i `.env.local`

### Problem: Cache-busting virker ikke
**Løsning**: Verificer at `build-cache-buster.js` kører under build processet

## Fordele ved det nye system

1. **Ingen hard refresh nødvendig** - Brugere får automatisk opdateringer
2. **Bedre performance** - Statiske filer caches effektivt
3. **Konsistent opdatering** - Alle brugere får samme version
4. **Debugging** - Build information tilgængelig via headers
5. **Fleksibilitet** - Kan tvinge refresh når nødvendigt

## Migration fra gammelt system

Det gamle system med aggressive `Cache-Control` headers er fjernet fra `next.config.ts`. Cache-håndtering sker nu gennem:

- Middleware (`src/middleware.ts`)
- Cache-busting utilities (`src/utils/cacheBuster.ts`)
- Build scripts (`scripts/build-cache-buster.js`) 