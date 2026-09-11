/**
 * Bloqueo de scroll compartido por los dos modales (zoom de capturas y código).
 *
 * No toca `overflow`: con `overflow: hidden` el navegador descarta el
 * scrollbar-gutter y la página se corre unos pixeles al abrir el modal. En
 * lugar de eso se marca <html class="is-locked"> y se cancelan las entradas de
 * scroll — rueda, touch y teclas. La barra sigue ahí y nada se mueve.
 *
 * Lleva contador porque hay dos modales: si uno se cerrara mientras el otro
 * sigue abierto, un unlock suelto devolvería el scroll antes de tiempo.
 *
 * Lo que se bloquea es el scroll de la PÁGINA, no todo scroll: un modal con
 * contenido más alto que la pantalla —el de código— necesita su propia rueda.
 * Ese contenedor se marca con `data-scroll-keep` y las entradas que nacen
 * adentro pasan sin tocar. El encadenado al llegar al final lo corta el CSS
 * con `overscroll-behavior: contain`.
 */

const SCROLL_KEYS = new Set([ ' ', 'PageUp', 'PageDown', 'End', 'Home', 'ArrowUp', 'ArrowDown' ])

/** ¿La entrada nace dentro de una zona que sí puede scrollear? */
const exempt = ( node: EventTarget | null ): boolean =>
  node instanceof Element && node.closest( '[data-scroll-keep]' ) !== null

const blockEvent = ( event: Event ): void => {
  if ( !exempt( event.target )) event.preventDefault()
}

const blockKeys = ( event: KeyboardEvent ): void => {
  if ( SCROLL_KEYS.has( event.key ) && !exempt( document.activeElement )) event.preventDefault()
}

let depth = 0

const engage = (): void => {
  document.documentElement.classList.add( 'is-locked' )
  window.addEventListener( 'wheel', blockEvent, { passive: false })
  window.addEventListener( 'touchmove', blockEvent, { passive: false })
  window.addEventListener( 'keydown', blockKeys )
}

const disengage = (): void => {
  document.documentElement.classList.remove( 'is-locked' )
  window.removeEventListener( 'wheel', blockEvent )
  window.removeEventListener( 'touchmove', blockEvent )
  window.removeEventListener( 'keydown', blockKeys )
}

export const lockScroll = (): void => {
  if ( depth++ === 0 ) engage()
}

export const unlockScroll = (): void => {
  if ( depth === 0 ) return
  if ( --depth === 0 ) disengage()
}

/** Para el teardown: suelta el bloqueo sin importar cuántos lo pidieron. */
export const releaseScroll = (): void => {
  depth = 0
  disengage()
}
