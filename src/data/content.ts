/**
 * Contenido del feedback, tipado.
 *
 * Los textos viven en `content.json` — el mismo objeto que ya usaba el
 * generador estático, así que no hay dos copias del contenido dando vueltas.
 * Cada texto es un par { es, en }: los dos idiomas se renderizan en el HTML y
 * el toggle solo decide cuál se muestra.
 */
import data from './content.json'

export interface Pair {
  es: string
  en: string
}

export type Category = 'interaccion' | 'layout' | 'performance' | 'responsive'

export interface Ref {
  label: Pair
  url: string
  /** Fuerza la descarga en vez de abrir el archivo en una pestaña. Solo mismo origen. */
  download?: boolean
}

export interface Snippet {
  label: Pair
  lang: string
  /** Un string cuando el código es igual en los dos idiomas; un par cuando los comentarios cambian. */
  code: string | Pair
}

/** Una captura de la columna izquierda. */
export interface Shot {
  img: string
  cap: Pair
}

export interface Item {
  cat: Category
  /** Una sugerencia no es un requisito: se agrupa aparte, al final de la página. */
  kind?: 'suggestion'
  /**
   * Pestaña donde vive el comentario. Sin marca, Desktop. 'both' es para lo que
   * especifica las dos vistas a la vez — un tamaño distinto en cada una — y
   * tendría que leerse igual en las dos pasadas.
   */
  view?: 'mobile' | 'both'
  title: Pair
  body: Pair[]
  /** Criterio de aceptación: cómo se comprueba que quedó resuelto. */
  ok?: Pair
  img?: string
  cap?: Pair
  /** Capturas extra, debajo de la principal y en la misma columna. */
  shots?: Shot[]
  /** 'grid' las acomoda en dos columnas en vez de apilarlas. */
  mediaLayout?: 'grid'
  refs?: Ref[]
  snippets?: Snippet[]
}

export interface PageDef {
  /** Nombre del archivo en el sitio generado: index.html, home.html… */
  file: string
  key: string
  nav: Pair
  icon: string
  crumb: Pair
  title: Pair
  lead: Pair
}

export const pages = data.pages as PageDef[]
export const content = data.content as Record<string, Item[]>
export const checklist = data.checklist as Record<string, [Pair, Pair][]>
export const ui = data.ui as Record<string, Pair>
export const catLabel = data.catLabel as Record<Category, Pair>
export const icons = data.icons as Record<string, string>

/** Página por clave, con un error claro si se escribe mal. */
export const pageByKey = (key: string): PageDef => {
  const page = pages.find((p) => p.key === key)
  if (!page) throw new Error(`No existe la página "${key}" en content.json`)
  return page
}

export const itemsOf = (key: string): Item[] => content[key] ?? []

export const countLabel = (n: number): Pair => ({
  es: `${n} ${n === 1 ? 'comentario' : 'comentarios'}`,
  en: `${n} ${n === 1 ? 'comment' : 'comments'}`,
})

export const suggestionLabel = (n: number): Pair => ({
  es: `${n} ${n === 1 ? 'sugerencia' : 'sugerencias'}`,
  en: `${n} ${n === 1 ? 'suggestion' : 'suggestions'}`,
})

/** Requisitos primero, sugerencias al final: es el orden en que se lee la página. */
export const splitItems = (items: Item[]): { required: Item[]; suggested: Item[] } => ({
  required: items.filter((item) => item.kind !== 'suggestion'),
  suggested: items.filter((item) => item.kind === 'suggestion'),
})

export type View = 'desktop' | 'mobile' | 'both'

/** Sin marca, el comentario vive en la pestaña Desktop. */
export const viewOf = (item: Item): View => item.view ?? 'desktop'

export const pageTitle = (page: PageDef): Pair => ({
  es: `Inszone · Feedback del rediseño — ${page.title.es}`,
  en: `Inszone · Redesign feedback — ${page.title.en}`,
})

export const footText = (page: PageDef): Pair => ({
  es: `Inszone Insurance · Feedback para el equipo de desarrollo del nuevo website — ${page.title.es}`,
  en: `Inszone Insurance · Feedback for the development team of the new website — ${page.title.en}`,
})
