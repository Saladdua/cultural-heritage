#!/usr/bin/env python3
"""
Quick script to check what's in your database
"""

import mysql.connector

def check_database():
    # Database configuration
    db_config = {
        'host': 'localhost',
        'user': 'heritage_user',
        'password': 'heritage_password123',
        'database': 'cultural_heritage',
        'autocommit': True
    }
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        print("🔍 Checking Database Contents...")
        print("=" * 40)
        
        # Check folders
        cursor.execute("SELECT * FROM folders")
        folders = cursor.fetchall()
        print(f"📁 Folders ({len(folders)}):")
        for folder in folders:
            print(f"  - ID: {folder['id']}, Name: {folder['name']}")
        
        # Check models
        cursor.execute("""
            SELECT m.*, f.name as folder_name 
            FROM models m 
            LEFT JOIN folders f ON m.folder_id = f.id
        """)
        models = cursor.fetchall()
        print(f"\n🎯 Models ({len(models)}):")
        for model in models:
            print(f"  - ID: {model['id']}, Name: {model['name']}")
            print(f"    Folder: {model['folder_name']}")
            print(f"    File: {model['file_path']}")
            print(f"    Type: {model['file_type']}")
            print()
        
        cursor.close()
        conn.close()
        
        if len(models) == 0:
            print("⚠️  No models found!")
            print("\nTo add models:")
            print("1. Start Flask server: python app.py")
            print("2. Open http://localhost:3000")
            print("3. Upload some 3D models")
        else:
            print(f"✅ Ready to evaluate {len(models)} models!")
            
    except Exception as e:
        print(f"❌ Database error: {e}")

if __name__ == "__main__":
    check_database()
