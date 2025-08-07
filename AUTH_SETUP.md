# Authentication Setup Guide

Dette dokument beskriver hvordan du sætter authentication systemet op for CFO Dashboard.

## Database Setup

1. **Kør database schema**:
   ```sql
   -- Kør filen supabase/auth_schema.sql i din Supabase database
   ```

2. **Opret admin bruger**:
   ```sql
   -- Indsæt din admin email her
   INSERT INTO users (email, name, role) VALUES ('din@email.dk', 'Admin User', 'admin');
   ```

## Environment Variables

Sørg for at du har følgende environment variables i din `.env.local` fil:

```env
NEXT_PUBLIC_SUPABASE_URL=din_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=din_supabase_anon_key
```

## Supabase Konfiguration

1. **Aktiver Email Authentication** i Supabase Dashboard:
   - Gå til Authentication > Settings
   - Aktiver "Enable email confirmations"
   - Aktiver "Enable password authentication"

2. **Konfigurer Email Templates**:
   - Gå til Authentication > Email Templates
   - Tilpas "Reset password" template med dansk tekst
   - Sæt redirect URL til: `http://localhost:3000/auth/callback`
   - Tilpas "Confirm signup" template med dansk tekst
   - Sæt redirect URL til: `http://localhost:3000/auth/callback`

3. **Sæt Site URL**:
   - Gå til Authentication > Settings
   - Sæt Site URL til din applikations URL (f.eks. `http://localhost:3000`)

4. **Konfigurer Authentication Flows**:
   - Gå til Authentication > Settings
   - Aktiver "Enable email confirmations"
   - Sæt "Site URL" til: `http://localhost:3000`
   - Tilføj redirect URL: `http://localhost:3000/auth/callback`

## Funktionalitet

### For Brugere
- **Self-signup**: Brugere kan registrere sig selv via `/signup` med email og password
- **Login**: Registrerede brugere kan logge ind via `/login` med email og password
- **Beskyttet dashboard**: Kun registrerede brugere kan se job dashboard

### For Admins
- **Bruger administration**: Se alle brugere og deres roller i Supabase Dashboard
- **Database administration**: Alle admin operationer sker direkte i Supabase

## Sikkerhed

- **Row Level Security (RLS)**: Alle tabeller har RLS aktiveret
- **Role-based access**: Kun admins kan godkende anmodninger og se alle brugere
- **Password authentication**: Sikker email/password authentication
- **Session management**: Automatisk session refresh via middleware
- **Session persistence**: Sessions gemmes lokalt og fornyes automatisk

## Workflow

1. **Ny bruger registrerer sig**:
   - Går til `/signup`
   - Indtaster navn, email og password
   - Modtager bekræftelse email
   - Klikker bekræftelse link for at aktivere konto

2. **Bruger logger ind**:
   - Går til `/login`
   - Indtaster email og password
   - Logges ind direkte

3. **Password reset (hvis nødvendigt)**:
   - Bruger klikker "Glemt password?" på login side
   - Indtaster email på reset side
   - Modtager reset email
   - Klikker link og sætter nyt password

4. **Bruger får adgang**:
   - Omdirigeres til dashboard
   - Kan nu se alle job listings
   - Kan logge ud via user menu

## Troubleshooting

### Brugere kan ikke logge ind
- Tjek at brugeren er godkendt i users tabellen
- Verificer at email er korrekt stavet
- Tjek Supabase logs for fejl

### Login virker ikke
- Verificer at brugeren er oprettet i Supabase Auth
- Tjek at password er korrekt
- Verificer Site URL i Supabase settings

### Brugere kan ikke registrere sig
- Tjek at email bekræftelse er aktiveret i Supabase
- Verificer at Site URL er korrekt konfigureret
- Tjek Supabase logs for fejl

## Udvidelse

For at tilføje flere roller eller funktionalitet:

1. **Nye roller**: Tilføj til role enum i database schema
2. **Flere permissions**: Udvid RLS policies
3. **Email notifikationer**: Tilføj webhooks eller edge functions
4. **Bruger profil**: Udvid users tabellen med flere felter 