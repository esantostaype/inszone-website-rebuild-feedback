# Interfaz y comportamiento

`assets/estatico/feedback.css` es la hoja completa. Esto explica las decisiones que no se leen
solas en el CSS y el porqué de cada una.

## Sistema de diseño

Los tokens son los de Inszone (`time-savings.html`), superficie oscura. No inventar paleta:
que los documentos internos se parezcan entre sí es parte de que se lean rápido.

```css
--surface-app: #101828;   --surface-card: #1E2939;   --surface-raised: #364153;
--text-strong: #F3F4F6;   --text-default: #D1D5DC;   --text-muted: #99A1AF;
--primary-500: #6F8CC0;   --ok: #05DF72;   --amber: #FDC700;   --rose: #FB7185;
```

Tipografía Inter desde Google Fonts, con fallback al sistema. El logo se reutiliza como SVG
inline desde el proyecto; no se re-dibuja.

## Anatomía de un comentario

```
.fb-item              grid de dos columnas (1.12fr / 1fr), sin card propia
  .fb-media           columna de capturas — entra desde la izquierda
    .shot             sin borde, radio 14px, cursor zoom-in, hint al hover
                      (pueden ser varias apiladas: `img`/`cap` es la principal
                       y `shots: []` las que van debajo — el modal de zoom las
                       toma solas, engancha cualquier .shot[data-full].
                       `mediaLayout: "grid"` las pone en dos columnas: cuatro
                       capturas de un teléfono apiladas dan una columna de dos
                       metros y obligan a scrollear para ver una sola idea)
  .fb-note            globo del comentario — entra desde la derecha
    .bubble           mismo color que el sidebar, sin borde, flecha ::before apuntando a la imagen
      .num .chip      número + categoría
      h3 / p          título y cuerpo
      .snippet        botón que abre el código en el modal
      .verify         criterio de aceptación, con check verde
      .refs           enlaces
```

Sin imagen (`.no-media`) el globo ocupa el ancho completo, pierde la flecha y gana padding.

Los ítems con `kind: "suggestion"` se separan del resto (`splitItems`): van al final de la
página, detrás del bloque `.sug-head`, con numeración propia (`S01`) y el ámbar que el sistema
ya usa para lo que no es un requisito cerrado. Los badges por categoría del encabezado cuentan
solo los requisitos — una sugerencia no debería inflar el tamaño del trabajo pedido —, y el
contador de sugerencias va en su propio badge.

Detalles que cuestan encontrar si se pierden:

- **La flecha del globo apunta a la imagen** en escritorio y rota hacia arriba por debajo de
  1080 px, donde las columnas se apilan.
- **`.fb-note { min-width: 0 }`** — sin esto, un `<pre>` largo estira la columna del grid en
  lugar de scrollear dentro de su bloque.
- **`body { overflow-x: clip }`** — los elementos que entran desde la derecha están desplazados
  +30 px y ensanchan el documento. `clip` los recorta sin crear un contenedor de scroll;
  `hidden` rompería el `position: sticky` del sidebar.
- **El `top` del sidebar sticky iguala el `padding-top` del contenedor** (34 px). Si no
  coinciden, el sidebar da un saltito al fijarse.

## Scroll reveal

Un `IntersectionObserver` por efecto, con cola de stagger. Los elementos se apuntan con
`.reveal-up`, `.reveal-left`, `.reveal-right`, `.reveal-fade` y reciben `__visible` al entrar.

Direcciones que se usan: capturas desde la izquierda, comentarios y textos del encabezado desde
la derecha, elemento por elemento.

Dos cosas sostienen que esto no rompa nada:

- **El estado oculto cuelga de `html.js`**, que pone un script inline en el `<head>`. Sin
  JavaScript el contenido se ve completo en lugar de quedar invisible, y como el script corre
  antes del primer pintado no hay parpadeo.
- **Se deja de observar el elemento apenas se encola.** La lista del observer se achica a
  medida que se hace scroll en lugar de crecer, que es lo que producía jank en páginas largas.

`prefers-reduced-motion` corta todo y muestra el contenido.

## Modal de zoom (FLIP)

La imagen despega desde la posición y el tamaño exactos de la miniatura y crece hasta el modal;
al cerrar vuelve al mismo punto. JavaScript puro, 420 ms, sin librerías.

