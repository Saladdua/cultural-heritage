# 📊 phpMyAdmin Setup & Database Access Guide

## What is phpMyAdmin?

phpMyAdmin is a free, web-based graphical interface for managing MySQL databases. It makes it easy to view, edit, and manage your database tables without using command-line tools.

---

## Installation Instructions

### For Windows (XAMPP)

1. **Download XAMPP**
   - Visit: https://www.apachefriends.org/
   - Download XAMPP for Windows
   - Run the installer

2. **Install XAMPP**
   - Choose installation directory (e.g., `C:\xampp`)
   - Select components: Apache, MySQL, phpMyAdmin
   - Complete installation

3. **Start Services**
   - Open XAMPP Control Panel
   - Click "Start" for Apache
   - Click "Start" for MySQL
   - Both should show green "Running" status

4. **Access phpMyAdmin**
   - Open browser
   - Go to: `http://localhost/phpmyadmin`
   - phpMyAdmin interface should load

### For Mac (MAMP or Homebrew)

**Option 1: Using MAMP**
1. Download MAMP from: https://www.mamp.info/
2. Install MAMP
3. Start MAMP servers
4. Access phpMyAdmin at: `http://localhost:8888/phpMyAdmin`

**Option 2: Using Homebrew**
\`\`\`bash
# Install phpMyAdmin
brew install phpmyadmin

# Link phpMyAdmin to web server
sudo ln -s /usr/local/share/phpmyadmin /Library/WebServer/Documents/phpmyadmin

# Start Apache
sudo apachectl start

# Access at: http://localhost/phpmyadmin
\`\`\`

### For Linux (Ubuntu/Debian)

\`\`\`bash
# Update package list
sudo apt update

# Install phpMyAdmin
sudo apt install phpmyadmin php-mbstring php-zip php-gd php-json php-curl

# During installation:
# - Select "apache2" when prompted
# - Choose "Yes" to configure database for phpMyAdmin with dbconfig-common
# - Set a password for phpMyAdmin

# Enable PHP modules
sudo phpenmod mbstring

# Restart Apache
sudo systemctl restart apache2

# Access at: http://localhost/phpmyadmin
\`\`\`

---

## Accessing Your Cultural Heritage Database

### Step 1: Login to phpMyAdmin

1. Open your browser
2. Navigate to phpMyAdmin URL (depends on your installation):
   - XAMPP Windows: `http://localhost/phpmyadmin`
   - XAMPP Mac: `http://localhost/phpmyadmin`
   - MAMP: `http://localhost:8888/phpMyAdmin`
   - Linux: `http://localhost/phpmyadmin`

3. **Login credentials:**
   - Username: `heritage_user`
   - Password: `heritage_password123`

### Step 2: Select Database

1. Look at the left sidebar
2. Click on `cultural_heritage` database
3. You'll see all tables in your database

### Step 3: View Tables

Click on any table to view its contents:

**Main Tables:**
- `users` - User accounts and profiles
- `folders` - User's folder organization
- `models` - 3D model files and metadata
- `user_sessions` - Active user sessions
- `user_activity_log` - Activity tracking

---

## Common Operations in phpMyAdmin

### 1. View All Data in a Table

1. Click on table name (e.g., `users`)
2. Click "Browse" tab at the top
3. View all records in the table

### 2. Search for Specific Data

1. Click on table name
2. Click "Search" tab
3. Enter search criteria
4. Click "Go"

### 3. View Database Structure

1. Click on table name
2. Click "Structure" tab
3. See all columns, data types, and indexes

### 4. Run SQL Queries

1. Click "SQL" tab at the top
2. Enter your SQL query
3. Click "Go"

