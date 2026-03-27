/**
 * concerts.js — Bratia Music
 * Llegeix el feed iCal de Google Calendar via proxy allorigins.win
 * i renderitza: calendari mensual + propers concerts + concerts passats.
 *
 * Depèn de:
 *   - data-calendar="URL_ICAL"  a l'element .concerts-section
 *   - data-lang="ca|es|en"      a l'element .concerts-section
 */

(function () {
  "use strict";

  // ─── Proxy (evita CORS de Google Calendar) ───────────────────────────────
  const PROXY = "https://api.codetabs.com/v1/proxy?quest=";

  // ─── Localització ────────────────────────────────────────────────────────
  const I18N = {
    ca: {
      months: ["Gener","Febrer","Març","Abril","Maig","Juny","Juliol","Agost","Setembre","Octubre","Novembre","Desembre"],
      noUpcoming: "No hi ha propers concerts programats.",
      noPast: "Sense concerts recents.",
      tickets: "Entrades",
      moreInfo: "Més info",
    },
    es: {
      months: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
      noUpcoming: "No hay próximos conciertos programados.",
      noPast: "Sin conciertos recientes.",
      tickets: "Entradas",
      moreInfo: "Más info",
    },
    en: {
      months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
      noUpcoming: "No upcoming concerts scheduled.",
      noPast: "No recent concerts.",
      tickets: "Tickets",
      moreInfo: "More info",
    },
  };

  // ─── Inicialització ───────────────────────────────────────────────────────
  const section = document.querySelector(".concerts-section");
  if (!section) return;

  const icalUrl = section.dataset.calendar;
  const lang = section.dataset.lang || "ca";
  const t = I18N[lang] || I18N.ca;

  if (!icalUrl || icalUrl.includes("XXXX")) {
    renderError("URL del calendari no configurada. Afegeix google_calendar_ical al hugo.toml.");
    return;
  }

  // Estat del calendari visual
  let calDate = new Date();
  let allEvents = [];

  fetch(PROXY + encodeURIComponent(icalUrl))
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    })
    .then((ical) => {
      allEvents = parseICal(ical);
      renderCalendar(calDate);
      renderLists();
    })
    .catch((err) => {
      renderError("No s'ha pogut carregar el calendari. (" + err.message + ")");
    });

  // ─── Parser iCal ─────────────────────────────────────────────────────────
  function parseICal(raw) {
    const events = [];
    const blocks = raw.split("BEGIN:VEVENT");
    blocks.shift(); // descarta la capçalera

    blocks.forEach((block) => {
      const get = (key) => {
        const re = new RegExp(key + "(?:;[^:]*)?:([\\s\\S]*?)(?=\\r?\\n[A-Z])", "m");
        const m = block.match(re);
        return m ? m[1].replace(/\r?\n[ \t]/g, "").trim() : "";
      };

      const dtRaw = get("DTSTART");
      const dtEndRaw = get("DTEND");
      if (!dtRaw) return;

      events.push({
        title:    unfold(get("SUMMARY")),
        start:    parseDate(dtRaw),
        end:      parseDate(dtEndRaw),
        location: unfold(get("LOCATION")),
        desc:     unfold(get("DESCRIPTION")),
        url:      get("URL"),
      });
    });

    // Ordena per data ascendent
    events.sort((a, b) => a.start - b.start);
    return events;
  }

  function parseDate(str) {
    if (!str) return null;
    // Format: 20241231T203000Z o 20241231
    const s = str.replace(/Z$/, "");
    if (s.length === 8) {
      return new Date(
        parseInt(s.slice(0, 4)),
        parseInt(s.slice(4, 6)) - 1,
        parseInt(s.slice(6, 8))
      );
    }
    return new Date(
      parseInt(s.slice(0, 4)),
      parseInt(s.slice(4, 6)) - 1,
      parseInt(s.slice(6, 8)),
      parseInt(s.slice(9, 11) || 0),
      parseInt(s.slice(11, 13) || 0)
    );
  }

  function unfold(str) {
    return str.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";");
  }

  // ─── Calendari visual ─────────────────────────────────────────────────────
  function renderCalendar(d) {
    const grid = document.getElementById("cal-grid");
    const label = document.querySelector(".cal-month-label");
    if (!grid || !label) return;

    label.textContent = t.months[d.getMonth()] + " " + d.getFullYear();

    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0=dg
    // Converteix diumenge=0 a dilluns=0
    const startOffset = (firstDay + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Dies dels concerts aquest mes
    const eventDays = new Set(
      allEvents
        .filter((e) => e.start && e.start.getFullYear() === year && e.start.getMonth() === month)
        .map((e) => e.start.getDate())
    );

    grid.innerHTML = "";

    // Buits inicials
    for (let i = 0; i < startOffset; i++) {
      const cell = document.createElement("div");
      cell.className = "cal-cell cal-cell--empty";
      grid.appendChild(cell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("div");
      cell.className = "cal-cell";
      cell.textContent = day;

      const isToday =
        today.getDate() === day &&
        today.getMonth() === month &&
        today.getFullYear() === year;

      if (isToday) cell.classList.add("cal-cell--today");
      if (eventDays.has(day)) {
        cell.classList.add("cal-cell--event");
        cell.title = eventsOnDay(year, month, day)
          .map((e) => e.title)
          .join(" · ");
      }

      grid.appendChild(cell);
    }

    // Navegació
    document.querySelector(".cal-prev").onclick = () => {
      calDate = new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1);
      renderCalendar(calDate);
    };
    document.querySelector(".cal-next").onclick = () => {
      calDate = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1);
      renderCalendar(calDate);
    };
  }

  function eventsOnDay(year, month, day) {
    return allEvents.filter(
      (e) =>
        e.start &&
        e.start.getFullYear() === year &&
        e.start.getMonth() === month &&
        e.start.getDate() === day
    );
  }

  // ─── Llistes de concerts ──────────────────────────────────────────────────
  function renderLists() {
    const now = new Date();
    const upcoming = allEvents.filter((e) => e.start && e.start >= now);
    const past = allEvents
      .filter((e) => e.start && e.start < now)
      .slice(-5)
      .reverse();

    const upEl = document.getElementById("concerts-upcoming");
    const pastEl = document.getElementById("concerts-past");

    // Propers
    if (upEl) {
      if (upcoming.length === 0) {
        upEl.innerHTML = '<p class="concerts-empty">' + t.noUpcoming + "</p>";
      } else {
        upEl.innerHTML = upcoming.map(concertCard).join("");
      }
    }

    // Passats
    if (pastEl) {
      if (past.length === 0) {
        pastEl.innerHTML = '<p class="concerts-empty">' + t.noPast + "</p>";
      } else {
        pastEl.innerHTML = past.map((e) => concertCard(e, true)).join("");
      }
    }
  }

  function concertCard(event, isPast) {
    const dateStr = event.start
      ? event.start.toLocaleDateString(langLocale(), { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : "";
    const timeStr = event.start && event.start.getHours() > 0
      ? event.start.toLocaleTimeString(langLocale(), { hour: "2-digit", minute: "2-digit" })
      : "";

    const linkBtn = event.url
      ? `<a href="${event.url}" class="concert-link" target="_blank" rel="noopener">${t.tickets}</a>`
      : "";

    return `
      <article class="concert-item${isPast ? " concert-item--past" : ""}">
        <div class="concert-date">${dateStr}${timeStr ? " · " + timeStr : ""}</div>
        <div class="concert-info">
          <h3 class="concert-title">${event.title}</h3>
          ${event.location ? `<p class="concert-location">📍 ${event.location}</p>` : ""}
          ${event.desc ? `<p class="concert-desc">${event.desc.split("\n")[0]}</p>` : ""}
        </div>
        ${linkBtn ? `<div class="concert-actions">${linkBtn}</div>` : ""}
      </article>`;
  }

  function langLocale() {
    return { ca: "ca-ES", es: "es-ES", en: "en-GB" }[lang] || "ca-ES";
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  function renderError(msg) {
    const upEl = document.getElementById("concerts-upcoming");
    if (upEl) upEl.innerHTML = `<p class="concerts-error">⚠️ ${msg}</p>`;
  }
})();