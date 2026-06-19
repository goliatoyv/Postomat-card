import { Component, type ReactNode } from 'react'

/* Перехоплює помилки рендеру, щоб застосунок ніколи не показував
   порожній білий екран — натомість дружнє повідомлення з виходом на карту. */
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    // лог у консоль для діагностики
    console.error('UI error:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-np-bg px-8 text-center text-np-slate">
          <div className="text-lg font-semibold text-np-graphite">Сталася помилка інтерфейсу</div>
          <div className="max-w-md text-sm">{this.state.error.message}</div>
          <a href="#/" onClick={() => location.reload()} className="rounded-lg bg-np-red px-4 py-2 text-sm font-semibold text-white">
            ← Повернутись на карту
          </a>
        </div>
      )
    }
    return this.props.children
  }
}
