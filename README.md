# 3D Cultural Heritage Visualization Platform

<div align="center">

![Cultural Heritage](https://img.shields.io/badge/Cultural-Heritage-8B4513?style=for-the-badge)
![Full Stack](https://img.shields.io/badge/Full%20Stack-Web%20App-0066cc?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge)

**An innovative web-based platform for digitizing, managing, and interactively visualizing 3D models of cultural artifacts.**

A comprehensive solution enabling researchers, curators, and students to upload, organize, and explore 3D cultural heritage artifacts through advanced WebGL-based visualization with real-time interaction capabilities.

[Features](#features) ✦ [Use Cases](#use-cases) ✦ [Installation](#installation) ✦ [Architecture](#architecture) ✦ [Contributing](#contributing) ✦ [License](#license)

</div>

---

## 🌟 Features

### Core Functionality

- **Multi-Format 3D Support**: Import OBJ, PLY, STL, GLB, and GLTF files seamlessly
- **Interactive 3D Viewer**: Smooth rotate, pan, zoom controls with GPU-accelerated WebGL rendering at 60 FPS
- **Face-Level Analysis**: Select and color individual mesh faces for detailed artifact examination
- **Exploded View**: Separate mesh faces from center point for comprehensive structural analysis
- **Automatic Model Normalization**: Intelligent centering and scaling for consistent visualization

### Management System

- **Secure Authentication**: JWT token-based auth with bcrypt password hashing (12-round cost factor)
- **Role-Based Access Control**: Admin, Researcher, Curator, and Student roles with granular permissions
- **Folder Organization**: Create and manage collections with hierarchical folder structures
- **Gallery Browser**: Discover and view artifacts uploaded by the research community
- **User Data Isolation**: Complete data privacy with user-specific access controls

### Technical Excellence

- **Responsive Design**: Mobile-first approach supporting all devices and screen sizes
- **Dark/Light Theme**: Toggle between visual themes for optimal viewing experience
- **Real-Time Search**: Filter models and folders with instantaneous results
- **Activity Logging**: Comprehensive audit trails for security and accountability
- **File Upload Validation**: Client and server-side validation with 100MB size limit per file

---

## 🎯 Use Cases

| Use Case | Description | Benefit |
|----------|-------------|---------|
| **Museum Virtual Exhibitions** | Create online exhibits accessible worldwide without physical constraints | Global audience access to irreplaceable artifacts |
| **Archaeological Documentation** | Record excavation findings in 3D for permanent digital preservation | Site documentation survives physical deterioration |
| **Academic Research** | Compare artifacts across institutions for collaborative scholarship | Researchers collaborate globally without travel |
| **Educational Programs** | Provide interactive learning materials for students to examine artifacts virtually | Hands-on learning without physical handling risks |
| **Conservation Planning** | Document artifact condition before/after restoration procedures | Track restoration progress and preservation efforts |
| **Cultural Heritage Preservation** | Safeguard endangered cultural artifacts through digital scanning | Digital backup against loss or damage |

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15 | React framework with SSR and optimization |
| **React** | 19 | UI library with hooks and server components |
| **TypeScript** | Latest | Type-safe development and early error detection |
| **Three.js** | 0.171.0 | WebGL 3D graphics rendering |
| **Tailwind CSS** | v4 | Utility-first CSS framework |
| **shadcn/ui** | Latest | Accessible component library |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Flask** | 3.1 | Python web framework |
| **PyJWT** | 2.10.1 | JWT authentication tokens |
| **bcrypt** | 4.2.1 | Secure password hashing |
| **mysql-connector-python** | 9.1.0 | MySQL database driver |

### Database
| Technology | Version | Purpose |
|------------|---------|---------|
| **MySQL** | 8.x | Relational database with ACID compliance |
| **InnoDB** | Built-in | ACID-compliant storage engine |

### Deployment Ready
- **Vercel**: Frontend deployment with automatic optimization
- **AWS/DigitalOcean**: Backend hosting with scalability
- **AWS S3**: Object storage for 3D models (production)
- **AWS RDS**: Managed database with automated backups

---

## 📋 Prerequisites

Before installation, ensure you have:

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 18.x+ | JavaScript runtime for frontend |
| **npm/yarn** | Latest | Package manager |
| **Python** | 3.8+ | Backend runtime |
| **MySQL** | 8.x | Database server |
| **Git** | Latest | Version control |

### Optional (for production)
- AWS Account (for S3 and RDS)
- Vercel Account (for frontend deployment)
- SSL Certificate (for HTTPS)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/3d-cultural-heritage-platform.git
cd 3d-cultural-heritage-platform
