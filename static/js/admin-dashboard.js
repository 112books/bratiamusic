const DATA_URL = document.getElementById('analytics-data-url').dataset.url;

function connect() {
  const token = document.getElementById('token-input').value.trim();
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

async function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  await loadData();
}

async function loadData() {
  try {
    const res = await fetch(DATA_URL + '?t=' + Date.now());
    if (!res.ok) throw new Error('No es pot carregar analytics.json');
    const data = await res.json();
    renderDashboard(data);
  } catch(err) {
    document.getElementById('dash-content').innerHTML =
      '<div style="color:var(--red)">ERROR: ' + err.message + '</div>';
  }
}

function bar(value, max, cls, showPct) {
  var p = max > 0 ? Math.round((value / max) * 100) : 0;
  return '<div class="chart-bar-wrap">' +
    '<div class="chart-bar ' + cls + '" data-width="' + p + '" style="width:0%">' +
    (showPct ? '<span class="chart-pct">' + p + '%</span>' : '') +
    '</div></div>';
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
    'about': 'Sobre nosaltres',
    'the-band': 'La Banda',
    'music': 'Música / Disc',
    'concerts': 'Concerts',
    'videos': 'Vídeos',
    'photos': 'Galeries',
    'contact': 'Contacte'
  };

  var langRows = Object.entries(byLang)
    .sort(function(a,b) { return b[1]-a[1]; })
    .map(function(entry) {
      var lang = entry[0], count = entry[1];
      return '<div class="chart-row">' +
        '<div class="chart-label">' + (langNames[lang] || lang) + '</div>' +
        bar(count, langMax, 'chart-bar--lang-' + lang, true) +
        '<div class="chart-value">' + count + '</div>' +
        '</div>';
    }).join('');

  var sectionRows = Object.entries(bySection)
    .sort(function(a,b) { return b[1]-a[1]; })
    .map(function(entry) {
      var section = entry[0], count = entry[1];
      return '<div class="chart-row">' +
        '<div class="chart-label">' + (sectionNames[section] || section) + '</div>' +
        bar(count, sectionMax, 'chart-bar--section', true) +
        '<div class="chart-value">' + count + '</div>' +
        '</div>';
    }).join('');

  var topLang = Object.entries(byLang).sort(function(a,b){return b[1]-a[1];})[0];
  var topSection = Object.entries(bySection).sort(function(a,b){return b[1]-a[1];})[0];
  var insights = [];
  if (topLang) insights.push('L\'idioma més usat és el <strong style="color:var(--green)">' + (langNames[topLang[0]] || topLang[0]) + '</strong> amb ' + topLang[1] + ' visites (' + Math.round(topLang[1]/total*100) + '% del total).');
  if (topSection) insights.push('La secció més visitada és <strong style="color:var(--green)">' + (sectionNames[topSection[0]] || topSection[0]) + '</strong> amb ' + topSection[1] + ' visites.');
  if (byLang.en > byLang.es) insights.push('L\'anglès supera el castellà — considerar prioritzar traduccions EN.');
  if ((bySection.contact || 0) < (bySection.about || 0) * 0.3) insights.push('Poques visites a Contacte vs About — revisar el CTA de booking.');

  document.getElementById('dash-content').innerHTML =
    '<div class="stats-total">visites totals (' + period.start + ' → ' + period.end + ')' +
    '<strong>' + total.toLocaleString('ca') + '</strong></div>' +

    '<div class="section-title">visites per idioma</div>' +
    '<div class="chart">' + langRows + '</div>' +

    '<div class="section-title">visites per secció</div>' +
    '<div class="chart">' + sectionRows + '</div>' +

    '<div class="insight-box">' +
    '<span class="label">// interpretació automàtica</span>' +
    insights.map(function(i) { return '<div class="insight-item">' + i + '</div>'; }).join('') +
    '</div>' +

    '<div class="dash-meta" style="margin-top:1.5rem">dades actualitzades: ' + generated + ' · font: GoatCounter</div>';

  // Animació barres
  setTimeout(function() {
    var bars = document.querySelectorAll('.chart-bar');
    bars.forEach(function(bar) {
      var w = bar.getAttribute('data-width');
      bar.classList.add('animate');
      setTimeout(function() {
        bar.style.width = w + '%';
      }, 50);
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