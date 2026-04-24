import { render } from 'preact'
import { LocationProvider, Router, Route } from 'preact-iso'
import { HomePage } from './pages/streaming/HomePage'
import { WatchPage } from './pages/streaming/WatchPage'
import { LoginPage } from './pages/streaming/LoginPage'
import { DetailPage } from './pages/streaming/DetailPage'
import './styles/app.css'

function installLegacyPolyfills() {
  // Shaka and some routing/debug tooling expect Shadow DOM-era event APIs.
  if (typeof Event !== 'undefined' && !Event.prototype.composedPath) {
    Event.prototype.composedPath = function () {
      const legacyEvent = this as Event & { path?: EventTarget[] }

      if (legacyEvent.path) {
        return legacyEvent.path
      }

      let target = legacyEvent.target as Node | null
      const path: EventTarget[] = []

      while (target) {
        path.push(target)
        target = target.parentNode
      }

      path.push(document)
      path.push(window)

      return path
    }
  }

  if (!Object.values) {
    Object.values = function values(obj: object) {
      return Object.keys(obj).map((key) => (obj as Record<string, unknown>)[key])
    }
  }

  if (!Object.entries) {
    Object.entries = function entries(obj: object) {
      return Object.keys(obj).map((key) => {
        return [key, (obj as Record<string, unknown>)[key]] as [string, unknown]
      })
    }
  }

  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function startsWith(search: string, pos?: number) {
      const position = pos || 0
      return this.substr(position, search.length) === search
    }
  }

  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function endsWith(search: string, length?: number) {
      const source = String(this)
      const end = length === undefined ? source.length : Math.min(length, source.length)
      return source.substring(end - search.length, end) === search
    }
  }
}

installLegacyPolyfills()

type DebugMode = 'off' | 'lite' | 'eruda'

type DebugWindow = Window & {
  __AION_ERRORS__?: string[]
  __AION_DEBUG_PUSH__?: (message: string) => void
}

function getQueryParam(name: string) {
  const query = window.location.search ? window.location.search.substring(1) : ''
  if (!query) return ''

  const parts = query.split('&')
  for (let i = 0; i < parts.length; i += 1) {
    const pair = parts[i].split('=')
    const key = decodeURIComponent(pair[0] || '')
    if (key === name) {
      return decodeURIComponent(pair[1] || '')
    }
  }

  return ''
}

function getStoredDebugMode() {
  try {
    return window.localStorage
      ? window.localStorage.getItem('aionDebug') || ''
      : ''
  } catch (_error) {
    return ''
  }
}

function getDebugMode(): DebugMode {
  const requestedMode = getQueryParam('debug') || getStoredDebugMode()

  if (requestedMode === 'off') return 'off'
  if (requestedMode === 'eruda') return 'eruda'
  if (requestedMode === 'lite') return 'lite'
  if (import.meta.env.VITE_ERUDA_ENABLED === 'true') return 'eruda'
  if (import.meta.env.VITE_DEBUG_OVERLAY === 'true') return 'lite'

  return 'lite'
}

function formatErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.stack || error.message
  }

  if (typeof error === 'string') {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch (_jsonError) {
    return String(error)
  }
}

function updateLiteDebugOverlay() {
  const output = document.getElementById('aion-debug-output')
  if (!output) return

  const debugWindow = window as DebugWindow
  output.textContent = (debugWindow.__AION_ERRORS__ || []).join('\n\n')
}

function pushDebugError(message: string) {
  const debugWindow = window as DebugWindow
  const errors = debugWindow.__AION_ERRORS__ || []

  errors.push(message)
  debugWindow.__AION_ERRORS__ = errors.slice(Math.max(errors.length - 8, 0))
  updateLiteDebugOverlay()
}

function installConsoleCapture() {
  const consoleRef = window.console
  const originalError = consoleRef.error
  const originalWarn = consoleRef.warn

  consoleRef.error = function patchedError(...args: unknown[]) {
    pushDebugError(`console.error\n${args.map(formatErrorMessage).join('\n')}`)
    return originalError.apply(consoleRef, args as any[])
  }

  consoleRef.warn = function patchedWarn(...args: unknown[]) {
    pushDebugError(`console.warn\n${args.map(formatErrorMessage).join('\n')}`)
    return originalWarn.apply(consoleRef, args as any[])
  }

  ;(window as DebugWindow).__AION_DEBUG_PUSH__ = pushDebugError
}

