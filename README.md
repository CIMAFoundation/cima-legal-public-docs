# cima-legal-public-docs

Repository pubblico dei documenti legali canonicali consumati dalle altre applicazioni.

## Struttura

```text
legal-docs/
  manifests/latest.json
  manifests/history/
  files/
index.html
assets/
  official-docs.js
  official-docs.css
```

## Pagina pubblica GitHub Pages

La root del sito (`/`) mostra la tabella dei documenti ufficiali esposti, leggendo direttamente
`legal-docs/manifests/latest.json` (solo documenti non eliminati).

## Workflow
- Le modifiche arrivano dal publisher BE tramite branch + pull request.
- Le PR eseguono validazione schema/naming del manifest.
- Su merge in `main`, viene normalizzato il manifest e possono essere pubblicati artefatti/pagine.

## Comandi
- `npm run validate:legal-docs`
- `npm run build:manifest`
- Test pagina pubblica in locale: `python3 -m http.server 4173`
