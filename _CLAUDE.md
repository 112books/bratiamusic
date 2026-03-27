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
- **VS Code** (o qualsevol editor) per fitxers de configuració

---

## Estructura del projecte

```
/content/{idioma}/        ← contingut en Markdown (editable amb Obsidian)
/data/                    ← dades estructurades YAML (galeries, discs, etc.)
/layouts/                 ← templates Hugo
/static/                  ← imatges, fitxers estàtics
/i18n/                    ← traduccions
hugo.toml                 ← configuració principal
hugo.prod.toml            ← overrides per producció
```

---

## Idiomes

- **Català** (per defecte), Espanyol, Anglès
- Estructura de contingut replicada per idioma: `/content/ca/`, `/content/es/`, `/content/en/`

---

## Arquitectura: Multi-pàgina

Decisió presa: **multipage**, no onepage.
- La home és una landing llarga i immersiva (hero + graella de seccions)
- Cada secció és una URL real: `/ca/about/`, `/ca/the-band/`, `/ca/music/`, etc.
- Navegació amb fade suau via CSS

---

## Header "shrinking"

Implementat. Comportament:
- **Estat inicial (hero):** logo gran (×3) a l'esquerra, selector d'idioma a la dreta, línia fina de separació, menú a la fila de sota ocupant tot l'ample
- **En scroll / canvi de secció:** nav compacte sticky (52px), logo minimal, ítems de menú → icones SVG amb tooltip hover, selector d'idioma compacte a la dreta
- **Mòbil:** sempre hamburguesa, menú dropdown vertical

---

## Seccions del web

| Secció | Estat |
|--------|-------|
| Home (hero + video/foto fons) | ✅ implementada |
| About | ✅ contingut ok |
| The Band (músics) | ⚠️ músics no surten |
| Music / Discografia | ⚠️ sistema de dades a mig definir |
| Propers Concerts | ⚠️ events no es mostren |
| Vídeos | ⚠️ sistema de dades pendent |
| Fotografies / Galeries | ⚠️ sistema de dades pendent |
| Booking / Contacte | 🔲 pendent plantejar |
| Legal | ✅ pàgines creades |

---

## Pendents actius (per ordre de prioritat)

### 1. The Band — músics
- Els músics no es mostren al llistat
- Jerarquia visual: **1** (Ivan, destacat) + **2** + **2**
- Fotos en format rodó

### 2. Discografia
Cada disc ha de tenir:
- Títol, imatge de portada, descripció (per idioma)
- Reproductor (URL del playlist de Spotify / plataforma)
- Referència: https://bratiamusic.com/bratia-first-album-release-digital-cd/

### 3. Propers Concerts
- Hi ha un event al YAML però no es mostra
- Cal vista de **mes per defecte** + llistat real
- Si no hi ha concerts, mostrar-ho clarament

### 4. Vídeos
Cada vídeo ha de tenir:
- URL (Vimeo o YouTube), títol, data, descripció
- Si és possible, extreure metadades automàticament de la plataforma

### 5. Galeries de fotografies
Cada galeria ha de tenir:
- URLs de les imatges (local o URL externa opcional)
- Títol, autor, descripció, efecte
- Documentació d'ús per al client

### 6. Footer
- Revisar links legals (potser redundants amb el menú)
- Afegir estadístiques estil `about.pocallum.cat`

### 7. Desplegament
- Tancar el flux: **local → GitHub (test/aprovació) → vhost producció**

---

## Decisions de disseny pendents

- Estudiar efectes per a fotos de personatges en fons
- Estudiar com emporar playlists/àlbums de Spotify i altres plataformes
- Estudiar sistema per incloure partitures
- Veure tipologies de galeries ja fetes (referents)

---

## Sponsors actuals

- D'Addario (`images/sponsor/d_addario.png`)
- Broken Glasses (`images/sponsor/broken-glasses-logo.jpg`)

---

## Notes de projecte

- Obsidian potencialment prescindible, tot es podria fer amb VS Code
- El promo banner existeix al config però està desactivat (`promo_enabled = false`)
- Logo reconstruït en SVG vectorial a partir del PNG original

- Cal tenir eines SEO, estudiar cóm implementar-les
- Revisar Cookies
    - Calen? 
    - Podem extreure dades de visites? quins? utilitat?
- Estadistiques amb goatcounter.com
    - Com posar user - pass
    - Com accedir-hi?


## per seguir

Bona observació. En un camp de front matter YAML els links en Markdown no funcionen — el YAML és només text pla.

La solució és posar la descripció llarga amb links al **cos del fitxer** (sota el `---`), no al front matter:

```markdown
---
title: "Balkan Pompe Ignition"
type_release: "album"
cover: "images/discography/balkan-pompe-ignition.jpg"
year: 2024
description: "The musical myriad of the Balkans and the energy and elegance of gypsy jazz..."
spotify_embed: "https://open.spotify.com/embed/album/50KP9q2fYisoeMWT3bsdeX?utm_source=generator&theme=0"
spotify: "https://open.spotify.com/album/50KP9q2fYisoeMWT3bsdeX"
apple_music: "https://geo.music.apple.com/es/album/balkan-pompe-ignition/1687764298"
tidal: "http://www.tidal.com/album/294727473"
deezer: "https://www.deezer.com/album/441674747"
youtube: "https://www.youtube.com/playlist?list=PLTEsU1y3xJPA38x6ZsjO7_1-nC6i_9Wfr"
amazon_music: ""
bandcamp: ""
soundcloud: ""
smartlink: "https://orcd.co/balkanpompeignition"
weight: 1
---

The musical myriad of the Balkans and the energy and elegance of gypsy jazz, brought together by the nomadism of Roma music, create an extraordinary sonic experience, a musical universe, a brotherhood. As the band's very name of Slavic origin suggests… BRATIA. When a whisper from the past shows us who we are. "Susurro Čoček" is the first single from their first album "Balkan Pompe Ignition".

Recorded at Sol de [Sants Studios](http://www.soldesants.com/), Barcelona, by Alberto Pérez. Mixed and mastered by [Yves Roussel](https://www.yvesroussel.com/mastering.php?lg=eng).
```

Al template usarem `{{ .Params.description }}` per al resum curt i `{{ .Content }}` per al text complet amb links. Té sentit?