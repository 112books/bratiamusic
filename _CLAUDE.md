# _CLAUDE.md — Bratia Music

Context del projecte per a sessions de treball amb IA. Enganxa aquest fitxer al principi de cada sessió nova.

---

## URLs

|Entorn|URL|
|---|---|
|Producció|https://bratiamusic.com/|
|Staging (GitHub Pages)|https://112books.github.io/bratiamusic/ (password: Linux2026)|
|Local|http://localhost:1313/bratiamusic/|
|Repositori|https://github.com/112books/bratiamusic|
|CMS|https://bratiamusic.com/admin/|
|Admin Dashboard|https://bratiamusic.com/ca/admin/insights/ (token GoatCounter)|

---

## Stack

Hugo SSG v0.159 local / v0.124 CI · Obsidian (contingut) · VS Code (config) · GitHub + Actions · Decap CMS · sync-web.sh

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
- ⚠️ .htaccess pot no detectar-se com a canviat per rsync --checksum → Forçar: `rsync -avz -e "ssh -i ~/.ssh/bratiamusic_deploy" static/.htaccess bratiamusic@vl28359.dinaserver.com:www/`

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
CSP: connect-src inclou gc.zgo.at bratia-music.goatcounter.com api.github.com https://cms-oauth-bratia-y855.vercel.app unpkg.com

# Caché estàtica (mod_expires)
imatges/fonts: 1 any · CSS/JS: 1 mes
```

⚠️ PageSpeed mostra fals negatiu de CSP/HSTS — verificar amb: `curl -sI https://bratiamusic.com/ca/ | grep -i "strict\|csp\|content-security"`

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

|Secció|Estat|
|---|---|
|Home|✅ Hero animació logo|
|About|✅ Split imatge+text|
|The Band|✅ Fotos rodones|
|Discografia|✅ 2 discs, Spotify|
|Concerts|⚠️ Sistema pendent decisió (Google Calendar / CMS / BandsInTown)|
|Vídeos|✅ RSS YouTube → JSON|
|Galeries|✅ Google Photos automàtic|
|Contacte|✅ Email i textos editables via CMS|
|Footer|✅ Socials + legal|
|404|✅ static/404.html, detecció idioma|
|Admin index|✅ /ca/admin/|
|Admin dashboard|✅ /ca/admin/insights/|
|SEO|✅ OpenGraph + hreflang + canonical|
|Schema.org|✅ MusicGroup + MusicEvent + BreadcrumbList + WebSite|
|Legals CA/ES/EN|✅|
|Favicon|✅ SVG + PNG + ICO + apple-touch + manifest|
|Decap CMS|✅ OAuth funcional, col·leccions configurades|

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

