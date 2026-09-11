/**
 * Scroll reveal.
 *
 * One parameterised observer per effect instead of three near-identical
 * classes. Elements opt in with `.reveal-up`, `.reveal-left`, `.reveal-right`
 * or `.reveal-fade` and get `--visible` added once they enter the viewport.
 *
 * Differences from the first version, all of which were showing up as jank on
 * long pages:
 *   - the stagger queue is a plain array, not a `querySelectorAll` on every
 *     animation frame;
 *   - elements are unobserved once revealed, so the observer list shrinks as
 *     you scroll instead of growing;
 *   - `destroy()` tears the observers down, which matters because the layout
 *     re-initialises on every `astro:page-load`;
 *   - `prefers-reduced-motion` short-circuits the whole thing and just shows
 *     the content.
 */

export type RevealEffect = 'up' | 'left' | 'right' | 'fade' | 'draw'

interface RevealOptions {
  /** Milliseconds between consecutive elements in the stagger queue. */
  stagger?: number
  threshold?: number
  rootMargin?: string
}

const DEFAULTS: Record<RevealEffect, Required<RevealOptions>> = {
  up: { stagger: 80, threshold: 0.1, rootMargin: '0px 0px -5% 0px' },
  left: { stagger: 80, threshold: 0.1, rootMargin: '0px 0px -5% 0px' },
  right: { stagger: 80, threshold: 0.1, rootMargin: '0px 0px -5% 0px' },
  fade: { stagger: 200, threshold: 0.1, rootMargin: '0px 0px -5% 0px' },
  // A single long stroke: no queue to stagger, and it should start as soon as
  // the diagram edges into view rather than waiting to be 10% on screen.
  draw: { stagger: 0, threshold: 0, rootMargin: '0px 0px -10% 0px' },
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches

class Reveal {
  private readonly baseClass: string
  private readonly visibleClass: string
  private readonly options: Required<RevealOptions>
  private readonly observer: IntersectionObserver
  private readonly queue: Element[] = []
  private frameId: number | null = null
  private lastRevealAt = 0

  constructor( effect: RevealEffect, options: RevealOptions = {}) {
    this.baseClass = `reveal-${ effect }`
    this.visibleClass = `${ this.baseClass }__visible`
    this.options = { ...DEFAULTS[ effect ], ...options }

    this.observer = new IntersectionObserver(
      ( entries ) => this.onIntersect( entries ),
      { threshold: this.options.threshold, rootMargin: this.options.rootMargin }
    )
  }

  public observe( root: ParentNode = document ): void {
    root.querySelectorAll( `.${ this.baseClass }` ).forEach(( element ) => {
      if ( element.classList.contains( this.visibleClass )) return
      this.observer.observe( element )
    })
  }

  public destroy(): void {
    this.observer.disconnect()
    this.queue.length = 0
    if ( this.frameId !== null ) {
      cancelAnimationFrame( this.frameId )
      this.frameId = null
    }
  }

  private onIntersect( entries: IntersectionObserverEntry[] ): void {
    entries.forEach(( entry ) => {
      if ( !entry.isIntersecting ) return
      // Stop watching immediately: the element is queued now, and a second
      // callback for it would push a duplicate into the queue.
      this.observer.unobserve( entry.target )
      this.queue.push( entry.target )
    })

    if ( this.queue.length && this.frameId === null ) {
      this.frameId = requestAnimationFrame(() => this.drain())
    }
  }

  private drain(): void {
    this.frameId = null
    const now = performance.now()

    if ( now - this.lastRevealAt >= this.options.stagger ) {
      const element = this.queue.shift()
      if ( element ) {
        this.lastRevealAt = now
        element.classList.add( this.visibleClass )
      }
    }

    if ( this.queue.length ) {
      this.frameId = requestAnimationFrame(() => this.drain())
    }
  }
}

let instances: Reveal[] = []

const EFFECTS = [ 'up', 'left', 'right', 'fade', 'draw' ] as const

/**
 * (Re)start the reveal observers. Safe to call on every page load — the
 * previous set is torn down first.
 */
export const initReveal = ( root: ParentNode = document ): void => {
  destroyReveal()

  if ( prefersReducedMotion() ) {
    EFFECTS.forEach(( effect ) => {
      root
        .querySelectorAll( `.reveal-${ effect }` )
        .forEach(( element ) => element.classList.add( `reveal-${ effect }__visible` ))
    })
    return
  }

  instances = EFFECTS.map(( effect ) => {
    const reveal = new Reveal( effect )
    reveal.observe( root )
    return reveal
  })
}

export const destroyReveal = (): void => {
  instances.forEach(( instance ) => instance.destroy())
  instances = []
}
