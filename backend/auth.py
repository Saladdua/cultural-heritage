import bcrypt
import jwt
import secrets
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app
import mysql.connector
from typing import Optional, Dict, Any

class AuthManager:
    def __init__(self, db_config: Dict[str, str], secret_key: str):
        self.db_config = db_config
        self.secret_key = secret_key
        
    def get_db_connection(self):
        """Get database connection"""
        try:
            return mysql.connector.connect(**self.db_config)
        except mysql.connector.Error as err:
            print(f"Database connection error: {err}")
            return None
    
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def generate_session_token(self) -> str:
        """Generate secure session token"""
        return secrets.token_urlsafe(32)
    
    def create_jwt_token(self, user_id: int, username: str) -> str:
        """Create JWT token for user"""
        payload = {
            'user_id': user_id,
            'username': username,
            'exp': datetime.utcnow() + timedelta(hours=24),
            'iat': datetime.utcnow()
        }
        # Use PyJWT's encode method
        return jwt.encode(payload, self.secret_key, algorithm='HS256')
    
    def verify_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify JWT token and return payload"""
        try:
            # Use PyJWT's decode method
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            print("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            print(f"Invalid token: {e}")
            return None
    
    def register_user(self, username: str, email: str, password: str, 
                     first_name: str = None, last_name: str = None, 
                     organization: str = None, role: str = 'researcher') -> Dict[str, Any]:
        """Register new user"""
        conn = self.get_db_connection()
        if not conn:
            return {"error": "Database connection failed"}
        
        try:
            cursor = conn.cursor(dictionary=True)
            
            # Check if username or email already exists
            cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
            if cursor.fetchone():
                return {"error": "Username or email already exists"}
            
            # Hash password
            password_hash = self.hash_password(password)
            
            # Insert new user
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, first_name, last_name, organization, role)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (username, email, password_hash, first_name, last_name, organization, role))
            
            user_id = cursor.lastrowid
            
            # Create user's personal database name
            user_db_name = f"heritage_user_{user_id}"
            cursor.execute("""
                INSERT INTO user_databases (user_id, database_name)
                VALUES (%s, %s)
            """, (user_id, user_db_name))
            
            cursor.close()
            conn.close()
            
            return {
                "success": True,
                "user_id": user_id,
                "username": username,
                "database_name": user_db_name
            }
            
        except Exception as e:
            print(f"Registration error: {e}")
            return {"error": f"Registration failed: {str(e)}"}
    
    def authenticate_user(self, username: str, password: str) -> Dict[str, Any]:
        """Authenticate user login"""
        conn = self.get_db_connection()
        if not conn:
            return {"error": "Database connection failed"}
        
        try:
            cursor = conn.cursor(dictionary=True)
            
            # Get user by username or email
            cursor.execute("""
                SELECT id, username, email, password_hash, first_name, last_name, 
                       organization, role, is_active
                FROM users 
                WHERE (username = %s OR email = %s) AND is_active = TRUE
            """, (username, username))
            
            user = cursor.fetchone()
            
            if not user or not self.verify_password(password, user['password_hash']):
                return {"error": "Invalid credentials"}
            
            # Update last login
            cursor.execute("UPDATE users SET last_login = NOW() WHERE id = %s", (user['id'],))
            
            # Generate JWT token
            token = self.create_jwt_token(user['id'], user['username'])
            
            # Create session
            session_token = self.generate_session_token()
            expires_at = datetime.now() + timedelta(hours=24)
            
            cursor.execute("""
                INSERT INTO user_sessions (user_id, session_token, expires_at)
                VALUES (%s, %s, %s)
            """, (user['id'], session_token, expires_at))
            
            # Get user's database
            cursor.execute("SELECT database_name FROM user_databases WHERE user_id = %s", (user['id'],))
            user_db = cursor.fetchone()
            
            cursor.close()
            conn.close()
            
            return {
                "success": True,
                "token": token,
                "session_token": session_token,
                "user": {
                    "id": user['id'],
                    "username": user['username'],
                    "email": user['email'],
                    "first_name": user['first_name'],
                    "last_name": user['last_name'],
                    "organization": user['organization'],
                    "role": user['role'],
                    "database_name": user_db['database_name'] if user_db else None
                }
            }
            
        except Exception as e:
            print(f"Authentication error: {e}")
            return {"error": f"Authentication failed: {str(e)}"}
    
    def get_user_from_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Get user information from JWT token"""
        payload = self.verify_jwt_token(token)
        if not payload:
            return None
        
        conn = self.get_db_connection()
        if not conn:
            return None
        
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("""
                SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
                       u.organization, u.role, ud.database_name
                FROM users u
                LEFT JOIN user_databases ud ON u.id = ud.user_id
                WHERE u.id = %s AND u.is_active = TRUE
            """, (payload['user_id'],))
            
            user = cursor.fetchone()
            cursor.close()
            conn.close()
            
            return user
            
        except Exception as e:
            print(f"Error getting user from token: {e}")
            return None
    
    def log_user_activity(self, user_id: int, action: str, resource_type: str = None, 
                         resource_id: int = None, details: Dict = None, 
                         ip_address: str = None, user_agent: str = None):
        """Log user activity"""
        conn = self.get_db_connection()
        if not conn:
            return
        
        try:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO user_activity_log 
                (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (user_id, action, resource_type, resource_id, 
                  str(details) if details else None, ip_address, user_agent))
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"Error logging user activity: {e}")

def require_auth(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid authorization header format'}), 401
        
        if not token:
            return jsonify({'error': 'Authentication token is missing'}), 401
        
        # Get auth manager from app context
        auth_manager = current_app.auth_manager
        user = auth_manager.get_user_from_token(token)
        
        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Add user to request context
        request.current_user = user
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_role(required_role):
    """Decorator to require specific role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, 'current_user'):
                return jsonify({'error': 'Authentication required'}), 401
            
            user_role = request.current_user.get('role')
            if user_role != required_role and user_role != 'admin':
                return jsonify({'error': f'Role {required_role} required'}), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator
