// Centralized frontend configuration
// Uses environment variables with safe defaults.

// Backend API base URL (for REST API calls)
export const API_BASE =
  process.env.REACT_APP_API_BASE || 'https://gt-3d-backend-23qd.onrender.com';

// Socket.IO server URL
export const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL || 'https://gt-3d-backend-23qd.onrender.com';

// File API base URL
export const FILE_API_BASE =
  process.env.REACT_APP_FILE_API_BASE || API_BASE;

// App theme
export const APP_DEFAULT_THEME =
  process.env.REACT_APP_DEFAULT_THEME || 'dark';

// Socket.IO connection options
export const SOCKET_OPTIONS = {
  transports: ['websocket', 'polling'],
  withCredentials: true,
  timeout: 10000,
  forceNew: true
};

// Log configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Frontend Configuration:', {
    API_BASE,
    SOCKET_URL,
    FILE_API_BASE,
    APP_DEFAULT_THEME
  });
}