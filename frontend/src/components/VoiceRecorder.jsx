import { useState, useRef, useEffect } from 'react';
import axios from '../api/axiosConfig';

export default function VoiceRecorder({
  onTranscriptionComplete,
  onRecordingStateChange,
  isEnabled = true,
  useServerSTT = false
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const chunksRef = useRef([]);

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptText + ' ';
          } else {
            interimTranscript += transcriptText;
          }
        }

        const fullTranscript = (finalTranscript + interimTranscript).trim();
        setTranscript(fullTranscript);

        // Send interim results to parent for live updates
        if (fullTranscript) {
          onTranscriptionComplete?.(fullTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
        onRecordingStateChange?.(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        onRecordingStateChange?.(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [onRecordingStateChange]);

  const startRecording = async () => {
    try {
      setError('');
      setTranscript('');

      // Start audio recording for backup/server processing
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });

        // If using server STT or browser STT failed, send to server
        if (useServerSTT || !transcript.trim()) {
          await sendAudioToServer(audioBlob);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      // Start both recording methods
      mediaRecorderRef.current.start();

      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      setIsRecording(true);
      onRecordingStateChange?.(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const sendAudioToServer = async (audioBlob) => {
    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await axios.post('/voice/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const serverTranscript = response.data.text;
        setTranscript(serverTranscript);
        onTranscriptionComplete?.(serverTranscript);
      } else {
        setError('Server transcription failed: ' + response.data.error);
      }
    } catch (err) {
      console.error('Server transcription error:', err);
      setError('Failed to transcribe audio on server');
    } finally {
      setIsProcessing(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsProcessing(true);

    // Process the final transcript (browser STT result)
    setTimeout(() => {
      if (transcript.trim() && !useServerSTT) {
        onTranscriptionComplete?.(transcript.trim());
        setIsProcessing(false);
      }
      // If using server STT, processing will complete in mediaRecorder.onstop
    }, 500);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Check if browser supports speech recognition
  const isSpeechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  if (!isSpeechRecognitionSupported) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-400 text-sm">
          Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari for voice features.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={toggleRecording}
          disabled={!isEnabled || isProcessing}
          className={`
            flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200
            ${isRecording
              ? 'bg-red-600 hover:bg-red-700 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-700'
            }
            ${(!isEnabled || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isProcessing ? (
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
          ) : isRecording ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">
            {isRecording ? 'Recording... Speak now' : 'Click to start voice recording'}
          </p>
          {transcript && (
            <div className="bg-gray-700/50 rounded-lg p-3">
              <p className="text-white text-sm">{transcript}</p>
            </div>
          )}
        </div>
      </div>

      {isRecording && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          Recording in progress...
        </div>
      )}
    </div>
  );
}