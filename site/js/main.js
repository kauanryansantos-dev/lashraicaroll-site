/* Lógica da página principal (antes na classe Component do Main.dc.html). */
// rolagem lateral suave e sem tranco (desliga o snap durante o movimento)
var desliza = function (c, dx) { c._anda = true; var x0 = c.scrollLeft, t0 = 0, d = 700, snap = c.style.scrollSnapType, sb = c.style.scrollBehavior; c.style.scrollSnapType = 'none'; c.style.scrollBehavior = 'auto'; function st(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / d), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; c.scrollLeft = x0 + dx * e; if (p < 1) requestAnimationFrame(st); else { c.style.scrollSnapType = snap; c.style.scrollBehavior = sb; c._anda = false; } } requestAnimationFrame(st); };
// carrossel infinito: quando falta espaço, passa o card da ponta para o outro lado (CSS order) e compensa a rolagem
// Antes e depois infinito: o card da ponta troca de lado (CSS order) e a rolagem é compensada no mesmo quadro,
// então nada pula. Setas (computador) e arrastar com o dedo (celular) usam a mesma função vai().
var vai = function (c, dir, cur) {
  var k = Array.prototype.slice.call(c.children); if (!k.length) return;
  if (!c._ord) c._ord = k.map(function (_, i) { return i; });
  if (c._base == null) c._base = c.scrollLeft;
  var ord = c._ord, gap = parseFloat(getComputedStyle(c).columnGap) || 16, sb = c.style.scrollBehavior;
  var arruma = function () { ord.forEach(function (n, i) { k[n].style.order = i; }); };
  var base = c._base, fim = c.scrollWidth - c.clientWidth, passo = k[ord[0]].getBoundingClientRect().width + gap;
  c.style.scrollBehavior = 'auto'; c.style.scrollSnapType = 'none';
  if (dir > 0 && base + passo > fim - 2) { var p = ord.shift(); ord.push(p); arruma(); var w = k[p].getBoundingClientRect().width + gap; base -= w; cur -= w; }
  if (dir < 0 && base - passo < -2) { var u = ord.pop(); ord.unshift(u); arruma(); var w2 = k[u].getBoundingClientRect().width + gap; base += w2; cur += w2; }
  c.scrollLeft = cur;
  var alvo = base + dir * passo; c._base = alvo;
  var x0 = cur, t0 = 0, d = dir ? 520 : 320; c._anda = true;
  function st(t) { if (!t0) t0 = t; var q = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - q, 3); c.scrollLeft = x0 + (alvo - x0) * e; if (q < 1) requestAnimationFrame(st); else { c._anda = false; c.style.scrollBehavior = sb; } }
  requestAnimationFrame(st);
};
var gira = function (c, dir) { if (c._anda) return; if (c._base == null || Math.abs(c.scrollLeft - c._base) > 4) c._base = c.scrollLeft; vai(c, dir, c.scrollLeft); };
// celular: rolagem nativa com encaixe (scroll-snap), que no iPhone roda liso fora da thread principal
// (antes o dedo mudava scrollLeft por código a cada movimento: ficava com cara de fps baixo).
// Para não acabar na ponta: quando a fileira PARA perto de uma ponta, o card da outra ponta troca de lado
// (CSS order) e a rolagem é compensada no mesmo quadro; com tudo parado, não se vê nada.
(function () {
  var cel = window.matchMedia('(max-width: 760px)');
  function recicla(c) {
    var k = Array.prototype.slice.call(c.children); if (k.length < 3) return;
    if (!c._ord) c._ord = k.map(function (_, i) { return i; });
    var ord = c._ord, gap = parseFloat(getComputedStyle(c).columnGap) || 16, fim = c.scrollWidth - c.clientWidth, sx = c.scrollLeft, mudou = false;
    var larg = function (n) { return k[n].getBoundingClientRect().width + gap; };
    // deixa sempre 2 cards sobrando de cada lado (um deslize rápido nunca chega na ponta)
    for (var g = 0; g < k.length; g++) {
      if (sx > fim - larg(ord[ord.length - 1]) * 1.7) { var p = ord.shift(); ord.push(p); sx -= larg(p); mudou = true; }
      else if (sx < larg(ord[0]) * 1.7) { var u = ord.pop(); ord.unshift(u); sx += larg(u); mudou = true; }
      else break;
    }
    if (!mudou) return;
    var snap = c.style.scrollSnapType; c.style.scrollSnapType = 'none';
    ord.forEach(function (n, i) { k[n].style.order = i; });
    c.scrollLeft = sx; c._base = null;
    requestAnimationFrame(function () { c.style.scrollSnapType = snap; });
  }
  document.addEventListener('scroll', function (e) {
    var c = e.target; if (!cel.matches || !c.classList || !c.classList.contains('vids')) return;
    clearTimeout(c._rt); c._rt = setTimeout(function () { recicla(c); }, 160);
  }, true);
  // deslizes rápidos em sequência não deixam a fileira parar: também troca no instante em que o dedo encosta,
  // antes do movimento. Como cada deslize anda só um card (scroll-snap-stop), sempre sobra card dos dois lados.
  document.addEventListener('touchstart', function (e) {
    var c = cel.matches && e.target.closest && e.target.closest('.vids'); if (c) { clearTimeout(c._rt); recicla(c); }
  }, { passive: true });
  // ao abrir, já deixa cards antes do primeiro (dá para deslizar para os dois lados)
  window.addEventListener('load', function () { setTimeout(function () { if (cel.matches) document.querySelectorAll('.vids').forEach(recicla); }, 300); });
  // fotos da fileira: carregam todas quando ela chega perto da tela (com loading=lazy, o card que troca de ponta aparecia vazio até carregar)
  window.addEventListener('load', function () {
    var vs = document.querySelectorAll('.vids'); if (!vs.length) return;
    var carrega = function (v) { v.querySelectorAll('img[loading="lazy"]').forEach(function (i) { i.loading = 'eager'; }); };
    if (!('IntersectionObserver' in window)) { vs.forEach(carrega); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { carrega(e.target); io.unobserve(e.target); } }); }, { rootMargin: '1200px 0px' });
    vs.forEach(function (v) { io.observe(v); });
  });
})();
/* mensagem da cliente de exemplo no "exemplo ao vivo" do agendamento (mesmo formato da mensagem real) */
var DEMO_MSG = 'Oi, Raissa! 💙✨\nMe chamo Juliana e vim pelo seu site!\n\n🎀 Técnica: Volume Brasileiro\n💰 A partir de R$ 160\n📅 Dia: Sábado\n⏰ Período: Manhã\n\nTem horário pra mim? 🥰';
class Component extends DCLogic {
  componentDidMount() {
    var me = this; this._sp = setTimeout(function () { me.setState({ splashDone: true }); if (window.__liberaRolagem) window.__liberaRolagem(); }, 2550);
    var prep = function () {
      var vids = document.querySelectorAll('video');
      vids.forEach(function (v) {
        if (v._ok) return; v._ok = true;
        v.muted = true; v.defaultMuted = true; v.playsInline = true;
        v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
        if ('IntersectionObserver' in window) {
          new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); } }); }, { threshold: 0.35 }).observe(v);
        } else { var p2 = v.play(); if (p2 && p2.catch) p2.catch(function () {}); }
      });
    };
    prep(); this._vt = setTimeout(prep, 1200);
    // Simulador: troca de técnica a cada 5 s com dissolvência; um toque do usuário segura a troca por 10 s.
    // Troca com dissolvência: uma cópia da foto atual fica por cima, a técnica nova entra por baixo
    // e a cópia some devagar quando a foto nova carregou. Nunca aparece fundo nem brilho no meio da troca.
    this._simTroca = function (muda) {
      var m = document.querySelector('#simulador .sim-media');
      var veu = null;
      if (m && m.animate) {
        veu = document.createElement('div');
        veu.setAttribute('aria-hidden', 'true');
        veu.style.cssText = 'position:absolute;inset:0;z-index:3;pointer-events:none';
        m.querySelectorAll('img, video').forEach(function (e) {
          var c;
          // vídeo vira a foto de capa: no iPhone, um vídeo clonado parado aparece preto por um instante
          if (e.tagName === 'VIDEO') { c = new Image(); c.src = e.poster || ''; c.setAttribute('style', e.getAttribute('style') || ''); c.className = e.className; }
          else { c = e.cloneNode(false); c.removeAttribute('loading'); c.removeAttribute('data-onclick'); }
          veu.appendChild(c);
        });
        var box = m.closest('.sim-box') || m; var rb = box.getBoundingClientRect(), rm = m.getBoundingClientRect();
        veu.style.cssText += ';inset:auto;left:' + (rm.left - rb.left) + 'px;top:' + (rm.top - rb.top) + 'px;width:' + rm.width + 'px;height:' + rm.height + 'px;overflow:hidden';
        box.appendChild(veu);
      }
      // Só troca quando a cópia já está pintada: no iPhone ela aparecia vazia no primeiro quadro e a foto nova piscava antes da hora.
      var copias = veu ? [].slice.call(veu.querySelectorAll('img')) : [];
      var veuPronto = Promise.all(copias.map(function (c) { return c.decode ? c.decode().catch(function () {}) : null; }));
      me._simPronto = Promise.race([veuPronto, new Promise(function (r) { setTimeout(r, 400); })]);
      me._simPronto.then(function () { requestAnimationFrame(segue); });
      function segue() {
      var inf = document.querySelector('#simulador .sim-info'), ci = null;
      if (inf && inf.animate) {
        var pai = inf.parentNode; if (getComputedStyle(pai).position === 'static') pai.style.position = 'relative';
        ci = inf.cloneNode(true); ci.className = 'sim-info-veu'; ci.setAttribute('aria-hidden', 'true');
        ci.querySelectorAll('[data-onclick]').forEach(function (e) { e.removeAttribute('data-onclick'); });
        ci.style.cssText = inf.getAttribute('style') + ';position:absolute;z-index:2;pointer-events:none;margin:0;box-sizing:border-box;left:' + inf.offsetLeft + 'px;top:' + inf.offsetTop + 'px;width:' + inf.offsetWidth + 'px;height:' + inf.offsetHeight + 'px';
        pai.appendChild(ci);
      }
      muda();
      if (ci) {
        var tiraCi = function () { if (ci.parentNode) ci.parentNode.removeChild(ci); };
        ci.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = tiraCi; setTimeout(tiraCi, 1000);
        var ni = document.querySelector('#simulador .sim-info'); if (ni && ni.animate) ni.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 650, delay: 120, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
      }
      if (!veu) return;
      setTimeout(function () {
        var mm = document.querySelector('#simulador .sim-media') || m;
        var novas = [].slice.call(mm.querySelectorAll('img, video')).filter(function (e) { return !veu.contains(e); });
        var prontas = Promise.all(novas.map(function (e) { if (e.tagName === 'VIDEO') return e.readyState >= 2 ? null : new Promise(function (r) { e.addEventListener('loadeddata', r, { once: true }); }); e.loading = 'eager'; return e.decode ? e.decode().catch(function () {}) : null; }));
        var limite = new Promise(function (r) { setTimeout(r, 1800); });

        Promise.race([prontas, limite]).then(function () {
          var tira = function () { if (veu.parentNode) veu.parentNode.removeChild(veu); };
          veu.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1100, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = tira;   // sem blur: no iPhone o filtro animado pesava e piscava
          novas.forEach(function (e) { if (e.animate) e.animate([{ transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 1400, easing: 'cubic-bezier(.2,.8,.2,1)' }); });
          setTimeout(tira, 1700);   // trava: aba em segundo plano congela a animação; a cópia não pode se acumular
        });
      }, 30);
      }
    };
    this._simFx = function () {
      (me._simPronto || Promise.resolve()).then(function () { setTimeout(function () {
        var t = document.querySelector('#simulador .tabs button[aria-pressed="true"]');
        var tb = t && t.parentNode; if (tb && tb.scrollWidth > tb.clientWidth) { var de = tb.scrollLeft, para = Math.max(0, Math.min(tb.scrollWidth - tb.clientWidth, t.offsetLeft - (tb.clientWidth - t.offsetWidth) / 2)), dur = Math.min(1100, 450 + Math.abs(para - de) * 0.6), t0 = 0; tb.style.scrollBehavior = 'auto'; tb.style.scrollSnapType = 'none'; (function an(ts) { if (!t0) t0 = ts; var q = Math.min(1, (ts - t0) / dur), e = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2; tb.scrollLeft = de + (para - de) * e; if (q < 1) requestAnimationFrame(an); })(performance.now()); }
        prep();
      }, 60); });
    };
    // Só troca quando o simulador está na tela: fora dela, a mudança de altura empurrava a página.
    me._simVis = false;
    var simEl = document.getElementById('simulador');
    if (simEl && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { me._simVis = es[0].isIntersecting; }, { threshold: 0.45 }).observe(simEl);
    this._simT = setInterval(function () {
      if (!me._simVis) return;
      if (me._simHold && Date.now() - me._simHold < 10000) return;
      if (me.state.lb || me.state.waOn || me.state.slotOn) return;
      var n = me.state.sim == null ? 0 : me.state.sim;
      me._simTroca(function () { me.setState({ sim: (n + 1) % 8 }); }); me._simFx();
    }, 5000);
    // Exemplo ao vivo da conversa (ver DEMO_MSG): só anda com o agendamento na tela e a conversa visível.
    var agEl = document.getElementById('agendar');
    me._agVis = false;
    if (agEl) {
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { me._agVis = es[0].isIntersecting; }, { threshold: 0.3 }).observe(agEl);
      var mexeu = function (ev) { if (!me.state.bkMexeu && (ev.type === 'input' || (ev.target.closest && ev.target.closest('button')))) me.setState({ bkMexeu: true }); };
      agEl.addEventListener('click', mexeu, true); agEl.addEventListener('input', mexeu, true);
      // fases: a mensagem fica na barra de baixo (prepara), o balão inteiro entra (enviada), a Raissa digita (pontos), responde (resposta) e recomeça
      var FASES = { prepara: ['enviada', 33], enviada: ['pontos', 22], pontos: ['resposta', 18], resposta: ['prepara', 45] };
      this._demoT = setInterval(function () {
        if (me.state.bkMexeu) { clearInterval(me._demoT); return; }
        var chat = document.querySelector('#agendar .wa-chat');
        if (!me._agVis || !chat || !chat.offsetParent) return;
        var d = me.state.demo || { fase: 'prepara', k: 0, t: 0 };
        if (d.t >= FASES[d.fase][1]) d = { fase: FASES[d.fase][0], k: 0, t: 0 };
        else d = { fase: d.fase, k: d.k, t: d.t + 1 };
        me.setState({ demo: d });
      }, 110);
    }
    if (this._trk) return;
    this._trk = function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      if (!a) return;
      var h = a.getAttribute('href') || '';
      var type = h.indexOf('wa.me') > -1 ? 'lead_whatsapp' : h.indexOf('maapp.com.br') > -1 ? 'lead_agenda' : (h.indexOf('google.com/maps') > -1 || h.indexOf('waze.com') > -1) ? 'rota' : h.indexOf('instagram.com') > -1 ? 'instagram' : h.indexOf('calendar.google.com') > -1 ? 'lembrete' : '';
      if (!type) return;
      var sec = a.closest('section, header, nav, footer');
      var where = sec ? (sec.id || sec.getAttribute('aria-label') || sec.tagName.toLowerCase()) : 'pagina';
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: type, lead_origem: where, lead_texto: (a.textContent || '').trim().slice(0, 60) });
    };
    document.addEventListener('click', this._trk, true);
  }
  componentDidUpdate() { var lock = !!(this.state.slotOn || this.state.lb || this.state.waOn); var de = document.documentElement; if (lock !== this._locked) { this._locked = lock; if (lock) this._yTrava = window.scrollY; de.style.overflow = lock ? 'hidden' : ''; document.body.style.overflow = lock ? 'hidden' : ''; var yv = this._yTrava; if (!lock && yv != null && Math.abs(window.scrollY - yv) > 2) window.scrollTo(0, yv);   /* iPhone: o overflow:hidden pode jogar a página para o topo; ao fechar, volta para onde estava */ if (window.__lenis) { if (lock) window.__lenis.stop(); else window.__lenis.start(); } } }
  _waRun() {
    var self = this;
    clearTimeout(this._waA); (this._waSeq || []).forEach(clearTimeout); this._waSeq = [];
    if (this.state.waFase) this.setState({ waFase: '' });
    this._waA = setTimeout(function () {
      var s = self.state;
      if (!(s.waOn && s.waT && s.waP && (s.waN || '').trim())) return;
      var pal = (self._waTxt || '').match(/\S+\s*/g) || [], P = pal.length, V = 95;
      self.setState({ waFase: 'prepara', waDig: '' });
      self._waSeq = [];
      for (var i = 1; i <= P; i++) (function (i) { self._waSeq.push(setTimeout(function () { self.setState({ waDig: pal.slice(0, i).join('') }); }, 400 + i * V)); })(i);
      var t = 400 + P * V + 650;
      self._waSeq.push(setTimeout(function () { self.setState({ waFase: 'enviada' }); }, t));
      self._waSeq.push(setTimeout(function () { self.setState({ waFase: 'pontos' }); }, t + 2500));
      self._waSeq.push(setTimeout(function () { self.setState({ waFase: 'resposta' }); }, t + 4700));
    }, 800);
  }
  // conversa do passo 4: se a mensagem nova não couber, o chat desce suave até ela (igual ao WhatsApp)
  _waDesce() {
    setTimeout(function () {
      var bd = document.querySelector('.wam-prev .wa-body'); if (!bd) return;
      var de = bd.scrollTop, para = bd.scrollHeight - bd.clientHeight, t0 = 0; if (para - de < 2) return;
      (function an(ts) { if (!t0) t0 = ts; var q = Math.min(1, (ts - t0) / 600), e = 1 - Math.pow(1 - q, 3); bd.scrollTop = de + (para - de) * e; if (q < 1) requestAnimationFrame(an); })(performance.now());
    }, 60);
  }
  _waStop() { clearTimeout(this._waA); (this._waSeq || []).forEach(clearTimeout); this._waSeq = []; }
  componentWillUnmount() { document.documentElement.style.overflow = ''; document.body.style.overflow = ''; clearTimeout(this._sp); clearTimeout(this._vt); clearInterval(this._simT); clearInterval(this._demoT); clearInterval(this._mobT); if (this._trk) document.removeEventListener('click', this._trk, true); }
  constructor(p) {
    super(p);
    this.state = { tab: 0, pos: 50, open: 0, step: 0, ans: [], rx: 0, ry: 0 };
  }
  renderVals() {
    var self = this;
    var techs = [
      { name: 'Volume Egípcio', ideal: ['Quem quer volume sem peso', 'Olhar marcado no dia a dia', 'Fotos e eventos'], tag: 'O mais pedido', desc: 'Versão tradicional, sem Capping: fios em leque fechado (fio W) que marcam o olhar e continuam leves.', time: '2h30', maint: '15 dias R$ 85 · 22 dias R$ 110', effect: 'Marcado e leve', price: 'R$ 160' },
      { name: 'Volume Brasileiro', ideal: ['Primeira extensão', 'Volume natural', 'Dia a dia'], tag: 'Queridinho do Brasil', desc: 'Fio em Y que preenche com leveza e efeito natural. Também na versão Marrom (R$ 160) e com Capping (R$ 190).', time: '2h30', maint: '15 dias R$ 85 · 22 dias R$ 100', effect: 'Natural e cheio', price: 'R$ 160' },
      { name: 'Glam Leve', ideal: ['Rotina de trabalho', 'Quem prefere discrição', 'Elegância sem exagero'], tag: 'Discreto e elegante', desc: 'Para quem gosta de cílios mais discretos no dia a dia, sem abrir mão da elegância.', time: '2h30', maint: '15 dias R$ 90 · 22 dias R$ 120', effect: 'Natural', price: 'R$ 180' },
      { name: 'Volume 5D', ideal: ['Volume máximo', 'Olhar dramático', 'Festas e eventos'], tag: 'Mais volume', desc: 'Leques com 5 fios por cílio natural para um olhar cheio e marcante.', time: '2h30', maint: '15 dias R$ 90 · 22 dias R$ 110', effect: 'Dramático', price: 'R$ 170' },
      { name: 'Efeito Sirena', ideal: ['Olhar delineado', 'Efeito molhado', 'Quem quer algo diferente'], tag: 'Efeito molhado', desc: 'Pontas definidas com efeito de cílio molhado. O preenchimento vai do meio para o final do olho, em cerca de 65% dos fios.', time: '1h30', maint: 'Consulte', effect: 'Ousado', price: 'R$ 150' },
      { name: 'Volume Express', ideal: ['Primeira vez', 'Evento de última hora', 'Testar a extensão'], tag: 'Mais rápido', desc: 'Aplicação mais rápida e acessível para experimentar ou para uma ocasião especial.', time: '1h30', maint: 'Consulte', effect: 'Leve', price: 'R$ 120' },
      { name: 'Volume Egípcio + Capping', ideal: ['Acabamento impecável', 'Mais durabilidade', 'Olhar marcado'], tag: 'Antes e depois', desc: 'O Volume Egípcio com a técnica de Capping, que sela a base dos fios para um acabamento mais limpo e duradouro.', time: '2h30', maint: '15 dias R$ 90 · 22 dias R$ 120', effect: 'Marcado e leve', price: 'R$ 180' },
      { name: 'Volume Anime Plume', ideal: ['Olhar marcante', 'Quem ama tendência', 'Fotos e eventos'], tag: 'Tendência', desc: 'Pontas marcadas no estilo dos cílios de anime, com efeito plumado e leve.', time: 'Consulte', maint: 'Consulte', effect: 'Ousado', price: 'R$ 170' },
      { name: 'Efeito Rímel', ideal: ['Dia a dia', 'Sem maquiagem', 'Efeito natural'], tag: 'Em vídeo', desc: 'Fios definidos e escuros, como se você tivesse passado rímel, sem precisar de maquiagem.', time: 'Consulte', maint: 'Consulte', effect: 'Natural', price: 'R$ 160' }
    ];
    var priceOf = {}; techs.forEach(function (t) { priceOf[t.name] = t.price; });
    techs.forEach(function (t) { t.wa = 'https://wa.me/5541992637025?text=' + encodeURIComponent('Oi, Raissa! 💙\nVim pelo seu site e me apaixonei por essa técnica ✨\n\n🎀 Técnica: ' + t.name + '\n💰 A partir de ' + t.price + '\n⏱️ Duração: ' + t.time + '\n\nQuais horários você tem? 🥰'); });
    var base = 'font-family: var(--fb); font-size: 15px; font-weight: 700; padding: 12px 20px; min-height: 44px; border-radius: 999px; cursor: pointer; ';
    var tabs = techs.map(function (t, i) {
      var on = i === self.state.tab;
      return {
        name: t.name,
        style: base + (on ? 'background: #7CCBFF; color: #0A0F1C; border: 1.5px solid #7CCBFF; box-shadow: 0 0 24px -6px #7CCBFF' : 'background: #121A2B; color: #F2F6FF; border: 1.5px solid #24304A'),
        pick: function () { self.setState({ tab: i }); }
      };
    });

    var nowP = new Date();
    var mo = nowP.getMonth() + 1, dy = nowP.getDate(), promo = null;
    var mkPromo = function (t, x) { return { title: t, text: x, wa: 'https://wa.me/5541992637025?text=' + encodeURIComponent('Oi, Raissa! 💙\nVi a promoção no seu site e quero aproveitar ✨\n\n🎁 Promoção: ' + t + '\n\nQuais horários você tem? 🥰') }; };
    if (mo === 11) promo = mkPromo('Black Friday', '15% de desconto na primeira aplicação até 30/11.');
    else if (mo === 12 && dy <= 24) promo = mkPromo('Cílios para o Natal', 'Agenda de dezembro aberta. Garanta seu horário antes das festas.');
    else if (mo === 5 && dy <= 12) promo = mkPromo('Dia das Mães', 'Vale-presente de aplicação com embalagem especial.');
    var waT = this.state.waT || '', waP = this.state.waP || '', waN = (this.state.waN || '').trim(), waCtx = this.state.waCtx || '';
    var waMk = function (arr, key, cur) { return arr.map(function (l) { var on = l === cur; return { label: l, style: 'font-family: var(--fb); font-size: 14px; font-weight: 700; padding: 10px 14px; min-height: 42px; border-radius: 999px; cursor: pointer; ' + (on ? 'background: #7CCBFF; color: #0A0F1C; border: 1.5px solid #7CCBFF' : 'background: #0E1527; color: #F2F6FF; border: 1.5px solid #24304A'), pick: function () { var o = {}; o[key] = on ? '' : l; self.setState(o); self._waRun(); if (!on && (key === 'waT' || key === 'waP') && window.matchMedia('(max-width: 760px)').matches) setTimeout(function () { self.setState({ waPasso: key === 'waT' ? 2 : 3 }); if (key === 'waP') setTimeout(function () { var i = document.getElementById('wa-name'); if (i) i.focus(); }, 420); }, 280); } }; }); };
    var waIntros = { horarios: 'Vi seus horários de atendimento no site', fim: 'Rolei seu site inteirinho e amei', barra: 'Estou no seu site pelo celular e quero agendar', topo: 'Vim pelo seu site e quero agendar um horário', inicio: 'Vi seus resultados no site e me apaixonei', flutuante: 'Estou olhando seu site e já quero agendar', rodape: 'Vi seus dados de atendimento no rodapé do site' };
    var waIntro = waIntros[waCtx] || 'Vim pelo seu site';
    var waTxt = 'Oi, Raissa! 💙✨\nMe chamo ' + (waN || '___') + '. ' + waIntro + '!\n\n';
    if (waT === 'Não sei, me ajuda a escolher') waTxt += '🎀 Ainda não sei qual técnica combina comigo. Pode me ajudar a escolher?';
    else if (waT === 'Manutenção') waTxt += '🎀 Quero agendar minha manutenção.';
    else waTxt += '🎀 Técnica: ' + (waT || '___') + (priceOf[waT] ? '\n💰 A partir de ' + priceOf[waT] : '');
    waTxt += '\n⏰ Período: ' + (waP || '___') + '\n\nTem horário pra mim? 🥰';
    this._waTxt = waTxt;
    var waOk = !!(waT && waP && waN);
    var waFase = this.state.waFase || '', wd = new Date(), waHora = String(wd.getHours()).padStart(2, '0') + ':' + String(wd.getMinutes()).padStart(2, '0');
    var simKinds = [0, 6, 1, 2, 3, 4, 7, 8];
    var phStyle = function (pos) { return 'position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; object-position: ' + pos; };
    var simPhotos = { 0: { src: 'assets/egipcio.jpg?v=c4623266f6', alt: 'Cliente com Volume Egípcio', style: phStyle('center 55%'), before: '', bStyle: '', single: true }, 1: { src: 'assets/brasileiro-1.webp?v=acf579f4b9', alt: 'Cliente com Volume Brasileiro', style: phStyle('center 62%'), before: '', bStyle: '', single: true }, 2: { src: 'assets/4ac8842626d15f3eeaeac3a2bc521156.jpg?v=7133c8ddab', alt: 'Cliente com Efeito Glam Leve', style: phStyle('center 48%'), before: '', bStyle: '', single: true }, 3: { src: 'assets/5d-1.webp?v=ddafe4463d', alt: 'Cliente com Volume 5D', style: phStyle('center 32%'), before: '', bStyle: '', single: true }, 4: { src: 'assets/sirena.webp?v=5701aa4175', alt: 'Cliente com Efeito Sirena', style: phStyle('center 35%'), before: '', bStyle: '', single: true }, 6: { src: 'assets/11c13f776f58f1017277d068fea81fc3.jpg?v=ae6b56cefc', alt: 'Depois: Volume Egípcio com Capping', style: phStyle('center 40%'), before: 'assets/a7a7329fb47e7b3a5b8a30d3caf51779.jpg?v=f07402ea31', bStyle: phStyle('center 45%'), single: false }, 7: { src: 'assets/anime-plume.webp?v=eb1422f5f9', alt: 'Cliente com Volume Anime Plume', style: phStyle('center 58%'), before: '', bStyle: '', single: true }, 8: { src: '', video: 'assets/f082d8bab36b48c0bba125c63887bc5c.mp4?v=6c9452fd54', poster: 'assets/d329e6aee68b51fc2e3e380e1036a89d.jpg?v=76ad65f8c9', alt: 'Vídeo de antes e depois do Efeito Rímel', style: phStyle('center 45%'), before: '', bStyle: '', single: false } };
    var simI = this.state.sim == null ? 0 : this.state.sim;
    var simTabs = simKinds.map(function (ti, n) {
      var on = n === simI;
      return { name: techs[ti].name, pressed: on ? 'true' : 'false',
        style: base + (on ? 'background: #7CCBFF; color: #0A0F1C; border: 1.5px solid #7CCBFF; box-shadow: 0 0 24px -6px #7CCBFF' : 'background: #121A2B; color: #F2F6FF; border: 1.5px solid #24304A'),
        pick: function () { self._simHold = Date.now(); self._simTroca(function () { self.setState({ sim: n }); }); self._simFx(); } };
    });
    var simVis = {};
    for (var q = 0; q < 5; q++) simVis['simStyle' + q] = 'transition: opacity .45s ease; opacity: ' + (q === simI ? 1 : 0);
    var today = new Date();
    var pad = function (v) { return (v < 10 ? '0' : '') + v; };
    var lastDate = this.state.lastDate || (today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate()));
    var lp = lastDate.split('-');
    var nd = new Date(Number(lp[0]), Number(lp[1]) - 1, Number(lp[2]) + 15);
    var ndEnd = new Date(Number(lp[0]), Number(lp[1]) - 1, Number(lp[2]) + 22);
    var dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
    var nextText = isNaN(nd.getTime()) ? 'Escolha uma data' : (dias[nd.getDay()] + ', ' + pad(nd.getDate()) + '/' + pad(nd.getMonth() + 1));
    var selD0 = new Date(Number(lp[0]), Number(lp[1]) - 1, Number(lp[2]));
    var mDays = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - selD0) / 86400000);
    var mLine = mDays < 0 ? '📌 Situação: vou fazer a aplicação ainda' : mDays < 15 ? '📌 Situação: cílios ainda cheios (fiz há ' + mDays + ' dias)\n✅ Quero deixar a manutenção já marcada' : mDays <= 22 ? '📌 Situação: no prazo da manutenção (fiz há ' + mDays + ' dias)\n✅ Quero agendar minha manutenção' : '📌 Situação: passou do prazo (fiz há ' + mDays + ' dias)\n✅ Preciso de uma nova aplicação';
    var nextWa = 'https://wa.me/5541992637025?text=' + encodeURIComponent('Oi, Raissa! 💙\nUsei a calculadora de manutenção do seu site ✨\n\n' + mLine + '\n\nTem horário pra mim? 🥰');
    var nextBtn = mDays > 22 ? 'Agendar nova aplicação' : mDays >= 15 ? 'Agendar manutenção' : 'Deixar manutenção marcada';
    var meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    var selD = new Date(Number(lp[0]), Number(lp[1]) - 1, Number(lp[2]));
    var cm = this.state.calM == null ? selD.getMonth() : this.state.calM;
    var cy = this.state.calY == null ? selD.getFullYear() : this.state.calY;
    var first = new Date(cy, cm, 1).getDay();
    var todayKey = today.getFullYear() * 10000 + today.getMonth() * 100 + today.getDate();
    var calDays = [];
    for (var c = 0; c < 42; c++) {
      var dd = new Date(cy, cm, c - first + 1);
      var inM = dd.getMonth() === cm;
      var key = dd.getFullYear() * 10000 + dd.getMonth() * 100 + dd.getDate();
      var isSel = dd.getTime() === selD.getTime();
      var future = key > todayKey;
      var isToday = key === todayKey;
      (function (dd2, future2) {
        calDays.push({
          label: String(dd2.getDate()),
          aria: dd2.getDate() + ' de ' + meses[dd2.getMonth()],
          disabled: future2,
          style: 'height: 40px; border-radius: 12px; font-family: var(--fb); font-size: 14px; font-weight: 700; cursor: ' + (future2 ? 'default' : 'pointer') + '; border: ' + (isToday && !isSel ? '1.5px solid #7CCBFF' : '1.5px solid transparent') + '; background: ' + (isSel ? '#1E6FD9' : 'transparent') + '; color: ' + (isSel ? '#FFFFFF' : (!inM || future2 ? '#3A4766' : '#F2F6FF')),
          pick: function () { if (future2) return; self.setState({ lastDate: dd2.getFullYear() + '-' + pad(dd2.getMonth() + 1) + '-' + pad(dd2.getDate()), calM: dd2.getMonth(), calY: dd2.getFullYear() }); }
        });
      })(dd, future);
    }
    var calTitle = meses[cm].charAt(0).toUpperCase() + meses[cm].slice(1) + ' de ' + cy;
    var lastText = pad(selD.getDate()) + '/' + pad(selD.getMonth() + 1);
    var dayMs = 86400000;
    var t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var elapsed = Math.max(0, Math.round((t0 - new Date(Number(lp[0]), Number(lp[1]) - 1, Number(lp[2]))) / dayMs));
    var left = 15 - elapsed;
    var pct = Math.min(100, Math.round(elapsed / 22 * 100));
    var st, col, tip;
    if (elapsed < 10) { st = 'Cílios cheios'; col = '#7CCBFF'; tip = 'Está tudo em dia. Penteie os fios todas as manhãs e evite produtos oleosos para eles durarem até a manutenção.'; }
    else if (elapsed < 15) { st = 'Hora de agendar'; col = '#F5C76B'; tip = 'A janela da manutenção começa em breve. Garanta seu horário agora para não ficar com falhas.'; }
    else if (elapsed <= 22) { st = 'Época da manutenção'; col = '#6EE7A0'; tip = 'Você está dentro da janela ideal, de 15 a 22 dias. Agende o quanto antes para manter o volume.'; }
    else { st = 'Nova aplicação'; col = '#FF9B7A'; tip = 'Depois de 22 dias já não é manutenção: o ideal é uma nova aplicação. Fale com a Raissa para agendar.'; }
    var endLeft = 22 - elapsed;
    var cycleDays = left > 0 ? ('Faltam ' + left + (left === 1 ? ' dia' : ' dias')) : (endLeft >= 0 ? ('Até ' + pad(ndEnd.getDate()) + '/' + pad(ndEnd.getMonth() + 1)) : ('Passou ' + (-endLeft) + (endLeft === -1 ? ' dia' : ' dias') + ' do prazo'));
    var nextShort = pad(nd.getDate()) + '/' + pad(nd.getMonth() + 1);
    if (elapsed >= 15 && elapsed <= 22) nextText = 'Agende agora';
    else if (elapsed > 22) nextText = 'Nova aplicação';
    var dow = today.getDay(), hr = today.getHours() + today.getMinutes() / 60;
    var open = (dow >= 1 && dow <= 5 && hr >= 8 && hr < 20.5) || (dow === 6 && hr >= 8 && hr < 14);
    var hourRows = [
      { d: 'Segunda a sexta', h: '8h às 18h15', on: dow >= 1 && dow <= 5 },
      { d: 'Sábado', h: '8h às 14h', on: dow === 6 },
      { d: 'Domingo', h: 'Fechado', on: dow === 0 }
    ].map(function (r) { return { d: r.d, h: r.h, tag: r.on ? 'Hoje' : '', rowStyle: 'display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 14px; font-size: 16px; ' + (r.on ? 'background: #1A2540; border: 1px solid #7CCBFF' : 'border: 1px solid transparent'), hStyle: 'font-weight: 800; color: ' + (r.h === 'Fechado' ? '#8A97AE' : '#F2F6FF') }; });
    var chip = function (on) { return 'font-family: var(--fb); font-size: 15px; font-weight: 700; padding: 12px 18px; min-height: 44px; border-radius: 999px; cursor: pointer; ' + (on ? 'background: #7CCBFF; color: #0A0F1C; border: 1.5px solid #7CCBFF' : 'background: #0A0F1C; color: #F2F6FF; border: 1.5px solid #24304A'); };
    var mkOpts = function (list, key, def) { var cur = self.state[key] || def; return list.map(function (l) { var on = l === cur; return { label: l, on: on ? 'true' : 'false', style: chip(on), pick: function () { var u = {}; u[key] = l; u.bkStep = 0; u.bkFinal = false; u.mob = null; clearInterval(self._mobT); self.setState(u); } }; }); };
    var bkT = this.state.bkT || '', bkD = this.state.bkD || '', bkP = this.state.bkP || '', bkN = (this.state.bkN || '').trim();
    var bkPrice = priceOf[bkT] ? ' (a partir de ' + priceOf[bkT] + ')' : '';
    var bkOk = !!(bkT && bkD && bkP && bkN);
    var bkMsg = 'Oi, Raissa! 💙✨\nMe chamo ' + (bkN || '___') + ' e vim pelo seu site!\n\n🎀 Técnica: ' + (bkT || '___') + (priceOf[bkT] ? '\n💰 A partir de ' + priceOf[bkT] : '') + '\n📅 Dia: ' + (bkD || '___') + '\n⏰ Período: ' + (bkP || '___') + '\n\nTem horário pra mim? 🥰';
    // conversa de exemplo no estilo WhatsApp (só ilustração: a Raissa responde de verdade no WhatsApp dela)
    var agora = new Date(), bkHora = String(agora.getHours()).padStart(2, '0') + ':' + String(agora.getMinutes()).padStart(2, '0');
    // resposta de exemplo no jeito da Raissa (modelo enviado pelo Kauan em 27/10/2026). Se a cliente já escolheu
    // o período, ela confirma em vez de perguntar de novo; o nome e o dia entram quando a cliente preenche.
    var bkPerTxt = { 'Manhã': 'pela manhã', 'Tarde': 'à tarde' }[bkP] || '';
    var bkDiaTxt = { 'Segunda a sexta': ' durante a semana', 'Sábado': ' no sábado' }[bkD] || '';
    var bkReply = 'Oii, ' + (bkN ? bkN.split(' ')[0] : 'amore') + '! 💗 Tudo bem?\n\nVou verificar a agenda pra você e já te dou um retorno com os horários disponíveis ✨';
    // Exemplo ao vivo: enquanto a pessoa não mexe no agendamento, uma cliente de exemplo "digita" a mensagem,
    // envia, a Raissa aparece digitando e responde; depois recomeça. Ao primeiro clique ou letra digitada
    // (bkMexeu), o exemplo para e a conversa mostra a mensagem da própria pessoa, em tempo real.
    var dm = this.state.demo, bkDemo = !this.state.bkMexeu && !!dm;
    if (bkDemo) {
      bkMsg = DEMO_MSG;
      bkReply = 'Oii, Juliana! 💗 Tudo bem?\n\nVou te passar as opções de horário pela manhã no sábado para você escolher! ✨';
    }
    var bkMissing = !bkT ? 'Escolha a técnica' : !bkD ? 'Escolha o dia' : !bkP ? 'Escolha o período' : !bkN ? 'Digite seu nome' : '';
    // Celular: um passo por vez. bkStep = passo escolhido no resumo; 0 = vai para o primeiro que falta.
    // Passo 5 (só celular): depois do nome, o botão "Continuar" abre a conversa, que se escreve sozinha (bkFinal + mob).
    var bkCur = (this.state.bkFinal && bkOk) ? 5 : (this.state.bkStep || (!bkT ? 1 : !bkD ? 2 : !bkP ? 3 : 4));
    var bkCls = function (n) { return n === bkCur ? 'bk-step is-cur' : 'bk-step'; };
    var bkSum = [[1, '🎀', bkT, 'técnica'], [2, '📅', bkD, 'dia'], [3, '⏰', bkP, 'período'], [4, '👤', bkCur === 5 ? (bkN.split(' ')[0].length > 14 ? bkN.split(' ')[0].slice(0, 14) + '…' : bkN.split(' ')[0]) : '', 'nome']].filter(function (x) { return x[2]; }).map(function (x) { return { label: x[1] + ' ' + x[2], aria: 'Trocar ' + x[3] + ': ' + x[2], on: x[0] === bkCur ? 'true' : 'false', go: function () { clearInterval(self._mobT); self.setState({ bkStep: x[0], bkFinal: false, mob: null }); } }; });
    // conversa do passo 5: a mensagem da própria pessoa se escreve devagar, é "enviada" (✓✓), a Raissa aparece digitando e responde
    var mb = this.state.mob, bkMob = bkCur === 5 && !!mb, bkShow = bkMsg;
    var bkPronto = !bkMob || mb.fase === 'resposta';
    var bkMsgFull = bkMsg;
    // barra de mensagem do WhatsApp: na fase "prepara" ela mostra a mensagem pronta para enviar; depois volta a "Mensagem"
    var bkFase = bkDemo ? dm.fase : (bkMob ? mb.fase : '');
    var bkCompOn = bkFase === 'prepara';
    var bkTipo = function (s, f) { var p = s.match(/\S+\s*/g) || []; return p.slice(0, Math.ceil(p.length * Math.min(1, f))).join(''); };
    var bkCompTxt = bkCompOn ? bkTipo(bkMsg, bkDemo ? (dm.t + 1) / 28 : (mb.t + 1) / 24) : 'Mensagem';
    var dSlots = []; var dn = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (var dd2i = 1; dSlots.length < 7 && dd2i < 14; dd2i++) { var dx = new Date(today.getFullYear(), today.getMonth(), today.getDate() + dd2i); if (dx.getDay() !== 0) dSlots.push(dx); }
    var sDay = this.state.sDay == null ? 0 : this.state.sDay;
    var sdObj = dSlots[sDay]; var isSat = sdObj.getDay() === 6;
    var times = isSat ? ['08:00', '10:30'] : ['09:00', '11:30', '14:00', '16:30'];
    var busySeed = (sdObj.getDate() * 7) % times.length;
    var sTime = this.state.sTime && times.indexOf(this.state.sTime) > -1 && times.indexOf(this.state.sTime) !== busySeed ? this.state.sTime : null;
    var slotChip = function (on, off) { return 'font-family: var(--fb); font-size: 15px; font-weight: 700; padding: 12px 14px; min-height: 48px; border-radius: 14px; cursor: ' + (off ? 'default' : 'pointer') + '; text-align: center; ' + (on ? 'background: #7CCBFF; color: #0A0F1C; border: 1.5px solid #7CCBFF' : off ? 'background: transparent; color: #3A4766; border: 1.5px dashed #24304A; text-decoration: line-through' : 'background: #0A0F1C; color: #F2F6FF; border: 1.5px solid #24304A'); };
    var slotDays = dSlots.map(function (dObj, k) { return { dow: dn[dObj.getDay()], label: pad(dObj.getDate()) + '/' + pad(dObj.getMonth() + 1), style: slotChip(k === sDay, false) + '; flex: 0 0 auto; min-width: 64px', pick: function () { self.setState({ sDay: k, sTime: null }); } }; });
    var slotTimes = times.map(function (t, k) { var off = k === busySeed; return { label: off ? t + ' ocupado' : t, off: off, style: slotChip(t === sTime, off), pick: function () { if (!off) self.setState({ sTime: t }); } }; });
    var sLabel = dn[sdObj.getDay()] + ', ' + pad(sdObj.getDate()) + '/' + pad(sdObj.getMonth() + 1);
    var slotMsg = 'Oi, Raissa! 💙\n' + (bkN ? 'Me chamo ' + bkN + '. ' : '') + 'Escolhi um horário no seu site ✨\n\n🎀 Técnica: ' + bkT + '\n📅 Dia: ' + sLabel + (sTime ? '\n⏰ Horário: ' + sTime : '') + '\n\nPode confirmar pra mim? 🥰';
    var questions = [
      { q: 'Que efeito você quer no seu olhar?', opts: ['Natural', 'Marcado', 'Ousado'] },
      { q: 'Como é a sua rotina?', opts: ['Prática, sem maquiagem', 'Maquiagem leve', 'Eventos e fotos'] },
      { q: 'Você já fez extensão de cílios?', opts: ['É a primeira vez', 'Já fiz algumas vezes', 'Faço sempre'] }
    ];
    var step = this.state.step;
    var ans = this.state.ans;
    var question = step < 3 ? {
      q: questions[step].q,
      opts: questions[step].opts.map(function (label, j) {
        return { label: label, pick: function () { self.setState({ step: step + 1, ans: ans.concat([j]) }); } };
      })
    } : { q: '', opts: [] };
    var result = techs[2];
    if (step >= 3) {
      var e = ans[0], ro = ans[1], x = ans[2], ri = 2;
      if (e === 0) ri = ro === 0 ? (x === 0 ? 1 : 2) : 1;
      else if (e === 1) ri = (x === 0 && ro === 0) ? 1 : 0;
      else ri = ro === 2 ? 3 : x === 0 ? 0 : ro === 1 ? 4 : 3;
      var rt = techs[ri];
      var exp = ['é minha primeira vez com extensão 🥺', 'já fiz extensão algumas vezes', 'faço extensão sempre'][x];
      var rot = ['prática, sem maquiagem', 'com maquiagem leve', 'cheia de eventos e fotos'][ro];
      var qMsg = 'Oi, Raissa! 💙\nFiz o quiz do seu site ✨\n\n🎀 Técnica indicada: ' + rt.name + '\n💰 A partir de ' + rt.price + '\n👁️ Efeito que eu quero: ' + questions[0].opts[e].toLowerCase() + '\n☀️ Minha rotina: ' + rot + '\n💫 Experiência: ' + exp + '\n\nCombina comigo? Quais horários você tem? 🥰';
      result = { name: rt.name, desc: rt.desc, price: rt.price, time: rt.time, wa: 'https://wa.me/5541992637025?text=' + encodeURIComponent(qMsg) };
    }

    var faqData = [
      { q: 'Quanto tempo dura a extensão de cílios?', a: 'Os fios acompanham o ciclo natural dos seus cílios. Com manutenção entre 15 e 22 dias, o efeito se mantém sempre cheio. Depois de 22 dias, é preciso uma nova aplicação.' },
      { q: 'A extensão estraga os cílios naturais?', a: 'Não, quando feita com técnica correta e produtos profissionais. Respeito a espessura e o comprimento que cada fio natural aguenta.' },
      { q: 'Dói fazer extensão de cílios?', a: 'Não. Você fica deitada de olhos fechados o tempo todo, e muitas clientes até cochilam. A cola não encosta na pele.' },
      { q: 'E se eu tiver alergia?', a: 'Antes da primeira aplicação dá para fazer um teste de sensibilidade gratuito com poucos fios, 48 horas antes.' },
      { q: 'Preciso ir sem maquiagem?', a: 'Sim. Venha com os olhos limpos, sem rímel e sem lentes de contato, para garantir a melhor fixação.' },
      { q: 'Como faço para agendar?', a: 'Pelo botão Agendar aqui no site, direto na agenda online, ou pelo WhatsApp.' }
    ];
    var faqs = faqData.map(function (f, j) {
      var open = self.state.open === j;
      return { q: f.q, a: f.a, open: open, expanded: open ? 'true' : 'false', icon: open ? '–' : '+',
        toggle: function () { self.setState({ open: open ? -1 : j }); } };
    });
    /* depoimentos reais de clientes (enviados pelo Kauan em 27/10/2026); a média do título vem daqui */
    var reviews = [
      ['Mariana Silva', 5, 'Menina, sério... atendimento da Raissa é super cuidadoso. Juro que dormi na maca de tão confortável que foi fazer o Volume Egípcio + Capping! 🤍'],
      ['Ana Souza', 5, 'Acordo pronta todos os dias kkkk sério, não vivo mais sem meus cílios com o Volume Brasileiro que a Raissa faz. Maravilhosa demais!'],
      ['Bianca Lima', 5, 'O Volume 5D ficou perfeito e dura muito tempo até a próxima manutenção! A Raissa é muito caprichosa, recomendo de olhos fechados.'],
      ['Camila Rocha', 4, 'Fiz o Glam Leve com a Raissa e amei o resultado. Ficou super natural, exatamente como eu queria pro dia a dia no trabalho.'],
      ['Juliana Mendes', 5, 'O Efeito Sirena valorizou muito o formato do meu olho 😍 A Raissa arrasa muito, trabalho impecável!'],
      ['Larissa Ferraz', 5, 'Simplesmente apaixonada pelo meu Volume Anime Plume! A Raissa tem mãos de fada, nem senti o tempo passar na sessão.'],
      ['Beatriz Alves', 4, 'O Efeito Rímel da Raissa traz aquela praticidade que a gente ama. Acordo maquiada todo dia, economizo mó tempão.'],
      ['Camila Moraes', 5, 'O Volume Egípcio superou todas as minhas expectativas. Preenchimento perfeito e o melhor: não pesa absolutamente nada nos olhos.'],
      ['Gabriela Santos', 5, 'O studio é super aconchegante e a Raissa é um doce de pessoa. Meu Volume Brasileiro tá intacto já faz semanas!'],
      ['Fernanda Costa', 4, 'Fiz o Glam Leve com ela e já recebi vários elogios hoje. Deixa um olhar leve e muito elegante, amei muito.'],
      ['Patrícia Gomes', 5, 'Nossa, o Volume Egípcio + Capping da Raissa é surreal de perfeito! Durabilidade incrível e acabamento impecável.'],
      ['Vanessa Martins', 5, 'Nunca fui tão bem atendida! A Raissa indicou o Efeito Sirena pra mim e o resultado ficou deusa demais, tô in love.'],
      ['Carolina Ribeiro', 4, 'Amei o Volume 5D feito pela Raissa. Deu um volume bem marcante, mas sem perder aquela leveza bonita, sabe?'],
      ['Daniela Oliveira', 5, 'O Efeito Rímel da Raissa é vida! Prático, volumoso e com aquela curvinha linda que dura horrores.'],
      ['Amanda Souza', 5, 'O Volume Anime Plume é o mais estiloso que já fiz. Profissional extremamente detalhista, dá gosto de ver o cuidado.'],
      ['Renata Barbosa', 4, 'O Volume Egípcio deixou meus cílios bem cheios e super alinhados. Pode ir sem medo!'],
      ['Tatiane Lima', 5, 'Simplesmente viciada no Glam Leve da Raissa! Dá um destaque lindo no olhar mas sem exageros.'],
      ['Thais Nascimento', 5, 'Minha primeira vez com o Volume Egípcio + Capping e ela tirou todas as minhas dúvidas com maior paciência. Resultado perfeito!'],
      ['Luciana Cardoso', 4, 'O Efeito Sirena abriu o meu olhar de um jeito único. A Raissa é profissional nota mil aqui em Curitiba!'],
      ['Monique Freitas', 5, 'A Raissa arrasa muito no Volume Brasileiro! Meus cílios continuam super saudáveis e lindos mesmo depois da manutenção.']
    ].map(function (r) {
      // etiqueta com a técnica citada no próprio depoimento
      var tec = ['Volume Egípcio + Capping', 'Volume Egípcio', 'Volume Brasileiro', 'Volume 5D', 'Glam Leve', 'Efeito Sirena', 'Volume Anime Plume', 'Efeito Rímel'].filter(function (t) { return r[2].indexOf(t) > -1; })[0] || '';
      return { initial: r[0].charAt(0), handle: r[0], text: r[2], tag: tec, stars: '★★★★★'.slice(0, r[1]), off: '★★★★★'.slice(r[1]) };
    });
    var reels = [
      { title: 'Volume Egípcio com Capping', bg: '#121A2B' },
      { title: 'Volume 5D', bg: '#0B3D66' },
      { title: 'Antes e depois', bg: '#1E6FD9' },
      { title: 'Glam Leve', bg: '#1A2540' }
    ];
    var pos = this.state.pos;
    return {
      showQuiz: !!this.state.quiz, quizOpenAttr: this.state.quiz ? 'true' : 'false', quizBtn: this.state.quiz ? 'Fechar o quiz' : 'Não sabe qual escolher?', quizIcon: this.state.quiz ? '–' : '›',
      playVid: function (ev) { var v = ev.currentTarget.parentNode.querySelector('video'); if (!v) return; v.muted = true; if (v.paused || v.ended) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); } },
      vidOnPlay: function () { self.setState({ vPaused: false }); }, vidOnPause: function () { self.setState({ vPaused: true }); },
      vidPaused: this.state.vPaused !== false, vidAria: this.state.vPaused === false ? 'Pausar vídeo' : 'Tocar vídeo',
      vidPrev: function (ev) { gira(ev.currentTarget.closest('section').querySelector('.vids'), -1); },
      vidNext: function (ev) { gira(ev.currentTarget.closest('section').querySelector('.vids'), 1); },
      eyeShift: 'position: absolute; inset: -4%; transition: transform .6s cubic-bezier(.2,.7,.2,1); transform: translate(' + ((this.state.ex || 0) * -18) + 'px, ' + ((this.state.ey || 0) * -12) + 'px) rotateY(' + ((this.state.ex || 0) * 3) + 'deg)',
      onEyeMove: function (ev) { var b = ev.currentTarget.getBoundingClientRect(); var x = Math.round(((ev.clientX - b.left) / b.width - 0.5) * 20) / 10; var y = Math.round(((ev.clientY - b.top) / b.height - 0.5) * 20) / 10; if (x !== self.state.ex || y !== self.state.ey) self.setState({ ex: x, ey: y }); },
      onEyeLeave: function () { self.setState({ ex: 0, ey: 0 }); },
      lbOpen: !!this.state.lb, lbSrc: this.state.lb ? this.state.lb.src : '', lbAlt: this.state.lb ? this.state.lb.alt : '',
      lbClose: function () { self.setState({ lb: null }); },
      openGlam: function () { self.setState({ lb: { src: 'assets/4ac8842626d15f3eeaeac3a2bc521156.jpg?v=7133c8ddab', alt: 'Cliente com Efeito Glam Leve' } }); },
      openEgi: function () { self.setState({ lb: { src: 'assets/11c13f776f58f1017277d068fea81fc3.jpg?v=ae6b56cefc', alt: 'Depois: Volume Egípcio com Capping' } }); },
      openBras: function () { self.setState({ lb: { src: 'assets/brasileiro-2.webp?v=73795ab43e', alt: 'Cliente com Volume Brasileiro' } }); },
      open5D: function () { self.setState({ lb: { src: 'assets/5d-2.webp?v=4d915bfb1d', alt: 'Cliente com Volume 5D' } }); },
      openAnime: function () { self.setState({ lb: { src: 'assets/anime-plume.webp?v=eb1422f5f9', alt: 'Cliente com Volume Anime Plume' } }); },
      zoomSim: function () { var im = simPhotos[simKinds[simI]]; if (im) self.setState({ lb: { src: im.src, alt: im.alt } }); },
      simDot: 'position: absolute; top: 50%; width: 18px; height: 18px; margin: -9px 0 0 -9px; border-radius: 50%; background: #F2F6FF; box-shadow: 0 0 0 4px rgba(124,203,255,0.35); transition: left .45s cubic-bezier(.2,.7,.2,1); left: ' + ({0: 70, 1: 55, 2: 30, 3: 95, 4: 85, 5: 20, 6: 72, 7: 90, 8: 40}[simKinds[simI]] || 50) + '%',
      nextBtn: nextBtn,
      calLink: 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Manutenção dos cílios com Raissa Carolina') + '&dates=' + nd.getFullYear() + pad(nd.getMonth() + 1) + pad(nd.getDate()) + 'T090000/' + nd.getFullYear() + pad(nd.getMonth() + 1) + pad(nd.getDate()) + 'T094500&location=' + encodeURIComponent('Rua Ceilão, 29, Cajuru, Curitiba - PR') + '&details=' + encodeURIComponent('Hoje abre a janela da manutenção dos seus cílios (de 15 a 22 dias depois da aplicação).\nPara garantir seu horário, chame a Raissa: https://wa.me/5541992637025?text=' + encodeURIComponent('Oi, Raissa! Recebi o lembrete da minha manutenção.\n\nQuero agendar minha manutenção de cílios.\nTem horário pra mim?')),
      promoOn: !!promo && !this.state.promoHide, promo: promo || { title: '', text: '', wa: '' },
      promoClose: function () { self.setState({ promoHide: true }); },
      fontVars: '--fd: \'Bodoni Moda\', serif; --fb: Jost, system-ui, sans-serif;',
      bkTech: mkOpts(['Volume Egípcio', 'Volume Brasileiro', 'Glam Leve', 'Volume 5D', 'Efeito Sirena', 'Volume Express', 'Manutenção', 'Não sei ainda'], 'bkT', ''),
      bkDay: mkOpts(['Segunda a sexta', 'Sábado', 'Qualquer dia'], 'bkD', ''),
      bkPer: mkOpts(['Manhã', 'Tarde', 'Tanto faz'], 'bkP', ''),
      bkS1: bkCls(1), bkS2: bkCls(2), bkS3: bkCls(3), bkS4: bkCls(4), bkSPrev: bkCur === 5 ? 'bk-prev is-cur' : 'bk-prev', bkSum: bkSum, bkHasSum: bkSum.length > 0, bkStepText: 'Passo ' + bkCur + ' de 5', bkBar: 'width: ' + (bkCur * 20) + '%',
      bkNextOff: bkN ? false : 'true',
      bkGo: function () {
        if (!bkOk) return;
        clearInterval(self._mobT);
        self.setState({ bkFinal: true, bkStep: 0, mob: { fase: 'prepara', k: 0, t: 0 } });
        // barra com a mensagem (0,9 s) → balão inteiro entra e ✓ vira ✓✓ (1,4 s) → Raissa digitando (1,8 s) → resposta
        var FM = { prepara: ['enviada', 28], enviada: ['pontos', 19], pontos: ['resposta', 15] };
        self._mobT = setInterval(function () {
          var m = self.state.mob;
          if (!m || !self.state.bkFinal || !FM[m.fase]) { clearInterval(self._mobT); return; }
          m = m.t >= FM[m.fase][1] ? { fase: FM[m.fase][0], k: 0, t: 0 } : { fase: m.fase, k: 0, t: m.t + 1 };
          self.setState({ mob: m });
        }, 130);
        setTimeout(function () { var c = document.querySelector('#agendar .bk-prev'); if (c && c.scrollIntoView) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150);
      },
      bkName: bkN, bkOnName: function (ev) { self.setState({ bkN: ev.target.value.slice(0, 40) }); },
      bkPreview: bkShow, bkHora: bkHora, bkReply: bkReply,
      bkMsgOn: bkDemo ? dm.fase !== 'prepara' : (bkMob ? mb.fase !== 'prepara' : true),
      bkCompCls: bkCompOn ? 'wa-comp wa-comp-on' : 'wa-comp', bkCompTxt: bkCompTxt,
      bkReplyOn: bkDemo ? dm.fase === 'resposta' : (bkMob ? mb.fase === 'resposta' : true), bkTyping: bkDemo ? dm.fase === 'pontos' : (bkMob && mb.fase === 'pontos'),
      bkNota: bkDemo ? 'Exemplo ao vivo. Escolha as opções para ver a sua mensagem.' : 'Exemplo de conversa. A resposta de verdade chega no seu WhatsApp.',
      bkWa: bkOk ? 'https://wa.me/5541992637025?text=' + encodeURIComponent(bkMsg) : '#agendar', bkBtnText: bkOk ? (bkPronto ? 'Enviar pedido no WhatsApp' : 'Preparando sua mensagem…') : bkMissing, bkBtnStyle: (bkOk && bkPronto) ? 'background: #25D366; color: #0A0F1C; border-color: #25D366' : 'background: #1A2540; color: #8A97AE; border-color: #24304A; pointer-events: none', bkBlock: function (ev) { if (!bkOk && ev && ev.preventDefault) ev.preventDefault(); },
      showSplash: !this.state.splashDone,
      closeMenu: function (ev) { var d = ev.currentTarget.closest('details'); if (d) d.removeAttribute('open'); },
      waShow: !!this.state.waOn, waPrev: waTxt,
      waDraftOn: !waFase, waSentOn: waFase === 'enviada' || waFase === 'pontos' || waFase === 'resposta', waTypingOn: waFase === 'pontos', waReplyOn: waFase === 'resposta', waHora: waHora,
      waCompCls: waFase === 'prepara' ? 'wa-comp wa-comp-on' : 'wa-comp',
      waCompTxt: waFase === 'prepara' ? (this.state.waDig || '') : (!waT ? 'Escolha a técnica…' : !waP ? 'Escolha o período…' : !waN ? 'Digite seu nome…' : 'Mensagem'),
      waReply: 'Oii, ' + (waN ? waN.split(' ')[0] : 'amore') + '! 💗 Tudo bem?\n\nVou verificar a agenda pra você e já te dou um retorno com os horários disponíveis ✨',
      waAsk: function (ev) { if (ev && ev.preventDefault) ev.preventDefault(); self._waStop(); self.setState({ waOn: true, waCtx: '', waT: '', waP: '', waN: '', waFase: '', waPasso: 1 }); },
      waAskHours: function (ev) { if (ev && ev.preventDefault) ev.preventDefault(); self._waStop(); self.setState({ waOn: true, waCtx: 'horarios', waT: '', waP: '', waN: '', waFase: '', waPasso: 1 }); },
      waAskBar: function (ev) { if (ev && ev.preventDefault) ev.preventDefault(); self._waStop(); self.setState({ waOn: true, waCtx: 'barra', waT: '', waP: '', waN: '', waFase: '', waPasso: 1 }); },
      waAskTop: function (ev) { if (ev && ev.preventDefault) ev.preventDefault(); self._waStop(); self.setState({ waOn: true, waCtx: 'topo', waT: '', waP: '', waN: '', waFase: '', waPasso: 1 }); },
      waAskHero: function (ev) { if (ev && ev.preventDefault) ev.preventDefault(); self._waStop(); self.setState({ waOn: true, waCtx: 'inicio', waT: '', waP: '', waN: '', waFase: '', waPasso: 1 }); },
      waAskFloat: function (ev) { if (ev && ev.preventDefault) ev.preventDefault(); self._waStop(); self.setState({ waOn: true, waCtx: 'flutuante', waT: '', waP: '', waN: '', waFase: '', waPasso: 1 }); },
      waAskFoot: function (ev) { if (ev && ev.preventDefault) ev.preventDefault(); self._waStop(); self.setState({ waOn: true, waCtx: 'rodape', waT: '', waP: '', waN: '', waFase: '', waPasso: 1 }); },
      waAskEnd: function (ev) { if (ev && ev.preventDefault) ev.preventDefault(); self._waStop(); self.setState({ waOn: true, waCtx: 'fim', waT: '', waP: '', waN: '', waFase: '', waPasso: 1 }); },
      waName: this.state.waN || '', waOnName: function (ev) { self.setState({ waN: ev.target.value.slice(0, 30) }); self._waRun(); },
      waPassoCls: 'wam-p' + (this.state.waPasso || 1), waPassoTxt: 'Passo ' + (this.state.waPasso || 1) + ' de 4', waBarW: 'width: ' + ((this.state.waPasso || 1) * 25) + '%',
      waBack: function () { var p = self.state.waPasso || 1; if (p > 1) self.setState({ waPasso: p - 1 }); },
      waNext: function () { if (!(self.state.waN || '').trim()) { var i = document.getElementById('wa-name'); if (i) i.focus(); return; } if (document.activeElement) document.activeElement.blur(); self.setState({ waPasso: 4 }); self._waRun(); },
      waNextSt: (this.state.waN || '').trim() ? 'background: #1E6FD9; color: #FFFFFF; box-shadow: 0 12px 28px -12px #1E6FD9' : 'background: #1A2540; color: #6B7A96',
      waClose: function () { self._waStop(); self.setState({ waOn: false, waFase: '' }); setTimeout(function () { self.setState({ waT: '', waP: '', waN: '' }); }, 400); },
      waBackdrop: function (ev) { if (ev.target === ev.currentTarget) { self._waStop(); self.setState({ waOn: false, waFase: '' }); setTimeout(function () { self.setState({ waT: '', waP: '', waN: '' }); }, 400); } },
      waTechs: waMk(['Volume Egípcio', 'Volume Brasileiro', 'Glam Leve', 'Volume 5D', 'Efeito Sirena', 'Volume Express', 'Manutenção', 'Não sei, me ajuda a escolher'], 'waT', waT),
      waPers: waMk(['Manhã', 'Tarde', 'Sábado', 'Qualquer horário'], 'waP', waP),
      waLink: 'https://wa.me/5541992637025?text=' + encodeURIComponent(waTxt),
      waBtnText: waOk ? 'Enviar no WhatsApp 💬' : !waT ? 'Escolha a técnica' : !waP ? 'Escolha o período' : 'Digite seu nome',
      waBtn: 'display: block; text-align: center; text-decoration: none; padding: 16px; border-radius: 999px; font-weight: 800; font-size: 16px; ' + (waOk ? 'background: #25D366; color: #0A0F1C' : 'background: #1A2540; color: #8A97AE; pointer-events: none'),
      slotShow: !!this.state.slotOn, slotOpen: function () { self.setState({ slotOn: true }); }, slotClose: function () { self.setState({ slotOn: false }); }, slotBackdrop: function (ev) { if (ev.target === ev.currentTarget) self.setState({ slotOn: false }); },
      slotDays: slotDays, slotTimes: slotTimes, bkTName: 'Técnica: ' + bkT + ' (troque no passo 1)',
      slotSummary: sTime ? (bkT + ' · ' + sLabel + ' às ' + sTime) : 'Escolha um horário para ' + sLabel,
      slotWa: 'https://wa.me/5541992637025?text=' + encodeURIComponent(slotMsg),
      toggleQuiz: function () { self.setState({ quiz: !self.state.quiz }); },
      tabs: tabs, cur: techs[this.state.tab],
      simTabs: simTabs, sim: techs[simKinds[simI]], simPhoto: !!simPhotos[simKinds[simI]], simNoPhoto: !simPhotos[simKinds[simI]], simImg: simPhotos[simKinds[simI]] || { src: '', video: '', poster: '', alt: '', style: '', before: '', bStyle: '', single: false }, simName: techs[simKinds[simI]].name,
      simStyle0: simVis.simStyle0, simStyle1: simVis.simStyle1, simStyle2: simVis.simStyle2, simStyle3: simVis.simStyle3, simStyle4: simVis.simStyle4,
      lastDate: lastDate, nextText: nextText, nextWa: nextWa,
      calDays: calDays, calTitle: calTitle, lastText: lastText, nextShort: nextShort, endShort: pad(ndEnd.getDate()) + '/' + pad(ndEnd.getMonth() + 1),
      cycleStatus: st, cycleDays: cycleDays, cycleTip: tip,
      cycleBadge: 'font-size: 13px; font-weight: 800; padding: 6px 12px; border-radius: 999px; color: #0A0F1C; background: ' + col,
      cycleBar: 'position: absolute; left: 0; top: 0; bottom: 0; border-radius: 999px; width: ' + pct + '%; background: ' + col + '; box-shadow: 0 0 12px ' + col,
      hourRows: hourRows, openNow: open,
      openBadge: 'display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800; padding: 6px 12px; border-radius: 999px; background: ' + (open ? 'rgba(110,231,160,0.15); color: #6EE7A0' : 'rgba(255,155,122,0.15); color: #FF9B7A'),
      openText: open ? 'Aberto agora' : 'Fechado agora',
      calPrev: function () { var m = cm - 1, y = cy; if (m < 0) { m = 11; y--; } self.setState({ calM: m, calY: y }); },
      calNext: function () { var m = cm + 1, y = cy; if (m > 11) { m = 0; y++; } self.setState({ calM: m, calY: y }); }, faqs: faqs, reels: reels, reviews: reviews, reviewsLoop: reviews.concat(reviews),
      tiltStyle: 'position: relative; transform-style: preserve-3d; transition: transform .3s ease-out; transform: rotateX(' + this.state.rx + 'deg) rotateY(' + this.state.ry + 'deg)',
      onTilt: function (ev) {
        var b = ev.currentTarget.getBoundingClientRect();
        var px = (ev.clientX - b.left) / b.width - 0.5;
        var py = (ev.clientY - b.top) / b.height - 0.5;
        self.setState({ ry: Math.round(px * 18), rx: Math.round(-py * 14) });
      },
      resetTilt: function () { self.setState({ rx: 0, ry: 0 }); },
      question: question, stepNum: step + 1, quizRunning: step < 3, quizDone: step >= 3, result: result,
      restart: function () { self.setState({ step: 0, ans: [] }); },
      pos: pos,
      onSlide: function (ev) { self.setState({ pos: Number(ev.target.value) }); },
      dragStart: function (ev) { self._drag = true; var b = ev.currentTarget.getBoundingClientRect(); self.setState({ pos: Math.max(0, Math.min(100, Math.round((ev.clientX - b.left) / b.width * 100))) }); },
      dragMove: function (ev) { if (!self._drag) return; var b = ev.currentTarget.getBoundingClientRect(); self.setState({ pos: Math.max(0, Math.min(100, Math.round((ev.clientX - b.left) / b.width * 100))) }); },
      dragEnd: function () { self._drag = false; },
      beforeStyle: 'position: absolute; top: 0; left: 0; bottom: 0; overflow: hidden; width: ' + pos + '%',
      handleStyle: 'position: absolute; top: 0; bottom: 0; width: 3px; background: #7CCBFF; box-shadow: 0 0 12px #7CCBFF; left: calc(' + pos + '% - 1.5px)'
    };
  }
}

window.dcMount(Component, document.getElementById('app'), document.getElementById('app-tpl'));
