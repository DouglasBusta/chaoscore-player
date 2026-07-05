# #chaoscore Player Rebuild Plan

## Obiettivo

Rifare da zero la pagina privata #chaoscore e il player, senza rompere il resto di LOOK APP.

Il sito principale lookapp.org va bene. Il lavoro riguarda solo:
- pagina privata #chaoscore
- player album
- accesso alla pagina privata
- integrazione Busta Files senza fermare la musica

## Regola principale

Deve esistere un solo player reale.

Mini menu e mega menu non sono due player diversi:
- dockExpanded = false -> mini layout
- dockExpanded = true -> mega layout

Devono condividere:
- stesso audio
- stessa traccia
- stesso stato play/pause
- stessa progress bar
- stesso currentTime
- stesso volume
- stessa queue

## Ispirazioni

- vecchio player LOOK APP salvato in docs/rebuild-reference
- comodità Spotify
- comodità Untitled.stream
- grafica #chaoscore / LOOK APP attuale
- stile più futuristico, premium, mobile-first

## Mini menu

Deve essere leggero:
- cover/vinile piccolo
- titolo
- artista
- progress bar
- prev
- play/pause
- next

Non deve avere:
- volume
- lyrics
- funzioni extra
- doppioni

## Mega menu

Deve essere tipo Now Playing premium:
- cover grande
- titolo/artista
- progress bar grande
- controlli grandi
- volume + mute
- lyrics/status eventuale
- funzioni/nav sotto
- scroll interno se serve

## Comportamenti obbligatori

- Una traccia finita deve passare automaticamente alla successiva.
- Next passa alla traccia successiva.
- Prev stile Spotify:
  - se currentTime > soglia, torna a inizio traccia;
  - se currentTime <= soglia, torna alla traccia precedente.
- Aprire/chiudere mega menu non deve fermare la musica.
- Entrare in Busta Files non deve fermare la musica.
- Tornare a #chaoscore non deve duplicare il player.
- Su telefono il player non deve coprire l’ultima traccia.

## Accesso privato

La pagina deve verificare:
- utente loggato
- accesso #chaoscore valido
- chaos_verified true tramite Supabase RPC get_my_chaos_access

Da migliorare più avanti:
- legame account <-> chiave NFC
- guest mode
- entry gate LOOK APP

## Fasi

### Fase 0 - Branding LOOK APP

Completata come asset:
- public/brand/look-app-logo-chaos-red.png

La schermata ingresso verrà fatta più avanti.

### Fase 1 - Rebuild #chaoscore player/page

Ora:
- leggere vecchio player
- leggere pagina attuale
- creare nuova architettura pulita
- evitare patch CSS distruttive
- una sola sorgente dati tracce
- un solo audio engine

### Fase 2 - Shop NFC

Dopo il player.
