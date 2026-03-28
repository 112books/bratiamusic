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


****

Aquí tens un **mapa clar, sense maquillatge**, de les funcionalitats del web separant què està fet, què està a mitges i què encara és fum (però amb bones intencions).

---

<<<<<<< HEAD
**La recomanació clara és Multipage**, i aquí el raonament pràctic:

El problema actual no és que el model sigui dolent, sinó que el web ja **és** multipage (té `/ca/legal/...`) però el menú principal actua com si fos onepage. Això crea confusió de navigació i complica Hugo.

**Com implementar-ho bé:**

L'estructura de fitxers a Hugo quedaria així: `content/ca/_index.md` per la home (amb el hero i video), i després `content/ca/about.md`, `content/ca/the-band.md`, `content/ca/music.md`, etc. Cada idioma replica aquesta estructura sota el seu prefix. El menú al `config.toml` apunta a URLs reals en lloc d'àncores.

**La trampa de l'efecte "onepage":** si vols que la home tingui un scroll cinematogràfic entre seccions, es pot aconseguir igualment en multipage — simplement la pàgina home llista les seccions de forma visual llarga. L'usuari veu scroll, però les URL dels altres idiomes i de les galeries funcionen net. Alguns webs de grups fan servir exactament això: la home és llarga i immersiva, però `/concerts`, `/galeria`, `/contacte` son pàgines pròpies.

Vols que prepari una proposta concreta de l'estructura de fitxers Hugo per a Bratia, o prefereixes que entrem en el disseny del header primer?

---

Ben explicat i raonat. Farem el canvi a multipage però: podem aprofitar per fer a la capçalera alguna virgueria?

