# cima-legal-public-docs

Repository pubblico canonico dei documenti legali usati dalle applicazioni client.

## Scopo del repository

Questo repository contiene:

- i file legali pubblici (`PDF` e relativi asset);
- il manifest pubblico `latest.json` usato dai frontend;
- una pagina GitHub Pages di sola consultazione;
- script e workflow di validazione/normalizzazione.

In produzione, i client leggono principalmente da GitHub Pages:

- `https://cimafoundation.github.io/cima-legal-public-docs/`
- `https://cimafoundation.github.io/cima-legal-public-docs/legal-docs/manifests/latest.json`

## Struttura repository

```text
cima-legal-public-docs/
  legal-docs/
    files/
      <platform>/<docType>/<lang>/...
    manifests/
      latest.json
      history/
  assets/
    official-docs.js
    official-docs.css
  index.html
  scripts/
    validate-legal-docs.mjs
    build-manifest.mjs
    sync-pages.mjs
  .github/workflows/
    validate-publication.yml
    publish-manifest.yml
```

## Modello dati (manifest)

Il file `legal-docs/manifests/latest.json` espone, per combinazione `platform/docType/lang`,
il documento corrente valido.

Campi principali di una entry:

- `id`
- `line` (facoltativo)
- `version`
- `effectiveDate`
- `sha256`
- `url`
- `downloadUrl`
- `originalFileName`
- `downloadFileName`
- `deletedAt` (presente solo in soft-delete)

### Nota su naming/path

Nel repository possono coesistere:

- struttura legacy (con sottocartelle data);
- struttura più recente con data nel nome file.

La normalizzazione del manifest garantisce comunque coerenza lato client.

## Pagina pubblica GitHub Pages

La root del sito (`/`) mostra la lista documenti ufficiali esposti, leggendo direttamente
`legal-docs/manifests/latest.json` e filtrando i documenti con `deletedAt`.

Questa pagina è pensata per consultazione pubblica (read-only), senza login o funzioni di upload.

## Workflow CI/CD

### 1) Validazione in Pull Request

Workflow: `Validate Publication` (`.github/workflows/validate-publication.yml`)

Trigger:

- PR con modifiche a `legal-docs/**`, `scripts/**`, `package.json`

Azione:

- esegue `npm ci`
- esegue `npm run validate:legal-docs`

Obiettivo:

- bloccare PR con struttura o contenuti non validi.

### 2) Pubblicazione/normalizzazione su main

Workflow: `Publish Manifest` (`.github/workflows/publish-manifest.yml`)

Trigger:

- push su `main` con modifiche a `legal-docs/**`, `scripts/**`, `package.json`

Azione:

- esegue `npm ci`
- esegue `npm run build:manifest`
- se `latest.json` cambia, committa e pusha il manifest normalizzato

Obiettivo:

- mantenere `latest.json` coerente e aggiornato per i client.

## Flusso operativo tipico

1. Un publisher carica/aggiorna documenti tramite applicazione di backoffice.
2. I file vengono scritti in `legal-docs/files/...` e il manifest viene aggiornato.
3. Il push su `main` attiva `Publish Manifest`.
4. Il workflow normalizza il manifest e pubblica il commit se necessario.
5. GitHub Pages espone i dati aggiornati (con latenza fisiologica di propagazione cache/CDN).

## Comandi locali

Installazione dipendenze:

```bash
cd cima-legal-public-docs
npm ci
```

Validazione contenuti:

```bash
npm run validate:legal-docs
```

Normalizzazione/rigenerazione manifest:

```bash
npm run build:manifest
```

Test pagina pubblica in locale:

```bash
python3 -m http.server 4173
```

Aprire: `http://127.0.0.1:4173/`

## Manutenzione consigliata

- Verificare periodicamente che `latest.json` punti a URL pubblici corretti.
- Mantenere il naming file consistente tra piattaforme/lingue.
- Evitare modifiche manuali non tracciate su manifest in produzione.
- Usare sempre PR con validazione CI prima del merge.

## Troubleshooting

### Il file c'è nel repo ma non si vede subito online

Comportamento atteso: può esserci latenza tra commit, workflow completato e disponibilità via Pages.

Controlli consigliati:

1. stato workflow: `https://github.com/CIMAFoundation/cima-legal-public-docs/actions`
2. presenza entry in `legal-docs/manifests/latest.json`
3. URL file pubblica raggiungibile su dominio `cimafoundation.github.io`

### Manifest non aggiornato dopo push

- Controllare log `Publish Manifest`.
- Verificare permessi `contents: write` del workflow.
- Verificare che i path modificati rientrino nel trigger del workflow.

## Note di sicurezza

- Non committare segreti o token nel repository.
- Eventuali token per automazioni devono stare in GitHub Secrets/Variables.
- I contenuti pubblicati qui sono accessibili pubblicamente via GitHub Pages.
