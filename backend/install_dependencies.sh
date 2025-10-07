#!/bin/bash

# Script to install Python dependencies for the backend

echo "Installing Python dependencies..."

# Uninstall conflicting jwt package if it exists
pip uninstall -y jwt

# Install required packages
pip install flask>=3.0.0
pip install flask-cors>=4.0.0
pip install mysql-connector-python>=8.0.33
pip install werkzeug>=3.0.0
pip install PyJWT>=2.8.0
pip install bcrypt>=4.1.0
pip install python-dotenv>=1.0.0

echo "✅ All dependencies installed successfully!"
echo ""
echo "To start the backend server, run:"
echo "  cd backend"
echo "  python app.py"
