/* Genera las páginas HTML del feedback del rediseño del website.
   Todo el contenido es bilingüe: cada texto es un par T("español", "english")
   y se emite en el HTML en los dos idiomas; el toggle solo cambia cuál se
   muestra, sin recargar la página. */
const fs = require("fs");
const path = require("path");

/* Las páginas se escriben junto a este archivo. */
const DEST = __dirname;

/* ─── Logo: se reutiliza el SVG inline de otro documento del proyecto ───────
   Si no aparece, se usa un marcador para que el generador siga corriendo. */
const LOGO_SOURCE = path.join(__dirname, "..", "time-savings.html");
let LOGO = '<svg class="brand-logo" width="89" height="40" viewBox="0 0 89 40" role="img" aria-label="Logo">' +
  '<rect width="89" height="40" rx="8" fill="#364153"/></svg>';
try {
  const mLogo = fs.readFileSync(LOGO_SOURCE, "utf8").match(/<svg class="brand-logo"[\s\S]*?<\/svg>/);
  if (mLogo) LOGO = mLogo[0];
} catch {
  console.warn("Aviso: no se encontró el logo en " + LOGO_SOURCE + " — se usa un marcador.");
}

/* ─── Bilingüe ─── */
const T = (es, en) => ({ es, en });

/** Texto en los dos idiomas. Si coinciden, se emite una sola vez. */
function t(pair) {
  if (pair.es === pair.en) return pair.es;
  return `<span data-lang="es">${pair.es}</span><span data-lang="en" lang="en">${pair.en}</span>`;
}

