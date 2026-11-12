/* =====================================================================
   MAIN.JS · arma la página con lo que escribiste en js/config.js
   (casi nunca necesitas tocar este archivo)
   ===================================================================== */
(function () {
  "use strict";
  var K = window.RE;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover)").matches;
  var isDesk = function () { return window.matchMedia("(min-width: 900px)").matches; };
  var isTouchUI = function () { return !(canHover && isDesk()); };

  /* ───────── utilidades ───────── */
  var tt;
  function toast(m) { var t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove("show"); }, 3600); }
  function wa(text) { return "https://wa.me/584267932485" + String(K.whatsapp).replace(/\D/g, "") + "?text=" + encodeURIComponent(text); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function icon(id) { return '<svg class="ic"><use href="#i-' + id + '"/></svg>'; }
  function src(s) { return String(s || "").replace(/ /g, "%20"); }   // permite archivos con espacios
  function sameName(a, b) { a = norm(a); b = norm(b); return !!a && !!b && (a === b || (Math.min(a.length, b.length) >= 5 && (a.indexOf(b) > -1 || b.indexOf(a) > -1))); }

  $$("[data-brand]").forEach(function (e) { e.textContent = K.nombre; });
  $("#mapBtn").href = K.mapaUrl; $("#officeName").textContent = K.oficina; $("#legalText").textContent = K.legal;
  $("#advisorStatic").href = wa(K.mensajes.asesor); $("#sticky").href = wa(K.mensajes.asesor);

  /* ───────── CARRITO (lista para WhatsApp) ───────── */
  var cart = [];
  function cartMsg(base) { return base + "\n" + cart.map(function (n, i) { return (i + 1) + ". " + n; }).join("\n"); }
  function renderCart(bump) {
    var n = cart.length;
    $("#navCtaLabel").textContent = n ? "Consultar" : "Agendar consulta";
    $("#navCart").hidden = !n; $("#navCount").textContent = n;
    $("#navCta").href = wa(n ? cartMsg(K.mensajes.conPropiedades) : K.mensajes.cita);
    $("#catalogLabel").textContent = n ? "Enviar mi consulta (" + n + ")" : "Ver el catálogo completo";
    $$("[data-cart]").forEach(function (b) {
      var on = cart.indexOf(b.getAttribute("data-cart")) > -1; b.setAttribute("aria-pressed", on);
      if (b.classList.contains("chip")) b.textContent = on ? "✓ Agregada" : "Agregar a mi consulta";
    });
    if (bump) { var c = $("#navCta"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); }
  }
  function toggleCart(n) { var i = cart.indexOf(n); if (i > -1) cart.splice(i, 1); else cart.push(n); renderCart(true); }
  $("#catalogBtn").addEventListener("click", function () { window.open(wa(cart.length ? cartMsg(K.mensajes.conPropiedades) : K.mensajes.catalogo), "_blank", "noopener"); });

  /* ───────── HERO (solo video) ───────── */
  var hero = $("#hero"), hv = $("#heroVideo");
  $("#heroPoster").src = K.hero.poster; hero.style.setProperty("--video-pos", K.hero.posicionVideo || "center");
  if (K.hero.etiqueta) $("#heroTag span").textContent = K.hero.etiqueta; else $("#heroTag").hidden = true;
  var lastVid = "";
  function pickVideo() {
    var v = (window.innerWidth < 700 && K.hero.videoMovil) ? K.hero.videoMovil : K.hero.video;
    if (!v || v === lastVid) return; lastVid = v; hv.src = v; hv.hidden = false; var p = hv.play(); if (p && p.catch) p.catch(function () {});
  }
  pickVideo(); window.addEventListener("resize", pickVideo);

  /* ───────── TARJETAS DE PROPIEDADES ───────── */
  function makeCard(p, idx, i) {
    var c = el("article", "card"); if (i != null) c.style.setProperty("--i", i);
    c.tabIndex = 0; c.setAttribute("role", "button"); c.setAttribute("aria-label", "Recorrer " + p.nombre + " en 360°");
    c.innerHTML = '<button class="card__cart" type="button" data-cart="' + esc(p.nombre) + '" aria-pressed="false" aria-label="Agregar ' + esc(p.nombre) + ' a mi consulta">' + icon("cart") + "</button>" +
      '<div class="card__img"><img src="' + esc(src(p.imagen)) + '" alt="' + esc(p.nombre) + '" loading="lazy"><span class="card__360">' + icon("360") + "360°</span></div>" +
      '<h3 class="card__name">' + esc(p.nombre) + '</h3><p class="card__loc">' + esc(p.ubicacion) + "</p>";
    $(".card__cart", c).addEventListener("click", function (e) { e.stopPropagation(); toggleCart(p.nombre); var b = e.currentTarget; b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); });
    var open = function () { openViewer(idx, c); };
    c.addEventListener("click", open); c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    return c;
  }
  var cardsBox = $("#cards");
  K.propiedades.forEach(function (p, i) { cardsBox.appendChild(makeCard(p, i, i)); });
  renderCart();

  /* ═════════════ VISOR 360° DE LA PROPIEDAD (mismo motor del consultorio: js/pano.js) ═════════════ */
  var pv = $("#pv"), pvCard = $("#pvCard"), pvStage = $("#pvStage"), pcanvas = $("#pvCanvas"), ppoints = $("#pvPoints"), pfall = $("#pvFallback");
  var pano = null, pvIdx = -1, scenes = [], cur = null, pvState = "closed", hs = [], pvOpener = null, hintT, closeT;

  function ptsFor(sc, i) {
    var n = scenes.length;
    if (sc.puntos && sc.puntos.length) return sc.puntos.map(function (p) { var t = null; scenes.forEach(function (s, j) { if (!t && (s.nombre === p.a || j === p.a)) t = j; }); return t == null ? null : { to: t, texto: p.texto || scenes[t].nombre, yaw: p.yaw, pitch: p.pitch || 0 }; }).filter(Boolean);
    var out = [];   // botones automáticos: uno por cada otra escena, repartidos alrededor
    for (var j = 0; j < n; j++) { if (j === i) continue; var yaw = ((j - i + n) % n) * 360 / n; if (yaw > 180) yaw -= 360; out.push({ to: j, texto: scenes[j].nombre, yaw: yaw, pitch: -3 }); }
    return out;
  }
  /* Los botones se colocan en el BORDE de la imagen, en la dirección real hacia cada escena (así nunca tapan el centro) */
  function placeHotspots(pn) {
    var W = pn._w, H = pn._h, padX = 12, padTop = 58, padBot = 58, items = [], i, j, k;
    for (i = 0; i < hs.length; i++) {
      var h = hs[i]; if (!h.w) { h.w = h.el.offsetWidth || 100; h.h = h.el.offsetHeight || 34; }
      var r = pn.project(h.p.yaw, h.p.pitch);
      var x0 = padX + h.w / 2, x1 = W - padX - h.w / 2, y0 = padTop + h.h / 2, y1 = H - padBot - h.h / 2;
      var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, ax = Math.max(1, (x1 - x0) / 2), ay = Math.max(1, (y1 - y0) / 2);
      var vx = (W / 2 + r.nx * W / 2) - cx, vy = (H / 2 - r.ny * H / 2) - cy;
      if (Math.abs(vx) < 4 && Math.abs(vy) < 4) { vx = (i - 1) * 24; vy = -40; }
      var t = Math.max(Math.abs(vx) / ax, Math.abs(vy) / ay);
      items.push({ h: h, x: cx + vx / t, y: cy + vy / t, x0: x0, x1: x1, y0: y0, y1: y1 });
    }
    for (k = 0; k < 6; k++) for (i = 0; i < items.length; i++) for (j = i + 1; j < items.length; j++) {
      var a = items[i], b = items[j], ox = (a.h.w + b.h.w) / 2 + 8 - Math.abs(a.x - b.x), oy = (a.h.h + b.h.h) / 2 + 8 - Math.abs(a.y - b.y);
      if (ox > 0 && oy > 0) {
        if (oy <= ox) { var dy = a.y <= b.y ? -1 : 1; a.y += dy * oy / 2; b.y -= dy * oy / 2; } else { var dx = a.x <= b.x ? -1 : 1; a.x += dx * ox / 2; b.x -= dx * ox / 2; }
        a.x = Math.min(a.x1, Math.max(a.x0, a.x)); a.y = Math.min(a.y1, Math.max(a.y0, a.y)); b.x = Math.min(b.x1, Math.max(b.x0, b.x)); b.y = Math.min(b.y1, Math.max(b.y0, b.y));
      }
    }
    items.forEach(function (it) {
      var e2 = it.h.el; if (!e2._placed) e2.style.transition = "none";
      e2.style.transform = "translate(" + it.x.toFixed(1) + "px," + it.y.toFixed(1) + "px) translate(-50%,-50%)"; e2.classList.add("is-visible");
      if (!e2._placed) { void e2.offsetWidth; e2.style.transition = ""; e2._placed = true; }
    });
  }
  function renderPoints() {
    ppoints.innerHTML = ""; hs = []; if (!cur) return;
    ptsFor(cur, scenes.indexOf(cur)).forEach(function (p) {
      var b = el("button", "hs", "<i></i><span>" + esc(p.texto) + "</span>"); b.type = "button"; b.setAttribute("aria-label", "Ir a " + p.texto);
      b.addEventListener("click", function () { goTo(p); }); ppoints.appendChild(b); hs.push({ el: b, p: p });
    });
  }

  /* Avisito de cómo moverse (web: mouse · móvil: dedos · giroscopio: celular) */
  function showHint(txt, ms) { clearTimeout(hintT); $("#pvHintText").textContent = txt; $("#pvHint").classList.add("show"); hintT = setTimeout(hideHint, ms || 6500); }
  function hideHint() { clearTimeout(hintT); $("#pvHint").classList.remove("show"); }
  // ✏️ TEXTOS DEL AVISO (cámbialos aquí): web / móvil / giroscopio
  var HINT_WEB = "Mueve con el mouse para recorrer", HINT_TOUCH = "Mueve con tus dedos para recorrer", HINT_GYRO = "Mueve tu celular para recorrer";
  pcanvas.addEventListener("pointerdown", hideHint);

  function initPano() {
    if (!pano && window.Pano) {
      pano = new Pano(pcanvas);
      if (pano.ok) {
        pano.onFrame = function (pn) { if (pvState === "tour" || pvState === "starting") placeHotspots(pn); };
        if (/[?&]editar/.test(location.search)) pano.onTap = function (yaw, pitch) { toast("yaw: " + yaw + "  ·  pitch: " + pitch + "  (cópialos en config.js)"); console.log("yaw:", yaw, "pitch:", pitch); };
      } else pano = null;
    }
    pcanvas.classList.remove("is-ready"); pfall.classList.remove("is-ready");
    if (pano) {
      ppoints.classList.remove("pv__points--static"); pcanvas.hidden = false; pfall.hidden = true; pvState = "starting";
      pano.autoRotate = 0; pano.show(cur.imagen, cur.mirarYaw || 0, cur.mirarPitch || 0, cur.angulo).then(function () {
        if (pvState === "closed") return;
        pcanvas.classList.add("is-ready"); renderPoints(); pano.intro(); pvState = "tour";
        setTimeout(function () { if (pvState === "tour") showHint(isTouchUI() ? HINT_TOUCH : HINT_WEB); }, 1500);
      }).catch(function (err) { console.warn("No se pudo iniciar el 360:", err); if (location.protocol === "file:") toast("Para ver el 360° abre el proyecto con Live Server (ver LEEME.md)."); fallback(); });
    } else fallback();
  }
  function fallback() {   // sin WebGL: se ve la foto y botones para cambiar de escena
    pano = null; pvState = "tour"; pcanvas.hidden = true; pfall.hidden = false; pfall.src = src(cur.imagen); pfall.onload = function () { pfall.classList.add("is-ready"); };
    ppoints.classList.add("pv__points--static"); ppoints.innerHTML = "";
    scenes.forEach(function (s) { var b = el("button", "hs is-visible", "<i></i><span>" + esc(s.nombre) + "</span>"); b.type = "button"; b.addEventListener("click", function () { cur = s; pfall.src = src(s.imagen); $("#pvTitle").dataset.scene = s.nombre; }); ppoints.appendChild(b); });
  }

  function goTo(p) {
    var next = scenes[p.to]; if (!next || !pano || pvState !== "tour") return;
    pvState = "travel"; hideHint(); ppoints.classList.add("off"); $("#pvFlash").classList.add("on");
    pano.travel(next.imagen, { lookYaw: p.yaw, lookPitch: p.pitch, yaw: next.mirarYaw || 0, pitch: next.mirarPitch || 0, angulo: next.angulo }).then(function () {
      cur = next; renderPoints(); ppoints.classList.remove("off"); $("#pvFlash").classList.remove("on"); pvState = "tour";
    }).catch(function () { ppoints.classList.remove("off"); $("#pvFlash").classList.remove("on"); pvState = "tour"; toast("No se pudo cargar esa vista."); });
  }

  function openViewer(idx, fromEl) {
    var p = K.propiedades[idx]; if (!p || !p.escenas || !p.escenas.length || pvState !== "closed") return;
    hideCoach(); clearTimeout(closeT);
    pvIdx = idx; scenes = p.escenas; cur = scenes[0]; pvOpener = fromEl || null;
    $("#pvTitle").textContent = p.nombre; $("#pvLoc").textContent = p.ubicacion;
    $("#pvCart").setAttribute("data-cart", p.nombre); $("#pvAsk").href = wa(K.mensajes.propiedad.replace("{propiedad}", p.nombre));
    $("#pvGyroText").textContent = "Giroscopio"; $("#pvGyro").classList.remove("is-on");
    renderCart();
    pv.hidden = false; document.documentElement.classList.add("no-scroll"); updSticky();
    if (fromEl) {   // la ventana "crece" desde la tarjeta que tocaste
      var a = fromEl.getBoundingClientRect(), b = pvCard.getBoundingClientRect();
      pvCard.style.transformOrigin = (a.left + a.width / 2 - b.left) + "px " + (a.top + a.height / 2 - b.top) + "px";
    }
    requestAnimationFrame(function () { requestAnimationFrame(function () { pv.classList.add("open"); }); });
    pvState = "starting"; setTimeout(initPano, 60);
    $("#pvClose").focus({ preventScroll: true });
  }
  function closeViewer() {
    if (pvState === "closed") return;
    pvState = "closed"; hideHint(); pv.classList.remove("open");
    if (pano) { pano.interactive = false; pano.disableGyro(); pano.texA = null; }
    if (document.fullscreenElement) document.exitFullscreen();
    document.documentElement.classList.remove("no-scroll"); ppoints.innerHTML = ""; hs = [];
    closeT = setTimeout(function () { pv.hidden = true; updSticky(); if (pvOpener && pvOpener.focus) pvOpener.focus({ preventScroll: true }); }, 480);
  }
  $("#pvClose").addEventListener("click", closeViewer);
  $("#pvBackdrop").addEventListener("click", closeViewer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && pvState !== "closed") closeViewer(); });
  $("#pvCart").addEventListener("click", function () { toggleCart(K.propiedades[pvIdx].nombre); var b = $("#pvCart"); b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); });
  $("#pvFull").addEventListener("click", function () { if (document.fullscreenElement) document.exitFullscreen(); else if (pvStage.requestFullscreen) pvStage.requestFullscreen(); });
  /* Giroscopio: SOLO móvil (en web el botón no existe) */
  var gyroBtn = $("#pvGyro");
  if ("DeviceOrientationEvent" in window && window.matchMedia("(hover: none)").matches) gyroBtn.hidden = false;
  gyroBtn.addEventListener("click", function () {
    if (!pano) return;
    if (pano.hasGyro()) { pano.disableGyro(); gyroBtn.classList.remove("is-on"); $("#pvGyroText").textContent = "Giroscopio"; toast("Giroscopio desactivado."); return; }
    pano.enableGyro().then(function (ok) {
      if (ok) { gyroBtn.classList.add("is-on"); $("#pvGyroText").textContent = "Giroscopio activo"; showHint(HINT_GYRO, 5000); } else toast("No se pudo activar el giroscopio en este dispositivo.");
    });
  });

  /* ───────── AVISO TUTORIAL del mini e-commerce ───────── */
  var coach = $("#coach"), coachState = "idle";   // idle → shown → gone
  function showCoach() { if (coachState !== "idle") return; coachState = "shown"; coach.hidden = false; requestAnimationFrame(function () { requestAnimationFrame(function () { coach.classList.add("show"); }); }); }
  function hideCoach() { if (coachState !== "shown") return; coachState = "gone"; coach.classList.remove("show"); setTimeout(function () { coach.hidden = true; }, 520); }
  $("#coachX").addEventListener("click", function (e) { e.stopPropagation(); hideCoach(); });
  document.addEventListener("click", function (e) { if (coachState === "shown" && !e.target.closest("#coach")) hideCoach(); });   // clic en cualquier otro lugar → se va

  /* ═════════════ BUSCADOR + PREGUNTAS FRECUENTES (Google Sheets opcional) ═════════════ */
  var catalog = K.propiedades.map(function (p) { return { nombre: p.nombre, idx: K.propiedades.indexOf(p), disponible: p.disponible !== false, palabrasClave: p.palabrasClave + "," + p.nombre + "," + p.ubicacion, descripcion: p.descripcion || "", respuesta: "" }; });
  var faqs = K.preguntasLocal.slice(), busqueda = K.busqueda.slice();

  function parseCSV(text) {
    var rows = [], row = [], cur2 = "", q = false, i, ch;
    for (i = 0; i < text.length; i++) {
      ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur2 += '"'; i++; } else q = false; } else cur2 += ch; }
      else if (ch === '"') q = true; else if (ch === ",") { row.push(cur2); cur2 = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cur2); rows.push(row); row = []; cur2 = ""; }
      else cur2 += ch;
    }
    if (cur2 || row.length) { row.push(cur2); rows.push(row); }
    if (!rows.length) return [];
    var head = rows.shift().map(function (h) { return norm(h).replace(/ /g, "_"); });
    return rows.filter(function (r) { return r.join("").trim(); }).map(function (r) { var o = {}; head.forEach(function (h, k) { o[h] = (r[k] || "").trim(); }); return o; });
  }
  function loadSheet(u) { return fetch(u, { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(parseCSV); }
  function pick(r, names) { for (var i = 0; i < names.length; i++) if (r[names[i]]) return r[names[i]]; return ""; }
  function propIndex(name) { var f = -1; K.propiedades.forEach(function (p, i) { if (f < 0 && (sameName(p.nombre, name))) f = i; }); return f; }

  if (K.sheetPropiedades) loadSheet(K.sheetPropiedades).then(function (rows) {
    var fs = [];
    rows.forEach(function (r) {
      var name = pick(r, ["propiedad", "nombre", "producto"]); if (!name) return;
      var loc = null; catalog.forEach(function (l) { if (!loc && sameName(l.nombre, name)) loc = l; });
      var yes = /^(si|true|1|x|disponible|yes|activo|ok)/.test(norm(pick(r, ["disponible", "disponibilidad", "estado"])));
      fs.push({ nombre: loc ? loc.nombre : name, idx: loc ? loc.idx : -1, disponible: yes, palabrasClave: (pick(r, ["palabras_clave", "palabras"]) || (loc ? loc.palabrasClave : "")) + "," + name, descripcion: pick(r, ["descripcion"]) || (loc ? loc.descripcion : ""), respuesta: pick(r, ["respuesta"]), fromSheet: true });
    });
    if (fs.length) catalog = fs.concat(catalog.filter(function (l) { return !fs.some(function (f) { return sameName(f.nombre, l.nombre); }); }));
  }).catch(function (e) { console.warn("Hoja de propiedades no disponible, uso la lista local.", e); });
  if (K.sheetPreguntas) loadSheet(K.sheetPreguntas).then(function (rows) {
    var fs = []; rows.forEach(function (r) { var q = pick(r, ["pregunta", "preguntas"]), a = pick(r, ["respuesta", "respuestas"]); if (q && a) fs.push({ pregunta: q, palabrasClave: pick(r, ["palabras_clave", "palabras"]), respuesta: a, fromSheet: true }); });
    if (fs.length) faqs = fs.concat(faqs.filter(function (l) { return !fs.some(function (f) { return norm(f.pregunta) === norm(l.pregunta); }); }));
  }).catch(function (e) { console.warn("Hoja de preguntas no disponible.", e); });
  if (K.sheetBusqueda) loadSheet(K.sheetBusqueda).then(function (rows) {
    var rs = [];
    rows.forEach(function (r) {
      var res = []; [1, 2].forEach(function (n) { var p = r["propiedad_" + n]; if (p) res.push({ propiedad: p, titulo: r["titulo_" + n] || "", descripcion: r["descripcion_" + n] || "" }); });
      if (res.length) rs.push({ intereses: r.intereses || "", resultados: res });
    });
    if (rs.length) busqueda = rs;
  }).catch(function (e) { console.warn("Hoja de búsqueda no disponible.", e); });

  function score(q, terms) {
    var qt = q.split(" ").filter(function (t) { return t.length > 1; }), best = 0;
    terms.forEach(function (raw) {
      var t = norm(raw); if (!t) return;
      if (t === q) best = Math.max(best, 100); else if (q.length > 2 && t.indexOf(q) > -1) best = Math.max(best, 80); else if (t.length > 2 && q.indexOf(t) > -1) best = Math.max(best, 70);
      else { var tt2 = t.split(" "), sh = qt.filter(function (w) { return tt2.some(function (x) { return x === w || (w.length >= 4 && x.length >= 4 && x.slice(0, 5) === w.slice(0, 5)); }); }).length; if (sh) best = Math.max(best, 40 + sh * 10); }
    });
    return best;
  }
  function search(query) {
    var q = norm(query), prods = [], bestF = null, fs = 0;
    catalog.forEach(function (s) { var sc = score(q, String(s.palabrasClave).split(",")); if (sc && s.fromSheet) sc += 25; if (sc >= 40) prods.push({ s: s, sc: sc }); });
    faqs.forEach(function (f) { var sc = score(q, [f.pregunta].concat(String(f.palabrasClave).split(","))); if (sc && f.fromSheet) sc += 25; if (sc > fs) { fs = sc; bestF = f; } });
    prods.sort(function (a, b) { return b.sc - a.sc; });
    if (bestF && fs >= 40 && (!prods.length || fs > prods[0].sc)) return { faq: bestF };
    return prods.length ? { prods: prods.filter(function (p) { return p.sc >= prods[0].sc - 20; }).slice(0, 3).map(function (p) { return p.s; }) } : null;
  }

  var chat = $("#chat"), chips = $("#chips"), input = $("#searchInput"), sbtn = $("#searchBtn"), answered = false, lastQ = "", ct;
  K.sugerencias.forEach(function (s) { var b = el("button", "chip", esc(s)); b.type = "button"; b.addEventListener("click", function () { input.value = s; run(s); }); chips.appendChild(b); });
  function reset() { clearTimeout(ct); answered = false; lastQ = ""; input.value = ""; sbtn.textContent = "Buscar"; chat.innerHTML = ""; chat.appendChild(chips); }
  function advisorLink() { return '<a class="chip" target="_blank" rel="noopener" href="' + esc(wa(K.mensajes.asesor)) + '">Hablar con un asesor</a>'; }
  function run(q) {
    q = q.trim(); if (!q) { input.focus(); return; }
    clearTimeout(ct); answered = true; lastQ = q; sbtn.textContent = "Borrar"; chat.innerHTML = "";
    chat.appendChild(el("div", "msg msg--user", esc(q)));
    var ty = el("div", "msg msg--bot msg--typing", "<i></i><i></i><i></i>"); chat.appendChild(ty);
    ct = setTimeout(function () {
      ty.remove(); var hit = search(q), html = "";
      if (!hit) html = esc(K.sinResultado) + '<div class="msg__actions">' + advisorLink() + "</div>";
      else if (hit.faq) html = esc(hit.faq.respuesta) + '<div class="msg__actions">' + advisorLink() + "</div>";
      else {
        html = hit.prods.length > 1 ? "Estas propiedades pueden interesarte:<br>" : "";
        hit.prods.forEach(function (s) {
          if (s.respuesta) html += "<div>" + esc(s.respuesta) + "</div>";
          else if (s.disponible) html += '<div style="margin-top:6px"><strong>' + esc(s.nombre) + "</strong>. " + esc(s.descripcion) + '<div class="msg__actions"><button class="chip" type="button" data-cart="' + esc(s.nombre) + '" aria-pressed="false">Agregar a mi consulta</button>' + (s.idx > -1 ? '<button class="chip" type="button" data-view="' + s.idx + '">Recorrer en 360°</button>' : "") + "</div></div>";
          else html += '<div style="margin-top:6px"><strong>' + esc(s.nombre) + "</strong> no está disponible por ahora. Escríbenos y te mostramos opciones similares.</div>";
        });
        html += '<div class="msg__actions">' + advisorLink() + "</div>";
      }
      var bot = el("div", "msg msg--bot", html);
      $$("[data-cart]", bot).forEach(function (b) { b.addEventListener("click", function () { toggleCart(b.getAttribute("data-cart")); }); });
      $$("[data-view]", bot).forEach(function (b) { b.addEventListener("click", function (e) { e.stopPropagation(); openViewer(+b.getAttribute("data-view"), b); }); });
      var back = el("div", "msg msg--back", '<button type="button">Volver</button>'); back.addEventListener("click", reset);
      chat.appendChild(bot); chat.appendChild(back); renderCart();
    }, 600);
  }
  $("#searchForm").addEventListener("submit", function (e) { e.preventDefault(); run(input.value); });
  sbtn.addEventListener("click", function (e) { if (answered && input.value.trim() === lastQ) { e.preventDefault(); reset(); } });
  input.addEventListener("input", function () { if (answered && input.value.trim() !== lastQ) sbtn.textContent = "Buscar"; });

  /* ═════════════ TU EQUIPO DE CONFIANZA (videos de YouTube) ═════════════ */
  function ytId(u) { var m = String(u || "").match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m ? m[1] : ""; }
  function hasVideo(v) { return !!(ytId(v.youtube) || v.src); }
  function ytCmd(f, fn) { try { f.contentWindow.postMessage(JSON.stringify({ event: "command", func: fn, args: [] }), "*"); } catch (e) {} }
  function setSound(m, on) { if (!m) return; if (m.tagName === "IFRAME") [0, 300, 900, 2000].forEach(function (t) { setTimeout(function () { ytCmd(m, on ? "unMute" : "mute"); ytCmd(m, "playVideo"); }, t); }); else m.muted = !on; }
  function makeMedia(v, o) {
    o = o || {}; var id = ytId(v.youtube);
    if (id) { var f = document.createElement("iframe"); f.src = "https://www.youtube.com/embed/" + id + "?autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1&loop=1&playlist=" + id; f.title = v.titulo || "Video"; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; return f; }
    var m = document.createElement("video"); m.src = v.src; if (v.poster) m.poster = v.poster; m.setAttribute("playsinline", ""); m.preload = "metadata"; m.loop = !!o.loop; m.muted = !!o.muted; m.controls = !!o.controls; return m;
  }
  var row = $("#tipsRow"), tips = [], noVid = "Agrega el link de YouTube de este video en js/config.js (equipo).";
  K.equipo.slice(0, 3).forEach(function (v, i) {
    var it = el("div", "tip", '<img src="' + esc(src(v.poster)) + '" alt="' + esc(v.titulo) + '" loading="lazy"><span class="play">' + icon("play") + "</span>");
    it.tabIndex = 0; it.setAttribute("role", "button"); it.setAttribute("aria-label", "Ver " + v.titulo);
    var act = function () { if (!hasVideo(v)) { toast(noVid); return; } if (!canHover || window.innerWidth < 900) openFeed(i); else playHere(it, v); };
    it.addEventListener("click", act); it.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
    row.appendChild(it); tips.push(it);
  });
  function stopHere(it) { var m = $("video,iframe", it); if (m) m.remove(); var s = $(".snd", it); if (s) s.remove(); it.classList.remove("is-playing"); }
  function playHere(it, v) {
    if (it.classList.contains("is-playing")) return; tips.forEach(stopHere);
    var m = makeMedia(v, { controls: true }); it.appendChild(m); it.classList.add("is-playing");
    if (m.tagName === "IFRAME") { var on = false, b = el("button", "snd", icon("mute") + "<span>Activar sonido</span>"); b.type = "button"; b.addEventListener("click", function (e) { e.stopPropagation(); on = !on; setSound(m, on); b.innerHTML = icon(on ? "sound" : "mute") + "<span>" + (on ? "Silenciar" : "Activar sonido") + "</span>"; }); it.appendChild(b); }
    if (m.play) { var p = m.play(); if (p && p.catch) p.catch(function () {}); }
  }
  var tipsSeen = false;
  function revealTips() {
    if (tipsSeen) return; tipsSeen = true;
    tips.map(function (_, i) { return i; }).sort(function () { return Math.random() - .5; }).forEach(function (idx, k) {
      var t = tips[idx], s = Math.random() < .5 ? -1 : 1;
      t.style.setProperty("--dx", s * (50 + Math.random() * 90) + "px"); t.style.setProperty("--dr", -s * (8 + Math.random() * 16) + "deg"); t.style.setProperty("--delay", k * 170 + "ms"); t.classList.add("in");
    });
  }
  var feed = $("#feed"), fs = $("#feedScroll"), built = false, fMuted = true, fActive = -1, fct;
  function buildFeed() {
    if (built) return; built = true;
    K.equipo.forEach(function (v, i) {
      var s = el("div", "feed__item", '<img src="' + esc(src(v.poster)) + '" alt="">'); s.setAttribute("data-i", i); var tap = el("div", "feed__tap"); s.appendChild(tap);
      tap.addEventListener("click", function () { var m = $("video", s); if (m) m.paused ? m.play() : m.pause(); }); fs.appendChild(s);
    });
    var end = el("div", "feed__end"); fs.appendChild(end);
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) activate(+e.target.getAttribute("data-i")); }); }, { root: fs, threshold: .65 });
    $$(".feed__item", fs).forEach(function (s) { io.observe(s); });
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && feed.classList.contains("open")) closeFeed(); }); }, { root: fs, threshold: .5 }).observe(end);
    fs.addEventListener("scroll", function () { $("#feedHint").classList.add("gone"); }, { passive: true });
  }
  function clearSlides() { $$(".feed__item video, .feed__item iframe", fs).forEach(function (m) { if (m.pause) m.pause(); m.remove(); }); fActive = -1; }
  function activate(i) {
    if (i === fActive) return; clearSlides(); fActive = i; var v = K.equipo[i], s = $('.feed__item[data-i="' + i + '"]', fs); if (!s || !hasVideo(v)) return;
    var m = makeMedia(v, { muted: fMuted, loop: true }); s.insertBefore(m, $(".feed__tap", s)); if (m.play) { var p = m.play(); if (p && p.catch) p.catch(function () {}); } if (m.tagName === "IFRAME" && !fMuted) setSound(m, true);
  }
  function fSoundUI() { $("#feedSound use").setAttribute("href", fMuted ? "#i-mute" : "#i-sound"); $("#feedSoundText").textContent = fMuted ? "Activar sonido" : "Silenciar"; }
  function openFeed(i) {
    buildFeed(); clearTimeout(fct); fMuted = true; fSoundUI(); feed.hidden = false; document.documentElement.classList.add("no-scroll"); $("#feedHint").classList.remove("gone"); updSticky();
    fs.scrollTo({ top: i * fs.clientHeight }); requestAnimationFrame(function () { feed.classList.add("open"); }); activate(i);
  }
  function closeFeed() { feed.classList.remove("open"); document.documentElement.classList.remove("no-scroll"); fct = setTimeout(function () { feed.hidden = true; clearSlides(); updSticky(); }, 360); }
  $("#feedClose").addEventListener("click", closeFeed);
  $("#feedSound").addEventListener("click", function () { fMuted = !fMuted; fSoundUI(); setSound($(".feed__item video, .feed__item iframe", fs), !fMuted); });

  /* ═════════════ BUSCADOR DE PROPIEDAD IDEAL (sin IA: reglas simples) ═════════════ */
  var fin = $("#finder"), sel = [];
  function step(n) { fin.setAttribute("data-step", n); var r = fin.getBoundingClientRect(); if (r.top < 0 || r.top > 120) fin.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); setTimeout(updSticky, 700); }
  K.intereses.forEach(function (p) {
    var b = el("button", "opt", esc(p)); b.type = "button"; b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () { var i = sel.indexOf(p), on = i < 0; if (on) sel.push(p); else sel.splice(i, 1); b.setAttribute("aria-pressed", on); });
    $("#opts").appendChild(b);
  });
  function choose() {
    if (K.modoDemo || busqueda.length === 1) return busqueda[0];     // 👉 demo: siempre el primero
    var best = busqueda[0], top = -1;
    busqueda.forEach(function (r) { var terms = norm(r.intereses).split(/\s+/), sc = 0; sel.forEach(function (s) { norm(s).split(/\s+/).forEach(function (w) { if (terms.indexOf(w) > -1) sc++; }); }); if (sc > top) { top = sc; best = r; } });
    return best;
  }
  function showResults() {
    var r = choose(), box = $("#results"); box.innerHTML = "";
    r.resultados.slice(0, 2).forEach(function (x, i) {
      var idx = propIndex(x.propiedad), p = K.propiedades[idx];
      var row = el("div", "res"); row.style.setProperty("--i", i);
      var left = p ? makeCard(p, idx) : el("div", "card", '<h3 class="card__name">' + esc(x.propiedad) + "</h3>"); left.classList.add("in");
      var right = el("div", "res__txt", '<h3 class="res__title">' + esc(x.titulo) + '</h3><p class="res__desc">' + esc(x.descripcion) + '</p><a class="res__btn" target="_blank" rel="noopener" href="' + esc(wa(K.mensajes.propiedad.replace("{propiedad}", p ? p.nombre : x.propiedad))) + '">Consultar propiedad</a>');
      row.appendChild(left); row.appendChild(right); box.appendChild(row);
    });
    renderCart();
    $("#fAdvisor").href = wa(K.mensajes.asesor + (sel.length ? "\nMe interesa: " + sel.join(", ") : ""));
    step(2);
  }
  $("#fStart").addEventListener("click", function () { step(1); });
  $("#fBack1").addEventListener("click", function () { step(0); });
  $("#fBack2").addEventListener("click", function () { step(1); });
  $("#fGo").addEventListener("click", function () { if (!sel.length) { toast("Elige al menos una opción para continuar."); return; } showResults(); });

  /* ═════════════ REDES ═════════════ */
  K.redes.forEach(function (r) {
    $("#social").appendChild(el("li", "", '<a href="' + esc(r.url) + '" target="_blank" rel="noopener"><span class="social__ic">' + (r.img ? '<img src="' + esc(src(r.img)) + '" alt="">' : icon(r.icono || "link")) + '</span><span class="social__name">' + esc(r.nombre) + "</span></a>"));
  });

  /* ═════════════ BOTÓN FIJO: dónde se ve y dónde se esconde ═════════════
     Se oculta: viendo el header · viendo los videos · viendo "Estas son las propiedades ideales para ti" · cuando aparece el botón
     de contacto (ahí se "acopla" y deja de seguirte) · mientras hay un visor abierto. */
  var sticky = $("#sticky"), tk = false;
  function visible(elm, ratio) { var r = elm.getBoundingClientRect(), vh = window.innerHeight, v = Math.min(r.bottom, vh) - Math.max(r.top, 0); return v > 0 && v >= ratio * Math.min(r.height, vh); }
  function updSticky() {
    var heroOn = $("#hero").getBoundingClientRect().bottom > window.innerHeight * 0.35;
    var videosOn = visible($("#equipo"), 0.4);
    var resultsOn = fin.getAttribute("data-step") === "2" && visible(fin, 0.3);
    var dockOn = visible($("#advisorStatic"), 0.01);
    var modal = pvState !== "closed" || !feed.hidden;
    var show = !heroOn && !videosOn && !resultsOn && !dockOn && !modal;
    sticky.classList.toggle("show", show); sticky.setAttribute("aria-hidden", show ? "false" : "true"); sticky.tabIndex = show ? 0 : -1;
  }

  /* ═════════════ ANIMACIONES ═════════════ */
  var cardEls = $$(".card", cardsBox), nav = $("#nav");
  if ("IntersectionObserver" in window) {
    var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io2.unobserve(e.target); } }); }, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
    $$(".reveal").forEach(function (n) { io2.observe(n); });
    var cio = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { cardEls.forEach(function (c) { c.classList.add("in"); }); cio.disconnect(); } }, { threshold: .15 });
    cio.observe(cardsBox);
    var tio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { revealTips(); tio.disconnect(); } }, { threshold: .25 }); tio.observe(row);
    var lio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { $("#legalLogo").classList.add("in"); lio.disconnect(); } }, { threshold: .6 }); lio.observe($("#legalLogo"));
    // aviso tutorial: aparece al llegar al mini e-commerce y se va si sales de la sección
    var pio = new IntersectionObserver(function (es) {
      var on = es[0].isIntersecting;
      if (on && coachState === "idle") setTimeout(function () { var r = $("#propiedades").getBoundingClientRect(); if (r.top < window.innerHeight * .6 && r.bottom > window.innerHeight * .3) showCoach(); }, 900);
      if (!on && coachState === "shown") hideCoach();
    }, { threshold: .3 }); pio.observe($("#propiedades"));
  } else { $$(".reveal, .card").forEach(function (n) { n.classList.add("in"); }); revealTips(); $("#legalLogo").classList.add("in"); }
  window.addEventListener("scroll", function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; nav.classList.toggle("is-solid", window.scrollY > 40); updSticky(); }); } }, { passive: true });
  window.addEventListener("resize", updSticky); updSticky();
})();
