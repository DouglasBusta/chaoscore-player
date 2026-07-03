# chaoscore-player

Player statico e portabile per `#chaoscore`.

## Obiettivo

Il progetto resta di tua proprieta' e vive nella repository GitHub. Deve poter essere pubblicato gratis su Vercel oggi, ma senza dipendenze architetturali da Vercel.

Questo significa:

- sito statico puro
- nessuna funzione serverless proprietaria
- nessuna API interna Vercel necessaria al funzionamento
- deploy possibile anche su Netlify, Cloudflare Pages, GitHub Pages, hosting classico o server personale

## Struttura

- `index.html`: player principale
- `exclusive.html`: area contenuti esclusivi
- `credits.html`: pagina credits / easter egg
- `app.js`: logica player
- `data/library.js`: catalogo tracce, durate e waveform
- `assets/`: cover e immagini

## Audio

Questa repository contiene solo la base installabile del sito.

Gli audio completi dell'album non sono inclusi nella repo GitHub e verranno collegati da una sorgente esterna privata.

Il player e' gia' predisposto per accoglierli senza dipendere da Vercel o da una piattaforma specifica.

## Deploy

### Vercel

Questo progetto non richiede build.

Su Vercel basta collegare la repository e fare deploy come sito statico con:

- framework preset: `Other`
- build command: vuoto
- output directory: vuota oppure root del progetto

### Altri hosting

Puoi pubblicare gli stessi file identici anche su:

- Netlify
- Cloudflare Pages
- hosting statico tradizionale
- server personale con Nginx o Apache

In pratica basta servire il contenuto di questa cartella.

## Privacy

Il sito blocca l'indicizzazione con:

- meta robots `noindex`
- `robots.txt`

Essendo statico, chi conosce l'URL puo' comunque raggiungere i file. Se un giorno vorrai protezione forte, serviranno autenticazione o URL firmati, ma non sono necessari per la base portabile del player.