const attr = (s) => String(s).replace(/"/g, "&quot;");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Bloque de código. Acepta un string o un par T() cuando los comentarios
    del snippet cambian según el idioma. */
function codeBlock(code) {
  var pre = (body, lang) =>
    `<pre${lang ? ` data-lang="${lang}"` : ""}><code>${esc(body)}</code></pre>`;
  if (typeof code === "string") return pre(code);
  if (code.es === code.en) return pre(code.es);
  return pre(code.es, "es") + pre(code.en, "en");
}

/* ─── Iconos (HugeIcons, trazo) ─── */
const I = {
  globe: '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20a15.3 15.3 0 010-20"/></svg>',
  home: '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M9.5 20v-5.5h5V20"/></svg>',
  shield: '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-3.5 8-9.5V5.5L12 2.5 4 5.5V12.5C4 18.5 12 22 12 22z"/></svg>',
  pin: '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10.5c0 5.5-8 11.5-8 11.5s-8-6-8-11.5a8 8 0 1116 0z"/><circle cx="12" cy="10.5" r="3"/></svg>',
  users: '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 5.2a3.5 3.5 0 010 6.6M17.5 14.4c2.4.6 4 2.5 4 5.6"/></svg>',
  mail: '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="3"/><path d="M3.5 7l7.4 5.2a2 2 0 002.2 0L20.5 7"/></svg>',
  news: '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M17 20H5a2 2 0 01-2-2V5a1 1 0 011-1h12a1 1 0 011 1v13a2 2 0 002 2 2 2 0 002-2V9h-4"/><path d="M7 8h7M7 12h7M7 16h4"/></svg>',
  zoom: '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M11 8.5v5M8.5 11h5M16.5 16.5L21 21"/></svg>',
  link: '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13.5a4 4 0 006 .5l2.5-2.5a4.2 4.2 0 00-6-6L11 7"/><path d="M14 10.5a4 4 0 00-6-.5L5.5 12.5a4.2 4.2 0 006 6L13 17"/></svg>',
  clock: '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg>',
  check: '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M8 12.3l2.6 2.6L16 9.5"/></svg>',
  dot: '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/></svg>'
};

const REF_SITE = "https://inszoneinsurance.vercel.app/";

/* ─── Estructura del menú ─── */
const PAGES = [
  {
    file: "index.html", key: "general", nav: T("General", "General"), icon: "globe",
    crumb: T("Feedback del rediseño", "Redesign feedback"),
    title: T("Comentarios generales", "General comments"),
    lead: T("Observaciones que aplican a todo el website, sin importar la página. Son la base sobre la que se revisa cada plantilla en particular.",
            "Observations that apply to the whole website, regardless of the page. They are the baseline for reviewing each individual template.")
  },
  {
    file: "home.html", key: "home", nav: T("Home", "Home"), icon: "home",
    crumb: T("Página · Desktop y responsive", "Page · Desktop and responsive"),
    title: T("Homepage", "Homepage"),
    lead: T("Revisión sección por sección de la página de inicio. Haz clic en cualquier captura para verla en detalle: la flecha o el recuadro rojo señala el punto exacto del comentario.",
            "Section-by-section review of the home page. Click any screenshot to see it in detail: the red arrow or box marks the exact spot the comment refers to.")
  },
  {
    file: "product-page.html", key: "product", nav: T("Product Page", "Product Page"), icon: "shield",
    crumb: T("Página · Producto / Insurance", "Page · Product / Insurance"),
    title: T("Product Page", "Product Page"),
    lead: T("Plantilla de producto de seguro (Personal, Commercial, Benefits) y su navegación interna.",
            "Insurance product template (Personal, Commercial, Benefits) and its internal navigation.")
  },
  {
    file: "locations.html", key: "locations", nav: T("Locations", "Locations"), icon: "pin",
    crumb: T("Página · Find Location", "Page · Find Location"),
    title: T("Locations", "Locations"),
    lead: T("Buscador de oficinas, listado por estado y ficha de cada localidad.",
            "Office finder, listing by state and each location's detail page.")
  },
  {
    file: "about-us.html", key: "about", nav: T("About Us", "About Us"), icon: "users",
    crumb: T("Página · Compañía", "Page · Company"),
    title: T("About Us", "About Us"),
    lead: T("Historia, equipo, carreras y todo el contenido institucional.",
            "History, team, careers and all institutional content.")
  },
  {
    file: "contact-us.html", key: "contact", nav: T("Contact Us", "Contact Us"), icon: "mail",
    crumb: T("Página · Contacto", "Page · Contact"),
    title: T("Contact Us", "Contact Us"),
    lead: T("Formularios de contacto, datos de la oficina y flujo de solicitud de cotización.",
            "Contact forms, office details and the quote request flow.")
  },
  {
    file: "blog.html", key: "blog", nav: T("Blog & Resources", "Blog & Resources"), icon: "news",
    crumb: T("Página · Recursos", "Page · Resources"),
    title: T("Blog & Resources", "Blog & Resources"),
    lead: T("Listado de artículos, ficha del post y el resto de la sección de recursos.",
            "Article listing, post detail and the rest of the resources section.")
  }
];

/* ─── Contenido ─── */
const ref = (label, url) => ({ label, url });
const REF_MAIN = () => ref(T("Sitio de referencia", "Reference site"), REF_SITE);

const GENERAL = [
  {
    cat: "interaccion",
    title: T("Scroll suave en todo el website", "Smooth scrolling across the website"),
    body: [
      T("Todo el website debe tener <b>scroll suave (smooth scrolling)</b>. Puede resolverse con una librería o con código nativo; lo importante es que la sensación de desplazamiento sea la misma en todas las páginas.",
        "The whole website must have <b>smooth scrolling</b>. It can be done with a library or with native code; what matters is that the scrolling feel is identical on every page.")
    ],
    ok: T("Al desplazarse con la rueda del mouse, el scroll frena de forma progresiva en lugar de cortarse de golpe, y se comporta igual en todas las páginas.",
          "Scrolling with the mouse wheel eases to a stop instead of cutting off abruptly, and behaves the same on every page."),
    refs: [
      ref(T("Locomotive Scroll (lo usado en la referencia)", "Locomotive Scroll (used in the reference)"), "https://scroll.locomotive.ca/"),
      ref(T("GSAP ScrollSmoother", "GSAP ScrollSmoother"), "https://gsap.com/docs/v3/Plugins/ScrollSmoother/"),
      REF_MAIN()
    ]
  },
  {
    cat: "interaccion",
    title: T("Aparición de los elementos al hacer scroll", "Scroll reveal on every element"),
    body: [
      T("Todos los elementos del website deben <b>aparecer a medida que el usuario baja</b>, en lugar de estar visibles desde el inicio.",
        "Every element on the website must <b>appear as the user scrolls down</b>, instead of being visible from the start."),
      T("Un <code>fade-up</code> sencillo, tipo <b>data-aos=\"fade-up\"</b>, alcanza para todos los elementos. GSAP también tiene esta funcionalidad.",
        "A simple <code>fade-up</code>, like <b>data-aos=\"fade-up\"</b>, is enough for every element. GSAP also provides this.")
    ],
    ok: T("Al recargar cualquier página, lo que está por debajo del primer pantallazo no se ve hasta que el scroll llega a esa sección.",
          "On reloading any page, anything below the first viewport stays hidden until the scroll reaches that section."),
    refs: [
      ref(T("AOS — ejemplos de la animación", "AOS — animation examples"), "https://michalsnik.github.io/aos/"),
      REF_MAIN(),
      ref(T("Repositorio del ejemplo", "Example repository"), "https://github.com/esantosinszone/inszone")
    ]
  },
  {
    cat: "performance",
    title: T("Imágenes optimizadas y en formato WebP", "Optimized images in WebP format"),
    body: [
      T("Todas las imágenes deben estar <b>optimizadas al tamaño real de uso</b> y entregarse en <b>formato WebP</b>. Hoy se sirven con un tamaño mucho mayor al necesario, lo que penaliza directamente el tiempo de carga.",
        "All images must be <b>optimized to the size they are actually displayed at</b> and delivered in <b>WebP format</b>. They are currently served much larger than needed, which directly hurts load time.")
    ],
    ok: T("En el panel Network, ninguna imagen se descarga a más del doble del tamaño en que se muestra, y todas llegan como .webp.",
          "In the Network panel, no image downloads at more than twice its displayed size, and every one arrives as .webp.")
  },
  {
    cat: "performance",
    title: T("Bordes redondeados por CSS, no exportados en la imagen",
             "Rounded corners in CSS, not baked into the image"),
    body: [
      T("Las imágenes con esquinas redondeadas deben conseguir ese aspecto <b>con CSS</b> — <code>border-radius: 24px</code>, por ejemplo — y no exportarse ya recortadas. Hoy el redondeo viene aplicado en el propio archivo.",
        "Images with rounded corners must get that shape <b>from CSS</b> — <code>border-radius: 24px</code>, for example — instead of being exported already cropped. Right now the rounding is baked into the file itself."),
      T("Exportar el redondeo obliga a la imagen a llevar <b>canal alfa</b> para que las esquinas queden transparentes, y eso la vuelve más pesada. Con CSS el archivo se exporta rectangular y liviano, el radio se ajusta cuando haga falta sin volver a exportar nada, y puede ser distinto en desktop y en mobile.",
        "Baking the rounding forces the image to carry an <b>alpha channel</b> so the corners can be transparent, which makes it heavier. With CSS the file is exported flat and light, the radius can be adjusted at any time without re-exporting anything, and it can differ between desktop and mobile.")
    ],
    snippets: [
      {
        label: T("El redondeo lo pone la hoja de estilos", "The stylesheet does the rounding"),
        lang: "css",
        code: T([
          "/* La imagen se exporta rectangular: sin alfa y más liviana. */",
          ".card img {",
          "  display: block;",
          "  width: 100%;",
          "  height: auto;",
          "  border-radius: 24px;",
          "}",
          "",
          "/* Si el redondeo también debe recortar lo que va encima */",
          "/* (overlays, degradados, badges), va en el contenedor: */",
          ".card {",
          "  border-radius: 24px;",
          "  overflow: hidden;",
          "}"
        ].join("\n"), [
          "/* The image is exported rectangular: no alpha, lighter file. */",
          ".card img {",
          "  display: block;",
          "  width: 100%;",
          "  height: auto;",
          "  border-radius: 24px;",
          "}",
          "",
          "/* If the rounding must also clip what sits on top */",
          "/* (overlays, gradients, badges), put it on the container: */",
          ".card {",
          "  border-radius: 24px;",
          "  overflow: hidden;",
          "}"
        ].join("\n"))
      }
    ],
    ok: T("Quitando el <code>border-radius</code> en el inspector, debajo queda una imagen rectangular con las esquinas opacas: el redondeo viene del CSS y no del archivo.",
          "Removing the <code>border-radius</code> in the inspector leaves a plain rectangular image with opaque corners: the rounding comes from the CSS, not from the file.")
  },
  {
    cat: "interaccion",
    title: T("Header que se oculta y reaparece", "Header that hides and comes back"),
    body: [
      T("El header debe <b>ocultarse mientras el usuario hace scroll hacia abajo</b> y <b>volver a aparecer apenas hace scroll hacia arriba</b>, como en el sitio de referencia.",
        "The header must <b>hide while the user scrolls down</b> and <b>come back as soon as they scroll up</b>, as on the reference site.")
    ],
    ok: T("Bajando, el header desaparece de la pantalla; con el primer gesto hacia arriba vuelve a estar visible sin necesidad de llegar al tope de la página.",
          "Scrolling down, the header leaves the screen; the first upward gesture brings it back without having to reach the top of the page."),
    refs: [REF_MAIN()]
  },
  {
    cat: "interaccion",
    title: T("Si el proyecto está en Astro: transiciones de página con &lt;ClientRouter /&gt;",
             "If the project is built with Astro: page transitions with &lt;ClientRouter /&gt;"),
    body: [
      T("Si el desarrollo está sobre <b>Astro</b>, la navegación entre páginas debe usar las <b>View Transitions</b> del propio framework en lugar de una recarga completa. Ojo con el nombre: el componente se llama <b>&lt;ClientRouter /&gt;</b> desde <b>Astro 5</b> y sigue igual en <b>Astro 7</b> — antes era <code>&lt;ViewTransitions /&gt;</code>, y viene del mismo paquete <code>astro:transitions</code>.",
        "If the build is on <b>Astro</b>, navigation between pages must use the framework's own <b>View Transitions</b> instead of a full reload. Watch the name: the component has been <b>&lt;ClientRouter /&gt;</b> since <b>Astro 5</b> and still is in <b>Astro 7</b> — it used to be <code>&lt;ViewTransitions /&gt;</code>, and it comes from the same <code>astro:transitions</code> package."),
      T("Se declara <b>una sola vez</b> en el <code>&lt;head&gt;</code> del layout compartido y ya aplica a todo el sitio: la navegación pasa a ser client-side y las páginas entran con transición en lugar de un salto en blanco.",
        "It is declared <b>once</b> in the shared layout's <code>&lt;head&gt;</code> and applies to the whole site: navigation becomes client-side and pages fade in instead of flashing white.")
    ],
    snippets: [
      {
        label: T("Layout compartido — se declara una sola vez", "Shared layout — declared once"),
        lang: "astro",
        code: [
          "---",
          "// src/layouts/Layout.astro",
          "import { ClientRouter } from 'astro:transitions';",
          "---",
          "<html lang=\"en\">",
          "  <head>",
          "    <meta charset=\"utf-8\" />",
          "    <title>{title}</title>",
          "    <ClientRouter />",
          "  </head>",
          "  <body>",
          "    <slot />",
          "  </body>",
          "</html>"
        ].join("\n")
      },
      {
        label: T("Control fino, elemento por elemento", "Fine-grained control, element by element"),
        lang: "astro",
        code: T([
          "<!-- El header no se vuelve a montar en cada navegación -->",
          "<header transition:persist>...</header>",
          "",
          "<!-- Dos elementos con el mismo nombre se animan de uno al otro entre páginas -->",
          "<h1 transition:name=\"page-title\">{title}</h1>",
          "",
          "<!-- Animación de entrada: fade (por defecto), slide, initial o none -->",
          "<main transition:animate=\"slide\">...</main>"
        ].join("\n"), [
          "<!-- The header is not re-mounted on every navigation -->",
          "<header transition:persist>...</header>",
          "",
          "<!-- Two elements sharing a name animate from one to the other across pages -->",
          "<h1 transition:name=\"page-title\">{title}</h1>",
          "",
          "<!-- Entry animation: fade (default), slide, initial or none -->",
          "<main transition:animate=\"slide\">...</main>"
        ].join("\n"))
      },
      {
        label: T("Importante: reiniciar los scripts en cada navegación", "Important: re-run scripts on every navigation"),
        lang: "js",
        code: T([
          "// Con navegación client-side el documento se reemplaza y DOMContentLoaded",
          "// no vuelve a dispararse: el scroll reveal, los contadores y los carruseles",
          "// quedan muertos en la segunda página si no se reinician acá.",
          "document.addEventListener('astro:page-load', () => {",
          "  initReveal();",
          "});",
          "",
          "// Y se desarman antes del swap, para no dejar observers ni listeners",
          "// colgando de la página anterior.",
          "document.addEventListener('astro:before-swap', () => {",
          "  destroyReveal();",
          "});"
        ].join("\n"), [
          "// With client-side navigation the document is replaced and DOMContentLoaded",
          "// no longer fires: scroll reveal, counters and carousels are dead on the",
          "// second page unless they are re-initialised here.",
          "document.addEventListener('astro:page-load', () => {",
          "  initReveal();",
          "});",
          "",
          "// And torn down before the swap, so no observers or listeners are left",
          "// hanging from the previous page.",
          "document.addEventListener('astro:before-swap', () => {",
          "  destroyReveal();",
          "});"
        ].join("\n"))
      }
    ],
    ok: T("Al pasar de una página a otra la URL cambia sin recarga completa (no parpadea el favicon ni se ve el fondo blanco), se ve la transición, y en la página nueva siguen funcionando el scroll reveal, los contadores y los carruseles.",
          "Moving from one page to another, the URL changes without a full reload (no favicon flicker, no white flash), the transition is visible, and on the new page the scroll reveal, counters and carousels still work."),
    refs: [
      ref(T("Astro — View Transitions (&lt;ClientRouter /&gt;)", "Astro — View Transitions (&lt;ClientRouter /&gt;)"), "https://docs.astro.build/en/guides/view-transitions/")
    ]
  }
];

const HOME = [
  {
    cat: "layout",
    title: T("Padding del header desbalanceado", "Unbalanced header padding"),
    body: [
      T("En el header, el padding <b>superior e inferior deben ser iguales</b>. Hoy el inferior es mayor: el Hero Section debería comenzar donde indica la flecha roja.",
        "The header's <b>top and bottom padding must match</b>. The bottom one is currently larger: the Hero Section should start where the red arrow points.")
    ],
    ok: T("Los dos espacios marcados en rojo miden lo mismo.", "Both spaces marked in red measure the same."),
    img: "images/home-01-header-padding.png",
    cap: T("Header del Home — los recuadros rojos marcan el espacio superior e inferior.",
           "Home header — the red boxes mark the top and bottom spacing.")
  },
  {
    cat: "layout",
    title: T("Sección «We protect your future.» fuera del container", "\u201CWe protect your future.\u201D section breaks the container"),
    body: [
      T("La sección <b>«We protect your future.»</b> debe alinearse al <b>100% del ancho del container</b>: su contenido tiene que respetar los mismos márgenes laterales que el resto del sitio, marcados por las líneas rojas.",
        "The <b>\u201CWe protect your future.\u201D</b> section must align to <b>100% of the container width</b>: its content has to respect the same side margins as the rest of the site, marked by the red lines.")
    ],
    ok: T("El borde izquierdo del título y el del paso 4 coinciden con los márgenes del header.",
          "The left edge of the heading and of step 4 line up with the header's margins."),
    img: "images/home-02-container-width.png",
    cap: T("Sección «We protect your future.» — las líneas rojas marcan el ancho del container.",
           "\u201CWe protect your future.\u201D section — the red lines mark the container width.")
  },
  {
    cat: "interaccion",
    title: T("Logos de aseguradoras en carrusel", "Carrier logos as a carousel"),
    body: [
      T("La fila de logos de <b>«The Best Insurance Companies For You»</b> debe ser un <b>carrusel en loop</b> y con <b>muchas más marcas</b> que las 7 actuales, no una fila estática.",
        "The logo row in <b>\u201CThe Best Insurance Companies For You\u201D</b> must be a <b>looping carousel</b> with <b>many more brands</b> than the current 7, not a static row.")
    ],
    ok: T("Los logos avanzan solos y el ciclo se repite sin cortes ni espacios vacíos.",
          "The logos move on their own and the loop repeats with no jumps or empty gaps."),
    img: "images/home-03-carriers-carousel.png",
    cap: T("Sección «The Best Insurance Companies For You» — hoy es una fila fija de 7 logos.",
           "\u201CThe Best Insurance Companies For You\u201D section — currently a fixed row of 7 logos."),
    refs: [REF_MAIN()]
  },
  {
    cat: "interaccion",
    title: T("Contador ascendente en el bloque «PRESENCE»", "Count-up animation in the \u201CPRESENCE\u201D block"),
    body: [
      T("En el bloque <b>«PRESENCE»</b>, los números (22 States, 113 Locations, 1,139 Team Members, 174 Agencies) deben <b>animarse desde 0 hasta su valor final cuando el usuario llega con el scroll a la sección</b>, no al cargar la página.",
        "In the <b>\u201CPRESENCE\u201D</b> block, the numbers (22 States, 113 Locations, 1,139 Team Members, 174 Agencies) must <b>count up from 0 to their final value when the user scrolls to the section</b>, not on page load.")
    ],
    ok: T("Si se abre la página y se baja despacio, los cuatro números arrancan en 0 justo cuando el bloque entra en pantalla.",
          "Opening the page and scrolling down slowly, all four numbers start at 0 exactly when the block comes into view."),
    img: "images/home-04-counter.png",
    cap: T("Bloque «PRESENCE» — 22 States, 113 Locations, 1,139 Team Members, 174 Agencies.",
           "\u201CPRESENCE\u201D block — 22 States, 113 Locations, 1,139 Team Members, 174 Agencies."),
    refs: [REF_MAIN()]
  },
  {
    cat: "interaccion",
    title: T("FAQ con transición y una sola pregunta abierta", "FAQ with transition and one open question"),
    body: [
      T("El FAQ debe <b>abrir y cerrar con transición</b>, y solo una pregunta puede estar abierta a la vez: <b>al abrir una, la que estaba abierta se cierra sola</b>.",
        "The FAQ must <b>open and close with a transition</b>, and only one question can be open at a time: <b>opening one closes the one that was open</b>.")
    ],
    ok: T("Abriendo las preguntas una tras otra, nunca quedan dos desplegadas al mismo tiempo y ninguna salta de golpe.",
          "Opening the questions one after another, two are never expanded at the same time and none snaps open."),
    img: "images/home-05-faq.png",
    cap: T("Sección «Frequently Asked Questions» del Home.", "\u201CFrequently Asked Questions\u201D section on the Home page.")
  },
  {
    cat: "interaccion",
    title: T("Autoplay en el carrusel del blog", "Autoplay on the blog carousel"),
    body: [
      T("El carrusel de posts de <b>«Stay Informed with the Latest Updates»</b> debe <b>avanzar solo</b>, sin depender de que el usuario use las flechas.",
        "The post carousel in <b>\u201CStay Informed with the Latest Updates\u201D</b> must <b>advance on its own</b>, without depending on the user clicking the arrows.")
    ],
    ok: T("Dejando la sección en pantalla sin tocar nada, los posts cambian solos y los puntos de paginación acompañan.",
          "Leaving the section on screen untouched, the posts change by themselves and the pagination dots follow along."),
    img: "images/home-06-blog.png",
    cap: T("Sección «Stay Informed with the Latest Updates» — carrusel de posts del blog.",
           "\u201CStay Informed with the Latest Updates\u201D section — blog post carousel.")
  },
  {
    cat: "responsive",
    title: T("Responsive en Tablet y Mobile", "Responsive on Tablet and Mobile"),
    body: [
      T("El responsive, <b>tanto en Tablet como en Mobile</b>, debe seguir los estilos del sitio de referencia.",
        "The responsive layout, <b>on both Tablet and Mobile</b>, must follow the styles of the reference site.")
    ],
    refs: [REF_MAIN()]
  }
];

const CONTENT = { general: GENERAL, home: HOME };

/* Qué se revisará en las páginas todavía sin comentarios */
const CHECKLIST = {
  product: [
    [T("Estructura del contenido", "Content structure"),
     T("Jerarquía del hero, bloques de coberturas y ubicación de los CTA de cotización.",
       "Hero hierarchy, coverage blocks and placement of the quote CTAs.")],
    [T("Navegación entre productos", "Navigation between products"),
     T("Cómo se salta entre Personal, Commercial y Benefits sin volver al Home.",
       "How to move between Personal, Commercial and Benefits without going back Home.")],
    [T("Formulario de cotización", "Quote form"),
     T("Campos, validación, estados de error y confirmación.",
       "Fields, validation, error states and confirmation.")],
    [T("Responsive", "Responsive"),
     T("Comportamiento de las tarjetas de cobertura en Tablet y Mobile.",
       "Behavior of the coverage cards on Tablet and Mobile.")]
  ],
  locations: [
    [T("Buscador de oficinas", "Office finder"),
     T("Búsqueda por Zip Code o estado y velocidad de respuesta.",
       "Search by Zip Code or state, and response speed.")],
    [T("Listado y mapa", "Listing and map"),
     T("Agrupación por estado, paginación y sincronía entre listado y mapa.",
       "Grouping by state, pagination and sync between listing and map.")],
    [T("Ficha de localidad", "Location detail"),
     T("Datos de contacto, horarios, equipo local y CTA de cotización.",
       "Contact details, hours, local team and quote CTA.")],
    [T("Responsive", "Responsive"),
     T("Mapa y listado en Tablet y Mobile.", "Map and listing on Tablet and Mobile.")]
  ],
  about: [
    [T("Historia y timeline", "History and timeline"),
     T("Narrativa de la compañía y animación de la línea de tiempo.",
       "Company narrative and timeline animation.")],
    [T("Equipo", "Team"),
     T("Grillas de fotos, orden por departamento y ficha de cada persona.",
       "Photo grids, ordering by department and each person's profile.")],
    [T("Carreras", "Careers"),
     T("Listado de vacantes y flujo de postulación.", "Job listings and the application flow.")],
    [T("Responsive", "Responsive"),
     T("Comportamiento de las grillas en Tablet y Mobile.", "Behavior of the grids on Tablet and Mobile.")]
  ],
  contact: [
    [T("Formulario de contacto", "Contact form"),
     T("Campos, validación en vivo, mensajes de error y confirmación.",
       "Fields, live validation, error messages and confirmation.")],
    [T("Datos de contacto", "Contact details"),
     T("Teléfono, email y horarios visibles sin tener que hacer scroll.",
       "Phone, email and hours visible without scrolling.")],
    [T("Ruteo del mensaje", "Message routing"),
     T("A qué oficina o departamento llega cada tipo de consulta.",
       "Which office or department each type of enquiry reaches.")],
    [T("Responsive", "Responsive"),
     T("Formulario y mapa en Tablet y Mobile.", "Form and map on Tablet and Mobile.")]
  ],
  blog: [
    [T("Listado de artículos", "Article listing"),
     T("Filtros por categoría, paginación y tarjetas del listado.",
       "Category filters, pagination and listing cards.")],
    [T("Ficha del post", "Post detail"),
     T("Tipografía de lectura, imágenes, autor y tiempo de lectura.",
       "Reading typography, images, author and reading time.")],
    [T("Artículos relacionados", "Related articles"),
     T("Criterio de relación y ubicación del bloque.", "Relation criteria and placement of the block.")],
    [T("Responsive", "Responsive"),
     T("Lectura del artículo en Tablet y Mobile.", "Reading the article on Tablet and Mobile.")]
  ]
};

/* ─── Etiquetas de interfaz ─── */
const UI = {
  sections: T("Secciones", "Sections"),
  zoom: T("Clic para ampliar", "Click to enlarge"),
  verify: T("Cómo se verifica", "How to verify"),
  pending: T("Pendiente de revisión", "Pending review"),
  emptyTitle: T("Comentarios en preparación", "Comments in progress"),
  emptyBody: T("Todavía no se han cargado los comentarios de esta página. Se irán agregando con el mismo formato del Home: la captura a la izquierda y el comentario señalando el punto exacto a la derecha.",
               "No comments have been added for this page yet. They will follow the same format as the Home page: the screenshot on the left and the comment pointing to the exact spot on the right."),
  foot: (title) => T("Inszone Insurance · Feedback para el equipo de desarrollo del nuevo website — " + title.es,
                     "Inszone Insurance · Feedback for the development team of the new website — " + title.en)
};

const CAT_LABEL = {
  interaccion: T("Interacción", "Interaction"),
  layout: T("Layout", "Layout"),
  performance: T("Performance", "Performance"),
  responsive: T("Responsive", "Responsive")
};

const countLabel = (n) => T(n + (n === 1 ? " comentario" : " comentarios"), n + (n === 1 ? " comment" : " comments"));

/* ─── Render ─── */
function renderItem(it, n) {
  const chips = `<span class="chip c-${it.cat}">${t(CAT_LABEL[it.cat])}</span>`;

  const verify = it.ok
    ? `<p class="verify"><span class="v-ico">${I.check}</span><span class="v-txt"><b>${t(UI.verify)}:</b> ${t(it.ok)}</span></p>`
    : "";

  const snippets = (it.snippets && it.snippets.length)
    ? it.snippets.map(s =>
        `<div class="snippet"><div class="s-head"><span class="s-file">${t(s.label)}</span>` +
        `<span class="s-lang">${s.lang}</span></div>${codeBlock(s.code)}</div>`).join("")
    : "";

  const refs = (it.refs && it.refs.length)
    ? `<ul class="refs">` + it.refs.map(r =>
        `<li><span class="r-ico">${I.link}</span><span class="r-txt"><span class="r-label">${t(r.label)}</span>` +
        `<a href="${r.url}" target="_blank" rel="noopener">${r.url}</a></span></li>`).join("") + `</ul>`
    : "";

  const bubble =
    `<div class="fb-note reveal-right"><div class="bubble">` +
    `<div class="bubble-head"><span class="num">${String(n).padStart(2, "0")}</span>${chips}</div>` +
    `<h3>${t(it.title)}</h3>` +
    it.body.map(p => `<p>${t(p)}</p>`).join("") +
    snippets +
    verify +
    refs +
    `</div></div>`;

  if (!it.img) return `      <article class="fb-item no-media" id="c${n}">\n${bubble}\n      </article>`;

  const media =
    `<div class="fb-media reveal-left">` +
    `<figure class="shot" data-full="${it.img}" data-caption-es="${attr(it.cap.es)}" data-caption-en="${attr(it.cap.en)}">` +
    `<img src="${it.img}" alt="${attr(it.title.en)}" loading="lazy" />` +
    `<span class="zoom-hint">${I.zoom} ${t(UI.zoom)}</span>` +
    `</figure></div>`;

  return `      <article class="fb-item" id="c${n}">\n        ${media}\n        ${bubble}\n      </article>`;
}

function renderNav(active) {
  return PAGES.map(p => {
    const n = (CONTENT[p.key] || []).length;
    const count = n
      ? `<span class="count">${n}</span>`
      : `<span class="count pending">·</span>`;
    return `        <a class="nav-item" href="${p.file}"${p.key === active ? ' aria-current="page"' : ""}>` +
      `${I[p.icon]}<span class="n-label">${t(p.nav)}</span>${count}</a>`;
  }).join("\n");
}

function renderEmpty(key) {
  const list = CHECKLIST[key] || [];
  return `      <section class="empty reveal-fade">
        <div class="e-ico">${I.clock}</div>
        <h2>${t(UI.emptyTitle)}</h2>
        <p>${t(UI.emptyBody)}</p>
        <ul class="checklist">
${list.map(([title, desc]) => `          <li class="reveal-up"><span class="k-ico">${I.dot}</span><span><b>${t(title)}</b><span>${t(desc)}</span></span></li>`).join("\n")}
        </ul>
      </section>`;
}

function renderPage(p) {
  const items = CONTENT[p.key] || [];
  const hasItems = items.length > 0;

  const cats = {};
  items.forEach(i => { cats[i.cat] = (cats[i.cat] || 0) + 1; });
  const catBadges = Object.keys(cats).map(c =>
    `<span class="badge plain">${t(CAT_LABEL[c])} <b>${cats[c]}</b></span>`).join("\n          ");

  const meta = hasItems
    ? `          <span class="badge ok">${I.check} ${t(countLabel(items.length))}</span>
          ${catBadges}`
    : `          <span class="badge warn">${I.clock} ${t(UI.pending)}</span>`;

  const body = hasItems
    ? `      <div class="items">\n${items.map((it, i) => renderItem(it, i + 1)).join("\n\n")}\n      </div>`
    : renderEmpty(p.key);

  const titleEs = "Inszone · Feedback del rediseño — " + p.title.es;
  const titleEn = "Inszone · Redesign feedback — " + p.title.en;

  return `<!doctype html>
<html lang="es" data-theme="dark" data-title-es="${attr(titleEs)}" data-title-en="${attr(titleEn)}">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${titleEs}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="assets/feedback.css" />
  <script>
    /* Idioma e indicador de JS antes del primer pintado: sin parpadeo. */
    (function () {
      var l;
      try { l = localStorage.getItem("inszone-feedback-lang"); } catch (e) { }
      if (!l) { var m = document.cookie.match(/(?:^|; )inszone-feedback-lang=([^;]*)/); if (m) l = m[1]; }
      if (l === "en" || l === "es") {
        document.documentElement.lang = l;
        document.title = document.documentElement.getAttribute("data-title-" + l) || document.title;
      }
      document.documentElement.classList.add("js");
    })();
  </script>
</head>

<body>
  <div class="app">

    <aside class="side">
      <div class="side-brand">
        ${LOGO.replace(/\n\s+/g, "\n          ")}
        <div class="lang-switch" role="group" aria-label="Language / Idioma">
          <button type="button" class="lang-btn" data-set-lang="es" aria-pressed="true">ES</button>
          <button type="button" class="lang-btn" data-set-lang="en" aria-pressed="false">EN</button>
        </div>
      </div>

      <nav class="side-nav" aria-label="${attr(UI.sections.en)}">
        <div class="nav-group-label">${t(UI.sections)}</div>
${renderNav(p.key)}
      </nav>
    </aside>

    <main class="main">
      <header class="page-head">
        <div class="crumb reveal-right">${t(p.crumb)}</div>
        <h1 class="reveal-right">${t(p.title)}</h1>
        <p class="lead reveal-right">${t(p.lead)}</p>
        <div class="meta-row reveal-right">
${meta}
        </div>
      </header>

${body}

      <footer class="page-foot">
        ${t(UI.foot(p.title))}
      </footer>
    </main>

  </div>

  <script src="assets/i18n.js"></script>
  <script src="assets/reveal.js"></script>
  <script src="assets/feedback.js"></script>
</body>

</html>
`;
}

PAGES.forEach(p => {
  fs.writeFileSync(path.join(DEST, p.file), renderPage(p), "utf8");
  console.log("✓ " + p.file);
});

/* Exportado para reutilizar el contenido desde el proyecto Astro. */
module.exports = { PAGES, GENERAL, HOME, CHECKLIST, UI, CAT_LABEL, I, REF_SITE };