1. Medir la miniatura (`getBoundingClientRect`).
2. Bloquear el scroll.
3. Calcular el rectángulo final centrado sobre `documentElement.clientWidth/Height`.
4. Posicionar la imagen en el destino y aplicarle el `transform` que la devuelve al origen.
5. Forzar reflow, activar la transición y poner `transform: none`.

**El bloqueo del scroll no toca `overflow`.** Con `overflow: hidden` el navegador descarta el
scrollbar-gutter y la página se corre unos pixeles; compensar con `padding-right` desplaza el
contenido centrado por la mitad de ese ancho. En lugar de eso se marca `<html class="is-locked">`
y se cancelan rueda, touch y teclas de scroll. La barra sigue ahí y nada se mueve.

**El zoom no pasa del tamaño original.** El rectángulo final tiene dos techos y gana el más
bajo: lo que entra en la ventana, y los pixeles que la imagen realmente tiene. Sin el segundo,
una captura de 659 px se abría a 1300 y se veía pixelada — se agranda el archivo, no el detalle.
El límite cede en un solo caso: cuando la miniatura ya se ve más grande que el original, porque
ahí achicar al abrir el zoom sería peor.

La miniatura se oculta con `visibility` durante el vuelo para no ver dos copias. Si al cerrar
quedó fuera de pantalla, la imagen se desvanece en lugar de volar a ninguna parte.

## Modal de código

El código no se imprime dentro del globo: un bloque de treinta líneas queda más alto que el
comentario entero y empuja el criterio de verificación fuera de pantalla, que es justo lo que
el dev necesita leer. En el comentario queda un botón — nombre del archivo, lenguaje, "Ver
código" — y el bloque se abre en un modal ancho, con scroll propio y botón de copiar.

Dos decisiones que sostienen esto:

- **El código viaja en el HTML, no en JavaScript.** Astro lo imprime dentro de `.s-code`
  (oculto por CSS) y el modal clona ese `innerHTML`. Así los dos idiomas siguen siendo los
  mismos nodos `[data-lang]` de siempre: cambiar de idioma con el modal abierto cambia el
  código a la vista, y "Copiar" copia el del idioma activo.
- **Sin JavaScript el código se muestra en su lugar.** `html:not(.js) .s-code { display: block }`
  y el botón desaparece. El documento nunca esconde contenido detrás de un modal que no abre.

- **El código envuelve, no scrollea al costado.** `white-space: pre-wrap` con
  `overflow-wrap: anywhere`: un `data:` URI o una lista de clases de Tailwind no traen
  espacios donde cortar, y sin `anywhere` la línea empuja un scroll horizontal que esconde
  medio bloque.

El bloqueo del scroll lo comparten los dos modales (`scrollLock.ts`) y lleva contador: un
`unlockScroll()` suelto mientras el otro sigue abierto devolvería el scroll antes de tiempo.

Tres detalles más del contenedor scrolleable:

- **La barra se ve igual que la del sitio.** Los valores salen de `--scroll-thumb` y
  `--scroll-thumb-hover`, que usan tanto las reglas globales como `.cb-body`. `scrollbar-color`
  se hereda, pero dejarlo librado a la herencia esconde de dónde sale el color el día que cambie.
- **Tiene el mismo easing que la página** (`attachSmoothScroll`): adentro del modal el scroll
  se siente igual que afuera.
- **Cada apertura empieza arriba**, también al reabrir el mismo snippet. El `scrollTop = 0` va
  *después* de `is-active`: mientras el modal está en `display: none` no hay caja donde
  escribirlo y la asignación se pierde en silencio. Y detrás va un `sync()`, porque el scroll
  suave lleva su propia posición: sin avisarle, el primer movimiento de rueda salta a donde
  había quedado.

**Lo que se bloquea es el scroll de la página, no todo scroll.** Es el detalle que se pasa por
alto: el modal de zoom nunca necesitó rueda propia, pero el de código sí, y el `preventDefault`
sobre `wheel` en window se la come. El contenedor scrolleable se marca con `data-scroll-keep`
y `scrollLock` deja pasar las entradas que nacen adentro — la rueda por `event.target`, las
teclas por `document.activeElement`, que por eso lleva `tabindex="0"` y recibe el foco al
abrir. El encadenado al llegar al final lo corta `overscroll-behavior: contain`.

