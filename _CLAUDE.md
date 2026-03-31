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
hugo server --environment local          # desenvolupament
hugo --environment staging               # build staging
hugo --minify --environment production   # build producció
```

### sync-web.sh
- Opció 4 → Deploy GitHub Pages (staging)
- Opció 5 → Publish Dinahosting (producció) via rsync SSH

### Deploy producció — rsync SSH (configurat i funcionant)
```bash
rsync -avz --delete --ignore-errors \
  --exclude='.DS_Store' --exclude='*.map' \
  -e "ssh -i ~/.ssh/bratiamusic_deploy -o StrictHostKeyChecking=no" \
  public/ bratiamusic@vl28359.dinaserver.com:www/
```
- Clau SSH: ~/.ssh/bratiamusic_deploy
- Velocitat: ~15MB/s
- Error 23 rsync = fitxers amb caràcters especials (ignorat, no crític)

### Fitxers amb noms problemàtics (pendent renombrar)
```
static/images/home-banner/FOTO CON DISEN...
static/images/per colocar/...
```

### GitHub Actions
- deploy.yml → build staging → publica a gh-pages automàticament
- fetch-concerts.yml · fetch-galleries.yml · fetch-videos.yml → nocturns

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

### Menús per idioma
```toml
[[languages.ca.menu.main]]
  name = "Qui som"
  url  = "/ca/about/"
  weight = 1
```

### Template nav — LA CLAU
```
{{ range site.Menus.main }}   ← CORRECTE
{{ range .Site.Menus.main }}  ← INCORRECTE (sempre retorna CA)
```

### Lang-switcher — layouts/partials/lang-switcher.html
```html
<div class="lang-switcher {{ .class }}">
  {{- $currentLang := .Site.Language.Lang -}}
  {{- $baseURL := .Site.BaseURL -}}
  {{- $translations := .Translations -}}
  {{- range .Site.Languages -}}
    {{- $lang := .Lang -}}
    {{- $url := printf "%s%s/" $baseURL $lang -}}
    {{- range $translations -}}
      {{- if eq .Language.Lang $lang -}}
        {{- $url = .Permalink -}}
      {{- end -}}
    {{- end -}}
    <a href="{{ $url }}" class="{{ if eq $lang $currentLang }}active{{ end }}">
      {{ $lang | upper }}
    </a>
  {{- end -}}
</div>
```
Usa Site.BaseURL + $lang. NO usar absURL ni relLangURL en local.

### is-home — layouts/_default/baseof.html
```html
{{ $isHome := or .IsHome (eq .RelPermalink (printf "/%s/" .Language.Lang)) }}
<body class="{{ if $isHome }}is-home{{ else }}is-subpage{{ end }}">
```

---

## Header i navegació

### Dos estats
- Repòs: site-header visible → logo + main-nav amb TEXT
- En scroll >80px: nav-compact apareix → logo + icones SVG

### nav-icon.html — segments a ignorar
```
ca, es, en, bratiamusic
```

### CSS clau
```css
.nav-compact { transform: translateY(-100%); }
.nav-compact.is-visible { transform: translateY(0); }
.lang-switcher--mobile { display: none; }
```

### JS scroll (head.html)
```javascript
function updateNav() {
  const scrolled = window.scrollY > 80;
  compact.classList.toggle('is-visible', scrolled);
  header.classList.toggle('is-hidden', scrolled);
}
window.addEventListener('scroll', updateNav, { passive: true });
window.addEventListener('load', updateNav);
```

---

## Seccions del web

| Secció | Estat | Notes |
|--------|-------|-------|
| Home | OK | Hero animació logo (hero-intro.js, sessionStorage) |
| About | OK | Split imatge+text. type:about layout:single |
| The Band | OK | Fotos rodones, jerarquia 1+2+2. images/band/ |
| Discografia | OK | 2 discs multiidioma, Spotify embed |
| Concerts | OK | Google Calendar → GitHub Action → concerts.txt |
| Videos | OK | RSS YouTube → GitHub Action → JSON, facade pattern |
| Galeries | OK | Google Photos, portades via GitHub Action |
| Contacte | OK | Immersiu amb imatge, email + xarxes |
| Footer | OK | Socials + legal links compactes |
| 404 | OK | Standalone multilingüe inline |
| Admin dashboard | OK | /admin/insights/ GoatCounter 3 capes |
| SEO | OK | OpenGraph, metadades |
| Legals CA/ES/EN | OK | Avís legal, privacitat, cookies |

---

## Admin dashboard /admin/insights/

Terminal aesthetic (negre, monospace, verd). Tres capes:
- attraction_layer — visites per secció
- intention_layer — clics sortida (spotify, youtube...)
- conversion_layer — accions reals (email, booking...)

Login via token GoatCounter (sessionStorage).
Pendent: URL /admin/ hardcoded al layouts/admin/baseof.html → absURL.

---

## Notes tècniques crítiques

- Hugo v0.159 local / v0.124 CI → usar site.Data (no hugo.Data)
- Font Dancing Script: local a static/fonts/ (no Google Fonts)
- GoatCounter: bratia-music.goatcounter.com · NOMÉS al baseof.html
- Protecció GitHub Pages: JS baseof.html, hash SHA-256 (Linux2026)
- Galeries: data/galleries.yaml · Concerts: static/data/concerts.txt
- Dos servidors Hugo → errors CORS. pkill -f "hugo server" primer
- Reiniciar hugo server en crear fitxers nous a layouts/
- type: + layout: al frontmatter _index.md per activar layouts custom

---

## Fitxers clau

```
hugo.toml                         ← config principal (sense baseURL)
config/local|staging|production/  ← baseURL per entorn
sync-web.sh                       ← deploy (rsync SSH)
layouts/_default/baseof.html      ← base HTML, is-home logic
layouts/partials/head.html        ← header + nav + JS
layouts/partials/lang-switcher.html
layouts/partials/icons/nav-icon.html
layouts/admin/baseof.html · list.html · single.html
static/css/styles.css
static/fonts/DancingScript-SemiBold.woff2
static/js/hero-intro.js · track.js · concerts.js
data/galleries.yaml
i18n/ca.yaml · es.yaml · en.yaml
.github/workflows/deploy.yml
```

---

## Pendents

### Alta prioritat
- Renombrar imatges amb espais/accents a images/home-banner/ i images/per colocar/
- Admin baseof.html: /admin/ hardcoded → absURL
- Manual admin /admin/manual/ — pendent crear

### Mitjana
- GoatCounter events — verificar a producció
- Legal — contingut a revisar
- Botons portada hover amb icones

### Futur
- Pagefind (cercador)
- Accessibilitat
- Newsletter
- Línia del temps
- SEO avançat (Schema.org, hreflang)

---

## Objectiu estratègic

Plantilla reutilitzable per a músics i bandes: estàtica · ràpida · segura ·
editable via Markdown+Obsidian · multilingüe nativa · qualsevol hosting estàtic.