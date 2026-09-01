# Stili di sviluppo applicati — @ares/messaging

## Stile di programmazione

- JavaScript ES6+ con moduli ES (`type: "module"`)
- Codice tutto in un singolo file `index.js` (~320 righe)
- Classi con metodi async per invio/ricezione
- Polyfill della classe `File` per compatibilità Node.js
- Nessuna dipendenza runtime esterna
- Nessuna build step o compilazione

## Contratto dell'albero directory/file

```
messaging/
├── .ares/
│   ├── context/
│   │   └── it/
│   │       ├── module-goals.md
│   │       ├── applied-development-styles.md
│   │       ├── cli-overview.md
│   │       └── dependencies-overview.md
│   ├── docs/
│   │   └── protocolli_messaggistica.md
│   └── tasks/
├── index.js
├── package.json
└── README.md
```

### Generato automaticamente

- `node_modules/` (se presente)
- `.git/`
- `.gitignore`

### Manuale (scritto dall'autore)

- `index.js` — implementazione completa delle classi Channel, Message, Topic
- `.ares/docs/protocolli_messaggistica.md` — documentazione sui protocolli di messaggistica
- `.ares/context/` — contesto modulare
- `package.json`, `README.md`

## Note

- Il file `.ares/docs/protocolli_messaggistica.md` è una nota tecnica sui protocolli (WebSocket, MQTT, gRPC, NATS, ecc.) e non documenta direttamente il modulo
- La classe `Channel` è astratta: `new Channel()` lancia errore; va estesa con implementazioni concrete
- Il polyfill `FileCtor` gestisce Uint8Array, ArrayBuffer, ArrayBufferView e stringhe
