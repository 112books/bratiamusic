(function () {
  var intro = document.getElementById('hero-logo-intro');
  if (!intro) return;

  // Ja vist en aquesta sessió → amaguem directament
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
    setTimeout(function () {
      intro.style.display = 'none';
    }, 700);
  }

  document.addEventListener('mousemove', runIntro, { once: true });
  document.addEventListener('touchstart', runIntro, { once: true, passive: true });
  document.addEventListener('scroll', runIntro, { once: true, passive: true });

  // Fallback: 2.5 segons si no hi ha interacció
  setTimeout(runIntro, 2500);
})();