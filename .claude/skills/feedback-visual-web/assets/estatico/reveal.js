/**
 * Scroll reveal.
 *
 * Port a JavaScript plano del script original en TypeScript (Astro): mismas
 * ideas, sin build ni imports — estas páginas se abren con doble clic.
 *
 * Un observer parametrizado por efecto en lugar de tres clases casi idénticas.
 * Los elementos se apuntan con `.reveal-up`, `.reveal-left`, `.reveal-right` o
 * `.reveal-fade`, y reciben `__visible` al entrar en el viewport.
 *
 * Puntos que evitan el jank en páginas largas:
 *   - la cola del stagger es un array, no un `querySelectorAll` en cada frame;
 *   - el elemento se deja de observar apenas se encola, así la lista se achica
 *     a medida que se hace scroll en lugar de crecer;
 *   - `destroy()` desarma los observers;
 *   - `prefers-reduced-motion` corta todo y simplemente muestra el contenido.
 */
(function (global) {
  "use strict";

  var EFFECTS = ["up", "left", "right", "fade", "draw"];

  var DEFAULTS = {
    up: { stagger: 80, threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
    left: { stagger: 80, threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
    right: { stagger: 80, threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
    fade: { stagger: 200, threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
    // Un trazo largo: no hay cola que escalonar, y debería arrancar apenas el
    // diagrama asoma en lugar de esperar a estar 10% en pantalla.
    draw: { stagger: 0, threshold: 0, rootMargin: "0px 0px -10% 0px" }
  };

  function prefersReducedMotion() {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function Reveal(effect, options) {
    var self = this;
    var defaults = DEFAULTS[effect];

    this.baseClass = "reveal-" + effect;
    this.visibleClass = this.baseClass + "__visible";
    this.options = {
      stagger: options && options.stagger != null ? options.stagger : defaults.stagger,
      threshold: options && options.threshold != null ? options.threshold : defaults.threshold,
      rootMargin: options && options.rootMargin != null ? options.rootMargin : defaults.rootMargin
    };

    this.queue = [];
    this.frameId = null;
    this.lastRevealAt = 0;

    this.observer = new IntersectionObserver(
      function (entries) { self.onIntersect(entries); },
      { threshold: this.options.threshold, rootMargin: this.options.rootMargin }
    );
  }

  Reveal.prototype.observe = function (root) {
    var self = this;
    (root || document).querySelectorAll("." + this.baseClass).forEach(function (element) {
      if (element.classList.contains(self.visibleClass)) return;
      self.observer.observe(element);
    });
  };

  Reveal.prototype.destroy = function () {
    this.observer.disconnect();
    this.queue.length = 0;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  };

  Reveal.prototype.onIntersect = function (entries) {
    var self = this;

    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      // Se deja de observar en el acto: el elemento ya está encolado y una
      // segunda llamada metería un duplicado en la cola.
      self.observer.unobserve(entry.target);
      self.queue.push(entry.target);
    });

    if (this.queue.length && this.frameId === null) {
      this.frameId = requestAnimationFrame(function () { self.drain(); });
    }
  };

  Reveal.prototype.drain = function () {
    var self = this;
    this.frameId = null;
    var now = performance.now();

    if (now - this.lastRevealAt >= this.options.stagger) {
      var element = this.queue.shift();
      if (element) {
        this.lastRevealAt = now;
        element.classList.add(this.visibleClass);
      }
    }

    if (this.queue.length) {
      this.frameId = requestAnimationFrame(function () { self.drain(); });
    }
  };

  var instances = [];

  /**
   * (Re)arranca los observers. Se puede llamar cuantas veces haga falta — el
   * conjunto anterior se desarma primero.
   */
  function initReveal(root) {
    var scope = root || document;
    destroyReveal();

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      EFFECTS.forEach(function (effect) {
        scope.querySelectorAll(".reveal-" + effect).forEach(function (element) {
          element.classList.add("reveal-" + effect + "__visible");
        });
      });
      return;
    }

    instances = EFFECTS.map(function (effect) {
      var reveal = new Reveal(effect);
      reveal.observe(scope);
      return reveal;
    });
  }

  function destroyReveal() {
    instances.forEach(function (instance) { instance.destroy(); });
    instances = [];
  }

  global.initReveal = initReveal;
  global.destroyReveal = destroyReveal;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { initReveal(); });
  } else {
    initReveal();
  }
})(window);
