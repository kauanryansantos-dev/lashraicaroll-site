/*
 * Motor de renderização do site (substitui o support.js do Claude Design).
 *
 * Lê o <template id="app-tpl"> com a mesma sintaxe dos arquivos .dc.html:
 *   {{caminho}}           valor em texto ou atributo
 *   data-onclick="{{fn}}" evento (data-onclick, data-oninput, data-onmousemove, data-onmouseleave, data-onplay, data-onpause).
 *                         Com prefixo data- porque a CSP (script-src 'self') bloqueia atributos on* até dentro do <template>.
 *   <sc-if value="{{x}}"> mostra o conteúdo se x for verdadeiro
 *   <sc-for list="{{l}}" as="item"> repete o conteúdo para cada item
 *
 * A cada setState gera uma árvore virtual leve e atualiza no DOM só o que mudou,
 * para que vídeos, foco nos campos e o menu aberto não sejam recriados.
 */
(function () {
  'use strict';

  var EVENTS = { 'data-onclick': 'click', 'data-oninput': 'input', 'data-onmousemove': 'mousemove', 'data-onmouseleave': 'mouseleave', 'data-onplay': 'play', 'data-onpause': 'pause' };
  var BOOL_ATTRS = { disabled: 1, hidden: 1, checked: 1 };
  var ONE = /^\{\{\s*([^}]+?)\s*\}\}$/;
  var ANY = /\{\{\s*([^}]+?)\s*\}\}/g;

  /* ---------- compilação do template (uma vez) ---------- */

  var nextId = 0;

  function compile(node) {
    var c = { id: 'k' + (nextId++), node: node, dynamic: false };
    if (node.nodeType === 3) {
      c.type = 'text';
      c.dynamic = node.data.indexOf('{{') > -1;
      return c;
    }
    if (node.nodeType !== 1) return null;
    var name = node.localName;
    if (name === 'sc-if') {
      c.type = 'if'; c.expr = ONE.exec(node.getAttribute('value'))[1]; c.dynamic = true;
    } else if (name === 'sc-for') {
      c.type = 'for'; c.expr = ONE.exec(node.getAttribute('list'))[1]; c.as = node.getAttribute('as'); c.dynamic = true;
    } else {
      c.type = 'el'; c.attrs = []; c.events = [];
      var drop = [];
      for (var i = 0; i < node.attributes.length; i++) {
        var a = node.attributes[i], low = a.name.toLowerCase();
        if (low.indexOf('hint-') === 0) { drop.push(a.name); continue; }
        if (a.value.indexOf('{{') < 0) continue;
        drop.push(a.name);
        if (EVENTS[low]) c.events.push({ type: EVENTS[low], expr: ONE.exec(a.value)[1] });
        else c.attrs.push({ name: a.name, value: a.value });
      }
      // clone "limpo" sem atributos dinâmicos, usado para criar o elemento
      c.shell = node.cloneNode(false);
      drop.forEach(function (n) { c.shell.removeAttribute(n); });
      if (c.attrs.length || c.events.length) c.dynamic = true;
    }
    var kids = node.localName === 'template' ? node.content.childNodes : node.childNodes;
    c.children = [];
    for (var j = 0; j < kids.length; j++) {
      var cc = compile(kids[j]);
      if (cc) { c.children.push(cc); if (cc.dynamic) c.dynamic = true; }
    }
    return c;
  }

  /* ---------- avaliação ---------- */

  function lookup(path, scope) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    var parts = path.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }

  function str(v) { return v == null || v === false ? '' : String(v); }

  function interp(text, scope) {
    var m = ONE.exec(text);
    if (m) return lookup(m[1], scope);
    return text.replace(ANY, function (_, p) { return str(lookup(p, scope)); });
  }

  /* ---------- árvore virtual ---------- */

  function render(c, scope, suffix, out) {
    var key = c.id + suffix;
    if (!c.dynamic) { out.push({ k: key, c: c, s: true }); return out; }
    if (c.type === 'text') { out.push({ k: key, c: c, text: str(interp(c.node.data, scope)) }); return out; }
    if (c.type === 'if') {
      if (lookup(c.expr, scope)) renderKids(c, scope, suffix, out);
      return out;
    }
    if (c.type === 'for') {
      var list = lookup(c.expr, scope) || [];
      for (var i = 0; i < list.length; i++) {
        var sub = Object.create(scope); sub[c.as] = list[i];
        renderKids(c, sub, suffix + '.' + i, out);
      }
      return out;
    }
    var v = { k: key, c: c, attrs: {}, events: {}, kids: renderKids(c, scope, suffix, []) };
    c.attrs.forEach(function (a) { v.attrs[a.name] = interp(a.value, scope); });
    c.events.forEach(function (e) { v.events[e.type] = lookup(e.expr, scope); });
    out.push(v);
    return out;
  }

  function renderKids(c, scope, suffix, out) {
    for (var i = 0; i < c.children.length; i++) render(c.children[i], scope, suffix, out);
    return out;
  }

  /* ---------- DOM ---------- */

  function dispatch(ev) {
    var h = this._h && this._h[ev.type];
    if (typeof h === 'function') h(ev);
  }

  function setAttr(el, name, val) {
    var low = name.toLowerCase();
    if (low === 'value' && 'value' in el) {
      var s = str(val);
      if (el.value !== s) el.value = s;
      return;
    }
    if (BOOL_ATTRS[low]) {
      if (val === true || val === 'true') el.setAttribute(name, '');
      else el.removeAttribute(name);
      return;
    }
    if (val == null || val === false) { el.removeAttribute(name); return; }
    var s2 = String(val);
    if (el.getAttribute(name) !== s2) el.setAttribute(name, s2);
  }

  function applyDyn(el, v) {
    for (var n in v.attrs) setAttr(el, n, v.attrs[n]);
    if (!el._h) el._h = {};
    for (var t in v.events) {
      if (!(t in el._h)) el.addEventListener(t, dispatch);
      el._h[t] = v.events[t];
    }
  }

  function create(v) {
    var el;
    if (v.s) {
      el = document.importNode(v.c.node, true);
      el._k = v.k;
      return el;
    }
    if (v.c.type === 'text') { el = document.createTextNode(v.text); el._k = v.k; return el; }
    el = document.importNode(v.c.shell, false);
    el._k = v.k;
    var host = el.localName === 'template' ? el.content : el;
    v.kids.forEach(function (kv) { host.appendChild(create(kv)); });
    applyDyn(el, v);
    return el;
  }

  function patch(el, v) {
    if (v.s) return;
    if (v.c.type === 'text') { if (el.data !== v.text) el.data = v.text; return; }
    applyDyn(el, v);
    morph(el, v.kids);
  }

  function morph(parent, vkids) {
    var byKey = {};
    for (var n = parent.firstChild; n; n = n.nextSibling) if (n._k) byKey[n._k] = n;
    // remove antes o que saiu: mover nós reinicia animações CSS e vídeos
    var keep = {};
    for (var j = 0; j < vkids.length; j++) keep[vkids[j].k] = 1;
    for (var old in byKey) if (!keep[old]) { parent.removeChild(byKey[old]); delete byKey[old]; }
    var cursor = parent.firstChild;
    for (var i = 0; i < vkids.length; i++) {
      var v = vkids[i], el = byKey[v.k];
      if (el) { delete byKey[v.k]; patch(el, v); }
      else el = create(v);
      // pula nós que não são do motor (ex.: inseridos por extensões)
      while (cursor && !cursor._k) cursor = cursor.nextSibling;
      if (el !== cursor) parent.insertBefore(el, cursor);
      else cursor = cursor.nextSibling;
    }
  }

  /* ---------- componente ---------- */

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patchObj) {
    var s = typeof patchObj === 'function' ? patchObj(this.state) : patchObj;
    for (var k in s) this.state[k] = s[k];
    if (this._mount) this._mount.schedule();
  };
  DCLogic.prototype.renderVals = function () { return {}; };

  function mount(Comp, root, tpl) {
    var compiled = compile(tpl);
    var inst = new Comp({});
    var queued = false, mounted = false;
    function draw() {
      queued = false;
      morph(root, renderKids(compiled, inst.renderVals(), '', []));
      if (mounted && inst.componentDidUpdate) inst.componentDidUpdate();
    }
    inst._mount = {
      schedule: function () {
        if (queued) return;
        queued = true;
        // microtarefa: agrupa os setState do mesmo evento e redesenha antes do próximo quadro
        Promise.resolve().then(draw);
      }
    };
    root.textContent = '';
    draw();
    mounted = true;
    if (inst.componentDidMount) inst.componentDidMount();
    return inst;
  }

  window.DCLogic = DCLogic;
  window.dcMount = mount;
})();
