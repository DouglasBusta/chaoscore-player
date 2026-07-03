# chaoscore-player

Base installabile, portabile e pronta per il deploy del player `#chaoscore`.

Il progetto resta di tua proprieta' nella repository GitHub e puo' essere pubblicato oggi su Vercel senza dipendere in modo strutturale da Vercel. Se un giorno vuoi spostarlo su Netlify, Cloudflare Pages o un server tuo, i file restano riutilizzabili.

## Obiettivo

- sito funzionante e leggero
- repo pulita senza audio pesanti
- player modificabile via codice e via Supabase
- PWA installabile
- deploy semplice con Vercel
- dominio personalizzato collegabile dopo

## Cosa contiene la repo

- `index.html`: player principale
- `credits.html`: pagina credits
- `exclusive.html`: pagina contenuti esclusivi
- `app.js`: logica player, fallback, Supabase, access code, PWA prompt
- `page.js`: supporto semplice per pagine secondarie
- `styles.css`: UI responsive iPhone + desktop
- `data/library.js`: fallback locale di album e tracce
- `public-config.js`: configurazione pubblica leggera per URL e anon key
- `manifest.webmanifest`: metadata PWA
- `sw.js`: service worker aggiornabile senza bloccare i deploy futuri
- `supabase-schema.sql`: schema iniziale consigliato
- `.env.example`: env pubbliche richieste per Supabase

## Cosa NON contiene la repo

Per scelta architetturale, qui non devono entrare:

- file `.wav`
- file `.aiff`
- file `.flac`
- file `.mp3`
- file `.zip`
- cartelle `audio/`, `tracks/`, `downloads/`

Gli audio vanno caricati esternamente e referenziati con `audio_url` nel database oppure nel fallback locale.

## Setup locale

1. Duplica `.env.example` in `.env`.
2. Inserisci:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

3. Copia gli stessi valori anche in `public-config.js` se vuoi usare subito la base statica senza altra configurazione.

4. Installa dipendenze:

```bash
npm install
```

5. Avvia il progetto:

```bash
npm run dev
```

6. Build produzione:

```bash
npm run build
```

## Modificare il sito dal codice

Le modifiche piu' immediate si fanno qui:

- titolo album, release note e fallback cover: `data/library.js`
- tracklist fallback e ordine tracce: `data/library.js`
- testi pagine `credits.html` e `exclusive.html`
- UI player e layout: `styles.css`
- logica player, access code, fallback, pulsanti: `app.js`

## Modificare il sito da Supabase

Quando configuri Supabase, il sito prova a leggere:

- `album_settings`
- `tracks`
- `access_codes`

Se Supabase non risponde o non e' configurato, il sito non si rompe: usa il fallback locale da `data/library.js`.

### Tabelle minime

Usa `supabase-schema.sql` come base.

Tabelle previste:

- `album_settings`
  - `id`
  - `title`
  - `artist`
  - `release_note`
  - `cover_url`
  - `theme`
  - `is_private`
  - `updated_at`
- `tracks`
  - `id`
  - `track_number`
  - `title`
  - `duration`
  - `audio_url`
  - `download_url`
  - `lyrics`
  - `credits`
  - `is_active`
- `access_codes`
  - `id`
  - `code`
  - `label`
  - `is_active`
  - `created_at`

### Sicurezza minima per oggi

- non usare mai la service role key nel frontend
- usare solo la public anon key
- attivare Row Level Security
- esporre solo lettura anon per i dati strettamente necessari

Nota importante: il controllo codice accesso in frontend e' una protezione leggera, utile per oggi e per un link privato non indicizzato. Se vorrai sicurezza forte, conviene passare a una funzione server o URL firmati.

Nota pratica: in questa base il frontend legge la configurazione pubblica da `public-config.js`. Il file `.env.example` resta incluso per mantenere un naming coerente con un futuro flusso Vite o CI/CD.

## Collegare audio esterni

Per ogni traccia puoi usare `audio_url` esterno:

- Supabase Storage
- Cloudflare R2 + link pubblico o firmato
- BunnyCDN Storage
- hosting privato
- qualsiasi URL audio con CORS corretto

Se un `audio_url` manca o fallisce, il player resta stabile e mostra il fallback senza rompere il sito.

## PWA / installazione

La base include:

- `manifest.webmanifest`
- `sw.js`
- icone app
- prompt installazione quando supportato dal browser
- istruzioni iPhone via pulsante dedicato

Su iPhone la PWA si installa da Safari con “Aggiungi alla schermata Home”.
Su Android, se il browser supporta il prompt nativo, il tasto prova ad aprirlo. In alternativa mostra la guida.

## Deploy su Vercel

Questo progetto e' pronto per Vercel quando:

- hai fatto push su GitHub
- hai configurato eventualmente le env pubbliche
- `npm run build` passa senza errori

Impostazioni consigliate:

- framework preset: `Vite`
- build command: `npm run build`
- output directory: `dist`

Se non colleghi ancora Supabase, il deploy funziona comunque grazie al fallback locale.

## Collegare dominio personalizzato

1. comprare il dominio, per esempio `chaoscore.it`, `chaoscore.app`, `douglasbusta.com` o simili
2. entrare in Vercel
3. aprire il progetto
4. andare in `Settings -> Domains`
5. aggiungere il dominio
6. copiare i DNS richiesti da Vercel
7. inserirli nel pannello del registrar
8. aspettare la propagazione DNS
9. verificare che HTTPS sia attivo
10. da quel momento il sito resta modificabile facendo push su GitHub

## Flusso modifiche future

- modifichi codice o contenuti
- fai commit e push su GitHub
- Vercel ridistribuisce automaticamente
- il dominio resta lo stesso

## Access code semplice

Se `album_settings.is_private = true`, il sito mostra un box per codice accesso.

Modalita':

- con Supabase: il codice viene verificato nella tabella `access_codes`
- senza Supabase: fallback rapido locale con codice `chaoscore`

Questo ti permette di avere una prima barriera semplice anche oggi.

## Verifica prima del deploy

Controlla questi punti:

- nessun path locale tipo `/Users/...`
- nessun file audio pesante in repo
- nessun `.zip` in repo
- env pubbliche valorizzate se vuoi leggere Supabase
- `audio_url` validi se vuoi ascolto reale online
- `npm run build` senza errori

Quando questi punti sono verdi, puoi importare il progetto su Vercel.
