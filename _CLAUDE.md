# CLAUDE.md — Bratia Music

Context del projecte per a sessions de treball amb IA.
Enganxa aquest fitxer al principi de cada sessió nova.

---

## Què és aquest projecte

Web oficial de **Bratia Music**, banda de Balkan / Gypsy Jazz / World Music de Barcelona.
S'aprofita per desenvolupar una **plantilla model reutilitzable** per a grups musicals:
disseny independent del contingut, seccions activables/desactivables per projecte.

---

## URLs

| Entorn | URL |
|--------|-----|
| Producció | https://bratiamusic.com/ |
| Desenvolupament (GitHub Pages) | https://112books.github.io/bratiamusic/ |
| Repositori | https://github.com/112books/bratiamusic |

---

## Stack tecnològic

- **Hugo SSG** — generador estàtic, sense BBDD
- **Obsidian** — edició dels fitxers `/content` en Markdown
- **GitHub** — backup, control de versions, host dev
- **Vite** — bundler per CSS/JS
- **Script `sync-web.sh`** — sincronitza local ↔ GitHub ↔ servidor final
- **VS Code** per fitxers de configuració

---

## Estructura del projecte

```
/content/{idioma}/        ← contingut en Markdown (editable amb Obsidian)
/data/                    ← dades estructurades YAML
/layouts/                 ← templates Hugo
/static/                  ← imatges, fitxers estàtics
/i18n/                    ← traduccions
hugo.toml                 ← configuració principal
hugo.prod.toml            ← overrides per producció
```

---

## Idiomes

- **Català** (per defecte), Espanyol, Anglès
- Estructura replicada per idioma: `/content/ca/`, `/content/es/`, `/content/en/`

---

## Arquitectura: Multi-pàgina

- Home: landing immersiva (hero + section-nav)
- Cada secció: URL real `/ca/about/`, `/ca/the-band/`, `/ca/music/`, etc.

---

## Header "shrinking" ✅ IMPLEMENTAT

- **Repòs:** logo gran + nav text + selector idioma
- **En scroll (>80px):** nav compacte (52px) apareix, header desapareix
- **Nav compacte:** logo + icones SVG + tooltips + selector idioma
- **Mòbil:** hamburguesa obre `.main-nav` des de la dreta + selector idiomes al final del menú
- JS inline al `head.html`. Icones: `layouts/partials/icons/nav-icon.html`
- Lang switcher: `printf "%s%s/" $.Site.BaseURL .Lang` (no relLangURL!)
- Logo apunta a: `printf "%s%s/" .Site.BaseURL .Site.Language.Lang`

---

## Seccions del web

| Secció | Estat | Notes |
|--------|-------|-------|
| Home | ✅ | Logo intro animat (`hero-intro.js`, sessionStorage) |
| About / Qui som | ✅ | Split imatge+text. `type:about` + `layout:single` al FM |
| The Band | ⚠️ | Layout fet, CSS fet, imatges OK — músics no surten |
| Music / Discografia | ✅ | 2 discs. Fitxers per idioma a `content/{lang}/music/` |
| Propers Concerts | ✅ | Google Calendar via GitHub Action + fitxer local `.txt` |
| Vídeos | 🔲 | Pendent |
| Galeries | 🔲 | CSS lightbox ja fet. Pendent sistema de dades |
| Contacte / Booking | 🔲 | Pendent |
| Legal | ⚠️ | Pàgines creades però contingut a revisar |

---

## Sistema de Concerts ✅ IMPLEMENTAT

### Arquitectura
GitHub Action (cada nit a les 3:00 UTC) → descarrega `.ics` → desa a `static/data/concerts.txt` → JS llegeix fitxer local (sense CORS).

### Fitxers clau
```
layouts/concerts/list.html        ← data-ical via absURL, data-lang
static/js/concerts.js             ← parser iCal + renderitzat
static/data/concerts.txt          ← feed iCal descarregat per GitHub Action
.github/workflows/fetch-concerts.yml ← Action nocturn
content/ca/concerts/_index.md     ← type: concerts, layout: list
content/es/concerts/_index.md
content/en/concerts/_index.md
```

