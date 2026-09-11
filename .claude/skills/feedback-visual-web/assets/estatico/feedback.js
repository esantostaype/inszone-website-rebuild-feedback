/* ═══════════════════════════════════════════════════════════════════════════
   Zoom modal de imágenes — JavaScript puro, técnica FLIP.
   La imagen crece desde la posición exacta de la miniatura hasta el modal
   y regresa al mismo punto al cerrar. Sin dependencias ni build.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var DURATION = 420;         // debe coincidir con .lb-img.is-animating
  var MARGIN_X = 0.94;        // ancho máximo respecto al viewport
  var MARGIN_Y = 0.88;        // alto máximo respecto al viewport

  var shots = Array.prototype.slice.call(document.querySelectorAll(".shot[data-full]"));
  if (!shots.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ─── Modal (se construye una sola vez) ─── */
  var lb = document.createElement("div");
  lb.className = "lightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "Vista ampliada de la captura");
  lb.innerHTML =
    '<div class="lb-backdrop"></div>' +
    '<button class="lb-close" type="button" aria-label="Cerrar (Esc)">' +
    '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
    "</button>" +
    '<img class="lb-img" alt="" />' +
    '<p class="lb-cap"></p>';
  document.body.appendChild(lb);

  var backdrop = lb.querySelector(".lb-backdrop");
  var closeBtn = lb.querySelector(".lb-close");
  var lbImg = lb.querySelector(".lb-img");
  var lbCap = lb.querySelector(".lb-cap");

  var current = null;   // .shot abierto
  var busy = false;
  var lastFocus = null;

  /* Rectángulo final: la imagen contenida dentro del viewport, centrada. */
  function targetRect(natW, natH) {
    var vw = document.documentElement.clientWidth;
    var vh = document.documentElement.clientHeight;
    var scale = Math.min(vw * MARGIN_X / natW, vh * MARGIN_Y / natH);
    var w = Math.round(natW * scale);
    var h = Math.round(natH * scale);
    return { width: w, height: h, left: Math.round((vw - w) / 2), top: Math.round((vh - h) / 2) };
  }

  /* Bloqueo del scroll SIN tocar el overflow: así la barra no desaparece y el
     ancho del viewport no cambia ni un pixel al abrir el modal (con overflow
     hidden el navegador descarta el gutter, y compensar con padding desplaza
     el contenido centrado). Se bloquean las entradas de scroll y ya. */
  var SCROLL_KEYS = { " ": 1, PageUp: 1, PageDown: 1, End: 1, Home: 1, ArrowUp: 1, ArrowDown: 1 };

  function blockEvent(e) { e.preventDefault(); }
  function blockKeys(e) { if (SCROLL_KEYS[e.key]) e.preventDefault(); }

  function lockScroll() {
    document.documentElement.classList.add("is-locked");
    window.addEventListener("wheel", blockEvent, { passive: false });
    window.addEventListener("touchmove", blockEvent, { passive: false });
    window.addEventListener("keydown", blockKeys);
  }

  function unlockScroll() {
    document.documentElement.classList.remove("is-locked");
    window.removeEventListener("wheel", blockEvent, { passive: false });
    window.removeEventListener("touchmove", blockEvent, { passive: false });
    window.removeEventListener("keydown", blockKeys);
  }

  /* Transform que lleva el rect final al rect de la miniatura. */
  function flipTransform(from, to) {
    var sx = from.width / to.width;
    var sy = from.height / to.height;
    return "translate(" + (from.left - to.left) + "px," + (from.top - to.top) + "px) scale(" + sx + "," + sy + ")";
  }

  function place(rect) {
    lbImg.style.left = rect.left + "px";
    lbImg.style.top = rect.top + "px";
    lbImg.style.width = rect.width + "px";
    lbImg.style.height = rect.height + "px";
  }

  function open(shot) {
    if (busy || current) return;
    var thumb = shot.querySelector("img");
    if (!thumb) return;

    busy = true;
    current = shot;
    lastFocus = document.activeElement;

    var natW = thumb.naturalWidth || thumb.clientWidth;
    var natH = thumb.naturalHeight || thumb.clientHeight;
    var from = thumb.getBoundingClientRect();
    lockScroll();
    var to = targetRect(natW, natH);

    lbImg.src = shot.getAttribute("data-full");
    lbImg.alt = thumb.alt || "";
    var cap = shot.getAttribute("data-caption-" + lang()) || "";
    lbCap.textContent = cap;
    lbCap.style.display = cap ? "" : "none";

    place(to);
    lbImg.classList.remove("is-animating");
    lbImg.style.transform = flipTransform(from, to);

    lb.classList.add("is-active");
    shot.classList.add("is-hidden");           // evita ver dos copias durante el vuelo

    // reflow para que el transform inicial se aplique antes de la transición
    void lbImg.offsetWidth;

    if (!reduce) lbImg.classList.add("is-animating");
    lb.classList.add("is-open");
    lbImg.style.transform = "none";

    window.setTimeout(function () {
      busy = false;
      closeBtn.focus();
    }, reduce ? 0 : DURATION);
  }

  function close() {
    if (busy || !current) return;
    busy = true;

    var shot = current;
    var thumb = shot.querySelector("img");
    var from = thumb.getBoundingClientRect();
    var to = {
      left: parseFloat(lbImg.style.left),
      top: parseFloat(lbImg.style.top),
      width: parseFloat(lbImg.style.width),
      height: parseFloat(lbImg.style.height)
    };

    // ¿la miniatura sigue visible? si no, solo se desvanece
    var visible = from.width > 0 && from.bottom > 0 && from.top < window.innerHeight;

    lb.classList.remove("is-open");
    if (!reduce && visible) {
      lbImg.classList.add("is-animating");
      lbImg.style.transform = flipTransform(from, to);
    }

    window.setTimeout(function () {
      lb.classList.remove("is-active");
      lbImg.classList.remove("is-animating");
      lbImg.removeAttribute("src");
      lbImg.style.transform = "none";
      shot.classList.remove("is-hidden");
      unlockScroll();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
      current = null;
      busy = false;
    }, reduce || !visible ? 0 : DURATION);
  }

  /* ─── Enlaces ─── */
  function lang() { return document.documentElement.lang === "en" ? "en" : "es"; }

  /* Etiquetas accesibles en el idioma activo; se rehacen al cambiarlo. */
  function refreshLabels() {
    var l = lang();
    var prefix = l === "en" ? "Enlarge screenshot: " : "Ampliar captura: ";
    closeBtn.setAttribute("aria-label", l === "en" ? "Close (Esc)" : "Cerrar (Esc)");
    lb.setAttribute("aria-label", l === "en" ? "Enlarged view of the screenshot" : "Vista ampliada de la captura");
    shots.forEach(function (shot) {
      shot.setAttribute("aria-label", prefix + (shot.getAttribute("data-caption-" + l) || ""));
    });
    if (current) lbCap.textContent = current.getAttribute("data-caption-" + l) || "";
  }

  document.addEventListener("langchange", refreshLabels);

  shots.forEach(function (shot) {
    shot.setAttribute("tabindex", "0");
    shot.setAttribute("role", "button");
    shot.addEventListener("click", function () { open(shot); });
    shot.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(shot); }
    });
  });

  refreshLabels();

  backdrop.addEventListener("click", close);
  lbImg.addEventListener("click", close);
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && current) close();
  });

  /* Recalcula el encuadre si cambia el tamaño de la ventana con el modal abierto. */
  var rt;
  window.addEventListener("resize", function () {
    if (!current || busy) return;
    window.clearTimeout(rt);
    rt = window.setTimeout(function () {
      var natW = lbImg.naturalWidth, natH = lbImg.naturalHeight;
      if (!natW || !natH) return;
      lbImg.classList.remove("is-animating");
      place(targetRect(natW, natH));
    }, 120);
  });
})();

