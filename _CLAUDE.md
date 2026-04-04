# _CLAUDE.md — Bratia Music
Context del projecte per a sessions de treball amb IA.
Enganxa aquest fitxer al principi de cada sessió nova.

---

## URLs

| Entorn | URL |
|--------|-----|
| Producció | https://bratiamusic.com/ |
| Staging (GitHub Pages) | https://112books.github.io/bratiamusic/ (password: Linux2026) |
| Local | http://localhost:1313/bratiamusic/ |
| Repositori | https://github.com/112books/bratiamusic |
| Admin | https://bratiamusic.com/ca/admin/ (password: Linux2026) |
| Dashboard | https://bratiamusic.com/ca/admin/insights/ (token GoatCounter) |

---

## Stack

Hugo SSG v0.159 local / v0.124 CI · Obsidian (contingut) · VS Code (config) · GitHub + Actions · sync-web.sh

---

## Entorns i desplegament

### Estructura config/ per entorns
```
config/
  local/hugo.toml       → baseURL = "http://localhost:1313/bratiamusic/"
  staging/hugo.toml     → baseURL = "https://112books.github.io/bratiamusic/"
  production/hugo.toml  → baseURL = "https://bratiamusic.com/"
```

### Comandos de build
```bash
hugo server --environment local
hugo --environment staging
hugo --minify --environment production
```

### sync-web.sh
- Opció 4 → Deploy GitHub Pages (staging)
- Opció 5 → Publish Dinahosting via rsync SSH

### Deploy producció — rsync SSH
```bash
rsync -avz --delete --ignore-errors \
  --exclude='.DS_Store' --exclude='*.map' \
  -e "ssh -i ~/.ssh/bratiamusic_deploy -o StrictHostKeyChecking=no" \
  public/ bratiamusic@vl28359.dinaserver.com:www/
```
- Clau SSH: ~/.ssh/bratiamusic_deploy
- Error 23 rsync = fitxers amb caràcters especials (ignorat)

### GitHub Actions
- deploy.yml → build staging → gh-pages automàtic
- fetch-concerts.yml · fetch-galleries.yml · fetch-videos.yml → nocturns
- fetch-analytics.yml → cada hora → static/data/analytics.json

### .htaccess
```
ErrorDocument 404 /404.html
Redirect 301 /admin/ /ca/admin/
```

---

## Multilingüe — RESOLT (31/03/2026)

### hugo.toml
```toml
defaultContentLanguage = "ca"
defaultContentLanguageInSubdir = true

[languages.ca]
  contentDir = "content/ca"
  weight = 1
[languages.es]
  contentDir = "content/es"
  weight = 2
[languages.en]
  contentDir = "content/en"
  weight = 3
```

### Template nav — LA CLAU
```
{{ range site.Menus.main }}   ← CORRECTE
{{ range .Site.Menus.main }}  ← INCORRECTE (sempre retorna CA)
```

### Lang-switcher
Usa `$.Site.BaseURL + $lang`. NO usar absURL ni relLangURL en local.

### is-home — layouts/_default/baseof.html
```html
{{ $isHome := or .IsHome (eq .RelPermalink (printf "/%s/" .Language.Lang)) }}
<body class="{{ if $isHome }}is-home{{ else }}is-subpage{{ end }}">
```

---

## Header i navegació

- Repòs: site-header → logo + main-nav amb TEXT
- Scroll >80px: nav-compact → logo + icones SVG
- nav-icon.html: segments a ignorar → ca, es, en, bratiamusic
- CSS: `.nav-compact { transform: translateY(-100%); }` · `.lang-switcher--mobile { display: none; }`

---

## Seccions del web

| Secció | Estat |
|--------|-------|
| Home | ✅ Hero animació logo |
| About | ✅ Split imatge+text |
| The Band | ✅ Fotos rodones |
| Discografia | ✅ 2 discs, Spotify |
| Concerts | ✅ Google Calendar → concerts.txt |
| Vídeos | ✅ RSS YouTube → JSON |
| Galeries | ✅ Google Photos automàtic |
| Contacte | ✅ |
| Footer | ✅ Socials + legal |
| 404 | ✅ static/404.html, detecció idioma |
| Admin index | ✅ /ca/admin/ |
| Admin dashboard | ✅ /ca/admin/insights/ |
| SEO | ✅ OpenGraph |
| Legals CA/ES/EN | ✅ |

