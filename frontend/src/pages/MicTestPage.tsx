import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, ArrowRight, ArrowLeft, CheckCircle, Square } from 'lucide-react';

const MicTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isPhraseValid, setIsPhraseValid] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Start recording
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start audio level monitoring
      monitorAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setHasRecorded(true);
      
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const monitorAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      setAudioLevel(average);
    }
    
    if (isRecording) {
      animationRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'test_recording.wav');

      const response = await fetch('http://localhost:5000/api/transcribe-only', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const result = await response.json();
      setTranscription(result.transcription || 'No speech detected');
      setIsPhraseValid(result.isValid || false);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setTranscription('Error processing audio');
      setIsPhraseValid(false);
    }
  };

  const handleContinue = () => {
    if (isPhraseValid) {
      navigate('/chat');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full text-center animate-fade-in">
        <button
          onClick={() => navigate('/permissions')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Permissions
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
              <Volume2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Microphone Test
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              Let's test your microphone to ensure optimal voice recognition. 
              Click the button below and say: <span className="font-semibold">"Hello, this is a microphone test."</span>
            </p>
          </div>

          <div className="space-y-8">
            <div className="relative">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="relative">
                  <button
                    onClick={startRecording}
                    disabled={isRecording}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-all duration-300 ${
                      isRecording 
                        ? 'bg-blue-500 animate-pulse' 
                        : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:shadow-xl hover:scale-105'
                    } disabled:cursor-not-allowed`}
                  >
                    {isRecording ? <Mic className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  </button>
                  
                  {isRecording && (
                    <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping"></div>
                  )}
                </div>
                <button
                  onClick={stopRecording}
                  disabled={!isRecording}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500 hover:shadow-xl hover:scale-105' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Square className="w-6 h-6" />
                </button>
              </div>

              {/* Audio Level Visualization */}
              <div className="flex items-center justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="voice-wave"
                    style={{
                      height: `${Math.max(8, (audioLevel / 255) * 40)}px`,
                      backgroundColor: isRecording ? '#3B82F6' : '#D1D5DB'
                    }}
                  />
                ))}
              </div>

              <div className="text-center">
                {!isRecording && !hasRecorded && (
                  <p className="text-gray-600">Click the microphone to start and say the test phrase</p>
                )}
                {isRecording && (
                  <p className="text-blue-600 font-semibold">Recording... click stop or wait a moment!</p>
                )}
                {hasRecorded && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Microphone test completed!</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Transcription: {transcription}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {hasRecorded && (
              <div className="space-y-4">
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {isPhraseValid
                      ? 'Great! Your microphone is working perfectly'
                      : 'Microphone detected, but try saying the test phrase clearly'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {isPhraseValid
                      ? 'We successfully detected the test phrase. You\'re ready to start chatting with the AI assistant.'
                      : 'We detected audio, but the test phrase wasn\'t clear. Please try again.'}
                  </p>
                </div>
                
                <button
                  onClick={handleContinue}
                  disabled={!isPhraseValid}
                  className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all duration-300 ${
                    isPhraseValid ? 'hover:shadow-xl hover:scale-105' : 'opacity-50 cursor-not-allowed'
                  } inline-flex items-center justify-center gap-2`}
                >
                  Start Voice Chat
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {!hasRecorded && (
              <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                <p className="mb-2">Tips for better voice recognition:</p>
                <ul className="space-y-1">
                  <li>• Speak clearly and at a normal pace</li>
                  <li>• Ensure you're in a quiet environment</li>
                  <li>• Keep your microphone close to your mouth</li>
                  <li>• Say: "Hello, this is a microphone test"</li>
                  <li>• Click stop or wait for automatic stop</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicTestPage;