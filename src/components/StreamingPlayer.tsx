import { useEffect, useRef, useState } from 'preact/hooks'
import { playerState, currentAnime, currentEpisode } from '../state/appState'
import styles from './StreamingPlayer.module.css'

type DebugWindow = Window & {
  __AION_DEBUG_PUSH__?: (message: string) => void
}

interface StreamingPlayerProps {
  onBack: () => void
}

function canPlayMP4(video: HTMLVideoElement): boolean {
  const canPlay = video.canPlayType
  if (!canPlay) return false

  const baseline = canPlay('video/mp4; codecs="avc1.42E01E"')
  if (baseline === 'probably' || baseline === 'maybe') return true

  const main = canPlay('video/mp4; codecs="avc1.58A01E"')
  if (main === 'probably' || main === 'maybe') return true

  const generic = canPlay('video/mp4')
  return generic === 'probably' || generic === 'maybe'
}

function getVideoErrorMessage(code: number): string {
  switch (code) {
    case 1: return 'Cargando video...'
    case 2: return 'Error de red. Verifica tu conexión.'
    case 3: return 'Formato de video no soportado por este navegador.'
    case 4: return 'El video no se puede reproducir. Códec no compatible con tu TV.'
    case 5: return 'Error decodificando video. Video corrupto o no compatible.'
    default: return `Error de video (código ${code})`
  }
}