---

## Admin dashboard

### Arquitectura
- Login via token GoatCounter (sessionStorage)
- Llegeix `static/data/analytics.json` (GitHub Action cada hora)
- JS extern: `static/js/admin-dashboard.js`
- CSS + HTML: `layouts/admin/single.html`
- Base: `layouts/admin/baseof.html`
- Contingut: `content/ca/admin/`

### Seccions
- Visites totals · Per idioma · Per secció
- Navegadors · Sistemes · Dispositius (icones proporcionals en fila + barres)
- Ubicacions · Interpretació automàtica

### CSS crític
```css
.icon-row { display:flex; flex-direction:row !important; flex-wrap:nowrap; }
.icon-item { flex-shrink:0; }
```

### GoatCounter
- Compte: bratia-music.goatcounter.com
- Secret GitHub: GOATCOUNTER_TOKEN (Read statistics)
- Script: scripts/process-analytics.py
- Endpoints: hits, browsers, systems, sizes, locations

---

## 404 estàtica

`static/404.html` — fitxer estàtic pur, NO template Hugo.
URLs absolutes hardcoded. Detecta idioma via `navigator.language`.

---

## Notes tècniques crítiques

- Hugo v0.159 local / v0.124 CI → usar `site.Data` (no `hugo.Data`)
- Font Dancing Script: local a `static/fonts/`
- GoatCounter: NOMÉS al baseof.html
- Analytics JSON: `static/data/` (no `data/` — Hugo no el serveix)
- JS complex al admin → fitxer extern `static/js/` (Hugo processa JS inline)
- Dos servidors Hugo → errors CORS. `pkill -f "hugo server"` primer

---

## Fitxers clau

```
hugo.toml · config/local|staging|production/
sync-web.sh · static/.htaccess · static/404.html
static/data/analytics.json · static/js/admin-dashboard.js
scripts/process-analytics.py
layouts/_default/baseof.html · layouts/partials/head.html
layouts/partials/lang-switcher.html · layouts/partials/icons/nav-icon.html
layouts/admin/baseof.html · layouts/admin/list.html · layouts/admin/single.html
content/ca/admin/
.github/workflows/fetch-analytics.yml · .github/workflows/deploy.yml
i18n/ca.yaml · es.yaml · en.yaml
```

---

## Tasques pendents

### Completades
- ✅ Canvi d'idiomes per entorn (31/03/2026)
- ✅ Pàgina /admin distribució client (31/03/2026)
- ✅ Dashboard estadístiques GoatCounter (31/03/2026)
- ✅ humans.txt i textos legals revisats (31/03/2026)

### En curs / Pròxima sessió
- 🔲 Favicon (logo Bratia)
- 🔲 Renombrar imatges amb espais: `images/home-banner/` i `images/per colocar/`
- 🔲 GoatCounter events al track.js — verificar a producció

### Admin — Manual d'usuari (pendent)
- 🔲 Continguts: discs, membres, galeries, vídeos, xarxes socials
- 🔲 Afegir concerts: Google Calendar i/o Bandsintown.com
- 🔲 Press Kit (text + PDF)
- 🔲 Rider tècnic (acústic / banda completa / festival)
- 🔲 Partitures

### Funcionalitats futures
- 🔲 Bandsintown.com (valorar vs Google Calendar)
- 🔲 Decap CMS (blogging — més per LinuxBCN)
- 🔲 Pagefind (cercador estàtic)
- 🔲 Accessibilitat (ARIA, contrast)
- 🔲 Newsletter
- 🔲 Línia del temps de la banda
- 🔲 SEO avançat (Schema.org MusicGroup/MusicEvent, hreflang)

---

## Objectiu estratègic

Plantilla reutilitzable per a músics i bandes: estàtica · ràpida · segura ·
editable via Markdown+Obsidian · multilingüe nativa · qualsevol hosting estàtic.


## Control de recursos claude:

Respon de forma extrema-ment concisa.

- No expliquis res si no ho demano
- No repeteixis el context
- Dona només la resposta operativa
- Evita llistes llargues
- Evita exemples si no es demanen
- Limita la resposta a màxim 5 línies

Si cal més detall, ja t’ho demanaré.