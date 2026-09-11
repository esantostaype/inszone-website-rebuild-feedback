/**
 * Pestañas Desktop / Mobile.
 *
 * Igual que el idioma: los dos conjuntos de comentarios están en el HTML y el
 * CSS muestra el que coincide con `<html data-view>`. Cambiar de pestaña no
 * pide nada al servidor ni pierde el scroll, y la elección se guarda.
 *
 * Lo único que no es CSS: al mostrar comentarios que estaban ocultos hay que
 * volver a armar el scroll reveal. Un elemento en `display: none` nunca
 * intersecta, así que el observador jamás lo marcó visible y aparecería
 * invisible. `initReveal()` reobserva solo los que todavía no se revelaron.
 */
import { initReveal } from './reveal'

export type View = 'desktop' | 'mobile'

const KEY = 'inszone-feedback-view'
const isView = ( value: unknown ): value is View => value === 'desktop' || value === 'mobile'

export const readView = (): View => {
  let value: string | null = null

  try {
    value = localStorage.getItem( KEY )
  } catch {
    /* modo privado o storage bloqueado */
  }

  if ( !value ) {
    const match = document.cookie.match( new RegExp( `(?:^|; )${ KEY }=([^;]*)` ))
    if ( match ) value = match[ 1 ]
  }

  return isView( value ) ? value : 'desktop'
}

const storeView = ( view: View ): void => {
  try {
    localStorage.setItem( KEY, view )
  } catch {
    /* idem */
  }
  document.cookie = `${ KEY }=${ view };path=/;max-age=31536000;samesite=lax`
}

export const currentView = (): View =>
  document.documentElement.getAttribute( 'data-view' ) === 'mobile' ? 'mobile' : 'desktop'

export const applyView = ( view: View, persist = false ): void => {
  const changed = currentView() !== view
  document.documentElement.setAttribute( 'data-view', view )

  document.querySelectorAll<HTMLElement>( '[data-set-view]' ).forEach(( button ) => {
    button.setAttribute( 'aria-pressed', String( button.dataset.setView === view ))
  })

  if ( persist ) storeView( view )
  if ( changed ) initReveal()
}

const onClick = ( event: MouseEvent ): void => {
  const button = ( event.target as HTMLElement | null )?.closest<HTMLElement>( '[data-set-view]' )
  if ( !button ) return
  event.preventDefault()
  const view = button.dataset.setView
  if ( isView( view )) applyView( view, true )
}

/** En cada `astro:page-load`: el <html> nuevo llega con la vista del servidor. */
export const initViewTabs = (): void => {
  applyView( readView())
  document.removeEventListener( 'click', onClick )
  document.addEventListener( 'click', onClick )
}
