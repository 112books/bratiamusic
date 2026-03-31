var DATA_URL = document.getElementById('analytics-data-url').dataset.url;

function connect() {
  var token = document.getElementById('token-input').value.trim();
  if (!token) return;
  sessionStorage.setItem('gc_token', token);
  showDashboard();
}

function logout() {
  sessionStorage.removeItem('gc_token');
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('token-input').value = '';
}

function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  loadData();
}

function loadData() {
  fetch(DATA_URL + '?t=' + Date.now())
    .then(function(res) {
      if (!res.ok) throw new Error('No es pot carregar analytics.json');
      return res.json();
    })
    .then(function(data) { renderDashboard(data); })
    .catch(function(err) {
      document.getElementById('dash-content').innerHTML =
        '<div style="color:var(--red)">ERROR: ' + err.message + '</div>';
    });
}

function bar(value, max, cls) {
  var p = max > 0 ? Math.round((value / max) * 100) : 0;
  return '<div class="chart-bar-wrap">' +
    '<div class="chart-bar ' + cls + '" data-width="' + p + '" style="width:0%">' +
    '<span class="chart-pct">' + p + '%</span>' +
    '</div></div>';
}

var BROWSER_ICONS = {
  'Safari':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
  'Chrome':  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>',
  'Firefox': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0z"/></svg>',
  'Edge':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.9 0 3.7-.5 5.2-1.5"/><path d="M22 12c0-2.5-1-4.8-2.7-6.5C17.7 4 15.5 3 13 3"/></svg>'
};

var SYSTEM_ICONS = {
  'macOS':   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  'iOS':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="18" r="1"/></svg>',
  'Windows': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 5l8-1v8H3z"/><path d="M13 4l8-1v9h-8z"/><path d="M3 13h8v8l-8-1z"/><path d="M13 13h8v9l-8-1z"/></svg>',
  'Android': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 16a7 7 0 0 1 14 0"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="9" y1="22" x2="15" y2="22"/><line x1="4" y1="8" x2="4" y2="14"/><line x1="20" y1="8" x2="20" y2="14"/></svg>',
  'Linux':   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a5 5 0 0 0-5 5v5l-2 4h14l-2-4V7a5 5 0 0 0-5-5z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>'
};

var SIZE_ICONS = {
  'phone':     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="18" r="1"/></svg>',
  'tablet':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><circle cx="12" cy="18" r="1"/></svg>',
  'desktop':   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  'desktophd': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  'larger':    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="3" width="22" height="14" rx="2"/><line x1="7" y1="21" x2="17" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
};

var SIZE_LABELS = {
  'phone': 'Mòbil', 'tablet': 'Tauleta',
  'desktop': 'Escriptori', 'desktophd': 'Escriptori HD', 'larger': 'Pantalla gran'
};

/* Fila d'icones proporcionals */
function iconRowVisual(items, icons, cls) {
  if (!items || items.length === 0) return '';
  var total = items.reduce(function(s, i){ return s + i.count; }, 0);
  var MAX_SIZE = 72;
  var MIN_SIZE = 20;
  var maxCount = Math.max.apply(null, items.map(function(i){return i.count;}));

  var html = '<div class="icon-row">';
  items.forEach(function(item) {
    var pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
    var size = Math.max(MIN_SIZE, Math.round((item.count / maxCount) * MAX_SIZE));
    var icon = icons[item.id] || icons[item.name] ||
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/></svg>';
    var label = SIZE_LABELS[item.id] || item.name;
    html += '<div class="icon-item icon-item--' + cls + '">' +
      '<div style="width:' + MAX_SIZE + 'px;display:flex;align-items:flex-end;justify-content:center">' +
      '<span style="width:' + size + 'px;height:' + size + 'px;display:block;color:inherit">' + icon + '</span>' +
      '</div>' +
      '<div class="icon-item__pct">' + pct + '%</div>' +
      '<div class="icon-item__name">' + label + '</div>' +
      '<div style="font-size:.8rem;color:var(--text-dim)">' + item.count + '</div>' +
      '</div>';
  });
  html += '</div>';
  return html;
}

function barRow(item, max, cls) {
  return '<div class="chart-row">' +
    '<div class="chart-label">' + (SIZE_LABELS[item.id] || item.name) + '</div>' +
    bar(item.count, max, cls) +
    '<div class="chart-value">' + item.count + '</div></div>';
}