export function StreamingPlayer({ onBack }: StreamingPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const playbackPreparedRef = useRef(false)
  const [showControls, setShowControls] = useState(true)
  const [hideTimeout, setHideTimeout] = useState<number | null>(null)
  const [playerError, setPlayerError] = useState('')
  const [usingFallback, setUsingFallback] = useState(false)

  const anime = currentAnime.value
  const episodeNum = currentEpisode.value
  const state = playerState.value

  const pushDebug = (message: string) => {
    const debugWindow = window as DebugWindow
    if (debugWindow.__AION_DEBUG_PUSH__) {
      debugWindow.__AION_DEBUG_PUSH__(message)
    }
  }

  const tryPlay = (video: HTMLVideoElement, reason: string) => {
    try {
      const playResult = video.play()

      if (playResult && typeof (playResult as Promise<void>).then === 'function' && typeof Promise !== 'undefined') {
        Promise.resolve(playResult as Promise<void>).catch((error) => {
          console.warn('[Player] play() rejected:', reason, error)
          pushDebug(`player:play-rejected reason=${reason}\n${String(error)}`)
          if (video.paused) {
            setPlayerError('Tap para reproducir')
          }
        })
      }
    } catch (error) {
      console.warn('[Player] play() threw:', reason, error)
      pushDebug(`player:play-threw reason=${reason}\n${String(error)}`)
      setPlayerError('Tap para reproducir')
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video || !anime) return

    playbackPreparedRef.current = false
    video.removeAttribute('src')
    video.load()

    setPlayerError('Tap para reproducir')
    setUsingFallback(false)
    pushDebug(`player:start`)

    return () => {
      video.removeAttribute('src')
      video.load()
    }
  }, [anime?.id])

  const preparePlayback = (video: HTMLVideoElement): 'ready' | 'waiting' | 'error' => {
    if (!anime) {
      setPlayerError('No hay contenido seleccionado.')
      return 'error'
    }

    if (playbackPreparedRef.current) {
      return 'ready'
    }

    playbackPreparedRef.current = true

    const mp4Url = (anime as any).streamUrlMp4 || anime.streamUrl?.replace('.mpd', '.mp4')
    if (mp4Url) {
      console.log('[Player] MP4 directo HTML5')
      video.src = mp4Url
      video.controls = false
      setUsingFallback(true)
      pushDebug(`player:mp4 url=${mp4Url}`)
      return 'ready'
    }

    if (!canPlayMP4(video)) {
      setPlayerError('Tu navegador no soporta MP4.')
      pushDebug('player:no-mp4-support')
      return 'error'
    }

    setPlayerError('No hay stream MP4 disponible.')
    pushDebug('player:no-mp4')
    return 'error'
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      playerState.value = { ...playerState.value, currentTime: video.currentTime }
    }

    const handleLoadedMetadata = () => {
      playerState.value = { ...playerState.value, duration: video.duration }
    }

    const handleProgress = () => {
      if (video.buffered.length > 0 && video.duration) {
        const buffered = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100
        playerState.value = { ...playerState.value, buffered }
      }
    }

    const handlePlay = () => {
      playerState.value = { ...playerState.value, playing: true }
    }

    const handlePause = () => {
      playerState.value = { ...playerState.value, playing: false }
    }

    const onVideoError = () => {
      const err = video.error
      const code = err ? err.code : 0
      pushDebug(`video:error code=${code}`)
      setPlayerError(getVideoErrorMessage(code))
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('error', onVideoError)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('error', onVideoError)
    }
  }, [usingFallback])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video || !anime) return

    if (video.paused) {
      const mode = preparePlayback(video)
      if (mode === 'error') {
        return
      }
      tryPlay(video, 'toggle-play')
    } else {
      video.pause()
    }
  }

  const seek = (seconds: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds))
  }

  const handleVolumeChange = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement
    const value = parseInt(input.value, 10)
    const video = videoRef.current
    if (video) {
      video.volume = value / 100
      playerState.value = { ...playerState.value, volume: value }
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    playerState.value = { ...playerState.value, muted: video.muted }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    try {
      if (document.fullscreenElement) {
        const exitResult = document.exitFullscreen()
        if (exitResult && typeof (exitResult as Promise<void>).then === 'function' && typeof Promise !== 'undefined') {
          Promise.resolve(exitResult as Promise<void>).catch((error) => {
            console.warn('[Player] exitFullscreen() rejected:', error)
            pushDebug(`player:exit-fullscreen-rejected\n${String(error)}`)
          })
        }
      playerState.value = { ...playerState.value, fullscreen: false }
      } else {
        const requestFullscreen =
          containerRef.current.requestFullscreen ||
          (containerRef.current as HTMLDivElement & {
            webkitRequestFullscreen?: () => Promise<void> | void
            webkitRequestFullScreen?: () => Promise<void> | void
          }).webkitRequestFullscreen ||
          (containerRef.current as HTMLDivElement & {
            webkitRequestFullscreen?: () => Promise<void> | void
            webkitRequestFullScreen?: () => Promise<void> | void
          }).webkitRequestFullScreen

        if (!requestFullscreen) {
          pushDebug('player:fullscreen-unsupported')
          return
        }

        const requestResult = requestFullscreen.call(containerRef.current)
        if (requestResult && typeof (requestResult as Promise<void>).then === 'function' && typeof Promise !== 'undefined') {
          Promise.resolve(requestResult as Promise<void>).catch((error) => {
            console.warn('[Player] requestFullscreen() rejected:', error)
            pushDebug(`player:request-fullscreen-rejected\n${String(error)}`)
          })
        }
        playerState.value = { ...playerState.value, fullscreen: true }
      }
    } catch (error) {
      console.warn('[Player] fullscreen threw:', error)
      pushDebug(`player:fullscreen-threw\n${String(error)}`)
      return
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (hideTimeout) clearTimeout(hideTimeout)
    setHideTimeout(
      setTimeout(() => setShowControls(false), 3000) as unknown as number
    )
  }

  if (!anime) return null

  const playerTitle = usingFallback
    ? `${anime.title} - Ep ${episodeNum} (MP4)`
    : `${anime.title} - Ep ${episodeNum}`

  return (
    <div
      ref={containerRef}
      class={styles.container}
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        class={styles.video}
        onClick={togglePlay}
      />

      {showControls && (
        <div class={styles.controls}>
          <div class={styles.topBar}>
            <button class={styles.backBtn} onClick={onBack}>
              ← Volver
            </button>
            <h2 class={styles.title} title={playerTitle}>
              {playerTitle}
            </h2>
            {playerError && (
              <span class={styles.title} style='font-size:0.85rem;color:#ff8a80;max-width:42rem;white-space:normal;'>
                {playerError}
              </span>
            )}
          </div>

          <div class={styles.center}>
            <button class={styles.seekBtn} onClick={() => seek(-10)}>
              -10s
            </button>
            <button class={styles.playBtn} onClick={togglePlay}>
              {state.playing ? '⏸' : '▶'}
            </button>
            <button class={styles.seekBtn} onClick={() => seek(10)}>
              +10s
            </button>
          </div>

          <div class={styles.bottomBar}>
            <div class={styles.progress}>
              <span>{formatTime(state.currentTime)}</span>
              <input
                type='range'
                min='0'
                max='100'
                value={state.duration ? (state.currentTime / state.duration) * 100 : 0}
                class={styles.progressBar}
                readOnly
              />
              <span>{formatTime(state.duration)}</span>
            </div>

            <div class={styles.volume}>
              <button onClick={toggleMute}>{state.muted ? '🔇' : '🔊'}</button>
              <input
                type='range'
                min='0'
                max='100'
                value={state.volume}
                onInput={handleVolumeChange}
                class={styles.volumeBar}
              />
              <button onClick={toggleFullscreen}>⛶</button>
            </div>
          </div>
        </div>
      )}

      {usingFallback && !showControls && (
        <div class={styles.fallbackHint}>
          <span>Modo compatibilidad (MP4)</span>
        </div>
      )}
    </div>
  )
}
