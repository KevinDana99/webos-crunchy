import { useEffect, useRef, useState } from 'preact/hooks'
import shaka from 'shaka-player'
import { playerState, currentAnime, currentEpisode } from '../state/appState'
import styles from './StreamingPlayer.module.css'

interface StreamingPlayerProps {
  onBack: () => void
}

export function StreamingPlayer({ onBack }: StreamingPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showControls, setShowControls] = useState(true)
  const [hideTimeout, setHideTimeout] = useState<number | null>(null)

  const anime = currentAnime.value
  const episodeNum = currentEpisode.value
  const state = playerState.value

  useEffect(() => {
    const video = videoRef.current
    if (!video || !anime) return

    // Instalar polyfills de shaka-player para compatibilidad
    shaka.polyfill.installAll()

    // Verificar soporte del navegador
    if (!shaka.Player.isBrowserSupported()) {
      console.error('Shaka Player: Este navegador no es soportado')
      alert('Tu navegador no es compatible con el reproductor de video. Por favor, actualiza a una versión más reciente de Chrome, Firefox o Safari.')
      return
    }

    const player = new shaka.Player()

    // Configuración para compatibilidad con navegadores antiguos
    player.configure({
      streaming: {
        bufferBehind: 30,
        bufferAhead: 30,
        rebufferingGoal: 2,
        loadMinForwardProgress: 3,
      },
      manifest: {
        retryParameters: {
          minTimeout: 1000,
          maxTimeout: 60000,
        }
      },
      // Codecs compatibles con versiones antiguas de Chrome
      preferredVideoCodecs: ['avc1.42E01E', 'avc1.58A01E'],
      preferredAudioCodecs: ['mp4a.40.2'],
    })

    player.attach(video)

    player.load(anime.streamUrl).catch((err) => {
      console.error('Error loading stream:', err)
      const errorCode = (err as any)?.code || 0

      // Códigos 3014 (MEDIA_SOURCE_OPERATION_FAILED) o 3016 (VIDEO_ERROR)
      // Indican problemas con MediaSource/EME
      if ([3014, 3016].includes(errorCode)) {
        alert('Error al cargar el video. Es posible que tu navegador no soporte Media Source Extensions (MSE). Actualiza Chrome a versión 31+ o usa Firefox 38+.')
      } else {
        alert('Error al cargar el video: ' + (err.message || 'Error desconocido'))
      }
    })

    return () => {
      player.destroy()
    }
  }, [anime?.id])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      playerState.value = {
        ...playerState.value,
        currentTime: video.currentTime
      }
    }

    const handleLoadedMetadata = () => {
      playerState.value = { ...playerState.value, duration: video.duration }
    }

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const buffered =
          (video.buffered.end(video.buffered.length - 1) / video.duration) * 100
        playerState.value = { ...playerState.value, buffered }
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('progress', handleProgress)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('progress', handleProgress)
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      playerState.value = { ...playerState.value, playing: true }
    } else {
      video.pause()
      playerState.value = { ...playerState.value, playing: false }
    }
  }

  const seek = (seconds: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.max(
      0,
      Math.min(video.duration, video.currentTime + seconds)
    )
  }

  const handleVolumeChange = (e: { currentTarget: HTMLInputElement }) => {
    const value = parseInt(e.currentTarget.value)
    const video = videoRef.current
    if (video) {
      video.volume = value / 100
    }
    playerState.value = { ...playerState.value, volume: value }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    playerState.value = { ...playerState.value, muted: video.muted }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
      playerState.value = { ...playerState.value, fullscreen: false }
    } else {
      containerRef.current.requestFullscreen()
      playerState.value = { ...playerState.value, fullscreen: true }
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
        autoPlay
      />

      {showControls && (
        <div class={styles.controls}>
          <div class={styles.topBar}>
            <button class={styles.backBtn} onClick={onBack}>
              ← Volver
            </button>
            <h2 class={styles.title}>
              {anime.title} - Ep {episodeNum}
            </h2>
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
                value={
                  state.duration
                    ? (state.currentTime / state.duration) * 100
                    : 0
                }
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
    </div>
  )
}
