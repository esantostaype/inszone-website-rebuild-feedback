/**
 * Zoom de las capturas — técnica FLIP, sin librerías.
 *
 * La imagen despega desde la posición y el tamaño exactos de la miniatura y
 * crece hasta el modal; al cerrar vuelve al mismo punto.
 *
 * El bloqueo del scroll vive en `scrollLock`, compartido con el modal de código.
 */
import { currentLang } from './i18n'
import { lockScroll, releaseScroll, unlockScroll } from './scrollLock'

const DURATION = 420 // debe coincidir con .lb-img.is-animating
const MARGIN_X = 0.94
const MARGIN_Y = 0.88

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

let teardown: (() => void) | null = null

export const initLightbox = (): void => {
  destroyLightbox()

  const shots = Array.from( document.querySelectorAll<HTMLElement>( '.shot[data-full]' ))
  if ( !shots.length ) return

  const reduce = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches

  const lb = document.createElement( 'div' )
  lb.className = 'lightbox'
  lb.setAttribute( 'role', 'dialog' )
  lb.setAttribute( 'aria-modal', 'true' )
  lb.innerHTML =
    '<div class="lb-backdrop"></div>' +
    '<button class="lb-close" type="button">' +
    '<svg class="ico-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
    '</button>' +
    '<img class="lb-img" alt="" />' +
    '<p class="lb-cap"></p>'
  document.body.appendChild( lb )

  const backdrop = lb.querySelector<HTMLElement>( '.lb-backdrop' )!
  const closeBtn = lb.querySelector<HTMLButtonElement>( '.lb-close' )!
  const lbImg = lb.querySelector<HTMLImageElement>( '.lb-img' )!
  const lbCap = lb.querySelector<HTMLElement>( '.lb-cap' )!

  let current: HTMLElement | null = null
  let busy = false
  let lastFocus: HTMLElement | null = null

  /* ─── Geometría ─── */

  /** Ancho de la miniatura en pantalla: el zoom nunca queda por debajo. */
  const thumbWidth = (): number =>
    current?.querySelector( 'img' )?.getBoundingClientRect().width ?? 0

  const targetRect = ( natW: number, natH: number ): Rect => {
    const vw = document.documentElement.clientWidth
    const vh = document.documentElement.clientHeight

    /* Dos techos, y gana el más bajo:
         · fit   — lo que entra en la ventana;
         · limit — el tamaño original de la imagen. Estirar un PNG más allá de
                   sus pixeles no muestra más detalle, solo lo pixela.
       El límite cede cuando la miniatura ya se ve más grande que el original
       (una imagen chica estirada por la columna): ahí achicar al abrir el zoom
       sería peor que el pixelado. */
    const fit = Math.min(( vw * MARGIN_X ) / natW, ( vh * MARGIN_Y ) / natH )
    const limit = Math.max( 1, thumbWidth() / natW )
    const scale = Math.min( fit, limit )

    const width = Math.round( natW * scale )
    const height = Math.round( natH * scale )
    return {
      width,
      height,
      left: Math.round(( vw - width ) / 2 ),
      top: Math.round(( vh - height ) / 2 ),
    }
  }

  const flipTransform = ( from: Rect, to: Rect ): string =>
    `translate(${ from.left - to.left }px,${ from.top - to.top }px) ` +
    `scale(${ from.width / to.width },${ from.height / to.height })`

  const place = ( rect: Rect ): void => {
    lbImg.style.left = `${ rect.left }px`
    lbImg.style.top = `${ rect.top }px`
    lbImg.style.width = `${ rect.width }px`
    lbImg.style.height = `${ rect.height }px`
  }

  const captionOf = ( shot: HTMLElement ): string =>
    shot.getAttribute( `data-caption-${ currentLang() }` ) ?? ''

  /* ─── Etiquetas accesibles en el idioma activo ─── */
  const refreshLabels = (): void => {
    const en = currentLang() === 'en'
    const prefix = en ? 'Enlarge screenshot: ' : 'Ampliar captura: '
    closeBtn.setAttribute( 'aria-label', en ? 'Close (Esc)' : 'Cerrar (Esc)' )
    lb.setAttribute( 'aria-label', en ? 'Enlarged view of the screenshot' : 'Vista ampliada de la captura' )
    shots.forEach(( shot ) => shot.setAttribute( 'aria-label', prefix + captionOf( shot )))
    if ( current ) lbCap.textContent = captionOf( current )
  }

  /* ─── Abrir / cerrar ─── */
  const open = ( shot: HTMLElement ): void => {
    if ( busy || current ) return
    const thumb = shot.querySelector( 'img' )
    if ( !thumb ) return

    busy = true
    current = shot
    lastFocus = document.activeElement as HTMLElement | null

    /* Sin naturalWidth (imagen todavía sin cargar) el respaldo es el tamaño en
       pantalla, y ahí el límite de arriba se vuelve neutro: no hay original
       conocido contra el cual medir. */
    const natW = thumb.naturalWidth || thumb.clientWidth
    const natH = thumb.naturalHeight || thumb.clientHeight
    const box = thumb.getBoundingClientRect()
    const from: Rect = { left: box.left, top: box.top, width: box.width, height: box.height }

    lockScroll()
    const to = targetRect( natW, natH )

    lbImg.src = shot.getAttribute( 'data-full' ) ?? ''
    lbImg.alt = thumb.alt
    const cap = captionOf( shot )
    lbCap.textContent = cap
    lbCap.style.display = cap ? '' : 'none'

    place( to )
    lbImg.classList.remove( 'is-animating' )
    lbImg.style.transform = flipTransform( from, to )

    lb.classList.add( 'is-active' )
    shot.classList.add( 'is-hidden' ) // evita ver dos copias durante el vuelo

    void lbImg.offsetWidth // reflow: el transform inicial antes de la transición

    if ( !reduce ) lbImg.classList.add( 'is-animating' )
    lb.classList.add( 'is-open' )
    lbImg.style.transform = 'none'

    window.setTimeout(() => {
      busy = false
      closeBtn.focus()
    }, reduce ? 0 : DURATION )
  }

  const close = (): void => {
    if ( busy || !current ) return
    busy = true

    const shot = current
    const thumb = shot.querySelector( 'img' )!
    const box = thumb.getBoundingClientRect()
    const from: Rect = { left: box.left, top: box.top, width: box.width, height: box.height }
    const to: Rect = {
      left: parseFloat( lbImg.style.left ),
      top: parseFloat( lbImg.style.top ),
      width: parseFloat( lbImg.style.width ),
      height: parseFloat( lbImg.style.height ),
    }

    // ¿la miniatura sigue en pantalla? si no, solo se desvanece
    const visible = box.width > 0 && box.bottom > 0 && box.top < window.innerHeight

    lb.classList.remove( 'is-open' )
    if ( !reduce && visible ) {
      lbImg.classList.add( 'is-animating' )
      lbImg.style.transform = flipTransform( from, to )
    }

    window.setTimeout(() => {
      lb.classList.remove( 'is-active' )
      lbImg.classList.remove( 'is-animating' )
      lbImg.removeAttribute( 'src' )
      lbImg.style.transform = 'none'
      shot.classList.remove( 'is-hidden' )
      unlockScroll()
      lastFocus?.focus()
      current = null
      busy = false
    }, reduce || !visible ? 0 : DURATION )
  }

  /* ─── Enlaces ─── */
  const onKeydown = ( e: KeyboardEvent ): void => {
    if ( e.key === 'Escape' && current ) close()
  }

  const onResize = (): void => {
    if ( !current || busy ) return
    const { naturalWidth, naturalHeight } = lbImg
    if ( !naturalWidth || !naturalHeight ) return
    lbImg.classList.remove( 'is-animating' )
    place( targetRect( naturalWidth, naturalHeight ))
  }

  shots.forEach(( shot ) => {
    shot.setAttribute( 'tabindex', '0' )
    shot.setAttribute( 'role', 'button' )
    shot.addEventListener( 'click', () => open( shot ))
    shot.addEventListener( 'keydown', ( e ) => {
      if ( e.key === 'Enter' || e.key === ' ' ) {
        e.preventDefault()
        open( shot )
      }
    })
  })

  refreshLabels()

  backdrop.addEventListener( 'click', close )
  lbImg.addEventListener( 'click', close )
  closeBtn.addEventListener( 'click', close )
  document.addEventListener( 'keydown', onKeydown )
  document.addEventListener( 'langchange', refreshLabels )
  window.addEventListener( 'resize', onResize )

  teardown = () => {
    document.removeEventListener( 'keydown', onKeydown )
    document.removeEventListener( 'langchange', refreshLabels )
    window.removeEventListener( 'resize', onResize )
    if ( current ) releaseScroll()
    lb.remove()
  }
}

/** Necesario en `astro:before-swap`: el modal vive fuera del contenido que Astro reemplaza. */
export const destroyLightbox = (): void => {
  teardown?.()
  teardown = null
}
