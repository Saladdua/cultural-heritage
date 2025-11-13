# 3D Cultural Heritage Visualization Platform

A web-based platform for uploading, managing, and interactively visualizing 3D models of cultural artifacts. Built with modern web technologies to make digital heritage accessible to researchers, curators, and students worldwide.

## 🎯 Overview

This platform addresses the challenge of digital preservation and accessibility of cultural heritage by providing:

- **Universal Web Access**: View 3D artifacts from anywhere without software installation
- **Interactive Exploration**: Rotate, zoom, and examine 3D models in real-time with WebGL rendering
- **Advanced Analysis Tools**: Face-level coloring and exploded views for detailed artifact examination
- **Collaborative Environment**: Multi-user system with role-based access control
- **Integrated Management**: Unified folder system for organizing collections

## ✨ Key Features

### Authentication & Authorization
- JWT token-based authentication with bcrypt password hashing (12-round cost factor)
- Role-based access control (Admin, Researcher, Curator, Student)
- Secure user data isolation

### 3D Model Management
- Support for multiple formats: OBJ, PLY, STL, GLB, GLTF
- File upload with validation (max 100MB)
- Automatic model centering and scaling
- Metadata storage and search functionality

### Interactive 3D Viewer
- **Smooth Navigation**: Rotate, pan, zoom with mouse or touch
- **Face Detection & Coloring**: Select and color individual mesh faces for analysis
- **Exploded View**: Separate mesh faces from center for detailed examination
- **GPU-Accelerated Rendering**: 60 FPS performance for models up to 100k faces

### Gallery System
- Browse all uploaded models from all users
- Read-only access to others' models
- Full edit/delete rights for own models
- Real-time search and filtering

### Folder Organization
- Create, rename, and delete folders
- Organize models into collections
- View folder contents with detailed metadata

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **3D Graphics**: Three.js (v0.171.0) + React Three Fiber
- **Data Fetching**: SWR for client-side state management
- **Port**: localhost:3000

### Backend
- **Framework**: Flask 3.1 (Python)
- **Authentication**: PyJWT 2.10.1
- **Security**: bcrypt 4.2.1
- **Database Driver**: mysql-connector-python 9.1.0
- **CORS**: flask-cors
- **Port**: localhost:5000

### Database
- **Engine**: MySQL 8.x
- **Port**: localhost:3306
- **Schema**: Relational with 4 main tables (users, folders, models, user_activity)

## 📋 Prerequisites

- Node.js 18.x or higher
- Python 3.8 or higher
- MySQL 8.x
- npm or yarn

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/3d-heritage-platform.git
cd 3d-heritage-platform
