const PREVIEW_VOLUME = 0.25;

export default function createPreviewPlayer(onChange) {
    const audio = new Audio();
    audio.volume = PREVIEW_VOLUME;
    let currentNumber = null;

    function getState() {
        const progress = audio.duration ? audio.currentTime / audio.duration : 0;
        return { number: currentNumber, isPlaying: !audio.paused, progress };
    }

    function notify() {
        onChange(getState());
    }

    function handlePlayError(error) {
        console.warn('Preview could not play:', error);
        currentNumber = null;
        notify();
    }

    function toggle(number, url) {
        if (number === currentNumber) {
            if (audio.paused) {
                audio.play().catch(handlePlayError);
            } else {
                audio.pause();
            }
            return;
        }

        currentNumber = number;
        audio.src = url;
        audio.play().catch(handlePlayError);
    }

    function setVolume(volume) {
        audio.volume = volume;
    }

    function stop() {
        audio.pause();
        currentNumber = null;
        notify();
    }

    audio.addEventListener('play', notify);
    audio.addEventListener('pause', notify);
    audio.addEventListener('timeupdate', notify);
    audio.addEventListener('ended', () => {
        currentNumber = null;
        notify();
    });

    return { toggle, stop, getState, setVolume };
}