Jo proposo: Logo OK, però fins que no es canvia de secció (osigui a la primera pàgina quan carrega) es veu més gran (com x3, que es llegeixi bé. A la dreta part superior el selector d'idiomes com esta ara. El menú però cal baixar-lo a una nova fila, separar-la del logo i canvi d'idioma per tal de que pugui ocupar tot l'ample.

Un cop es canvia de secció o es fa escroll: * Es redueix el menú * Logo més petit (minimal) * Els textes del menú pasen a ser icones SVG elegants amb un hover. * La idea és que quedi fix a la part superior però no molesti massa.

També igual per la verió de tauletes

A la de móbil semblant, però el menú serà sempre d'hamburguesa.

Cóm o veus?

___


La proposta és molt bona i és un patró clàssic que funciona molt bé en webs de grups musicals. Es diu **"shrinking header"** o header hero → sticky compacte.

Deixa'm visualitzar-ho abans de parlar de codi:Aquí tens el mockup interactiu. Uns comentaris sobre les decisions de disseny:

**Hero inicial:** logo gran centrat visualment a l'esquerra, selector d'idiomes a la dreta, línia de separació fina, i el menú a la fila de sota ocupant tot l'ample. Funciona bé en fons obscur com el de Bratia.

**Sticky:** el logo passa a ser una capsuleta minimal, les seccions es converteixen en icones amb tooltip en hover (he triat Feather/Lucide icons que encaixen bé amb l'estètica). El canvi d'idioma queda a l'extrem dret, compacte.

**Mòbil:** sempre hamburguesa, menú en dropdown vertical amb l'idioma al final. Net i accessible.

**Una proposta addicional:** per la tauleta podríem fer una versió intermèdia: logo petit + text curt al menú (abreviatures: "Grup", "Música", "Dates", "Media", "Contacte") en lloc d'icones, que pot ser més clar en aquella mida.

Vols que avancem cap al codi Hugo real del `baseof.html` i el CSS/JS de la transició? O tens algun ajust de disseny primer?

---
# Fet amb Claude

## notes

Perfecte. Molta feina però ben definida. Anem per ordre:

**1. Header/Logo** — genero el SVG del logo a partir del PNG, faig el header en dues files (logo gran + idiomes | menú) i el comportament de scroll compacte amb icones + tooltip.

**2. Galeries** — estructura de dades en YAML + shortcode Hugo + lightbox en JS pur (sense llibreries externes).

**3. Google Calendar** — les dues vistes.

Ran a command, viewed a file

Ran a command, viewed a file

Logo elegant, traç fi, fons transparent. El convertiré a SVG vectorial i faré tot el sistema.

Ran 7 commands

Ran 7 commands

Ara tinc les coordenades exactes. El logo té **6 segments**: B, R, A, T, I, A — amb la línia del mig que talla les T i I (la barra horitzontal de la doble-T). Genero el SVG precís:

Generate precise SVG logo based on pixel analysis

Generate precise SVG logo based on pixel analysis

Ara el header complet amb les dues files, scroll compacte, icones amb tooltip, Google Calendar i galeries lightbox:

Ran 7 commands, read a file

Ran 7 commands, read a file

Tot a punt. Resum de tot el que hi ha:

---

### Header nou (dues files)

**Fila 1:** logo gran (64px, ~3× l'anterior) a l'esquerra, selector d'idioma a la dreta. **Línia fina** de separació. **Fila 2:** menú complet amb text. En mòbil la fila 2 es converteix en hamburger que llisca des de la dreta.

**En scroll** el header normal desapareix i apareix un **nav compacte** de 52px (fons fosc translúcid amb blur) amb: logo petit, icones SVG per cada secció amb tooltip en hover, i selector d'idioma.

### Logo SVG

Reconstruït vectorialment a partir de l'anàlisi de píxels del PNG original. Escala perfectament a qualsevol mida i funciona amb `currentColor` (blanc sobre fons fosc, o negre si cal).

### Google Calendar

**Dues columnes:** esquerra → llista manual d'esdeveniments (fàcil d'editar al markdown), dreta → iframe del Google Calendar en mode AGENDA (més llegible que el mode mensual), i un enllaç per obrir el calendari complet. En mòbil passa a una columna.

### Galeries amb lightbox

**`data/galleries.yaml`** — aquí defineixes les galeries: id, títol, data, foto de portada i llista de fotos. Les imatges van a `static/images/gallery/{id}/`.

Al markdown de photos uses `{{< galleries >}}` per mostrar la graella de galeries, o `{{< gallery id="live-2023" >}}` per una galeria concreta. En clicar una foto s'obre el **lightbox**: navegació amb fletxes, teclat (← →) i swipe en mòbil.

Per afegir una galeria nova, simplement afegeix un bloc al `data/galleries.yaml` i posa les imatges a la carpeta corresponent. Cap canvi de codi.


---


Bé, llavors l'idioma funciona. El problema de contingut buit deu ser una altra cosa — ho veiem quan fem el canvi d'arquitectura.

Però primer **el bug del scroll** que és ràpid:

Check scroll logic in main.js

Check scroll logic in main.js

El bug és clar. `header.offsetHeight` s'executa quan el DOM carrega i el header és transparent/absolut — retorna `0` o un valor incorrecte. Llavors `COMPACT_THRESHOLD = 0 + 60 = 60px` i el nav compacte apareix, però el header original **mai s'amaga** perquè no hi ha cap codi que l'oculti quan el compacte és visible.

El problema té dues capes: el CSS i el JS. Ho arreglo tot:

Ran 3 commands

Ran 3 commands

Ara l'arquitectura multi-pàgina. Analitzo primer l'estat actual:

Ran 2 commands

Ran 2 commands

Ara entenc el problema d'idiomes i tot l'estat. La diagnosi és clara:

**El problema dels idiomes:** el `index.html` (home) fa `GetPage "/ca/about"`, `/ca/the-band"`, etc. — però el contingut **existeix** per CA/EN/ES. El que passa és que `type: "page"` al front matter fa que Hugo no els trobi via `GetPage` en alguns casos. I el `_index.md` de la home té contingut en anglès per totes les llengues.

Ara faig tot el canvi d'arquitectura multi-pàgina d'un sol cop:

Ran 8 commands

Ran 8 commands

Tot net. Genero el ZIP:

Ran a command, read a file

Ran a command, read a file

Tot el que ha canviat:

---

**Bug scroll corregit** — el problema era que `header.offsetHeight` s'executava abans que el layout estigués pintat i retornava `0`. Ara llegeix l'alçada real amb `window.addEventListener('load', ...)`. A més, quan el nav compacte apareix, el header original rep la classe `is-hidden` i llisca cap amunt fora del viewport.

**Arquitectura multi-pàgina** — cada secció ara és una URL real:

- `/ca/about/` · `/ca/the-band/` · `/ca/next-shows/` · etc.
- La home és una landing amb hero + graella de les 7 seccions
- Navegació amb **fade suau** (CSS pur, `animation: pageFadeIn`) en cada canvi de pàgina
- El link actiu al nav es marca **server-side** des del template Hugo (sense JS), comparant `RelPermalink` amb la URL — molt més fiable

**Layouts específics per secció:**

- `layouts/the-band/list.html` → fons fosc + band-grid
- `layouts/photos/list.html` → fons fosc + shortcode galleries
- `layouts/_default/list.html` → genèric per about, contact, etc.
- `layouts/_default/single.html` → per membres individuals i pàgines legals

**Per idiomes** — amb multi-pàgina ja no hi ha el problema del `GetPage` que fallava. Cada idioma té les seves URL pròpies i Hugo les resol directament.

Bratiamusic v5 multipagina

=======
# **✅ FUNCIONALITATS IMPLEMENTADES**
>>>>>>> 76d7a7c (Sync Obsidian Vault 2026-03-27 21:32:31)

  

## **Arquitectura i base**

- Web estàtica amb Hugo
- Sistema multiidioma (ca / es / en)
- Separació clara contingut / layout / dades
- Estructura reutilitzable com a plantilla (això és clau i ja és real)

## **Navegació i UX**

- Header dinàmic “shrinking” complet
- Navegació compacta amb icones + tooltips
- Menú responsive amb hamburguesa (mòbil)
- Selector d’idioma funcional

## **Home**

- Hero amb animació (hero-intro.js)
- Control via sessionStorage (no es repeteix sempre)
- Posibilitat d'especificar imatges aleatories d'una carpeta i posar URL de vídeo a Youtube / vimeo

## **Seccions funcionals**

- About (layout personalitzat split)    
- Discografia (llistat + fitxes)
- Legal (pàgines creades)

## **Sistema tècnic intern**

- Sistema de layouts Hugo ben estructurat
- CSS centralitzat i organitzat (styles.css v3) 
- Scripts base (intro + tracking preparat)
- Script deploy (sync-web.sh) existent

> optimització de CSS i JS per posada en producció

---

# **⚠️ FUNCIONALITATS A MIG FER (JA EXISTEIX BASE PERÒ NO FUNCIONEN DEL TOT)**

  

## **The Band**

- Layout i CSS definits
- Imatges disponibles
  - especificar carpeta per imatges?


---

## **Sponsors (portada)**

Documentar com incliure més i com (per par del client)    

---

## **Pipeline de desplegament**

- Script existeix

- GitHub connectat
    
- ❌ Però:
    
    - Flux no està tancat ni automatitzat        
    - No és robust (manual-dependència alta)
- S'ha de crear 3 vies
  - local
  - Git-hub per testeig a github pages
  - Publicar a Servidor client (dinahosting)

---

## **SEO (estat actual: bàsic / insuficient)**

- Estructura preparada
    
- ❌ Falta:
    
    - Metadades completes
    - Estratègia de continguts
    - Schema markup
    - Control real d’indexació
    

---

## **Legal / privacitat**

- Pàgines creades
    
- ❌ Però:
    
    - No reflecteixen la realitat tècnica (important)
    - No expliquen correctament tracking (GoatCounter / calendar)
    - No hi ha discurs clar de privacitat

---

# **🔲 FUNCIONALITATS NO IMPLEMENTADES**

  

<<<<<<< HEAD
Penso que Obsidan no es massa necesari i es podria fer tot amb Visual ?

=======
## **Concerts (però disseny 100% fet)**

- Sistema amb Google Calendar (iCal)
- Parser JS definit
    
- Multilingüe pensat
    
- ❌ Falta:

    Disseny    

👉 Aquesta és la funcionalitat més madura “no implementada”.

---

## **Vídeos**

- ❌ No existeix
- Només definició conceptual (camps)

---

## **Galeries**

- CSS de lightbox fet
    
- ❌ Falta:
    
    - Model de dades
    - Sistema de càrrega
    - Decisió estratègica (intern vs extern)

---

## **Contacte / Booking**

- ❌ No existeix
- Tampoc estructura ni copy


---

## Linea del temps

- ❌ No existeix
- Oferir per la banda linea del temps amb posibilitat de fotos per cada efemeride
	- Animat?
	- Fotografies?
	- Pot ser mot gupo!


---

## **Analytics avançat (GoatCounter insights)**

- ❌ No implementat
    
- Només planificat:
    - events (Spotify, YouTube, booking)
    - dashboard privat

---

## **Accessibilitat**

- ❌ No treballada realment
    
- No hi ha:
    - ARIA
    - contrast validat
    - navegació assistida

---

## **Seguretat i estàndards**

- ❌ No auditat
    
- Falta:
    - headers (CSP, HSTS)
    - validació RGPD real
    - bones pràctiques modernes

---

## **Pàgina d’error (404)**

- ❌ No existeix (però gran idea amb el guitarrista 😄)
    

---

# **🧠 FUNCIONALITATS ESTRATÈGIQUES (IDEA, NO CODI)**

  

Aquestes són importants perquè defineixen el producte, però encara no són sistema:

  

## **Producte reutilitzable per músics**

- Template desacoblat (✔ base feta)
    
- ❌ Falta:
    - documentació per clients
    - sistema d’edició fàcil (.md)
    - empaquetat “vendible”

---

## **Edició per clients**

- Basat en Markdown + Obsidian
    
- ❌ Però:
    - no és usable per client mitjà
    - falta capa d’abstracció (GUI o instruccions clares)

---

## **Estratègia SEO global**

- ❌ No definida
    
- Inclou:
    
    - continguts
    - indexació
    - estructura semàntica
    - linking

---

# **📊 RESUM RÀPID (CRU)**

|**Estat**|**Quantitat**|
|---|---|
|✅ Implementat|~40%|
|⚠️ A mig fer|~20%|
|🔲 No fet|~40%|

---

# **🧭 LECTURA CRÍTICA (important)**

  

Aquest projecte:

- **Tècnicament està molt ben pensat**
- **Visualment té direcció clara**
- Però:
    - està en fase **arquitectura + esquelet**
    - encara no és un producte acabat
    - ni tampoc un producte venible

👉 El risc ara no és tècnic — és **dispersió i sobreenginyeria abans de tancar bàsics**.

---

Si vols, el següent pas lògic és:

👉 ordenar això en **roadmap executable (2-3 setmanes)** i deixar el web en estat “publicable sense vergonya”.

I aquí és on normalment es separen els projectes que es publiquen… dels que es queden eternament “gairebé”.
>>>>>>> 76d7a7c (Sync Obsidian Vault 2026-03-27 21:32:31)
