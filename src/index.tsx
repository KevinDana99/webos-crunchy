import { render } from 'preact'
import { LocationProvider, Router, Route } from 'preact-iso'
import { HomePage } from './pages/streaming/HomePage'
import { WatchPage } from './pages/streaming/WatchPage'
import { LoginPage } from './pages/streaming/LoginPage'
import { DetailPage } from './pages/streaming/DetailPage'
import './styles/app.css'
import eruda from 'eruda'

eruda.init({
  defaults: {
    displaySize: 50,
    transparency: 0.9
  }
})
document.body.style.backgroundColor = 'red'

const SCROLL_STEP = 300

type LegacyScrollEvent = Event & {
  deltaY?: number
  deltaMode?: number
  wheelDelta?: number
  wheelDeltaY?: number
  detail?: number
}

type CursorStateChangeEvent = Event & {
  detail?: {
    visibility?: boolean
  }
}

const FOCUSABLE_SELECTOR = 'button,a,input,textarea,select,[tabindex]'

function isTextInputTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null
  if (!element || !element.tagName) return false
  return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA'
}

function elementMatches(element: HTMLElement, selector: string) {
  const matcher =
    element.matches ||
    element.webkitMatchesSelector ||
    (element as HTMLElement & { msMatchesSelector?: typeof element.matches }).msMatchesSelector

  return matcher ? matcher.call(element, selector) : false
}

function findFocusableTarget(target: EventTarget | null) {
  let element = target as HTMLElement | null

  while (element && element !== document.body && element !== document.documentElement) {
    if (elementMatches(element, FOCUSABLE_SELECTOR)) {
      return element
    }

    element = element.parentElement
  }

  return null
}

function findScrollableElement(target: EventTarget | null) {
  let element = target as HTMLElement | null

  while (element && element !== document.body && element !== document.documentElement) {
    const styles = window.getComputedStyle(element)
    const overflowY = styles.overflowY || styles.overflow

    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      element.scrollHeight > element.clientHeight
    ) {
      return element
    }

    element = element.parentElement
  }

  return null
}

function scrollPage(deltaY: number, target?: EventTarget | null) {
  const scrollTarget = findScrollableElement(target || null)

  if (scrollTarget) {
    scrollTarget.scrollTop -= deltaY
    scrollTarget.dispatchEvent(new Event('scroll'))
    return
  }

  const root = document.documentElement
  const body = document.body
  
  root.scrollTop -= deltaY
  body.scrollTop -= deltaY
  
  if (root.scrollTop > 0 || body.scrollTop > 0) {
    return
  }

  window.scrollBy(0, -deltaY)
}

function getWheelDelta(event: Event) {
  const legacyEvent = event as LegacyScrollEvent

  if (typeof legacyEvent.deltaY === 'number' && legacyEvent.deltaY !== 0) {
    return legacyEvent.deltaY
  }

  if (typeof legacyEvent.wheelDeltaY === 'number' && legacyEvent.wheelDeltaY !== 0) {
    return legacyEvent.wheelDeltaY
  }

  if (typeof legacyEvent.wheelDelta === 'number' && legacyEvent.wheelDelta !== 0) {
    return legacyEvent.wheelDelta
  }

  if (typeof legacyEvent.detail === 'number') {
    return legacyEvent.detail * 40
  }

  return 0
}

function handleWheelScroll(event: Event) {
  if (isTextInputTarget(event.target)) return

  const deltaY = getWheelDelta(event)
  if (!deltaY) return

  scrollPage(deltaY, event.target)
  event.preventDefault()
}

function handlePointerFocus(event: Event) {
  const focusTarget = findFocusableTarget(event.target)
  if (!focusTarget || focusTarget === document.activeElement) return
  if (focusTarget.getAttribute('tabindex') === '-1') return

  focusTarget.focus()
}

function handleCursorStateChange(event: Event) {
  const cursorEvent = event as CursorStateChangeEvent
  const visible = Boolean(cursorEvent.detail && cursorEvent.detail.visibility)

  if (!visible && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

function getKeyScrollDelta(event: KeyboardEvent) {
  const key = event.key || ''
  const keyCode = event.keyCode || event.which

  if (key === 'PageUp' || key === 'ArrowUp' || keyCode === 33 || keyCode === 38) {
    return -SCROLL_STEP
  }

  if (key === 'PageDown' || key === 'ArrowDown' || keyCode === 34 || keyCode === 40) {
    return SCROLL_STEP
  }

  return 0
}

window.addEventListener('keydown', (e) => {
  if (isTextInputTarget(e.target)) return

  if (e.keyCode === 1537 || e.which === 1537) {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    return
  }

  const deltaY = getKeyScrollDelta(e)
  if (deltaY) {
    scrollPage(deltaY, e.target)
  }
})

document.addEventListener('mouseover', handlePointerFocus, false)
document.addEventListener('cursorStateChange', handleCursorStateChange, false)
window.addEventListener('wheel', handleWheelScroll, { passive: false })
window.addEventListener('mousewheel', handleWheelScroll, { passive: false })
window.addEventListener('DOMMouseScroll', handleWheelScroll, { passive: false })

export function App() {
  return (
    <LocationProvider>
      <Router>
        <Route path='/' component={HomePage} />
        <Route path='/watch' component={WatchPage} />
        <Route path='/login' component={LoginPage} />
        <Route path='/info' component={DetailPage} />
        <Route default component={HomePage} />
      </Router>
    </LocationProvider>
  )
}

render(<App />, document.getElementById('app')!)
