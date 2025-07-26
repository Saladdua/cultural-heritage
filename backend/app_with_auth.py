from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import uuid
import mysql.connector
from werkzeug.utils import secure_filename
import json
from datetime import datetime
from auth import AuthManager, require_auth, require_role

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'

# Update the CORS configuration to allow your frontend
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'obj', 'ply', 'stl', 'glb', 'gltf'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max upload size

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

# Initialize auth manager
auth_manager = AuthManager(DB_CONFIG, app.config['SECRET_KEY'])
app.auth_manager = auth_manager

# Database connection
def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None

def get_user_db_connection(user_id: int):
    """Get connection to user's personal database"""
    # For now, we'll use the same database but filter by user_id
    # In production, you might want separate databases per user
    return get_db_connection()

# Helper function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    
    required_fields = ['username', 'email', 'password']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    result = auth_manager.register_user(
        username=data['username'],
        email=data['email'],
        password=data['password'],
        first_name=data.get('first_name'),
        last_name=data.get('last_name'),
        organization=data.get('organization'),
        role=data.get('role', 'researcher')
    )
    
    if 'error' in result:
        return jsonify(result), 400
    
    return jsonify(result), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"error": "Username and password required"}), 400
    
    result = auth_manager.authenticate_user(data['username'], data['password'])
    
    if 'error' in result:
        return jsonify(result), 401
    
    # Log login activity
    auth_manager.log_user_activity(
        user_id=result['user']['id'],
        action='login',
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    
    return jsonify(result)

@app.route('/api/auth/logout', methods=['POST'])
@require_auth
def logout():
    user_id = request.current_user['id']
    
    # Log logout activity
    auth_manager.log_user_activity(
        user_id=user_id,
        action='logout',
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    
    return jsonify({"message": "Logged out successfully"})

@app.route('/api/auth/profile', methods=['GET'])
@require_auth
def get_profile():
    return jsonify({"user": request.current_user})

# Protected API Routes (now require authentication)
@app.route('/api/folders', methods=['GET'])
@require_auth
def get_folders():
    user_id = request.current_user['id']
    conn = get_user_db_connection(user_id)
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT f.id, f.name, f.description, f.created_at, COUNT(m.id) as file_count
            FROM folders f
            LEFT JOIN models m ON f.id = m.folder_id
            WHERE f.user_id = %s
            GROUP BY f.id, f.name, f.description, f.created_at
            ORDER BY f.created_at DESC
        """, (user_id,))
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

@app.route('/api/folders', methods=['POST'])
@require_auth
def create_folder():
    user_id = request.current_user['id']
    data = request.json
    
    if not data or 'name' not in data:
        return jsonify({"error": "Folder name is required"}), 400
    
    conn = get_user_db_connection(user_id)
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO folders (user_id, name, description) 
            VALUES (%s, %s, %s)
        """, (user_id, data['name'], data.get('description', '')))
        folder_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        # Log activity
        auth_manager.log_user_activity(
            user_id=user_id,
            action='create_folder',
            resource_type='folder',
            resource_id=folder_id,
            details={'name': data['name']}
        )
        
        return jsonify({"id": folder_id, "name": data['name']}), 201
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/folders/<int:folder_id>', methods=['GET'])
@require_auth
def get_folder(folder_id):
    user_id = request.current_user['id']
    conn = get_user_db_connection(user_id)
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Get folder details (ensure user owns it)
        cursor.execute("""
            SELECT id, name, description, created_at 
            FROM folders 
            WHERE id = %s AND user_id = %s
        """, (folder_id, user_id))
        folder = cursor.fetchone()
        
        if not folder:
            cursor.close()
            conn.close()
            return jsonify({"error": "Folder not found"}), 404
        
        # Get models in this folder
        cursor.execute("""
            SELECT id, name, description, file_type, file_size, uploaded_at
            FROM models
            WHERE folder_id = %s AND user_id = %s
            ORDER BY uploaded_at DESC
        """, (folder_id, user_id))
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

@app.route('/api/folders/<int:folder_id>/models', methods=['POST'])
@require_auth
def upload_model(folder_id):
    user_id = request.current_user['id']
    conn = get_user_db_connection(user_id)
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor()
        
        # Check if folder exists and belongs to user
        cursor.execute("SELECT id FROM folders WHERE id = %s AND user_id = %s", (folder_id, user_id))
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
        
        # Create user-specific upload directory
        user_upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], f"user_{user_id}")
        os.makedirs(user_upload_dir, exist_ok=True)
        
        # Save the file
        filename = secure_filename(file.filename)
        file_extension = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(user_upload_dir, unique_filename)
        file.save(file_path)
        
        # Save file metadata to database
        file_size = os.path.getsize(file_path)
        
        cursor.execute("""
            INSERT INTO models (user_id, folder_id, name, description, file_path, file_type, file_size)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (user_id, folder_id, filename, request.form.get('description', ''), file_path, file_extension, file_size))
        
        model_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        # Log activity
        auth_manager.log_user_activity(
            user_id=user_id,
            action='upload_model',
            resource_type='model',
            resource_id=model_id,
            details={'filename': filename, 'file_size': file_size}
        )
        
        return jsonify({
            "id": model_id,
            "name": filename,
            "file_type": file_extension,
            "file_size": file_size
        }), 201
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/api/models/<int:model_id>', methods=['GET'])
@require_auth
def get_model(model_id):
    user_id = request.current_user['id']
    conn = get_user_db_connection(user_id)
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, folder_id, name, description, file_path, file_type, file_size, uploaded_at
            FROM models
            WHERE id = %s AND user_id = %s
        """, (model_id, user_id))
        
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