function installGlobalErrorCapture() {
  window.addEventListener('error', (event) => {
    var location = event.filename
      ? ' (' + event.filename + ':' + (event.lineno || 0) + ':' + (event.colno || 0) + ')'
      : ''
    var message = event.error
      ? formatErrorMessage(event.error)
      : event.message

    pushDebugError('Error' + location + '\n' + message)
  })

  window.addEventListener('unhandledrejection', (event) => {
    pushDebugError('Unhandled promise\n' + formatErrorMessage(event.reason))
    // Prevenir que el error aparezca en consola
    event.preventDefault()
  })
}

function createLiteDebugOverlay() {
  if (document.getElementById('aion-debug-panel')) return

  const panel = document.createElement('div')
  panel.id = 'aion-debug-panel'
  panel.style.position = 'fixed'
  panel.style.left = '0'
  panel.style.right = '0'
  panel.style.bottom = '0'
  panel.style.zIndex = '2147483647'
  panel.style.maxHeight = '45vh'
  panel.style.overflow = 'auto'
  panel.style.padding = '10px'
  panel.style.background = 'rgba(0, 0, 0, 0.88)'
  panel.style.color = '#ffffff'
  panel.style.fontFamily = 'monospace'
  panel.style.fontSize = '13px'
  panel.style.lineHeight = '1.35'
  panel.style.whiteSpace = 'pre-wrap'
  panel.style.setProperty('-webkit-overflow-scrolling', 'touch')

  const output = document.createElement('pre')
  output.id = 'aion-debug-output'
  output.style.margin = '0'
  output.textContent = 'Aion debug listo. Todavia no hay errores.'

  panel.appendChild(output)
  document.body.appendChild(panel)
  updateLiteDebugOverlay()
}

function removeErudaNodes() {
  const ids = ['eruda', 'eruda-container']

  for (let i = 0; i < ids.length; i += 1) {
    const node = document.getElementById(ids[i])
    if (node && node.parentNode) {
      node.parentNode.removeChild(node)
    }
  }
}

function loadErudaWhenIdle(): void {
  window.setTimeout(() => {
    var script = document.createElement('script');
    script.src = 'eruda.js';
    script.onload = function() {
      try {
        var erudaGlobal = (window as any).eruda;
        if (erudaGlobal && erudaGlobal.init) {
          erudaGlobal.init({
            defaults: {
              displaySize: 50,
              transparency: 0.9,
            },
          });
        }
      } catch (initError) {
        removeErudaNodes();
        pushDebugError('Eruda init failed\n' + formatErrorMessage(initError));
      }
    };
    script.onerror = function() {
      pushDebugError('Eruda load failed - script error');
    };
    document.head.appendChild(script);
  }, 1500);
}

installGlobalErrorCapture()
installConsoleCapture()

const debugMode = getDebugMode()
if (debugMode === 'lite') {
  if (document.body) createLiteDebugOverlay()
  else window.addEventListener('DOMContentLoaded', createLiteDebugOverlay)
}

if (debugMode === 'eruda') {
  loadErudaWhenIdle()
}

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
    (element as HTMLElement & { msMatchesSelector?: typeof element.matches })
      .msMatchesSelector

  return matcher ? matcher.call(element, selector) : false
}

function findFocusableTarget(target: EventTarget | null) {
  let element = target as HTMLElement | null

  while (
    element &&
    element !== document.body &&
    element !== document.documentElement
  ) {
    if (elementMatches(element, FOCUSABLE_SELECTOR)) {
      return element
    }

    element = element.parentElement
  }

  return null
}

function findScrollableElement(target: EventTarget | null) {
  let element = target as HTMLElement | null

  while (
    element &&
    element !== document.body &&
    element !== document.documentElement
  ) {
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

  if (
    typeof legacyEvent.wheelDeltaY === 'number' &&
    legacyEvent.wheelDeltaY !== 0
  ) {
    return legacyEvent.wheelDeltaY
  }

  if (
    typeof legacyEvent.wheelDelta === 'number' &&
    legacyEvent.wheelDelta !== 0
  ) {
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

  if (
    key === 'PageUp' ||
    key === 'ArrowUp' ||
    keyCode === 33 ||
    keyCode === 38
  ) {
    return -SCROLL_STEP
  }

  if (
    key === 'PageDown' ||
    key === 'ArrowDown' ||
    keyCode === 34 ||
    keyCode === 40
  ) {
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
