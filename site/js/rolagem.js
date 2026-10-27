(function () {
  // Rolagem suave só com mouse (ponteiro fino); no celular fica o scroll nativo, que já tem inércia.
  // Acompanha a troca de aparelho (ex.: modo celular do DevTools e volta): liga e desliga sem recarregar a página.
  if (typeof Lenis === 'undefined') return;
  var mq = window.matchMedia('(pointer: fine)'), lenis = null, id = 0;
  function raf(t) { if (!lenis) return; lenis.raf(t); id = requestAnimationFrame(raf); }
  function liga() {
    if (lenis) return;
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: true });
    window.__lenis = lenis;
    id = requestAnimationFrame(raf);
    if (document.documentElement.classList.contains('carregando')) lenis.stop();   // abertura ainda na tela (ver topo.js)
  }
  function desliga() {
    if (!lenis) return;
    cancelAnimationFrame(id); lenis.destroy(); lenis = null; window.__lenis = null;
  }
  function confere() { if (mq.matches) liga(); else desliga(); }
  confere();
  if (mq.addEventListener) mq.addEventListener('change', confere); else if (mq.addListener) mq.addListener(confere);
})();