**Esto existe solo en la versión Astro.** El generador estático sigue imprimiendo el código
dentro del globo, y `assets/estatico/feedback.css` conserva los estilos de ese bloque. Si se
porta, hay que tocar `generar.js` (markup del snippet), `feedback.js` (el modal) y la hoja.

## Pestañas Desktop / Mobile

Cada página lleva un switch arriba, debajo de los badges. No filtra en JavaScript: marca
`data-view` en el `<html>` y el CSS esconde los comentarios de la otra vista — el mismo
mecanismo que el idioma, con la misma persistencia (`localStorage` + cookie) y el mismo script
inline en el `<head>` para que no parpadee. Un comentario entra en Mobile con `view: "mobile"`;
sin marca vive en Desktop. `view: "both"` lo deja en las dos, que es lo que corresponde cuando
el comentario especifica un valor distinto para cada vista —un título de 40 px en desktop y 20
en mobile— y tiene que leerse igual en las dos pasadas. El CSS no necesita una regla para eso:
solo esconde `data-view="mobile"` y `data-view="desktop"`, así que un `both` no entra en
ninguna de las dos y se ve siempre; lo único que hay que recordar es sumarlo a los dos
contadores de las pestañas.

Tres cosas que hay que respetar al tocarlo:

- **La numeración no se rehace por pestaña.** El número es el nombre del comentario en un
  ticket: si en Desktop se ven 01–06 y en Mobile 07–08, está bien que haya saltos. Renumerar
  por vista haría que "el comentario 02" signifique dos cosas distintas.
- **Al cambiar de pestaña hay que volver a llamar `initReveal()`.** Un elemento en
  `display: none` nunca intersecta, así que el observador jamás lo marcó visible y aparecería
  invisible al mostrarlo. `observe()` salta los que ya tienen `__visible`, así que reiniciar
  no vuelve a animar lo que ya se vio.
- **El encabezado de Sugerencias también se filtra**, pero solo cuando todas las sugerencias de
  la página son de la misma vista; si están mezcladas se queda visible en las dos.

Si una vista queda sin comentarios, se muestra un aviso en lugar de una página vacía, y sin
JavaScript las pestañas desaparecen y se ve todo.

## Scroll suave

Interpolación sobre el scroll nativo, con la rueda del mouse; teclado, barra y
táctil quedan como están. El mismo motor sirve dos superficies con la misma curva:
`initSmoothScroll()` para la ventana y `attachSmoothScroll( el )` para un contenedor con
overflow propio — que es como el modal de código se siente igual que la página. **Sin Locomotive ni ScrollSmoother a propósito**: envuelven el
contenido en un contenedor transformado y rompen el `position: sticky` del sidebar. Si alguien
pide una de esas librerías, este es el motivo para explicar por qué acá no.

Se desactiva con el modal abierto, en táctil (la inercia nativa es mejor) y con
`prefers-reduced-motion`.

## Idioma

**El documento nace en inglés**: `<html lang="en">`, el `<title>` en inglés y EN primero en el
toggle. Lo lee el equipo de desarrollo, y arrancar en el idioma de quien va a ejecutar el
trabajo ahorra un clic por sesión. El español queda a un clic y se recuerda.

Los dos idiomas están en el HTML. El CSS muestra el que coincide con `<html lang>`:

```css
html[lang="es"] [data-lang="en"],
html[lang="en"] [data-lang="es"] { display: none; }
```

Cambiar el idioma es instantáneo: no recarga, no pide nada al servidor, no pierde el scroll.
También cambia el `<title>` y el pie del modal.

**Persistencia: `localStorage` primero, cookie como respaldo.** Al revés no sirve — Chrome no
permite `document.cookie` en URLs `file://`, y el documento se abre con doble clic. Un script
inline en el `<head>` aplica el idioma guardado antes del primer pintado, así no parpadea al
navegar entre páginas.

## Responsive

Por debajo de 1080 px el sidebar pasa a ser una tira horizontal con scroll y las columnas se
apilan. Comprobar siempre a 375 px que `scrollWidth === clientWidth`: un `min-width: auto` de
grid olvidado desborda la página entera y no se nota en escritorio.