### hugo.toml — paràmetres
```toml
[params]
google_calendar_ical = "https://calendar.google.com/calendar/ical/7713a217c6e9631a76ac934719903101dbbc9550c23cfb6dc082c9114d8bf981%40group.calendar.google.com/public/basic.ics"
```

### Notes importants
- La URL iCal al `hugo.toml` ja NO s'usa per fetch (era problema CORS)
- El JS llegeix `data-ical` que el layout genera amb `absURL` → URL correcta per cada entorn
- Imatge de fons: `static/images/concerts/bratia-concerts-IMG_3091.jpg`
- Imatge injectada via CSS variable `--concerts-bg` des del layout (absURL)

### Vista
- Calendari mensual (dies amb concert en cercle daurat)
- Llista `<li>` propers concerts clicable → detall a sota
- Notes musicals animades ♩♪♫♬ mentre carrega
- Concerts passats (últims 5, opacitat reduïda)
- Missatge + link newsletter si no hi ha concerts
- Mòbil: calendari flueix (no sticky), scroll suau al detall

---

## Discografia — notes importants

- Cada disc té fitxers separats per idioma: `content/ca/music/`, `content/es/music/`, `content/en/music/`
- **No usar `description:` al frontmatter** — tot el text va al cos del Markdown (permet links i format)
- El layout elimina `{{ .Params.description }}` — usa `{{ .Content }}`
- Reproductor Spotify embed: sense `loading="lazy"` per compatibilitat mòbil

---

## Arquitectura de layouts

```
layouts/
  _default/
    baseof.html     ← base. body: is-home / is-subpage
    single.html     ← pàgines genèriques
    index.html      ← home
  about/
    single.html     ← split imatge+text
  discography/
    list.html + single.html
  concerts/
    list.html       ← ✅ implementat
  the-band/
    list.html       ← ⚠️ músics no surten
  partials/
    head.html       ← header + nav compacte + JS + lang-switcher mòbil
    footer.html
    icons/nav-icon.html
    analytics/goatcounter.html
```

---

## Fitxers estàtics clau

```
static/
  css/styles.css    ← v3 reorganitzat (seccions 1-16)
  js/
    hero-intro.js   ← animació logo (sessionStorage, només home)
    track.js        ← GoatCounter events
    concerts.js     ← ✅ implementat (v3, sense proxy)
  images/
    logo.png, home-banner.jpg, bratia-about.jpg
    discography/balkan-pompe-ignition.jpg, Susurro.jpg
    sponsor/d_addario.png, broken-glasses-logo.jpg
    concerts/bratia-concerts-IMG_3091.jpg
    icons/instagram.svg, facebook.svg, web.svg
  data/
    concerts.txt    ← feed iCal (actualitzat per GitHub Action)
```

---

## Notes tècniques crítiques

- `type: about` + `layout: single` al FM → `layouts/about/single.html`
- `type: discography` + `layout: list` al `_index.md` → `layouts/discography/list.html`
- `type: concerts` + `layout: list` → `layouts/concerts/list.html`
- Lang switcher: `printf "%s%s/" $.Site.BaseURL .Lang` (NO relLangURL)
- Logo link: `printf "%s%s/" .Site.BaseURL .Site.Language.Lang`
- `body class="{{ if .IsHome }}is-home{{ else }}is-subpage{{ end }}"` — imprescindible
- Reiniciar `hugo server` en crear fitxers nous a `layouts/`
- Analytics: NOMÉS al `baseof.html` — no duplicar al footer
- Hugo v0.159 — sempre `hugo server -D --port 1313`
- `.lang-switcher--mobile { display: none; }` fora dels media queries — imprescindible

---

## Sponsors

- D'Addario (`images/sponsor/d_addario.png`)
- Broken Glasses (`images/sponsor/broken-glasses-logo.jpg`)

---

