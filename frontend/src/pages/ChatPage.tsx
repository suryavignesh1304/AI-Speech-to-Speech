import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, ArrowLeft, MessageCircle, Bot, User, Square } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
  isTyping?: boolean; // Added for typing effect
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false); // Track speaking state
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();
  const audioChunksRef = useRef<Blob[]>([]);

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
    if (isRecording || isProcessing) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        processAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      monitorAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isProcessing) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    }
  };

  const monitorAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
      setAudioLevel(average);
    }
    if (isRecording) animationRef.current = requestAnimationFrame(monitorAudioLevel);
  };

  const typeText = (text: string, index: number, messageId: string) => {
    if (index < text.length) {
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, content: text.slice(0, index + 1), isTyping: true } : msg
      ));
      setTimeout(() => typeText(text, index + 1, messageId), 50); // Adjust speed here (50ms per character)
    } else {
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, isTyping: false } : msg
      ));
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      const response = await fetch('http://localhost:5000/api/process-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to process audio');
      const result = await response.json();
      
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: result.transcription,
        timestamp: new Date(),
        isAudio: true,
      };
      setMessages(prev => [...prev, userMessage]);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        isAudio: true,
        isTyping: true,
      };
      setMessages(prev => [...prev, assistantMessage]);

      setIsSpeaking(true);
      typeText(result.response, 0, assistantMessage.id); // Start typing
      if (result.audio_url) {
        const audio = new Audio(`http://localhost:5000${result.audio_url}`);
        audio.play().catch(error => console.error('Error playing audio:', error));
        audio.onended = () => setIsSpeaking(false); // Stop speaking indicator when audio ends
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/mic-test')} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Mic Test
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Voice AI Chat</h1>
          <div className="w-20"></div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Start a conversation</h3>
              <p className="text-gray-600">Click the microphone to start speaking, then click stop to send</p>
            </div>
          ) : messages.map((message) => (
            <div key={message.id} className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.type === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-gray-900 shadow-sm'}`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}{message.isTyping && <span className="typing-dots"><span>.</span><span>.</span><span>.</span></span>}</p>
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white text-gray-900 shadow-sm px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Processing...</span>
                </div>
              </div>
            </div>
          )}
          {isSpeaking && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white text-gray-900 shadow-sm px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-blue-600">Speaking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center gap-1 h-12">
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
            <div className="relative flex items-center justify-center gap-8">
              <button
                onClick={startRecording}
                disabled={isRecording || isProcessing}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 ${isRecording ? 'bg-red-500 animate-pulse scale-110' : 'bg-gradient-to-br from-blue-500 to-purple-600 hover:shadow-xl hover:scale-105'} ${isRecording || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <button
                onClick={stopRecording}
                disabled={!isRecording || isProcessing}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all duration-300 ${isRecording ? 'bg-red-500 hover:shadow-xl hover:scale-105' : 'bg-gray-400 cursor-not-allowed'} ${!isRecording || isProcessing ? 'opacity-50' : ''}`}
              >
                <Square className="w-6 h-6" />
              </button>
            </div>
            <div className="text-center">
              {!isRecording && !isProcessing && <p className="text-gray-600 text-sm">Click to start speaking, then click stop to send</p>}
              {isRecording && <p className="text-blue-600 font-semibold text-sm">Recording... click stop to send</p>}
              {isProcessing && <p className="text-purple-600 font-semibold text-sm">Processing your message...</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;