**Example queries:**
\`\`\`sql
-- View all users
SELECT * FROM users;

-- Count models per user
SELECT u.username, COUNT(m.id) as model_count 
FROM users u 
LEFT JOIN models m ON u.id = m.user_id 
GROUP BY u.id;

-- View folders with model counts
SELECT f.name, COUNT(m.id) as file_count 
FROM folders f 
LEFT JOIN models m ON f.id = m.folder_id 
GROUP BY f.id;

-- Find largest models
SELECT name, file_type, file_size/1024/1024 as size_mb 
FROM models 
ORDER BY file_size DESC 
LIMIT 10;
\`\`\`

### 5. Export Database

1. Click on `cultural_heritage` database
2. Click "Export" tab
3. Select "Quick" or "Custom" export
4. Choose format (SQL recommended)
5. Click "Go"
6. Save the .sql file

### 6. Import Database

1. Click on `cultural_heritage` database
2. Click "Import" tab
3. Click "Choose File"
4. Select your .sql file
5. Click "Go"

---

## Understanding Your Database Tables

### `users` Table
**Purpose:** Stores user account information

**Key Columns:**
- `id` - Unique user identifier
- `username` - User's login name
- `email` - User's email address
- `password_hash` - Encrypted password (DO NOT share)
- `first_name` / `last_name` - User's full name
- `organization` - User's institution
- `role` - User role (researcher, curator, student, admin)
- `created_at` - Account creation date
- `last_login` - Last login timestamp

### `folders` Table
**Purpose:** Organizes 3D models into folders

**Key Columns:**
- `id` - Unique folder identifier
- `user_id` - Owner of the folder
- `name` - Folder name
- `description` - Folder description
- `created_at` - Creation date

### `models` Table
**Purpose:** Stores 3D model metadata

**Key Columns:**
- `id` - Unique model identifier
- `user_id` - Model owner
- `folder_id` - Parent folder
- `name` - Original filename
- `file_path` - Location on server
- `file_type` - File format (obj, ply, stl, glb, gltf)
- `file_size` - File size in bytes
- `uploaded_at` - Upload timestamp

### `user_sessions` Table
**Purpose:** Tracks active user sessions

**Key Columns:**
- `id` - Session identifier
- `user_id` - User associated with session
- `session_token` - Unique session token
- `expires_at` - Session expiration time

### `user_activity_log` Table
**Purpose:** Records user actions for security and analytics

**Key Columns:**
- `id` - Log entry identifier
- `user_id` - User who performed action
- `action` - Action type (login, upload_model, create_folder, etc.)
- `resource_type` - Type of resource affected
- `resource_id` - ID of affected resource
- `created_at` - When action occurred

---

## Troubleshooting

### phpMyAdmin Won't Load

**Issue:** Browser shows "Unable to connect"

**Solutions:**
1. Check if Apache is running (XAMPP Control Panel)
2. Check if MySQL is running (XAMPP Control Panel)
3. Try restarting both services
4. Check firewall settings

### Can't Login to phpMyAdmin

**Issue:** "Access denied" error

**Solution:**
\`\`\`bash
# Reset MySQL password
mysql -u root -p
# Then run:
ALTER USER 'heritage_user'@'localhost' IDENTIFIED BY 'heritage_password123';
FLUSH PRIVILEGES;
\`\`\`

### Database Not Showing

**Issue:** `cultural_heritage` database not visible

**Solution:**
\`\`\`bash
# Run database initialization
cd backend
mysql -u heritage_user -p cultural_heritage < schema_with_auth.sql
\`\`\`

### phpMyAdmin Shows Error #1045

**Issue:** Access denied for user

**Solution:**
1. Login as root first
2. Create user if doesn't exist:
\`\`\`sql
CREATE USER 'heritage_user'@'localhost' IDENTIFIED BY 'heritage_password123';
GRANT ALL PRIVILEGES ON cultural_heritage.* TO 'heritage_user'@'localhost';
FLUSH PRIVILEGES;
\`\`\`

---

## Security Best Practices

1. **Never share your database credentials**
2. **Don't expose phpMyAdmin to the internet** (only use on localhost)
3. **Regular backups** - Export your database weekly
4. **Strong passwords** - Use complex passwords in production
5. **Monitor activity** - Check `user_activity_log` table regularly

---

## Quick Reference Commands

### View all users:
\`\`\`sql
SELECT username, email, role, created_at FROM users;
\`\`\`

### Count items:
\`\`\`sql
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM folders) as total_folders,
  (SELECT COUNT(*) FROM models) as total_models;
\`\`\`

### View user's folders and models:
\`\`\`sql
SELECT 
  u.username,
  f.name as folder_name,
  COUNT(m.id) as model_count
FROM users u
LEFT JOIN folders f ON u.id = f.user_id
LEFT JOIN models m ON f.id = m.folder_id
GROUP BY u.id, f.id;
\`\`\`

### Check database size:
\`\`\`sql
SELECT 
  table_name,
  round(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM information_schema.TABLES
WHERE table_schema = 'cultural_heritage'
ORDER BY size_mb DESC;
\`\`\`

---

## Additional Resources

- phpMyAdmin Documentation: https://docs.phpmyadmin.net/
- MySQL Documentation: https://dev.mysql.com/doc/
- XAMPP Documentation: https://www.apachefriends.org/docs/

**Need Help?** Check the user activity log in phpMyAdmin to debug issues with your application!
