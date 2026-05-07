# cima-legal-public-docs

Repository pubblico canonico dei documenti legali consumati dai client.

## Contenuto

- file pubblici in `legal-docs/files/`
- manifest pubblico in `legal-docs/manifests/latest.json`
- pagina GitHub Pages read-only (`index.html` + `assets/official-docs.*`)
- script di validazione/normalizzazione

URL principali:

- `https://cimafoundation.github.io/cima-legal-public-docs/`
- `https://cimafoundation.github.io/cima-legal-public-docs/legal-docs/manifests/latest.json`

## Struttura

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
```

## Manifest `latest.json`

Per ogni combinazione `platform/docType/lang` contiene la entry corrente.

Campi usati dai client:

- `id`, `line`, `version`, `effectiveDate`
- `sha256`
- `url`, `downloadUrl`
- `originalFileName`, `downloadFileName`
- `deletedAt` (presente solo per soft delete)

`effectiveDate` resta in formato ISO (`yyyy-MM-dd`); la UI può formattarlo in `dd/MM/yyyy`.

## Flusso operativo

1. Il backoffice pubblica file + metadati su questo repo.
2. Viene aggiornato `legal-docs/manifests/latest.json`.
3. I workflow validano/normalizzano il manifest.
4. GitHub Pages espone contenuti e manifest aggiornati.

## Comandi locali

```bash
cd cima-legal-public-docs
npm ci
npm run validate:legal-docs
npm run build:manifest
```

Test pagina pubblica in locale:

```bash
python3 -m http.server 4173
```

Aprire: `http://127.0.0.1:4173/`

## Troubleshooting

### File presente nel repo ma non visibile subito

Può esserci latenza fisiologica tra commit, completion workflow e propagazione cache/CDN.

Verifiche utili:

1. `https://github.com/CIMAFoundation/cima-legal-public-docs/actions`
2. contenuto aggiornato di `legal-docs/manifests/latest.json`
3. URL file su `cimafoundation.github.io`

### Nome scaricato diverso dal nome file URL

Comportamento voluto: l'URL può avere un nome tecnico, mentre il download lato UI usa `downloadFileName`.

## Sicurezza

- Non committare token/segreti.
- Usare GitHub Secrets/Variables per automazioni.
- I contenuti di questo repo sono pubblici via GitHub Pages.