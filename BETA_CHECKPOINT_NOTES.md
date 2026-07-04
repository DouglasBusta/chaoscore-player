# Beta checkpoint — Busta Files / #chaoscore

Data: 2026-07-04

Checkpoint:
- beta-busta-files-mobile-lossless-v1

Stato stabile:
- #chaoscore usa FLAC lossless 24-bit per le tracce.
- Busta Files ha patch mobile più compatta e più simile al desktop.
- User submissions rimane collegata.
- Save/Share rimangono attivi.
- Rimossa la spazzatura visibile tipo literal "\n" dal fondo delle pagine Busta Files.
- Le patch rotte chaos-beta-polish / chaos-single-player-visibility devono restare rimosse.
- Non toccare audio, tracklist o player senza creare un tag prima.

Bug/finishing da sistemare:
- Correggere definitivamente il concetto di player singolo.
- Deve esistere un solo audio reale: #audio.
- Non creare un secondo <audio>.
- Non creare un secondo player indipendente.
- Player grande e mini player devono essere due viste dello stesso stato, non due sistemi separati.
- Su /chaoscore deve vedersi il player grande.
- In Back to Busta Files deve vedersi il mini player persistente.
- Quando si passa da grande a mini, la traccia, il tempo, play/pause e volume devono restare sincronizzati.
- Aggiungere volume anche al player grande.
- Il volume del mini player su Mac/PC funziona, ma su telefono/iPhone lo slider non è affidabile perché Safari iOS supporta parzialmente HTMLMediaElement.volume.
- Su mobile usare mute/unmute affidabile e lasciare il volume principale ai tasti fisici del telefono.
- Non tentare fix aggressivi che nascondono section.player o rimuovono elementi audio.
- Prima di patchare i player, analizzare il DOM reale con DevTools o grep, poi modificare solo le funzioni esistenti.

Da fare domani:
- Creare area Shop/NFC.
- Pensare a pagina prodotto NFC.
- Collegare eventuale pagamento/preordine.
- Sistemare definitivamente il player unico guardando il DOM reale, non a tentativi.

Comandi rollback utili:
git checkout beta-busta-files-mobile-lossless-v1
oppure:
git reset --hard beta-busta-files-mobile-lossless-v1
