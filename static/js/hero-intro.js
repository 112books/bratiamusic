(function () {
  var intro = document.getElementById('hero-logo-intro');
  if (!intro) return;

  if (sessionStorage.getItem('bratia-intro-done')) {
    intro.style.display = 'none';
    return;
  }

  var fired = false;
  function runIntro() {
    if (fired) return;
    fired = true;
    sessionStorage.setItem('bratia-intro-done', '1');
    intro.classList.add('hero-logo-intro--done');
    setTimeout(function () { intro.style.display = 'none'; }, 2000); // era 700
  }

  document.addEventListener('mousemove', runIntro, { once: true });
  document.addEventListener('touchstart', runIntro, { once: true, passive: true });
  document.addEventListener('scroll', runIntro, { once: true, passive: true });

  setTimeout(runIntro, 4000); // era 2500 — fallback més tard
})();