function statSection(title, items, cls, icons) {
  if (!items || items.length === 0) return '';
  var max = Math.max.apply(null, items.map(function(i){return i.count;}));
  var visual = icons ? iconRowVisual(items, icons, cls.replace('chart-bar--','')) : '';
  var rows = items.map(function(item) {
    return '<div class="chart-row">' +
      '<div class="chart-label">' + (SIZE_LABELS[item.id] || item.name) + '</div>' +
      bar(item.count, max, cls) +
      '<div class="chart-value">' + item.count + '</div></div>';
  }).join('');
  return '<div class="section-title">' + title + '</div>' + visual + '<div class="chart">' + rows + '</div>';
}

function renderDashboard(data) {
  var total = data.total || 0;
  var byLang = data.by_lang || {};
  var bySection = data.by_section || {};
  var period = data.period || {};
  var generated = data.generated ? new Date(data.generated).toLocaleString('ca') : '';

  var langMax = Math.max.apply(null, Object.values(byLang).concat([1]));
  var sectionMax = Math.max.apply(null, Object.values(bySection).concat([1]));

  var langNames = { ca: 'Català', es: 'Castellà', en: 'Anglès' };
  var sectionNames = {
    'about': 'Sobre nosaltres', 'the-band': 'La Banda',
    'music': 'Música / Disc', 'concerts': 'Concerts',
    'videos': 'Vídeos', 'photos': 'Galeries', 'contact': 'Contacte'
  };

  var langRows = Object.entries(byLang)
    .sort(function(a,b){return b[1]-a[1];})
    .map(function(e) {
      return '<div class="chart-row">' +
        '<div class="chart-label">' + (langNames[e[0]]||e[0]) + '</div>' +
        bar(e[1], langMax, 'chart-bar--lang-' + e[0]) +
        '<div class="chart-value">' + e[1] + '</div></div>';
    }).join('');

  var sectionRows = Object.entries(bySection)
    .sort(function(a,b){return b[1]-a[1];})
    .map(function(e) {
      return '<div class="chart-row">' +
        '<div class="chart-label">' + (sectionNames[e[0]]||e[0]) + '</div>' +
        bar(e[1], sectionMax, 'chart-bar--section') +
        '<div class="chart-value">' + e[1] + '</div></div>';
    }).join('');

  var topLang = Object.entries(byLang).sort(function(a,b){return b[1]-a[1];})[0];
  var topSection = Object.entries(bySection).sort(function(a,b){return b[1]-a[1];})[0];
  var insights = [];
  if (topLang) insights.push('L\'idioma més usat és el <strong style="color:var(--green)">' + (langNames[topLang[0]]||topLang[0]) + '</strong> amb ' + topLang[1] + ' visites (' + Math.round(topLang[1]/total*100) + '% del total).');
  if (topSection) insights.push('La secció més visitada és <strong style="color:var(--green)">' + (sectionNames[topSection[0]]||topSection[0]) + '</strong> amb ' + topSection[1] + ' visites.');
  if (byLang.en > byLang.es) insights.push('L\'anglès supera el castellà — considerar prioritzar traduccions EN.');
  if ((bySection.contact||0) < (bySection.about||0) * 0.3) insights.push('Poques visites a Contacte vs About — revisar el CTA de booking.');

  document.getElementById('dash-content').innerHTML =
    '<div class="stats-total">visites totals (' + period.start + ' → ' + period.end + ')' +
    '<strong>' + total.toLocaleString('ca') + '</strong></div>' +

    '<div class="section-title">visites per idioma</div>' +
    '<div class="chart">' + langRows + '</div>' +

    '<div class="section-title">visites per secció</div>' +
    '<div class="chart">' + sectionRows + '</div>' +

    statSection('navegadors', data.browsers, 'chart-bar--browser', BROWSER_ICONS) +
    statSection('sistemes operatius', data.systems, 'chart-bar--system', SYSTEM_ICONS) +
    statSection('tipus de dispositiu', data.sizes, 'chart-bar--size', SIZE_ICONS) +
    statSection('ubicacions', data.locations, 'chart-bar--location', null) +

    '<div class="insight-box">' +
    '<span class="label">// interpretació automàtica</span>' +
    insights.map(function(i){return '<div class="insight-item">'+i+'</div>';}).join('') +
    '</div>' +

    '<div style="margin-top:1.5rem;font-size:.8rem;color:var(--text-dim)">dades actualitzades: ' + generated + ' · font: GoatCounter</div>';

  setTimeout(function() {
    document.querySelectorAll('.chart-bar').forEach(function(b) {
      var w = b.getAttribute('data-width');
      b.classList.add('animate');
      setTimeout(function(){ b.style.width = w + '%'; }, 50);
    });
  }, 100);
}

window.addEventListener('DOMContentLoaded', function() {
  var token = sessionStorage.getItem('gc_token');
  if (token) showDashboard();
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && document.getElementById('login-screen').style.display !== 'none') connect();
});