/* Regras de atendimento em 2 páginas no celular (as duas aparecem juntas no computador: o CSS esconde o seletor).
   Fica em arquivo porque a CSP de produção só aceita scripts do próprio site.
   A troca é suave: a página atual sai deslizando e some, a nova entra do outro lado e a altura do cartão se ajusta
   sem pulo. De propósito não segue "reduzir movimento" (o Windows do Kauan está com animações desligadas e o efeito
   é curto e discreto: 14 px e 0,3 s). */
(function () {
  function go(n) {
    var card = document.querySelector('#regras .neon');
    if (!card || card._rgBusy) return;
    var atual = card.querySelector('.rg-pg.is-on'), novo = card.querySelector('.rg-pg[data-pg="' + n + '"]');
    if (!atual || !novo || atual === novo) return;
    card._rgBusy = true;
    var wrap = card.querySelector('.rg-wrap'), h0 = wrap.offsetHeight, dir = n > +atual.getAttribute('data-pg') ? 1 : -1, feito = false, saida = null;

    function troca() {
      if (feito) return; feito = true;
      // tira o "fill" da animação de saída: sem isso a página que saiu ficava presa em opacidade 0 e, ao voltar a ela, aparecia em branco
      if (saida) saida.cancel();
      atual.classList.remove('is-on'); novo.classList.add('is-on');
      card.setAttribute('data-pg', n);
      [].forEach.call(card.querySelectorAll('.rg-pager button'), function (b) { b.setAttribute('aria-selected', b.getAttribute('data-rg-go') === String(n) ? 'true' : 'false'); });
      var h1 = wrap.offsetHeight;
      if (wrap.animate) {
        wrap.style.overflow = 'hidden';
        wrap.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' }).onfinish = function () { wrap.style.overflow = ''; };
        novo.animate([{ opacity: 0, transform: 'translateX(' + (14 * dir) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
      // se o topo do cartão ficou escondido atrás do cabeçalho, sobe suavemente até ele
      if (card.getBoundingClientRect().top < 70) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      card._rgBusy = false;
    }

    if (atual.animate) {
      saida = atual.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-14 * dir) + 'px)' }], { duration: 170, easing: 'ease-in', fill: 'forwards' });
      saida.onfinish = troca;
      setTimeout(troca, 450);   // trava: aba em segundo plano congela a animação
    } else troca();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rg-go]');
    if (b) go(+b.getAttribute('data-rg-go'));
  });
})();