/* ═══════════════════════════════════════════════════════════════════════════
   Scroll suave — lerp sobre el scroll nativo de la ventana.
   Se hace con la rueda del mouse; el teclado, la barra y el táctil siguen
   funcionando como siempre. Sin librerías: mantiene el sidebar sticky, que es
   justo lo que rompen las soluciones basadas en transform (Locomotive, etc.).
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(hover: none)").matches) return;   // táctil: inercia nativa

  var EASE = 0.14;
  var target = window.scrollY;
  var current = target;
  var running = false;

  function maxScroll() {
    return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  }

  function jump(y) {
    window.scrollTo({ top: y, behavior: "instant" });
  }

  function loop() {
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.5) {
      current = target;
      running = false;
      jump(Math.round(current));
      return;
    }
    jump(current);
    window.requestAnimationFrame(loop);
  }

  window.addEventListener("wheel", function (e) {
    if (e.ctrlKey) return;                                   // zoom del navegador
    if (document.documentElement.classList.contains("is-locked")) return;   // modal abierto
    e.preventDefault();
    var delta = e.deltaY * (e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? window.innerHeight : 1);
    target = Math.min(Math.max(0, target + delta), maxScroll());
    if (!running) {
      running = true;
      current = window.scrollY;
      window.requestAnimationFrame(loop);
    }
  }, { passive: false });

  window.addEventListener("scroll", function () {
    if (!running) target = window.scrollY;                   // teclado, barra, anclas
  }, { passive: true });

  window.addEventListener("resize", function () {
    target = Math.min(target, maxScroll());
  });
})();
