/* =====================================================================
   PANO.JS · Visor 360° propio (WebGL puro, sin librerías, gratis)
   ---------------------------------------------------------------------
   ⚠️ No necesitas tocar este archivo. Aquí vive la magia del recorrido:
   - arrastrar con el dedo / mouse, zoom, giroscopio
   - acepta fotos 360 completas (2:1) Y panorámicas normales del celular
   - transición "adentrarse": la cámara avanza hacia el punto elegido y
     se abre un portal que revela el nuevo ambiente (efecto parallax)
   ===================================================================== */
(function () {
  "use strict";
  var RAD = Math.PI / 180, TAU = Math.PI * 2;

  var VERT = "attribute vec2 p; varying vec2 vP; void main(){ vP = p; gl_Position = vec4(p,0.,1.); }";
  var FRAG = [
    "#ifdef GL_FRAGMENT_PRECISION_HIGH", "precision highp float;", "#else", "precision mediump float;", "#endif",
    "uniform sampler2D uA; uniform sampler2D uB;",
    "uniform float uYaw, uPitch, uTan, uYawB, uPitchB, uTanB, uAsp, uPortal, uGlow;",
    "uniform vec2 uSpanA, uSpanB;",
    "varying vec2 vP;",
    "vec4 scene(sampler2D t, float yaw, float pitch, float tn, vec2 span){",
    "  vec3 r = normalize(vec3(vP.x*uAsp*tn, vP.y*tn, 1.0));",
    "  float cp = cos(pitch), sp = sin(pitch);",
    "  float y = r.y*cp + r.z*sp; float z = -r.y*sp + r.z*cp; float x = r.x;",
    "  float cy = cos(yaw), sy = sin(yaw);",
    "  float x2 = x*cy + z*sy; float z2 = -x*sy + z*cy;",
    "  float lon = atan(x2, z2); float lat = asin(clamp(y,-1.0,1.0));",
    "  vec2 uv = vec2(lon/span.x + 0.5, 0.5 - lat/span.y);",
    "  vec4 c = texture2D(t, uv);",
    "  vec2 d = abs(uv - 0.5) * 2.0;",
    "  c.rgb *= mix(0.15, 1.0, 1.0 - smoothstep(0.985, 1.0, max(d.x, d.y)));",   // fuera de la foto (panorámicas parciales)
    "  return c;",
    "}",
    "void main(){",
    "  vec4 col = scene(uA, uYaw, uPitch, uTan, uSpanA);",
    "  if (uPortal > 0.0) {",
    "    float d = length(vec2(vP.x*uAsp, vP.y));",
    "    float m = 1.0 - smoothstep(uPortal*0.72, uPortal, d);",
    "    vec4 nb = scene(uB, uYawB, uPitchB, uTanB, uSpanB);",
    "    col = mix(col, nb, m);",
    "    float rim = smoothstep(uPortal*0.5, uPortal*0.88, d) * (1.0 - smoothstep(uPortal*0.88, uPortal*1.1, d));",
    "    col.rgb += rim * 0.28;",
    "  }",
    "  col.rgb = mix(col.rgb, vec3(1.0), uGlow);",
    "  gl_FragColor = vec4(col.rgb, 1.0);",
    "}"
  ].join("\n");

  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function wrapPI(a) { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; }

  function Pano(canvas) {
    var self = this;
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl", { antialias: false, alpha: false }) || canvas.getContext("experimental-webgl");
    this.ok = !!this.gl;
    this.yaw = 0; this.pitch = 0; this.fov = 70 * RAD;           // fov = vertical, en radianes
    this.minFov = 32 * RAD; this.maxFov = 100 * RAD; this.baseFov = 70 * RAD;
    this.autoRotate = 0; this.interactive = false;
    this.onFrame = null; this.onTap = null;
    this.spanA = [TAU, Math.PI]; this.spanB = [TAU, Math.PI];
    this.camB = { yaw: 0, pitch: 0, fov: this.fov }; this.portal = -1; this.glow = 0;
    this._vel = { x: 0, y: 0 }; this._drag = null; this._busy = false;
    this._tex = {}; this._meta = {}; this._gyro = null; this._w = 1; this._h = 1;
    if (!this.ok) return;

    var gl = this.gl, prog = gl.createProgram();
    [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG]].forEach(function (s) {
      var sh = gl.createShader(s[0]); gl.shaderSource(sh, s[1]); gl.compileShader(sh); gl.attachShader(prog, sh);
    });
    gl.linkProgram(prog); gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    ["uA", "uB", "uYaw", "uPitch", "uTan", "uYawB", "uPitchB", "uTanB", "uAsp", "uPortal", "uGlow", "uSpanA", "uSpanB"].forEach(function (n) { self.u[n] = gl.getUniformLocation(prog, n); });
    gl.uniform1i(this.u.uA, 0); gl.uniform1i(this.u.uB, 1);
    this.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
    this.texA = this.texB = null;

    this._bindEvents(); this.resize();
    window.addEventListener("resize", function () { self.resize(); });
    if (window.ResizeObserver) new ResizeObserver(function () { self.resize(); }).observe(canvas);
    this._loop = this._loop.bind(this); requestAnimationFrame(this._loop);
  }
  var P = Pano.prototype;

  P.resize = function () {
    var c = this.canvas, dpr = Math.min(window.devicePixelRatio || 1, 2), w = c.clientWidth || 1, h = c.clientHeight || 1;
    this._w = w; this._h = h; c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    this.gl.viewport(0, 0, c.width, c.height);
    this.baseFov = (w / h < 1 ? 86 : 66) * RAD;
  };

  /* ---------- texturas ---------- */
  P._makeTex = function (img) {
    var gl = this.gl, w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, src = img;
    var lim = Math.min(this.maxTex, /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 3072 : 4096);
    if (w > lim) {                                   // reduce fotos gigantes para que el celular no se trabe
      var c = document.createElement("canvas"); c.width = lim; c.height = Math.round(lim * h / w);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); src = c;
    }
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this._meta[img.src] = { w: w, h: h };
    return t;
  };
  P.load = function (url) {
    var self = this;
    if (this._tex[url]) return Promise.resolve(this._tex[url]);
    return new Promise(function (res, rej) {
      var img = new Image(); img.crossOrigin = "anonymous";
      img.onload = function () {
        try { var t = self._makeTex(img); self._tex[url] = t; self._meta[url] = { w: img.naturalWidth, h: img.naturalHeight }; res(t); } catch (e) { rej(e); }
      };
      img.onerror = function () { rej(new Error("No se pudo cargar " + url)); };
      img.src = url;
    });
  };
  /* Cobertura de la foto: 360 completa (2:1) o panorámica parcial del celular (ángulo horizontal "angulo") */
  P._span = function (url, angulo) {
    var m = this._meta[url] || { w: 2, h: 1 }, ar = m.w / m.h;
    if (angulo == null) angulo = (ar > 1.9 && ar < 2.1) ? 360 : 180;
    var lon = Math.min(angulo, 360) * RAD, lat = Math.min(Math.PI, lon / ar);
    return [lon, lat];
  };
  P._free = function (a, b) {
    for (var k in this._tex) if (this._tex[k] !== a && this._tex[k] !== b) { this.gl.deleteTexture(this._tex[k]); delete this._tex[k]; }
  };

  P.show = function (url, yawDeg, pitchDeg, angulo) {
    var self = this;
    return this.load(url).then(function (t) {
      self.texA = t; self.texB = t; self.portal = -1; self.glow = 0; self._free(t, t);
      self.spanA = self.spanB = self._span(url, angulo);
      self.fov = self._base(); self.yaw = (yawDeg || 0) * RAD; self.pitch = (pitchDeg || 0) * RAD; self._limits();
    });
  };

  /* ---------- TRANSICIÓN INMERSIVA: "adentrarse" hacia el punto elegido ---------- */
  P.travel = function (url, o) {
    var self = this; o = o || {};
    if (this._busy) return Promise.resolve();
    this._busy = true; this.interactive = false;
    var from = { yaw: this.yaw, pitch: this.pitch, fov: this.fov };
    var look = { yaw: (o.lookYaw != null ? o.lookYaw * RAD : from.yaw), pitch: (o.lookPitch != null ? o.lookPitch * RAD : from.pitch) };
    var dYaw = wrapPI(look.yaw - from.yaw);
    var next = { yaw: (o.yaw || 0) * RAD, pitch: (o.pitch || 0) * RAD };
    return this.load(url).then(function (tB) {
      self.texB = tB; self.spanB = self._span(url, o.angulo);
      var asp = self._w / self._h, R = Math.sqrt(asp * asp + 1) / .72 * 1.04;       // radio que cubre toda la pantalla
      var t0 = performance.now(), D = 2600;
      return new Promise(function (done) {
        (function step(now) {
          var t = clamp((now - t0) / D, 0, 1);
          // 1) La cámara se centra en el punto y avanza (zoom que se acelera)
          var rot = ease(clamp(t / .42, 0, 1)), a = clamp(t / .8, 0, 1), zoom = Math.pow(a, 2.3);
          self.yaw = from.yaw + dYaw * rot; self.pitch = from.pitch + (look.pitch - from.pitch) * rot;
          self.fov = from.fov * (1 - .8 * zoom);
          // 2) Se abre un portal en el centro que revela el nuevo ambiente
          var p = clamp((t - .16) / .64, 0, 1);
          self.portal = p > 0 ? Math.max(.015, R * Math.pow(p, 1.7)) : -1;
          // 3) El nuevo ambiente "viene hacia ti": empieza lejano y se asienta
          var b = ease(clamp((t - .16) / .84, 0, 1));
          self.camB.yaw = next.yaw - 12 * RAD * (1 - b); self.camB.pitch = next.pitch;
          var bB = self._base(self.spanB); self.camB.fov = Math.min(Math.PI * .8, bB * 1.38) * (1 - b) + bB * b;
          // 4) Destello suave de luz al atravesar
          self.glow = Math.max(0, 1 - Math.abs(t - .6) / .22) * .42;
          if (t < 1) requestAnimationFrame(step);
          else {
            self.texA = tB; self.spanA = self.spanB; self.portal = -1; self.glow = 0;
            self.yaw = next.yaw; self.pitch = next.pitch; self.fov = self._base(); self._free(tB, tB);
            self._busy = false; self.interactive = true; self._limits(); done();
          }
        })(performance.now());
      });
    });
  };

  /* Zoom de apertura cuando empieza el recorrido */
  P.intro = function () {
    var self = this, t0 = performance.now(), D = 1900, f1 = this._base(), f0 = f1 * .55, y0 = this.yaw - 24 * RAD, y1 = this.yaw;
    this._busy = true; this.interactive = false;
    (function step(now) {
      var t = clamp((now - t0) / D, 0, 1), k = 1 - Math.pow(1 - t, 3);
      self.fov = f0 + (f1 - f0) * k; self.yaw = y0 + (y1 - y0) * k;
      if (t < 1) requestAnimationFrame(step); else { self._busy = false; self.interactive = true; }
    })(performance.now());
  };

  P._base = function (span) { span = span || this.spanA; return Math.min(this.baseFov, span[1] * .98); };

  /* ---------- límites (en panorámicas parciales no se puede mirar fuera de la foto) ---------- */
  P._limits = function () {
    this.fov = Math.min(this.fov, this.spanA[1] < Math.PI - .01 ? this.spanA[1] * .98 : this.maxFov);
    var asp = this._w / this._h, hf = 2 * Math.atan(Math.tan(this.fov / 2) * asp), s = this.spanA;
    if (s[0] < TAU - .01) { var my = Math.max(0, s[0] / 2 - hf / 2); this.yaw = clamp(this.yaw, -my, my); }
    var mp = s[1] < Math.PI - .01 ? Math.max(0, s[1] / 2 - this.fov / 2) : 85 * RAD;
    this.pitch = clamp(this.pitch, -mp, mp);
  };

  /* ---------- proyección de los botones flotantes ---------- */
  P.project = function (yawDeg, pitchDeg) {
    var lon = yawDeg * RAD, lat = pitchDeg * RAD, cl = Math.cos(lat);
    var x = cl * Math.sin(lon), y = Math.sin(lat), z = cl * Math.cos(lon);
    var cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    var x1 = x * cy - z * sy, z1 = x * sy + z * cy, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
    var tn = Math.tan(this.fov / 2), asp = this._w / this._h, nx, ny;
    if (z2 > .05) { nx = (x1 / z2) / (tn * asp); ny = (y2 / z2) / tn; }
    else { nx = (x1 >= 0 ? 1 : -1) * 3; ny = (y2 / (Math.abs(x1) + Math.abs(z2) + .2)) / tn; }   // detrás de ti: lo mandamos al lado correspondiente
    return { v: z2 > .05 && Math.abs(nx) < 1.08 && Math.abs(ny) < 1.08, nx: nx, ny: ny, x: (nx * .5 + .5) * this._w, y: (.5 - ny * .5) * this._h };
  };

  /* ---------- dedo, mouse, rueda, pellizco ---------- */
  P._bindEvents = function () {
    var self = this, c = this.canvas;
    c.addEventListener("pointerdown", function (e) {
      if (!self.interactive) return;
      c.setPointerCapture(e.pointerId);
      self._drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false }; self._vel.x = self._vel.y = 0;
    });
    c.addEventListener("pointermove", function (e) {
      var d = self._drag; if (!d) return;
      var dx = e.clientX - d.x, dy = e.clientY - d.y; d.x = e.clientX; d.y = e.clientY;
      if (Math.abs(e.clientX - d.sx) + Math.abs(e.clientY - d.sy) > 6) d.moved = true;
      var k = self.fov / self._h; self._rotate(-dx * k, dy * k); self._vel.x = -dx * k; self._vel.y = dy * k;
    });
    c.addEventListener("pointerup", function (e) {
      var d = self._drag; self._drag = null;
      if (d && !d.moved && self.onTap) {                       // toque sin arrastrar → muestra yaw/pitch (modo ?editar)
        var r = c.getBoundingClientRect(), nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = 1 - ((e.clientY - r.top) / r.height) * 2;
        var tn = Math.tan(self.fov / 2), v = [nx * (r.width / r.height) * tn, ny * tn, 1], n = Math.hypot(v[0], v[1], v[2]);
        v = [v[0] / n, v[1] / n, v[2] / n];
        var cp = Math.cos(self.pitch), sp = Math.sin(self.pitch), y = v[1] * cp + v[2] * sp, z = -v[1] * sp + v[2] * cp, x = v[0];
        var cy = Math.cos(self.yaw), sy = Math.sin(self.yaw), x2 = x * cy + z * sy, z2 = -x * sy + z * cy;
        self.onTap(Math.round(Math.atan2(x2, z2) / RAD), Math.round(Math.asin(y) / RAD));
      }
    });
    c.addEventListener("pointercancel", function () { self._drag = null; });
    c.addEventListener("wheel", function (e) {
      if (!self.interactive) return; e.preventDefault();
      self.fov = clamp(self.fov * (1 + e.deltaY * .0012), self.minFov, self.maxFov); self._limits();
    }, { passive: false });
    var pinch = 0;
    c.addEventListener("touchmove", function (e) {
      if (e.touches.length === 2) {
        var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        if (pinch) { self.fov = clamp(self.fov * (pinch / d), self.minFov, self.maxFov); self._limits(); }
        pinch = d;
      }
    }, { passive: true });
    c.addEventListener("touchend", function () { pinch = 0; });
  };
  P._rotate = function (dy, dp) {
    if (this._gyro) { this._gyro.oy += dy; this._gyro.op += dp; }
    this.yaw += dy; this.pitch += dp; this._limits();
  };

  /* ---------- giroscopio (mover el celular) ---------- */
  P.enableGyro = function () {
    var self = this;
    function start() {
      var first = true;
      self._gyroHandler = function (e) {
        if (e.alpha == null || e.beta == null) return;
        var a = e.alpha * RAD, b = clamp((e.beta - 90) * RAD, -1.3, 1.3);
        if (first) { self._gyro = { oy: self.yaw + a, op: self.pitch - b }; first = false; }
        self._gyro.ty = -a + self._gyro.oy; self._gyro.tp = b + self._gyro.op;
      };
      window.addEventListener("deviceorientation", self._gyroHandler, true);
    }
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      return DeviceOrientationEvent.requestPermission().then(function (r) { if (r === "granted") { start(); return true; } return false; }).catch(function () { return false; });
    }
    start(); return Promise.resolve(true);
  };
  P.disableGyro = function () { window.removeEventListener("deviceorientation", this._gyroHandler, true); this._gyro = null; };
  P.hasGyro = function () { return !!this._gyro; };

  /* ---------- dibujo ---------- */
  P._loop = function () {
    requestAnimationFrame(this._loop);
    if (!this.texA) return;
    if (!this._busy) {
      if (this._gyro && this._gyro.ty != null && !this._drag) {
        this.yaw += wrapPI(this._gyro.ty - this.yaw) * .14; this.pitch += (clamp(this._gyro.tp, -1.3, 1.3) - this.pitch) * .14; this._limits();
      } else if (!this._drag) {
        if (this.autoRotate) {
          this.yaw += this.autoRotate * RAD;
          if (this.spanA[0] < TAU - .01) { var my = Math.max(0, this.spanA[0] / 2 - 1), lim = my; if (Math.abs(this.yaw) >= lim * .98) this.autoRotate = -this.autoRotate; }
          this._limits();
        }
        if (Math.abs(this._vel.x) > 1e-5 || Math.abs(this._vel.y) > 1e-5) { this._rotate(this._vel.x, this._vel.y); this._vel.x *= .93; this._vel.y *= .93; }
      }
    }
    var gl = this.gl, u = this.u, asp = this._w / this._h;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texA);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.texB || this.texA);
    gl.uniform1f(u.uYaw, this.yaw); gl.uniform1f(u.uPitch, this.pitch); gl.uniform1f(u.uTan, Math.tan(this.fov / 2));
    gl.uniform1f(u.uYawB, this.camB.yaw); gl.uniform1f(u.uPitchB, this.camB.pitch); gl.uniform1f(u.uTanB, Math.tan(this.camB.fov / 2));
    gl.uniform1f(u.uAsp, asp); gl.uniform1f(u.uPortal, this.portal); gl.uniform1f(u.uGlow, this.glow);
    gl.uniform2f(u.uSpanA, this.spanA[0], this.spanA[1]); gl.uniform2f(u.uSpanB, this.spanB[0], this.spanB[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (this.onFrame) this.onFrame(this);
  };

  window.Pano = Pano;
})();
