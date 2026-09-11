/**
 * Scroll suave — interpolación sobre el scroll nativo.
 *
 * Se aplica a la rueda del mouse; teclado, barra y táctil siguen igual. Sin
 * librerías a propósito: las soluciones basadas en transform (Locomotive y
 * compañía) envuelven el contenido en un contenedor transformado y rompen el
 * `position: sticky` del sidebar. El easing es el mismo que da esa sensación.
 *
 * El motor sirve para dos superficies con la misma curva, así el scroll dentro
 * del modal de código se siente igual que el de la página:
 *
 *   initSmoothScroll()          la ventana — se engancha una sola vez y
 *                               sobrevive al swap de Astro
 *   attachSmoothScroll( el )    un contenedor con overflow propio
 */

const EASE = 0.14

/** Qué lee, qué escribe y hasta dónde llega cada superficie. */
interface Surface {
  get: () => number
  set: ( y: number ) => void
  max: () => number
}

interface Engine {
  onWheel: ( event: WheelEvent ) => void
  /** Vuelve a tomar la posición real: contenido nuevo, o página nueva. */
  sync: () => void
}

/** El táctil trae su propia inercia y `reduce` pide no animar nada. */
const smoothable = (): boolean =>
  !window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches &&
  !window.matchMedia( '(hover: none)' ).matches

const engine = ( surface: Surface, skip: () => boolean = () => false ): Engine => {
  let target = surface.get()
  let current = target
  let running = false

  const loop = (): void => {
    current += ( target - current ) * EASE

    if ( Math.abs( target - current ) < 0.5 ) {
      current = target
      running = false
      surface.set( Math.round( current ))
      return
    }

    surface.set( current )
    requestAnimationFrame( loop )
  }

  const onWheel = ( event: WheelEvent ): void => {
    if ( event.ctrlKey ) return // zoom del navegador
    if ( skip()) return

    event.preventDefault()
    const factor = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? window.innerHeight : 1
    target = Math.min( Math.max( 0, target + event.deltaY * factor ), surface.max())

    if ( !running ) {
      running = true
      current = surface.get()
      requestAnimationFrame( loop )
    }
  }

  return {
    onWheel,
    sync: () => {
      target = surface.get()
      current = target
      running = false
    },
  }
}

/* ─── La ventana ──────────────────────────────────────────────────────── */

let page: Engine | null = null

const windowSurface: Surface = {
  get: () => window.scrollY,
  set: ( y ) => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }),
  max: () => Math.max( 0, document.documentElement.scrollHeight - window.innerHeight ),
}

export const initSmoothScroll = (): void => {
  if ( page ) {
    // Página nueva: el documento se reemplazó y el scroll volvió arriba.
    page.sync()
    return
  }

  if ( !smoothable()) return

  // La página no se mueve con un modal abierto; el modal sí, por su cuenta.
  page = engine( windowSurface, () => document.documentElement.classList.contains( 'is-locked' ))
  window.addEventListener( 'wheel', page.onWheel, { passive: false })
}

/* ─── Un contenedor ───────────────────────────────────────────────────── */

export interface SmoothTarget {
  /** Reposiciona el motor cuando el contenido cambia. */
  sync: () => void
  detach: () => void
}

/**
 * Engancha el mismo easing a un elemento con scroll propio. Devuelve `null`
 * cuando no corresponde animar — táctil o `prefers-reduced-motion` —, y en ese
 * caso el elemento se queda con su scroll nativo, que es lo correcto.
 */
export const attachSmoothScroll = ( element: HTMLElement ): SmoothTarget | null => {
  if ( !smoothable()) return null

  const surface: Surface = {
    get: () => element.scrollTop,
    set: ( y ) => { element.scrollTop = y },
    max: () => Math.max( 0, element.scrollHeight - element.clientHeight ),
  }

  // Sin nada que scrollear no se toca la rueda: el evento sigue su camino y lo
  // frena el bloqueo de scroll, en vez de quedar comido acá.
  const local = engine( surface, () => surface.max() === 0 )
  element.addEventListener( 'wheel', local.onWheel, { passive: false })

  return {
    sync: local.sync,
    detach: () => element.removeEventListener( 'wheel', local.onWheel ),
  }
}
