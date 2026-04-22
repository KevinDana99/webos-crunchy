import { render } from 'preact'
import { LocationProvider, Router, Route } from 'preact-iso'
import { HomePage } from './pages/streaming/HomePage'
import { WatchPage } from './pages/streaming/WatchPage'
import { LoginPage } from './pages/streaming/LoginPage'
import './styles/app.css'
import eruda from 'eruda'

eruda.init({
  defaults: {
    displaySize: 50,
    transparency: 0.9
  }
})
document.body.style.backgroundColor = 'red'

export function App() {
  return (
    <LocationProvider>
      <Router>
        <Route path='/' component={HomePage} />
        <Route path='/watch' component={WatchPage} />
        <Route path='/login' component={LoginPage} />
        <Route default component={HomePage} />
      </Router>
    </LocationProvider>
  )
}

render(<App />, document.getElementById('app')!)