|Original|WebP|Estalvi|
|---|---|---|
|bratia-portada-fondo.jpg (3,6MB)|.webp (190KB)|95%|
|bratia-about.jpg (742KB)|.webp (104KB)|86%|
|band/*.jpg (~70KB)|.webp (~27KB)|~62%|

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

|Mètrica|Inici sessió|Final sessió|
|---|---|---|
|Rendiment|73|**99-100**|
|Accessibilitat|93|**100**|
|Pràctiques|100|**92** *|
|SEO|100|**100**|
|LCP|20,9s|**1,1s**|
|Speed Index|3,8s|**0,9s**|

*92 Pràctiques és el màxim assolible: `unsafe-inline` requerit per Hugo/GoatCounter, Trusted Types incompatible amb l'arquitectura actual, HSTS preload opcionals.

---

## Schema.org — RESOLT (04/04/2026)

- **MusicGroup** → totes les pàgines
- **BreadcrumbList** → subpàgines
- **WebSite** + SearchAction → home
- **MusicEvent** → pàgina concerts (llegit de `data/concerts-schema.json`)

Validat a https://validator.schema.org → 0 errors, 0 advertiments

---

## 404 estàtica

`static/404.html` — fitxer estàtic pur, NO template Hugo. URLs absolutes hardcoded. Detecta idioma via `navigator.language`.

---

## Decap CMS — FUNCIONAL (05/04/2026)

### Estat: ✅ OPERATIU

URL CMS: `https://bratiamusic.com/admin/`

**Autenticació**: OAuth via GitHub  
**Servidor OAuth**: Vercel (`https://cms-oauth-bratia-y855.vercel.app`)  
**GitHub OAuth App**: Configurat a `112books/bratiamusic`  
**Callback URL**: `https://cms-oauth-bratia-y855.vercel.app/callback`

---

### Arquitectura multilingüe

**Decisió tècnica**: Col·leccions separades per idioma (NO `i18n: multiple_folders`)

**Per què**: Decap CMS construïa paths duplicats amb `i18n: multiple_folders` → `content/ca/music/ca/content/music/` (error 404)

**Solució aplicada**: Col·leccions independents:
- `music-ca` → `content/ca/music/`
- `music-es` → `content/es/music/`
- `music-en` → `content/en/music/`

**Trade-off**: Cal editar cada idioma per separat (no hi ha sincronització automàtica entre idiomes)

---

### Filtratge `_index.md`

**Problema**: Els fitxers de secció (`_index.md`) apareixien com a entrades editables al CMS

**Solució**:
1. Afegit `headless: true` al front matter de tots els `_index.md` de seccions (music, the-band, concerts)
2. Filtre al `config.yml`: `filter: { field: "headless", pattern: "^$" }`
3. **Resultat**: Només es mostren fitxers de contingut (discos, músics, concerts), NO fitxers de secció

**Ubicació fitxers modificats**:
```
content/ca/music/_index.md (headless: true)
content/ca/the-band/_index.md (headless: true)
content/ca/concerts/_index.md (headless: true)
content/es/concerts/_index.md (headless: true)
content/en/concerts/_index.md (headless: true)
```

---

### Col·leccions actives

#### **Configuració Global** (`data/`)
- **Contacte** → `data/contact.yaml`
  - Email, telèfon (opcional), textos introductòris (CA/ES/EN)
- **Xarxes Socials** → `data/social.yaml`
  - Facebook, Instagram, YouTube, Spotify, Bandcamp

#### **Pàgines fixes** (`content/{ca,es,en}/`)
- Portada (`_index.md`)
- Sobre nosaltres (`about/_index.md`)
- Contacte (`contact/_index.md`)

#### **Discografia** (`content/{ca,es,en}/music/`)
- Col·leccions: `music-ca`, `music-es`, `music-en`
- Camps: títol, any, tipus (album/single/ep), portada, enllaços streaming
- **Nota important**: Path de portada **sempre** amb barra inicial → `/images/discography/...`

#### **Músics** (`content/{ca,es,en}/the-band/`)
- Col·leccions: `the-band-ca`, `the-band-es`, `the-band-en`
- Camps: nom, rol, foto, biografia, xarxes, sponsors

#### **Concerts** (`content/{ca,es,en}/concerts/`)
- Col·leccions: `concerts-ca`, `concerts-es`, `concerts-en`
- Camps: títol, data, lloc, ciutat, contingut
- **⚠️ DECISIÓ PENDENT**: Triar sistema de gestió de concerts (veure secció dedicada)

---

### Configuració OAuth — Fitxers clau

**Vercel** (`netlify-cms-github-oauth-provider/`):
- `api/auth.js` — Endpoint OAuth
- `api/callback.js` — Callback GitHub
- `vercel.json` — Config Vercel (`"framework": null`)
- Variables d'entorn: `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`

**Decap CMS**:
- `static/cms/index.html` — NO conté Netlify Identity widget (eliminat 05/04/2026)
- `static/cms/config.yml` — Configuració completa del CMS

**CSP (`.htaccess`)**:
- `connect-src` inclou: `api.github.com`, `https://cms-oauth-bratia-y855.vercel.app`, `unpkg.com`
- `script-src` inclou: `unpkg.com`
- `frame-src` inclou: `open.spotify.com`, `www.youtube.com`, `www.youtube-nocookie.com`, `player.vimeo.com`

---

### Workflow editorial

**Estats disponibles**:
1. **Draft** (Esborrany) → No publicat, només visible al CMS
2. **In Review** (En revisió) → Pendent aprovació
3. **Ready** (Llest) → Aprovat, pendent publicació
4. **Published** (Publicat) → Commit a GitHub, visible al web

**Procés típic**:
1. Editor crea entrada (disc, músic, concert) → automàticament **Draft**
2. Editor mou a **In Review** → notifica admin
3. Admin revisa → mou a **Ready**
4. Admin publica → **Published** → commit a GitHub → deploy automàtic

---

### Problemes coneguts i solucions

#### **1. Imatge trencada a l'editor**

**Causa**: Path de portada sense barra inicial → `cover: "images/..."` (incorrecte)  
**Solució**: Sempre usar `/images/...` (amb barra inicial)  
**Com corregir**: Editar al CMS → **Portada** → **Escull una imatge diferent** → seleccionar la mateixa imatge (el CMS guarda el path correcte)

#### **2. "Carregant entrada..." infinit**

**Causa**: Front matter incomplet (camp obligatori buit) o path incorrecte  
**Solució**: Verificar que tots els camps obligatoris (`year`, `name`, `date`) tenen valor

#### **3. Entrada fantasma al llistat**

**Causa**: Fitxer `_index.md` sense `headless: true`  
**Solució**: Afegir `headless: true` al front matter del fitxer de secció

---

### Manteniment

#### **Afegir nova col·lecció**

1. Editar `static/cms/config.yml`
2. Afegir bloc a l'array `collections:`
3. Validar sintaxi: `python3 -c "import yaml; yaml.safe_load(open('static/cms/config.yml'))"`
4. Commit i push

#### **Afegir nou camp a col·lecció existent**

1. Editar `static/cms/config.yml`
2. Afegir línia a `fields:` de la col·lecció
3. Validar sintaxi
4. Commit i push
5. **Nota**: Els fitxers existents NO tindran el nou camp automàticament — cal editar-los al CMS per afegir-lo

---

## Gestió de concerts — ⚠️ DECISIÓ PENDENT

### Situació actual

Hi ha **DOS sistemes de concerts paral·lels** que poden entrar en conflicte:

#### **Sistema A: Google Calendar (automàtic)**
- **Fitxer**: `scripts/process-concerts.py`
- **Com funciona**: GitHub Actions llegeix Google Calendar API → genera `data/concerts-schema.json`
- **Avantatges**: Automàtic, font única de veritat, fàcil per no-tècnics
- **Desavantatges**: No editable des del CMS, depèn de GitHub Actions

#### **Sistema B: Decap CMS (manual)**
- **Fitxer**: `content/{ca,es,en}/concerts/*.md`
- **Com funciona**: Editors creen fitxers markdown al CMS
- **Avantatges**: Editable des del CMS, control total
- **Desavantatges**: Gestió manual, no sincronització amb Google Calendar

#### **Sistema C: BandsInTown API (extern)** — NO implementat
- **Com funciona**: Integració amb API de BandsInTown
- **Avantatges**: Sincronització automàtica amb plataforma de concerts popular
- **Desavantatges**: Depèn d'API externa, menys control

---

### 📋 El grup ha de triar UN dels 3 sistemes

**Accions segons l'opció triada**:

| **Opció** | **Mantenir** | **Eliminar** | **Implementar** |
|-----------|-------------|-------------|----------------|
| **1. Google Calendar** | `scripts/process-concerts.py`, GitHub Action | Col·lecció `concerts-*` del CMS | — |
| **2. Decap CMS** | Col·lecció `concerts-*` del CMS | `scripts/process-concerts.py`, GitHub Action | — |
| **3. BandsInTown** | — | `scripts/process-concerts.py`, col·lecció CMS | API BandsInTown, nou script |

---

### Recomanació tècnica

**Si teniu Google Calendar actiu amb concerts** → **Opció 1** (Google Calendar)  
**Si NO useu Google Calendar** → **Opció 2** (Decap CMS)  
**Si voleu màxima visibilitat i sincronització amb tiquets** → **Opció 3** (BandsInTown)

**Criteris de decisió**:
- Freqüència de concerts → Molts concerts = Google Calendar o BandsInTown
- Control sobre presentació → Més control = Decap CMS
- Equip tècnic → Menys tècnic = Google Calendar

---

### Estat actual — Pendent decisió

**Temporalment**: Els dos sistemes (Google Calendar + CMS) coexisteixen  
**Risc**: Duplicació de concerts si es crea el mateix concert als dos llocs  
**Acció immediata**: Documentar quin sistema s'usa actualment al web (veure layouts)

**Per verificar quin sistema s'usa ara**:
```bash
# Veure si el layout de concerts usa data/concerts-schema.json (Google Calendar)
grep -r "concerts-schema" layouts/

# O si usa .Pages (fitxers markdown del CMS)
grep -r "range.*concerts" layouts/
```

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
- Decap CMS `i18n: multiple_folders` causa paths duplicats → usar col·leccions separades
- Paths de portades SEMPRE amb `/` inicial: `/images/discography/...`

---

## Fitxers clau

```
hugo.toml · config/local|staging|production/
sync-web.sh · static/.htaccess · static/404.html
static/data/analytics.json · static/js/admin-dashboard.js
data/concerts-schema.json · data/contact.yaml · data/social.yaml
scripts/process-analytics.py · scripts/process-youtube.py · scripts/process-concerts.py
layouts/_default/baseof.html · layouts/_default/index.html
layouts/partials/head.html · layouts/partials/seo.html
layouts/partials/lang-switcher.html · layouts/partials/band-member.html
layouts/shortcodes/band.html · layouts/about/single.html
layouts/contact/list.html
layouts/admin/baseof.html · layouts/admin/list.html · layouts/admin/single.html
.github/workflows/fetch-analytics.yml · fetch-videos.yml
.github/workflows/fetch-concerts.yml · fetch-galleries.yml · deploy.yml
i18n/ca.yaml · es.yaml · en.yaml
static/images/home-banner/bratia-portada-fondo.webp
static/images/bratia-about.webp · static/images/band/*.webp
static/images/logo.svg
static/cms/index.html · static/cms/config.yml
```

---

## Tasques pendents

### Completades (05/04/2026)

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
- ✅ Decap CMS OAuth funcional (Vercel)
- ✅ Filtratge `_index.md` (headless: true)
- ✅ Col·leccions separades per idioma
- ✅ Contacte i xarxes socials editables via CMS

### Prioritat crítica

- 🔴 **Decidir sistema de gestió de concerts** (Google Calendar / CMS / BandsInTown)

### Prioritat alta — Accessibilitat

- 🟡 Corregir contrast text (`#7a7670` → `#5a5650`)
- 🟡 Touch targets mòbil mínim 44×44px
- 🟡 Re-testejar PageSpeed → objectiu 100/100/100/100

### Prioritat mitjana — Funcionalitats CMS

- 🔲 Newsletter integració (Mailchimp / Brevo / Buttondown / EmailOctopus)
- 🔲 Galeries editables CMS (col·lecció `galleries`)
- 🔲 Canal YouTube editable (`data/youtube.yaml`)
- 🔲 Suport Vimeo (camp `vimeo_id`)

### Prioritat baixa — Millores futures

- 🔲 Pagefind — cercador frontend
- 🔲 Press-Book (EPK) — bio + fotos + logos
- 🔲 Rider tècnic — PDF + backline + stage plot
- 🔲 Giscus (comentaris públics via GitHub Discussions)
- 🔲 Merchandise (Bandcamp / Printful)
- 🔲 Eventbrite / Tiquets

### Manteniment

- 🔲 Manual CMS — Obsidian `.md` per editors
- 🔲 Manual "Com indexar i verificar un projecte web"
- 🔲 Verificar paths duplicats `ca/ca/`
- 🔲 GitHub branch architecture (protegir main)
- 🔲 Neteja codi redundant (un cop decidit sistema concerts)

---

## Objectiu estratègic

Plantilla reutilitzable per a músics i bandes: estàtica · ràpida · segura · editable via CMS + Markdown · multilingüe nativa · qualsevol hosting estàtic.

---

## Control de respostes Claude

Respon de forma extremadament concisa.

- No expliquis res si no ho demano
- No repeteixis el context
- Dona només la resposta operativa
- Evita llistes llargues · Evita exemples si no es demanen
- Màxim 5 línies
- Abans de proposar una solució, cerca i verifica que funciona
- NO proposis alternatives encadenades ("o millor encara...")
- Si no estàs segur, DIG-HO i para fins tenir la solució correcta
- Prefereixo esperar 5 minuts que perdre 4 hores provant coses
- Una sola solució provada, no tres solucions a mitges
- MAI inventis dades (telèfons, emails, URLs) — sempre deixa camps buits o amb placeholders òbvius

Si cal més detall, ja t'ho demanaré.