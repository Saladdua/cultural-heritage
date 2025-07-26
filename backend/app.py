from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import mysql.connector
from werkzeug.utils import secure_filename
import json
from datetime import datetime

app = Flask(__name__)
# Update the CORS configuration to allow your frontend
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'obj', 'ply', 'stl', 'glb', 'gltf'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max upload size

# Make sure uploads directory exists
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Database connection configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'heritage_user',
    'password': 'heritage_password123',
    'database': 'cultural_heritage',
    'autocommit': True
}

# Database connection
def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None

# Helper function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Test database connection endpoint
@app.route('/api/test-db', methods=['GET'])
def test_db():
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            return jsonify({"status": "success", "message": "Database connection successful"})
        except Exception as e:
            return jsonify({"status": "error", "message": f"Database query failed: {str(e)}"}), 500
    else:
        return jsonify({"status": "error", "message": "Could not connect to database"}), 500

# Add this debug route to test connection
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Backend is running"})

# API Routes
@app.route('/api/folders', methods=['GET'])
def get_folders():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT f.id, f.name, f.created_at, COUNT(m.id) as file_count
            FROM folders f
            LEFT JOIN models m ON f.id = m.folder_id
            GROUP BY f.id, f.name, f.created_at
            ORDER BY f.created_at DESC
        """)
        folders = cursor.fetchall()
        
        # Convert datetime objects to strings
        for folder in folders:
            if folder['created_at']:
                folder['created_at'] = folder['created_at'].strftime('%Y-%m-%d')
        
        cursor.close()
        conn.close()
        return jsonify(folders)
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/folders/<int:folder_id>', methods=['GET'])
def get_folder(folder_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Get folder details
        cursor.execute("SELECT id, name, created_at FROM folders WHERE id = %s", (folder_id,))
        folder = cursor.fetchone()
        
        if not folder:
            cursor.close()
            conn.close()
            return jsonify({"error": "Folder not found"}), 404
        
        # Get models in this folder
        cursor.execute("""
            SELECT id, name, file_type, file_size, uploaded_at
            FROM models
            WHERE folder_id = %s
            ORDER BY uploaded_at DESC
        """, (folder_id,))
        models = cursor.fetchall()
        
        # Convert datetime objects to strings
        if folder['created_at']:
            folder['created_at'] = folder['created_at'].strftime('%Y-%m-%d')
        
        for model in models:
            if model['uploaded_at']:
                model['uploaded_at'] = model['uploaded_at'].strftime('%Y-%m-%d')
        
        folder['models'] = models
        
        cursor.close()
        conn.close()
        return jsonify(folder)
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/folders', methods=['POST'])
def create_folder():
    data = request.json
    
    if not data or 'name' not in data:
        return jsonify({"error": "Folder name is required"}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO folders (name) VALUES (%s)", (data['name'],))
        folder_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        return jsonify({"id": folder_id, "name": data['name']}), 201
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/folders/<int:folder_id>', methods=['PUT'])
def update_folder(folder_id):
    data = request.json
    
    if not data or 'name' not in data:
        return jsonify({"error": "Folder name is required"}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE folders SET name = %s WHERE id = %s", (data['name'], folder_id))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"error": "Folder not found"}), 404
        
        cursor.close()
        conn.close()
        return jsonify({"id": folder_id, "name": data['name']})
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/folders/<int:folder_id>', methods=['DELETE'])
def delete_folder(folder_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor()
        
        # Get all models in this folder to delete their files
        cursor.execute("SELECT file_path FROM models WHERE folder_id = %s", (folder_id,))
        models = cursor.fetchall()
        
        # Delete the folder (cascade will delete models)
        cursor.execute("DELETE FROM folders WHERE id = %s", (folder_id,))
        
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"error": "Folder not found"}), 404
        
        cursor.close()
        conn.close()
        
        # Delete the actual files
        for model in models:
            file_path = model[0]
            if os.path.exists(file_path):
                os.remove(file_path)
        
        return jsonify({"message": "Folder deleted successfully"})
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/folders/<int:folder_id>/models', methods=['GET'])
def get_models(folder_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, name, file_type, file_size, uploaded_at
            FROM models
            WHERE folder_id = %s
            ORDER BY uploaded_at DESC
        """, (folder_id,))
        
        models = cursor.fetchall()
        
        # Convert datetime objects to strings
        for model in models:
            if model['uploaded_at']:
                model['uploaded_at'] = model['uploaded_at'].strftime('%Y-%m-%d')
        
        cursor.close()
        conn.close()
        return jsonify(models)
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/models/<int:model_id>', methods=['GET'])
def get_model(model_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, folder_id, name, file_path, file_type, file_size, uploaded_at
            FROM models
            WHERE id = %s
        """, (model_id,))
        
        model = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not model:
            return jsonify({"error": "Model not found"}), 404
        
        # Convert datetime to string
        if model['uploaded_at']:
            model['uploaded_at'] = model['uploaded_at'].strftime('%Y-%m-%d')
        
        return jsonify(model)
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/folders/<int:folder_id>/models', methods=['POST'])
def upload_model(folder_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor()
        
        # Check if folder exists
        cursor.execute("SELECT id FROM folders WHERE id = %s", (folder_id,))
        folder = cursor.fetchone()
        
        if not folder:
            cursor.close()
            conn.close()
            return jsonify({"error": "Folder not found"}), 404
        
        # Check if file was uploaded
        if 'file' not in request.files:
            cursor.close()
            conn.close()
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            cursor.close()
            conn.close()
            return jsonify({"error": "No selected file"}), 400
        
        if not allowed_file(file.filename):
            cursor.close()
            conn.close()
            return jsonify({"error": "File type not allowed. Supported formats: obj, ply, stl, glb, gltf"}), 400
        
        # Save the file
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        # Save file metadata to database
        file_size = os.path.getsize(file_path)
        
        cursor.execute("""
            INSERT INTO models (folder_id, name, file_path, file_type, file_size)
            VALUES (%s, %s, %s, %s, %s)
        """, (folder_id, filename, file_path, file_extension, file_size))
        
        model_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        return jsonify({
            "id": model_id,
            "name": filename,
            "file_type": file_extension,
            "file_size": file_size
        }), 201
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/models/<int:model_id>/file', methods=['GET'])
def download_model(model_id):
    """Serve the 3D model file for viewing/downloading"""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT file_path, name, file_type FROM models WHERE id = %s", (model_id,))
        model = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not model:
            return jsonify({"error": "Model not found"}), 404
        
        if not os.path.exists(model['file_path']):
            return jsonify({"error": "File not found on disk"}), 404
        
        # Set appropriate MIME type based on file extension
        mime_types = {
            'obj': 'text/plain',
            'ply': 'application/octet-stream',
            'stl': 'application/octet-stream',
            'glb': 'model/gltf-binary',
            'gltf': 'model/gltf+json'
        }
        
        mime_type = mime_types.get(model['file_type'], 'application/octet-stream')
        
        # For the 3D viewer, we want to serve the file directly (not as attachment)
        # The 'as_attachment=False' allows the browser to load it directly
        return send_file(
            model['file_path'], 
            mimetype=mime_type,
            as_attachment=False,
            download_name=model['name']
        )
    except Exception as e:
        print(f"Error serving file: {e}")
        return jsonify({"error": f"File serving error: {str(e)}"}), 500

@app.route('/api/models/<int:model_id>', methods=['DELETE'])
def delete_model(model_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor()
        
        # Get the file path
        cursor.execute("SELECT file_path FROM models WHERE id = %s", (model_id,))
        model = cursor.fetchone()
        
        if not model:
            cursor.close()
            conn.close()
            return jsonify({"error": "Model not found"}), 404
        
        file_path = model[0]
        
        # Delete from database
        cursor.execute("DELETE FROM models WHERE id = %s", (model_id,))
        cursor.close()
        conn.close()
        
        # Delete the actual file
        if os.path.exists(file_path):
            os.remove(file_path)
        
        return jsonify({"message": "Model deleted successfully"})
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

# Database initialization script
@app.route('/api/init-db', methods=['POST'])
def init_db():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor()
        
        # Create tables if they don't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS folders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS models (
                id INT AUTO_INCREMENT PRIMARY KEY,
                folder_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                file_path VARCHAR(512) NOT NULL,
                file_type ENUM('obj', 'ply', 'stl', 'glb', 'gltf') NOT NULL,
                file_size INT NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
            )
        """)
        
        cursor.close()
        conn.close()
        return jsonify({"message": "Database initialized successfully"})
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

if __name__ == '__main__':
    print("Starting Flask server...")
    print("Testing database connection...")
    
    # Test database connection on startup
    conn = get_db_connection()
    if conn:
        print("✅ Database connection successful!")
        conn.close()
    else:
        print("❌ Database connection failed!")
    
    app.run(debug=True, port=5000)
