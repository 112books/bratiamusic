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
- **Mòbil:** hamburguesa obre `.main-nav` des de la dreta
- JS inline al `head.html`. Icones: `layouts/partials/icons/nav-icon.html`
- Lang switcher: `printf "%s%s/" $.Site.BaseURL .Lang` (no relLangURL!)

---

## Seccions del web

| Secció | Estat | Notes |
|--------|-------|-------|
| Home | ✅ | Logo intro animat (`hero-intro.js`, sessionStorage) |
| About / Qui som | ✅ | Split imatge+text. `type:about` + `layout:single` al FM |
| The Band | ⚠️ | Músics no surten. Jerarquia 1+2+2, fotos rodones |
| Music / Discografia | ✅ | 2 discs. Carpetes `content/{lang}/music/` |
| Propers Concerts | 🔲 | Disseny complet fet — pendent implementar |
| Vídeos | 🔲 | Pendent |
| Galeries | 🔲 | CSS lightbox ja fet. Pendent sistema de dades |
| Contacte / Booking | 🔲 | Pendent |
| Legal | ✅ | Pàgines creades |

---

## Pendents actius (per ordre de prioritat)

### 1. The Band ⚠️
- Músics no es mostren
- Jerarquia: **1** Ivan (destacat) + **2** Pere + Victor + **2** Julien + Stelios
- Fotos rodones. Imatges ja a `/static/images/`: `ivan.jpg`, `pere.jpg`, `victor.jpg`, `julien.jpg`, `stelios.jpg`
- CSS band-grid ja definit a styles.css

### 2. Concerts 🔲 DISSENY FET
Veure secció completa més avall. Pendent crear fitxers.

### 3. Vídeos 🔲
- Camps: URL (YouTube/Vimeo), títol, data, descripció

### 4. Galeries 🔲
- Camps: URLs imatges, títol, autor, descripció, efecte

### 5. Contacte / Booking 🔲

### 6. Pipeline desplegament 🔲
- local → GitHub → vhost producció. `sync-web.sh` existent però flux no tancat

### 7. GoatCounter insights 🔲 (futur)
- Events: `event-spotify-click`, `event-youtube-click`, `event-booking-intent`
- Dashboard `/admin/insights/` protegit per token API
- Token: `bratiamusic.goatcounter.com` → Settings → API tokens

---

## Sistema de Concerts — disseny complet

### Arquitectura
Google Calendar (iCal públic) → fetch JS al client → renderitzat dinàmic.
Tot estàtic. Reutilitzable: canviar URL al `hugo.toml`.

### Camps extrets del iCal
| Camp | Usat per |
|------|----------|
| `SUMMARY` | Títol |
| `DTSTART` | Data/hora inici |
| `DTEND` | Data/hora fi |
| `LOCATION` | Lloc / Sala |
| `DESCRIPTION` | Info lliure |
| `URL` | Link entrades |

### Vista
- Calendari del mes actual (dies amb concert marcats en daurat)
- Llistat propers concerts (destacat)
- Concerts passats en petit (últims 5, opacitat reduïda)
- Multilingüe: ca/es/en

### Fitxers a crear
```
layouts/concerts/list.html        ← wrap amb data-calendar + data-lang
static/js/concerts.js             ← parser iCal + renderitzat (fet, llest per copiar)
content/ca/concerts/_index.md     ← type: concerts, layout: list
content/es/concerts/_index.md
content/en/concerts/_index.md
```

### hugo.toml — afegir a [params]
```toml
google_calendar_ical = "https://calendar.google.com/calendar/ical/XXXX%40group.calendar.google.com/public/basic.ics"
```
Client: Google Calendar → Configuració → Integrar el calendari → URL .ics (fer públic primer)

### Nota CORS
Google no permet fetch directe. Proxy: `allorigins.win` (dev) o GitHub Actions (producció).

### CSS (afegir a styles.css secció 9)
Ja documentat. Classes: `.cal-grid`, `.cal-cell--event` (daurat), `.cal-cell--today`,
`.concerts-list`, `.concert-item--past` (opac), `.concert-date` (daurat).

---

## Arquitectura de layouts

```
layouts/
  _default/
    baseof.html     ← base. body: is-home / is-subpage
    single.html     ← pàgines genèriques
    index.html      ← home
  about/
    single.html     ← split (type:about + layout:single al FM)
  discography/
    list.html + single.html
  concerts/
    list.html       ← 🔲 per crear
  partials/
    head.html       ← header + nav compacte + JS
    footer.html     ← net (analytics NO duplicar aquí)
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
    concerts.js     ← 🔲 per crear
  images/
    logo.png, home-banner.jpg, bratia-about.jpg
    discography/balkan-pompe-ignition.jpg, Susurro.jpg
    sponsor/d_addario.png, broken-glasses-logo.jpg
```

---

## Notes tècniques crítiques

- `type: about` + `layout: single` al FM → `layouts/about/single.html`
- `type: discography` + `layout: list` al `_index.md` → `layouts/discography/list.html`
- `type: concerts` + `layout: list` → activarà `layouts/concerts/list.html`
- Lang switcher: `printf "%s%s/" $.Site.BaseURL .Lang` (NO relLangURL)
- `body class="{{ if .IsHome }}is-home{{ else }}is-subpage{{ end }}"` — imprescindible
- Reiniciar `hugo server` en crear fitxers nous a `layouts/`
- Analytics: NOMÉS al `baseof.html` — no duplicar al footer
- Hugo v0.159 — `.Site.Languages` deprecated però funciona

---

## Sponsors

- D'Addario (`images/sponsor/d_addario.png`)
- Broken Glasses (`images/sponsor/broken-glasses-logo.jpg`)

A fer:

- Cal veure a portada els botons de la part inferior.
- Cal que tinguin un hover amb les icones del menú superior (m'agraden) i veure que faguin bé el link, ara no el fan bé
- revisar els documents legals:
    - que sigui veritat el que diu (ara no tenim google analytics, si calander)
    - insistir que intentem respectar al 100% la privacitat i explicar les dades que es recullen, com i perquè.
- El tema SEO, veure cóm fer-ho bé, per als continguts i per el web en general.
- Fer el web super-segur, super-estandard amb les normatives actuals, que es pugui gaudir en la majoria de navegadors i andràmines
- També accesible per persones amd dificutats visuals, invidents, etc.
- Pagina d'error amb la foto de cachondeo del guitarrista
- galeries, la millor forma (internes? externes?)
- Videos galeria, externs (vimeo, youtube, etc)
- Secció de contacte que amb imatge i que animi i explici breument el tipus de mísica, espectacle que ofereix.


Això és per a Cowork:

No sé massa que fas, però.. la idea que tinc està aquí, amb més coses, però la idea es podeder crar un sistema de web per a clients que un cop acabat Bratia (veurem tot el que cal desenvolupar) es pugui "revendre" a altres clients.

La idea és prescindir de WordPress o simimars per estavliar recursos (ecològics, sostenibles, més barat, segur i robust)

caldrà estudiar opcions per SEO, cóm els clients poden editar els fitxers .md per si volen fer canvis al web, etc.

anirem fent sobre la marxa però pensant que despés ha de ser un projecte que es pugui vendre solt de moment a musics i bandes.


Cal everigual limits i tal
