/* Botões de WhatsApp.
   1) Computador: o WhatsApp Desktop estraga os emojis quando a mensagem chega por wa.me (o redirecionamento do navegador).
      Testado em 27/10/2026: o link direto whatsapp://send mostra os emojis certos. Então, no computador, o envio abre o
      aplicativo por whatsapp://send e deixa um aviso com o atalho para o WhatsApp Web (que também mantém os emojis).
   2) Qualquer botão que já leva a mensagem pronta (pacotes, técnicas, calculadora...) mostra antes a conversa ao vivo
      com a mensagem e só então envia. Os botões que abrem a janelinha "O que você procura?" (data-zap="janela") ficam como estão.
   Fica em arquivo porque a CSP só aceita scripts do próprio site. */
(function () {
  var NUM = '5541992637025';
  // conferido na hora do clique (e não só ao abrir a página): quem troca para o modo celular e volta não cai no wa.me, que quebra os emojis no WhatsApp Desktop
  function celular() { var ua = navigator.userAgent || ''; return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1); }

  function msgDe(a) {
    var h = a.getAttribute('href') || '', i = h.indexOf('text=');
    if (i < 0) return '';
    try { return decodeURIComponent(h.slice(i + 5)); } catch (e) { return ''; }
  }
  var appUrl = function (t) { return 'whatsapp://send?phone=' + NUM + '&text=' + encodeURIComponent(t); };
  var webUrl = function (t) { return 'https://web.whatsapp.com/send?phone=' + NUM + '&text=' + encodeURIComponent(t); };

  var st = document.createElement('style');
  st.textContent = [
    '.zap-ov{position:fixed;inset:0;z-index:120;background:rgba(5,8,15,.86);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;overscroll-behavior:contain}',
    '.zap-card{width:100%;max-width:440px;max-height:92vh;overflow-y:auto;background:#121A2B;border:1px solid #24304A;border-radius:26px;padding:20px;display:flex;flex-direction:column;gap:14px;color:#F2F6FF;font-family:Jost,system-ui,sans-serif;box-shadow:0 40px 90px -30px rgba(0,0,0,.7);animation:zapUp .35s cubic-bezier(.2,.7,.2,1)}',
    '.zap-hd{display:flex;align-items:center;gap:12px}.zap-hd img{width:42px;height:42px;border-radius:50%;object-fit:cover}',
    '.zap-hd div{flex:1;min-width:0}.zap-hd b{display:block;font-size:16px}.zap-hd small{display:block;font-size:12.5px;color:#8696A0}',
    '.zap-x{flex:none;width:36px;height:36px;border-radius:50%;background:#1A2540;border:0;color:#F2F6FF;font-size:20px;cursor:pointer}',
    '.zap-chat{border-radius:18px;overflow:hidden;border:1px solid #24304A;background:#0B141A}',
    '.zap-body{display:flex;flex-direction:column;gap:8px;padding:14px 12px;min-height:300px;background-image:radial-gradient(rgba(255,255,255,.035) 1px,transparent 1px);background-size:16px 16px}',
    '.zap-dia{align-self:center;font-size:12px;color:#8696A0;background:#182229;padding:5px 12px;border-radius:8px}',
    '.zap-m{position:relative;max-width:90%;padding:8px 11px 6px;border-radius:12px;font-size:14.5px;line-height:1.5;color:#E9EDEF;white-space:pre-line;overflow-wrap:anywhere;box-shadow:0 1px 1px rgba(0,0,0,.25);animation:zapPop .5s cubic-bezier(.2,.9,.3,1.15) both}',
    '.zap-eu{align-self:flex-end;background:#005C4B;border-top-right-radius:3px;transform-origin:100% 100%}',
    '.zap-ela{align-self:flex-start;background:#202C33;border-top-left-radius:3px;transform-origin:0 100%}',
    '.zap-meta{display:block;text-align:right;font-size:11px;color:rgba(233,237,239,.6);margin-top:2px}',
    '.zap-ck{color:#8696A0;letter-spacing:-3px;margin-left:2px;transition:color .4s}.zap-ck.azul{color:#53BDEB}',
    '.zap-digrow{display:flex;align-items:flex-end;gap:7px;align-self:flex-start;animation:zapPop .4s cubic-bezier(.2,.9,.3,1.15) both}.zap-digrow img{width:28px;height:28px;border-radius:50%;flex:none}.zap-digrow .zap-dig{animation:none}',
    '.zap-dig{display:flex;gap:4px;padding:12px 14px}.zap-dig i{width:7px;height:7px;border-radius:50%;background:#8696A0;animation:zapDot 1s ease-in-out infinite}.zap-dig i:nth-child(2){animation-delay:.15s}.zap-dig i:nth-child(3){animation-delay:.3s}',
    '.zap-comp{display:flex;align-items:center;gap:10px;margin:0 10px 10px;padding:8px 8px 8px 16px;border-radius:999px;background:#202C33;color:#8696A0;font-size:14px;min-height:44px;overflow:hidden;transition:background .3s,color .3s}',
    '.zap-comp.on{border-radius:22px;align-items:flex-end}.zap-comp.on span:first-child{white-space:pre-wrap;overflow-wrap:anywhere;display:flex;flex-direction:column;justify-content:flex-end;max-height:5.8em;line-height:1.4;text-overflow:clip;padding:4px 0}',
    '.zap-comp span:first-child{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.zap-comp.on{background:#2A3942;color:#E9EDEF}.zap-comp b{flex:0 0 34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#2A3942;color:#8696A0;transition:all .3s}',
    '.zap-comp.on b{background:#00A884;color:#fff;animation:zapToque .9s ease-in-out infinite}',
    '@keyframes zapDot{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}@keyframes zapToque{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}',
    '.zap-go{display:block;text-align:center;text-decoration:none;padding:16px;border-radius:999px;font-weight:800;font-size:16px;background:#25D366;color:#0A0F1C}',
    '.zap-note{margin:0;font-size:12.5px;color:#8696A0;line-height:1.5;text-align:center}',
    '.zap-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:130;max-width:min(92vw,460px);background:#121A2B;border:1px solid #24304A;color:#F2F6FF;border-radius:16px;padding:12px 16px;font:14px/1.5 Jost,system-ui,sans-serif;box-shadow:0 20px 50px -20px rgba(0,0,0,.7);animation:zapFade .3s ease}',
    '.zap-toast a{color:#7CCBFF;font-weight:700}',
    '@keyframes zapUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
    '@keyframes zapFade{from{opacity:0}to{opacity:1}}',
    '@keyframes zapPop{from{opacity:0;transform:scale(.7) translateY(8px)}to{opacity:1;transform:none}}',
    '@media (max-width:760px){.zap-ov{align-items:flex-end;padding:0}.zap-card{max-width:none;border-radius:26px 26px 0 0;border-width:1px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom))}.zap-toast{bottom:84px}}'
  ].join('\n');
  document.head.appendChild(st);

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  var toastT = null;
  function aviso(t) {
    var old = document.querySelector('.zap-toast'); if (old) old.remove();
    var d = el('div', 'zap-toast');
    d.setAttribute('role', 'status');
    d.appendChild(document.createTextNode('Abrindo o WhatsApp do computador… Se não abrir, '));
    var a = el('a', '', 'use o WhatsApp Web'); a.href = webUrl(t); a.target = '_blank'; a.rel = 'noopener';
    d.appendChild(a); d.appendChild(document.createTextNode('.'));
    document.body.appendChild(d);
    clearTimeout(toastT); toastT = setTimeout(function () { d.remove(); }, 15000);
  }

  var seq = [];
  function fecha() { seq.forEach(clearTimeout); seq = []; var o = document.querySelector('.zap-ov'); if (o) o.remove(); document.removeEventListener('keydown', esc); }
  function esc(e) { if (e.key === 'Escape') fecha(); }

  function previa(t) {
    fecha();
    var agora = new Date(), hora = ('0' + agora.getHours()).slice(-2) + ':' + ('0' + agora.getMinutes()).slice(-2);
    var nome = (/Me chamo ([^.\n!,]+)/.exec(t) || [])[1]; nome = nome ? nome.trim().split(' ')[0] : 'amore';
    var ov = el('div', 'zap-ov'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Sua mensagem');
    var card = el('div', 'zap-card'); card.setAttribute('data-lenis-prevent', '');
    var hd = el('div', 'zap-hd');
    var im = el('img'); im.src = 'assets/raissa-whatsapp.webp?v=6fcdbd1c8b'; im.alt = ''; im.width = 42; im.height = 42;
    var nm = el('div'); nm.appendChild(el('b', '', 'Lash Rai_caroll')); nm.appendChild(el('small', '', 'é assim que a conversa vai'));
    var x = el('button', 'zap-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Fechar'); x.onclick = fecha;
    hd.appendChild(im); hd.appendChild(nm); hd.appendChild(x);
    var chat = el('div', 'zap-chat'), body = el('div', 'zap-body'); body.appendChild(el('span', 'zap-dia', 'Hoje'));
    var comp = el('div', 'zap-comp on'), ct = el('span', '', ''), cb = el('b');
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('width', '18'); svg.setAttribute('height', '18'); svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'currentColor');
    var pt = document.createElementNS('http://www.w3.org/2000/svg', 'path'); pt.setAttribute('d', 'M3 20.5v-6.2l9-2.3-9-2.3V3.5l19 8.5z'); svg.appendChild(pt); cb.appendChild(svg);
    comp.appendChild(ct); comp.appendChild(cb); chat.appendChild(body); chat.appendChild(comp);
    var go = el('a', 'zap-go', 'Enviar no WhatsApp 💬'); go.href = 'https://wa.me/' + NUM + '?text=' + encodeURIComponent(t); go.target = '_blank'; go.rel = 'noopener';
    go.addEventListener('click', function () { setTimeout(fecha, 300); });
    card.appendChild(hd); card.appendChild(chat); card.appendChild(go); card.appendChild(el('p', 'zap-note', 'Você ainda pode editar o texto no WhatsApp antes de enviar.'));
    ov.appendChild(card);
    ov.addEventListener('click', function (e) { if (e.target === ov) fecha(); });
    document.body.appendChild(ov); document.addEventListener('keydown', esc);
    go.focus();
    // a conversa se escreve sozinha: barra com a mensagem, balão, ✓✓ azul, "digitando" e a resposta
    var ck, dig, pal = t.match(/\S+\s*/g) || [], P = pal.length, V = 95;
    for (var q = 1; q <= P; q++) (function (q) { seq.push(setTimeout(function () { ct.textContent = pal.slice(0, q).join(''); }, 400 + q * V)); })(q);
    var T = 400 + P * V + 650;
    seq.push(setTimeout(function () {
      comp.className = 'zap-comp'; ct.textContent = 'Mensagem';
      var m = el('div', 'zap-m zap-eu'); m.appendChild(el('span', '', t)); var meta = el('span', 'zap-meta', hora + ' '); ck = el('span', 'zap-ck', '✓✓'); meta.appendChild(ck); m.appendChild(meta); body.appendChild(m);
    }, T));
    seq.push(setTimeout(function () { if (ck) ck.className = 'zap-ck azul'; }, T + 800));
    seq.push(setTimeout(function () { dig = el('div', 'zap-digrow'); var av = el('img'); av.src = 'assets/raissa-whatsapp.webp?v=6fcdbd1c8b'; av.alt = ''; av.width = 28; av.height = 28; dig.appendChild(av); var pts = el('div', 'zap-m zap-ela zap-dig'); for (var k = 0; k < 3; k++) pts.appendChild(document.createElement('i')); dig.appendChild(pts); body.appendChild(dig); }, T + 2500));
    seq.push(setTimeout(function () {
      if (dig) dig.remove();
      var r = el('div', 'zap-m zap-ela'); r.appendChild(el('span', '', 'Oii, ' + nome + '! 💗 Tudo bem?\n\nVou verificar a agenda pra você e já te dou um retorno com os horários disponíveis ✨'));
      r.appendChild(el('span', 'zap-meta', hora)); body.appendChild(r);
    }, T + 4500));
  }

  var ENVIO = '.wam-send a, .bk-dir > a, .zap-go';   // botões que mandam de verdade (já mostram a conversa ou vêm da prévia)
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var a = e.target && e.target.closest && e.target.closest('a[href*="wa.me/"]');
    if (!a || a.getAttribute('data-zap') === 'janela') return;
    var t = msgDe(a); if (!t) return;
    if (a.matches(ENVIO)) {
      if (!celular()) { e.preventDefault(); aviso(t); window.location.href = appUrl(t); }
      return;
    }
    e.preventDefault(); previa(t);
  }, true);
})();
