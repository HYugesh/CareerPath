import { useState, useRef, useEffect } from 'react';

export default function TextToSpeech({
  text,
  autoPlay = false,
  onSpeakingStateChange,
  voice = null
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [error, setError] = useState('');

  const utteranceRef = useRef(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Set default voice (prefer English voices)
      if (!selectedVoice && availableVoices.length > 0) {
        const englishVoice = availableVoices.find(v =>
          v.lang.startsWith('en') && v.name.includes('Google')
        ) || availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];

        setSelectedVoice(englishVoice);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      if (utteranceRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, [selectedVoice]);

  // Auto-play when text changes
  useEffect(() => {
    if (autoPlay && text && selectedVoice) {
      speak();
    }
  }, [text, autoPlay, selectedVoice]);

  const speak = () => {
    if (!text || !selectedVoice) return;

    try {
      setError('');

      // Cancel any ongoing speech
      speechSynthesis.cancel();

      utteranceRef.current = new SpeechSynthesisUtterance(text);
      utteranceRef.current.voice = selectedVoice;
      utteranceRef.current.rate = 0.9;
      utteranceRef.current.pitch = 1;
      utteranceRef.current.volume = 1;

      utteranceRef.current.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        onSpeakingStateChange?.(true);
      };

      utteranceRef.current.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        onSpeakingStateChange?.(false);
      };

      utteranceRef.current.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setError(`Speech error: ${event.error}`);
        setIsSpeaking(false);
        setIsPaused(false);
        onSpeakingStateChange?.(false);
      };

      utteranceRef.current.onpause = () => {
        setIsPaused(true);
      };

      utteranceRef.current.onresume = () => {
        setIsPaused(false);
      };

      speechSynthesis.speak(utteranceRef.current);
    } catch (err) {
      console.error('Error starting speech:', err);
      setError('Failed to start speech synthesis.');
    }
  };

  const pause = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
    }
  };

  const resume = () => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    onSpeakingStateChange?.(false);
  };

  const togglePlayPause = () => {
    if (!isSpeaking) {
      speak();
    } else if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  // Check if browser supports speech synthesis
  const isSpeechSynthesisSupported = 'speechSynthesis' in window;

  if (!isSpeechSynthesisSupported) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-400 text-sm">
          Text-to-speech is not supported in this browser.
        </p>
      </div>
    );
  }

  if (!text) {
    return null;
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3 bg-gray-700/30 rounded-lg p-3">
        <button
          onClick={togglePlayPause}
          disabled={!selectedVoice}
          className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition"
        >
          {isSpeaking && !isPaused ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a3 3 0 016 0v2M7 16a3 3 0 006 0v-2" />
            </svg>
          )}
        </button>

        {isSpeaking && (
          <button
            onClick={stop}
            className="flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
            </svg>
          </button>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.464 8.464a5 5 0 000 7.072M5.636 5.636a9 9 0 000 12.728" />
            </svg>
            <span className="text-sm text-gray-300">
              {isSpeaking ? (isPaused ? 'Paused' : 'Speaking...') : 'Click to hear question'}
            </span>
          </div>

          {voices.length > 0 && (
            <select
              value={selectedVoice?.name || ''}
              onChange={(e) => {
                const voice = voices.find(v => v.name === e.target.value);
                setSelectedVoice(voice);
              }}
              className="mt-1 text-xs bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white"
            >
              {voices
                .filter(voice => voice.lang.startsWith('en'))
                .map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
            </select>
          )}
        </div>

        {isSpeaking && (
          <div className="flex items-center gap-1">
            <div className="w-1 h-3 bg-blue-400 rounded animate-pulse"></div>
            <div className="w-1 h-4 bg-blue-400 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-2 bg-blue-400 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}