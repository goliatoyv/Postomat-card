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

/** URL картки поштомата для відкриття в новій вкладці */
export function postomatHref(grid: number, id: number): string {
  return `${window.location.pathname}${window.location.search}#/p/${grid}/${id}`
}
