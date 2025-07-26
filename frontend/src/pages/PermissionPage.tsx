import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Shield, CheckCircle, XCircle, ArrowRight, ArrowLeft, Video } from 'lucide-react';

const PermissionPage: React.FC = () => {
  const navigate = useNavigate();
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [isRequesting, setIsRequesting] = useState(false);

  const requestPermissions = async () => {
    setIsRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
    } catch (error) {
      setPermissionStatus('denied');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleContinue = () => {
    if (permissionStatus === 'granted') {
      navigate('/mic-test');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full text-center animate-fade-in">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Permissions
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed">
              We need access to your microphone and webcam for voice and visual input processing.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mic className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">Microphone Access</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Listen to your voice commands</li>
                    <li>• Convert speech to text</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-4 mt-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Video className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">Webcam Access</h3>
                  <ul className="text-gray-600 space-y-1 text-sm">
                    <li>• Capture visual input</li>
                    <li>• Enhance AI understanding</li>
                  </ul>
                </div>
              </div>
            </div>

            {permissionStatus === 'pending' && (
              <button
                onClick={requestPermissions}
                disabled={isRequesting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRequesting ? 'Requesting Permissions...' : 'Allow Microphone & Webcam'}
              </button>
            )}

            {permissionStatus === 'granted' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  <span className="font-semibold">Permissions Granted!</span>
                </div>
                <button
                  onClick={handleContinue}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 inline-flex items-center justify-center gap-2"
                >
                  Continue to Mic Test
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {permissionStatus === 'denied' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 text-red-600">
                  <XCircle className="w-6 h-6" />
                  <span className="font-semibold">Permission Denied</span>
                </div>
                <div className="text-sm text-gray-600 bg-red-50 p-4 rounded-lg">
                  <p className="mb-2">To use the voice AI assistant, please:</p>
                  <ul className="space-y-1">
                    <li>• Click the microphone/webcam icon in your browser's address bar</li>
                    <li>• Select "Allow" for permissions</li>
                    <li>• Refresh this page and try again</li>
                  </ul>
                </div>
                <button
                  onClick={requestPermissions}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionPage;