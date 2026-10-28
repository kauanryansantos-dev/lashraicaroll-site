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
// Menu do celular (details.mmenu): abre onde a pessoa está. Se ela rolar a página (dedo ou roda), o menu fecha
// e a rolagem segue normal. Um toque fora (sem arrastar) só fecha, sem acionar o que estiver embaixo. Esc também fecha.
// Não trava a rolagem: no iPhone, overflow:hidden na página fazia o Safari pular para o topo e sumir o cabeçalho.
(function () {
  var x0 = 0, y0 = 0, fora = false, arrastou = false;
  function aberto() { return document.querySelector('details.mmenu[open]'); }
  function fecha() { var d = aberto(); if (d) d.removeAttribute('open'); }
  document.addEventListener('touchstart', function (e) {
    var d = aberto(); fora = !!(d && !d.contains(e.target)); arrastou = false;
    if (fora) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!fora || arrastou) return;
    var t = e.touches[0];
    if (Math.abs(t.clientX - x0) > 8 || Math.abs(t.clientY - y0) > 8) { arrastou = true; fecha(); }
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (fora && !arrastou && aberto()) { e.preventDefault(); fecha(); }   // toque parado fora: só fecha (o preventDefault evita o clique embaixo)
    fora = false;
  }, { passive: false });
  var yAberto = null;
  document.addEventListener('toggle', function (e) {
    if (e.target.classList && e.target.classList.contains('mmenu')) yAberto = e.target.open ? window.scrollY : null;
  }, true);
  window.addEventListener('scroll', function () { if (yAberto !== null && Math.abs(window.scrollY - yAberto) > 12) fecha(); }, { passive: true });
  document.addEventListener('click', function (e) { var d = aberto(); if (d && !d.contains(e.target)) fecha(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecha(); });
})();
// Versão nova publicada: ao voltar para uma aba já aberta (ou o Safari restaurar a página da memória),
// pergunta ao servidor se a página mudou (HEAD, sem cache, compara o ETag). Se mudou, recarrega sozinho,
// a não ser que a pessoa esteja com a janela de agendar ou uma foto aberta (não perde o que digitou).
(function () {
  if (!window.fetch || location.protocol.indexOf('http') !== 0) return;
  var etag = null, conferindo = false;
  function pega() { return fetch(location.pathname, { method: 'HEAD', cache: 'no-store' }).then(function (r) { return r.headers.get('etag'); }).catch(function () { return null; }); }
  pega().then(function (e) { etag = e; });
  function confere() {
    if (conferindo || !etag || document.visibilityState !== 'visible') return;
    conferindo = true;
    pega().then(function (e) {
      conferindo = false;
      if (e && e !== etag && !document.querySelector('.wam, [role="dialog"]')) location.reload();
    });
  }
  document.addEventListener('visibilitychange', confere);
  window.addEventListener('pageshow', function (ev) { if (ev.persisted) confere(); });
  window.addEventListener('focus', confere);
})();
