# cima-legal-public-docs

Repo pubblico documenti legali esposti su GitHub Pages.

## URL

- Pagina pubblica: `https://cimafoundation.github.io/cima-legal-public-docs/`
- Indice JSON: `https://cimafoundation.github.io/cima-legal-public-docs/assets/latest-index.json`
- Cartella latest: `https://cimafoundation.github.io/cima-legal-public-docs/latest/`
- Cartella legacy: `https://cimafoundation.github.io/cima-legal-public-docs/legacy/`

## Struttura attuale

```text
cima-legal-public-docs/
  assets/
    latest-index.json
    official-docs.js
    official-docs.css
  latest/
    [line]/[lang]/[doc-type].pdf
    index.html
  legacy/
    [line]/[lang]/[doc-type]_[date].pdf
    index.html
  index.html
  scripts/
    build-latest-index.mjs
    sync-pages.mjs
```

## Fonte dati pagina pubblica

Pagina legge `assets/latest-index.json`.

Ogni upload FE aggiorna:
- file in `latest/`
- file in `legacy/`
- indice `assets/latest-index.json`

## Dev locale pagina pubblica

```bash
cd /Users/deda/WebstormProjects/cima-webapp-terms/cima-legal-public-docs
python3 -m http.server 4173
```

Apri:
- `http://127.0.0.1:4173/`

## Rigenerare indice da `latest/` (backfill)

Utile se file già presenti ma indice non allineato.

```bash
cd /Users/deda/WebstormProjects/cima-webapp-terms/cima-legal-public-docs
npm run build:latest-index
```

Poi commit/push:

```bash
git add assets/latest-index.json
git commit -m "chore: rebuild latest index"
git push
```

## Troubleshooting

### File in repo ma non visibile in pagina

1. Verifica `assets/latest-index.json` contiene entry.
2. Verifica URL `publicUrl` apribile.
3. Attendi propagazione Pages/CDN (alcuni minuti).
4. Hard refresh browser.
