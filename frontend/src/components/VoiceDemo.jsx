import { useState } from 'react';
import VoiceRecorder from './VoiceRecorder';
import TextToSpeech from './TextToSpeech';

export default function VoiceDemo() {
  const [transcript, setTranscript] = useState('');
  const [testText, setTestText] = useState('Hello! This is a test of the text-to-speech functionality. How does it sound?');

  const handleTranscription = (text) => {
    setTranscript(text);
  };

  return (
    <div className="min-h-screen pt-24 pb-12" style={{ background: 'linear-gradient(to right, #000001, #000000)' }}>
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Voice Features Demo</h2>
          <p className="text-gray-400">Test speech-to-text and text-to-speech functionality</p>
        </div>

        {/* Speech-to-Text Demo */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Speech-to-Text (STT)</h3>
          <VoiceRecorder
            onTranscriptionComplete={handleTranscription}
            onRecordingStateChange={(recording) => console.log('Recording:', recording)}
          />

          {transcript && (
            <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">Transcribed Text:</p>
              <p className="text-white">{transcript}</p>
            </div>
          )}
        </div>

        {/* Text-to-Speech Demo */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Text-to-Speech (TTS)</h3>

          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Enter text to convert to speech..."
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />

          <div className="mt-4">
            <TextToSpeech text={testText} />
          </div>
        </div>

        {/* Combined Demo */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Voice Conversation</h3>
          <p className="text-gray-400 mb-4">Record your voice, then hear it played back:</p>

          <VoiceRecorder
            onTranscriptionComplete={handleTranscription}
            onRecordingStateChange={(recording) => console.log('Recording:', recording)}
          />

          {transcript && (
            <div className="mt-4">
              <TextToSpeech
                text={`You said: ${transcript}`}
                autoPlay={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}