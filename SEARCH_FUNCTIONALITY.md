# Søgefunktionalitet på Forsiden

## Oversigt

Der er nu tilføjet et søgefelt på forsiden, der giver brugerne mulighed for at søge i jobopslag baseret på tekst.

## Funktioner

### Søgefelt
- **Placering**: Centreret på forsiden mellem statistikkerne og joblisten
- **Design**: Moderne, afrundet design med søgeikon og loading-indikator
- **Responsivt**: Tilpasser sig forskellige skærmstørrelser

### Søgefunktionalitet
- **Søgefelter**: Jobtitel, firmanavn, beskrivelse og lokation
- **Debouncing**: Søgningen køres automatisk 500ms efter sidste tastetrykning
- **Real-time**: Resultater opdateres automatisk under skrivning
- **URL-synkronisering**: Søgninger gemmes i URL'en og kan deles/bogmærkes

### Brugergrænseflade
- **Søgeikon**: Viser søgeikon eller loading-spinner under søgning
- **Ryd-knap**: X-knap til højre for at rydde søgningen
- **Søg-knap**: Tydelig blå knap til at aktivere søgningen
- **Ryd-knap**: Grå knap til at rydde søgningen (kun aktiv når der er tekst)
- **Placeholder-tekst**: "Søg i titel, firma, beskrivelse, lokation..."
- **Hjælpetekst**: Forklarer, hvad der søges i
- **Responsivt design**: Tilpasser sig alle skærmstørrelser

## Teknisk Implementering

### Komponenter
- `SearchInput.tsx` - Hovedkomponenten for søgefeltet
- Integreret i `page.tsx` på forsiden

### State Management
- Bruger `useJobStore` til at håndtere søgeparametre
- `q`-parameteren sendes gennem hele systemet
- Automatisk cache-rydning ved nye søgninger

### Backend Integration
- `BaseFilters` type inkluderer `q`-parameter
- `buildJobsQuery` funktionen implementerer ILIKE-søgning
- Supabase OR-betingelse på tværs af relevante felter (title, company, description, location)
- **Vigtigt**: Bruger `location`-feltet, ikke `region`
- **Score-filtre**: `minScore` overskrives kun når der ikke er aktive score-filtre
- **Filtre-kompatibilitet**: Alle filtre (score, lokation, dato) fungerer sammen med tekstsøgning

### URL Synkronisering
- `useUrlFilterSync` hook håndterer URL-parametre
- Søgninger gemmes i `q`-parameteren
- Browser-historik og bogmærker understøttes

## Søgefelter

Søgningen udføres på følgende felter i databasen:
- `title` - Jobtitel
- `company` - Firmanavn  
- `description` - Jobbeskrivelse
- `location` - Joblokation (ikke region)

## Performance

- **Debouncing**: Undgår unødvendige API-kald
- **Cache**: Eksisterende cache-system genbruges
- **Pagination**: Søgninger respekterer sideinddeling
- **Loading states**: Visuel feedback under søgning

## Brug

1. **Skriv** i søgefeltet
2. **Vent** 500ms (automatisk søgning)
3. **Se** resultater opdateres i realtid
4. **Ryd** søgningen med X-knappen
5. **Del** søgninger via URL

## Kompatibilitet

- Fungerer sammen med eksisterende filtre (score, lokation, dato)
- Respekterer sortering og sideinddeling
- Integreret med eksisterende state management
- Understøtter SSR og client-side navigation 