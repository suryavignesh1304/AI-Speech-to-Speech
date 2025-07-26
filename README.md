# Voice AI Assistant

A modern speech-to-speech AI application with a React frontend and Flask backend.

## Features

- **Interactive Homepage**: Beautiful landing page with smooth animations
- **Permission Flow**: Guided microphone and webcam permission request
- **Microphone Testing**: Test audio input before starting
- **Voice Chat**: Real-time speech-to-speech conversation with AI
- **Advanced AI**: Powered by Google Gemini for intelligent responses
- **Natural Voice**: High-quality text-to-speech output

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for fast development
- Tailwind CSS for styling
- React Router for navigation
- Web Audio API for voice processing

### Backend
- Flask (Python)
- Google Speech Recognition
- Google Gemini AI
- Google Text-to-Speech (gTTS)
- Audio processing with pydub

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- Microphone and webcam access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tensorgo/project
   ```

2. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Setup Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

### Configuration

- **API Keys**: Update the Gemini API key in `backend/.env`
- **FFmpeg**: Ensure FFmpeg is installed and paths are correct in `backend/app.py`
- **CORS**: Backend is configured to allow frontend requests

## Usage

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

**User Journey:**
1. Visit homepage and click "Get Started"
2. Grant microphone and webcam permissions
3. Test microphone functionality
4. Start voice conversation with AI

## API Endpoints

- `POST /api/process-audio` - Process audio and get AI response
- `POST /api/transcribe-only` - Transcribe audio for mic test
- `GET /api/audio/<filename>` - Serve generated audio files
- `GET /api/health` - Health check endpoint

## File Structure

```
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── PermissionPage.tsx
│   │   │   ├── MicTestPage.tsx
│   │   │   └── ChatPage.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .env
└── README.md
```

## Development

### Frontend
```bash
cd frontend
npm run dev
```

### Backend
```bash
cd backend
python app.py
```

## Deployment

- Frontend: Build with `npm run build` and deploy to Netlify, Vercel, etc.
- Backend: Deploy to Heroku, Railway, etc. Update CORS for production.

## License

MIT License - see LICENSE