// Centralized frontend configuration
// Uses environment variables with safe defaults.
// Adjust REACT_APP_API_BASE and REACT_APP_SOCKET_URL for your backend deployment.

export const API_BASE =
	process.env.REACT_APP_API_BASE || 'https://gt-3-d-backend.vercel.app/';

export const SOCKET_URL =
	process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const FILE_API_BASE =
	process.env.REACT_APP_FILE_API_BASE || SOCKET_URL;

export const APP_DEFAULT_THEME =
	process.env.REACT_APP_DEFAULT_THEME || 'dark';


