# 3D Collaboration Frontend

React app with Three.js (via @react-three/fiber) for collaborative 3D projects: dummy login, projects CRUD, STL upload/visualization, viewport controls, transform tools, annotations, real-time chat and camera sync, theme toggle, and persistence.

## Demo Users (Dummy Login)
- Enter any name on the login screen (e.g., "Alice", "Bob"). No password required.

## Features Implemented
- Dummy login with localStorage
- Create/list/delete projects
- Shareable project link `/project/:id`
- 3D viewport (pan/zoom/rotate) with OrbitControls
- TransformControls for move/rotate/scale
- STL upload (fallback primitives: box/sphere/cone)
- Click-to-add annotations (stored with position, text, user)
- Save and restore scene (model transform + annotations)
- Real-time chat (Socket.IO) and camera sync
- Camera focus on annotation click
- Responsive UI + Dark/Light theme toggle

## Tech Stack
- React 18, React Router
- Three.js via @react-three/fiber and @react-three/drei
- Socket.IO client
- TailwindCSS classes (pre-configured)

## Setup
1) Install dependencies:
```
npm install
```
2) Create `.env` (optional, for custom backends):
```
REACT_APP_API_BASE=https://gt-3-d-backend.vercel.app/
REACT_APP_SOCKET_URL=https://gt-3-d-backend.vercel.app/
REACT_APP_FILE_API_BASE=https://gt-3-d-backend.vercel.app/
REACT_APP_DEFAULT_THEME=dark
```
3) Start dev server:
```
npm start
```
Open `http://localhost:3000`.

## Backend Assumptions
The default API base points to an existing backend for projects and scene data. File upload and Socket.IO default to `http://localhost:5000`. Endpoints used:
- `GET  {API_BASE}/api/projects`
- `POST {API_BASE}/api/projects`
- `DELETE {API_BASE}/api/projects/:id`
- `GET  {API_BASE}/api/projects/:id`
- `PUT  {API_BASE}/api/projects/:id/scene`
- `POST {API_BASE}/api/projects/:id/annotation`
- `POST {API_BASE}/api/projects/:id/chat` (optional, non-blocking)
- `POST {FILE_API_BASE}/api/projects/:id/model` (multipart .stl)
- `GET  {FILE_API_BASE}/api/projects/:id/model` (ArrayBuffer)

WebSocket events:
- Emit `joinProject`, `chatMessage`, `annotationAdded`, `cameraUpdate`
- Receive `newChatMessage`, `newAnnotation`, `cameraSync`, `userJoined`, `userLeft`

## Notes
- STEP is not natively supported; if unavailable, pick a primitive. STL is supported.
- Camera sync now applies incoming updates to all clients.
- Chat persistence call is best-effort; if backend lacks the endpoint, UI still works.

## Scripts
- `npm start` - run dev server
- `npm run build` - production build

