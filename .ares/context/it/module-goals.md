# Obiettivi del modulo @ares/messaging

## Introduzione

`@ares/messaging` è un modulo aReS che implementa un **engine di messaggistica** generico. Fornisce classi per modellare messaggi, topic e canali di comunicazione, con normalizzazione di mittenti, destinatari e allegati.

## Obiettivi

- Fornire una classe `Channel` astratta come interfaccia per i canali di messaggistica
- Implementare la classe `Message` con supporto a mittente, destinatari (to/cc/bcc), titolo, corpo e allegati
- Implementare la classe `Topic` per raggruppare messaggi correlati
- Normalizzare allegati da diverse rappresentazioni (File, Uint8Array, ArrayBuffer, stringhe, oggetti plain)
- Fornire un polyfill per la classe `File` quando non disponibile nell'ambiente
- Validare e normalizzare liste di destinatari e canali
- Generare ID univoci per messaggi e topic

## Responsabilità

- Definizione delle classi `Channel`, `Message`, `Topic`
- Normalizzazione delle liste di destinatari (`normalizeRecipientList`)
- Normalizzazione del mittente con alias (`normalizeFrom`)
- Normalizzazione degli allegati da formati multipli (`normalizeAttachments`)
- Polyfill della classe `File` per ambienti Node.js
- Invio e ricezione messaggi attraverso i canali registrati

## Cosa NON fa

- Non implementa canali concreti (WebSocket, SMTP, ecc.) — la classe `Channel` è astratta
- Non fornisce persistenza dei messaggi
- Non include interfacce web o CLI
- Non gestisce autenticazione o crittografia dei messaggi
