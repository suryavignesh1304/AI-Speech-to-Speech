import os
import sys
import subprocess

def install_requirements():
    """Install required packages"""
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])

def run_app():
    """Run the Flask application"""
    os.environ['FLASK_APP'] = 'app.py'
    os.environ['FLASK_ENV'] = 'development'
    
    # Install requirements first
    print("Installing requirements...")
    install_requirements()
    
    # Run the app
    print("Starting Flask server...")
    from app import app
    app.run(debug=True, host='0.0.0.0', port=5000)

if __name__ == '__main__':
    run_app()