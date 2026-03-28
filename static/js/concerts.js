/**
 * concerts.js — Bratia Music v3
 * Llegeix /data/concerts.ics (fitxer local, sense CORS)
 * generat cada nit per GitHub Actions.
 */

(function () {
  "use strict";

  const I18N = {
    ca: {
      months: ["Gener","Febrer","Març","Abril","Maig","Juny","Juliol","Agost","Setembre","Octubre","Novembre","Desembre"],
      shortMonths: ["gen","feb","mar","abr","mai","jun","jul","ago","set","oct","nov","des"],
      noUpcoming: "No hi ha propers concerts programats.",
      noUpcomingNewsletter: "Subscriu-te al newsletter per rebre novetats.",
      noPast: "Sense concerts recents.",
      tickets: "Entrades",
    },
    es: {
      months: ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"],
      shortMonths: ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"],
      noUpcoming: "No hay próximos conciertos programados.",
      noUpcomingNewsletter: "Suscríbete al newsletter para recibir novedades.",
      noPast: "Sin conciertos recientes.",
      tickets: "Entradas",
    },
    en: {
      months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
      shortMonths: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      noUpcoming: "No upcoming concerts scheduled.",
      noUpcomingNewsletter: "Subscribe to our newsletter to stay updated.",
      noPast: "No recent concerts.",
      tickets: "Tickets",
    },
  };

  const section = document.querySelector(".concerts-section");
  if (!section) return;

  const lang          = section.dataset.lang || "ca";
  const newsletterUrl = section.dataset.newsletter || "#newsletter";
  const t             = I18N[lang] || I18N.ca;

  let calDate   = new Date();
  let allEvents = [];

  // Fitxer local — sense CORS, sense proxy
  fetch('/data/concerts.txt')
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.text();
    })
    .then((ical) => {
      allEvents = parseICal(ical);
      renderCalendar(calDate);
      renderUpcoming();
      renderPast();
    })
    .catch((err) => renderError(err.message));

  // ─── Parser iCal ─────────────────────────────────────────────────────────
  function parseICal(raw) {
    const events = [];
    const blocks = raw.split("BEGIN:VEVENT");
    blocks.shift();
    blocks.forEach((block) => {
      const get = (key) => {
        const re = new RegExp(key + "(?:;[^:]*)?:([\\s\\S]*?)(?=\\r?\\n[A-Z])", "m");
        const m = block.match(re);
        return m ? m[1].replace(/\r?\n[ \t]/g, "").trim() : "";
      };
      const dtRaw = get("DTSTART");
      if (!dtRaw) return;
      events.push({
        title:    unfold(get("SUMMARY")),
        start:    parseDate(dtRaw),
        end:      parseDate(get("DTEND")),
        location: unfold(get("LOCATION")),
        desc:     unfold(get("DESCRIPTION")),
        url:      get("URL"),
      });
    });
    events.sort((a, b) => a.start - b.start);
    return events;
  }

  function parseDate(str) {
    if (!str) return null;
    const s = str.replace(/Z$/, "");
    if (s.length === 8)
      return new Date(+s.slice(0,4), +s.slice(4,6)-1, +s.slice(6,8));
    return new Date(+s.slice(0,4), +s.slice(4,6)-1, +s.slice(6,8), +s.slice(9,11)||0, +s.slice(11,13)||0);
  }

  function unfold(str) {
    return str.replace(/\\n/g,"\n").replace(/\\,/g,",").replace(/\\;/g,";").replace(/<[^>]+>/g,"").trim();
  }

  // ─── Calendari ───────────────────────────────────────────────────────────
  function renderCalendar(d) {
    const grid  = document.getElementById("cal-grid");
    const label = document.querySelector(".cal-month-label");
    if (!grid || !label) return;

    const year  = d.getFullYear();
    const month = d.getMonth();
    label.textContent = t.months[month] + " " + year;

    const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const eventDays = new Set(
      allEvents
        .filter(e => e.start && e.start.getFullYear()===year && e.start.getMonth()===month)
        .map(e => e.start.getDate())
    );

    grid.innerHTML = "";
    for (let i = 0; i < startOffset; i++) {
      const c = document.createElement("div");
      c.className = "cal-cell cal-cell--empty";
      grid.appendChild(c);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const c = document.createElement("div");
      c.className = "cal-cell";
      c.textContent = day;
      if (today.getDate()===day && today.getMonth()===month && today.getFullYear()===year)
        c.classList.add("cal-cell--today");
      if (eventDays.has(day)) {
        c.classList.add("cal-cell--event");
        c.title = eventsOnDay(year, month, day).map(e => e.title).join(" · ");
        c.onclick = () => {
          const idx = allEvents.findIndex(e =>
            e.start && e.start.getFullYear()===year && e.start.getMonth()===month && e.start.getDate()===day
          );
          if (idx >= 0) selectEvent(idx);
        };
      }
      grid.appendChild(c);
    }

    document.querySelector(".cal-prev").onclick = () => {
      calDate = new Date(calDate.getFullYear(), calDate.getMonth()-1, 1);
      renderCalendar(calDate);
    };
    document.querySelector(".cal-next").onclick = () => {
      calDate = new Date(calDate.getFullYear(), calDate.getMonth()+1, 1);
      renderCalendar(calDate);
    };
  }

  function eventsOnDay(year, month, day) {
    return allEvents.filter(e =>
      e.start && e.start.getFullYear()===year && e.start.getMonth()===month && e.start.getDate()===day
    );
  }

  // ─── Llista propers concerts ──────────────────────────────────────────────
  function renderUpcoming() {
    const now     = new Date();
    const upcoming = allEvents.map((e,i) => ({e,i})).filter(({e}) => e.start && e.start >= now);
    const ul = document.getElementById("concerts-upcoming");
    if (!ul) return;

    if (upcoming.length === 0) {
      ul.innerHTML = `
        <li class="concerts-empty-msg">
          ${t.noUpcoming}<br>
          <a href="${newsletterUrl}" class="concerts-newsletter-link">${t.noUpcomingNewsletter}</a>
        </li>`;
      return;
    }

    ul.innerHTML = upcoming.map(({e, i}) => `
      <li class="concert-li" data-idx="${i}">
        <div class="concert-li-date">${shortDate(e.start)}</div>
        <div>
          <div class="concert-li-title">${e.title}</div>
          ${e.location ? `<div class="concert-li-location">${e.location}</div>` : ""}
        </div>
      </li>`).join("");

    ul.querySelectorAll(".concert-li").forEach(li => {
      li.addEventListener("click", () => selectEvent(+li.dataset.idx));
    });

    selectEvent(upcoming[0].i);
  }

  // ─── Concerts passats ─────────────────────────────────────────────────────
  function renderPast() {
    const now  = new Date();
    const past = allEvents.map((e,i) => ({e,i})).filter(({e}) => e.start && e.start < now).slice(-5).reverse();
    const ul = document.getElementById("concerts-past");
    if (!ul) return;

    if (past.length === 0) {
      ul.innerHTML = `<li class="concerts-empty-msg">${t.noPast}</li>`;
      return;
    }

    ul.innerHTML = past.map(({e, i}) => `
      <li class="concert-li concert-li--past" data-idx="${i}">
        <div class="concert-li-date">${shortDate(e.start)}</div>
        <div>
          <div class="concert-li-title">${e.title}</div>
          ${e.location ? `<div class="concert-li-location">${e.location}</div>` : ""}
        </div>
      </li>`).join("");

    ul.querySelectorAll(".concert-li").forEach(li => {
      li.addEventListener("click", () => selectEvent(+li.dataset.idx));
    });
  }

  // ─── Detall ───────────────────────────────────────────────────────────────
  function selectEvent(idx) {
    const event = allEvents[idx];
    if (!event) return;

    document.querySelectorAll(".concert-li").forEach(li => {
      li.classList.toggle("is-active", +li.dataset.idx === idx);
    });

    document.querySelectorAll(".cal-cell--selected").forEach(c => c.classList.remove("cal-cell--selected"));
    if (event.start) {
      if (event.start.getMonth() !== calDate.getMonth() || event.start.getFullYear() !== calDate.getFullYear()) {
        calDate = new Date(event.start.getFullYear(), event.start.getMonth(), 1);
        renderCalendar(calDate);
      }
      const cells = document.querySelectorAll(".cal-cell");
      const startOffset = (new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay() + 6) % 7;
      const targetCell  = cells[startOffset + event.start.getDate() - 1];
      if (targetCell) targetCell.classList.add("cal-cell--selected");
    }

    const detail = document.getElementById("concert-detail");
    if (!detail) return;

    const dateStr = event.start
      ? event.start.toLocaleDateString(langLocale(), {weekday:"long", day:"numeric", month:"long", year:"numeric"})
      : "";
    const timeStr = event.start && event.start.getHours() > 0
      ? " · " + event.start.toLocaleTimeString(langLocale(), {hour:"2-digit", minute:"2-digit"})
      : "";

    detail.removeAttribute("hidden");
    detail.innerHTML = `
      <div class="concert-detail-date">${dateStr}${timeStr}</div>
      <h2 class="concert-detail-title">${event.title}</h2>
      ${event.location ? `<p class="concert-detail-location">📍 ${event.location}</p>` : ""}
      ${event.desc     ? `<p class="concert-detail-desc">${event.desc}</p>` : ""}
      ${event.url      ? `<a href="${event.url}" class="concert-detail-link" target="_blank" rel="noopener">${t.tickets}</a>` : ""}
    `;

    if (window.innerWidth < 769) {
      detail.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function shortDate(d) {
    if (!d) return "";
    return d.getDate() + " " + t.shortMonths[d.getMonth()];
  }

  function langLocale() {
    return {ca:"ca-ES", es:"es-ES", en:"en-GB"}[lang] || "ca-ES";
  }

  function renderError(msg) {
    const ul = document.getElementById("concerts-upcoming");
    if (ul) ul.innerHTML = `<li class="concerts-error">⚠️ ${msg}</li>`;
  }

})();