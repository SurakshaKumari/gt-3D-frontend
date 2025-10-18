# 🚀 3D Platform

A real-time 3D model collaboration platform with annotations and chat functionality.

Technologies Used
Core Framework
React - UI library for building user interfaces

Three.js - 3D graphics library with animations

React Three Fiber - React renderer for Three.js

Styling & UI
Tailwind CSS - Utility-first CSS framework

Real-time Communication
Socket.io Client - Real-time bidirectional communication

API Communication
Fetch API - Modern browser API for HTTP requests

RESTful Integration - Connection with backend services

Routing & State Management
React Router DOM - Client-side routing

React Hooks - useState, useEffect for state management

Development Tools
PostCSS - CSS processing

Webpack - Module bundling (via Create React App)


Project Structure
text
src/
├── components/
│   ├── JSLog.js          # Logging component
│   ├── ProjectList.js    # Projects listing page
│   └── ProjectView.js    # 3D model viewer
├── App.js                # Main application component
├── App.css              # Application styles
├── index.js             # Application entry point
├── index.css            # Global styles
└── ... (other CRA files)


Dummy Login Details
Quick Login System
The application uses a simple name-based login system:

javascript
// Simply enter any name to login
Username: Any name of your choice
Storage: Name stored in localStorage as 'userName'




Default Test Users:
User79 - Regular collaborator
Any name - Quick access with custom username

Main Features Implemented
🔐 Simple Authentication
Name-based Login: Quick entry without complex credentials

Session Persistence: Username stored in localStorage

Automatic Routing: Redirect to projects page after login

📋 Project Management
Project List: Browse all available 3D projects

Project View: Individual project viewing and interaction

Navigation: Seamless routing between pages

🎯 3D Model Viewer
Three.js Integration: High-performance 3D rendering

Model Loading: STL file visualization

Animation Support: Three.js animation capabilities

Axes Helper: 3D coordinate system visualization (development)

💬 Real-time Collaboration
Socket.io Integration: Live updates and chat functionality

Multi-user Support: Concurrent model viewing

Live Synchronization: Real-time model state updates

🔄 API Integration
Fetch API: HTTP requests to backend services

RESTful Communication: CRUD operations for projects

Error Handling: Network request management

🎨 Modern UI/UX
Tailwind CSS: Responsive and utility-first styling



Attached Screens:

login screen:
<img width="847" height="453" alt="image" src="https://github.com/user-attachments/assets/83cc9e36-7057-4395-a952-3cf641705670" />



Project lists Screen :
<img width="1194" height="634" alt="image" src="https://github.com/user-attachments/assets/52e4396d-68f7-42df-a1e6-e9e7f216e1d1" />


view project screen:

<img width="1342" height="635" alt="image" src="https://github.com/user-attachments/assets/9a5272d2-0e75-4032-bee9-696edc8041dc" />









