/**
 * Toggle de idioma (ES / EN).
 *
 * Los dos idiomas están en el HTML; el CSS muestra el que coincide con el
 * atributo `lang` de <html>. Cambiarlo es instantáneo: no recarga, no pide
 * nada al servidor y no pierde la posición del scroll.
 *
 * Persistencia: localStorage primero (funciona también abriendo el build con
 * doble clic) y cookie como respaldo. Al revés no sirve — Chrome no permite
 * document.cookie en URLs file://.
 */

export type Lang = 'es' | 'en'

const KEY = 'inszone-feedback-lang'
const isLang = ( value: unknown ): value is Lang => value === 'es' || value === 'en'

export const readLang = (): Lang | null => {
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

  return isLang( value ) ? value : null
}

const storeLang = ( lang: Lang ): void => {
  try {
    localStorage.setItem( KEY, lang )
  } catch {
    /* idem */
  }
  document.cookie = `${ KEY }=${ lang };path=/;max-age=31536000;samesite=lax`
}

export const currentLang = (): Lang =>
  document.documentElement.lang === 'en' ? 'en' : 'es'

export const applyLang = ( lang: Lang, persist = false ): void => {
  const html = document.documentElement
  html.lang = lang

  const title = html.getAttribute( `data-title-${ lang }` )
  if ( title ) document.title = title

  document.querySelectorAll<HTMLElement>( '[data-set-lang]' ).forEach(( button ) => {
    button.setAttribute( 'aria-pressed', String( button.dataset.setLang === lang ))
  })

  if ( persist ) storeLang( lang )

  document.dispatchEvent( new CustomEvent( 'langchange', { detail: { lang }}))
}

const onClick = ( event: MouseEvent ): void => {
  const button = ( event.target as HTMLElement | null )?.closest<HTMLElement>( '[data-set-lang]' )
  if ( !button ) return
  event.preventDefault()
  const lang = button.dataset.setLang
  if ( isLang( lang )) applyLang( lang, true )
}

/** Se llama en cada `astro:page-load`: el <html> nuevo vuelve al idioma del servidor. */
export const initI18n = (): void => {
  applyLang( readLang() ?? currentLang())
  document.removeEventListener( 'click', onClick )
  document.addEventListener( 'click', onClick )
}