## Pendents actius (per ordre de prioritat)

### 1. The Band ⚠️
- Músics no es mostren — a investigar
- Jerarquia: **1** Ivan (destacat) + **2** Pere + Victor + **2** Julien + Stelios
- Fotos rodones. Imatges a `/static/images/`: `ivan.jpg`, `pere.jpg`, `victor.jpg`, `julien.jpg`, `stelios.jpg`
- CSS band-grid ja definit a styles.css
- Layout `layouts/the-band/list.html` existent

### 2. Vídeos 🔲
- Camps: URL (YouTube/Vimeo), títol, data, descripció

### 3. Galeries 🔲
- CSS lightbox ja fet
- Pendent: model de dades + sistema de càrrega
- Decisió pendent: imatges internes (static/) vs externes (Cloudinary, etc.)

### 4. Contacte / Booking 🔲
- Pendent disseny i implementació
- Amb imatge i copy breu sobre el tipus d'espectacle

### 5. Pipeline desplegament 🔲
- local → GitHub Pages (dev) → vhost producció (Dinahosting)
- `sync-web.sh` existent però flux no tancat

### 6. Legal ⚠️
- Pàgines creades però contingut a revisar:
  - Reflectir realitat tècnica (Google Calendar sí, Google Analytics no)
  - Explicar GoatCounter (analytics privacu-first)
  - Política de privacitat honesta i clara

### 7. SEO 🔲
- Metadades completes
- Schema markup
- Estratègia de continguts multilingüe

### 8. Accessibilitat 🔲
- ARIA labels
- Contrast validat
- Navegació assistida

### 9. Seguretat 🔲
- Headers (CSP, HSTS)
- Validació RGPD real

### 10. Pàgina 404 🔲
- Amb foto del guitarrista 😄

### 11. GoatCounter insights 🔲 (futur)
- Events: `event-spotify-click`, `event-youtube-click`, `event-booking-intent`
- Dashboard `/admin/insights/` protegit per token API

### 12. Línia del temps 🔲 (futur)
- Efemérides de la banda amb fotos, animada

---

## Objectiu estratègic

Aquest web és la base d'una **plantilla reutilitzable per a músics i bandes**, alternativa a WordPress:
- Estàtica, ràpida, segura, ecològica
- Editable via Markdown + Obsidian
- Desplegable a qualsevol hosting estàtic
- Multilingüe nativa amb Hugo i18n


- Per fer!
-- Els botons de portada que tinguin un over on es mostren les icones del menú de navegació, per donar-os un toc diferent i més entenedor.
-- Revisar l'Avis legal: lineas mes juntes i revisar el contingut, destacar que respectem privacitat i verificar que es fa servir de cookies i demés.


Aquí tens el resum de l'estat actual:
✅ Implementat i funcionant

Header shrinking (logo gran → nav compacte amb icones)
Menú hamburguesa mòbil + selector idiomes
Hero amb animació logo (sessionStorage)
About (layout split)
The Band (fotos rodones, jerarquia 1+2+2)
Discografia (2 discs, multiidioma, Spotify embed)
Concerts (Google Calendar → GitHub Action → .txt local, calendari, llista, detall)
Vídeos (RSS YouTube sense Shorts → GitHub Action → JSON, facade pattern)
Galeries (Google Photos, portades automàtiques via GitHub Action)
Contacte (immersiu amb imatge, email + xarxes socials)
Footer (legal links compactes)
Botons home amb icones + text hover
Fix clics mòbil (nav-overlay pointer-events)

⚠️ Pendent prioritari

GoatCounter estadístiques (a mitges — partial existent però events no implementats)
Legal (pàgines creades però contingut a revisar — reflectir realitat tècnica)
Pipeline desplegament a producció (Dinahosting)

🔲 Pendent futur

SEO (metadades, schema markup)
Accessibilitat (ARIA, contrast)
Seguretat (CSP, HSTS)
Pàgina 404 amb foto del guitarrista
Newsletter
Línia del temps de la banda

Per on vols començar avui?