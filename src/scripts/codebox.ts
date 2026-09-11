/**
 * Modal de código.
 *
 * El código no vive dentro del globo del comentario: un bloque de treinta
 * líneas queda más alto que el comentario entero y empuja el criterio de
 * verificación fuera de pantalla, que es justo lo que el dev necesita leer.
 * En el globo queda un botón; el código se abre acá, ancho, con scroll propio
 * y con un botón para copiarlo completo.
 *
 * El contenido no se vuelve a escribir en JavaScript: se clona el HTML que
 * Astro ya dejó dentro de `.s-code`, así los dos idiomas siguen siendo los
 * mismos nodos `[data-lang]` que muestra el CSS según <html lang>.
 */
import { currentLang } from './i18n'
import { lockScroll, releaseScroll, unlockScroll } from './scrollLock'
import { attachSmoothScroll } from './smoothScroll'

let teardown: (() => void ) | null = null

export const initCodebox = (): void => {
  destroyCodebox()

  const triggers = Array.from( document.querySelectorAll<HTMLButtonElement>( '.s-open' ))
  if ( !triggers.length ) return

  const box = document.createElement( 'div' )
  box.className = 'codebox'
  box.setAttribute( 'role', 'dialog' )
  box.setAttribute( 'aria-modal', 'true' )
  box.innerHTML =
    '<div class="cb-backdrop"></div>' +
    '<div class="cb-panel">' +
      '<div class="cb-head">' +
        '<span class="cb-file"></span>' +
        '<span class="cb-lang"></span>' +
        '<button class="cb-btn cb-copy" type="button"></button>' +
        '<button class="cb-btn cb-close" type="button">' +
          '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
        '</button>' +
      '</div>' +
      /* data-scroll-keep: el bloqueo de scroll deja pasar la rueda acá dentro.
         tabindex: sin foco propio, PageDown y las flechas no llegan al bloque. */
      '<div class="cb-body" data-scroll-keep tabindex="0"></div>' +
    '</div>'
  document.body.appendChild( box )

  const backdrop = box.querySelector<HTMLElement>( '.cb-backdrop' )!
  const panel = box.querySelector<HTMLElement>( '.cb-panel' )!
  const fileEl = box.querySelector<HTMLElement>( '.cb-file' )!
  const langEl = box.querySelector<HTMLElement>( '.cb-lang' )!
  const copyBtn = box.querySelector<HTMLButtonElement>( '.cb-copy' )!
  const closeBtn = box.querySelector<HTMLButtonElement>( '.cb-close' )!
  const body = box.querySelector<HTMLElement>( '.cb-body' )!

  /* El mismo easing que la página: adentro del modal el scroll se siente igual
     que afuera. Devuelve null en táctil y con prefers-reduced-motion. */
  const smooth = attachSmoothScroll( body )

  let open = false
  let lastFocus: HTMLElement | null = null
  let copiedTimer = 0

  /* El texto que se copia es el del idioma activo: en un snippet bilingüe
     conviven dos <pre> y solo uno está a la vista. */
  const visibleCode = (): string => {
    const blocks = Array.from( body.querySelectorAll<HTMLPreElement>( 'pre' ))
    const match = blocks.find(( block ) => !block.dataset.lang || block.dataset.lang === currentLang())
    return match?.innerText ?? ''
  }

  const label = ( es: string, en: string ): string => ( currentLang() === 'en' ? en : es )

  const refreshLabels = (): void => {
    copyBtn.textContent = label( 'Copiar', 'Copy' )
    closeBtn.setAttribute( 'aria-label', label( 'Cerrar (Esc)', 'Close (Esc)' ))
    box.setAttribute( 'aria-label', label( 'Código de la sugerencia', 'Suggested code' ))
    triggers.forEach(( trigger ) => {
      const name = trigger.querySelector( '.s-file' )?.textContent?.trim() ?? ''
      trigger.setAttribute( 'aria-label', label( 'Ver el código: ', 'View the code: ' ) + name )
    })
  }

  const show = ( trigger: HTMLButtonElement ): void => {
    const source = trigger.closest( '.snippet' )?.querySelector<HTMLElement>( '.s-code' )
    if ( !source || open ) return

    open = true
    lastFocus = document.activeElement as HTMLElement | null

    fileEl.innerHTML = trigger.querySelector( '.s-file' )?.innerHTML ?? ''
    langEl.textContent = trigger.querySelector( '.s-lang' )?.textContent ?? ''
    body.innerHTML = source.innerHTML

    lockScroll()
    box.classList.add( 'is-active' )
    void panel.offsetWidth // reflow: el estado inicial antes de la transición

    /* Cada apertura empieza arriba, también al reabrir el mismo snippet.
       Va DESPUÉS de is-active: mientras el modal está en display:none no hay
       caja donde escribir un scrollTop y la asignación se pierde. Y el sync
       es imprescindible porque el scroll suave lleva su propia posición: sin
       avisarle, el primer movimiento de rueda salta a donde había quedado. */
    body.scrollTop = 0
    smooth?.sync()

    box.classList.add( 'is-open' )
    /* El foco va al bloque de código, no al botón de cerrar: es lo que se vino
       a leer y es lo que tiene que responder a PageDown y a las flechas. */
    body.focus()
  }

  const hide = (): void => {
    if ( !open ) return
    open = false

    box.classList.remove( 'is-open' )
    window.setTimeout(() => {
      if ( open ) return // se volvió a abrir mientras se cerraba
      box.classList.remove( 'is-active' )
      body.innerHTML = ''
    }, 280 )

    unlockScroll()
    lastFocus?.focus()
  }

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText( visibleCode())
      copyBtn.textContent = label( 'Copiado', 'Copied' )
      copyBtn.classList.add( 'is-done' )
    } catch {
      copyBtn.textContent = label( 'No se pudo copiar', "Couldn't copy" )
    }
    window.clearTimeout( copiedTimer )
    copiedTimer = window.setTimeout(() => {
      copyBtn.classList.remove( 'is-done' )
      refreshLabels()
    }, 1800 )
  }

  const onKeydown = ( event: KeyboardEvent ): void => {
    if ( event.key === 'Escape' && open ) hide()
  }

  triggers.forEach(( trigger ) => trigger.addEventListener( 'click', () => show( trigger )))

  refreshLabels()

  backdrop.addEventListener( 'click', hide )
  closeBtn.addEventListener( 'click', hide )
  copyBtn.addEventListener( 'click', copy )
  document.addEventListener( 'keydown', onKeydown )
  document.addEventListener( 'langchange', refreshLabels )

  teardown = () => {
    window.clearTimeout( copiedTimer )
    smooth?.detach()
    document.removeEventListener( 'keydown', onKeydown )
    document.removeEventListener( 'langchange', refreshLabels )
    if ( open ) releaseScroll()
    box.remove()
  }
}

/** Necesario en `astro:before-swap`: el modal vive fuera del contenido que Astro reemplaza. */
export const destroyCodebox = (): void => {
  teardown?.()
  teardown = null
}
