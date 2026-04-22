import { useLocation } from 'preact-iso';
import { StreamingPlayer } from '../../components/StreamingPlayer';
import { playerState } from '../../state/appState';

export function WatchPage() {
  const { route } = useLocation();

  const handleBack = () => {
    playerState.value = { ...playerState.value, playing: false };
    route('/');
  };

  return <StreamingPlayer onBack={handleBack} />;
}