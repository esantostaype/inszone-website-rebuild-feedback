---
name: feedback-visual-web
description: Arma documentos de feedback visual para rediseños de websites — captura a la izquierda, comentario a la derecha señalando el punto exacto, bilingüe ES/EN, modal de zoom y aparición al hacer scroll, en el sistema de diseño de Inszone. Úsala siempre que haya que crear, ampliar o corregir un documento de feedback o QA visual dirigido a un equipo de desarrollo: "armar el feedback del rediseño", "documentar los cambios que pedimos", comentarios página por página de un sitio nuevo, convertir un Word de observaciones en algo navegable, agregar comentarios o capturas a un documento que ya existe, traducirlo, o publicarlo como sitio Astro con transiciones. También cubre cómo redactar cada comentario para que el dev pueda ejecutarlo sin preguntar.
---

# Documentos de feedback visual

Un documento de feedback sirve si el desarrollador puede abrirlo y trabajar sin preguntar nada.
Eso pide tres cosas al mismo tiempo: **ver** el punto exacto (la captura con la marca), **entender**
qué cambiar (el comentario al lado, no tres párrafos más abajo) y **saber cuándo terminó**
(el criterio de verificación). Esta skill trae el sistema completo para producirlos.

El resultado es un sitio de varias páginas: una de comentarios generales y una por plantilla
(Home, Product Page, Locations, About Us, Contact Us, Blog…), con menú lateral, contador de
comentarios por página y toggle de idioma.

## Elegir la versión antes de empezar

| | **Estática** | **Astro** |
|---|---|---|
| Se entrega como | Carpeta de archivos, se abre con doble clic | Sitio publicado (Vercel, Netlify) |
| Necesita | Nada | Node + hosting |
| Navegación | Recarga por página | `<ClientRouter />`, sin recarga |
| Cuándo | El dev recibe un zip o un Drive | Hay dónde publicarlo, o se quiere mostrar qué se le está pidiendo al equipo |

La versión Astro no funciona con `file://` — su router necesita HTTP. Si el documento va a
viajar como archivos sueltos, la estática es la única opción. Mantener las dos a la vez es
válido y barato: **comparten el mismo `content.json`**, así que el contenido nunca se duplica.

Detalle que vale la pena aprovechar: cuando el feedback le pide al equipo usar view transitions
de Astro, hacer el documento *en* Astro convierte el pedido en demostración. Deja de ser teoría.

## Flujo

**1 · Reunir el material.** Si el feedback viene en un Word, `scripts/extraer-docx.js` saca el
texto y las imágenes sin necesidad de pandoc:

```bash
node scripts/extraer-docx.js "ruta/al/feedback.docx" ./salida
```

Deja `salida/texto.txt` (párrafos, estilos, listas y a qué imagen corresponde cada uno) y
`salida/media/`. Renombra cada imagen por tema al copiarla: `home-01-padding-header.png`, no
`image1.png` — dentro de seis meses es la diferencia entre encontrarla y no.

**2 · Mirar cada captura antes de escribir.** Las flechas y recuadros rojos del Word dicen a
qué se refiere el comentario; sin verlos se escriben comentarios vagos. Abre las imágenes.

**3 · Escribir el contenido.** Todo vive en un solo archivo, `generar.js`, como pares
`T("español", "english")`. Copia `assets/estatico/generar.js` y reemplaza los arrays.
La forma de cada comentario:

```js
{
  cat: "interaccion",                    // interaccion | layout | performance | responsive
  title: T("Título corto", "Short title"),
  body: [T("Qué cambiar y dónde. Admite <b>negrita</b> y <code>código</code>.", "…")],
  ok:   T("Cómo se comprueba que quedó resuelto.", "…"),      // opcional pero casi siempre vale
  img:  "images/home-01-padding-header.png",                   // opcional
  cap:  T("Pie de la captura.", "…"),                          // si hay img
  snippets: [{ label: T("Qué es este código", "…"), lang: "css", code: "…" }],  // opcional
  refs: [ref(T("Etiqueta", "Label"), "https://…")]             // opcional
}
```

`code` acepta un string o un par `T()` cuando los comentarios dentro del código cambian de idioma.

**4 · Generar.** `node generar.js` reescribe las páginas: el menú, los contadores, los badges
por categoría y el pie se recalculan solos. Para la versión Astro, exportar el contenido a
`content.json` y correr `npm run build`.

**5 · Verificar en el navegador.** Abrir el documento y comprobar: las imágenes cargan, el zoom
abre y cierra, el toggle cambia los dos idiomas (incluidos los comentarios dentro del código),
y no hay scroll horizontal a 375 px de ancho.

## Cómo se escribe un comentario

Esta es la parte que decide si el documento sirve. El detalle, con ejemplos de antes y después,
está en **`references/redaccion.md`** — léelo antes de redactar la primera tanda. El resumen:

- **Un comentario, una idea.** El título dice *qué*; el cuerpo, *dónde* y *cómo*.
- **Nombra la sección real del sitio**, entre comillas: «PRESENCE», «Stay Informed with the
  Latest Updates». "Alinear esta sección" no le dice nada a quien no estuvo en la reunión.
- **Cierra con el criterio de verificación** (`ok`). Sin él, cada comentario genera una ida y
  vuelta para saber si quedó bien. Es lo que más tiempo ahorra de todo el documento.
- **"Debe", no "debería"**, salvo cuando de verdad es una sugerencia. La diferencia tiene que
  ser intencional.
- **Explica el porqué técnico cuando existe.** "Exportar el redondeo obliga a la imagen a llevar
  canal alfa, y eso la vuelve más pesada" se ejecuta; "usar border-radius" se discute.

## Qué trae la skill

```
assets/estatico/   generar.js · feedback.css · feedback.js · reveal.js · i18n.js
assets/astro/      Layout.astro · reveal.ts · lightbox.ts · codebox.ts · scrollLock.ts · smoothScroll.ts
                   i18n.ts · astro.config.mjs
references/        redaccion.md · astro.md · ui.md
scripts/           extraer-docx.js
```

Los archivos de `assets/` son los que están funcionando, no ejemplos. Cópialos tal cual y
edita solo el contenido.

## Dónde seguir

- **`references/redaccion.md`** — cómo redactar cada comentario, con ejemplos de corrección.
  Léelo cuando vayas a escribir o revisar textos.
- **`references/ui.md`** — tokens del sistema de diseño, anatomía del ítem, y cómo funcionan
  el modal de zoom (FLIP), el scroll reveal y el toggle de idioma. Léelo cuando toques estilos
  o comportamiento.
- **`references/astro.md`** — montar la versión Astro: `<ClientRouter />`, ciclo de vida de los
  scripts y los cuatro tropiezos que solo aparecen al hacerlo. Léelo antes de convertir o crear
  la versión Astro; los cuatro cuestan una tarde cada uno si se descubren en caliente.
