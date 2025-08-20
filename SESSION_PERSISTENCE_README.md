# Session Persistence Forbedringer

## Problem
Brugere blev automatisk logget ud hele tiden på grund af:
- Korte cookie lifetimes (kun 8 timer)
- Manglende automatisk session refresh
- Ingen proaktiv session fornyelse
- Manglende error handling for session udløb

## Løsninger Implementeret

### 1. Øget Cookie Lifetime
- **Før**: 8 timer
- **Efter**: 30 dage
- **Fil**: `src/lib/supabase.ts`

```typescript
cookieOptions: {
  lifetime: 60 * 60 * 24 * 30, // 30 dage
  secure: process.env.NODE_ENV === 'production'
}
```

### 2. Automatisk Session Refresh i AuthContext
- **Proaktiv refresh**: Tjekker om session udløber inden for 1 time
- **Automatisk fornyelse**: Bruger `supabase.auth.refreshSession()`
- **Periodisk check**: Hver 30. minut
- **Fil**: `src/contexts/AuthContext.tsx`

```typescript
// Tjek om session snart udløber (inden for 1 time)
const expiresAt = new Date(session.expires_at! * 1000);
const now = new Date();
const timeUntilExpiry = expiresAt.getTime() - now.getTime();
const oneHour = 60 * 60 * 1000;

if (timeUntilExpiry < oneHour) {
  const { data: refreshData } = await supabase.auth.refreshSession();
}
```

### 3. Middleware Session Refresh
- **Server-side refresh**: Middleware tjekker og fornyer session
- **Beskyttede ruter**: `/api/`, `/chat`, `/insights`, `/profile`, `/admin`
- **Fil**: `src/middleware.ts`

```typescript
// Tjek og forny session hvis nødvendigt
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  const expiresAt = new Date(session.expires_at! * 1000)
  const timeUntilExpiry = expiresAt.getTime() - now.getTime()
  
  if (timeUntilExpiry < oneHour) {
    await supabase.auth.refreshSession()
  }
}
```

### 4. Utility Funktioner
- **Session refresh**: `refreshSessionIfNeeded()`
- **Auth check**: `isUserAuthenticated()`
- **User ID**: `getCurrentUserId()`
- **Fil**: `src/lib/utils.ts`

### 5. ProtectedRoute Forbedringer
- **Session check før redirect**: Prøver at forny session før login redirect
- **Periodisk refresh**: Hver 15. minut for aktive brugere
- **Fil**: `src/components/ProtectedRoute.tsx`

## Resultater

### ✅ Forbedringer
- **Længere sessions**: 30 dage i stedet for 8 timer
- **Automatisk refresh**: Session fornyes automatisk før udløb
- **Proaktiv håndtering**: Tjekker session status regelmæssigt
- **Bedre UX**: Ingen uventet udlogning
- **Robust error handling**: Graceful fallback ved fejl

### 🔧 Tekniske Detaljer
- **Cookie security**: `secure: true` i production
- **SameSite**: `lax` for bedre kompatibilitet
- **Flow type**: `pkce` for sikkerhed
- **Auto refresh**: `autoRefreshToken: true`
- **Session persistence**: `persistSession: true`

### 📱 Platform Support
- **Browser**: Automatisk session refresh
- **Mobile**: Cookie persistence på mobile enheder
- **SSR**: Server-side session håndtering
- **API routes**: Automatisk session refresh

## Monitoring

### Console Logs
- Session refresh status
- Auth state changes
- Error handling
- Timeout warnings

### Metrics at Overvåge
- Session refresh success rate
- Auth state change frequency
- User logout patterns
- Session timeout incidents

## Troubleshooting

### Hvis Session Stadig Udløber
1. Tjek browser console for errors
2. Verificer cookie settings
3. Tjek Supabase auth logs
4. Verificer environment variables

### Debug Mode
Aktiver debug logging i `supabase.ts`:
```typescript
debug: true
```

## Fremtidige Forbedringer

### Planlagte Features
- [ ] Session analytics dashboard
- [ ] Custom refresh intervals
- [ ] Multi-device session sync
- [ ] Session health monitoring

### Performance Optimering
- [ ] Lazy loading af auth checks
- [ ] Background session refresh
- [ ] Intelligent refresh timing
- [ ] Cache optimization
