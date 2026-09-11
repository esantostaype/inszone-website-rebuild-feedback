# Versión Astro

La versión Astro existe por dos razones: navegar entre páginas sin recarga, y —cuando el
feedback pide justamente eso— mostrar la funcionalidad en lugar de describirla.

## Montaje

```
src/
  data/content.json     Contenido bilingüe, exportado desde generar.js
  data/content.ts       Tipos + accesos al JSON
  layouts/Layout.astro  <ClientRouter />, ciclo de vida, scripts
  components/           Sidebar · FeedbackPage · FeedbackItem · Snippet · T · Icon · Logo · LangSwitch
  pages/                Una por plantilla: index, home, product-page…
  scripts/              reveal.ts · lightbox.ts · smoothScroll.ts · i18n.ts
  styles/feedback.css
public/images/
```

`assets/astro/Layout.astro` es el layout completo y funcionando; los `.ts` van en
`src/scripts/`. El contenido se exporta desde el generador estático:

```js
const d = require('./website-feedback/generar.js')   // exporta PAGES, GENERAL, HOME, CHECKLIST, UI, CAT_LABEL, I
fs.writeFileSync('feedback-astro/src/data/content.json', JSON.stringify({
  pages: d.PAGES, content: { general: d.GENERAL, home: d.HOME },
  checklist: d.CHECKLIST, ui: d.UI, catLabel: d.CAT_LABEL, icons: d.I,
}, null, 2))
```

Un solo origen para las dos versiones. Al requerir el generador se regeneran también las
páginas estáticas, que es lo que se quiere.

## El componente

```astro
---
import { ClientRouter } from 'astro:transitions'
---
<head>
  <ClientRouter />
</head>
```

Se llama `<ClientRouter />` desde **Astro 5** y sigue igual en **Astro 7**. Antes era
`<ViewTransitions />`; el paquete nunca cambió: `astro:transitions`. Verifica el nombre contra
la documentación viva antes de escribirlo en un feedback — es exactamente el tipo de dato que
envejece.

URLs sin `.html`: `build: { format: 'directory' }` en `astro.config.mjs`.

## Ciclo de vida de los scripts

Con navegación client-side el documento se reemplaza y `DOMContentLoaded` no vuelve a
dispararse. `astro:page-load` corre también en la primera carga, así que no hace falta
duplicar la inicialización.

```ts
document.addEventListener( 'astro:page-load', () => {
  initI18n(); initSmoothScroll(); initLightbox(); initReveal(); markActiveNav()
})

document.addEventListener( 'astro:before-swap', ( event ) => {
  destroyReveal(); destroyLightbox()

  const incoming = event.newDocument.documentElement
  incoming.classList.add( 'js' )
  const lang = readLang()
  if ( lang ) incoming.lang = lang
})
```

## Los cuatro tropiezos

Ninguno da error en consola. Los cuatro se manifiestan como "funciona al recargar pero no al
navegar", que es el síntoma más caro de diagnosticar.

### 1 · El swap borra lo que el cliente le puso al `<html>`

Astro reemplaza **todos los atributos** del `<html>` por los del documento entrante, que viene
del servidor. Se pierde cualquier cosa agregada desde el cliente:

- La clase `js`, de la que cuelga el estado oculto del reveal. Sin ella los elementos de la
  página nueva nacen visibles y no hay nada que animar: **el reveal parece funcionar solo al
  recargar.**
- El `lang` elegido, que vuelve al del servidor y hace parpadear el idioma en cada navegación.

Se reponen sobre `event.newDocument` en `astro:before-swap`, antes de que entre en pantalla.

### 2 · `transition:persist` sobre un componente no hace nada

En un componente se convierte en una prop más y el HTML sale sin el atributo. Va sobre el
**elemento**:

```astro
<aside class="side" transition:persist="sidebar">
```

Para comprobarlo: `grep 'data-astro-transition-persist' dist/index.html`. Si no aparece, no
está persistiendo.

### 3 · El elemento persistido no actualiza su estado

Es literalmente el mismo nodo del DOM, así que el `aria-current` del menú sigue marcando la
página anterior. Hay que marcarlo a mano en cada `astro:page-load` comparando contra
`location.pathname`.

### 4 · Los observers hay que desarmarlos

Sin `destroyReveal()` en `astro:before-swap`, cada navegación deja un `IntersectionObserver`
más apuntando a nodos que ya no existen. Por eso el script de reveal expone `destroy()`: en un
sitio con navegación client-side no es un lujo.

## Verificar que la navegación es client-side

Prueba directa, sin depender de ver la animación:

```js
window.__marca = 'vivo'
document.querySelector('.nav-item[href="/home"]').click()
// después de la navegación:
window.__marca === 'vivo'                                  // no hubo recarga
window.__side === document.querySelector('.side')          // el sidebar persistió
```

En una vista previa oculta (`document.visibilityState === 'hidden'`) el navegador pausa
`requestAnimationFrame` y las entregas del IntersectionObserver, y la View Transitions API
rechaza con `InvalidStateError: Transition was aborted because of invalid state`. Nada de eso
es un bug del documento: el reveal no anima y el error aparece en consola solo mientras la
pestaña no se está pintando. Para verificar el reveal en ese estado, comprueba el cableado
—que los elementos entren ocultos, que `initReveal()` observe los del DOM nuevo y que la clase
`__visible` produzca el estado final— en lugar de esperar la animación.
