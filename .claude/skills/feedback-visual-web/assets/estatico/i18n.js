/* ═══════════════════════════════════════════════════════════════════════════
   Toggle de idioma (ES / EN).

   Los dos idiomas ya están en el HTML: el CSS muestra el que coincide con el
   atributo `lang` de <html>. Cambiarlo es instantáneo — no recarga, no pide
   nada al servidor y no pierde la posición del scroll.

   Persistencia: localStorage primero (funciona abriendo el archivo con doble
   clic) y cookie como respaldo para cuando las páginas se sirven por HTTP.
   Al revés no sirve: Chrome no permite document.cookie en URLs file://.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  "use strict";

  var KEY = "inszone-feedback-lang";
  var LANGS = { es: 1, en: 1 };

  function store(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) { }
    try {
      // 1 año; sin dominio para que valga también en localhost.
      document.cookie = KEY + "=" + lang + ";path=/;max-age=31536000;samesite=lax";
    } catch (e) { }
  }

  function read() {
    var value;
    try { value = localStorage.getItem(KEY); } catch (e) { }
    if (!value) {
      var m = document.cookie.match(new RegExp("(?:^|; )" + KEY + "=([^;]*)"));
      if (m) value = m[1];
    }
    return LANGS[value] ? value : null;
  }

  function current() {
    return document.documentElement.lang === "en" ? "en" : "es";
  }

  function apply(lang, persist) {
    if (!LANGS[lang]) return;

    var html = document.documentElement;
    html.lang = lang;

    var title = html.getAttribute("data-title-" + lang);
    if (title) document.title = title;

    var buttons = document.querySelectorAll("[data-set-lang]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", buttons[i].getAttribute("data-set-lang") === lang ? "true" : "false");
    }

    if (persist) store(lang);

    // Para lo que se arma desde JavaScript (el modal de imagen, por ejemplo).
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
  }

  function init() {
    apply(read() || current(), false);

    document.addEventListener("click", function (e) {
      var button = e.target.closest ? e.target.closest("[data-set-lang]") : null;
      if (!button) return;
      e.preventDefault();
      apply(button.getAttribute("data-set-lang"), true);
    });
  }

  global.currentLang = current;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
