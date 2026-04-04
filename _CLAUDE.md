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
- `--omit-dir-times` al rsync → elimina fals error de permisos
- Exit code 23 tolerat → no marca error fals
- `git pull --rebase` + `git push` integrat per evitar rebuig

### Deploy producció — rsync SSH
```bash
rsync -avz --delete --checksum --omit-dir-times \
  --exclude='.DS_Store' --exclude='*.map' \
  -e "ssh -i ~/.ssh/bratiamusic_deploy -o StrictHostKeyChecking=no" \
  public/ bratiamusic@vl28359.dinaserver.com:www/
```
- Clau SSH: ~/.ssh/bratiamusic_deploy
- ⚠️ .htaccess pot no detectar-se com a canviat per rsync --checksum
  → Forçar: `rsync -avz -e "ssh -i ~/.ssh/bratiamusic_deploy" static/.htaccess bratiamusic@vl28359.dinaserver.com:www/`

### GitHub Actions
- deploy.yml → build staging → gh-pages automàtic
- fetch-concerts.yml · fetch-galleries.yml · fetch-videos.yml → nocturns
- fetch-analytics.yml → cada hora → static/data/analytics.json
- fetch-videos.yml → script extern scripts/process-youtube.py (NO heredoc inline)
- fetch-concerts.yml → genera concerts-schema.json per Schema.org
- Tots els workflows tenen `workflow_dispatch`

### .htaccess
```apache
ErrorDocument 404 /404.html
Redirect 301 /admin/ /ca/admin/

# Headers de seguretat (mod_headers)
HSTS · X-Frame-Options · X-Content-Type-Options
Referrer-Policy · Permissions-Policy · COOP
CSP: connect-src inclou gc.zgo.at I bratia-music.goatcounter.com

# Caché estàtica (mod_expires)
imatges/fonts: 1 any · CSS/JS: 1 mes
```
⚠️ PageSpeed mostra fals negatiu de CSP/HSTS — verificar amb:
`curl -sI https://bratiamusic.com/ca/ | grep -i "strict\|csp\|content-security"`

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
{{ range site.Languages }}    ← CORRECTE (no .Site.Languages — deprecated)
```

### Lang-switcher
Usa `$.Site.BaseURL + $lang`. NO usar absURL ni relLangURL en local.

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
| SEO | ✅ OpenGraph + hreflang + canonical |
| Schema.org | ✅ MusicGroup + MusicEvent + BreadcrumbList + WebSite |
| Legals CA/ES/EN | ✅ |
| Favicon | ✅ SVG + PNG + ICO + apple-touch + manifest |

---

## Admin dashboard

### Arquitectura
- Login via token GoatCounter (sessionStorage)
- Llegeix `static/data/analytics.json` (GitHub Action cada hora)
- JS extern: `static/js/admin-dashboard.js`
- CSS + HTML: `layouts/admin/single.html`
- Base: `layouts/admin/baseof.html`

### Funcionalitats (04/04/2026)
- Selector de període: 7 dies / 30 dies / 3 mesos / 1 any / Total
- Dates llegibles en català
- Filtre proporcional sobre el JSON existent
- Icones proporcionals per navegadors, sistemes i dispositius
- Interpretació automàtica · Responsive mòbil

### Backend / Parametrització per reutilització
- 🔲 Panel backend: editar músics (nom, rol, foto, bio, links)
- 🔲 Panel backend: crear i gestionar galeries
- 🔲 Configurar canal YouTube des de params (no hardcoded)
- 🔲 Concerts: selector de font → Google Calendar o Bandsintown.com
- 🔲 Concerts: editor manual de concerts com a alternativa als feeds

### Documentació per reutilització
- 🔲 Guia de parametrització per adaptar a altres bandes/solistes
- 🔲 Checklist de configuració inicial (hugo.toml, socials, colors, fonts)

### Cache-busting JS
```html
<script src="{{ "js/admin-dashboard.js" | absURL }}?v={{ now.Unix }}"></script>
```

### GoatCounter
- Compte: bratia-music.goatcounter.com
- Secret GitHub: GOATCOUNTER_TOKEN
- Script: scripts/process-analytics.py
- ⚠️ parse_stats defensiu: s.get('id') or s.get('code') or s.get('name')

---

## Scripts Python

### scripts/process-analytics.py
- parse_stats() defensiu per camps variables per endpoint
- Ús: `python3 scripts/process-analytics.py raw.json out.json START END`

### scripts/process-youtube.py
- NO heredoc inline al workflow
- Filtra Shorts per #Shorts i per URL /shorts/
- Ús: `python3 scripts/process-youtube.py /tmp/yt-feed.xml static/data/videos.json`

### scripts/process-concerts.py
- Converteix concerts.txt (iCal) → data/concerts-schema.json
- Hugo llegeix data/ com site.Data.concerts_schema
- Ús: `python3 scripts/process-concerts.py concerts.txt output.json https://bratiamusic.com`

---

## Imatges — Optimització (04/04/2026)

