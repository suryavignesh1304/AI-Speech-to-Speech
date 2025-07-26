import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PermissionPage from './pages/PermissionPage';
import MicTestPage from './pages/MicTestPage';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/permissions" element={<PermissionPage />} />
        <Route path="/mic-test" element={<MicTestPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </div>
  );
}

export default App;