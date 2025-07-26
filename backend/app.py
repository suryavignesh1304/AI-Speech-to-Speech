from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import speech_recognition as sr
from pydub import AudioSegment
import os
import tempfile
import mimetypes
import google.generativeai as genai
from gtts import gTTS
from io import BytesIO
import uuid
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configure Gemini AI
GEMINI_API_KEY = "AIzaSyAzrBxLpb6ePb81LdSF6M_Nsr12V1fyqkk"
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    logger.error("Gemini API key not found")


# Configure FFmpeg paths (adjust to your installation)
AudioSegment.ffmpeg = "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe"  # Update this path
AudioSegment.ffprobe = "C:\\Program Files\\ffmpeg\\bin\\ffprobe.exe"  # Update this path
AudioSegment.convert = "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe"  # Update this path
# Create directories for temporary files
UPLOAD_FOLDER = 'temp_uploads'
AUDIO_FOLDER = 'temp_audio'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)

def get_mime_type(file_path):
    """Get MIME type of a file"""
    mime_type, _ = mimetypes.guess_type(file_path)
    return mime_type or "application/octet-stream"

def transcribe_audio(file_path):
    """Transcribe audio file to text"""
    try:
        # Ensure it's an audio file
        mime = get_mime_type(file_path)
        if not mime.startswith("audio/"):
            return {"error": f"Unsupported MIME type: {mime}. Please upload an audio file."}

        # Convert to WAV format
        audio = AudioSegment.from_file(file_path)
        wav_path = file_path + ".wav"
        audio.export(wav_path, format="wav")

        # Transcribe using Google Speech Recognition
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
        
        transcribed_text = recognizer.recognize_google(audio_data)
        
        # Clean up temporary WAV file
        if os.path.exists(wav_path):
            os.unlink(wav_path)
            
        return {"text": transcribed_text}

    except sr.UnknownValueError:
        return {"error": "Could not understand audio."}
    except sr.RequestError as e:
        return {"error": f"Speech recognition service error: {e}"}
    except Exception as e:
        logger.error(f"Audio transcription failed: {str(e)}")
        return {"error": f"Audio transcription failed: {str(e)}"}

def get_gemini_response(text):
    """Get AI response from Gemini"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(text)
        return {"text": response.text}
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        return {"error": f"Gemini API error: {str(e)}"}

def text_to_speech(text, filename=None):
    """Convert text to speech and save as file"""
    try:
        if filename is None:
            filename = f"response_{uuid.uuid4().hex}.mp3"
        
        file_path = os.path.join(AUDIO_FOLDER, filename)
        
        tts = gTTS(text=text, lang='en')
        tts.save(file_path)
        
        return {"file_path": file_path, "filename": filename}
    except Exception as e:
        logger.error(f"Text-to-speech conversion failed: {str(e)}")
        return {"error": f"Text-to-speech conversion failed: {str(e)}"}

@app.route('/api/process-audio', methods=['POST'])
def process_audio():
    """Process uploaded audio file"""
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({"error": "No audio file selected"}), 400

        # Save uploaded file
        filename = f"upload_{uuid.uuid4().hex}.wav"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        audio_file.save(file_path)

        # Transcribe audio to text
        logger.info("Transcribing audio...")
        transcription_result = transcribe_audio(file_path)
        
        if "error" in transcription_result:
            return jsonify(transcription_result), 400

        transcribed_text = transcription_result["text"]
        logger.info(f"Transcription: {transcribed_text}")

        # Get AI response
        logger.info("Getting AI response...")
        ai_response = get_gemini_response(transcribed_text)
        
        if "error" in ai_response:
            return jsonify(ai_response), 400

        response_text = ai_response["text"]
        logger.info(f"AI Response: {response_text}")

        # Convert response to speech
        logger.info("Converting to speech...")
        tts_result = text_to_speech(response_text)
        
        if "error" in tts_result:
            return jsonify(tts_result), 400

        # Clean up uploaded file
        if os.path.exists(file_path):
            os.unlink(file_path)

        return jsonify({
            "transcription": transcribed_text,
            "response": response_text,
            "audio_url": f"/api/audio/{tts_result['filename']}"
        })

    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

@app.route('/api/transcribe-only', methods=['POST'])
def transcribe_only():
    """Transcribe audio without AI processing - for mic testing"""
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        if audio_file.filename == '':
            return jsonify({"error": "No audio file selected"}), 400

        # Save uploaded file
        filename = f"test_{uuid.uuid4().hex}.wav"
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        audio_file.save(file_path)

        # Transcribe audio to text only
        logger.info("Transcribing audio for mic test...")
        transcription_result = transcribe_audio(file_path)
        
        # Clean up uploaded file
        if os.path.exists(file_path):
            os.unlink(file_path)
        
        if "error" in transcription_result:
            return jsonify(transcription_result), 400

        transcribed_text = transcription_result["text"]
        # Validate the test phrase
        is_valid = transcribed_text and "microphone test" in transcribed_text.lower()

        return jsonify({
            "transcription": transcribed_text,
            "isValid": is_valid
        })

    except Exception as e:
        logger.error(f"Error transcribing audio: {str(e)}")
        return jsonify({"error": f"Transcription failed: {str(e)}"}), 500

@app.route('/api/audio/<filename>')
def get_audio(filename):
    """Serve audio files"""
    try:
        file_path = os.path.join(AUDIO_FOLDER, filename)
        if os.path.exists(file_path):
            return send_file(file_path, mimetype='audio/mpeg')
        else:
            return jsonify({"error": "Audio file not found"}), 404
    except Exception as e:
        logger.error(f"Error serving audio: {str(e)}")
        return jsonify({"error": "Failed to serve audio"}), 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)