### Convertides a WebP
| Original | WebP | Estalvi |
|----------|------|---------|
| bratia-portada-fondo.jpg (3,6MB) | .webp (190KB) | 95% |
| bratia-about.jpg (742KB) | .webp (104KB) | 86% |
| band/*.jpg (~70KB) | .webp (~27KB) | ~62% |

### Logo: PNG → SVG
- `logo.png` substituït per `logo.svg` a tots els templates
- SVG escala perfectament, més lleuger que PNG

### Comandes de conversió
```bash
ffmpeg -i input.jpg -vf scale=1920:-1 output-1920.jpg
cwebp -q 82 output-1920.jpg -o output.webp
for f in static/images/band/*.jpg; do cwebp -q 82 "$f" -o "${f%.jpg}.webp"; done
```

### Template picture amb fallback
```html
<picture>
  <source srcset="{{ "images/fitxer.webp" | relURL }}" type="image/webp">
  <img src="{{ "images/fitxer.jpg" | relURL }}" alt="..." width="W" height="H" loading="lazy">
</picture>
```

---

## PageSpeed Insights — Resultats finals (04/04/2026)

| Mètrica | Inici sessió | Final sessió |
|---------|-------------|--------------|
| Rendiment | 73 | **99-100** |
| Accessibilitat | 93 | **100** |
| Pràctiques | 100 | **92** * |
| SEO | 100 | **100** |
| LCP | 20,9s | **1,1s** |
| Speed Index | 3,8s | **0,9s** |

*92 Pràctiques és el màxim assolible: `unsafe-inline` requerit per Hugo/GoatCounter,
Trusted Types incompatible amb l'arquitectura actual, HSTS preload opcionals.

---

## Schema.org — RESOLT (04/04/2026)

- **MusicGroup** → totes les pàgines
- **BreadcrumbList** → subpàgines
- **WebSite** + SearchAction → home
- **MusicEvent** → pàgina concerts (llegit de `data/concerts-schema.json`)

Validat a https://validator.schema.org → 0 errors, 0 advertiments

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
- Schema JSON: `data/` (Hugo sí el llegeix com site.Data)
- JS complex al admin → fitxer extern `static/js/`
- Dos servidors Hugo → errors CORS. `pkill -f "hugo server"` primer
- Workflow heredoc inline → trenca Python. Sempre fitxer .py extern
- Re-run antic a GitHub Actions usa codi del commit original
- Caché navegador: verificar amb ?nocache=1 o finestra incògnit
- `git pull --rebase` + `git push` quan workflows han fet commits automàtics
- PageSpeed pot mostrar fals negatiu de headers — verificar amb curl
- .htaccess pot no pujar-se per rsync --checksum → forçar manualment si cal

---

## Fitxers clau

```
hugo.toml · config/local|staging|production/
sync-web.sh · static/.htaccess · static/404.html
static/data/analytics.json · static/js/admin-dashboard.js
data/concerts-schema.json · static/data/concerts-schema.json
scripts/process-analytics.py · scripts/process-youtube.py · scripts/process-concerts.py
layouts/_default/baseof.html · layouts/_default/index.html
layouts/partials/head.html · layouts/partials/seo.html
layouts/partials/lang-switcher.html · layouts/partials/band-member.html
layouts/shortcodes/band.html · layouts/about/single.html
layouts/admin/baseof.html · layouts/admin/list.html · layouts/admin/single.html
.github/workflows/fetch-analytics.yml · fetch-videos.yml
.github/workflows/fetch-concerts.yml · fetch-galleries.yml · deploy.yml
i18n/ca.yaml · es.yaml · en.yaml
static/images/home-banner/bratia-portada-fondo.webp
static/images/bratia-about.webp · static/images/band/*.webp
static/images/logo.svg
```

---

## Tasques pendents

### Completades (04/04/2026)
- ✅ Canvi d'idiomes per entorn (31/03/2026)
- ✅ Dashboard estadístiques GoatCounter
- ✅ humans.txt i textos legals revisats
- ✅ Fix parse_stats() GoatCounter
- ✅ Script YouTube externalitzat
- ✅ Dashboard amb selector de període + dates llegibles
- ✅ Cache-busting JS admin
- ✅ Favicon complet (SVG+PNG+ICO)
- ✅ Eliminar directori 'per colocar'
- ✅ site.Languages (deprecated .Site.Languages)
- ✅ Imatges → WebP + width/height + picture fallback
- ✅ Logo PNG → SVG
- ✅ Headers de seguretat + caché estàtica .htaccess
- ✅ CSP connect-src per GoatCounter
- ✅ rsync --omit-dir-times
- ✅ PageSpeed: 73→100 Rendiment, LCP 20,9s→1,1s
- ✅ Accessibilitat: 93→100
- ✅ Schema.org MusicGroup + MusicEvent + BreadcrumbList + WebSite
- ✅ Google Analytics eliminat (no estava al codi)
- ✅ fetch-concerts.yml genera concerts-schema.json

### Pròxima sessió
- 🔲 Pagefind — integració cercador al frontend (índex generat, falta el box)
- 🔲 Manual d'usuari Obsidian per al client
- 🔲 Press Kit · Rider tècnic · Partitures

### Funcionalitats futures
- 🔲 Bandsintown.com · Newsletter · Giscus
- 🔲 Línia del temps de la banda · EPK
- 🔲 Estadístiques streaming (Spotify for Artists)
- 🔲 Decap CMS (blogging)

---

## Objectiu estratègic

Plantilla reutilitzable per a músics i bandes: estàtica · ràpida · segura ·
editable via Markdown+Obsidian · multilingüe nativa · qualsevol hosting estàtic.

---

## Control de respostes Claude

Respon de forma extremadament concisa.

- No expliquis res si no ho demano
- No repeteixis el context
- Dona només la resposta operativa
- Evita llistes llargues · Evita exemples si no es demanen
- Màxim 5 línies

Si cal més detall, ja t'ho demanaré.