@app.route('/api/models/<int:model_id>/file', methods=['GET'])
@require_auth
def download_model(model_id):
    """Serve the 3D model file for viewing/downloading"""
    user_id = request.current_user['id']
    conn = get_user_db_connection(user_id)
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT file_path, name, file_type 
            FROM models 
            WHERE id = %s AND user_id = %s
        """, (model_id, user_id))
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
        
        return send_file(
            model['file_path'], 
            mimetype=mime_type,
            as_attachment=False,
            download_name=model['name']
        )
    except Exception as e:
        print(f"Error serving file: {e}")
        return jsonify({"error": f"File serving error: {str(e)}"}), 500

# Admin Routes
@app.route('/api/admin/users', methods=['GET'])
@require_auth
@require_role('admin')
def get_all_users():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
                   u.organization, u.role, u.created_at, u.last_login, u.is_active,
                   COUNT(m.id) as model_count
            FROM users u
            LEFT JOIN models m ON u.id = m.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        """)
        users = cursor.fetchall()
        
        # Convert datetime objects to strings
        for user in users:
            if user['created_at']:
                user['created_at'] = user['created_at'].strftime('%Y-%m-%d %H:%M:%S')
            if user['last_login']:
                user['last_login'] = user['last_login'].strftime('%Y-%m-%d %H:%M:%S')
        
        cursor.close()
        conn.close()
        return jsonify(users)
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

# Health check and initialization
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "3D Cultural Heritage API is running"})

@app.route('/api/init-db', methods=['POST'])
def init_db():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        cursor = conn.cursor()
        
        # Read and execute the schema file
        with open('schema_with_auth.sql', 'r') as f:
            schema_sql = f.read()
        
        # Execute each statement separately
        statements = schema_sql.split(';')
        for statement in statements:
            if statement.strip():
                cursor.execute(statement)
        
        cursor.close()
        conn.close()
        return jsonify({"message": "Database initialized successfully with authentication"})
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

if __name__ == '__main__':
    print("Starting Flask server with authentication...")
    print("Testing database connection...")
    
    # Test database connection on startup
    conn = get_db_connection()
    if conn:
        print("✅ Database connection successful!")
        conn.close()
    else:
        print("❌ Database connection failed!")
    
    app.run(debug=True, port=5000)
