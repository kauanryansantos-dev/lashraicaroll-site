// Carregado no <head>. Fica em arquivo (não inline) porque a CSP de produção só permite scripts do próprio site.
// Ao recarregar (F5) ou voltar pela seta do navegador, a página começa no topo, não onde estava.
// Se o endereço tiver #âncora (ex.: #pacotes), respeita a âncora.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('pageshow', function () { if (!location.hash) window.scrollTo(0, 0); });
// Enquanto a abertura (logo) aparece, a página não rola: trava aqui, o mais cedo possível,
// e o main.js libera quando a abertura termina. Trava de segurança: libera sozinho em 4,5 s.
(function () {
  var html = document.documentElement;
  html.classList.add('carregando');
  window.__liberaRolagem = function () {
    if (!html.classList.contains('carregando')) return;
    html.classList.remove('carregando');
    if (window.__lenis) window.__lenis.start();
    if (!location.hash) window.scrollTo(0, 0);
  };
  setTimeout(window.__liberaRolagem, 4500);
})();
// Ao mudar o tamanho da janela (ex.: sair da tela cheia), alguns navegadores com aceleração de vídeo
// deixam faixas da tela sem redesenhar (pedaços pretos sobre fotos e vídeos). Quando o redimensionamento
// termina, força um redesenho da página inteira e recalcula a rolagem suave.
(function () {
  var t = null, html = document.documentElement;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      html.classList.add('repinta');
      requestAnimationFrame(function () { requestAnimationFrame(function () { html.classList.remove('repinta'); }); });
      if (window.__lenis && window.__lenis.resize) window.__lenis.resize();
    }, 180);
  });
})();
// Menu do celular (details.mmenu): com ele aberto a página não rola; um toque fora só fecha
// (não rola nem aciona o que estiver embaixo). Esc também fecha.
(function () {
  var html = document.documentElement;
  function aberto() { return document.querySelector('details.mmenu[open]'); }
  function fecha() { var d = aberto(); if (d) d.removeAttribute('open'); }
  document.addEventListener('toggle', function (e) {
    if (e.target.classList && e.target.classList.contains('mmenu')) html.classList.toggle('menu-aberto', e.target.open);
  }, true);
  document.addEventListener('touchstart', function (e) {
    var d = aberto(); if (d && !d.contains(e.target)) { e.preventDefault(); fecha(); }
  }, { passive: false });
  document.addEventListener('touchmove', function (e) {
    var d = aberto(); if (d && !d.querySelector('.mm-panel').contains(e.target)) e.preventDefault();
  }, { passive: false });
  document.addEventListener('click', function (e) { var d = aberto(); if (d && !d.contains(e.target)) fecha(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecha(); });
})();
