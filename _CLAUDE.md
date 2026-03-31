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
- Opció 5 → Publish Dinahosting (producció)
- Producció: lftp via FTPS (lent) → **pendent migrar a rsync SSH**
- Credencials: `~/.bratiamusic-deploy.conf`

### SSH Dinahosting (configurat, pendent usar per rsync)
- Host: `vl28359.dinaserver.com`
- Usuari: `bratiamusic`
- Clau: `~/.ssh/bratiamusic_deploy`
- Dir web: `www/`
- Comanda: `ssh -i ~/.ssh/bratiamusic_deploy bratiamusic@vl28359.dinaserver.com`

### GitHub Actions
- `deploy.yml` → build amb `--environment staging` → publica a gh-pages
- `fetch-concerts.yml` · `fetch-galleries.yml` · `fetch-videos.yml` → accions nocturnes

---

## Multilingüe — RESOLT (31/03/2026)

### Configuració hugo.toml
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

### Estructura de contingut
```
content/
  ca/    ← català (per defecte)
  es/    ← castellà
  en/    ← anglès
```

### Menús — definits per idioma al hugo.toml
```toml
[[languages.ca.menu.main]]
  name = "Qui som"
  url  = "/ca/about/"
  weight = 1
# ... etc per ca, es, en
```

### Template nav.html — LA CLAU
```html
{{ range site.Menus.main }}   ← CORRECTE (context-aware per idioma)
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
**Nota:** Usa `$.Site.BaseURL` + `$lang` per construir URLs. NO usar `absURL` ni `relLangURL` — no respecten el baseURL en mode servidor local.

### is-home — layouts/_default/baseof.html
```html
{{ $isHome := or .IsHome (eq .RelPermalink (printf "/%s/" .Language.Lang)) }}
<body class="{{ if $isHome }}is-home{{ else }}is-subpage{{ end }}">
```
Necessari perquè amb `defaultContentLanguageInSubdir=true` el home de CA és `/ca/` i `.IsHome` retorna false.

---

## Header i navegació

### Dos estats
- **Repòs (per defecte):** `site-header` visible → logo + `main-nav` amb TEXT
- **En scroll (>80px):** `site-header` s'amaga, `nav-compact` apareix → logo + icones SVG

### Fitxers
- `layouts/partials/head.html` → header + nav + JS scroll + lang-switcher
- `layouts/partials/icons/nav-icon.html` → icones SVG per cada secció

### nav-icon.html — segments a ignorar
```
ca, es, en, bratiamusic  ← tots han d'estar a la llista de (ne . "...")
```

### CSS clau
```css
.nav-compact { transform: translateY(-100%); }        /* amagat per defecte */
.nav-compact.is-visible { transform: translateY(0); } /* visible en scroll */
.lang-switcher--mobile { display: none; }             /* fora de media queries */
```

### JS (inline al head.html)
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
| Home | ✅ | Hero animació logo (hero-intro.js, sessionStorage) |
| About | ✅ | Split imatge+text. type:about layout:single |
| The Band | ✅ | Fotos rodones, jerarquia 1+2+2. images/band/ |
| Discografia | ✅ | 2 discs multiidioma, Spotify embed |
| Concerts | ✅ | Google Calendar → GitHub Action → concerts.txt |
| Vídeos | ✅ | RSS YouTube → GitHub Action → JSON, facade pattern |
| Galeries | ✅ | Google Photos, portades automàtiques via GitHub Action |
| Contacte | ✅ | Immersiu amb imatge, email + xarxes |
| Footer | ✅ | Socials + legal links compactes |
| 404 | ✅ | Standalone multilingüe inline |
| Admin dashboard | ✅ | /admin/insights/ protegit per token API |
| SEO partial | ✅ | OpenGraph, metadades |
| Legals CA/ES/EN | ✅ | Avís legal, privacitat, cookies |

---

## Notes tècniques crítiques

- Hugo v0.159 local / v0.124 CI → usar `site.Data` (no `hugo.Data`)
- **Mai** `hugo.Data` al CI — falla amb v0.124
- Font Dancing Script: local a `static/fonts/` (no Google Fonts)
- GoatCounter: compte `bratia-music.goatcounter.com` · NOMÉS al baseof.html
- Protecció GitHub Pages: JS al baseof.html, hash SHA-256 (Linux2026)
- Galeries: `data/galleries.yaml` · Concerts: `static/data/concerts.txt`
- Dos servidors Hugo simultanis → errors CORS al calendari. `pkill -f "hugo server"` primer
- Reiniciar `hugo server` en crear fitxers nous a `layouts/`
- `type:` + `layout:` al frontmatter dels `_index.md` per activar layouts custom

---

## Fitxers clau

```
hugo.toml                              ← config principal (sense baseURL)
config/local|staging|production/       ← baseURL per entorn
sync-web.sh                            ← deploy script
layouts/_default/baseof.html           ← base HTML, is-home logic
layouts/partials/head.html             ← header + nav + JS
layouts/partials/lang-switcher.html    ← selector idioma
layouts/partials/icons/nav-icon.html   ← icones nav-compact
layouts/partials/footer.html
layouts/partials/seo.html
layouts/admin/                         ← dashboard analytics
static/css/styles.css                  ← (seccions 1-19)
static/fonts/DancingScript-SemiBold.woff2
static/js/hero-intro.js · track.js · concerts.js
data/galleries.yaml · band.yaml
i18n/ca.yaml · es.yaml · en.yaml
.github/workflows/deploy.yml           ← build staging automàtic
```

---

## Pendents actius

### Prioritat alta
- **Migrar deploy FTP → rsync SSH** (SSH ja configurat, clau instal·lada)
  ```bash
  rsync -avz --delete -e "ssh -i ~/.ssh/bratiamusic_deploy" public/ bratiamusic@vl28359.dinaserver.com:www/
  ```
- **ca/ca/ paths duplicats a producció** — artefacte del deploy FTP d'avui, verificar i netejar
- **Manual admin** `/admin/manual/` — pendent de crear

### Prioritat mitjana
- GoatCounter events — partial existent, events no verificats a producció
- Legal — contingut a revisar (reflectir GoatCounter, no Google Analytics)
- Botons portada hover amb icones de navegació

### Futur
- Pagefind (cercador estàtic)
- Accessibilitat (ARIA, contrast)
- Newsletter
- Línia del temps de la banda
- SEO avançat (Schema.org MusicGroup/MusicEvent, hreflang)

---

## Objectiu estratègic

Web base per a una **plantilla reutilitzable per a músics i bandes**:
estàtica · ràpida · segura · editable via Markdown+Obsidian · multilingüe nativa · desplegable a qualsevol hosting estàtic.