import { useEffect, useState } from 'react'

/* Легкий hash-роутер (працює на GitHub Pages без серверних правил).
   #/            → головна (карта)
   #/p/<grid>/<id> → картка поштомата (окреме вікно) */
export type Route = { name: 'home' } | { name: 'postomat'; grid: number; id: number }

function parse(): Route {
  const h = window.location.hash.replace(/^#/, '')
  const m = h.match(/^\/p\/(\d+)\/(\d+)/)
  if (m) return { name: 'postomat', grid: Number(m[1]), id: Number(m[2]) }
  return { name: 'home' }
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(parse)
  useEffect(() => {
    const fn = () => setRoute(parse())
    window.addEventListener('hashchange', fn)
    return () => window.removeEventListener('hashchange', fn)
  }, [])
  return route
}

/** Hash картки поштомата (навігація в тій самій вкладці) */
export function postomatHref(grid: number, id: number): string {
  return `#/p/${grid}/${id}`
}

/** Перехід на картку поштомата в поточній вкладці */
export function goToPostomat(grid: number, id: number): void {
  window.location.hash = `/p/${grid}/${id}`
}
